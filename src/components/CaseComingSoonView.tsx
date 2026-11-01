import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Sparkles,
} from 'lucide-react';
import { PlannedCaseBlueprint } from '../types/game';

interface CaseComingSoonViewProps {
  blueprint: PlannedCaseBlueprint;
  isCase001Completed: boolean;
  onOpenCaseLibrary: () => void;
  onReturnHome: () => void;
  onOpenDailyMystery: () => void;
}

export const CaseComingSoonView: React.FC<CaseComingSoonViewProps> = ({
  blueprint,
  isCase001Completed,
  onOpenCaseLibrary,
  onReturnHome,
  onOpenDailyMystery,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 pb-28 md:pb-16 space-y-5">
      {/* Clear Back Route to Case Library */}
      <div>
        <button
          type="button"
          onClick={onOpenCaseLibrary}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Case Library</span>
        </button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-[#151311] border border-[#C5A059]/40 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-[#211A12] to-[#151311] border-b border-[#C5A059]/25 px-6 sm:px-10 py-8 sm:py-10 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-[#C5A059]">
            <Clock className="w-4 h-4" />
            <span>{blueprint.code} · COMING SOON</span>
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-[#F4EFE6]">
            {blueprint.title}
          </h1>

          <p className="mt-2 font-display italic text-lg sm:text-2xl text-[#D9B878]">
            {blueprint.subtitle}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {isCase001Completed && (
            <div className="bg-[#1B1714] border border-[#C5A059]/35 rounded-xl px-5 py-3.5 flex items-center gap-3 text-xs sm:text-sm text-[#F4EFE6]">
              <CheckCircle2 className="w-4 h-4 text-[#D9B878] shrink-0" />
              <span>
                <strong className="text-[#D9B878] font-semibold">Case 001: The Last Dinner</strong>{' '}
                remains permanently saved as <strong className="font-semibold">COMPLETED</strong> in
                your browser.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-start">
            <div className="md:col-span-7 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#F4EFE6]">
                Upcoming Anthology Investigation
              </h2>
              <p className="text-sm sm:text-base text-[#F4EFE6]/90 leading-relaxed font-serif">
                {blueprint.synopsis}
              </p>
              <p className="text-xs sm:text-sm text-[#C8BFB0] leading-relaxed">
                Hand-painted crime-scene artwork, concealed physical exhibits, and suspect
                cross-examinations for{' '}
                <span className="text-[#F4EFE6] font-medium">
                  {blueprint.code}: {blueprint.title}
                </span>{' '}
                are currently in preparation. While you await dispatch, sharpen your instincts in
                Daily Mystery or browse the Case Library.
              </p>
            </div>

            <div className="md:col-span-5 bg-[#1B1815] border border-[#8C6D46]/30 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#8C6D46]/20">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span className="font-display text-base font-semibold text-[#F4EFE6]">
                  Dossier Specifications
                </span>
              </div>

              <dl className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#8E8477]">Availability</dt>
                  <dd className="font-mono text-[#D9B878] text-right">Coming Soon</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#8E8477]">Environment</dt>
                  <dd className="text-[#F4EFE6] text-right">{blueprint.environmentType}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#8E8477]">Timeline Window</dt>
                  <dd className="font-mono text-[#F4EFE6] tabular-nums text-right">
                    {blueprint.timelineWindow}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#8E8477]">Planned Exhibits</dt>
                  <dd className="font-mono text-[#F4EFE6] tabular-nums text-right">
                    {blueprint.plannedClueCount} Objects
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#8E8477]">Suspect Roster</dt>
                  <dd className="font-mono text-[#F4EFE6] tabular-nums text-right">
                    {blueprint.plannedSuspectCount} Suspects
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Primary Case Library Button + Secondary Navigation */}
          <div className="pt-6 border-t border-[#8C6D46]/25 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onOpenCaseLibrary}
              className="min-h-[50px] px-7 py-3 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Case Library</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={onOpenDailyMystery}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#C5A059]/30 text-[#F4EFE6] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Daily Mystery</span>
              </button>

              <button
                type="button"
                onClick={onReturnHome}
                className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#181512] hover:bg-[#221E1A] border border-[#8C6D46]/30 text-[#C8BFB0] hover:text-[#F4EFE6] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#8C6D46] shrink-0" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
