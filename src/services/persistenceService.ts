import {
  AchievementDefinition,
  CaseCompletionRecord,
  CaseProgressStatus,
  CaseSaveState,
  CompletedCaseSummary,
  DetectiveProfileState,
  DetectiveRankName,
  GameDifficulty,
  GameplayStage,
  SuspectId,
} from '../types/game';
import { getCaseById } from '../data/caseRegistry';

/**
 * Pure browser LocalStorage persistence repository for THE MISSING CLUE.
 * Requires zero API keys, secrets, or external backend services.
 * Stores every case independently by caseId (`tmc_case_save_v2_<caseId>`) so each mystery
 * maintains its own status, clues, inspected evidence, gameplay stage, accusation, score,
 * permanent original completion record, best score, and replay session state.
 */
export interface GamePersistenceRepository {
  readonly providerName: 'local-storage';
  loadCaseSave(caseId: string): CaseSaveState | null;
  saveCaseState(state: CaseSaveState): void;
  startCaseReplay(caseId: string, difficulty?: GameDifficulty): CaseSaveState;
  resetCaseSave(caseId: string, difficulty?: GameDifficulty): CaseSaveState;
  loadProfile(): DetectiveProfileState;
  saveProfile(profile: DetectiveProfileState): void;
  resetAllProgress(): void;
}

const CASE_STORAGE_PREFIX = 'tmc_case_save_v2_';
const PROFILE_STORAGE_KEY = 'tmc_detective_profile_v2';

const VALID_STAGES: GameplayStage[] = [
  'PLAYING_SCENE',
  'PLAYING_EVIDENCE',
  'PLAYING_BOARD',
  'PLAYING_SUSPECTS',
  'PLAYING_ACCUSE',
];

export function normalizeDifficulty(raw: unknown): GameDifficulty {
  if (raw === 'EASY') return 'EASY';
  if (raw === 'HARD' || raw === 'EXPERT') return 'HARD';
  if (raw === 'MEDIUM' || raw === 'NORMAL') return 'MEDIUM';
  return 'MEDIUM';
}

export const INITIAL_BOARD_POSITIONS: Record<string, { x: number; y: number }> = {
  eleanor_blackwood: { x: 0.13, y: 0.17 },
  richard_hale: { x: 0.31, y: 0.17 },
  thomas_reed: { x: 0.50, y: 0.17 },
  sophia_blackwood: { x: 0.69, y: 0.17 },
  henry_butler: { x: 0.87, y: 0.17 },
  broken_wine_glass: { x: 0.16, y: 0.53 },
  golden_key: { x: 0.38, y: 0.53 },
  stopped_wristwatch: { x: 0.16, y: 0.80 },
  red_silk_thread: { x: 0.38, y: 0.80 },
  burnt_letter: { x: 0.62, y: 0.53 },
  missing_dinner_knife: { x: 0.84, y: 0.53 },
  muddy_shoeprint: { x: 0.62, y: 0.80 },
  torn_photograph: { x: 0.84, y: 0.80 },
};

export function getInitialBoardPositionsForCase(caseId: string): Record<string, { x: number; y: number }> {
  if (caseId === 'case_001') {
    return { ...INITIAL_BOARD_POSITIONS };
  }
  const caseDef = getCaseById(caseId);
  const positions: Record<string, { x: number; y: number }> = {};

  const suspectCount = Math.max(1, caseDef.suspects.length);
  caseDef.suspects.forEach((s, idx) => {
    const x =
      suspectCount === 1
        ? 0.5
        : Number((0.16 + (idx * 0.68) / (suspectCount - 1)).toFixed(2));
    positions[s.id] = { x, y: 0.18 };
  });

  caseDef.clues.forEach((c, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = Number((0.16 + col * 0.226).toFixed(2));
    const y = row === 0 ? 0.54 : 0.81;
    positions[c.id] = { x, y };
  });

  return positions;
}

