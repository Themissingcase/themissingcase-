import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, X } from 'lucide-react';
import { CASE_001 } from './data/case001';
import {
  getCaseById,
  getNextCaseInSequence,
  ORDERED_CASES,
  PLAYABLE_CASES,
} from './data/caseRegistry';
import {
  AppScreen,
  CaseCompletionRecord,
  CaseDefinition,
  CaseSaveState,
  ClueId,
  CompletedCaseSummary,
  DetectiveProfileState,
  FinalAccusationRecord,
  GameDifficulty,
  GameplayStage,
  HiddenObjectClue,
  StringConnection,
  SuspectId,
  SuspectQuestion,
} from './types/game';
import {
  ACHIEVEMENTS,
  createInitialCaseSave,
  createInitialProfile,
  gameRepository,
  getInitialBoardPositionsForCase,
  recordDailyStreakActivity,
} from './services/persistenceService';
import { soundService } from './services/soundService';
import {
  CASE_001_EVIDENCE_PROOFS,
  CASE_001_SOLVED_METHOD,
  CASE_001_SOLVED_MOTIVE,
  CASE_001_SOLVED_SUMMARY_PARAGRAPHS,
  computeSceneAccuracy,
  evaluateAccusationAndScore,
  evaluateNewAchievements,
  ScoreBreakdown,
} from './engine/mysteryEngine';
import { TopNav } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeScreen } from './components/HomeScreen';
import { CrimeSceneView } from './components/CrimeSceneView';
import { EvidenceVaultView } from './components/EvidenceVaultView';
import { InvestigationBoardView } from './components/InvestigationBoardView';
import { InterrogationView } from './components/InterrogationView';
import { AccusationView } from './components/AccusationView';
import { CaseFilesView } from './components/CaseFilesView';
import { DailyMysteryView } from './components/DailyMysteryView';
import { DetectiveProfileView } from './components/DetectiveProfileView';
import { SettingsView, AboutView } from './components/SettingsAndAboutViews';
import { EvidenceModal } from './components/EvidenceModal';
import { DetectiveNotebookModal } from './components/DetectiveNotebookModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const GAMEPLAY_STAGES: GameplayStage[] = [
  'PLAYING_SCENE',
  'PLAYING_EVIDENCE',
  'PLAYING_BOARD',
  'PLAYING_SUSPECTS',
  'PLAYING_ACCUSE',
];

function isGameplayStage(screen: AppScreen): screen is GameplayStage {
  return (GAMEPLAY_STAGES as string[]).includes(screen);
}

function isEndingSolved(summary?: CompletedCaseSummary | null): boolean {
  if (!summary) return false;
  if (typeof summary.solved === 'boolean') return summary.solved;
  return (
    summary.endingId === 'TRUE_DETECTIVE' ||
    summary.endingId === 'CIRCUMSTANTIAL_ARREST'
  );
}

function summaryToBreakdown(caseDef: CaseDefinition, saved: CompletedCaseSummary): ScoreBreakdown {
  const solved = isEndingSolved(saved);
  const narrative = caseDef.solutionNarrative;
  return {
    evidenceScore: saved.evidenceScore ?? 0,
    deductionScore: saved.deductionScore ?? 0,
    interrogationScore: saved.interrogationScore ?? 0,
    accusationScore: saved.accusationScore ?? 0,
    precisionBonus: saved.precisionBonus ?? 0,
    totalScore: saved.score,
    completionPercentage:
      saved.completionPercentage ?? saved.evidencePercent ?? (solved ? 100 : 0),
    rank: saved.rank,
    ending: {
      id: saved.endingId,
      solved,
      badge: saved.endingBadge || (solved ? 'CASE SOLVED' : 'Indictment Reviewed'),
      headline:
        saved.endingHeadline ||
        (solved
          ? narrative?.culpritHeadline || 'You caught Thomas Reed!'
          : 'Indictment Rejected'),
      epilogueParagraphs:
        saved.epilogueParagraphs && saved.epilogueParagraphs.length > 0
          ? saved.epilogueParagraphs
          : solved
          ? narrative?.epilogueParagraphs || CASE_001_SOLVED_SUMMARY_PARAGRAPHS
          : [],
      motiveExplanation:
        saved.motiveExplanation ??
        (solved ? narrative?.motiveExplanation || CASE_001_SOLVED_MOTIVE : undefined),
      methodExplanation:
        saved.methodExplanation ??
        (solved ? narrative?.methodExplanation || CASE_001_SOLVED_METHOD : undefined),
      evidenceProofItems:
        saved.evidenceProofItems ??
        (solved ? narrative?.evidenceProofItems || CASE_001_EVIDENCE_PROOFS : undefined),
    },
  };
}

function recordToBreakdown(caseDef: CaseDefinition, record: CaseCompletionRecord): ScoreBreakdown {
  const narrative = caseDef.solutionNarrative;
  return {
    evidenceScore: 240,
    deductionScore: 200,
    interrogationScore: 160,
    accusationScore: 300,
    precisionBonus: 100,
    totalScore: record.score,
    completionPercentage: record.completionPercentage ?? 100,
    rank: record.rank || 'A',
    ending: {
      id: 'TRUE_DETECTIVE',
      solved: true,
      badge: 'CASE SOLVED',
      headline: narrative?.culpritHeadline || 'You caught Thomas Reed!',
      epilogueParagraphs:
        narrative?.epilogueParagraphs || CASE_001_SOLVED_SUMMARY_PARAGRAPHS,
      motiveExplanation: narrative?.motiveExplanation || CASE_001_SOLVED_MOTIVE,
      methodExplanation: narrative?.methodExplanation || CASE_001_SOLVED_METHOD,
      evidenceProofItems: narrative?.evidenceProofItems || CASE_001_EVIDENCE_PROOFS,
    },
  };
}

function loadAllCaseSaves(
  preferredDifficulty: GameDifficulty,
  solvedCaseIds: string[]
): Record<string, CaseSaveState> {
  const map: Record<string, CaseSaveState> = {};
  ORDERED_CASES.forEach((c) => {
    const loaded =
      gameRepository.loadCaseSave(c.id) ||
      createInitialCaseSave(c.id, preferredDifficulty);
    if (
      (isEndingSolved(loaded.completedEnding) || solvedCaseIds.includes(c.id)) &&
      !loaded.isCompleted
    ) {
      const synced = { ...loaded, isCompleted: true };
      gameRepository.saveCaseState(synced);
      map[c.id] = synced;
    } else {
      map[c.id] = loaded;
    }
  });
  return map;
}

