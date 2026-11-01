import {
  CaseDefinition,
  CaseEnding,
  CaseSaveState,
  ClueId,
  CompletedCaseSummary,
  DetectiveProfileState,
  DialogueUnlockCondition,
  EvidenceProofEntry,
  SuspectId,
  SuspectQuestion,
} from '../types/game';
import { ACHIEVEMENTS } from '../services/persistenceService';

export function isQuestionUnlocked(
  question: SuspectQuestion,
  saveState: CaseSaveState
): boolean {
  const cond: DialogueUnlockCondition | undefined = question.unlockCondition;
  if (!cond) return true;

  if (cond.requiredClueIds && cond.requiredClueIds.length > 0) {
    const hasAllClues = cond.requiredClueIds.every((c) => saveState.discoveredClues.includes(c));
    if (!hasAllClues) return false;
  }

  if (cond.requiredDeductionIds && cond.requiredDeductionIds.length > 0) {
    const hasAllDeductions = cond.requiredDeductionIds.every((d) =>
      saveState.unlockedDeductions.includes(d)
    );
    if (!hasAllDeductions) return false;
  }

  if (cond.requiredContradictionIds && cond.requiredContradictionIds.length > 0) {
    const hasAllContradictions = cond.requiredContradictionIds.every((cid) =>
      saveState.exposedContradictions.includes(cid)
    );
    if (!hasAllContradictions) return false;
  }

  return true;
}

export function computeInvestigationProgress(
  caseDef: CaseDefinition,
  save: CaseSaveState
): number {
  const clueRatio = Math.min(1, save.discoveredClues.length / Math.max(1, caseDef.clues.length));
  const inspectRatio = Math.min(1, save.inspectedClues.length / Math.max(1, caseDef.clues.length));
  const deductionRatio = Math.min(
    1,
    save.unlockedDeductions.length / Math.max(1, caseDef.deductionRules.length)
  );
  const totalContradictions = Math.max(1, caseDef.canonicalDatabase.contradictions.length || 3);
  const contradictionRatio = Math.min(
    1,
    save.exposedContradictions.length / totalContradictions
  );

  return Math.round(
    clueRatio * 50 + inspectRatio * 15 + deductionRatio * 20 + contradictionRatio * 15
  );
}

export function computeSceneAccuracy(hits: number, misTaps: number): number {
  const total = hits + misTaps;
  if (total === 0) return 100;
  return Math.round((hits / total) * 100);
}

/**
 * Computes real, non-fabricated case completion percentage from actual discovered clues and resolution.
 * Discovering all 8 hidden clues (80%) + catching the true culprit (20%) = 100%.
 */
export function computeCaseCompletionPercentage(
  caseDef: CaseDefinition,
  save: CaseSaveState,
  solved: boolean
): number {
  const clueCount = Math.max(1, caseDef.clues.length);
  const clueFraction = Math.min(1, save.discoveredClues.length / clueCount);
  const solvedBonus = solved ? 0.2 : 0;
  return Math.min(100, Math.round(clueFraction * 80 + solvedBonus * 100));
}

export interface ScoreBreakdown {
  evidenceScore: number;       // Max 240
  deductionScore: number;      // Max 200
  interrogationScore: number;  // Max 160
  accusationScore: number;     // Max 300
  precisionBonus: number;      // Max 100
  totalScore: number;          // Max 1000
  completionPercentage: number;
  rank: 'S' | 'A' | 'B' | 'C';
  ending: CaseEnding;
}

export const CASE_001_SOLVED_SUMMARY_PARAGRAPHS: string[] = [
  'Driven by a twenty-year vendetta over his father’s ruined 1904 ironworks and desperate to silence Alexander Blackwood’s midnight embezzlement audit, personal assistant Thomas Reed unlocked the conservatory apothecary with duplicate Golden Key No. 2 and laced Alexander’s private evening wine decanter service and nightcap goblet with lethal aconite (monkshood).',
  'Every decisive exhibit locked his guilt into place: the Broken Wine Glass and private port decanter isolated the fast-acting aconite in the 11:25 PM drink Reed personally served, Golden Key No. 2 proved study-safe access, the Muddy Size 8.5 Shoeprint with crushed monkshood petals shattered his indoor alibi, the Burnt Letter exposed his forged "T.R." vouchers as the immediate motive, and the Torn 1904 Photograph unmasked him as Arthur Reed’s son.',
];

export const CASE_001_SOLVED_MOTIVE =
  'In 1904, Alexander Blackwood forced Arthur Reed & Sons Ironworks into foreclosure and seized its furnace patent. Arthur’s son, Thomas Reed, entered Blackwood Manor under a quiet clerical guise, siphoning funds via forged "T.R." shipping vouchers until Alexander uncovered the fraud in his 10:50 PM audit letter and summoned Reed for an 11:25 PM confrontation.';

