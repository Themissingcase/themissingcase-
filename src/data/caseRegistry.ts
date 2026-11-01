import { CaseDefinition, PlannedCaseBlueprint } from '../types/game';
import { CASE_001 } from './case001';
import { CASE_002 } from './case002';
import { CASE_003 } from './case003';
import { CASE_004 } from './case004';
import { CASE_005 } from './case005';

/**
 * Complete Five-Case Playable Anthology Registry for THE MISSING CLUE.
 * Every single case in Season One is 100% playable end-to-end with unique hand-painted scenes,
 * bespoke hidden objects, independent local saves, and fixed deterministic culprits.
 */
export const ORDERED_CASES: CaseDefinition[] = [
  CASE_001,
  CASE_002,
  CASE_003,
  CASE_004,
  CASE_005,
];

export const PLAYABLE_CASES: Record<string, CaseDefinition> = {
  [CASE_001.id]: CASE_001,
  [CASE_002.id]: CASE_002,
  [CASE_003.id]: CASE_003,
  [CASE_004.id]: CASE_004,
  [CASE_005.id]: CASE_005,
};

export function getCaseById(caseId: string | null | undefined): CaseDefinition {
  if (caseId && PLAYABLE_CASES[caseId]) {
    return PLAYABLE_CASES[caseId];
  }
  return CASE_001;
}

export function getNextCaseInSequence(currentCaseId: string): CaseDefinition | null {
  const idx = ORDERED_CASES.findIndex((c) => c.id === currentCaseId);
  if (idx >= 0 && idx < ORDERED_CASES.length - 1) {
    return ORDERED_CASES[idx + 1];
  }
  return null;
}

/** Kept empty—zero Coming Soon or unimplemented placeholder cases remain */
export const FUTURE_CASE_BLUEPRINTS: PlannedCaseBlueprint[] = [];
