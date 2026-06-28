/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Scale,
  Award,
  ChevronRight,
  ShieldAlert,
  ThumbsUp,
  GitBranch
} from 'lucide-react';
import { Model, Project } from '../types';
import { sortByValueDesc } from '../utils';

interface ResultsPanelProps {
  project: Project;
  models: Model[];
  onNavigate: (tab: any) => void;
}

export default function ResultsPanel({ project, models, onNavigate }: ResultsPanelProps) {
  const r = project.electionResults;

  const getModelName = (id: string) => {
    return models.find(m => m.id === id)?.name || id;
  };

  const getModelBloc = (id: string) => {
    return models.find(m => m.id === id)?.bloc || 'Custom';
  };

  if (!r) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-warn/10 text-brand-warn border border-brand-warn/20">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-bold text-white">No Election Data Yet</h3>
          <p className="text-xs text-brand-text-muted">
            The results dashboard will populate once you enter and parse at least two judge responses on the Blind Evaluation page.
          </p>
        </div>
        <button
          onClick={() => onNavigate('stage2')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
        >
          Go to Stage 2 &rarr;
        </button>
      </div>
    );
  }

  // Find max values for percentage bars
  const maxBorda = Math.max(...Object.values(r.borda || {}), 1);
  const maxApproval = Math.max(...Object.values(r.approval.counts || {}), 1);
  const maxScore = Math.max(...Object.values(r.score.meanByCandidate || {}), 1);

  return (
    <div className="space-y-8">
      {/* Recommended Base Banner */}
      <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md
        ${r.robustAgreement 
          ? 'border-brand-good/30 bg-brand-good/5' 
          : 'border-brand-border bg-brand-panel/30'}
      `}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border
            ${r.robustAgreement 
              ? 'bg-brand-good/10 text-brand-good border-brand-good/20' 
              : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'}
          `}>
            <Award className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Consolidated Recommendation</span>
              {r.robustAgreement && (
                <span className="rounded-full bg-brand-good/10 border border-brand-good/20 px-2 py-0.5 text-[9px] font-bold text-brand-good uppercase font-mono tracking-wider">
                  Robust Agreement
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white">
              Recommended Base Candidate: <span className="text-brand-accent font-serif italic font-bold">{getModelName(r.recommendedBase)}</span>
            </h2>
            <p className="text-xs text-brand-text-muted leading-relaxed max-w-xl">
              {r.robustAgreement
                ? 'High-integrity consensus detected. This candidate scored top marks across almost all major ballot metrics (Condorcet, IRV, Borda, and Approvals).'
                : 'Minority splits or split judgements detected. Inspect the individual metric totals and check pairwise matrices to construct a tailored constitution.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ledger')}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-5 py-3 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer shadow-md"
        >
          Formulate Consensus Constitution
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Ballot Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Condorcet', winner: r.condorcet.winner, color: 'text-brand-accent border-brand-accent/20 bg-brand-accent/5' },
          { label: 'IRV (Runoff)', winner: r.irv.winner, color: 'text-purple-400 border-purple-400/20 bg-purple-400/5' },
          { label: 'Borda Count', winner: sortByValueDesc(r.borda)[0]?.[0] || null, color: 'text-green-400 border-green-400/20 bg-green-400/5' },
          { label: 'Score Average', winner: sortByValueDesc(r.score.meanByCandidate)[0]?.[0] || null, color: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5' },
          { label: 'Approval-as-Base', winner: sortByValueDesc(r.approval.counts)[0]?.[0] || null, color: 'text-pink-400 border-pink-400/20 bg-pink-400/5' }
        ].map((item, idx) => (
          <div key={idx} className={`rounded-xl border p-4 space-y-1.5 ${item.color}`}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
            <div className="text-sm font-bold text-white font-serif italic truncate">
              {item.winner ? getModelName(item.winner) : 'No Winner'}
            </div>
            <div className="text-[9px] text-slate-400 leading-normal truncate">
              {item.winner ? `${getModelBloc(item.winner)} Bloc` : 'Disputed / No ballot'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borda totals (Visual Bar Meter) */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-accent" />
              Borda Count Rankings
            </h3>
            <span className="text-[10px] text-brand-text-muted">High scores represent broad preference compatibility</span>
          </div>

          <div className="space-y-4">
            {sortByValueDesc(r.borda).map(([cid, val]) => {
              const pct = Math.max(5, (val / maxBorda) * 100);
              return (
                <div key={cid} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="font-serif italic text-sm">{getModelName(cid)}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({getModelBloc(cid)})</span>
                    </span>
                    <span className="font-bold text-brand-accent font-mono">{val} pts</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-brand-bg overflow-hidden border border-brand-border/30">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent/50 to-brand-accent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Averages & Approval Ratings */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-400" />
              Approval-As-Base Ratings
            </h3>
            <span className="text-[10px] text-brand-text-muted">Total judges willing to use this as the starting draft</span>
          </div>

          <div className="space-y-4">
            {sortByValueDesc(r.approval.counts).map(([cid, val]) => {
              const pct = (val / r.judgeCount) * 100;
              return (
                <div key={cid} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="font-serif italic text-sm">{getModelName(cid)}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({getModelBloc(cid)})</span>
                    </span>
                    <span className="font-bold text-green-400 font-mono">
                      {val} / {r.judgeCount} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-brand-bg overflow-hidden border border-brand-border/30">
                    <div
                      style={{ width: `${pct || 3}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-green-500/50 to-brand-good"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pairwise Matrix (Condorcet Grids) */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-400" />
              Pairwise Matrix (Row vs Column)
            </h3>
            <span className="text-[10px] text-brand-text-muted">Value is count of judges preferring Row over Col</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-bg border-b border-brand-border">
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">Model ID</th>
                  {r.candidateIds.map(cid => (
                    <th key={cid} className="p-3 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted text-center max-w-[80px] truncate">
                      {getModelName(cid)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {r.candidateIds.map(row => (
                  <tr key={row} className="hover:bg-brand-panel-light/20">
                    <td className="p-3 text-xs font-bold text-white whitespace-nowrap">
                      {getModelName(row)}
                    </td>
                    {r.candidateIds.map(col => {
                      if (row === col) {
                        return <td key={col} className="p-3 text-xs text-center text-slate-600 font-bold bg-brand-bg/50">—</td>;
                      }
                      const votesRowOverCol = r.condorcet.matrix[row]?.[col] ?? 0;
                      const votesColOverRow = r.condorcet.matrix[col]?.[row] ?? 0;
                      const isWinning = votesRowOverCol > votesColOverRow;

                      return (
                        <td
                          key={col}
                          className={`p-3 text-xs text-center font-mono font-bold border-l border-brand-border/40
                            ${isWinning ? 'text-brand-good bg-brand-good/5' : 'text-brand-bad bg-brand-bad/5'}
                          `}
                          title={`${getModelName(row)} beat ${getModelName(col)} on ${votesRowOverCol} ballots; lost on ${votesColOverRow}`}
                        >
                          {votesRowOverCol} - {votesColOverRow}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Averages & High-severity Fatal Flaws */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-bad" />
              High-Severity Fatal Flaw Audit
            </h3>
            <span className="text-[10px] text-brand-text-muted">Count of judges flagging dealbreaking concerns</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {r.candidateIds.map(cid => {
              const flawsCount = r.fatalCounts[cid] ?? 0;
              const hasFlaws = flawsCount > 0;
              return (
                <div
                  key={cid}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-xs transition-all
                    ${hasFlaws 
                      ? 'border-brand-bad/30 bg-brand-bad/5 text-brand-bad' 
                      : 'border-brand-border bg-brand-bg/50 text-brand-text-muted'}
                  `}
                >
                  <span className="font-semibold text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {getModelName(cid)}
                  </span>
                  
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <AlertTriangle className={`h-4 w-4 ${hasFlaws ? 'text-brand-bad' : 'text-slate-600'}`} />
                    {flawsCount} Flaws Flagged
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* IRV Rounds Breakdown */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-pink-400" />
            Instant Runoff Elimination flow (IRV)
          </h3>
          <span className="text-[10px] text-brand-text-muted">Progressive reallocation of lowest-place votes until majority</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-brand-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border">
                <th className="p-3.5 text-xs font-bold text-brand-text-muted">Runoff Elimination Round</th>
                <th className="p-3.5 text-xs font-bold text-brand-text-muted">Active Candidates & First-Place Ballots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {r.irv.rounds.map((round, idx) => (
                <tr key={idx} className="hover:bg-brand-panel-light/10">
                  <td className="p-4 text-xs font-bold text-white whitespace-nowrap">
                    Round {idx + 1}
                  </td>
                  <td className="p-4 text-xs">
                    <div className="flex flex-wrap gap-2.5">
                      {round.active.map(cid => {
                        const count = round.counts[cid] ?? 0;
                        return (
                          <span
                            key={cid}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-bg px-3 py-1.5 text-xs text-white"
                          >
                            <span className="font-semibold text-brand-accent">{getModelName(cid)}</span>
                            <span className="text-slate-500 font-mono">({count} votes)</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