export const CASE_001_SOLVED_METHOD =
  'At 11:18 PM, Thomas Reed used Duplicate Brass Key No. 2 from Alexander’s private study safe to unlock the conservatory apothecary, extracted concentrated aconite (monkshood), and poisoned Alexander’s private 11:25 PM port wine decanter and bitters goblet—causing fatal cardiac arrest at 11:32 PM.';

export const CASE_001_EVIDENCE_PROOFS: EvidenceProofEntry[] = [
  {
    clueId: 'broken_wine_glass',
    clueName: 'Wine Decanter & Broken Wine Glass',
    roleLabel: 'Means · Aconite Nightcap Service',
    explanation:
      'While the shared dinner claret was clean, lethal aconite (monkshood) was isolated in Alexander’s private 11:25 PM port decanter service and shattered crystal goblet personally carried in by Thomas Reed.',
  },
  {
    clueId: 'burnt_letter',
    clueName: 'Burnt Letter ("T.R." Audit Memo)',
    roleLabel: 'Immediate Motive · Forged Vouchers',
    explanation:
      'Surviving lines on the scorched study memo prove Alexander discovered forged wire transfers bearing clerical cipher "T.R." and ordered Reed to answer for them at 11:25 PM.',
  },
  {
    clueId: 'golden_key',
    clueName: 'Golden Key (Apothecary No. 2)',
    roleLabel: 'Access · Private Study Safe',
    explanation:
      'Proves the conservatory monkshood cabinet was opened with Duplicate Key No. 2 from the study safe—whose dial combination was shared only by Blackwood and Reed.',
  },
  {
    clueId: 'muddy_shoeprint',
    clueName: 'Muddy Shoeprint (Size 8.5 Oxford)',
    roleLabel: 'Presence · Shattered Alibi',
    explanation:
      'Places Reed’s narrow Men’s Size 8.5 Oxford shoes—embedded with conservatory peat and a crushed blue monkshood petal—re-entering via the French window at 11:18 PM.',
  },
  {
    clueId: 'torn_photograph',
    clueName: 'Torn 1904 Photograph',
    roleLabel: 'Deep Motive · Hidden Bloodline',
    explanation:
      'Inscribed on the reverse in Reed’s own executive cursive, linking him to the 1904 foreclosure of Arthur Reed & Sons Ironworks.',
  },
];

/**
 * Deterministic multi-case mystery evaluation engine.
 * Preserves Case 001 (`thomas_reed`) identically and evaluates Cases 002–005 against each case's
 * fixed `canonicalDatabase` and `solutionNarrative` without ever leaking the culprit on wrong accusations.
 */
