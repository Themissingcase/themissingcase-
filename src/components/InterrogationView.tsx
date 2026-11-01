import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  FolderSearch,
  Gavel,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import {
  CaseDefinition,
  CaseSaveState,
  ClueId,
  SuspectId,
  SuspectQuestion,
} from '../types/game';
import { isQuestionUnlocked } from '../engine/mysteryEngine';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface InterrogationViewProps {
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  onAskQuestion: (
    suspectId: SuspectId,
    question: SuspectQuestion
  ) => void;
  onPresentEvidence: (
    suspectId: SuspectId,
    clueId: ClueId
  ) => {
    response: string;
    exposesContradiction: boolean;
    contradictionTitle?: string;
  };
  onBackToBoard: () => void;
  onReturnToScene: () => void;
  onOpenAccusation: () => void;
}

export const InterrogationView: React.FC<InterrogationViewProps> = ({
  caseDef,
  saveState,
  onAskQuestion,
  onPresentEvidence,
  onBackToBoard,
  onReturnToScene,
  onOpenAccusation,
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<SuspectId>(
    caseDef.suspects[0].id
  );
  const [activeTranscript, setActiveTranscript] = useState<{
    speaker: string;
    prompt: string;
    reply: string;
    contradictionBanner?: string;
  } | null>(null);

  useEffect(() => {
    setSelectedSuspectId(caseDef.suspects[0].id);
    setActiveTranscript(null);
  }, [caseDef.id, caseDef.suspects, saveState.startedAt]);

  const selectedSuspect = useMemo(
    () =>
      caseDef.suspects.find((s) => s.id === selectedSuspectId) || caseDef.suspects[0],
    [caseDef.suspects, selectedSuspectId]
  );

  const discoveredClueObjects = useMemo(
    () => caseDef.clues.filter((c) => saveState.discoveredClues.includes(c.id)),
    [caseDef.clues, saveState.discoveredClues]
  );

  const visibleQuestions = useMemo(
    () =>
      selectedSuspect.baselineQuestions.filter((q) =>
        isQuestionUnlocked(q, saveState)
      ),
    [selectedSuspect, saveState]
  );

  const lockedQuestionCount =
    selectedSuspect.baselineQuestions.length - visibleQuestions.length;

  const composure = saveState.suspectComposure[selectedSuspect.id] || 'CALM';

  const handleSelectSuspect = (id: SuspectId) => {
    setSelectedSuspectId(id);
    setActiveTranscript(null);
  };

  const handleQuestionClick = (q: SuspectQuestion) => {
    onAskQuestion(selectedSuspect.id, q);
    setActiveTranscript({
      speaker: selectedSuspect.name,
      prompt: q.prompt,
      reply: q.answer,
    });
  };

  const handleChallengeWithClue = (clueId: ClueId, clueName: string) => {
    const res = onPresentEvidence(selectedSuspect.id, clueId);
    setActiveTranscript({
      speaker: selectedSuspect.name,
      prompt: `Presented Evidence: ${clueName}`,
      reply: res.response,
      contradictionBanner: res.exposesContradiction ? res.contradictionTitle : undefined,
    });
  };

  const rosterGridCols =
    caseDef.suspects.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-12 flex flex-col gap-5">
      {/* Suspect Roster Strip with Clear Back & Forward Routes */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToBoard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Investigation Board</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono tabular-nums">
            <span>{caseDef.code} · Suspect Cross-Examination</span>
            <span aria-hidden="true">·</span>
            <span>{saveState.exposedContradictions.length} Contradictions Exposed</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F4EFE6]">
            Suspect Interrogation
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onReturnToScene}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-4 h-4 text-[#C5A059]" />
            <span>Crime Scene</span>
          </button>

          <button
            type="button"
            onClick={onOpenAccusation}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Gavel className="w-4 h-4" />
            <span>Final Accusation</span>
          </button>
        </div>
      </div>

      {/* Horizontal / Grid Suspect Selector */}
      <div className={`grid ${rosterGridCols} gap-2.5`}>
        {caseDef.suspects.map((s) => {
          const active = s.id === selectedSuspect.id;
          const sComp = saveState.suspectComposure[s.id] || 'CALM';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSuspect(s.id)}
              className={`min-h-[64px] p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                active
                  ? 'bg-[#221D18] border-[#C5A059] shadow-md'
                  : 'bg-[#151311] hover:bg-[#1C1915] border-[#8C6D46]/25'
              }`}
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#C5A059]/25 bg-[#110F0D]">
                <img
                  src={s.portraitUrl}
                  alt={s.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-xs sm:text-sm font-semibold text-[#F4EFE6] truncate">
                  {s.name}
                </div>
                <div className="text-[11px] text-[#8E8477] truncate">{s.role}</div>
                <div className="text-[10px] font-mono text-[#C5A059] mt-0.5">{sComp}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Interrogation Chamber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Suspect Portrait & Psychological Profile */}
        <div className="lg:col-span-5 bg-[#151311] border border-[#C5A059]/25 rounded-2xl overflow-hidden flex flex-col">
          <div className="relative aspect-[4/3] sm:aspect-square max-h-[340px] w-full bg-[#0E0D0B] overflow-hidden">
            <img
              src={selectedSuspect.portraitUrl}
              alt={selectedSuspect.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151311] via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F4EFE6]">
                  {selectedSuspect.name}
                </h2>
                <div className="text-xs text-[#D9B878]">
                  {selectedSuspect.role} · Age {selectedSuspect.age}
                </div>
              </div>
              <div className="text-xs font-mono text-[#F4EFE6] bg-[#0D0C0B]/85 border border-[#C5A059]/35 px-2.5 py-1 rounded-md">
                Demeanor: {composure}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-2.5 text-xs sm:text-sm flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              {selectedSuspect.personalBackground && (
                <div>
                  <span className="text-[#C5A059] font-semibold">Background: </span>
                  <span className="text-[#C8BFB0]">{selectedSuspect.personalBackground}</span>
                </div>
              )}
              {selectedSuspect.relationshipToVictim && (
                <div>
                  <span className="text-[#C5A059] font-semibold">Relationship: </span>
                  <span className="text-[#C8BFB0]">{selectedSuspect.relationshipToVictim}</span>
                </div>
              )}
              <div>
                <span className="text-[#C5A059] font-semibold">Stated Alibi: </span>
                <span className="text-[#C8BFB0]">{selectedSuspect.initialAlibi}</span>
              </div>
              {selectedSuspect.timelineSummary && (
                <div>
                  <span className="text-[#C5A059] font-semibold">Accounted Window: </span>
                  <span className="text-[#C8BFB0] font-mono text-xs">{selectedSuspect.timelineSummary}</span>
                </div>
              )}
              <div>
                <span className="text-[#C5A059] font-semibold">Known Tension: </span>
                <span className="text-[#C8BFB0]">{selectedSuspect.apparentMotive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Testimony, Branching Questions & Challenge With Evidence */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Testimony Box */}
          <div className="bg-[#181512] border border-[#C5A059]/30 rounded-2xl p-5 sm:p-6 min-h-[175px] flex flex-col justify-between">
            {activeTranscript ? (
              <div>
                {activeTranscript.contradictionBanner && (
                  <div className="mb-3 px-3.5 py-2 rounded-lg bg-[#2B1615] border border-[#D9B878]/50 text-xs font-semibold text-[#D9B878] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Contradiction Exposed: {activeTranscript.contradictionBanner}</span>
                  </div>
                )}

                <div className="text-xs text-[#8E8477] font-medium">
                  Inspector’s Inquiry — {activeTranscript.prompt}
                </div>

                <blockquote className="mt-2.5 font-display text-base sm:text-lg text-[#F4EFE6] leading-relaxed">
                  “{activeTranscript.reply}”
                </blockquote>
              </div>
            ) : (
              <div className="my-auto text-sm text-[#C8BFB0] leading-relaxed">
                Select an inquiry below or challenge{' '}
                <strong className="text-[#F4EFE6]">{selectedSuspect.name}</strong> with physical
                evidence from your satchel to test their alibi for contradictions.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#8C6D46]/20 flex items-center justify-between text-xs text-[#8E8477]">
              <span>Witness Statement Recorded</span>
              {lockedQuestionCount > 0 && (
                <span>
                  {lockedQuestionCount} deeper {lockedQuestionCount === 1 ? 'question' : 'questions'} locked (link clues on Board)
                </span>
              )}
            </div>
          </div>

          {/* Line of Questioning */}
          <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5">
            <h3 className="font-display text-base font-semibold text-[#F4EFE6] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C5A059]" />
              <span>Line of Questioning</span>
            </h3>

            <div className="space-y-2">
              {visibleQuestions.map((q) => {
                const asked = saveState.askedQuestions.includes(
                  `${selectedSuspect.id}:${q.id}`
                );
                const isUnlockedBranch = Boolean(q.unlockCondition);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleQuestionClick(q)}
                    className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isUnlockedBranch
                        ? 'bg-[#221C14] hover:bg-[#2C2419] border-[#C5A059]/45 text-[#F4EFE6]'
                        : 'bg-[#1B1815] hover:bg-[#24201C] border-[#8C6D46]/25 text-[#F4EFE6]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {isUnlockedBranch && (
                        <KeyRound className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                      )}
                      <span>{q.prompt}</span>
                    </span>
                    {asked && (
                      <CheckCircle2 className="w-4 h-4 text-[#8E8477] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Challenge Suspect With Collected Physical Evidence */}
          <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-display text-base font-semibold text-[#F4EFE6] flex items-center gap-2">
                <FolderSearch className="w-4 h-4 text-[#C5A059]" />
                <span>Present Physical Evidence</span>
              </h3>
              <span className="text-xs font-mono text-[#8E8477] tabular-nums">
                {discoveredClueObjects.length} available
              </span>
            </div>

            {discoveredClueObjects.length === 0 ? (
              <p className="text-xs text-[#8E8477]">
                Collect hidden objects in the {caseDef.environmentType.toLowerCase()} first to
                confront suspects with physical proof.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {discoveredClueObjects.map((clue) => {
                  const presented = saveState.presentedEvidence.includes(
                    `${selectedSuspect.id}:${clue.id}`
                  );
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      onClick={() => handleChallengeWithClue(clue.id, clue.name)}
                      className={`min-h-[48px] p-2 rounded-xl border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                        presented
                          ? 'bg-[#1A1714] border-[#8C6D46]/25 text-[#C8BFB0]'
                          : 'bg-[#201C17] hover:bg-[#2B251E] border-[#C5A059]/35 text-[#F4EFE6]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded bg-[#12100E] p-0.5 shrink-0">
                        <SceneObjectArtwork clueId={clue.id} variant="inspector" />
                      </div>
                      <span className="text-xs font-medium leading-tight line-clamp-2">
                        {clue.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
