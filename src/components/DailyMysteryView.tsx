import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Flame, Search, Sparkles, XCircle } from 'lucide-react';
import { DAILY_MYSTERIES } from '../data/dailyMysteries';
import { AppScreen, DetectiveProfileState } from '../types/game';

interface DailyMysteryViewProps {
  profile: DetectiveProfileState;
  onSolveDaily: (dailyId: string) => void;
  onNavigate: (screen: AppScreen) => void;
}

export const DailyMysteryView: React.FC<DailyMysteryViewProps> = ({
  profile,
  onSolveDaily,
  onNavigate,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const puzzle = DAILY_MYSTERIES[activeIndex];
  const alreadyCompleted = profile.completedDailyIds.includes(puzzle.id);
  const isCorrect = selectedSuspectId === puzzle.culpritId;

  const handleSelectPuzzle = (idx: number) => {
    setActiveIndex(idx);
    setSelectedSuspectId(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!selectedSuspectId) return;
    setSubmitted(true);
    if (selectedSuspectId === puzzle.culpritId) {
      onSolveDaily(puzzle.id);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-7 pb-24 md:pb-14 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate('HOME')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono">
            <span>Telegraph Dispatch</span>
            <span aria-hidden="true">·</span>
            <span>Rapid Forensic Deduction</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            Daily Mystery
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D9B878] tabular-nums">
            <Flame className="w-4 h-4 text-[#C5A059]" />
            <span>Active Streak: {profile.currentStreakDays} {profile.currentStreakDays === 1 ? 'Day' : 'Days'}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('CASE_FILES')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#C5A059]/30 text-xs font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Case Library</span>
          </button>
        </div>
      </div>

      {/* Dispatch Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {DAILY_MYSTERIES.map((dm, idx) => {
          const solved = profile.completedDailyIds.includes(dm.id);
          const active = idx === activeIndex;
          return (
            <button
              key={dm.id}
              type="button"
              onClick={() => handleSelectPuzzle(idx)}
              className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#262019] border-[#C5A059] text-[#F4EFE6]'
                  : 'bg-[#151311] hover:bg-[#1D1A17] border-[#8C6D46]/25 text-[#C8BFB0]'
              }`}
            >
              <span>{dm.title}</span>
              {solved && <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B878]" />}
            </button>
          );
        })}
      </div>

      {/* Active Daily Riddle Card */}
      <div className="bg-[#151311] border border-[#C5A059]/30 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#C5A059] font-mono">
            <span>{puzzle.dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{puzzle.setting}</span>
            {alreadyCompleted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#D9B878]">Solved (+100 XP Awarded)</span>
              </>
            )}
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#F4EFE6]">
            {puzzle.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#C8BFB0] leading-relaxed">
            {puzzle.premise}
          </p>
        </div>

        {/* Three Clues */}
        <div>
          <h3 className="font-display text-lg font-semibold text-[#F4EFE6] mb-3">
            Scene Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {puzzle.clues.map((c) => (
              <div
                key={c.id}
                className="bg-[#1C1915] border border-[#8C6D46]/25 rounded-xl p-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D9B878]">
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span>{c.title}</span>
                </div>
                <p className="mt-1.5 text-xs text-[#C8BFB0] leading-relaxed">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Three Suspect Statements */}
        <div>
          <h3 className="font-display text-lg font-semibold text-[#F4EFE6] mb-3">
            Identify the Culprit’s Contradiction
          </h3>
          <div className="space-y-3">
            {puzzle.suspects.map((s) => {
              const selected = selectedSuspectId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSuspectId(s.id);
                    setSubmitted(false);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#262019] border-[#C5A059]'
                      : 'bg-[#1B1815] hover:bg-[#211D19] border-[#8C6D46]/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-semibold text-[#F4EFE6]">
                      {s.name}
                    </span>
                    <span className="text-xs text-[#8E8477]">{s.role}</span>
                  </div>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#C8BFB0] leading-relaxed">
                    “{s.statement}”
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Verdict Feedback */}
        {submitted && (
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed ${
              isCorrect
                ? 'bg-[#1F1B13] border-[#D9B878]/50 text-[#F4EFE6]'
                : 'bg-[#281615] border-[#9E2A2B]/60 text-[#F4EFE6]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-1 text-[#D9B878]">
              {isCorrect ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Deduction Verified!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-[#E06C75]" />
                  <span>Alibi Holds — Re-examine the Physical Clues</span>
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#C8BFB0]">
              {isCorrect
                ? puzzle.explanation
                : 'Compare the physical trace left on the scene with how each passenger claims to have used their hands or crossed the corridor.'}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!selectedSuspectId}
            onClick={handleSubmit}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] disabled:opacity-40 text-[#0D0C0B] text-sm font-semibold cursor-pointer"
          >
            Submit Dispatch Solution
          </button>
        </div>
      </div>
    </div>
  );
};
