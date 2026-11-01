import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Info,
  Play,
  Sliders,
} from 'lucide-react';
import { AppScreen, CaseDefinition, CaseSaveState, DetectiveProfileState } from '../types/game';
import { getDetectiveRankInfo } from '../services/persistenceService';
import { computeInvestigationProgress } from '../engine/mysteryEngine';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  heroImageUrl: string;
  spotlightCase: CaseDefinition;
  spotlightSave: CaseSaveState;
  profile: DetectiveProfileState;
  hasUnfinishedCase: boolean;
  allCasesCompleted: boolean;
  solvedCasesCount: number;
  onPrimaryPlayAction: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  heroImageUrl,
  spotlightCase,
  spotlightSave,
  profile,
  hasUnfinishedCase,
  allCasesCompleted,
  solvedCasesCount,
  onPrimaryPlayAction,
  onNavigate,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rankInfo = getDetectiveRankInfo(profile.totalXp);
  const progressPct = computeInvestigationProgress(spotlightCase, spotlightSave);

  const primaryButtonLabel = hasUnfinishedCase
    ? 'CONTINUE INVESTIGATION'
    : allCasesCompleted
    ? 'OPEN CASE LIBRARY (5/5 SOLVED)'
    : spotlightCase.id === 'case_001'
    ? 'PLAY'
    : `PLAY ${spotlightCase.code}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
      {/* Cinematic Opening Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative rounded-2xl overflow-hidden border border-[#C5A059]/30 bg-[#12100E] shadow-2xl min-h-[540px] lg:min-h-[600px] grid grid-cols-1 lg:grid-cols-12 items-stretch"
      >
        {/* Full-bleed Atmospheric Mansion Backdrop with Subtle Candle & Moonlight Motion */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {!imgError ? (
            <img
              src={heroImageUrl}
              alt="Victorian mansion library illuminated by candlelight and midnight storm"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
                imgLoaded ? 'opacity-65 lg:opacity-75' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#231D17] via-[#14110F] to-[#0B0A09]" />
          )}

          {/* Subtle Atmospheric Candlelight & Moonlight Overlays */}
          <div className="absolute -left-20 top-1/4 w-96 h-96 rounded-full bg-radial from-[#D9B878]/25 via-[#C5A059]/8 to-transparent blur-2xl animate-candle-flicker" />
          <div className="absolute right-0 top-0 w-[45%] h-full bg-gradient-to-bl from-[#9AB4D6]/15 via-transparent to-transparent animate-moonlight-drift" />

          {/* Editorial Scrims for WCAG AA Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C0B] via-[#0D0C0B]/80 to-[#0D0C0B]/40 lg:bg-gradient-to-r lg:from-[#0D0C0B]/95 lg:via-[#0D0C0B]/82 lg:to-[#0D0C0B]/30" />
        </div>

        {/* Left Column: Brand Typography & Four Simple Primary Options */}
        <div className="relative z-10 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#C5A059] tracking-wider font-medium">
              <span>Victorian Detective Mystery</span>
              <span aria-hidden="true">·</span>
              <span>Five-Case Playable Anthology</span>
            </div>

            <h1 className="mt-4 font-brand text-3xl sm:text-5xl lg:text-[3.35rem] font-bold text-[#D9B878] leading-[1.12] tracking-wide drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]">
              THE MISSING CLUE
            </h1>

            <p className="mt-3 font-display text-sm sm:text-base tracking-[0.14em] text-[#F4EFE6] font-semibold">
              EVERY CRIME LEAVES A CLUE. CAN YOU FIND IT?
            </p>

            <p className="mt-3 text-sm sm:text-base text-[#C8BFB0] leading-relaxed max-w-[54ch]">
              Examine hand-painted crime scenes by candlelight, uncover concealed physical exhibits,
              connect evidence with crimson string, and unmask a calculating killer across five
              complete mysteries.
            </p>
          </div>

          {/* FOUR CLEAR MAIN OPTIONS: PLAY (status-aware), CASE LIBRARY, SETTINGS, ABOUT */}
          <div className="max-w-md w-full space-y-3">
            {/* Option 1: Status-Aware Primary Action (Never shows Resume for completed cases) */}
            <button
              type="button"
              onClick={onPrimaryPlayAction}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] font-semibold text-sm sm:text-base flex items-center justify-between shadow-lg transition-all cursor-pointer"
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>{primaryButtonLabel}</span>
              </span>
              {hasUnfinishedCase ? (
                <span className="font-mono text-xs text-[#0D0C0B]/80 tabular-nums whitespace-nowrap">
                  {spotlightSave.discoveredClues.length}/{spotlightCase.clues.length} Clues
                </span>
              ) : (
                <ArrowRight className="w-4 h-4 shrink-0" />
              )}
            </button>

            {/* Option 2: CASE LIBRARY */}
            <button
              type="button"
              onClick={() => onNavigate('CASE_FILES')}
              className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#181512]/90 hover:bg-[#231E19] border border-[#C5A059]/35 text-[#F4EFE6] font-semibold text-sm sm:text-base flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <BookOpen className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>CASE LIBRARY</span>
              </span>
              <span className="flex items-center gap-2 text-xs font-mono text-[#D9B878]">
                <span>{solvedCasesCount}/5 Solved</span>
                <ArrowRight className="w-4 h-4 text-[#C5A059] shrink-0" />
              </span>
            </button>

            {/* Options 3 & 4: SETTINGS and ABOUT */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('SETTINGS')}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#161310]/90 hover:bg-[#221D18] border border-[#8C6D46]/35 text-[#F4EFE6] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>SETTINGS</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ABOUT')}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#161310]/90 hover:bg-[#221D18] border border-[#8C6D46]/35 text-[#F4EFE6] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Info className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>ABOUT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active / Next Playable Case Dossier Anchor */}
        <div className="relative z-10 lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-end">
          <div className="bg-[#14110F]/88 backdrop-blur-md border border-[#C5A059]/30 rounded-2xl p-6 space-y-4">
            {allCasesCompleted ? (
              <>
                <div className="flex items-center gap-2 text-xs text-[#D9B878] font-mono">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                  <span>ALL 5 ANTHOLOGY CASES COMPLETED</span>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-[#F4EFE6]">
                    Master of the Archive
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[#C8BFB0] leading-relaxed">
                    Every mystery from Blackwood Manor to King’s Bench Chambers has been solved.
                    Open the Case Library anytime to inspect solved dossiers or start a fresh Replay
                    Case session.
                  </p>
                </div>

                <div className="pt-3 border-t border-[#8C6D46]/25 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-mono text-[#D9B878]">5 of 5 Cases Solved</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('CASE_FILES')}
                    className="text-[#C8BFB0] hover:text-[#F4EFE6] underline cursor-pointer"
                  >
                    Replay Any Case
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#D9B878] font-mono">
                  <span>{spotlightCase.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {hasUnfinishedCase ? 'ACTIVE INVESTIGATION' : 'PLAYABLE NOW'}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-[#F4EFE6]">
                    {spotlightCase.title}
                  </h2>
                  <div className="text-xs text-[#C5A059] mt-0.5">{spotlightCase.subtitle}</div>
                  <p className="mt-2 text-xs sm:text-sm text-[#C8BFB0] leading-relaxed line-clamp-3">
                    {spotlightCase.introBriefing[0]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#8C6D46]/25 flex flex-wrap items-center justify-between gap-2 text-xs text-[#C8BFB0] font-mono tabular-nums">
                  <span>
                    {spotlightCase.clues.length} Exhibits · {spotlightCase.suspects.length} Suspects
                  </span>
                  <span className="text-[#D9B878]">
                    {hasUnfinishedCase ? `${progressPct}% Investigated` : 'Available Now'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.section>

      {/* Quiet Secondary Progression Strip: Daily Mystery & Detective Service Record */}
      <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('DAILY_MYSTERY')}
          className="bg-[#151311] hover:bg-[#1B1815] border border-[#8C6D46]/25 rounded-xl p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Telegraph Dispatch</span>
            </div>
            <div className="font-display text-lg font-semibold text-[#F4EFE6]">
              Daily Mystery Riddles
            </div>
            <div className="text-xs text-[#C8BFB0]">
              {profile.completedDailyIds.length} solved · {profile.currentStreakDays}-day streak
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#C5A059] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('PROFILE')}
          className="bg-[#151311] hover:bg-[#1B1815] border border-[#8C6D46]/25 rounded-xl p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>Service Record & Commendations</span>
            </div>
            <div className="font-display text-lg font-semibold text-[#F4EFE6]">
              {profile.detectiveName} · {rankInfo.rank}
            </div>
            <div className="text-xs text-[#C8BFB0] font-mono tabular-nums">
              {profile.totalXp} XP · {profile.unlockedAchievementIds.length}/6 Achievements
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#C5A059] shrink-0" />
        </button>
      </section>

      {/* PWA Home Screen Installation Option */}
      <PWAInstallButton variant="banner" className="mt-5" />
    </div>
  );
};