export function getInitialSuspectComposureForCase(
  caseId: string
): Partial<Record<SuspectId, 'CALM' | 'GUARDED' | 'PRESSURED' | 'RATTLED'>> {
  const caseDef = getCaseById(caseId);
  const map: Partial<Record<SuspectId, 'CALM' | 'GUARDED' | 'PRESSURED' | 'RATTLED'>> = {};
  caseDef.suspects.forEach((s) => {
    map[s.id] = 'CALM';
  });
  return map;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_discovery',
    title: 'First Discovery',
    description: 'Uncover and bag your first concealed piece of physical evidence at a crime scene.',
    xpBonus: 30,
  },
  {
    id: 'sharp_eyes',
    title: 'Sharp Eyes',
    description: 'Locate all 8 concealed objects in a crime scene with at least 85% search accuracy.',
    xpBonus: 75,
  },
  {
    id: 'no_assistance',
    title: 'No Assistance',
    description: 'Catch the true culprit and close a case without using Detective’s Eye.',
    xpBonus: 120,
  },
  {
    id: 'master_investigator',
    title: 'Master Investigator',
    description: 'Forensically inspect all decisive exhibits and connect 3+ board breakthroughs.',
    xpBonus: 100,
  },
  {
    id: 'case_closed',
    title: 'Case Closed',
    description: 'Unmask the true culprit and solve an investigation in The Missing Clue anthology.',
    xpBonus: 150,
  },
  {
    id: 'perfect_detective',
    title: 'Perfect Detective',
    description: 'Solve a case with 100% completion, all decisive exhibits inspected, and zero hints used.',
    xpBonus: 200,
  },
];

const LEGACY_ACHIEVEMENT_MAP: Record<string, string> = {
  first_clue: 'first_discovery',
  sharp_eye: 'sharp_eyes',
  unassisted_sleuth: 'no_assistance',
  red_string_weaver: 'master_investigator',
  true_justice_001: 'case_closed',
};

export function createInitialCaseSave(
  caseId: string,
  difficulty: GameDifficulty = 'MEDIUM'
): CaseSaveState {
  const safeDifficulty = normalizeDifficulty(difficulty);
  const now = new Date().toISOString();
  return {
    caseId,
    status: 'NOT_STARTED',
    currentStage: 'PLAYING_SCENE',
    difficulty: safeDifficulty,
    startedAt: now,
    updatedAt: now,
    briefingSeen: false,
    isCompleted: false,
    isReplaySession: false,
    replayCount: 0,
    elapsedSeconds: 0,
    discoveredClues: [],
    inspectedClues: [],
    hintsUsed: 0,
    hintLevelsByClue: {},
    misTaps: 0,
    askedQuestions: [],
    presentedEvidence: [],
    exposedContradictions: [],
    suspectComposure: getInitialSuspectComposureForCase(caseId),
    boardPositions: getInitialBoardPositionsForCase(caseId),
    connections: [],
    unlockedDeductions: [],
    notebookNotes: '',
    finalAccusation: null,
    completionScore: null,
    completionDate: null,
    originalCompletionRecord: null,
    bestCompletionSummary: null,
    lastReplaySummary: null,
  };
}

export function createInitialProfile(): DetectiveProfileState {
  return {
    detectiveName: 'Detective Vance',
    soundEnabled: true,
    musicEnabled: true,
    masterVolume: 0.85,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    preferredDifficulty: 'MEDIUM',
    activeCaseId: null,
    caseRecords: {},
    totalXp: 0,
    solvedCaseIds: [],
    caseRatings: {},
    unlockedEndings: [],
    unlockedAchievementIds: [],
    completedDailyIds: [],
    currentStreakDays: 0,
    bestStreakDays: 0,
    lastInvestigationDate: null,
    totalHintsUsed: 0,
    totalSceneHits: 0,
    totalSceneMisTaps: 0,
    totalInvestigationSeconds: 0,
  };
}

function isSummarySolved(summary?: CompletedCaseSummary | null): boolean {
  if (!summary) return false;
  if (typeof summary.solved === 'boolean') return summary.solved;
  return (
    summary.endingId === 'TRUE_DETECTIVE' ||
    summary.endingId === 'CIRCUMSTANTIAL_ARREST'
  );
}

