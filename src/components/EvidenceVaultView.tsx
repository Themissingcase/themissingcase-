import React from 'react';
import { ArrowLeft, CheckCircle2, Eye, Lock, Network, Users } from 'lucide-react';
import { CaseDefinition, CaseSaveState, HiddenObjectClue } from '../types/game';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface EvidenceVaultViewProps {
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  onInspectClue: (clue: HiddenObjectClue) => void;
  onReturnToScene: () => void;
  onOpenBoard: () => void;
  onOpenSuspects: () => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  caseDef,
  saveState,
  onInspectClue,
  onReturnToScene,
  onOpenBoard,
  onOpenSuspects,
}) => {
  const discoveredSet = new Set(saveState.discoveredClues);
  const inspectedSet = new Set(saveState.inspectedClues);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#8C6D46]/25">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onReturnToScene}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Crime Scene</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono tabular-nums pt-0.5">
            <span>{caseDef.code}</span>
            <span aria-hidden="true">·</span>
            <span>{saveState.discoveredClues.length} of {caseDef.clues.length} Recovered</span>
            <span aria-hidden="true">·</span>
            <span>{saveState.inspectedClues.length} Examined</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4EFE6]">
            Evidence Satchel & Forensics
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSuspects}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#1D1A17] hover:bg-[#26221E] border border-[#8C6D46]/30 text-xs sm:text-sm font-medium text-[#F4EFE6] flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-[#C5A059]" />
            <span>Suspects</span>
          </button>
          <button
            type="button"
            onClick={onOpenBoard}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Network className="w-4 h-4" />
            <span>Investigation Board</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {caseDef.clues.map((clue) => {
          const isFound = discoveredSet.has(clue.id);
          const isInspected = inspectedSet.has(clue.id);

          if (!isFound) {
            return (
              <div
                key={clue.id}
                className="rounded-2xl bg-[#13110F] border border-[#8C6D46]/15 p-5 flex flex-col justify-between min-h-[250px] opacity-75"
              >
                <div className="flex items-center justify-between text-xs text-[#8E8477] font-mono">
                  <span>Item #{clue.number}</span>
                  <Lock className="w-3.5 h-3.5" />
                </div>

                <div className="my-6 flex flex-col items-center text-center">
                  <div className="font-display text-lg font-medium text-[#C8BFB0]">
                    {clue.name}
                  </div>
                  <p className="mt-1.5 text-xs text-[#8E8477] leading-relaxed">
                    Still concealed somewhere inside the {caseDef.environmentType.toLowerCase()}.
                  </p>
                </div>

                <div className="text-[11px] text-[#8E8477] font-mono">
                  Zone: {clue.quadrantLabel}
                </div>
              </div>
            );
          }

          return (
            <div
              key={clue.id}
              onClick={() => onInspectClue(clue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onInspectClue(clue);
                }
              }}
              className="rounded-2xl bg-[#171411] hover:bg-[#1E1A16] border border-[#C5A059]/30 p-5 flex flex-col justify-between min-h-[250px] transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#C5A059]">Item #{clue.number}</span>
                <span className="text-[#C8BFB0] flex items-center gap-1">
                  {isInspected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B878]" />
                      <span>Examined</span>
                    </>
                  ) : (
                    <span className="text-[#D9B878]">New Clue</span>
                  )}
                </span>
              </div>

              <div className="my-3 h-28 rounded-xl bg-[#110F0D] border border-[#8C6D46]/20 flex items-center justify-center p-2">
                <div className="w-24 h-24 group-hover:scale-105 transition-transform duration-200">
                  <SceneObjectArtwork clueId={clue.id} variant="inspector" />
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold text-[#F4EFE6]">
                  {clue.name}
                </h2>
                <p className="mt-1 text-xs text-[#C8BFB0] line-clamp-2 leading-relaxed">
                  {clue.summary}
                </p>

                <div className="mt-3 pt-2.5 border-t border-[#8C6D46]/20 flex items-center justify-between text-xs text-[#D9B878] font-medium">
                  <span>Forensic Inspection</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