export default function App() {
  const submissionLockRef = useRef(false);

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [achievementBanner, setAchievementBanner] = useState<string | null>(null);

  const [profile, setProfile] = useState<DetectiveProfileState>(() => {
    const loaded = gameRepository.loadProfile();
    soundService.configure({
      enabled: loaded.soundEnabled,
      musicEnabled: loaded.musicEnabled,
      masterVolume: loaded.masterVolume,
      musicVolume: loaded.musicVolume,
      sfxVolume: loaded.sfxVolume,
    });

    const syncedSolvedIds = new Set(loaded.solvedCaseIds);
    ORDERED_CASES.forEach((c) => {
      const savedCase = gameRepository.loadCaseSave(c.id);
      const rated = loaded.caseRatings[c.id];
      const actuallySolved =
        Boolean(savedCase?.isCompleted) ||
        Boolean(savedCase?.originalCompletionRecord) ||
        Boolean(loaded.caseRecords[c.id]) ||
        isEndingSolved(savedCase?.completedEnding) ||
        isEndingSolved(rated);
      if (actuallySolved) {
        syncedSolvedIds.add(c.id);
      }
    });

    if (syncedSolvedIds.size !== loaded.solvedCaseIds.length) {
      const synced: DetectiveProfileState = {
        ...loaded,
        solvedCaseIds: Array.from(syncedSolvedIds),
      };
      gameRepository.saveProfile(synced);
      return synced;
    }
    return loaded;
  });

  const [caseSavesById, setCaseSavesById] = useState<Record<string, CaseSaveState>>(() =>
    loadAllCaseSaves(profile.preferredDifficulty, profile.solvedCaseIds)
  );

  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
    if (profile.activeCaseId && PLAYABLE_CASES[profile.activeCaseId]) {
      return profile.activeCaseId;
    }
    const firstUnfinished = ORDERED_CASES.find(
      (c) => !profile.solvedCaseIds.includes(c.id)
    );
    return firstUnfinished ? firstUnfinished.id : 'case_001';
  });

  const activeCase = useMemo(() => getCaseById(activeCaseId), [activeCaseId]);
  const caseSave = useMemo(
    () =>
      caseSavesById[activeCase.id] ||
      createInitialCaseSave(activeCase.id, profile.preferredDifficulty),
    [activeCase.id, caseSavesById, profile.preferredDifficulty]
  );

  const [inspectingClue, setInspectingClue] = useState<HiddenObjectClue | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(false);

  const deriveBreakdownForCase = useCallback(
    (cId: string, savesMap: Record<string, CaseSaveState>, prof: DetectiveProfileState): ScoreBreakdown | null => {
      const cDef = getCaseById(cId);
      const saved = savesMap[cId];
      if (saved?.completedEnding) {
        return summaryToBreakdown(cDef, saved.completedEnding);
      }
      if (saved?.isReplaySession) {
        return null;
      }
      const best = saved?.bestCompletionSummary || prof.caseRatings[cId];
      if (best && isEndingSolved(best) && saved?.status === 'COMPLETED') {
        return summaryToBreakdown(cDef, best);
      }
      return null;
    },
    []
  );

  const [latestBreakdown, setLatestBreakdown] = useState<ScoreBreakdown | null>(() =>
    deriveBreakdownForCase(activeCaseId, caseSavesById, profile)
  );

  const isCaseCompleted = useCallback(
    (cId: string) => {
      const s = caseSavesById[cId];
      return Boolean(
        s?.isCompleted ||
          s?.originalCompletionRecord ||
          isEndingSolved(s?.completedEnding) ||
          profile.solvedCaseIds.includes(cId) ||
          profile.caseRecords[cId]
      );
    },
    [caseSavesById, profile.caseRecords, profile.solvedCaseIds]
  );

  const hasCaseUnfinishedProgress = useCallback(
    (cId: string) => {
      if (isCaseCompleted(cId)) return false;
      const s = caseSavesById[cId];
      if (!s) return false;
      return (
        s.status === 'IN_PROGRESS' ||
        s.discoveredClues.length > 0 ||
        s.connections.length > 0 ||
        s.askedQuestions.length > 0 ||
        s.notebookNotes.trim().length > 0 ||
        s.briefingSeen
      );
    },
    [caseSavesById, isCaseCompleted]
  );

  // Determine the spotlight case for HomeScreen & TopNav (never auto-resumes a completed case)
  const { spotlightCase, hasAnyUnfinishedCase, allCasesCompleted, solvedCasesCount } = useMemo(() => {
    const solvedCount = ORDERED_CASES.filter((c) => isCaseCompleted(c.id)).length;
    const allSolved = solvedCount >= ORDERED_CASES.length;

    // 1. Prefer profile.activeCaseId if unfinished
    if (
      profile.activeCaseId &&
      PLAYABLE_CASES[profile.activeCaseId] &&
      hasCaseUnfinishedProgress(profile.activeCaseId)
    ) {
      return {
        spotlightCase: getCaseById(profile.activeCaseId),
        hasAnyUnfinishedCase: true,
        allCasesCompleted: allSolved,
        solvedCasesCount: solvedCount,
      };
    }

    // 2. Otherwise check any case with unfinished initial progress
    const anyInProgress = ORDERED_CASES.find((c) => hasCaseUnfinishedProgress(c.id));
    if (anyInProgress) {
      return {
        spotlightCase: anyInProgress,
        hasAnyUnfinishedCase: true,
        allCasesCompleted: allSolved,
        solvedCasesCount: solvedCount,
      };
    }

    // 3. Otherwise offer the first uncompleted case in sequence (Case 001 -> 002 -> 003 -> 004 -> 005)
    const firstUnsolved = ORDERED_CASES.find((c) => !isCaseCompleted(c.id));
    return {
      spotlightCase: firstUnsolved || CASE_001,
      hasAnyUnfinishedCase: false,
      allCasesCompleted: allSolved,
      solvedCasesCount: solvedCount,
    };
  }, [hasCaseUnfinishedProgress, isCaseCompleted, profile.activeCaseId]);

  const announceAchievements = useCallback((unlockedIds: string[]) => {
    if (unlockedIds.length === 0) return;
    const titles = unlockedIds
      .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.title)
      .filter(Boolean);
    if (titles.length > 0) {
      setAchievementBanner(`Achievement Unlocked: ${titles.join(' · ')}`);
    }
  }, []);

  useEffect(() => {
    if (!achievementBanner) return;
    const t = window.setTimeout(() => setAchievementBanner(null), 4500);
    return () => window.clearTimeout(t);
  }, [achievementBanner]);

  // Screen-based soundtrack switching (`main_theme.mp3` vs `crime_scene.mp3`)
  useEffect(() => {
    if (currentScreen === 'PLAYING_SCENE') {
      soundService.setAtmosphereMode('CRIME_SCENE');
    } else if (currentScreen === 'PLAYING_ACCUSE' && latestBreakdown?.ending.solved) {
      soundService.setAtmosphereMode('REVELATION');
    } else if (currentScreen.startsWith('PLAYING_')) {
      soundService.setAtmosphereMode('INVESTIGATION');
    } else {
      soundService.setAtmosphereMode('MENU');
    }
  }, [currentScreen, latestBreakdown?.ending.solved]);

  const updateSingleCaseSave = useCallback(
    (caseId: string, updater: (prev: CaseSaveState) => CaseSaveState) => {
      setCaseSavesById((prevMap) => {
        const current =
          prevMap[caseId] || createInitialCaseSave(caseId, profile.preferredDifficulty);
        const next = updater(current);
        gameRepository.saveCaseState(next);
        return { ...prevMap, [caseId]: next };
      });
    },
    [profile.preferredDifficulty]
  );

  // Active investigation clock (pauses automatically once current run has a solved ending)
  const isActivelyInvestigating =
    currentScreen.startsWith('PLAYING_') && !isEndingSolved(caseSave.completedEnding);

  useEffect(() => {
    if (!isActivelyInvestigating) return;
    const interval = window.setInterval(() => {
      updateSingleCaseSave(activeCase.id, (prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
      setProfile((prev) => {
        const updated: DetectiveProfileState = {
          ...prev,
          totalInvestigationSeconds: prev.totalInvestigationSeconds + 1,
        };
        gameRepository.saveProfile(updated);
        return updated;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeCase.id, isActivelyInvestigating, updateSingleCaseSave]);

  const handleNavigate = useCallback(
    (screen: AppScreen) => {
      soundService.playSceneTransition();
      setCurrentScreen(screen);

      if (isGameplayStage(screen)) {
        updateSingleCaseSave(activeCase.id, (prev) => {
          if (isEndingSolved(prev.completedEnding)) {
            return prev;
          }
          return {
            ...prev,
            status: prev.status === 'COMPLETED' && !prev.isReplaySession ? 'COMPLETED' : 'IN_PROGRESS',
            currentStage: screen,
          };
        });
      }

      if (screen !== 'PLAYING_SCENE') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [activeCase.id, updateSingleCaseSave]
  );

  /** Starts a new case or resumes an unfinished case/replay */
  const handleStartOrContinueCase = useCallback(
    (targetCaseId: string) => {
      soundService.playSceneTransition();
      const targetSave =
        caseSavesById[targetCaseId] ||
        createInitialCaseSave(targetCaseId, profile.preferredDifficulty);

      setActiveCaseId(targetCaseId);
      setInspectingClue(null);
      setNotebookOpen(false);
      setLatestBreakdown(deriveBreakdownForCase(targetCaseId, caseSavesById, profile));

      const hasStarted =
        targetSave.status === 'IN_PROGRESS' ||
        targetSave.discoveredClues.length > 0 ||
        targetSave.briefingSeen ||
        targetSave.isReplaySession;

      const targetStage: GameplayStage =
        hasStarted &&
        targetSave.currentStage &&
        isGameplayStage(targetSave.currentStage) &&
        !isEndingSolved(targetSave.completedEnding)
          ? targetSave.currentStage
          : 'PLAYING_SCENE';

      updateSingleCaseSave(targetCaseId, (prev) => ({
        ...prev,
        status: prev.status === 'COMPLETED' && !prev.isReplaySession ? 'COMPLETED' : 'IN_PROGRESS',
        currentStage: targetStage,
        difficulty: prev.difficulty || profile.preferredDifficulty,
      }));

      setProfile((prev) => {
        const updated: DetectiveProfileState = {
          ...recordDailyStreakActivity(prev),
          activeCaseId: isCaseCompleted(targetCaseId) ? prev.activeCaseId : targetCaseId,
        };
        gameRepository.saveProfile(updated);
        return updated;
      });

      setCurrentScreen(targetStage);
      if (targetStage !== 'PLAYING_SCENE') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [caseSavesById, deriveBreakdownForCase, isCaseCompleted, profile, updateSingleCaseSave]
  );

  /** Restarts a completed case from its opening introduction without deleting original completion records */
  const handleReplayCase = useCallback(
    (targetCaseId: string) => {
      soundService.playSceneTransition();
      const replaySave = gameRepository.startCaseReplay(
        targetCaseId,
        profile.preferredDifficulty
      );
      const preservedSave: CaseSaveState = isCaseCompleted(targetCaseId)
        ? { ...replaySave, isCompleted: true, isReplaySession: true }
        : replaySave;
      gameRepository.saveCaseState(preservedSave);

      setCaseSavesById((prev) => ({
        ...prev,
        [targetCaseId]: preservedSave,
      }));
      setActiveCaseId(targetCaseId);
      setInspectingClue(null);
      setNotebookOpen(false);
      setLatestBreakdown(null);

      setProfile((prev) => {
        const updated = recordDailyStreakActivity(prev);
        gameRepository.saveProfile(updated);
        return updated;
      });

      setCurrentScreen('PLAYING_SCENE');
    },
    [isCaseCompleted, profile.preferredDifficulty]
  );

  const handleViewSolvedDossier = useCallback(
    (targetCaseId: string) => {
      soundService.playSceneTransition();
      const cDef = getCaseById(targetCaseId);
      const saved = caseSavesById[targetCaseId];
      setActiveCaseId(targetCaseId);

      const bestSolved =
        (isEndingSolved(saved?.completedEnding) ? saved.completedEnding : null) ||
        (isEndingSolved(saved?.bestCompletionSummary) ? saved.bestCompletionSummary : null) ||
        (isEndingSolved(profile.caseRatings[targetCaseId])
          ? profile.caseRatings[targetCaseId]
          : null);

      if (bestSolved) {
        setLatestBreakdown(summaryToBreakdown(cDef, bestSolved));
      } else {
        const record =
          profile.caseRecords[targetCaseId] || saved?.originalCompletionRecord;
        if (record) {
          setLatestBreakdown(recordToBreakdown(cDef, record));
        }
      }

      setCurrentScreen('PLAYING_ACCUSE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [caseSavesById, profile.caseRatings, profile.caseRecords]
  );

  const handlePrimaryHomePlay = useCallback(() => {
    if (allCasesCompleted && !hasAnyUnfinishedCase) {
      handleNavigate('CASE_FILES');
      return;
    }
    handleStartOrContinueCase(spotlightCase.id);
  }, [allCasesCompleted, handleNavigate, handleStartOrContinueCase, hasAnyUnfinishedCase, spotlightCase.id]);

  const handleDismissBriefing = () => {
    soundService.playTap();
    updateSingleCaseSave(activeCase.id, (prev) => ({
      ...prev,
      status: prev.status === 'COMPLETED' && !prev.isReplaySession ? 'COMPLETED' : 'IN_PROGRESS',
      currentStage: 'PLAYING_SCENE',
      briefingSeen: true,
    }));
    setProfile((prev) => {
      const nextProfile: DetectiveProfileState = {
        ...recordDailyStreakActivity(prev),
        activeCaseId: isCaseCompleted(activeCase.id) ? prev.activeCaseId : activeCase.id,
      };
      gameRepository.saveProfile(nextProfile);
      return nextProfile;
    });
  };

  const handleUpdateNotebook = useCallback(
    (notes: string) => {
      updateSingleCaseSave(activeCase.id, (prev) => ({
        ...prev,
        notebookNotes: notes,
      }));
    },
    [activeCase.id, updateSingleCaseSave]
  );

  const handleDiscoverClue = useCallback(
    (clueId: ClueId) => {
      const current = caseSavesById[activeCase.id] || caseSave;
      if (current.discoveredClues.includes(clueId)) return;

      soundService.playObjectFound();
      const nextSave: CaseSaveState = {
        ...current,
        status: current.status === 'COMPLETED' && !current.isReplaySession ? 'COMPLETED' : 'IN_PROGRESS',
        currentStage: 'PLAYING_SCENE',
        briefingSeen: true,
        discoveredClues: [...current.discoveredClues, clueId],
      };

      gameRepository.saveCaseState(nextSave);
      setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));

      setProfile((prevProf) => {
        const streaked = recordDailyStreakActivity(prevProf);
        const baseProf: DetectiveProfileState = {
          ...streaked,
          totalXp: streaked.totalXp + 25,
          totalSceneHits: streaked.totalSceneHits + 1,
        };
        const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
          baseProf,
          activeCase,
          nextSave
        );
        if (newlyUnlockedIds.length > 0) {
          announceAchievements(newlyUnlockedIds);
        }
        const finalProf: DetectiveProfileState = {
          ...baseProf,
          totalXp: baseProf.totalXp + bonusXp,
          unlockedAchievementIds: [
            ...baseProf.unlockedAchievementIds,
            ...newlyUnlockedIds,
          ],
        };
        gameRepository.saveProfile(finalProf);
        return finalProf;
      });
    },
    [activeCase, announceAchievements, caseSave, caseSavesById]
  );

  const handleRecordMisTap = useCallback(() => {
    soundService.playMissTap();
    updateSingleCaseSave(activeCase.id, (prev) => ({
      ...prev,
      misTaps: prev.misTaps + 1,
    }));
    setProfile((prev) => {
      const next: DetectiveProfileState = {
        ...prev,
        totalSceneMisTaps: prev.totalSceneMisTaps + 1,
      };
      gameRepository.saveProfile(next);
      return next;
    });
  }, [activeCase.id, updateSingleCaseSave]);

  const handleUseHint = useCallback(
    (clueId: ClueId, nextLevel: 1 | 2 | 3) => {
      soundService.playDetectivesEye();
      updateSingleCaseSave(activeCase.id, (prev) => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        hintLevelsByClue: {
          ...(prev.hintLevelsByClue || {}),
          [clueId]: nextLevel,
        },
      }));
      setProfile((prev) => {
        const next: DetectiveProfileState = {
          ...prev,
          totalHintsUsed: prev.totalHintsUsed + 1,
        };
        gameRepository.saveProfile(next);
        return next;
      });
    },
    [activeCase.id, updateSingleCaseSave]
  );

  const handleInspectClue = useCallback(
    (clue: HiddenObjectClue) => {
      const current = caseSavesById[activeCase.id] || caseSave;
      const isFirstInspection = !current.inspectedClues.includes(clue.id);

      if (isFirstInspection) {
        soundService.playEvidenceFound();
      } else {
        soundService.playTap();
      }

      setInspectingClue(clue);
      if (!isFirstInspection) return;

      const nextSave: CaseSaveState = {
        ...current,
        inspectedClues: [...current.inspectedClues, clue.id],
      };
      gameRepository.saveCaseState(nextSave);
      setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));

      setProfile((prevProf) => {
        const baseProf: DetectiveProfileState = {
          ...prevProf,
          totalXp: prevProf.totalXp + 15,
        };
        const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
          baseProf,
          activeCase,
          nextSave
        );
        if (newlyUnlockedIds.length > 0) {
          announceAchievements(newlyUnlockedIds);
        }
        const finalProf: DetectiveProfileState = {
          ...baseProf,
          totalXp: baseProf.totalXp + bonusXp,
          unlockedAchievementIds: [
            ...baseProf.unlockedAchievementIds,
            ...newlyUnlockedIds,
          ],
        };
        gameRepository.saveProfile(finalProf);
        return finalProf;
      });
    },
    [activeCase, announceAchievements, caseSave, caseSavesById]
  );

  const handleMoveBoardNode = useCallback(
    (nodeId: string, x: number, y: number) => {
      updateSingleCaseSave(activeCase.id, (prev) => ({
        ...prev,
        boardPositions: {
          ...prev.boardPositions,
          [nodeId]: { x, y },
        },
      }));
    },
    [activeCase.id, updateSingleCaseSave]
  );

  const handleConnectBoardNodes = useCallback(
    (fromId: string, toId: string) => {
      const pairKey = [fromId, toId].sort().join('__');
      const existing = caseSave.connections.find(
        (c) => [c.fromId, c.toId].sort().join('__') === pairKey
      );

      if (existing) {
        const nextSave: CaseSaveState = {
          ...caseSave,
          connections: caseSave.connections.filter((c) => c.id !== existing.id),
        };
        gameRepository.saveCaseState(nextSave);
        setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));
        soundService.playTap();
        return { status: 'REMOVED' as const };
      }

      const matchedRule = activeCase.deductionRules.find((r) => {
        const ruleKey = [...r.pair].sort().join('__');
        return ruleKey === pairKey;
      });

      const newConn: StringConnection = {
        id: `conn_${Date.now()}`,
        fromId,
        toId,
        deductionId: matchedRule?.id,
      };

      const isNewDeduction =
        matchedRule && !caseSave.unlockedDeductions.includes(matchedRule.id);

      const nextSave: CaseSaveState = {
        ...caseSave,
        connections: [...caseSave.connections, newConn],
        unlockedDeductions: isNewDeduction
          ? [...caseSave.unlockedDeductions, matchedRule.id]
          : caseSave.unlockedDeductions,
      };

      gameRepository.saveCaseState(nextSave);
      setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));

      if (isNewDeduction) {
        soundService.playEvidenceFound();
        setProfile((prevProf) => {
          const baseProf = { ...prevProf, totalXp: prevProf.totalXp + 40 };
          const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
            baseProf,
            activeCase,
            nextSave
          );
          if (newlyUnlockedIds.length > 0) {
            announceAchievements(newlyUnlockedIds);
          }
          const finalProf: DetectiveProfileState = {
            ...baseProf,
            totalXp: baseProf.totalXp + bonusXp,
            unlockedAchievementIds: [
              ...baseProf.unlockedAchievementIds,
              ...newlyUnlockedIds,
            ],
          };
          gameRepository.saveProfile(finalProf);
          return finalProf;
        });
      } else {
        soundService.playTap();
      }

      return {
        status: 'ADDED' as const,
        unlockedTitle: matchedRule?.title,
      };
    },
    [activeCase, announceAchievements, caseSave]
  );

  const handleRemoveConnection = useCallback(
    (connectionId: string) => {
      soundService.playTap();
      updateSingleCaseSave(activeCase.id, (prev) => ({
        ...prev,
        connections: prev.connections.filter((c) => c.id !== connectionId),
      }));
    },
    [activeCase.id, updateSingleCaseSave]
  );

  const handleResetBoardLayout = useCallback(() => {
    soundService.playTap();
    updateSingleCaseSave(activeCase.id, (prev) => ({
      ...prev,
      boardPositions: getInitialBoardPositionsForCase(activeCase.id),
    }));
  }, [activeCase.id, updateSingleCaseSave]);

  const handleAskQuestion = useCallback(
    (suspectId: SuspectId, question: SuspectQuestion) => {
      soundService.playTap();
      const key = `${suspectId}:${question.id}`;
      updateSingleCaseSave(activeCase.id, (prev) => {
        const nextAsked = prev.askedQuestions.includes(key)
          ? prev.askedQuestions
          : [...prev.askedQuestions, key];
        const nextComposure = question.composureShift
          ? { ...prev.suspectComposure, [suspectId]: question.composureShift }
          : prev.suspectComposure;
        return {
          ...prev,
          askedQuestions: nextAsked,
          suspectComposure: nextComposure,
        };
      });
    },
    [activeCase.id, updateSingleCaseSave]
  );

  const handlePresentEvidence = useCallback(
    (suspectId: SuspectId, clueId: ClueId) => {
      const suspect = activeCase.suspects.find((s) => s.id === suspectId)!;
      const reaction = suspect.evidenceReactions[clueId];
      const presentKey = `${suspectId}:${clueId}`;

      if (!reaction) {
        soundService.playTap();
        const fallback = `I have nothing further to add about the ${
          activeCase.clues.find((c) => c.id === clueId)?.name.toLowerCase() || 'item'
        }, Inspector.`;
        updateSingleCaseSave(activeCase.id, (prev) => ({
          ...prev,
          presentedEvidence: prev.presentedEvidence.includes(presentKey)
            ? prev.presentedEvidence
            : [...prev.presentedEvidence, presentKey],
        }));
        return { response: fallback, exposesContradiction: false };
      }

      const contradictionId = reaction.contradictionId || presentKey;
      const isNewContradiction =
        Boolean(reaction.exposesContradiction) &&
        !caseSave.exposedContradictions.includes(contradictionId);

      if (reaction.exposesContradiction) {
        soundService.playEvidenceFound();
      } else {
        soundService.playTap();
      }

      const nextSave: CaseSaveState = {
        ...caseSave,
        presentedEvidence: caseSave.presentedEvidence.includes(presentKey)
          ? caseSave.presentedEvidence
          : [...caseSave.presentedEvidence, presentKey],
        exposedContradictions:
          reaction.exposesContradiction &&
          !caseSave.exposedContradictions.includes(contradictionId)
            ? [...caseSave.exposedContradictions, contradictionId]
            : caseSave.exposedContradictions,
        suspectComposure: reaction.composureShift
          ? { ...caseSave.suspectComposure, [suspectId]: reaction.composureShift }
          : caseSave.suspectComposure,
      };

      gameRepository.saveCaseState(nextSave);
      setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));

      if (isNewContradiction) {
        setProfile((prevProf) => {
          const baseProf = { ...prevProf, totalXp: prevProf.totalXp + 45 };
          const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
            baseProf,
            activeCase,
            nextSave
          );
          if (newlyUnlockedIds.length > 0) {
            announceAchievements(newlyUnlockedIds);
          }
          const finalProf: DetectiveProfileState = {
            ...baseProf,
            totalXp: baseProf.totalXp + bonusXp,
            unlockedAchievementIds: [
              ...baseProf.unlockedAchievementIds,
              ...newlyUnlockedIds,
            ],
          };
          gameRepository.saveProfile(finalProf);
          return finalProf;
        });
      }

      return {
        response: reaction.response,
        exposesContradiction: Boolean(reaction.exposesContradiction),
        contradictionTitle: reaction.contradictionTitle,
      };
    },
    [activeCase, announceAchievements, caseSave, updateSingleCaseSave]
  );

  const handleSubmitAccusation = useCallback(
    (
      culpritId: SuspectId,
      methodId: string | null,
      motiveId: string | null,
      selectedClues: ClueId[]
    ) => {
      if (submissionLockRef.current) return;
      submissionLockRef.current = true;
      window.setTimeout(() => {
        submissionLockRef.current = false;
      }, 400);

      const nowIso = new Date().toISOString();
      const breakdown = evaluateAccusationAndScore(
        activeCase,
        caseSave,
        culpritId,
        methodId,
        motiveId,
        selectedClues
      );

      if (breakdown.ending.solved) {
        soundService.playCaseSolvedFanfare();
      } else {
        soundService.playTap();
      }

      setLatestBreakdown(breakdown);

      const accusationRecord: FinalAccusationRecord = {
        culpritId,
        methodId,
        motiveId,
        selectedClues,
        submittedAt: nowIso,
      };

      const wasReplayRun = Boolean(caseSave.isReplaySession);

      const summary: CompletedCaseSummary = {
        caseId: activeCase.id,
        solved: breakdown.ending.solved,
        isReplayCompletion: wasReplayRun,
        accusedSuspectId: culpritId,
        endingId: breakdown.ending.id,
        endingBadge: breakdown.ending.badge,
        endingHeadline: breakdown.ending.headline,
        epilogueParagraphs: breakdown.ending.epilogueParagraphs,
        motiveExplanation: breakdown.ending.motiveExplanation,
        methodExplanation: breakdown.ending.methodExplanation,
        evidenceProofItems: breakdown.ending.evidenceProofItems,
        completionPercentage: breakdown.completionPercentage,
        score: breakdown.totalScore,
        evidenceScore: breakdown.evidenceScore,
        deductionScore: breakdown.deductionScore,
        interrogationScore: breakdown.interrogationScore,
        accusationScore: breakdown.accusationScore,
        precisionBonus: breakdown.precisionBonus,
        rank: breakdown.rank,
        accuracyPercent: computeSceneAccuracy(
          caseSave.discoveredClues.length,
          caseSave.misTaps
        ),
        evidencePercent: Math.round(
          (caseSave.discoveredClues.length / activeCase.clues.length) * 100
        ),
        hintsUsed: caseSave.hintsUsed,
        elapsedSeconds: caseSave.elapsedSeconds,
        completedAt: nowIso,
      };

      // Never overwrite originalCompletionRecord once set!
      const preservedOriginalRecord: CaseCompletionRecord | null =
        caseSave.originalCompletionRecord ||
        profile.caseRecords[activeCase.id] ||
        (summary.solved
          ? {
              caseId: activeCase.id,
              status: 'COMPLETED',
              firstCompletedAt: nowIso,
              completionPercentage: breakdown.completionPercentage,
              elapsedSeconds: caseSave.elapsedSeconds,
              hintsUsed: caseSave.hintsUsed,
              score: breakdown.totalScore,
              rank: breakdown.rank,
              finalAccusation: accusationRecord,
            }
          : null);

      const existingBest =
        caseSave.bestCompletionSummary || profile.caseRatings[activeCase.id] || null;
      const nextBestSummary: CompletedCaseSummary | null = summary.solved
        ? !existingBest || !isEndingSolved(existingBest) || summary.score >= existingBest.score
          ? summary
          : existingBest
        : existingBest;

      const nextLastReplay: CompletedCaseSummary | null =
        wasReplayRun && summary.solved
          ? summary
          : caseSave.lastReplaySummary ?? null;

      const nextSave: CaseSaveState = {
        ...caseSave,
        status: summary.solved ? 'COMPLETED' : 'IN_PROGRESS',
        currentStage: 'PLAYING_ACCUSE',
        isCompleted: Boolean(caseSave.isCompleted || summary.solved),
        isReplaySession: summary.solved ? false : caseSave.isReplaySession,
        finalAccusation: accusationRecord,
        completionScore: summary.solved
          ? Math.max(caseSave.completionScore ?? 0, breakdown.totalScore)
          : caseSave.completionScore,
        completionDate: summary.solved
          ? caseSave.completionDate || nowIso
          : caseSave.completionDate,
        completedEnding: summary,
        originalCompletionRecord: preservedOriginalRecord,
        bestCompletionSummary: nextBestSummary,
        lastReplaySummary: nextLastReplay,
      };

      gameRepository.saveCaseState(nextSave);
      setCaseSavesById((prev) => ({ ...prev, [activeCase.id]: nextSave }));

      setProfile((prevProf) => {
        const endingTag = `${activeCase.id}:${breakdown.ending.id}`;
        const alreadyRecordedEnding = prevProf.unlockedEndings.includes(endingTag);
        const alreadySolvedCase = prevProf.solvedCaseIds.includes(activeCase.id);

        let xpAward = 0;
        if (summary.solved && !alreadySolvedCase) {
          xpAward = breakdown.ending.id === 'TRUE_DETECTIVE' ? 220 : 180;
        } else if (!alreadyRecordedEnding) {
          xpAward = summary.solved ? 40 : 15;
        }

        const prevBest = prevProf.caseRatings[activeCase.id];
        let nextCaseRatings = prevProf.caseRatings;
        if (summary.solved) {
          const shouldReplace =
            !prevBest || !isEndingSolved(prevBest) || summary.score >= prevBest.score;
          if (shouldReplace) {
            nextCaseRatings = {
              ...prevProf.caseRatings,
              [activeCase.id]: summary,
            };
          }
        }

        const nextCaseRecords = { ...prevProf.caseRecords };
        if (summary.solved && !nextCaseRecords[activeCase.id] && preservedOriginalRecord) {
          nextCaseRecords[activeCase.id] = preservedOriginalRecord;
        }

        const baseProf: DetectiveProfileState = {
          ...recordDailyStreakActivity(prevProf),
          activeCaseId:
            summary.solved && prevProf.activeCaseId === activeCase.id
              ? null
              : prevProf.activeCaseId,
          caseRecords: nextCaseRecords,
          totalXp: prevProf.totalXp + xpAward,
          solvedCaseIds:
            summary.solved && !alreadySolvedCase
              ? [...prevProf.solvedCaseIds, activeCase.id]
              : prevProf.solvedCaseIds,
          caseRatings: nextCaseRatings,
          unlockedEndings: alreadyRecordedEnding
            ? prevProf.unlockedEndings
            : [...prevProf.unlockedEndings, endingTag],
        };

        const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
          baseProf,
          activeCase,
          nextSave,
          summary
        );
        if (newlyUnlockedIds.length > 0) {
          announceAchievements(newlyUnlockedIds);
        }

        const finalProf: DetectiveProfileState = {
          ...baseProf,
          totalXp: baseProf.totalXp + bonusXp,
          unlockedAchievementIds: [
            ...baseProf.unlockedAchievementIds,
            ...newlyUnlockedIds,
          ],
        };
        gameRepository.saveProfile(finalProf);
        return finalProf;
      });
    },
    [activeCase, announceAchievements, caseSave, profile.caseRatings, profile.caseRecords]
  );

  const handleSolveDaily = useCallback(
    (dailyId: string) => {
      soundService.playEvidenceFound();
      setProfile((prevProf) => {
        if (prevProf.completedDailyIds.includes(dailyId)) {
          return prevProf;
        }
        const streaked = recordDailyStreakActivity(prevProf);
        const baseProf: DetectiveProfileState = {
          ...streaked,
          totalXp: streaked.totalXp + 100,
          completedDailyIds: [...streaked.completedDailyIds, dailyId],
        };
        const { newlyUnlockedIds, bonusXp } = evaluateNewAchievements(
          baseProf,
          activeCase,
          caseSave
        );
        if (newlyUnlockedIds.length > 0) {
          announceAchievements(newlyUnlockedIds);
        }
        const finalProf: DetectiveProfileState = {
          ...baseProf,
          totalXp: baseProf.totalXp + bonusXp,
          unlockedAchievementIds: [
            ...baseProf.unlockedAchievementIds,
            ...newlyUnlockedIds,
          ],
        };
        gameRepository.saveProfile(finalProf);
        return finalProf;
      });
    },
    [activeCase, announceAchievements, caseSave]
  );

  const handleUpdateDetectiveName = (name: string) => {
    setProfile((prev) => {
      const next: DetectiveProfileState = { ...prev, detectiveName: name };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleToggleSound = () => {
    setProfile((prev) => {
      const nextEnabled = !prev.soundEnabled;
      soundService.setEnabled(nextEnabled);
      const next: DetectiveProfileState = { ...prev, soundEnabled: nextEnabled };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleToggleMusic = () => {
    setProfile((prev) => {
      const nextMusic = !prev.musicEnabled;
      soundService.setMusicEnabled(nextMusic);
      const next: DetectiveProfileState = { ...prev, musicEnabled: nextMusic };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleChangeMasterVolume = (vol: number) => {
    soundService.setMasterVolume(vol);
    setProfile((prev) => {
      const next: DetectiveProfileState = { ...prev, masterVolume: vol };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleChangeMusicVolume = (vol: number) => {
    soundService.setMusicVolume(vol);
    setProfile((prev) => {
      const next: DetectiveProfileState = { ...prev, musicVolume: vol };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleChangeSfxVolume = (vol: number) => {
    soundService.setSfxVolume(vol);
    setProfile((prev) => {
      const next: DetectiveProfileState = { ...prev, sfxVolume: vol };
      gameRepository.saveProfile(next);
      return next;
    });
  };

  const handleChangeDifficulty = (difficulty: GameDifficulty) => {
    soundService.playTap();
    setProfile((prev) => {
      const next: DetectiveProfileState = { ...prev, preferredDifficulty: difficulty };
      gameRepository.saveProfile(next);
      return next;
    });
    updateSingleCaseSave(activeCase.id, (prev) => ({
      ...prev,
      difficulty,
    }));
  };

  const handleResetAllData = () => {
    gameRepository.resetAllProgress();
    const freshProfile = createInitialProfile();
    const freshMap: Record<string, CaseSaveState> = {};
    ORDERED_CASES.forEach((c) => {
      freshMap[c.id] = createInitialCaseSave(c.id, freshProfile.preferredDifficulty);
    });
    soundService.configure({
      enabled: freshProfile.soundEnabled,
      musicEnabled: freshProfile.musicEnabled,
      masterVolume: freshProfile.masterVolume,
      musicVolume: freshProfile.musicVolume,
      sfxVolume: freshProfile.sfxVolume,
    });
    setCaseSavesById(freshMap);
    setActiveCaseId('case_001');
    setProfile(freshProfile);
    setLatestBreakdown(null);
    setCurrentScreen('HOME');
  };

  const handleNextCaseAfterSolved = useCallback(() => {
    const nextCase = getNextCaseInSequence(activeCase.id);
    if (nextCase) {
      if (isCaseCompleted(nextCase.id)) {
        handleNavigate('CASE_FILES');
      } else {
        handleStartOrContinueCase(nextCase.id);
      }
    } else {
      handleNavigate('CASE_FILES');
    }
  }, [activeCase.id, handleNavigate, handleStartOrContinueCase, isCaseCompleted]);

  const spotlightSave =
    caseSavesById[spotlightCase.id] ||
    createInitialCaseSave(spotlightCase.id, profile.preferredDifficulty);

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'HOME':
        return (
          <HomeScreen
            heroImageUrl={CASE_001.heroImageUrl}
            spotlightCase={spotlightCase}
            spotlightSave={spotlightSave}
            profile={profile}
            hasUnfinishedCase={hasAnyUnfinishedCase}
            allCasesCompleted={allCasesCompleted}
            solvedCasesCount={solvedCasesCount}
            onPrimaryPlayAction={handlePrimaryHomePlay}
            onNavigate={handleNavigate}
          />
        );

      case 'PLAYING_SCENE':
        return (
          <CrimeSceneView
            caseDef={activeCase}
            saveState={caseSave}
            onDiscoverClue={handleDiscoverClue}
            onRecordMisTap={handleRecordMisTap}
            onUseHint={handleUseHint}
            onInspectClue={handleInspectClue}
            onChangeDifficulty={handleChangeDifficulty}
            onDismissBriefing={handleDismissBriefing}
            onBackToLibrary={() => handleNavigate('CASE_FILES')}
            onOpenEvidence={() => handleNavigate('PLAYING_EVIDENCE')}
            onOpenNotebook={() => {
              soundService.playNotebookOpen();
              setNotebookOpen(true);
            }}
            onOpenBoard={() => handleNavigate('PLAYING_BOARD')}
            onOpenSuspects={() => handleNavigate('PLAYING_SUSPECTS')}
          />
        );

      case 'PLAYING_EVIDENCE':
        return (
          <EvidenceVaultView
            caseDef={activeCase}
            saveState={caseSave}
            onInspectClue={handleInspectClue}
            onReturnToScene={() => handleNavigate('PLAYING_SCENE')}
            onOpenBoard={() => handleNavigate('PLAYING_BOARD')}
            onOpenSuspects={() => handleNavigate('PLAYING_SUSPECTS')}
          />
        );

      case 'PLAYING_BOARD':
        return (
          <InvestigationBoardView
            caseDef={activeCase}
            saveState={caseSave}
            onMoveNode={handleMoveBoardNode}
            onConnectNodes={handleConnectBoardNodes}
            onRemoveConnection={handleRemoveConnection}
            onResetBoardLayout={handleResetBoardLayout}
            onInspectClue={handleInspectClue}
            onBackToEvidence={() => handleNavigate('PLAYING_EVIDENCE')}
            onOpenSuspects={() => handleNavigate('PLAYING_SUSPECTS')}
          />
        );

      case 'PLAYING_SUSPECTS':
        return (
          <InterrogationView
            caseDef={activeCase}
            saveState={caseSave}
            onAskQuestion={handleAskQuestion}
            onPresentEvidence={handlePresentEvidence}
            onBackToBoard={() => handleNavigate('PLAYING_BOARD')}
            onReturnToScene={() => handleNavigate('PLAYING_SCENE')}
            onOpenAccusation={() => handleNavigate('PLAYING_ACCUSE')}
          />
        );

      case 'PLAYING_ACCUSE':
        return (
          <AccusationView
            caseDef={activeCase}
            saveState={caseSave}
            latestBreakdown={latestBreakdown}
            onSubmitAccusation={handleSubmitAccusation}
            onNextCase={handleNextCaseAfterSolved}
            onBackToCaseLibrary={() => handleNavigate('CASE_FILES')}
            onBackToSuspects={() => handleNavigate('PLAYING_SUSPECTS')}
            onReviewCase={() => handleNavigate('PLAYING_SCENE')}
            onPlayAgain={() => handleReplayCase(activeCase.id)}
          />
        );

      case 'CASE_FILES':
        return (
          <CaseFilesView
            caseSavesById={caseSavesById}
            profile={profile}
            onBackHome={() => handleNavigate('HOME')}
            onStartOrContinueCase={handleStartOrContinueCase}
            onReplayCase={handleReplayCase}
            onViewSolvedDossier={handleViewSolvedDossier}
          />
        );

      case 'DAILY_MYSTERY':
        return (
          <DailyMysteryView
            profile={profile}
            onSolveDaily={handleSolveDaily}
            onNavigate={handleNavigate}
          />
        );

      case 'PROFILE':
        return (
          <DetectiveProfileView
            profile={profile}
            activeCase={activeCase}
            activeSave={caseSave}
            solvedCasesCount={solvedCasesCount}
            onUpdateName={handleUpdateDetectiveName}
            onToggleSound={handleToggleSound}
            onResetAllData={handleResetAllData}
            onNavigate={handleNavigate}
          />
        );

      case 'SETTINGS':
        return (
          <SettingsView
            profile={profile}
            onUpdateName={handleUpdateDetectiveName}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onChangeMasterVolume={handleChangeMasterVolume}
            onChangeMusicVolume={handleChangeMusicVolume}
            onChangeSfxVolume={handleChangeSfxVolume}
            onChangeDifficulty={handleChangeDifficulty}
            onResetAllData={handleResetAllData}
            onNavigate={handleNavigate}
          />
        );

      case 'ABOUT':
        return (
          <AboutView
            hasUnfinishedCase={hasAnyUnfinishedCase}
            onContinueUnfinished={() => handleStartOrContinueCase(spotlightCase.id)}
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <HomeScreen
            heroImageUrl={CASE_001.heroImageUrl}
            spotlightCase={spotlightCase}
            spotlightSave={spotlightSave}
            profile={profile}
            hasUnfinishedCase={hasAnyUnfinishedCase}
            allCasesCompleted={allCasesCompleted}
            solvedCasesCount={solvedCasesCount}
            onPrimaryPlayAction={handlePrimaryHomePlay}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-dvh flex flex-col bg-[#0D0C0B] text-[#F4EFE6] ${
        currentScreen === 'PLAYING_SCENE' ? 'h-dvh overflow-hidden' : ''
      }`}
    >
      <TopNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        hasUnfinishedCase={hasAnyUnfinishedCase}
        nextPlayableCaseLabel={
          allCasesCompleted ? null : `Play ${spotlightCase.code}`
        }
        hasSolvedResults={Boolean(latestBreakdown?.ending.solved)}
        discoveredCount={caseSave.discoveredClues.length}
        totalClues={activeCase.clues.length}
        soundEnabled={profile.soundEnabled}
        onToggleSound={handleToggleSound}
        onPrimaryCaseAction={handlePrimaryHomePlay}
      />

      {/* Non-intrusive Achievement Toast */}
      {achievementBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[62px] right-4 z-50 max-w-sm bg-[#1B1713] border border-[#C5A059]/60 rounded-xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-[#F4EFE6]"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D9B878] shrink-0" />
            <span className="font-medium text-[#D9B878]">{achievementBanner}</span>
          </span>
          <button
            type="button"
            onClick={() => setAchievementBanner(null)}
            aria-label="Dismiss notification"
            className="text-[#8E8477] hover:text-[#F4EFE6] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 min-h-0">{renderActiveScreen()}</main>

      <MobileBottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        discoveredCount={caseSave.discoveredClues.length}
        hasSolvedResults={Boolean(latestBreakdown?.ending.solved)}
      />

      <EvidenceModal
        clue={inspectingClue}
        onClose={() => setInspectingClue(null)}
      />

      <DetectiveNotebookModal
        isOpen={notebookOpen}
        caseDef={activeCase}
        saveState={caseSave}
        onUpdateNotes={handleUpdateNotebook}
        onClose={() => setNotebookOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
