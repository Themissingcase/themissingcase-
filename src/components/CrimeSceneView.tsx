import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  FolderSearch,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CaseDefinition,
  CaseSaveState,
  ClueId,
  GameDifficulty,
  HiddenObjectClue,
  LightingZone,
} from '../types/game';
import { CASE_001_COORDINATE_MANIFEST } from '../data/coordinateManifest';
import { computeInvestigationProgress } from '../engine/mysteryEngine';
import { formatDuration, normalizeDifficulty } from '../services/persistenceService';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface CrimeSceneViewProps {
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  onDiscoverClue: (clueId: ClueId) => void;
  onRecordMisTap: () => void;
  onUseHint: (clueId: ClueId, nextLevel: 1 | 2 | 3) => void;
  onInspectClue: (clue: HiddenObjectClue) => void;
  onChangeDifficulty: (difficulty: GameDifficulty) => void;
  onDismissBriefing: () => void;
  onBackToLibrary: () => void;
  onOpenEvidence: () => void;
  onOpenNotebook: () => void;
  onOpenBoard: () => void;
  onOpenSuspects: () => void;
}

const CASE_001_SUBTLE_HINTS: Partial<Record<ClueId, string>> = {
  broken_wine_glass:
    'Candlelight glints faintly among the crystal stemware near the center of the dining table.',
  torn_photograph:
    'Above the mantelpiece candles, something weathered peeks from behind an ornate gilt corner.',
  golden_key:
    'Along the left wall’s mahogany shelves, tarnished brass blends among gilt-tooled leather bindings.',
  stopped_wristwatch:
    'Near the lower-left border of the Persian rug, something metallic rests in the chair-leg shadow.',
  burnt_letter:
    'Beside the glowing fireplace grate, curled ash-darkened paper rests against the black slate hearth.',
  muddy_shoeprint:
    'Cold moonlight through the tall right-hand doors reveals a damp scuff across the oak planks.',
  missing_dinner_knife:
    'Along the carved mahogany sideboard on the right wall, tarnished silver peeks from under a serving tray.',
  red_silk_thread:
    'On the closest carved dining chair in the foreground, a fine dark fiber clings to the woodwork.',
};

const DIFFICULTY_OPTIONS: {
  id: GameDifficulty;
  shortLabel: string;
  title: string;
  summary: string;
}[] = [
  {
    id: 'EASY',
    shortLabel: 'Easy',
    title: 'Easy · Guided Eye',
    summary: 'Objects are reasonably visible while naturally painted into the scene (9 Hints).',
  },
  {
    id: 'MEDIUM',
    shortLabel: 'Medium',
    title: 'Medium · Natural Blend',
    summary: 'Objects blend into local lighting, wood grain, and partial furniture edges (6 Hints).',
  },
  {
    id: 'HARD',
    shortLabel: 'Hard',
    title: 'Hard · Master Camouflage',
    summary: 'Deep shadow camouflage and partial obstruction behind scene props (3 Hints).',
  },
];

function computeClueLightingFilter(lZone: LightingZone, difficulty: GameDifficulty): string {
  const diffLight =
    difficulty === 'EASY' ? 1.06 : difficulty === 'HARD' ? 0.76 : 0.88;
  const satScale =
    difficulty === 'EASY' ? 0.94 : difficulty === 'HARD' ? 0.78 : 0.85;

  if (lZone === 'MOONLIGHT_COLD') {
    return `brightness(${(0.84 * diffLight).toFixed(2)}) saturate(${(0.82 * satScale).toFixed(2)}) contrast(1.03)`;
  }
  if (lZone === 'HEARTH_EMBER') {
    return `brightness(${(0.88 * diffLight).toFixed(2)}) sepia(0.16) saturate(${(0.88 * satScale).toFixed(2)}) contrast(1.04)`;
  }
  if (lZone === 'MAHOGANY_SHADOW') {
    return `brightness(${(0.76 * diffLight).toFixed(2)}) saturate(${(0.84 * satScale).toFixed(2)}) contrast(1.06)`;
  }
  return `brightness(${(0.86 * diffLight).toFixed(2)}) saturate(${(0.88 * satScale).toFixed(2)}) contrast(1.03)`;
}

