import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  CaseDefinition,
  CaseSaveState,
  CompletedCaseSummary,
  DetectiveProfileState,
} from '../types/game';
import { ORDERED_CASES } from '../data/caseRegistry';
import { computeInvestigationProgress } from '../engine/mysteryEngine';
import { formatDuration } from '../services/persistenceService';

interface CaseFilesViewProps {
  caseSavesById: Record<string, CaseSaveState>;
  profile: DetectiveProfileState;
  onBackHome: () => void;
  onStartOrContinueCase: (caseId: string) => void;
  onReplayCase: (caseId: string) => void;
  onViewSolvedDossier: (caseId: string) => void;
}

function isSummarySolved(summary?: CompletedCaseSummary | null): boolean {
  if (!summary) return false;
  if (typeof summary.solved === 'boolean') return summary.solved;
  return (
    summary.endingId === 'TRUE_DETECTIVE' ||
    summary.endingId === 'CIRCUMSTANTIAL_ARREST'
  );
}

export const CaseFilesView: React.FC<CaseFilesViewProps> = ({
  caseSavesById,
  profile,
  onBackHome,
  onStartOrContinueCase,
  onReplayCase,
  onViewSolvedDossier,
}) => {
  const [confirmReplayCase, setConfirmReplayCase] = useState<CaseDefinition | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const solvedCount = ORDERED_CASES.filter((c) => {
    const save = caseSavesById[c.id];
    return Boolean(
      save?.isCompleted ||
        save?.originalCompletionRecord ||
        isSummarySolved(save?.completedEnding) ||
        profile.solvedCaseIds.includes(c.id) ||
        profile.caseRecords[c.id]
    );
  }).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-28 md:pb-14 space-y-8">
      {/* Header with Clear Back Route to Home */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            Case Library
          </h1>
          <p className="text-sm text-[#C8BFB0] max-w-2xl leading-relaxed">
            All five Victorian murder investigations are playable in full. Every case preserves
            independent clues, suspect testimony, completion records, and unlimited replay sessions.
          </p>
        </div>

        <div className="text-xs font-mono text-[#C5A059] tabular-nums">
          {solvedCount} of {ORDERED_CASES.length} Anthology Cases Solved
        </div>
      </div>

      {/* All 5 Playable Anthology Cases */}
      <div className="space-y-6">
        {ORDERED_CASES.map((caseItem) => {
          const save = caseSavesById[caseItem.id];
          const isCompleted = Boolean(
            save?.isCompleted ||
              save?.originalCompletionRecord ||
              isSummarySolved(save?.completedEnding) ||
              profile.solvedCaseIds.includes(caseItem.id) ||
              profile.caseRecords[caseItem.id]
          );

          const isReplayInProgress = Boolean(
            isCompleted &&
              save?.isReplaySession &&
              !isSummarySolved(save?.completedEnding)
          );

          const hasUnfinishedProgress = Boolean(
            !isCompleted &&
              save &&
              (save.status === 'IN_PROGRESS' ||
                save.discoveredClues.length > 0 ||
                save.connections.length > 0 ||
                save.askedQuestions.length > 0 ||
                save.notebookNotes.trim().length > 0 ||
                save.briefingSeen)
          );

          const progressPct = save ? computeInvestigationProgress(caseItem, save) : 0;

          const originalRecord =
            save?.originalCompletionRecord || profile.caseRecords[caseItem.id] || null;
          const bestSummary =
            save?.bestCompletionSummary ||
            profile.caseRatings[caseItem.id] ||
            (isSummarySolved(save?.completedEnding) ? save?.completedEnding : null);
          const lastReplay = save?.lastReplaySummary || null;

          return (
            <section
              key={caseItem.id}
              className={`bg-[#151311] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch border transition-colors ${
                isCompleted ? 'border-[#C5A059]/55' : 'border-[#8C6D46]/35 hover:border-[#C5A059]/45'
              }`}
            >
              {/* Hand-Painted Crime Scene Preview */}
              <div className="lg:col-span-5 relative min-h-[230px] bg-[#0D0C0B] overflow-hidden">
                {!imgErrors[caseItem.id] ? (
                  <img
                    src={caseItem.sceneImageUrl}
                    alt={caseItem.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [caseItem.id]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#231D17] via-[#151311] to-[#0D0C0B]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#151311] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#151311]" />
              </div>

              {/* Case Dossier Details & Action Bar */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
                    <span className="text-[#D9B878] font-semibold">{caseItem.code}</span>
                    <span aria-hidden="true" className="text-[#8E8477]">·</span>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-[#D9B878] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>COMPLETED</span>
                      </span>
                    ) : hasUnfinishedProgress ? (
                      <span className="text-[#C5A059] font-semibold">IN PROGRESS</span>
                    ) : (
                      <span className="text-[#C5A059]">AVAILABLE · PLAYABLE</span>
                    )}
                    <span aria-hidden="true" className="text-[#8E8477]">·</span>
                    <span className="text-[#8E8477]">{caseItem.environmentType}</span>
                    <span aria-hidden="true" className="text-[#8E8477]">·</span>
                    <span className="text-[#8E8477]">{caseItem.difficulty}</span>
                  </div>

                  <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
                    {caseItem.title}
                  </h2>
                  <div className="mt-0.5 text-xs sm:text-sm text-[#D9B878]">
                    {caseItem.subtitle}
                  </div>

                  <p className="mt-2.5 text-sm text-[#C8BFB0] leading-relaxed">
                    {caseItem.introBriefing[0]}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8E8477] font-mono tabular-nums">
                    <span>{caseItem.clues.length} Concealed Exhibits</span>
                    <span aria-hidden="true">·</span>
                    <span>{caseItem.suspects.length} Suspects</span>
                    <span aria-hidden="true">·</span>
                    <span>Victim: {caseItem.victimName}</span>
                  </div>

                  {/* Separate Original Record, Best Score & Replay Record Display */}
                  {isCompleted && (
                    <div className="mt-3.5 pt-3 border-t border-[#8C6D46]/15 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[#C8BFB0]">
                      <span className="text-[#D9B878]">
                        Original Record:{' '}
                        {originalRecord?.completionPercentage ??
                          bestSummary?.completionPercentage ??
                          100}
                        % ·{' '}
                        {formatDuration(
                          originalRecord?.elapsedSeconds ??
                            bestSummary?.elapsedSeconds ??
                            0
                        )}
                      </span>
                      {bestSummary && (
                        <>
                          <span aria-hidden="true" className="text-[#8E8477]">·</span>
                          <span>
                            Best Score: {bestSummary.score} ({bestSummary.rank})
                          </span>
                        </>
                      )}
                      {lastReplay && (
                        <>
                          <span aria-hidden="true" className="text-[#8E8477]">·</span>
                          <span className="text-[#8E8477]">
                            Last Replay: {lastReplay.completionPercentage}% (
                            {formatDuration(lastReplay.elapsedSeconds)})
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Controls: PLAY / CONTINUE for unfinished; REPLAY CASE (+ CONTINUE REPLAY & CASE RESULTS) for completed */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#8C6D46]/20">
                  <span className="text-xs text-[#C8BFB0]">
                    {isCompleted
                      ? isReplayInProgress
                        ? `Replay session in progress (${save?.discoveredClues.length || 0}/${caseItem.clues.length} clues) · Original record preserved`
                        : 'Case solved · Original record & achievements permanently preserved'
                      : hasUnfinishedProgress
                      ? `Unfinished investigation (${save?.discoveredClues.length || 0}/${caseItem.clues.length} clues · ${progressPct}%)`
                      : 'Ready to begin investigation'}
                  </span>

                  {isCompleted ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      {isReplayInProgress && (
                        <button
                          type="button"
                          onClick={() => onStartOrContinueCase(caseItem.id)}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#262018] hover:bg-[#31291F] border border-[#C5A059]/50 text-[#D9B878] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>CONTINUE REPLAY</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setConfirmReplayCase(caseItem)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>REPLAY CASE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewSolvedDossier(caseItem.id)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F1B17] hover:bg-[#29231E] border border-[#8C6D46]/35 text-[#F4EFE6] text-xs sm:text-sm font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4 text-[#C5A059]" />
                        <span>Case Results</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartOrContinueCase(caseItem.id)}
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{hasUnfinishedProgress ? 'CONTINUE' : 'PLAY'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Replay Case Confirmation Modal */}
      {confirmReplayCase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="replay-case-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#181512] border border-[#C5A059]/35 rounded-2xl p-6 shadow-2xl">
            <h3
              id="replay-case-title"
              className="font-display text-2xl font-semibold text-[#F4EFE6]"
            >
              Replay {confirmReplayCase.code}: {confirmReplayCase.title}?
            </h3>
            <p className="mt-2 text-sm text-[#C8BFB0] leading-relaxed">
              This restarts{' '}
              <span className="text-[#F4EFE6] font-medium">{confirmReplayCase.title}</span> from its
              opening introduction with fresh hidden objects, suspect investigations, and session
              timer—while keeping your original completion record, achievements, and best score
              permanently intact.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmReplayCase(null)}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-[#C8BFB0] hover:text-[#F4EFE6] bg-[#24201C] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = confirmReplayCase.id;
                  setConfirmReplayCase(null);
                  onReplayCase(targetId);
                }}
                className="min-h-[44px] px-5 py-2 rounded-lg text-sm font-semibold text-[#0D0C0B] bg-[#C5A059] hover:bg-[#D9B878] cursor-pointer"
              >
                REPLAY CASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