function deriveCaseStatus(parsed: Partial<CaseSaveState>): CaseProgressStatus {
  if (isSummarySolved(parsed.completedEnding)) {
    return 'COMPLETED';
  }
  if (parsed.isReplaySession) {
    return 'IN_PROGRESS';
  }
  if (
    parsed.status === 'COMPLETED' ||
    parsed.status === 'IN_PROGRESS' ||
    parsed.status === 'NOT_STARTED'
  ) {
    return parsed.status;
  }
  if (parsed.isCompleted) {
    return 'COMPLETED';
  }

  const hasProgress =
    (parsed.discoveredClues && parsed.discoveredClues.length > 0) ||
    (parsed.connections && parsed.connections.length > 0) ||
    (parsed.askedQuestions && parsed.askedQuestions.length > 0) ||
    (parsed.notebookNotes && parsed.notebookNotes.trim().length > 0) ||
    Boolean(parsed.briefingSeen);

  return hasProgress ? 'IN_PROGRESS' : 'NOT_STARTED';
}

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function recordDailyStreakActivity(profile: DetectiveProfileState): DetectiveProfileState {
  const today = getLocalDateKey();
  if (profile.lastInvestigationDate === today) {
    return profile;
  }

  let nextStreak = 1;
  if (profile.lastInvestigationDate) {
    const prev = new Date(`${profile.lastInvestigationDate}T00:00:00`);
    const curr = new Date(`${today}T00:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      nextStreak = profile.currentStreakDays + 1;
    }
  }

  return {
    ...profile,
    currentStreakDays: nextStreak,
    bestStreakDays: Math.max(profile.bestStreakDays, nextStreak),
    lastInvestigationDate: today,
  };
}

export function getDetectiveRankInfo(xp: number): {
  rank: DetectiveRankName;
  levelNumber: number;
  currentFloor: number;
  nextThreshold: number | null;
  progressPercent: number;
} {
  if (xp >= 900) {
    return {
      rank: 'Master Detective',
      levelNumber: 4,
      currentFloor: 900,
      nextThreshold: null,
      progressPercent: 100,
    };
  }
  if (xp >= 500) {
    return {
      rank: 'Inspector',
      levelNumber: 3,
      currentFloor: 500,
      nextThreshold: 900,
      progressPercent: Math.min(100, Math.round(((xp - 500) / 400) * 100)),
    };
  }
  if (xp >= 200) {
    return {
      rank: 'Investigator',
      levelNumber: 2,
      currentFloor: 200,
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.round(((xp - 200) / 300) * 100)),
    };
  }
  return {
    rank: 'Rookie',
    levelNumber: 1,
    currentFloor: 0,
    nextThreshold: 200,
    progressPercent: Math.min(100, Math.round((xp / 200) * 100)),
  };
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${String(remMins).padStart(2, '0')}m`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

class LocalStorageGameRepository implements GamePersistenceRepository {
  public readonly providerName = 'local-storage' as const;

  public loadCaseSave(caseId: string): CaseSaveState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(`${CASE_STORAGE_PREFIX}${caseId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<CaseSaveState>;
      const status = deriveCaseStatus(parsed);
      const validStage =
        parsed.currentStage && VALID_STAGES.includes(parsed.currentStage)
          ? parsed.currentStage
          : 'PLAYING_SCENE';
      const validDifficulty = normalizeDifficulty(parsed.difficulty);

      const solvedEnding = isSummarySolved(parsed.completedEnding)
        ? parsed.completedEnding
        : undefined;

      const migratedOriginalRecord: CaseCompletionRecord | null =
        parsed.originalCompletionRecord ||
        (solvedEnding
          ? {
              caseId,
              status: 'COMPLETED',
              firstCompletedAt: solvedEnding.completedAt || new Date().toISOString(),
              completionPercentage:
                solvedEnding.completionPercentage ?? solvedEnding.evidencePercent ?? 100,
              elapsedSeconds: solvedEnding.elapsedSeconds ?? 0,
              hintsUsed: solvedEnding.hintsUsed ?? 0,
              score: solvedEnding.score ?? 0,
              rank: solvedEnding.rank ?? 'A',
              finalAccusation: parsed.finalAccusation || undefined,
            }
          : null);

      const migratedBestSummary: CompletedCaseSummary | null =
        parsed.bestCompletionSummary || (solvedEnding ?? null);

      return {
        ...createInitialCaseSave(caseId, validDifficulty),
        ...parsed,
        caseId,
        status,
        currentStage: validStage,
        difficulty: validDifficulty,
        isCompleted: Boolean(
          parsed.isCompleted || status === 'COMPLETED' || migratedOriginalRecord
        ),
        isReplaySession: Boolean(parsed.isReplaySession),
        replayCount: typeof parsed.replayCount === 'number' ? parsed.replayCount : 0,
        hintLevelsByClue: parsed.hintLevelsByClue || {},
        completionScore:
          parsed.completionScore ?? (solvedEnding ? solvedEnding.score : null),
        completionDate:
          parsed.completionDate ?? (solvedEnding ? solvedEnding.completedAt : null),
        finalAccusation: parsed.finalAccusation ?? null,
        originalCompletionRecord: migratedOriginalRecord,
        bestCompletionSummary: migratedBestSummary,
        lastReplaySummary: parsed.lastReplaySummary ?? null,
        boardPositions: {
          ...getInitialBoardPositionsForCase(caseId),
          ...(parsed.boardPositions || {}),
        },
        suspectComposure: {
          ...getInitialSuspectComposureForCase(caseId),
          ...(parsed.suspectComposure || {}),
        },
      };
    } catch {
      return null;
    }
  }

  public saveCaseState(state: CaseSaveState): void {
    if (typeof window === 'undefined') return;
    try {
      const updated: CaseSaveState = {
        ...state,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(
        `${CASE_STORAGE_PREFIX}${state.caseId}`,
        JSON.stringify(updated)
      );
    } catch {
      // Ignore storage quota failure safely
    }
  }

  /**
   * Starts a fresh replay session for a completed case from its opening introduction (`briefingSeen: false`)
   * WITHOUT deleting or overwriting `originalCompletionRecord`, `bestCompletionSummary`, or achievements.
   */
  public startCaseReplay(caseId: string, difficulty: GameDifficulty = 'MEDIUM'): CaseSaveState {
    const existing = this.loadCaseSave(caseId);
    const preservedOriginalRecord = existing?.originalCompletionRecord ?? null;
    const preservedBestSummary =
      existing?.bestCompletionSummary ??
      (isSummarySolved(existing?.completedEnding) ? existing?.completedEnding ?? null : null);
    const preservedLastReplay = existing?.lastReplaySummary ?? null;
    const preservedCompletionScore =
      existing?.completionScore ?? preservedOriginalRecord?.score ?? null;
    const preservedCompletionDate =
      existing?.completionDate ?? preservedOriginalRecord?.firstCompletedAt ?? null;
    const chosenDifficulty = normalizeDifficulty(difficulty || existing?.difficulty);
    const nextReplayCount = (existing?.replayCount || 0) + 1;

    const freshReplay: CaseSaveState = {
      ...createInitialCaseSave(caseId, chosenDifficulty),
      status: 'IN_PROGRESS',
      currentStage: 'PLAYING_SCENE',
      briefingSeen: false,
      isCompleted: Boolean(preservedOriginalRecord || existing?.isCompleted || preservedBestSummary),
      isReplaySession: true,
      replayCount: nextReplayCount,
      originalCompletionRecord: preservedOriginalRecord,
      bestCompletionSummary: preservedBestSummary,
      lastReplaySummary: preservedLastReplay,
      completionScore: preservedCompletionScore,
      completionDate: preservedCompletionDate,
    };

    this.saveCaseState(freshReplay);
    return freshReplay;
  }

  public resetCaseSave(caseId: string, difficulty: GameDifficulty = 'MEDIUM'): CaseSaveState {
    const fresh = createInitialCaseSave(caseId, normalizeDifficulty(difficulty));
    this.saveCaseState(fresh);
    return fresh;
  }

  public loadProfile(): DetectiveProfileState {
    if (typeof window === 'undefined') return createInitialProfile();
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return createInitialProfile();
      const parsed = JSON.parse(raw) as Partial<DetectiveProfileState>;

      const validAchievementSet = new Set(ACHIEVEMENTS.map((a) => a.id));
      const migratedAchievements = Array.from(
        new Set(
          (parsed.unlockedAchievementIds || [])
            .map((id) => LEGACY_ACHIEVEMENT_MAP[id] || id)
            .filter((id) => validAchievementSet.has(id))
        )
      );

      const validDifficulty = normalizeDifficulty(parsed.preferredDifficulty);

      const base: DetectiveProfileState = {
        ...createInitialProfile(),
        ...parsed,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true,
        masterVolume:
          typeof parsed.masterVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.masterVolume))
            : 0.85,
        musicVolume:
          typeof parsed.musicVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.musicVolume))
            : 0.5,
        sfxVolume:
          typeof parsed.sfxVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.sfxVolume))
            : 0.8,
        preferredDifficulty: validDifficulty,
        unlockedAchievementIds: migratedAchievements,
        caseRecords: { ...(parsed.caseRecords || {}) },
      };

      // Backfill permanent caseRecords from any solved caseRatings
      Object.entries(base.caseRatings).forEach(([caseId, summary]) => {
        if (isSummarySolved(summary) && !base.caseRecords[caseId]) {
          base.caseRecords[caseId] = {
            caseId,
            status: 'COMPLETED',
            firstCompletedAt: summary.completedAt || new Date().toISOString(),
            completionPercentage:
              summary.completionPercentage ?? summary.evidencePercent ?? 100,
            elapsedSeconds: summary.elapsedSeconds ?? 0,
            hintsUsed: summary.hintsUsed ?? 0,
            score: summary.score ?? 0,
            rank: summary.rank ?? 'A',
          };
        }
      });

      return base;
    } catch {
      return createInitialProfile();
    }
  }

  public saveProfile(profile: DetectiveProfileState): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota failure safely
    }
  }

  public resetAllProgress(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith(CASE_STORAGE_PREFIX) || key === PROFILE_STORAGE_KEY) {
          window.localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore safely
    }
  }
}

export const gameRepository: GamePersistenceRepository = new LocalStorageGameRepository();
