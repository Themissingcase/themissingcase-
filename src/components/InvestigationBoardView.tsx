import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Link2,
  RotateCcw,
  Scissors,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  CaseDefinition,
  CaseSaveState,
  HiddenObjectClue,
  SuspectProfile,
} from '../types/game';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface InvestigationBoardViewProps {
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onConnectNodes: (fromId: string, toId: string) => {
    status: 'ADDED' | 'REMOVED' | 'EXISTS';
    unlockedTitle?: string;
  };
  onRemoveConnection: (connectionId: string) => void;
  onResetBoardLayout: () => void;
  onInspectClue: (clue: HiddenObjectClue) => void;
  onBackToEvidence: () => void;
  onOpenSuspects: () => void;
}

interface BoardCardItem {
  id: string;
  kind: 'SUSPECT' | 'CLUE';
  title: string;
  subtitle: string;
  suspect?: SuspectProfile;
  clue?: HiddenObjectClue;
}

export const InvestigationBoardView: React.FC<InvestigationBoardViewProps> = ({
  caseDef,
  saveState,
  onMoveNode,
  onConnectNodes,
  onRemoveConnection,
  onResetBoardLayout,
  onInspectClue,
  onBackToEvidence,
  onOpenSuspects,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [boardFeedback, setBoardFeedback] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragMeta = useRef<{
    nodeId: string | null;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({
    nodeId: null,
    startClientX: 0,
    startClientY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  const boardItems: BoardCardItem[] = useMemo(() => {
    const suspectNodes: BoardCardItem[] = caseDef.suspects.map((s) => ({
      id: s.id,
      kind: 'SUSPECT',
      title: s.name,
      subtitle: s.role,
      suspect: s,
    }));

    const clueNodes: BoardCardItem[] = caseDef.clues
      .filter((c) => saveState.discoveredClues.includes(c.id))
      .map((c) => ({
        id: c.id,
        kind: 'CLUE',
        title: c.name,
        subtitle: `Clue #${c.number}`,
        clue: c,
      }));

    return [...suspectNodes, ...clueNodes];
  }, [caseDef.clues, caseDef.suspects, saveState.discoveredClues]);

  const getPos = (id: string) => saveState.boardPositions[id] || { x: 0.5, y: 0.5 };

  const handlePinClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!selectedPinId) {
      setSelectedPinId(itemId);
      setBoardFeedback('Select a second pin to stretch a red string between them.');
      return;
    }

    if (selectedPinId === itemId) {
      setSelectedPinId(null);
      setBoardFeedback(null);
      return;
    }

    const result = onConnectNodes(selectedPinId, itemId);
    setSelectedPinId(null);

    if (result.unlockedTitle) {
      setBoardFeedback(`Breakthrough Deduction Unlocked: ${result.unlockedTitle}`);
    } else if (result.status === 'REMOVED') {
      setBoardFeedback('Red string connection removed.');
    } else {
      setBoardFeedback(
        'Circumstantial thread pinned. Try linking clues that corroborate timeline, poison access, or forged ciphers.'
      );
    }
  };

  const handlePointerDownCard = (e: React.PointerEvent, itemId: string) => {
    // Ignore if clicking a button inside card
    if ((e.target as HTMLElement).closest('button')) return;
    const pos = getPos(itemId);
    dragMeta.current = {
      nodeId: itemId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setDraggingId(itemId);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveCard = (e: React.PointerEvent) => {
    if (!dragMeta.current.nodeId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = e.clientX - dragMeta.current.startClientX;
    const dy = e.clientY - dragMeta.current.startClientY;
    if (Math.hypot(dx, dy) > 4) {
      dragMeta.current.moved = true;
    }

    const nextX = Math.max(0.08, Math.min(0.92, dragMeta.current.origX + dx / rect.width));
    const nextY = Math.max(0.10, Math.min(0.90, dragMeta.current.origY + dy / rect.height));
    onMoveNode(dragMeta.current.nodeId, nextX, nextY);
  };

  const handlePointerUpCard = (e: React.PointerEvent, itemId: string) => {
    if (dragMeta.current.nodeId === itemId) {
      // If user had a selected pin and tapped another card cleanly without dragging, connect them!
      if (!dragMeta.current.moved && selectedPinId && selectedPinId !== itemId) {
        const result = onConnectNodes(selectedPinId, itemId);
        setSelectedPinId(null);
        if (result.unlockedTitle) {
          setBoardFeedback(`Breakthrough Deduction Unlocked: ${result.unlockedTitle}`);
        } else {
          setBoardFeedback('Thread pinned to board.');
        }
      }
      dragMeta.current.nodeId = null;
      setDraggingId(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore safely
      }
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-4 pb-24 md:pb-8 flex flex-col gap-4">
      {/* Top Board Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151311] border border-[#C5A059]/25 rounded-xl px-4 py-3">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={onBackToEvidence}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D9B878] hover:text-[#F4EFE6] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Evidence</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-mono tabular-nums">
            <span>Red-String Deduction Wall</span>
            <span aria-hidden="true">·</span>
            <span>
              {saveState.unlockedDeductions.length} of {caseDef.deductionRules.length} Breakthroughs
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-[#F4EFE6]">
            Investigation Board
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetBoardLayout}
            className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#1F1C18] hover:bg-[#292520] border border-[#8C6D46]/30 text-xs font-medium text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tidy Cards</span>
          </button>

          <button
            type="button"
            onClick={onOpenSuspects}
            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#D9B878] text-[#0D0C0B] text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-4 h-4" />
            <span>Interrogate Suspects</span>
          </button>
        </div>
      </div>

      {boardFeedback && (
        <div className="bg-[#1D1813] border border-[#C5A059]/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#D9B878] flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{boardFeedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setBoardFeedback(null)}
            className="text-xs text-[#C8BFB0] hover:text-[#F4EFE6] cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Interactive Cork/Baize Board Surface */}
        <div className="xl:col-span-9 overflow-x-auto rounded-2xl border border-[#8C6D46]/35 bg-[#14110F]">
          <div
            ref={boardRef}
            onClick={() => {
              if (selectedPinId) {
                setSelectedPinId(null);
                setBoardFeedback(null);
              }
            }}
            style={{
              backgroundImage:
                'radial-gradient(rgba(197, 160, 89, 0.09) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            className="relative min-w-[680px] w-full h-[540px] sm:h-[600px] select-none overflow-hidden"
          >
            {/* Empty Clue Notice */}
            {saveState.discoveredClues.length === 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-[#1C1815]/95 border border-[#C5A059]/30 text-xs text-[#C8BFB0] whitespace-nowrap">
                Search the Crime Scene first to pin physical evidence cards onto this board.
              </div>
            )}

            {/* Crimson String SVG Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {saveState.connections.map((conn) => {
                const p1 = getPos(conn.fromId);
                const p2 = getPos(conn.toId);
                const isVerified = Boolean(conn.deductionId);

                return (
                  <g key={conn.id} className="pointer-events-auto cursor-pointer">
                    <line
                      x1={`${p1.x * 100}%`}
                      y1={`${p1.y * 100}%`}
                      x2={`${p2.x * 100}%`}
                      y2={`${p2.y * 100}%`}
                      stroke="#050404"
                      strokeWidth="6"
                      strokeOpacity="0.55"
                    />
                    <line
                      x1={`${p1.x * 100}%`}
                      y1={`${p1.y * 100}%`}
                      x2={`${p2.x * 100}%`}
                      y2={`${p2.y * 100}%`}
                      stroke={isVerified ? '#D9B878' : '#B92B27'}
                      strokeWidth={isVerified ? '3' : '2.4'}
                      strokeDasharray={isVerified ? undefined : '6 3'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveConnection(conn.id);
                        setBoardFeedback('Snipped string connection.');
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Draggable Suspect & Evidence Cards */}
            {boardItems.map((item) => {
              const pos = getPos(item.id);
              const isPinSelected = selectedPinId === item.id;
              const isDragging = draggingId === item.id;

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handlePointerDownCard(e, item.id)}
                  onPointerMove={handlePointerMoveCard}
                  onPointerUp={(e) => handlePointerUpCard(e, item.id)}
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-[134px] sm:w-[148px] rounded-xl p-2.5 border transition-shadow touch-none ${
                    isPinSelected
                      ? 'bg-[#262019] border-[#D9B878] shadow-[0_0_20px_rgba(217,184,120,0.3)]'
                      : item.kind === 'SUSPECT'
                      ? 'bg-[#1B1815] border-[#8C6D46]/40 shadow-lg'
                      : 'bg-[#201C17] border-[#C5A059]/35 shadow-lg'
                  } ${isDragging ? 'cursor-grabbing z-30 scale-[1.03]' : 'cursor-grab'}`}
                >
                  {/* Brass Push-Pin Connect Trigger */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <button
                      type="button"
                      onClick={(e) => handlePinClick(e, item.id)}
                      className={`min-h-[30px] px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        isPinSelected
                          ? 'bg-[#D9B878] text-[#0D0C0B]'
                          : 'bg-[#2A241E] hover:bg-[#383028] text-[#D9B878]'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>{isPinSelected ? 'Selected' : 'Link'}</span>
                    </button>

                    {item.clue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectClue(item.clue!);
                        }}
                        aria-label={`Inspect ${item.title}`}
                        className="min-h-[30px] min-w-[30px] rounded-md bg-[#161310] hover:bg-[#2A241E] text-[#C8BFB0] flex items-center justify-center cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail */}
                  {item.suspect ? (
                    <div className="h-14 w-full rounded-lg overflow-hidden bg-[#110F0D] mb-1.5">
                      <img
                        src={item.suspect.portraitUrl}
                        alt={item.suspect.name}
                        referrerPolicy="no-referrer"
                        draggable={false}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  ) : item.clue ? (
                    <div className="h-12 w-full rounded-lg bg-[#14110E] flex items-center justify-center mb-1.5 p-1">
                      <SceneObjectArtwork clueId={item.clue.id} variant="inspector" className="w-10 h-10" />
                    </div>
                  ) : null}

                  <div className="font-display text-xs font-semibold text-[#F4EFE6] truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-[#8E8477] truncate">{item.subtitle}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Breakthrough Deductions Log */}
        <aside className="xl:col-span-3 bg-[#151311] border border-[#8C6D46]/25 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-[#8C6D46]/20">
            <h2 className="font-display text-lg font-semibold text-[#F4EFE6]">
              Verified Deductions
            </h2>
            <p className="mt-1 text-xs text-[#8E8477] leading-relaxed">
              Tap <strong className="text-[#D9B878]">Link</strong> on two related cards to stretch a string. Tap any string with <Scissors className="w-3 h-3 inline" /> to snip it.
            </p>
          </div>

          <div className="space-y-3">
            {caseDef.deductionRules.map((rule, idx) => {
              const unlocked = saveState.unlockedDeductions.includes(rule.id);
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl p-3.5 border ${
                    unlocked
                      ? 'bg-[#1E1A15] border-[#C5A059]/40'
                      : 'bg-[#12100E] border-[#8C6D46]/15 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className={unlocked ? 'text-[#D9B878]' : 'text-[#8E8477]'}>
                      0{idx + 1}. {unlocked ? 'Verified Link' : 'Unlinked Hypothesis'}
                    </span>
                    {unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B878]" />}
                  </div>

                  <div className="mt-1 font-display text-sm font-semibold text-[#F4EFE6]">
                    {unlocked ? rule.title : 'Connect Corroborating Evidence'}
                  </div>

                  <p className="mt-1 text-xs text-[#C8BFB0] leading-relaxed">
                    {unlocked
                      ? rule.insight
                      : 'Link two matching physical clues or suspect cards on the board to unlock this breakthrough.'}
                  </p>

                  {unlocked && (
                    <div className="mt-2 text-[11px] text-[#C5A059]">{rule.unlocksNote}</div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
