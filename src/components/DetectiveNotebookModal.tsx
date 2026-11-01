import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  FolderSearch,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { CaseDefinition, CaseSaveState } from '../types/game';
import { SceneObjectArtwork } from './SceneObjectArtwork';

interface DetectiveNotebookModalProps {
  isOpen: boolean;
  caseDef: CaseDefinition;
  saveState: CaseSaveState;
  onUpdateNotes: (notes: string) => void;
  onClose: () => void;
}

export const DetectiveNotebookModal: React.FC<DetectiveNotebookModalProps> = ({
  isOpen,
  caseDef,
  saveState,
  onUpdateNotes,
  onClose,
}) => {
  const [tab, setTab] = useState<'EVIDENCE' | 'SUSPECTS' | 'DEDUCTIONS' | 'NOTES'>('EVIDENCE');

  if (!isOpen) return null;

  const discoveredClues = caseDef.clues.filter((c) =>
    saveState.discoveredClues.includes(c.id)
  );

  const unlockedRules = caseDef.deductionRules.filter((r) =>
    saveState.unlockedDeductions.includes(r.id)
  );

  const exposedContradictionObjs = caseDef.canonicalDatabase.contradictions.filter((c) =>
    saveState.exposedContradictions.includes(c.id)
  );

  // Recorded suspect statements from asked questions
  const recordedStatements = caseDef.suspects.flatMap((suspect) =>
    suspect.baselineQuestions
      .filter((q) => saveState.askedQuestions.includes(`${suspect.id}:${q.id}`))
      .map((q) => ({
        key: `${suspect.id}:${q.id}`,
        suspectName: suspect.name,
        prompt: q.prompt,
        answer: q.answer,
      }))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detective-notebook-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[88dvh] flex flex-col bg-[#161310] border-t sm:border border-[#C5A059]/40 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#8C6D46]/25 flex items-center justify-between gap-4 bg-[#1B1713]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#C5A059] shrink-0" />
            <div>
              <h2
                id="detective-notebook-title"
                className="font-display text-xl font-semibold text-[#F4EFE6]"
              >
                Detective’s Field Notebook
              </h2>
              <div className="text-xs text-[#8E8477] font-mono">
                {caseDef.code} · {caseDef.title}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Notebook"
            className="min-h-[42px] min-w-[42px] rounded-xl bg-[#24201B] hover:bg-[#2F2923] text-[#C8BFB0] hover:text-[#F4EFE6] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Clean Notebook Tabs */}
        <div className="px-5 pt-3 pb-2 bg-[#161310] border-b border-[#8C6D46]/15 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('EVIDENCE')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'EVIDENCE'
                ? 'bg-[#C5A059] text-[#0D0C0B]'
                : 'bg-[#1E1A16] text-[#C8BFB0] hover:text-[#F4EFE6]'
            }`}
          >
            <FolderSearch className="w-3.5 h-3.5" />
            <span>
              Evidence ({discoveredClues.length}/{caseDef.clues.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('SUSPECTS')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'SUSPECTS'
                ? 'bg-[#C5A059] text-[#0D0C0B]'
                : 'bg-[#1E1A16] text-[#C8BFB0] hover:text-[#F4EFE6]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Suspects ({caseDef.suspects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('DEDUCTIONS')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'DEDUCTIONS'
                ? 'bg-[#C5A059] text-[#0D0C0B]'
                : 'bg-[#1E1A16] text-[#C8BFB0] hover:text-[#F4EFE6]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              Statements & Links (
              {unlockedRules.length + exposedContradictionObjs.length + recordedStatements.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('NOTES')}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'NOTES'
                ? 'bg-[#C5A059] text-[#0D0C0B]'
                : 'bg-[#1E1A16] text-[#C8BFB0] hover:text-[#F4EFE6]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Field Notes</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'EVIDENCE' && (
            <div className="space-y-2.5">
              {discoveredClues.length === 0 ? (
                <p className="text-xs text-[#C8BFB0] py-4">
                  No physical exhibits logged yet. Search the {caseDef.environmentType.toLowerCase()} to bag concealed clues.
                </p>
              ) : (
                discoveredClues.map((clue) => {
                  const inspected = saveState.inspectedClues.includes(clue.id);
                  return (
                    <div
                      key={clue.id}
                      className="p-3.5 rounded-xl bg-[#1C1814] border border-[#8C6D46]/25 flex items-start gap-3 text-xs"
                    >
                      <div className="w-11 h-11 rounded-lg bg-[#12100E] border border-[#8C6D46]/20 p-1 shrink-0">
                        <SceneObjectArtwork clueId={clue.id} variant="inspector" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-semibold text-[#F4EFE6]">
                            #{clue.number} · {clue.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#C5A059] shrink-0">
                            {inspected ? 'Forensics Examined' : 'Recovered'}
                          </span>
                        </div>
                        <div className="text-[#8E8477]">{clue.locationFound}</div>
                        <p className="text-[#C8BFB0] leading-relaxed">
                          {inspected ? clue.inspectionNote : clue.summary}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'SUSPECTS' && (
            <div className="space-y-2.5">
              {caseDef.suspects.map((s) => {
                const comp = saveState.suspectComposure[s.id] || 'CALM';
                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#1C1814] border border-[#8C6D46]/25 flex items-start gap-3 text-xs"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#110F0D] border border-[#C5A059]/25 shrink-0">
                      <img
                        src={s.portraitUrl}
                        alt={s.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-[#F4EFE6]">
                          {s.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#C5A059]">
                          Demeanor: {comp}
                        </span>
                      </div>
                      <div className="text-[#D9B878]">
                        {s.role} · Age {s.age}
                      </div>
                      <div className="text-[#C8BFB0] leading-relaxed">
                        <strong className="text-[#F4EFE6]">Alibi:</strong> {s.initialAlibi}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'DEDUCTIONS' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-sm font-semibold text-[#D9B878] mb-2">
                  Exposed Interrogation Contradictions
                </h3>
                {exposedContradictionObjs.length === 0 ? (
                  <p className="text-xs text-[#8E8477]">
                    No contradictions exposed yet. Present physical clues to suspects during interrogation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {exposedContradictionObjs.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-[#1D1814] border border-[#C5A059]/30 text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#F4EFE6] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                          <span>{c.claim}</span>
                        </div>
                        <div className="text-[#C8BFB0]">{c.reality}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-[#D9B878] mb-2">
                  Board Breakthrough Links
                </h3>
                {unlockedRules.length === 0 ? (
                  <p className="text-xs text-[#8E8477]">
                    No red-string breakthroughs verified yet. Link corroborating items on the Board.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unlockedRules.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl bg-[#1D1814] border border-[#C5A059]/30 text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#F4EFE6] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D9B878] shrink-0" />
                          <span>{r.title}</span>
                        </div>
                        <div className="text-[#C8BFB0]">{r.insight}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-display text-sm font-semibold text-[#D9B878] mb-2">
                  Recorded Witness Statements ({recordedStatements.length})
                </h3>
                {recordedStatements.length === 0 ? (
                  <p className="text-xs text-[#8E8477]">
                    Question suspects to record their sworn answers here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recordedStatements.map((st) => (
                      <div
                        key={st.key}
                        className="p-3 rounded-xl bg-[#191613] border border-[#8C6D46]/25 text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#D9B878]">
                          {st.suspectName} — <span className="text-[#C8BFB0] font-normal">{st.prompt}</span>
                        </div>
                        <div className="text-[#F4EFE6] italic font-serif">“{st.answer}”</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'NOTES' && (
            <div className="space-y-3">
              <p className="text-xs text-[#C8BFB0]">
                Jot down suspect alibi windows, forensic details, or cipher clues for{' '}
                <strong className="text-[#F4EFE6]">{caseDef.title}</strong>. Saved automatically to
                this case’s local file.
              </p>
              <textarea
                value={saveState.notebookNotes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                rows={8}
                placeholder="Record timeline discrepancies, motive notes, and physical evidence links..."
                className="w-full rounded-xl bg-[#110F0D] border border-[#8C6D46]/35 focus:border-[#C5A059] p-4 text-sm text-[#F4EFE6] placeholder:text-[#8E8477]/60 leading-relaxed outline-none resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
