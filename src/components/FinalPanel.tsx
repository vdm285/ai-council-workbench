/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Trophy,
  Copy,
  Download,
  AlertTriangle,
  BookmarkCheck,
  FileSpreadsheet,
  GitCompareArrows
} from 'lucide-react';
import { Model, Project } from '../types';

interface FinalPanelProps {
  project: Project;
  models: Model[];
  onNavigate: (tab: any) => void;
}

export default function FinalPanel({ project, models, onNavigate }: FinalPanelProps) {
  const finalAnswer = project.finalAnswerText || project.finalSelection?.finalAnswer || '';
  const synthesizerId = project.finalSynthesisModelId || project.finalSelection?.winnerProposalId || '';
  const [copied, setCopied] = useState(false);

  const getModelName = (id: string | null | undefined) => {
    if (!id) return 'Unset';
    return models.find(m => m.id === id)?.name || id;
  };

  const handleCopyText = async () => {
    if (!finalAnswer) return;
    try {
      await navigator.clipboard.writeText(finalAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleDownloadText = () => {
    if (!finalAnswer) return;
    const blob = new Blob([finalAnswer], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'council_consensus_final_answer.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!finalAnswer.trim()) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-warn/10 text-brand-warn border border-brand-warn/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">No Final Answer Yet</h3>
          <p className="text-xs text-brand-text-muted">
            Copy the final synthesis prompt, run it in your chosen model chat, and paste the result back into the synthesis station.
          </p>
        </div>
        <button
          onClick={() => onNavigate('stage3')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
        >
          Go to Final Synthesis
        </button>
      </div>
    );
  }

  const result = project.electionResults;
  const ledger = project.consensusLedger;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-good/30 bg-gradient-to-br from-brand-panel to-brand-good/5 p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-good/10 text-brand-good border border-brand-good/20 shadow-lg shadow-brand-good/5">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Council synthesis complete</span>
              <h2 className="text-xl font-black text-white">
                Final answer compiled by <span className="text-brand-good font-serif italic font-bold">{getModelName(synthesizerId)}</span>
              </h2>
              <p className="max-w-2xl text-xs leading-relaxed text-brand-text-muted">
                The initial candidates were judged anonymously, the winner and runner-ups were selected deterministically, and the final answer was produced from the ledger-controlled synthesis prompt.
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
            <button
              onClick={handleCopyText}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 md:flex-none"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy Answer'}
            </button>
            <button
              onClick={handleDownloadText}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-xs font-semibold text-brand-text hover:border-brand-text-muted hover:text-white md:flex-none"
            >
              <Download className="h-3.5 w-3.5" />
              Download TXT
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
            <GitCompareArrows className="h-4 w-4 text-brand-accent" />
            Winning base
          </div>
          <div className="text-sm font-bold text-white">{getModelName(result?.recommendedBase || ledger.baseCandidateId)}</div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-panel p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
            <FileSpreadsheet className="h-4 w-4 text-green-400" />
            Ledger directives
          </div>
          <div className="text-sm font-bold text-white">
            {(ledger.mustInclude?.length || 0) + (ledger.mustFix?.length || 0) + (ledger.mustExclude?.length || 0) + (ledger.openDisputes?.length || 0)} items
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-panel p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
            <BookmarkCheck className="h-4 w-4 text-brand-good" />
            Stored answer
          </div>
          <div className="text-sm font-bold text-white">{finalAnswer.length.toLocaleString()} chars</div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BookmarkCheck className="h-4.5 w-4.5 text-brand-good" />
            Final Output Text
          </span>
          <span className="text-[10px] text-brand-text-muted font-mono uppercase">
            Markdown ready
          </span>
        </div>

        <textarea
          readOnly
          value={finalAnswer}
          className="w-full rounded-xl border border-brand-border bg-brand-bg p-5 text-sm text-white font-mono leading-relaxed focus:outline-none focus:ring-0 resize-y min-h-[460px]"
        />
      </div>
    </div>
  );
}
