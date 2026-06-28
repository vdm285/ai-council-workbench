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
  FileText,
  BookmarkCheck,
  ChevronRight,
  GitPullRequest
} from 'lucide-react';
import { Model, Project } from '../types';

interface FinalPanelProps {
  project: Project;
  models: Model[];
  onNavigate: (tab: any) => void;
}

export default function FinalPanel({ project, models, onNavigate }: FinalPanelProps) {
  const fs = project.finalSelection;
  const [copied, setCopied] = useState(false);

  const getModelName = (id: string | null) => {
    if (!id) return 'Unset';
    return models.find(m => m.id === id)?.name || id;
  };

  const handleCopyText = async () => {
    if (!fs?.finalAnswer) return;
    try {
      await navigator.clipboard.writeText(fs.finalAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      alert('Failed to copy to clipboard.');
    }
  };

  const handleDownloadText = () => {
    if (!fs?.finalAnswer) return;
    const blob = new Blob([fs.finalAnswer], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'council_consensus_final_answer.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!fs || !fs.winnerProposalId) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-warn/10 text-brand-warn border border-brand-warn/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">No Final Selection Yet</h3>
          <p className="text-xs text-brand-text-muted">
            The final consensus answer will be compiled and displayed here once you execute the Stage 4 Approval voting ballot count.
          </p>
        </div>
        <button
          onClick={() => onNavigate('stage4')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
        >
          Go to Stage 4 &rarr;
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trophy Header */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-good/30 bg-gradient-to-br from-brand-panel to-brand-good/5 p-6 shadow-md">
        <div className="absolute top-0 right-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-brand-good/5 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-good/10 text-brand-good border border-brand-good/20 shadow-lg shadow-brand-good/5">
              <Trophy className="h-6 w-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ultimate Consensus Selection</span>
              <h2 className="text-xl font-black text-white">
                Winning Proposal: <span className="text-brand-good font-serif italic font-bold">{getModelName(fs.winnerProposalId)}'s Proposal</span>
              </h2>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                This draft represents the mathematically optimal convergence. It holds the maximum approval index and minimum veto rate among all submitted multi-model edits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleCopyText}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer shadow-md"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied Final!' : 'Copy Answer'}
            </button>
            <button
              onClick={handleDownloadText}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-xs font-semibold text-brand-text hover:border-brand-text-muted hover:text-white transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download TXT
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-brand-border/40 pb-2.5 flex items-center gap-2">
          <GitPullRequest className="h-4 w-4 text-brand-accent" />
          Proposal Leaderboard & Ballot Ties
        </h3>

        <div className="overflow-x-auto rounded-xl border border-brand-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border">
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Rank</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Draft Author</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center">Approvals</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center">Median Score</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center">Mean Score</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center">Vetoes</th>
                <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center">Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {fs.sorted.map((pid, idx) => {
                const s = fs.stats[pid]!;
                const isWinner = fs.winnerProposalId === pid;
                return (
                  <tr
                    key={pid}
                    className={`hover:bg-brand-panel-light/10 transition-colors
                      ${isWinner ? 'bg-brand-good/5 font-medium' : ''}
                    `}
                  >
                    <td className="p-3.5 text-xs text-white whitespace-nowrap">
                      {isWinner ? (
                        <span className="inline-flex items-center gap-1 rounded bg-brand-good/10 px-2 py-0.5 text-[10px] font-bold text-brand-good font-mono uppercase">
                          Winner
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-xs font-bold text-white whitespace-nowrap">
                      <span className="font-serif italic text-sm">{getModelName(pid)}</span>
                    </td>
                    <td className="p-3.5 text-xs text-center font-bold text-green-400 font-mono">
                      {s.approval}
                    </td>
                    <td className="p-3.5 text-xs text-center font-bold text-white font-mono">
                      {s.median} / 10
                    </td>
                    <td className="p-3.5 text-xs text-center text-brand-text-muted font-mono">
                      {s.mean.toFixed(1)}
                    </td>
                    <td className={`p-3.5 text-xs text-center font-bold font-mono
                      ${s.veto > 0 ? 'text-brand-bad' : 'text-slate-600'}
                    `}>
                      {s.veto}
                    </td>
                    <td className="p-3.5 text-xs text-center text-slate-500 font-mono">
                      {s.length} chars
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final Answer Text Area */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BookmarkCheck className="h-4.5 w-4.5 text-brand-good" />
            Consolidated Output Text
          </span>
          <span className="text-[10px] text-brand-text-muted font-mono uppercase">
            Format: Markdown ready
          </span>
        </div>

        <textarea
          readOnly
          value={fs.finalAnswer}
          className="w-full rounded-xl border border-brand-border bg-brand-bg p-5 text-sm text-white font-mono leading-relaxed focus:outline-none focus:ring-0 resize-y min-h-[350px]"
        />
      </div>
    </div>
  );
}