export const CrimeSceneView: React.FC<CrimeSceneViewProps> = ({
  caseDef,
  saveState,
  onDiscoverClue,
  onRecordMisTap,
  onUseHint,
  onInspectClue,
  onChangeDifficulty,
  onDismissBriefing,
  onBackToLibrary,
  onOpenEvidence,
  onOpenNotebook,
  onOpenBoard,
  onOpenSuspects,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [viewportSize, setViewportSize] = useState({ width: 960, height: 540 });
  const [isLandscapeLayout, setIsLandscapeLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 || window.innerWidth > window.innerHeight : true
  );

  const [checklistOpen, setChecklistOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSmoothCamera, setIsSmoothCamera] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Magnifying Glass Inspection Mode
  const [magnifierEnabled, setMagnifierEnabled] = useState(false);
  const [loupeCoords, setLoupeCoords] = useState<{ normX: number; normY: number } | null>(null);

  // 3-Level Smart Hint State
  const [activeHintState, setActiveHintState] = useState<{
    clueId: ClueId;
    level: 1 | 2 | 3;
  } | null>(null);

  const [recentDiscovery, setRecentDiscovery] = useState<{
    clue: HiddenObjectClue;
    sparkleActive: boolean;
  } | null>(null);
  const [missRipple, setMissRipple] = useState<{ x: number; y: number; key: number } | null>(null);

  // Reset camera & local overlays when switching between cases or starting a replay
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSceneLoaded(false);
    setImgError(false);
    setActiveHintState(null);
    setRecentDiscovery(null);
    setMagnifierEnabled(false);
    setLoupeCoords(null);
  }, [caseDef.id, saveState.startedAt]);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
    maxTravel: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    originPanX: 0,
    originPanY: 0,
    maxTravel: 0,
  });

  const pinchRef = useRef<{
    active: boolean;
    initialDist: number;
    initialZoom: number;
    midX: number;
    midY: number;
    originPanX: number;
    originPanY: number;
  }>({
    active: false,
    initialDist: 1,
    initialZoom: 1,
    midX: 0,
    midY: 0,
    originPanX: 0,
    originPanY: 0,
  });

  const tapTimerRef = useRef<number | null>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; clientX: number; clientY: number }>({
    time: 0,
    clientX: 0,
    clientY: 0,
  });

  useEffect(() => {
    const updateOrientation = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsLandscapeLayout(w >= 960 || (w > h && w >= 600));
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };
    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checklistOpen, isLandscapeLayout]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const blockNativeScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    el.addEventListener('touchmove', blockNativeScroll, { passive: false });
    return () => el.removeEventListener('touchmove', blockNativeScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  const stageMetrics = useMemo(() => {
    const { width: vw, height: vh } = viewportSize;
    const aspect = 16 / 9;
    let stageW = vw;
    let stageH = vw / aspect;
    if (stageH > vh) {
      stageH = vh;
      stageW = vh * aspect;
    }
    return { stageW, stageH };
  }, [viewportSize]);

  const clampPan = useCallback(
    (nextX: number, nextY: number, nextZoom: number) => {
      if (nextZoom <= 1.01) return { x: 0, y: 0 };
      const maxX = Math.max(0, (stageMetrics.stageW * nextZoom - viewportSize.width) / 2 + 24);
      const maxY = Math.max(0, (stageMetrics.stageH * nextZoom - viewportSize.height) / 2 + 24);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [stageMetrics, viewportSize]
  );

  useEffect(() => {
    setPan((prev) => clampPan(prev.x, prev.y, zoom));
  }, [clampPan, zoom]);

  const resetCamera = useCallback(() => {
    setIsSmoothCamera(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomToNormalizedPoint = useCallback(
    (normX: number, normY: number, targetZoom = 2.35) => {
      const clampedZoom = Math.max(1, Math.min(3.6, targetZoom));
      const desiredPanX = (0.5 - normX) * stageMetrics.stageW * clampedZoom;
      const desiredPanY = (0.5 - normY) * stageMetrics.stageH * clampedZoom;
      setIsSmoothCamera(true);
      setZoom(clampedZoom);
      setPan(clampPan(desiredPanX, desiredPanY, clampedZoom));
    },
    [clampPan, stageMetrics]
  );

  const stepZoom = useCallback(
    (delta: number) => {
      const next = Math.max(1, Math.min(3.6, Number((zoom + delta).toFixed(2))));
      setIsSmoothCamera(true);
      setZoom(next);
      setPan((prev) => clampPan(prev.x, prev.y, next));
    },
    [clampPan, zoom]
  );

  useEffect(() => {
    if (activeHintState && saveState.discoveredClues.includes(activeHintState.clueId)) {
      setActiveHintState(null);
    }
  }, [activeHintState, saveState.discoveredClues]);

  const discoveredSet = useMemo(
    () => new Set(saveState.discoveredClues),
    [saveState.discoveredClues]
  );

  const discoveredCount = saveState.discoveredClues.length;
  const totalClues = caseDef.clues.length;
  const remainingCount = Math.max(0, totalClues - discoveredCount);
  const progressPercent = computeInvestigationProgress(caseDef, saveState);

  const activeDifficulty: GameDifficulty = normalizeDifficulty(saveState.difficulty);

  const maxEyeCharges =
    activeDifficulty === 'EASY'
      ? 9
      : activeDifficulty === 'HARD'
      ? 3
      : Math.max(6, caseDef.maxHints + 2);
  const availableHints = Math.max(0, maxEyeCharges - saveState.hintsUsed);
  const isCameraAdjusted = zoom > 1.02 || Math.abs(pan.x) > 2 || Math.abs(pan.y) > 2;

  const activeHintClue = useMemo(
    () =>
      activeHintState
        ? caseDef.clues.find((c) => c.id === activeHintState.clueId) || null
        : null,
    [activeHintState, caseDef.clues]
  );

  // Next hint tier preview for the button label
  const nextHintPreview = useMemo(() => {
    const unfound = caseDef.clues.filter((c) => !discoveredSet.has(c.id));
    if (unfound.length === 0) return null;
    const target =
      activeHintState && !discoveredSet.has(activeHintState.clueId)
        ? unfound.find((c) => c.id === activeHintState.clueId) || unfound[0]
        : unfound[0];
    const prevTier = saveState.hintLevelsByClue?.[target.id] || 0;
    const nextTier = Math.min(3, prevTier + 1) as 1 | 2 | 3;
    return { target, nextTier };
  }, [activeHintState, caseDef.clues, discoveredSet, saveState.hintLevelsByClue]);

  const handleTriggerHint = () => {
    if (availableHints <= 0 || !nextHintPreview) return;
    const { target, nextTier } = nextHintPreview;
    onUseHint(target.id, nextTier);
    setActiveHintState({ clueId: target.id, level: nextTier });
    if (nextTier === 3) {
      zoomToNormalizedPoint(target.x, target.y, Math.max(zoom, 1.7));
    }
  };

  const triggerDiscovery = (clue: HiddenObjectClue) => {
    if (discoveredSet.has(clue.id)) return;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    onDiscoverClue(clue.id);
    setRecentDiscovery({ clue, sparkleActive: true });
    window.setTimeout(() => {
      setRecentDiscovery((prev) =>
        prev && prev.clue.id === clue.id ? { ...prev, sparkleActive: false } : prev
      );
    }, 620);
  };

  const getNormalizedCoordsFromClient = (clientX: number, clientY: number) => {
    const stageEl = stageRef.current;
    if (!stageEl) return { x: 0.5, y: 0.5 };
    const rect = stageEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0.5, y: 0.5 };
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  // Subtle loupe bezel feedback only on EASY mode (no radar giveaway on MEDIUM or HARD)
  const isLoupeNearUnfoundClue = useMemo(() => {
    if (activeDifficulty !== 'EASY' || !magnifierEnabled || !loupeCoords) return false;
    return caseDef.clues.some((c) => {
      if (discoveredSet.has(c.id)) return false;
      const manifest = (
        CASE_001_COORDINATE_MANIFEST as Partial<
          Record<ClueId, (typeof CASE_001_COORDINATE_MANIFEST)['broken_wine_glass']>
        >
      )[c.id];
      const cx = manifest ? manifest.x : c.x;
      const cy = manifest ? manifest.y : c.y;
      const dist = Math.hypot(cx - loupeCoords.normX, cy - loupeCoords.normY);
      return dist < 0.065;
    });
  }, [activeDifficulty, caseDef.clues, discoveredSet, loupeCoords, magnifierEnabled]);

  const handleSceneBackgroundTap = (clientX: number, clientY: number) => {
    const now = Date.now();
    const dt = now - lastTapRef.current.time;
    const dist = Math.hypot(
      clientX - lastTapRef.current.clientX,
      clientY - lastTapRef.current.clientY
    );

    if (dt < 320 && dist < 36) {
      if (tapTimerRef.current) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      lastTapRef.current = { time: 0, clientX: 0, clientY: 0 };

      if (zoom > 1.08) {
        resetCamera();
      } else {
        const norm = getNormalizedCoordsFromClient(clientX, clientY);
        zoomToNormalizedPoint(norm.x, norm.y, 2.35);
      }
      return;
    }

    lastTapRef.current = { time: now, clientX, clientY };
    const norm = getNormalizedCoordsFromClient(clientX, clientY);

    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => {
      onRecordMisTap();
      setMissRipple({ x: norm.x, y: norm.y, key: Date.now() });
      tapTimerRef.current = null;
    }, 240);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (e.button !== 0) return;
    setIsSmoothCamera(false);
    const norm = getNormalizedCoordsFromClient(e.clientX, e.clientY);
    if (magnifierEnabled) {
      setLoupeCoords({ normX: norm.x, normY: norm.y });
    }
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: pan.x,
      originPanY: pan.y,
      maxTravel: 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (magnifierEnabled) {
      const norm = getNormalizedCoordsFromClient(e.clientX, e.clientY);
      setLoupeCoords({ normX: norm.x, normY: norm.y });
    }
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const travel = Math.hypot(dx, dy);
    dragRef.current.maxTravel = Math.max(dragRef.current.maxTravel, travel);

    if (zoom > 1.01 && travel > 5) {
      setPan(clampPan(dragRef.current.originPanX + dx, dragRef.current.originPanY + dy, zoom));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (!dragRef.current.active) return;
    const wasTap = dragRef.current.maxTravel <= 8;
    dragRef.current.active = false;

    if (wasTap && !(e.target as HTMLElement).closest('[data-clue-hitbox="true"]')) {
      handleSceneBackgroundTap(e.clientX, e.clientY);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.24 : -0.24;
    const nextZoom = Math.max(1, Math.min(3.6, Number((zoom + delta).toFixed(2))));
    setIsSmoothCamera(false);
    setZoom(nextZoom);
    setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    if (e.touches.length === 2) {
      setIsSmoothCamera(false);
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      pinchRef.current = {
        active: true,
        initialDist: Math.max(1, dist),
        initialZoom: zoom,
        midX: (t0.clientX + t1.clientX) / 2,
        midY: (t0.clientY + t1.clientY) / 2,
        originPanX: pan.x,
        originPanY: pan.y,
      };
      dragRef.current.active = false;
      dragRef.current.maxTravel = 999;
    } else if (e.touches.length === 1 && !pinchRef.current.active) {
      setIsSmoothCamera(false);
      if (magnifierEnabled) {
        const norm = getNormalizedCoordsFromClient(e.touches[0].clientX, e.touches[0].clientY);
        setLoupeCoords({ normX: norm.x, normY: norm.y });
      }
      dragRef.current = {
        active: true,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originPanX: pan.x,
        originPanY: pan.y,
        maxTravel: 0,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    if (e.touches.length === 2 && pinchRef.current.active) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const curMidX = (t0.clientX + t1.clientX) / 2;
      const curMidY = (t0.clientY + t1.clientY) / 2;

      const nextZoom = Math.max(
        1,
        Math.min(3.6, pinchRef.current.initialZoom * (dist / pinchRef.current.initialDist))
      );
      const midDeltaX = curMidX - pinchRef.current.midX;
      const midDeltaY = curMidY - pinchRef.current.midY;

      setZoom(nextZoom);
      setPan(
        clampPan(
          pinchRef.current.originPanX + midDeltaX,
          pinchRef.current.originPanY + midDeltaY,
          nextZoom
        )
      );
      dragRef.current.maxTravel = 999;
    } else if (e.touches.length === 1 && dragRef.current.active && !pinchRef.current.active) {
      if (magnifierEnabled) {
        const norm = getNormalizedCoordsFromClient(e.touches[0].clientX, e.touches[0].clientY);
        setLoupeCoords({ normX: norm.x, normY: norm.y });
      }
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      const travel = Math.hypot(dx, dy);
      dragRef.current.maxTravel = Math.max(dragRef.current.maxTravel, travel);

      if (zoom > 1.01 && travel > 6 && !magnifierEnabled) {
        setPan(clampPan(dragRef.current.originPanX + dx, dragRef.current.originPanY + dy, zoom));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    if (e.touches.length === 0) {
      const wasCleanSingleTap =
        dragRef.current.active && !pinchRef.current.active && dragRef.current.maxTravel <= 9;
      const changed = e.changedTouches[0];

      pinchRef.current.active = false;
      dragRef.current.active = false;

      if (
        wasCleanSingleTap &&
        changed &&
        !(e.target as HTMLElement).closest('[data-clue-hitbox="true"]')
      ) {
        handleSceneBackgroundTap(changed.clientX, changed.clientY);
      }
    }
  };

  const hintMessage = useMemo(() => {
    if (!activeHintClue || !activeHintState) return '';
    if (activeHintState.level === 1) {
      return (
        activeHintClue.subtleLocationHint ||
        CASE_001_SUBTLE_HINTS[activeHintClue.id] ||
        `Search carefully around the ${activeHintClue.quadrantLabel.toLowerCase()} area.`
      );
    }
    if (activeHintState.level === 2) {
      return `${activeHintClue.quadrantLabel}: ${activeHintClue.shortHint}`;
    }
    return `Location highlighted (${activeHintClue.quadrantLabel}): ${activeHintClue.shortHint}`;
  }, [activeHintClue, activeHintState]);

  const weather = caseDef.weatherEffect || 'RAIN_MOONLIGHT';

  return (
    <div className="h-[calc(100dvh-106px)] md:h-[calc(100dvh-52px)] w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 py-2 flex flex-col gap-2 overflow-hidden select-none">
      {/* PREMIUM ADAPTIVE HEADS-UP DISPLAY */}
      <section
        aria-label="Investigation Heads-Up Display"
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 bg-[#151311] border border-[#C5A059]/25 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      >
        {/* Left: Back to Library, Case Title, Discovered, Remaining, Elapsed Time */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          <button
            type="button"
            onClick={onBackToLibrary}
            title="Return to Case Library (Progress Saved)"
            className="inline-flex items-center gap-1 text-[#D9B878] hover:text-[#F4EFE6] font-medium cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cases</span>
          </button>
          <span className="text-[#8E8477]" aria-hidden="true">·</span>
          <span className="font-display font-semibold text-[#F4EFE6] text-xs sm:text-sm whitespace-nowrap">
            {caseDef.code}: {caseDef.title}
          </span>
          {saveState.isReplaySession && (
            <>
              <span className="text-[#8E8477]" aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-[#C5A059] whitespace-nowrap">
                REPLAY
              </span>
            </>
          )}
          <span className="text-[#8E8477]" aria-hidden="true">·</span>
          <span className="font-mono text-[#D9B878] tabular-nums whitespace-nowrap">
            Found {discoveredCount}/{totalClues}
          </span>
          <span className="text-[#8E8477]" aria-hidden="true">·</span>
          <span className="font-mono text-[#C8BFB0] tabular-nums whitespace-nowrap">
            {remainingCount} Left
          </span>
          <span className="text-[#8E8477]" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-mono text-[#C8BFB0] tabular-nums whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
            {formatDuration(saveState.elapsedSeconds)}
          </span>
        </div>

        {/* Center: Compact Progress Indicator */}
        <div className="hidden xl:flex items-center gap-2.5 min-w-[140px] max-w-[200px] flex-1">
          <div className="flex-1 h-1.5 rounded-full bg-[#26221E] overflow-hidden">
            <div
              className="h-full bg-[#C5A059] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#D9B878] tabular-nums whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>

        {/* Right: Difficulty Mode, Smart 3-Level Hint, Magnifier Loupe, Zoom Cluster, Notebook & Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          {/* Live 3-Tier Difficulty Selector (Easy / Medium / Hard) */}
          <div
            role="group"
            aria-label="Hidden-object difficulty"
            className="flex items-center bg-[#1C1916] border border-[#8C6D46]/30 rounded-lg p-0.5 shrink-0"
          >
            {DIFFICULTY_OPTIONS.map((opt) => {
              const selected = activeDifficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeDifficulty(opt.id)}
                  title={opt.summary}
                  className={`min-h-[30px] px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-[#C5A059] text-[#0D0C0B] font-semibold'
                      : 'text-[#C8BFB0] hover:text-[#F4EFE6]'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* 3-Level Progressive Smart Hint (Detective's Eye) */}
          <button
            type="button"
            onClick={handleTriggerHint}
            disabled={remainingCount === 0 || availableHints <= 0}
            title="3-Level Smart Hint: Level 1 subtle clue, Level 2 directional hint, Level 3 approximate highlight (-15 precision bonus)"
            className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#221D16] hover:bg-[#2E271D] disabled:opacity-40 border border-[#C5A059]/45 text-xs font-semibold text-[#D9B878] flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono tabular-nums">
              {nextHintPreview
                ? `Hint L${nextHintPreview.nextTier} (${availableHints})`
                : `Hints (${availableHints})`}
            </span>
          </button>

          {/* Magnifying Glass Inspection Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setMagnifierEnabled((v) => {
                const next = !v;
                if (next && !loupeCoords) {
                  setLoupeCoords({ normX: 0.5, normY: 0.5 });
                }
                return next;
              });
            }}
            title="Toggle Magnifying Glass Inspection Loupe"
            className={`min-h-[38px] px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              magnifierEnabled
                ? 'bg-[#C5A059] border-[#D9B878] text-[#0D0C0B] font-semibold'
                : 'bg-[#1C1916] hover:bg-[#28231E] border-[#8C6D46]/30 text-[#F4EFE6]'
            }`}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Magnifier</span>
          </button>

          {/* Visible Reset Camera + Zoom Cluster */}
          <div className="flex items-center bg-[#1C1916] border border-[#8C6D46]/30 rounded-lg px-0.5 shrink-0">
            <button
              type="button"
              onClick={() => stepZoom(-0.4)}
              aria-label="Zoom Out"
              className="min-h-[36px] min-w-[34px] flex items-center justify-center text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] font-mono text-[#F4EFE6] tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => stepZoom(0.4)}
              aria-label="Zoom In"
              className="min-h-[36px] min-w-[34px] flex items-center justify-center text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetCamera}
              disabled={!isCameraAdjusted}
              title="Reset Camera"
              className={`min-h-[36px] px-2 rounded-md text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                isCameraAdjusted
                  ? 'text-[#D9B878] hover:bg-[#2A241E]'
                  : 'text-[#8E8477]/50 cursor-default'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Quick-Access Investigation Shortcuts */}
          <button
            type="button"
            onClick={onOpenNotebook}
            title="Detective Notebook"
            className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C1916] hover:bg-[#28231E] border border-[#8C6D46]/30 text-xs font-medium text-[#F4EFE6] flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">Notebook</span>
          </button>

          <button
            type="button"
            onClick={onOpenEvidence}
            title="Evidence Satchel"
            className="hidden sm:flex min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C1916] hover:bg-[#28231E] border border-[#8C6D46]/30 text-xs font-medium text-[#F4EFE6] items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderSearch className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Evidence</span>
          </button>

          <button
            type="button"
            onClick={onOpenBoard}
            title="Investigation Board"
            className="hidden sm:flex min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C1916] hover:bg-[#28231E] border border-[#8C6D46]/30 text-xs font-medium text-[#F4EFE6] items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Network className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Board</span>
          </button>

          <button
            type="button"
            onClick={onOpenSuspects}
            title="Interrogate Suspects"
            className="hidden sm:flex min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C1916] hover:bg-[#28231E] border border-[#8C6D46]/30 text-xs font-medium text-[#F4EFE6] items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Suspects</span>
          </button>

          {isLandscapeLayout && (
            <button
              type="button"
              onClick={() => setChecklistOpen((o) => !o)}
              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C1916] hover:bg-[#28231E] border border-[#C5A059]/30 text-xs font-medium text-[#D9B878] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{checklistOpen ? 'Hide List' : 'Clue List'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  checklistOpen ? '' : 'rotate-180'
                }`}
              />
            </button>
          )}
        </div>
      </section>

      {/* Active 3-Level Smart Hint Banner or Recent Discovery Strip */}
      {(activeHintClue || recentDiscovery) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 bg-[#1B1712] border border-[#C5A059]/45 rounded-xl px-3.5 py-1.5 flex items-center justify-between gap-3 text-xs"
        >
          {recentDiscovery ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                <span className="truncate text-[#F4EFE6]">
                  Discovered{' '}
                  <strong className="font-display text-[#D9B878]">
                    {recentDiscovery.clue.name}
                  </strong>
                  {' — '}
                  {recentDiscovery.clue.unexpectedDiscoveryNote ||
                    recentDiscovery.clue.locationFound}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onInspectClue(recentDiscovery.clue)}
                  className="min-h-[32px] px-3 py-1 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecentDiscovery(null)}
                  className="text-[#8E8477] hover:text-[#F4EFE6] px-1.5 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </>
          ) : activeHintClue && activeHintState ? (
            <>
              <div className="flex items-center gap-2 min-w-0 text-[#F4EFE6]">
                <Eye className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                <span className="truncate">
                  <strong className="text-[#D9B878]">
                    Smart Hint Level {activeHintState.level}/3:
                  </strong>{' '}
                  {hintMessage}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeHintState.level < 3 && availableHints > 0 && (
                  <button
                    type="button"
                    onClick={handleTriggerHint}
                    className="min-h-[28px] px-2.5 py-0.5 rounded-md bg-[#2A2218] hover:bg-[#382D1F] border border-[#C5A059]/40 text-[#D9B878] font-medium cursor-pointer whitespace-nowrap"
                  >
                    Level {activeHintState.level + 1} Hint
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveHintState(null)}
                  className="text-[#C8BFB0] hover:text-[#F4EFE6] px-2 py-1 cursor-pointer shrink-0"
                >
                  Clear
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ADAPTIVE WORKSPACE */}
      <div
        className={`flex-1 min-h-0 flex ${
          isLandscapeLayout ? 'flex-row' : 'flex-col'
        } gap-2.5 overflow-hidden`}
      >
        {/* Interactive Hand-Painted Crime Scene Viewport */}
        <div
          ref={viewportRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            dragRef.current.active = false;
            if (magnifierEnabled) setLoupeCoords(null);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 min-h-0 min-w-0 rounded-2xl overflow-hidden bg-[#090807] border border-[#C5A059]/30 flex items-center justify-center touch-none ${
            magnifierEnabled
              ? 'cursor-none'
              : zoom > 1.01
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-crosshair'
          }`}
        >
          {/* Aspect-Locked 16:9 Stage */}
          <div
            ref={stageRef}
            style={{
              width: `${stageMetrics.stageW}px`,
              height: `${stageMetrics.stageH}px`,
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className={`relative shrink-0 ${
              isSmoothCamera ? 'transition-transform duration-200 ease-out' : ''
            }`}
          >
            {!imgError ? (
              <>
                {!sceneLoaded && (
                  <div className="absolute inset-0 bg-[#12100E] flex items-center justify-center text-xs font-mono text-[#C5A059]">
                    Preparing {caseDef.location}...
                  </div>
                )}
                <img
                  src={caseDef.sceneImageUrl}
                  alt={`Hand-painted crime scene: ${caseDef.location}`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onLoad={() => setSceneLoaded(true)}
                  onError={() => setImgError(true)}
                  className={`w-full h-full object-contain pointer-events-none select-none transition-opacity duration-500 ${
                    sceneLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#1E1915] via-[#14110E] to-[#0B0908] flex flex-col items-center justify-center gap-2 text-sm text-[#C8BFB0] p-4 text-center">
                <span className="font-display text-lg text-[#D9B878]">{caseDef.location}</span>
                <span className="text-xs text-[#8E8477]">
                  Scene backdrop unavailable — interactive clue coordinates remain active below.
                </span>
              </div>
            )}

            {/* Case-Specific Atmospheric Lighting & Weather Overlays */}
            {weather === 'RAIN_MOONLIGHT' && (
              <>
                <div className="pointer-events-none absolute left-[8%] top-[36%] w-[36%] h-[42%] rounded-full bg-radial from-[#D9B878]/16 via-transparent to-transparent blur-xl animate-candle-flicker" />
                <div className="pointer-events-none absolute right-[4%] top-[12%] w-[30%] h-[72%] bg-gradient-to-bl from-[#9BB8DC]/12 via-transparent to-transparent animate-moonlight-drift" />
              </>
            )}
            {weather === 'BLIZZARD_TRAIN' && (
              <>
                <div className="pointer-events-none absolute right-[12%] top-[8%] w-[40%] h-[50%] bg-gradient-to-bl from-[#C4DCF5]/16 via-transparent to-transparent animate-moonlight-drift" />
                <div className="pointer-events-none absolute left-[12%] top-[35%] w-[38%] h-[45%] rounded-full bg-radial from-[#E2B771]/16 via-transparent to-transparent blur-xl animate-candle-flicker" />
              </>
            )}
            {weather === 'SKYLIGHT_STORM' && (
              <>
                <div className="pointer-events-none absolute left-[30%] top-[2%] w-[40%] h-[55%] bg-gradient-to-b from-[#9EC2EA]/18 via-transparent to-transparent animate-moonlight-drift" />
                <div className="pointer-events-none absolute left-[35%] bottom-[14%] w-[30%] h-[36%] rounded-full bg-radial from-[#D9B878]/16 via-transparent to-transparent blur-xl animate-candle-flicker" />
              </>
            )}
            {weather === 'CHANDELIER_GALA' && (
              <>
                <div className="pointer-events-none absolute left-[24%] top-[4%] w-[52%] h-[48%] rounded-full bg-radial from-[#F0CF8E]/18 via-transparent to-transparent blur-2xl animate-candle-flicker" />
                <div className="pointer-events-none absolute right-[6%] top-[18%] w-[26%] h-[60%] bg-gradient-to-l from-[#A8C4E8]/10 via-transparent to-transparent animate-moonlight-drift" />
              </>
            )}
            {weather === 'THAMES_FOG' && (
              <>
                <div className="pointer-events-none absolute right-[4%] top-[10%] w-[38%] h-[65%] bg-gradient-to-bl from-[#9CC0B8]/14 via-transparent to-transparent blur-lg animate-moonlight-drift" />
                <div className="pointer-events-none absolute left-[4%] bottom-[22%] w-[28%] h-[42%] rounded-full bg-radial from-[#E09A5C]/18 via-transparent to-transparent blur-xl animate-candle-flicker" />
              </>
            )}

            {/* Subtle Miss-Tap Ripple */}
            {missRipple && (
              <span
                key={missRipple.key}
                style={{
                  left: `${missRipple.x * 100}%`,
                  top: `${missRipple.y * 100}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-[#F4EFE6]/35 opacity-0 animate-ping"
              />
            )}

            {/* Smart Hint Level 3: Subtle Approximate Golden Perception Shimmer */}
            {activeHintClue &&
              activeHintState?.level === 3 &&
              !discoveredSet.has(activeHintClue.id) && (
                <div
                  style={{
                    left: `${Math.max(0.08, Math.min(0.92, activeHintClue.x + (activeHintClue.x > 0.5 ? -0.018 : 0.018))) * 100}%`,
                    top: `${Math.max(0.12, Math.min(0.88, activeHintClue.y - 0.014)) * 100}%`,
                    width:
                      activeDifficulty === 'HARD'
                        ? '22%'
                        : activeDifficulty === 'EASY'
                        ? '12%'
                        : '16%',
                    height:
                      activeDifficulty === 'HARD'
                        ? '33%'
                        : activeDifficulty === 'EASY'
                        ? '19%'
                        : '25%',
                  }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D9B878]/50 bg-radial from-[#D9B878]/20 via-[#C5A059]/8 to-transparent shadow-[0_0_26px_rgba(217,184,120,0.28)] animate-detectives-eye"
                />
              )}

            {/* Concealed Physical Objects — Realistic Visual Scale Decoupled from Fair Hitbox */}
            {caseDef.clues.map((clue) => {
              const isFound = discoveredSet.has(clue.id);
              const isSparkling =
                recentDiscovery?.clue.id === clue.id && recentDiscovery.sparkleActive;

              if (isFound && !isSparkling) return null;

              const manifest = (
                CASE_001_COORDINATE_MANIFEST as Partial<
                  Record<ClueId, (typeof CASE_001_COORDINATE_MANIFEST)['broken_wine_glass']>
                >
              )[clue.id];
              const cx = manifest ? manifest.x : clue.x;
              const cy = manifest ? manifest.y : clue.y;
              const hitW = manifest ? manifest.width : clue.width;
              const hitH = manifest ? manifest.height : clue.height;
              const baseVisW =
                manifest?.visualWidth ?? clue.visualWidth ?? clue.width * 0.66;
              const baseVisH =
                manifest?.visualHeight ?? clue.visualHeight ?? clue.height * 0.66;
              const lZone: LightingZone = manifest
                ? manifest.lightingZone
                : clue.lightingZone || 'CANDLE_WARM';

              const diffScale =
                activeDifficulty === 'EASY'
                  ? 1.18
                  : activeDifficulty === 'HARD'
                  ? 0.86
                  : 1.0;

              const renderPxW = Math.max(10, stageMetrics.stageW * baseVisW * diffScale);
              const renderPxH = Math.max(10, stageMetrics.stageH * baseVisH * diffScale);
              const lightingFilter = computeClueLightingFilter(lZone, activeDifficulty);
              const baseOpacity =
                activeDifficulty === 'EASY'
                  ? 0.94
                  : activeDifficulty === 'HARD'
                  ? 0.83
                  : 0.89;

              return (
                <button
                  key={clue.id}
                  type="button"
                  data-clue-hitbox="true"
                  aria-label="Inspect crime scene area"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragRef.current.maxTravel > 9) return;
                    triggerDiscovery(clue);
                  }}
                  onTouchEnd={(e) => {
                    if (dragRef.current.maxTravel <= 9 && !pinchRef.current.active) {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerDiscovery(clue);
                    }
                  }}
                  style={{
                    left: `${cx * 100}%`,
                    top: `${cy * 100}%`,
                    width: `${hitW * 100}%`,
                    height: `${hitH * 100}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] flex items-center justify-center [cursor:inherit] bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059]/60 rounded-lg transition-transform duration-300 ${
                    isSparkling ? 'scale-125 opacity-0 pointer-events-none' : ''
                  }`}
                >
                  <span
                    style={{
                      width: `${renderPxW}px`,
                      height: `${renderPxH}px`,
                      filter: lightingFilter,
                      opacity: isSparkling ? 0 : baseOpacity,
                    }}
                    className="pointer-events-none block shrink-0 transition-opacity duration-300"
                  >
                    <SceneObjectArtwork
                      clueId={clue.id}
                      variant="scene"
                      difficulty={activeDifficulty}
                      className="w-full h-full"
                    />
                  </span>
                </button>
              );
            })}

            {/* True 2.35x Composite Optical Magnifying Glass Inspection Loupe */}
            {magnifierEnabled && loupeCoords && !imgError && (
              <div
                style={{
                  left: `${loupeCoords.normX * 100}%`,
                  top: `${loupeCoords.normY * 100}%`,
                  width: '156px',
                  height: '156px',
                }}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 rounded-full overflow-hidden border-[3px] bg-[#0B0A09] shadow-[0_14px_34px_rgba(0,0,0,0.88)] transition-colors duration-150 ${
                  isLoupeNearUnfoundClue
                    ? 'border-[#C5A059]'
                    : 'border-[#8C6D46]'
                }`}
              >
                <div
                  style={{
                    width: `${stageMetrics.stageW * 2.35}px`,
                    height: `${stageMetrics.stageH * 2.35}px`,
                    left: `${78 - loupeCoords.normX * stageMetrics.stageW * 2.35}px`,
                    top: `${78 - loupeCoords.normY * stageMetrics.stageH * 2.35}px`,
                  }}
                  className="absolute pointer-events-none select-none"
                >
                  <img
                    src={caseDef.sceneImageUrl}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="w-full h-full object-contain"
                  />
                  {caseDef.clues.map((clue) => {
                    if (discoveredSet.has(clue.id)) return null;
                    const manifest = (
                      CASE_001_COORDINATE_MANIFEST as Partial<
                        Record<ClueId, (typeof CASE_001_COORDINATE_MANIFEST)['broken_wine_glass']>
                      >
                    )[clue.id];
                    const cx = manifest ? manifest.x : clue.x;
                    const cy = manifest ? manifest.y : clue.y;
                    const baseVisW =
                      manifest?.visualWidth ?? clue.visualWidth ?? clue.width * 0.66;
                    const baseVisH =
                      manifest?.visualHeight ?? clue.visualHeight ?? clue.height * 0.66;
                    const lZone: LightingZone = manifest
                      ? manifest.lightingZone
                      : clue.lightingZone || 'CANDLE_WARM';
                    const diffScale =
                      activeDifficulty === 'EASY'
                        ? 1.18
                        : activeDifficulty === 'HARD'
                        ? 0.86
                        : 1.0;

                    return (
                      <span
                        key={`loupe_${clue.id}`}
                        style={{
                          left: `${cx * 100}%`,
                          top: `${cy * 100}%`,
                          width: `${baseVisW * diffScale * 100}%`,
                          height: `${baseVisH * diffScale * 100}%`,
                          filter: computeClueLightingFilter(lZone, activeDifficulty),
                          opacity:
                            activeDifficulty === 'EASY'
                              ? 0.95
                              : activeDifficulty === 'HARD'
                              ? 0.85
                              : 0.9,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 block"
                      >
                        <SceneObjectArtwork
                          clueId={clue.id}
                          variant="scene"
                          difficulty={activeDifficulty}
                          className="w-full h-full"
                        />
                      </span>
                    );
                  })}
                </div>
                {/* Subtle optical glass curvature & brass inner bezel */}
                <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.62)] border border-[#F4EFE6]/15" />
              </div>
            )}

            {/* Golden Discovery Ring */}
            {recentDiscovery?.sparkleActive && (
              <div
                style={{
                  left: `${recentDiscovery.clue.x * 100}%`,
                  top: `${recentDiscovery.clue.y * 100}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full border-2 border-[#D9B878] bg-[#D9B878]/25 animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* LANDSCAPE MODE: Side Investigation Panel */}
        {isLandscapeLayout ? (
          checklistOpen && (
            <aside className="w-[260px] lg:w-[285px] shrink-0 bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-3.5 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#8C6D46]/20">
                  <h2 className="font-display text-base font-semibold text-[#F4EFE6]">
                    Object Checklist
                  </h2>
                  <span className="text-xs font-mono text-[#D9B878] tabular-nums">
                    {discoveredCount}/{totalClues}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  {caseDef.clues.map((clue) => {
                    const found = discoveredSet.has(clue.id);
                    const hinted = activeHintState?.clueId === clue.id && !found;

                    return (
                      <button
                        key={clue.id}
                        type="button"
                        disabled={!found}
                        onClick={() => found && onInspectClue(clue)}
                        className={`w-full min-h-[42px] px-3 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 border transition-colors ${
                          found
                            ? 'bg-[#1F1B17] hover:bg-[#29241E] border-[#C5A059]/35 text-[#F4EFE6] cursor-pointer'
                            : hinted
                            ? 'bg-[#211B12] border-[#D9B878]/50 text-[#D9B878]'
                            : 'bg-[#12100E] border-[#8C6D46]/15 text-[#C8BFB0]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{clue.name}</div>
                          <div className="text-[10px] text-[#8E8477] truncate">
                            {found
                              ? 'Tap to inspect clue'
                              : hinted
                              ? `Hint L${activeHintState.level} · ${clue.quadrantLabel}`
                              : 'Concealed'}
                          </div>
                        </div>

                        {found ? (
                          <Check className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono text-[#8E8477] tabular-nums">
                            {clue.number}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#8C6D46]/20 text-[11px] text-[#8E8477] space-y-2">
                <div>Pinch or double-tap to zoom · Toggle Magnifier for close inspection.</div>
                {discoveredCount === totalClues && (
                  <button
                    type="button"
                    onClick={onOpenBoard}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs font-semibold cursor-pointer"
                  >
                    Connect Clues on Board
                  </button>
                )}
              </div>
            </aside>
          )
        ) : (
          /* PORTRAIT MODE: Collapsible Bottom Object Checklist */
          <section className="shrink-0 bg-[#151311] border border-[#8C6D46]/25 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setChecklistOpen((o) => !o)}
              className="w-full min-h-[44px] px-4 py-2 flex items-center justify-between text-xs font-semibold text-[#F4EFE6] bg-[#1A1714] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="font-display text-sm">Concealed Objects</span>
                <span className="font-mono text-[#D9B878] tabular-nums">
                  ({discoveredCount}/{totalClues} Found · {progressPercent}% Progress)
                </span>
              </span>
              <span className="flex items-center gap-1 text-[#C5A059]">
                <span>{checklistOpen ? 'Collapse' : 'Expand'}</span>
                {checklistOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </span>
            </button>

            {checklistOpen && (
              <div className="p-2.5 max-h-[168px] overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {caseDef.clues.map((clue) => {
                  const found = discoveredSet.has(clue.id);
                  const hinted = activeHintState?.clueId === clue.id && !found;

                  return (
                    <button
                      key={clue.id}
                      type="button"
                      disabled={!found}
                      onClick={() => found && onInspectClue(clue)}
                      className={`min-h-[42px] px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between gap-1.5 border ${
                        found
                          ? 'bg-[#1F1B17] border-[#C5A059]/35 text-[#F4EFE6] cursor-pointer'
                          : hinted
                          ? 'bg-[#211B12] border-[#D9B878]/50 text-[#D9B878]'
                          : 'bg-[#12100E] border-[#8C6D46]/15 text-[#C8BFB0]'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{clue.name}</span>
                      {found ? (
                        <Check className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-[#8E8477]">
                          {clue.number}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Case Cinematic Opening Briefing Overlay */}
      {!saveState.briefingSeen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-briefing-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#171411] border border-[#C5A059]/45 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#C5A059] font-mono">
                <span>{caseDef.code}</span>
                <span aria-hidden="true">·</span>
                <span>{caseDef.location}</span>
                {saveState.isReplaySession && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#D9B878]">REPLAY SESSION</span>
                  </>
                )}
              </div>
              <h2
                id="case-briefing-title"
                className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#F4EFE6]"
              >
                {caseDef.title}
              </h2>
              <div className="mt-1 text-xs text-[#D9B878]">{caseDef.subtitle}</div>
            </div>

            <div className="space-y-3 text-sm text-[#C8BFB0] leading-relaxed font-serif">
              {caseDef.introBriefing.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="bg-[#1E1A15] border border-[#8C6D46]/30 rounded-xl p-4 space-y-1.5 text-xs text-[#F4EFE6]">
              <div className="font-mono text-[#D9B878] font-semibold">Investigation Objectives</div>
              <ul className="space-y-1 text-[#C8BFB0]">
                <li>
                  01. Discover {caseDef.clues.length} concealed physical exhibits in the{' '}
                  {caseDef.environmentType.toLowerCase()}.
                </li>
                <li>02. Inspect forensics and connect corroborating clues on the Board.</li>
                <li>
                  03. Cross-examine the {caseDef.suspects.length} suspects and deliver your Final
                  Accusation.
                </li>
              </ul>
            </div>

            {/* Difficulty Level Selector Before Entering the Crime Scene */}
            <div className="bg-[#1B1713] border border-[#8C6D46]/30 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[#D9B878] font-semibold">
                  Hidden-Object Difficulty
                </span>
                <span className="text-[#8E8477] font-mono">
                  {DIFFICULTY_OPTIONS.find((d) => d.id === activeDifficulty)?.title}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const selected = activeDifficulty === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeDifficulty(opt.id)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#C5A059] border-[#D9B878] text-[#0D0C0B]'
                          : 'bg-[#14110E] hover:bg-[#211C17] border-[#8C6D46]/30 text-[#F4EFE6]'
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#C8BFB0] leading-relaxed">
                {DIFFICULTY_OPTIONS.find((d) => d.id === activeDifficulty)?.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-[#8C6D46]/25 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBackToLibrary}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Case Library</span>
              </button>
              <button
                type="button"
                onClick={onDismissBriefing}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Begin Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
