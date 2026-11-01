import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AppScreen } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  hasUnfinishedCase: boolean;
  nextPlayableCaseLabel: string | null;
  hasSolvedResults: boolean;
  discoveredCount: number;
  totalClues: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPrimaryCaseAction: () => void;
}

/**
 * 3-Zone Top Bar Contract:
 * [Zone 1: Single-line Brand Wordmark] — [Zone 2: 5 single-line nav links] — [Zone 3: Audio + 1 primary CTA]
 */
export const TopNav: React.FC<TopNavProps> = ({
  currentScreen,
  onNavigate,
  hasUnfinishedCase,
  nextPlayableCaseLabel,
  hasSolvedResults,
  discoveredCount,
  totalClues,
  soundEnabled,
  onToggleSound,
  onPrimaryCaseAction,
}) => {
  const isInCase = currentScreen.startsWith('PLAYING_');

  const navItems: { label: string; screen: AppScreen }[] = isInCase
    ? [
        { label: 'Crime Scene', screen: 'PLAYING_SCENE' },
        { label: `Evidence (${discoveredCount}/${totalClues})`, screen: 'PLAYING_EVIDENCE' },
        { label: 'Board', screen: 'PLAYING_BOARD' },
        { label: 'Suspects', screen: 'PLAYING_SUSPECTS' },
        { label: 'Case Library', screen: 'CASE_FILES' },
      ]
    : [
        { label: 'Home', screen: 'HOME' },
        { label: 'Case Library', screen: 'CASE_FILES' },
        { label: 'Daily Mystery', screen: 'DAILY_MYSTERY' },
        { label: 'Settings', screen: 'SETTINGS' },
        { label: 'About', screen: 'ABOUT' },
      ];

  return (
    <header className="sticky top-0 z-40 h-[52px] flex items-center justify-between gap-6 px-4 sm:px-6 bg-[#110F0D]/95 backdrop-blur-md border-b border-[#C5A059]/20">
      {/* Zone 1: Single-line Cinzel Decorative Brand Wordmark */}
      <button
        type="button"
        onClick={() => onNavigate('HOME')}
        className="font-brand text-sm sm:text-base font-bold tracking-wider text-[#D9B878] hover:text-[#F4EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C5A059]"
      >
        THE MISSING CLUE
      </button>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#C8BFB0]">
        {navItems.map((item) => {
          const active =
            currentScreen === item.screen ||
            (item.screen === 'SETTINGS' && currentScreen === 'PROFILE');
          return (
            <button
              key={item.screen}
              type="button"
              onClick={() => onNavigate(item.screen)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                active
                  ? 'text-[#D9B878] border-[#C5A059]'
                  : 'text-[#C8BFB0] border-transparent hover:text-[#F4EFE6] hover:border-[#C5A059]/40'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Quick Audio Mute + PWA Install + 1 Status-Aware Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <PWAInstallButton variant="compact" />
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          className="min-h-[38px] min-w-[38px] rounded-lg bg-[#1A1714] hover:bg-[#25201B] border border-[#8C6D46]/30 text-[#C8BFB0] hover:text-[#D9B878] flex items-center justify-center transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#C5A059]" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {isInCase ? (
          <button
            type="button"
            onClick={() => onNavigate('PLAYING_ACCUSE')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              currentScreen === 'PLAYING_ACCUSE'
                ? 'bg-[#D9B878] text-[#0D0C0B]'
                : 'bg-[#C5A059] text-[#0D0C0B] hover:bg-[#D9B878]'
            }`}
          >
            {hasSolvedResults ? 'Case Results' : 'Final Accusation'}
          </button>
        ) : hasUnfinishedCase ? (
          <button
            type="button"
            onClick={onPrimaryCaseAction}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#0D0C0B] bg-[#C5A059] rounded-lg hover:bg-[#D9B878] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
          >
            Continue Case
          </button>
        ) : currentScreen === 'CASE_FILES' && nextPlayableCaseLabel ? (
          <button
            type="button"
            onClick={onPrimaryCaseAction}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#0D0C0B] bg-[#C5A059] rounded-lg hover:bg-[#D9B878] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
          >
            {nextPlayableCaseLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('CASE_FILES')}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#0D0C0B] bg-[#C5A059] rounded-lg hover:bg-[#D9B878] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
          >
            Case Library
          </button>
        )}
      </div>
    </header>
  );
};
