import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AppScreen,
  CaseDefinition,
  CaseSaveState,
  DetectiveProfileState,
} from '../types/game';
import { ORDERED_CASES } from '../data/caseRegistry';
import {
  ACHIEVEMENTS,
  formatDuration,
  getDetectiveRankInfo,
} from '../services/persistenceService';
import { computeSceneAccuracy } from '../engine/mysteryEngine';

interface DetectiveProfileViewProps {
  profile: DetectiveProfileState;
  activeCase: CaseDefinition;
  activeSave: CaseSaveState;
  solvedCasesCount: number;
  onUpdateName: (name: string) => void;
  onToggleSound: () => void;
  onResetAllData: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const DetectiveProfileView: React.FC<DetectiveProfileViewProps> = ({
  profile,
  activeCase,
  activeSave,
  solvedCasesCount,
  onUpdateName,
  onToggleSound,
  onResetAllData,
  onNavigate,
}) => {
  const [nameInput, setNameInput] = useState(profile.detectiveName);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const rankInfo = getDetectiveRankInfo(profile.totalXp);

  const overallAccuracy = computeSceneAccuracy(
    profile.totalSceneHits,
    profile.totalSceneMisTaps
  );
  const hasAnyTaps = profile.totalSceneHits + profile.totalSceneMisTaps > 0;
  const activeCollectionPct = Math.round(
    (activeSave.discoveredClues.length / activeCase.clues.length) * 100
  );

  const allRankTiers = [
    { name: 'Rookie', minXp: 0 },
    { name: 'Investigator', minXp: 200 },
    { name: 'Inspector', minXp: 500 },
    { name: 'Master Detective', minXp: 900 },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 pb-28 md:pb-14 space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('HOME')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('SETTINGS')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1D1A17] hover:bg-[#26221E] border border-[#8C6D46]/30 text-xs font-medium text-[#F4EFE6] flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Audio & Difficulty Settings</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('CASE_FILES')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Case Library</span>
          </button>
        </div>
      </div>

      {/* Header & Sound / Identity Controls */}
      <section className="bg-[#151311] border border-[#C5A059]/30 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono">
            <span>Service Record</span>
            <span aria-hidden="true">·</span>
            <span>Rank Tier {rankInfo.levelNumber} of 4</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={nameInput}
              maxLength={32}
              aria-label="Detective Name"
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                const trimmed = nameInput.trim() || 'Detective Vance';
                setNameInput(trimmed);
                onUpdateName(trimmed);
              }}
              className="font-display text-2xl sm:text-3xl font-bold text-[#F4EFE6] bg-[#1E1A16] border border-[#8C6D46]/35 focus:border-[#C5A059] rounded-xl px-3.5 py-1.5 outline-none"
            />
            <span className="font-display text-lg text-[#D9B878]">{rankInfo.rank}</span>
          </div>