export function evaluateAccusationAndScore(
  caseDef: CaseDefinition,
  save: CaseSaveState,
  culpritId: SuspectId,
  methodId: string | null,
  motiveId: string | null,
  selectedClues: ClueId[]
): ScoreBreakdown {
  const db = caseDef.canonicalDatabase;
  const narrative = caseDef.solutionNarrative;
  const culpritProfile = caseDef.suspects.find((s) => s.id === db.actualCulpritId);

  const isCulpritRight = culpritId === db.actualCulpritId;
  const isMethodRight = Boolean(methodId && methodId === db.canonicalMethodId);
  const isMotiveRight = Boolean(motiveId && motiveId === db.canonicalMotiveId);

  const decisiveMatches = selectedClues.filter((c) => db.decisiveClueIds.includes(c)).length;

  const evidenceScore = Math.min(
    240,
    save.discoveredClues.length * 25 + save.inspectedClues.length * 5
  );
  const deductionScore = Math.min(200, save.unlockedDeductions.length * 40);
  const interrogationScore = Math.min(160, save.exposedContradictions.length * 40);

  let accusationScore = 0;
  if (isCulpritRight) accusationScore += 140;
  if (isMethodRight) accusationScore += 65;
  if (isMotiveRight) accusationScore += 65;
  accusationScore += Math.min(30, decisiveMatches * 10);

  const accuracy = computeSceneAccuracy(save.discoveredClues.length, save.misTaps);
  const accuracyPart = Math.round((accuracy / 100) * 50);
  const hintPart = Math.max(0, 50 - save.hintsUsed * 15);
  const precisionBonus = accuracyPart + hintPart;

  const totalScore = Math.min(
    1000,
    evidenceScore + deductionScore + interrogationScore + accusationScore + precisionBonus
  );

  const completionPercentage = computeCaseCompletionPercentage(caseDef, save, isCulpritRight);

  const solvedHeadline =
    narrative?.culpritHeadline ||
    (culpritProfile ? `You caught ${culpritProfile.name}!` : 'Case Solved!');
  const solvedParagraphs =
    narrative?.epilogueParagraphs || CASE_001_SOLVED_SUMMARY_PARAGRAPHS;
  const solvedMotive = narrative?.motiveExplanation || CASE_001_SOLVED_MOTIVE;
  const solvedMethod = narrative?.methodExplanation || CASE_001_SOLVED_METHOD;
  const solvedProofs = narrative?.evidenceProofItems || CASE_001_EVIDENCE_PROOFS;

  let ending: CaseEnding;
  if (isCulpritRight && isMethodRight && isMotiveRight) {
    ending = {
      id: 'TRUE_DETECTIVE',
      solved: true,
      badge: 'CASE SOLVED',
      headline: solvedHeadline,
      epilogueParagraphs: solvedParagraphs,
      motiveExplanation: solvedMotive,
      methodExplanation: solvedMethod,
      evidenceProofItems: solvedProofs,
    };
  } else if (isCulpritRight) {
    ending = {
      id: 'CIRCUMSTANTIAL_ARREST',
      solved: true,
      badge: 'CASE SOLVED',
      headline: solvedHeadline,
      epilogueParagraphs: solvedParagraphs,
      motiveExplanation: solvedMotive,
      methodExplanation: solvedMethod,
      evidenceProofItems: solvedProofs,
    };
  } else if (
    narrative?.redHerringSuspectId &&
    culpritId === narrative.redHerringSuspectId &&
    narrative.redHerringParagraphs
  ) {
    ending = {
      id: 'FALSE_ELEANOR',
      solved: false,
      badge: 'Indictment Rejected · Misled by Red Herring',
      headline: narrative.redHerringHeadline || 'Misled by Surface Suspicion',
      epilogueParagraphs: narrative.redHerringParagraphs,
    };
  } else if (caseDef.id === 'case_001' && culpritId === 'eleanor_blackwood') {
    ending = {
      id: 'FALSE_ELEANOR',
      solved: false,
      badge: 'Indictment Rejected · Misled by Red Herring',
      headline: 'Snared by a Crimson Thread',
      epilogueParagraphs: [
        'Misled by the burgundy silk thread snagged on the head chair, you accuse Eleanor Blackwood despite her insistence that Alexander was unharmed when their quarrel ended at 11:10 PM.',
        'Forensic review of the Stopped Wristwatch (11:32 PM) and parlor-maid testimony clears her alibi—proving the fatal aconite nightcap was served fifteen minutes after Eleanor retired upstairs.',
        'Re-examine the shattered wine glass, the scorched hearth letter, and the conservatory traces in the dining room to unmask the true killer.',
      ],
    };
  } else {
    ending = {
      id: 'FALSE_OTHER',
      solved: false,
      badge: 'Indictment Rejected · Wrong Suspect',
      headline: 'The Evidence Points Elsewhere',
      epilogueParagraphs: narrative?.wrongSuspectParagraphs || [
        'Your indictment targets an innocent party whose private secret masked the true killer’s methodical preparation.',
        'Forensic comparison clears the accused against the decisive physical exhibits and verified timeline.',
        'Inspect the recovered exhibits closely, link corroborating clues on the Investigation Board, and challenge suspect alibis to identify the real culprit.',
      ],
    };
  }

  let rank: 'S' | 'A' | 'B' | 'C' = 'C';
  if (ending.id === 'TRUE_DETECTIVE' && totalScore >= 850) {
    rank = 'S';
  } else if (ending.solved && totalScore >= 680) {
    rank = 'A';
  } else if (ending.solved || totalScore >= 500) {
    rank = 'B';
  }

  return {
    evidenceScore,
    deductionScore,
    interrogationScore,
    accusationScore,
    precisionBonus,
    totalScore,
    completionPercentage,
    rank,
    ending,
  };
}

export function evaluateNewAchievements(
  profile: DetectiveProfileState,
  caseDef: CaseDefinition,
  save: CaseSaveState,
  completedSummary?: CompletedCaseSummary
): { newlyUnlockedIds: string[]; bonusXp: number } {
  const already = new Set(profile.unlockedAchievementIds);
  const newlyUnlockedIds: string[] = [];

  const tryUnlock = (id: string, condition: boolean) => {
    if (condition && !already.has(id)) {
      already.add(id);
      newlyUnlockedIds.push(id);
    }
  };

  const allDecisiveInspected = caseDef.canonicalDatabase.decisiveClueIds.every((cid) =>
    save.inspectedClues.includes(cid)
  );

  tryUnlock('first_discovery', save.discoveredClues.length >= 1);
  tryUnlock(
    'sharp_eyes',
    save.discoveredClues.length >= caseDef.clues.length &&
      computeSceneAccuracy(save.discoveredClues.length, save.misTaps) >= 85
  );
  tryUnlock(
    'master_investigator',
    allDecisiveInspected && save.unlockedDeductions.length >= 3
  );

  if (completedSummary) {
    tryUnlock('case_closed', completedSummary.solved);
    tryUnlock(
      'no_assistance',
      completedSummary.solved && completedSummary.hintsUsed === 0
    );
    tryUnlock(
      'perfect_detective',
      completedSummary.solved &&
        completedSummary.completionPercentage >= 100 &&
        allDecisiveInspected &&
        completedSummary.hintsUsed === 0
    );
  }

  const bonusXp = newlyUnlockedIds.reduce((sum, id) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    return sum + (def ? def.xpBonus : 0);
  }, 0);

  return { newlyUnlockedIds, bonusXp };
}
