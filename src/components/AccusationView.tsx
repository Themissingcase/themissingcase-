import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Gavel,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  CaseDefinition,
  CaseSaveState,
  ClueId,
  SuspectId,
} from '../types/game';
import { getNextCaseInSequence } from '../data/caseRegistry';
import { ScoreBreakdown } from '../engine/mysteryEngine';
import { formatDuration } from '../services/persistenceService';

interface AccusationViewProps {
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  latestBreakdown: ScoreBreakdown | null;
  onSubmitAccusation: (
    culpritId: SuspectId,
    methodId: string | null,
    motiveId: string | null,
    selectedClues: ClueId[]
  ) => void;
  onNextCase: () => void;
  onBackToCaseLibrary: () => void;
  onBackToSuspects: () => void;
  onReviewCase: () => void;
  onPlayAgain: () => void;
}

export const AccusationView: React.FC<AccusationViewProps> = ({
  caseDef,
  saveState,
  latestBreakdown,
  onSubmitAccusation,
  onNextCase,
  onBackToCaseLibrary,
  onBackToSuspects,
  onReviewCase,
  onPlayAgain,
}) => {
  const [culpritId, setCulpritId] = useState<SuspectId | null>(
    saveState.finalAccusation?.culpritId ?? null
  );
  const [methodId, setMethodId] = useState<string | null>(
    saveState.finalAccusation?.methodId ?? null
  );
  const [motiveId, setMotiveId] = useState<string | null>(
    saveState.finalAccusation?.motiveId ?? null
  );
  const [selectedClues, setSelectedClues] = useState<ClueId[]>(
    saveState.finalAccusation?.selectedClues ?? []
  );
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [confirmPlayAgain, setConfirmPlayAgain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Sync local accusation form whenever switching between cases or starting a replay
  useEffect(() => {
    setCulpritId(saveState.finalAccusation?.culpritId ?? null);
    setMethodId(saveState.finalAccusation?.methodId ?? null);
    setMotiveId(saveState.finalAccusation?.motiveId ?? null);
    setSelectedClues(saveState.finalAccusation?.selectedClues ?? []);
    setShowRevisionForm(false);
  }, [caseDef.id, saveState.startedAt, saveState.finalAccusation]);

  const discoveredClueObjects = caseDef.clues.filter((c) =>
    saveState.discoveredClues.includes(c.id)
  );

  const toggleClue = (id: ClueId) => {
    setSelectedClues((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const canSubmit = Boolean(culpritId && !isSubmitting);
  const nextCaseInSequence = getNextCaseInSequence(caseDef.id);

  const handleConfirmSubmission = () => {
    if (!culpritId || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setShowRevisionForm(false);

    onSubmitAccusation(culpritId, methodId, motiveId, selectedClues);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    window.setTimeout(() => {
      submittingRef.current = false;
      setIsSubmitting(false);
    }, 400);
  };

  // Post-Accusation Case Results View
  if (latestBreakdown && !showRevisionForm) {
    const { ending, completionPercentage } = latestBreakdown;
    const isSolved = ending.solved;
    const canonicalCulprit = caseDef.suspects.find(
      (s) => s.id === caseDef.canonicalDatabase.actualCulpritId
    );

    // 1. CINEMATIC "CASE SOLVED" RESULTS SCREEN
    if (isSolved && canonicalCulprit) {
      const displayElapsedSeconds =
        saveState.completedEnding?.elapsedSeconds ?? saveState.elapsedSeconds;
      const displayHintsUsed =
        saveState.completedEnding?.hintsUsed ?? saveState.hintsUsed;

      return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-7 sm:py-10 pb-28 md:pb-16 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToCaseLibrary}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Case Library</span>
            </button>
            <span className="text-xs font-mono text-[#C5A059]">Progress Saved Automatically</span>
          </div>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="bg-[#151311] border border-[#C5A059]/45 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Cinematic Luxury Header */}
            <div className="bg-gradient-to-b from-[#211A12] to-[#151311] border-b border-[#C5A059]/25 px-6 sm:px-12 py-8 sm:py-10 text-center">
              <div className="inline-flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-[#C5A059]">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {caseDef.code} · {caseDef.title}
                </span>
              </div>

              <h1 className="mt-3 font-display text-4xl sm:text-6xl font-bold text-[#F4EFE6] tracking-tight">
                CASE SOLVED
              </h1>

              <p className="mt-3 font-display italic text-xl sm:text-3xl text-[#D9B878]">
                {ending.headline}
              </p>
            </div>

            {/* Body: Culprit Portrait + Concise Murder & Decisive Exhibits Explanation */}
            <div className="px-6 sm:px-12 py-8 sm:py-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-center">
                <div className="md:col-span-4 max-w-[230px] mx-auto md:max-w-none w-full">
                  <div className="bg-[#1B1714] border border-[#C5A059]/35 rounded-xl p-3 shadow-lg">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#110F0D]">
                      <img
                        src={canonicalCulprit.portraitUrl}
                        alt={canonicalCulprit.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="mt-3 text-center">
                      <div className="font-display text-lg font-semibold text-[#F4EFE6]">
                        {canonicalCulprit.name}
                      </div>
                      <div className="text-xs text-[#8E8477]">{canonicalCulprit.role}</div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4 text-sm sm:text-base text-[#F4EFE6]/90 leading-relaxed font-serif">
                  {ending.epilogueParagraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Clean Scannable Connection of the Decisive Exhibits */}
              {ending.evidenceProofItems && ending.evidenceProofItems.length > 0 && (
                <div className="pt-6 border-t border-[#8C6D46]/25 space-y-4">
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-[#D9B878]">
                    How the Decisive Exhibits Proved the Culprit’s Guilt
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ending.evidenceProofItems.map((item) => (
                      <div
                        key={item.clueId}
                        className="bg-[#191613] border border-[#8C6D46]/25 rounded-xl p-4 space-y-1"
                      >
                        <div className="text-xs font-mono text-[#C5A059]">{item.roleLabel}</div>
                        <div className="font-display text-sm sm:text-base font-semibold text-[#F4EFE6]">
                          {item.clueName}
                        </div>
                        <p className="text-xs text-[#C8BFB0] leading-relaxed">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Three Real Gameplay Statistics */}
              <div className="pt-2 border-t border-[#8C6D46]/25 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                  <div className="bg-[#1B1815] border border-[#8C6D46]/25 rounded-xl px-5 py-4 text-center">
                    <div className="text-xs text-[#8E8477] tracking-wide">
                      Completion Percentage
                    </div>
                    <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-semibold text-[#D9B878] tabular-nums">
                      {completionPercentage}%
                    </div>
                  </div>

                  <div className="bg-[#1B1815] border border-[#8C6D46]/25 rounded-xl px-5 py-4 text-center">
                    <div className="text-xs text-[#8E8477] tracking-wide">Time Taken</div>
                    <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-semibold text-[#F4EFE6] tabular-nums">
                      {formatDuration(displayElapsedSeconds)}
                    </div>
                  </div>

                  <div className="bg-[#1B1815] border border-[#8C6D46]/25 rounded-xl px-5 py-4 text-center">
                    <div className="text-xs text-[#8E8477] tracking-wide">Hints Used</div>
                    <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-semibold text-[#F4EFE6] tabular-nums">
                      {displayHintsUsed}
                    </div>
                  </div>
                </div>

                {/* Separate Original Record Banner when Replay Completed */}
                {saveState.originalCompletionRecord && (
                  <div className="text-center text-xs font-mono text-[#8E8477] tabular-nums">
                    Original Completion Preserved: {saveState.originalCompletionRecord.completionPercentage}% ·{' '}
                    {formatDuration(saveState.originalCompletionRecord.elapsedSeconds)}
                    {saveState.bestCompletionSummary
                      ? ` · Best Score: ${saveState.bestCompletionSummary.score} (${saveState.bestCompletionSummary.rank})`
                      : ''}
                  </div>
                )}
              </div>

              {/* Prominent NEXT CASE CTA + Secondary REPLAY CASE, Case Library & Review Case */}
              <div className="pt-4 border-t border-[#8C6D46]/25 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={nextCaseInSequence ? onNextCase : onBackToCaseLibrary}
                  className="w-full sm:w-auto sm:min-w-[300px] min-h-[54px] px-8 py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] font-semibold text-base tracking-wide flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer"
                >
                  <span>
                    {nextCaseInSequence
                      ? `NEXT CASE: ${nextCaseInSequence.code}`
                      : 'RETURN TO CASE LIBRARY'}
                  </span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmPlayAgain(true)}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#221D16] hover:bg-[#2E271E] border border-[#C5A059]/45 text-xs sm:text-sm font-semibold text-[#D9B878] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>REPLAY CASE</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToCaseLibrary}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#1C1916] hover:bg-[#25211D] border border-[#C5A059]/30 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Case Library</span>
                  </button>

                  <button
                    type="button"
                    onClick={onReviewCase}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#1C1916] hover:bg-[#25211D] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Review Case</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.article>

          {/* Safe Replay Confirmation Modal */}
          {confirmPlayAgain && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            >
              <div className="w-full max-w-md bg-[#181512] border border-[#C5A059]/35 rounded-2xl p-6 shadow-2xl">
                <h3 className="font-display text-2xl font-semibold text-[#F4EFE6]">
                  Replay {caseDef.code}: {caseDef.title}?
                </h3>
                <p className="mt-2 text-sm text-[#C8BFB0] leading-relaxed">
                  Starting a replay restarts {caseDef.title} from its opening introduction and resets
                  the current replay’s clues and session timer, while keeping your original
                  completion record, achievements, and best score permanently preserved.
                </p>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmPlayAgain(false)}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-[#24201C] text-sm text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmPlayAgain(false);
                      onPlayAgain();
                    }}
                    className="min-h-[44px] px-5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-sm font-semibold text-[#0D0C0B] cursor-pointer"
                  >
                    REPLAY CASE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 2. WRONG ACCUSATION SCREEN (Never spoils any case's true culprit)
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#161311] border border-[#8C6D46]/45 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6"
        >
          <div className="pb-5 border-b border-[#8C6D46]/25">
            <div className="text-xs text-[#C5A059] font-mono">
              {caseDef.code} · {ending.badge}
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#F4EFE6]">
              {ending.headline}
            </h1>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-[#F4EFE6]/90 leading-relaxed font-serif">
            {ending.epilogueParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="pt-4 border-t border-[#8C6D46]/25 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowRevisionForm(true)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>Revise Accusation</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onReviewCase}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#C5A059]/30 text-xs sm:text-sm font-medium text-[#D9B878] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Return to Scene</span>
              </button>

              <button
                type="button"
                onClick={onBackToCaseLibrary}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#191613] hover:bg-[#221E1A] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Case Library</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const gridColsClass =
    caseDef.suspects.length === 5
      ? 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-14 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToSuspects}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Suspects</span>
          </button>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            Final Accusation
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {showRevisionForm && latestBreakdown && (
            <button
              type="button"
              onClick={() => setShowRevisionForm(false)}
              className="text-xs text-[#D9B878] hover:underline cursor-pointer"
            >
              Return to Case Results
            </button>
          )}
          <button
            type="button"
            onClick={onReviewCase}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1D1A17] hover:bg-[#26221E] border border-[#8C6D46]/30 text-xs font-medium text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
          >
            Review Crime Scene
          </button>
        </div>
      </div>

      {/* Incomplete Investigation Notice */}
      {saveState.discoveredClues.length < caseDef.clues.length && (
        <div className="bg-[#231B13] border border-[#C5A059]/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#D9B878]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              You have recovered {saveState.discoveredClues.length} of {caseDef.clues.length} hidden
              exhibits. Finding all {caseDef.clues.length} clues achieves 100% completion.
            </span>
          </div>
          <button
            type="button"
            onClick={onReviewCase}
            className="text-xs font-semibold text-[#F4EFE6] underline cursor-pointer whitespace-nowrap"
          >
            Continue Searching
          </button>
        </div>
      )}

      {/* Step 1: Select Culprit */}
      <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-xl font-semibold text-[#F4EFE6]">
            01. Who murdered {caseDef.victimName}?
          </h2>
          <span className="text-xs font-mono text-[#C5A059]">Required</span>
        </div>
        <div className={`grid ${gridColsClass} gap-3`}>
          {caseDef.suspects.map((s) => {
            const selected = culpritId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCulpritId(s.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selected
                    ? 'bg-[#262019] border-[#C5A059] shadow-md'
                    : 'bg-[#1B1815] hover:bg-[#221E1A] border-[#8C6D46]/25'
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#110F0D] mb-2.5">
                  <img
                    src={s.portraitUrl}
                    alt={s.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="font-display text-sm font-semibold text-[#F4EFE6] truncate">
                  {s.name}
                </div>
                <div className="text-[11px] text-[#8E8477] truncate">{s.role}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Select Method */}
      <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-xl font-semibold text-[#F4EFE6]">
            02. How was the crime carried out?
          </h2>
          <span className="text-xs font-mono text-[#8E8477]">Supporting Detail</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {caseDef.methodOptions.map((opt) => {
            const selected = methodId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethodId(opt.id)}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#262019] border-[#C5A059]'
                    : 'bg-[#1B1815] hover:bg-[#221E1A] border-[#8C6D46]/25'
                }`}
              >
                <div className="text-sm font-semibold text-[#F4EFE6]">{opt.label}</div>
                <div className="mt-1 text-xs text-[#8E8477] leading-relaxed">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3: Select Motive */}
      <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-xl font-semibold text-[#F4EFE6]">
            03. What drove the killer?
          </h2>
          <span className="text-xs font-mono text-[#8E8477]">Supporting Detail</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {caseDef.motiveOptions.map((opt) => {
            const selected = motiveId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMotiveId(opt.id)}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#262019] border-[#C5A059]'
                    : 'bg-[#1B1815] hover:bg-[#221E1A] border-[#8C6D46]/25'
                }`}
              >
                <div className="text-sm font-semibold text-[#F4EFE6]">{opt.label}</div>
                <div className="mt-1 text-xs text-[#8E8477] leading-relaxed">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 4: Supporting Physical Clues */}
      <section className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="font-display text-xl font-semibold text-[#F4EFE6]">
            04. Attach up to 3 Key Exhibits
          </h2>
          <span className="text-xs font-mono text-[#C5A059] tabular-nums">
            {selectedClues.length}/3 selected
          </span>
        </div>

        {discoveredClueObjects.length === 0 ? (
          <p className="text-xs text-[#8E8477]">
            No physical exhibits recovered yet—search the crime scene to strengthen your case.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {discoveredClueObjects.map((clue) => {
              const checked = selectedClues.includes(clue.id);
              return (
                <button
                  key={clue.id}
                  type="button"
                  onClick={() => toggleClue(clue.id)}
                  className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[#262019] border-[#C5A059] text-[#F4EFE6]'
                      : 'bg-[#1B1815] hover:bg-[#221E1A] border-[#8C6D46]/25 text-[#C8BFB0]'
                  }`}
                >
                  <span className="text-xs font-medium truncate">{clue.name}</span>
                  {checked && <Check className="w-4 h-4 text-[#D9B878] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Submit Final Accusation CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <span className="text-xs text-[#8E8477]">
          {!culpritId
            ? 'Select a suspect in Section 01 to deliver your final accusation.'
            : 'Ready to deliver your final accusation and view Case Results.'}
        </span>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleConfirmSubmission}
          className="w-full sm:w-auto min-h-[52px] px-8 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] disabled:opacity-40 text-[#0D0C0B] font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          <Gavel className="w-5 h-5" />
          <span>{isSubmitting ? 'Submitting...' : 'Deliver Final Accusation'}</span>
        </button>
      </div>
    </div>
  );
};
