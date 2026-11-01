import React from 'react';
import {
  BookOpen,
  Calendar,
  Compass,
  FolderSearch,
  Gavel,
  Home,
  Info,
  Network,
  Sliders,
  Users,
} from 'lucide-react';
import { AppScreen } from '../types/game';

interface MobileBottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  discoveredCount: number;
  hasSolvedResults?: boolean;
}

/**
 * Compact 54px thumb-zone bottom navigation bar on mobile (< md),
 * keeping combined top + bottom fixed chrome within ergonomic limits.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
  discoveredCount,
  hasSolvedResults = false,
}) => {
  const isInCase = currentScreen.startsWith('PLAYING_');

  const tabs: { label: string; screen: AppScreen; icon: React.ReactNode }[] = isInCase
    ? [
        { label: 'Scene', screen: 'PLAYING_SCENE', icon: <Compass className="w-4 h-4" /> },
        {
          label: `Clues (${discoveredCount})`,
          screen: 'PLAYING_EVIDENCE',
          icon: <FolderSearch className="w-4 h-4" />,
        },
        { label: 'Board', screen: 'PLAYING_BOARD', icon: <Network className="w-4 h-4" /> },
        { label: 'Suspects', screen: 'PLAYING_SUSPECTS', icon: <Users className="w-4 h-4" /> },
        {
          label: hasSolvedResults ? 'Results' : 'Accuse',
          screen: 'PLAYING_ACCUSE',
          icon: <Gavel className="w-4 h-4" />,
        },
      ]
    : [
        { label: 'Home', screen: 'HOME', icon: <Home className="w-4 h-4" /> },
        { label: 'Library', screen: 'CASE_FILES', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Daily', screen: 'DAILY_MYSTERY', icon: <Calendar className="w-4 h-4" /> },
        { label: 'Settings', screen: 'SETTINGS', icon: <Sliders className="w-4 h-4" /> },
        { label: 'About', screen: 'ABOUT', icon: <Info className="w-4 h-4" /> },
      ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[54px] bg-[#110F0D]/95 backdrop-blur-md border-t border-[#C5A059]/20 grid"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const active =
          currentScreen === tab.screen ||
          (tab.screen === 'CASE_FILES' && currentScreen === 'CASE_COMING_SOON') ||
          (tab.screen === 'SETTINGS' && currentScreen === 'PROFILE');
        return (
          <button
            key={tab.screen}
            type="button"
            onClick={() => onNavigate(tab.screen)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              active ? 'text-[#D9B878]' : 'text-[#8E8477] hover:text-[#F4EFE6]'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium tracking-tight whitespace-nowrap truncate max-w-[68px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
