export type AppScreen =
  | 'HOME'
  | 'CASE_FILES'
  | 'CASE_COMING_SOON'
  | 'DAILY_MYSTERY'
  | 'PROFILE'
  | 'SETTINGS'
  | 'ABOUT'
  | 'PLAYING_SCENE'
  | 'PLAYING_EVIDENCE'
  | 'PLAYING_BOARD'
  | 'PLAYING_SUSPECTS'
  | 'PLAYING_ACCUSE';

export type ClueId =
  // Case 001: The Last Dinner
  | 'broken_wine_glass'
  | 'torn_photograph'
  | 'golden_key'
  | 'stopped_wristwatch'
  | 'burnt_letter'
  | 'muddy_shoeprint'
  | 'missing_dinner_knife'
  | 'red_silk_thread'
  // Case 002: The Midnight Passenger
  | 'c2_teacup_chloral'
  | 'c2_amber_ampoule'
  | 'c2_telegraph_cipher'
  | 'c2_conductor_watch'
  | 'c2_surgical_cufflink'
  | 'c2_carbon_imprint'
  | 'c2_ivory_chess_knight'
  | 'c2_violin_rosin_tin'
  // Case 003: The House Without Windows
  | 'c3_brass_pendulum'
  | 'c3_skylight_crank'
  | 'c3_blue_drafting_chalk'
  | 'c3_codicil_vellum'
  | 'c3_barometer_dial'
  | 'c3_silk_stage_kerchief'
  | 'c3_vernier_caliper'
  | 'c3_melted_wax_cylinder'
  // Case 004: Death at the Grand Hotel
  | 'c4_champagne_flute'
  | 'c4_jeweler_loupe'
  | 'c4_poison_compact'
  | 'c4_opera_program'
  | 'c4_ivory_gloves'
  | 'c4_baccarat_iou'
  | 'c4_confetti_clock_card'
  | 'c4_broken_monocle'
  // Case 005: The Silent Witness
  | 'c5_poisoned_nib_pen'
  | 'c5_wet_deposition'
  | 'c5_alkaloid_phial'
  | 'c5_blotting_mirror'
  | 'c5_leather_thumbstall'
  | 'c5_ships_bell_clock'
  | 'c5_tarred_rope_fibers'
  | 'c5_shorthand_ribbon';

export type SuspectId =
  // Case 001
  | 'eleanor_blackwood'
  | 'richard_hale'
  | 'thomas_reed'
  | 'sophia_blackwood'
  | 'henry_butler'
  // Case 002
  | 'colonel_marcus_vance'
  | 'nadia_korsakova'
  | 'dr_gideon_croft'
  | 'arthur_finn'
  // Case 003
  | 'victor_locke'
  | 'clara_thorne'
  | 'reverend_josiah_moor'
  | 'mrs_hester_pryce'
  // Case 004
  | 'countess_margot_valois'
  | 'felix_ashford'
  | 'signor_lorenzo_bellini'
  | 'celeste_marlowe'
  // Case 005
  | 'sir_edmund_kerr'
  | 'arthur_pendelton'
  | 'helena_ward'
  | 'captain_miles_brennan';

export type DetectiveRankName =
  | 'Rookie'
  | 'Investigator'
  | 'Inspector'
  | 'Master Detective';

export type GameDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type LightingZone =
  | 'CANDLE_WARM'
  | 'HEARTH_EMBER'
  | 'MOONLIGHT_COLD'
  | 'MAHOGANY_SHADOW';

export type SceneWeatherEffect =
  | 'RAIN_MOONLIGHT'
  | 'BLIZZARD_TRAIN'
  | 'SKYLIGHT_STORM'
  | 'CHANDELIER_GALA'
  | 'THAMES_FOG';

export interface CoordinateManifestEntry {
  id: ClueId;
  label: string;
  x: number;
  y: number;
  /** Interactive click/touch target width (normalized 0..1) */
  width: number;
  /** Interactive click/touch target height (normalized 0..1) */
  height: number;
  /** Realistic rendered visual width (normalized 0..1) before difficulty scaling */
  visualWidth?: number;
  /** Realistic rendered visual height (normalized 0..1) before difficulty scaling */
  visualHeight?: number;
  lightingZone: LightingZone;
  surfaceAnchor: string;
}