          {/* XP Progress Bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-[#C8BFB0] font-mono tabular-nums mb-1.5">
              <span>{profile.totalXp} Detective XP</span>
              <span>
                {rankInfo.nextThreshold
                  ? `${rankInfo.nextThreshold - profile.totalXp} XP to next rank`
                  : 'Maximum Rank Achieved'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#26221E] overflow-hidden">
              <div
                className="h-full bg-[#C5A059] transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${rankInfo.progressPercent / 100})` }}
              />
            </div>

            {/* 4-Rank Ladder Indicator */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#8E8477]">
              {allRankTiers.map((tier, idx) => (
                <React.Fragment key={tier.name}>
                  {idx > 0 && <span aria-hidden="true">→</span>}
                  <span
                    className={
                      rankInfo.rank === tier.name
                        ? 'text-[#D9B878] font-semibold'
                        : profile.totalXp >= tier.minXp
                        ? 'text-[#C8BFB0]'
                        : 'text-[#8E8477]'
                    }
                  >
                    {tier.name} ({tier.minXp}+)
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Utility Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E1A16] hover:bg-[#28231D] border border-[#8C6D46]/35 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
          >
            {profile.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#C5A059]" />
                <span>Audio: Unmuted</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#8E8477]" />
                <span>Audio: Muted</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E1A16] hover:bg-[#2B1817] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Career</span>
          </button>
        </div>
      </section>

      {/* Authentic Gameplay Metrics Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Search Accuracy</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#F4EFE6] tabular-nums">
            {hasAnyTaps ? `${overallAccuracy}%` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            {profile.totalSceneHits} hits · {profile.totalSceneMisTaps} misses
          </div>
        </div>

        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Active Case Rate</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#F4EFE6] tabular-nums">
            {activeCollectionPct}%
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            {activeSave.discoveredClues.length}/{activeCase.clues.length} in {activeCase.code}
          </div>
        </div>

        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Investigation Time</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#F4EFE6] tabular-nums">
            {formatDuration(profile.totalInvestigationSeconds)}
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            Active clock logged
          </div>
        </div>

        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Hints Used</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#F4EFE6] tabular-nums">
            {profile.totalHintsUsed}
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            {activeSave.hintsUsed} in current run
          </div>
        </div>

        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Daily Streak</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#D9B878] tabular-nums flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#C5A059]" />
            <span>{profile.currentStreakDays}d</span>
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            Best: {profile.bestStreakDays}d · {profile.completedDailyIds.length} Dispatches
          </div>
        </div>

        <div className="bg-[#151311] border border-[#8C6D46]/25 rounded-xl p-4">
          <div className="text-xs text-[#8E8477]">Anthology Solved</div>
          <div className="mt-1 font-mono text-xl font-semibold text-[#D9B878] tabular-nums">
            {solvedCasesCount} / {ORDERED_CASES.length}
          </div>
          <div className="mt-1 text-[11px] text-[#8E8477] font-mono tabular-nums">
            5 Playable Mysteries
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-[#F4EFE6] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C5A059]" />
            <span>Commendations & Achievements</span>
          </h2>
          <span className="text-xs font-mono text-[#C5A059] tabular-nums">
            {profile.unlockedAchievementIds.length} / {ACHIEVEMENTS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = profile.unlockedAchievementIds.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl p-4 border transition-colors ${
                  unlocked
                    ? 'bg-[#1D1914] border-[#C5A059]/45'
                    : 'bg-[#13110F] border-[#8C6D46]/15 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className={unlocked ? 'text-[#D9B878]' : 'text-[#8E8477]'}>
                    +{ach.xpBonus} XP
                  </span>
                  {unlocked && <CheckCircle2 className="w-4 h-4 text-[#D9B878]" />}
                </div>
                <div className="mt-1.5 font-display text-base font-semibold text-[#F4EFE6]">
                  {ach.title}
                </div>
                <p className="mt-1 text-xs text-[#C8BFB0] leading-relaxed">
                  {ach.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#141210] border border-[#8C6D46]/25 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8E8477]">
        <span>
          Your investigation progress, completed cases, replay records, and audio settings save
          automatically in this browser—no external account or API key required.
        </span>
        <span className="font-mono text-[#C8BFB0]">Local Save Active</span>
      </section>

      {confirmWipe && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#181512] border border-[#C5A059]/40 rounded-2xl p-6">
            <h3 className="font-display text-2xl font-semibold text-[#F4EFE6]">
              Reset Entire Detective Career?
            </h3>
            <p className="mt-2 text-sm text-[#C8BFB0] leading-relaxed">
              This clears all saved case progress across all five mysteries, Detective XP, ranks,
              streaks, and unlocked achievements stored in this browser.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="min-h-[42px] px-4 py-2 rounded-lg bg-[#24201C] text-sm text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmWipe(false);
                  onResetAllData();
                }}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#9E2A2B] hover:bg-[#B83234] text-sm font-semibold text-[#F4EFE6] cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
