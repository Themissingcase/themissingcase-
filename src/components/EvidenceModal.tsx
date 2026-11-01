import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  RotateCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { HiddenObjectClue } from '../types/game';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface EvidenceModalProps {
  clue: HiddenObjectClue | null;
  onClose: () => void;
}

/**
 * Interactive Forensic Specimen Inspector supporting:
 * 1. Two-finger pinch to magnify evidence (1.0x – 3.2x) + wheel/button zoom
 * 2. One-finger / mouse drag to pan and examine enlarged evidence
 * 3. Two-finger twist gesture + rotate button to rotate evidence items
 */
export const EvidenceModal: React.FC<EvidenceModalProps> = ({ clue, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  const gestureRef = useRef<{
    mode: 'NONE' | 'PAN' | 'PINCH_ROTATE';
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
    initialDist: number;
    initialScale: number;
    initialAngle: number;
    initialRotation: number;
  }>({
    mode: 'NONE',
    startX: 0,
    startY: 0,
    origOffsetX: 0,
    origOffsetY: 0,
    initialDist: 1,
    initialScale: 1,
    initialAngle: 0,
    initialRotation: 0,
  });

  // Reset transform when switching clues
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, [clue?.id]);

  // Prevent browser pinch-zoom hijack inside specimen viewport on iOS/Android
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length >= 2 || scale > 1.02) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    return () => el.removeEventListener('touchmove', preventDefaultTouch);
  }, [scale, clue]);

  if (!clue) return null;

  const clampOffset = (x: number, y: number, s: number) => {
    const bound = Math.max(0, (s - 1) * 95);
    return {
      x: Math.max(-bound, Math.min(bound, x)),
      y: Math.max(-bound, Math.min(bound, y)),
    };
  };

  const resetSpecimenCamera = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'PINCH_ROTATE',
        initialDist: Math.max(1, Math.hypot(dx, dy)),
        initialScale: scale,
        initialAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
        initialRotation: rotation,
      };
    } else if (e.touches.length === 1) {
      gestureRef.current = {
        ...gestureRef.current,
        mode: 'PAN',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        origOffsetX: offset.x,
        origOffsetY: offset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && gestureRef.current.mode === 'PINCH_ROTATE') {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const nextScale = Math.max(
        1,
        Math.min(3.2, gestureRef.current.initialScale * (dist / gestureRef.current.initialDist))
      );
      const angleDelta = angle - gestureRef.current.initialAngle;
      setScale(nextScale);
      setRotation(Math.round(gestureRef.current.initialRotation + angleDelta));
      setOffset((prev) => clampOffset(prev.x, prev.y, nextScale));
    } else if (e.touches.length === 1 && gestureRef.current.mode === 'PAN' && scale > 1.02) {
      const dx = e.touches[0].clientX - gestureRef.current.startX;
      const dy = e.touches[0].clientY - gestureRef.current.startY;
      setOffset(
        clampOffset(
          gestureRef.current.origOffsetX + dx,
          gestureRef.current.origOffsetY + dy,
          scale
        )
      );
    }
  };

  const handleTouchEnd = () => {
    gestureRef.current.mode = 'NONE';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    gestureRef.current = {
      ...gestureRef.current,
      mode: 'PAN',
      startX: e.clientX,
      startY: e.clientY,
      origOffsetX: offset.x,
      origOffsetY: offset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gestureRef.current.mode !== 'PAN' || scale <= 1.02) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;
    setOffset(
      clampOffset(
        gestureRef.current.origOffsetX + dx,
        gestureRef.current.origOffsetY + dy,
        scale
      )
    );
  };

  const handleMouseUp = () => {
    gestureRef.current.mode = 'NONE';
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(1, Math.min(3.2, scale + (e.deltaY < 0 ? 0.25 : -0.25)));
    setScale(next);
    setOffset((prev) => clampOffset(prev.x, prev.y, next));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-inspector-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#171412] border-t sm:border border-[#C5A059]/35 rounded-t-3xl sm:rounded-2xl p-5 sm:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden w-10 h-1 bg-[#8C6D46]/50 rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono tabular-nums">
              <span>Evidence Item #{clue.number}</span>
              <span aria-hidden="true">·</span>
              <span>{clue.locationFound}</span>
            </div>
            <h2
              id="evidence-inspector-title"
              className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#F4EFE6]"
            >
              {clue.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Inspector"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#221E1A] hover:bg-[#2C2722] text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Interactive Pinch / Pan / Two-Finger Rotate Specimen Stage */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <div
              ref={stageRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onDoubleClick={() => {
                if (scale > 1.05 || rotation !== 0) {
                  resetSpecimenCamera();
                } else {
                  setScale(2);
                }
              }}
              className={`relative rounded-xl bg-radial from-[#2A231B] via-[#181512] to-[#0E0D0B] border border-[#8C6D46]/35 min-h-[220px] flex-1 flex items-center justify-center overflow-hidden select-none touch-none ${
                scale > 1.02 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              }`}
            >
              <div
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
                }}
                className="w-40 h-40 transition-transform duration-75 ease-out pointer-events-none"
              >
                <SceneObjectArtwork clueId={clue.id} variant="inspector" />
              </div>

              {scale > 1.05 && (
                <div className="pointer-events-none absolute inset-3 rounded-full border border-[#D9B878]/35 shadow-[inset_0_0_24px_rgba(217,184,120,0.12)]" />
              )}

              <div className="absolute top-2.5 left-2.5 text-[10px] font-mono text-[#C8BFB0]/80 bg-[#0D0C0B]/75 px-2 py-0.5 rounded">
                {Math.round(scale * 100)}% · {((rotation % 360) + 360) % 360}°
              </div>
            </div>

            {/* Touch-friendly Magnify & Rotate Controls */}
            <div className="flex items-center justify-between gap-1.5 bg-[#12100E] border border-[#8C6D46]/25 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, Number((scale - 0.4).toFixed(2)));
                  setScale(next);
                  setOffset((p) => clampOffset(p.x, p.y, next));
                }}
                aria-label="Zoom Out Specimen"
                className="min-h-[38px] min-w-[38px] rounded-lg hover:bg-[#221E1A] text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center justify-center cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(3.2, Number((scale + 0.4).toFixed(2)));
                  setScale(next);
                }}
                aria-label="Magnify Specimen"
                className="min-h-[38px] min-w-[38px] rounded-lg hover:bg-[#221E1A] text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center justify-center cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((r) => r + 45)}
                aria-label="Rotate Specimen 45 Degrees"
                className="min-h-[38px] px-2.5 rounded-lg hover:bg-[#221E1A] text-xs font-medium text-[#D9B878] flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={resetSpecimenCamera}
                aria-label="Reset Specimen View"
                className="min-h-[38px] px-2.5 rounded-lg hover:bg-[#221E1A] text-xs font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
            <div className="text-[11px] text-[#8E8477] text-center">
              Pinch to magnify · Drag to pan · Two fingers to rotate
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-sm text-[#F4EFE6] leading-relaxed font-medium">
                {clue.summary}
              </p>

              <div className="mt-4 space-y-2.5">
                <div className="text-xs font-semibold text-[#C5A059] tracking-wide">
                  Forensic Examination Notes
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-[#C8BFB0] leading-relaxed">
                  {clue.forensicDetails.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Search className="w-3.5 h-3.5 text-[#C5A059] mt-1 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#201C18] border border-[#C5A059]/25">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D9B878]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Detective Deduction Takeaway</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#F4EFE6]/90 leading-relaxed">
                {clue.inspectionNote}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#8C6D46]/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8E8477]">
            {clue.tags.map((tag, i) => (
              <React.Fragment key={tag}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <span>{tag}</span>
              </React.Fragment>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Log into Case File
          </button>
        </div>
      </div>
    </div>
  );
};