export interface HiddenObjectClue {
  id: ClueId;
  number: string;
  name: string;
  /** Hint Level 1: Subtle clue about the object's general area or atmosphere */
  subtleLocationHint?: string;
  /** Hint Level 2: Specific directional clue pointing to the architectural fixture */
  shortHint: string;
  quadrantLabel: string;
  lightingZone?: LightingZone;
  surfaceAnchor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visualWidth?: number;
  visualHeight?: number;
  locationFound: string;
  summary: string;
  forensicDetails: string[];
  inspectionNote: string;
  unexpectedDiscoveryNote?: string;
  evidenceClassification: 'GENUINE_DIRECT' | 'GENUINE_CORROBORATING' | 'MISLEADING_RED_HERRING';
  tags: string[];
}

export interface DialogueUnlockCondition {
  requiredClueIds?: ClueId[];
  requiredDeductionIds?: string[];
  requiredContradictionIds?: string[];
}

export interface SuspectQuestion {
  id: string;
  prompt: string;
  answer: string;
  unlockCondition?: DialogueUnlockCondition;
  composureShift?: 'GUARDED' | 'PRESSURED' | 'RATTLED';
}

export interface EvidenceReaction {
  response: string;
  exposesContradiction?: boolean;
  contradictionId?: string;
  contradictionTitle?: string;
  followUpQuestion?: SuspectQuestion;
  composureShift?: 'GUARDED' | 'PRESSURED' | 'RATTLED';
}

export interface SuspectProfile {
  id: SuspectId;
  name: string;
  role: string;
  age: number;
  portraitUrl: string;
  personalBackground?: string;
  relationshipToVictim?: string;
  timelineSummary?: string;
  initialAlibi: string;
  personality: string;
  apparentMotive: string;
  hiddenSecret: string;
  baselineQuestions: SuspectQuestion[];
  evidenceReactions: Partial<Record<ClueId, EvidenceReaction>>;
}

export interface StringConnection {
  id: string;
  fromId: string;
  toId: string;
  deductionId?: string;
}

export interface DeductionRule {
  id: string;
  pair: [string, string];
  title: string;
  insight: string;
  unlocksNote: string;
}

export interface AccusationOption {
  id: string;
  label: string;
  description: string;
}

export interface CanonicalTimelineEvent {
  time: string;
  actor: string;
  event: string;
  verifyingClueIds: ClueId[];
}

export interface CanonicalRelationship {
  between: [string, string];
  publicRelation: string;
  hiddenTruth: string;
  discoverableVia: ClueId[];
}

export interface CanonicalContradiction {
  id: string;
  suspectId: SuspectId;
  clueId: ClueId;
  claim: string;
  reality: string;
}

/**
 * Structured internal mystery database ensuring a single fixed canonical culprit,
 * deterministic timeline, genuine vs. misleading evidence roles, and logical deduction chain.
 * Never exposed directly in UI before final accusation.
 */
export interface CanonicalCaseDatabase {
  actualCulpritId: SuspectId;
  canonicalMethodId: string;
  canonicalMotiveId: string;
  decisiveClueIds: ClueId[];
  genuineClueIds: ClueId[];
  misleadingClueIds: {
    clueId: ClueId;
    apparentImplication: string;
    actualForensicTruth: string;
  }[];
  timeline: CanonicalTimelineEvent[];
  hiddenRelationships: CanonicalRelationship[];
  contradictions: CanonicalContradiction[];
}

export interface EvidenceProofEntry {
  clueId: ClueId;
  clueName: string;
  roleLabel: string;
  explanation: string;
}

export interface CaseSolutionNarrative {
  culpritHeadline: string;
  epilogueParagraphs: string[];
  motiveExplanation: string;
  methodExplanation: string;
  evidenceProofItems: EvidenceProofEntry[];
  redHerringSuspectId?: SuspectId;
  redHerringHeadline?: string;
  redHerringParagraphs?: string[];
  wrongSuspectParagraphs: string[];
}

export interface CaseEnding {
  id: 'TRUE_DETECTIVE' | 'CIRCUMSTANTIAL_ARREST' | 'FALSE_ELEANOR' | 'FALSE_OTHER';
  solved: boolean;
  badge: string;
  headline: string;
  epilogueParagraphs: string[];
  motiveExplanation?: string;
  methodExplanation?: string;
  evidenceProofItems?: EvidenceProofEntry[];
}

export interface CaseDefinition {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  victimName: string;
  timeOfDeathReport: string;
  location: string;
  environmentType: string;
  weatherEffect?: SceneWeatherEffect;
  difficulty: 'Standard' | 'Hard' | 'Master';
  maxHints: number;
  sceneImageUrl: string;
  heroImageUrl: string;
  introBriefing: string[];
  clues: HiddenObjectClue[];
  suspects: SuspectProfile[];
  deductionRules: DeductionRule[];
  methodOptions: AccusationOption[];
  motiveOptions: AccusationOption[];
  canonicalDatabase: CanonicalCaseDatabase;
  solutionNarrative?: CaseSolutionNarrative;
}

export interface PlannedCaseBlueprint {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  environmentType: string;
  difficulty: 'Standard' | 'Hard' | 'Master';
  synopsis: string;
  plannedClueCount: number;
  plannedSuspectCount: number;
  timelineWindow: string;
  playable: false;
}

export type CaseProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type GameplayStage =
  | 'PLAYING_SCENE'
  | 'PLAYING_EVIDENCE'
  | 'PLAYING_BOARD'
  | 'PLAYING_SUSPECTS'
  | 'PLAYING_ACCUSE';

export interface FinalAccusationRecord {
  culpritId: SuspectId;
  methodId: string | null;
  motiveId: string | null;
  selectedClues: ClueId[];
  submittedAt: string;
}

export interface CompletedCaseSummary {
  caseId: string;
  solved: boolean;
  isReplayCompletion?: boolean;
  accusedSuspectId?: SuspectId;
  endingId: CaseEnding['id'];
  endingBadge: string;
  endingHeadline: string;
  epilogueParagraphs: string[];
  motiveExplanation?: string;
  methodExplanation?: string;
  evidenceProofItems?: EvidenceProofEntry[];
  completionPercentage: number;
  score: number;
  evidenceScore: number;
  deductionScore: number;
  interrogationScore: number;
  accusationScore: number;
  precisionBonus: number;
  rank: 'S' | 'A' | 'B' | 'C';
  accuracyPercent: number;
  evidencePercent: number;
  hintsUsed: number;
  elapsedSeconds: number;
  completedAt: string;
}

export interface CaseCompletionRecord {
  caseId: string;
  status: 'COMPLETED';
  firstCompletedAt: string;
  completionPercentage: number;
  elapsedSeconds: number;
  hintsUsed: number;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C';
  finalAccusation?: FinalAccusationRecord;
}

export interface CaseSaveState {
  caseId: string;
  status: CaseProgressStatus;
  currentStage: GameplayStage;
  difficulty: GameDifficulty;
  startedAt: string;
  updatedAt: string;
  briefingSeen: boolean;
  isCompleted?: boolean;
  /** True when the player clicked REPLAY CASE on an already-completed case */
  isReplaySession?: boolean;
  /** Total number of replay runs started on this case */
  replayCount?: number;
  elapsedSeconds: number;
  discoveredClues: ClueId[];
  inspectedClues: ClueId[];
  hintsUsed: number;
  /** Tracks 3-level progressive Smart Hint state (1 -> 2 -> 3) per clue */
  hintLevelsByClue?: Partial<Record<ClueId, 1 | 2 | 3>>;
  misTaps: number;
  askedQuestions: string[];
  presentedEvidence: string[];
  exposedContradictions: string[];
  suspectComposure: Partial<Record<SuspectId, 'CALM' | 'GUARDED' | 'PRESSURED' | 'RATTLED'>>;
  boardPositions: Record<string, { x: number; y: number }>;
  connections: StringConnection[];
  unlockedDeductions: string[];
  notebookNotes: string;
  finalAccusation: FinalAccusationRecord | null;
  completionScore: number | null;
  completionDate: string | null;
  completedEnding?: CompletedCaseSummary;
  /** Permanent record of the player's very first successful completion (never overwritten) */
  originalCompletionRecord?: CaseCompletionRecord | null;
  /** Highest-scoring completion summary across original + all replays (never downgraded) */
  bestCompletionSummary?: CompletedCaseSummary | null;
  /** Separate record of the most recent completed replay run */
  lastReplaySummary?: CompletedCaseSummary | null;
}

export interface DailyMysteryPuzzle {
  id: string;
  dateLabel: string;
  title: string;
  setting: string;
  premise: string;
  clues: {
    id: string;
    title: string;
    detail: string;
  }[];
  suspects: {
    id: string;
    name: string;
    role: string;
    statement: string;
  }[];
  culpritId: string;
  explanation: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  xpBonus: number;
}

export interface DetectiveProfileState {
  detectiveName: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  preferredDifficulty: GameDifficulty;
  activeCaseId: string | null;
  caseRecords: Record<string, CaseCompletionRecord>;
  totalXp: number;
  solvedCaseIds: string[];
  caseRatings: Record<string, CompletedCaseSummary>;
  unlockedEndings: string[];
  unlockedAchievementIds: string[];
  completedDailyIds: string[];
  currentStreakDays: number;
  bestStreakDays: number;
  lastInvestigationDate: string | null;
  totalHintsUsed: number;
  totalSceneHits: number;
  totalSceneMisTaps: number;
  totalInvestigationSeconds: number;
}
