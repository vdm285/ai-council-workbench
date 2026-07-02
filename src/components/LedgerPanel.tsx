/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Save,
  Wand2,
  AlertTriangle,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { Model, Project, ConsensusLedger } from '../types';
import { normalizeLedgerText } from '../utils';

interface LedgerPanelProps {
  project: Project;
  models: Model[];
  onUpdateProject: (updated: Project) => void;
  onNavigate: (tab: any) => void;
}

export default function LedgerPanel({ project, models, onUpdateProject, onNavigate }: LedgerPanelProps) {
  const [baseId, setBaseId] = useState(project.consensusLedger.baseCandidateId);
  const [runnerUpsStr, setRunnerUpsStr] = useState((project.consensusLedger.runnerUpCandidateIds || []).join(', '));
  const [mustInclude, setMustInclude] = useState((project.consensusLedger.mustInclude || []).join('\n'));
  const [mustFix, setMustFix] = useState((project.consensusLedger.mustFix || []).join('\n'));
  const [mustExclude, setMustExclude] = useState((project.consensusLedger.mustExclude || []).join('\n'));
  const [openDisputes, setOpenDisputes] = useState((project.consensusLedger.openDisputes || []).join('\n'));

  // Sync state if project changes
  useEffect(() => {
    setBaseId(project.consensusLedger.baseCandidateId);
    setRunnerUpsStr((project.consensusLedger.runnerUpCandidateIds || []).join(', '));
    setMustInclude((project.consensusLedger.mustInclude || []).join('\n'));
    setMustFix((project.consensusLedger.mustFix || []).join('\n'));
    setMustExclude((project.consensusLedger.mustExclude || []).join('\n'));
    setOpenDisputes((project.consensusLedger.openDisputes || []).join('\n'));
  }, [project.consensusLedger]);

  const getModelName = (id: string) => {
    return models.find(m => m.id === id)?.name || id;
  };

  const parseLines = (s: string) => {
    return s
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean);
  };

  const handleSaveLedger = (showFeedback = true) => {
    const updatedLedger: ConsensusLedger = {
      baseCandidateId: baseId.trim(),
      runnerUpCandidateIds: runnerUpsStr
        .split(',')
        .map(x => x.trim())
        .filter(Boolean),
      mustInclude: parseLines(mustInclude),
      mustFix: parseLines(mustFix),
      mustExclude: parseLines(mustExclude),
      openDisputes: parseLines(openDisputes)
    };

    onUpdateProject({
      ...project,
      consensusLedger: updatedLedger
    });

    if (showFeedback) {
      alert('Ledger Saved successfully!');
    }
  };

  // Automated critique aggregation from parsed judge ballots
  const handleAutoCompile = () => {
    const agg = {
      mustInclude: {} as Record<string, number>,
      mustFix: {} as Record<string, number>,
      mustExclude: {} as Record<string, number>,
      openDisputes: {} as Record<string, number>
    };

    const addLedgerItems = (bucket: Record<string, number>, items: string[] | undefined) => {
      (items || []).forEach(item => {
        const text = normalizeLedgerText(item);
        if (!text) return;
        bucket[text] = (bucket[text] || 0) + 1;
      });
    };

    // Analyze ballots
    Object.values(project.judgeBallots || {}).forEach(b => {
      if (b.parseError) return;
      const li = b.ledgerItems || {};
      addLedgerItems(agg.mustInclude, li.must_include);
      addLedgerItems(agg.mustFix, li.must_fix);
      addLedgerItems(agg.mustExclude, li.must_exclude);
      addLedgerItems(agg.openDisputes, li.open_disputes);

      // Extract corrections
      (b.corrections || []).forEach(c => {
        if (c.type === 'must_include') addLedgerItems(agg.mustInclude, [c.text]);
        if (c.type === 'must_fix' || c.type === 'clarity') addLedgerItems(agg.mustFix, [c.text]);
        if (c.type === 'must_exclude') addLedgerItems(agg.mustExclude, [c.text]);
      });
    });

    const formatAggregated = (bucket: Record<string, number>) => {
      return Object.entries(bucket)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([text, count]) => (count > 1 ? `${text} [support: ${count}]` : text));
    };

    const defaultBase = project.electionResults?.recommendedBase || baseId || '';
    const defaultRunners = project.electionResults?.runnerUps || [];

    const compiledLedger: ConsensusLedger = {
      baseCandidateId: defaultBase,
      runnerUpCandidateIds: defaultRunners,
      mustInclude: formatAggregated(agg.mustInclude),
      mustFix: formatAggregated(agg.mustFix),
      mustExclude: formatAggregated(agg.mustExclude),
      openDisputes: formatAggregated(agg.openDisputes)
    };

    setBaseId(compiledLedger.baseCandidateId);
    setRunnerUpsStr(compiledLedger.runnerUpCandidateIds.join(', '));
    setMustInclude(compiledLedger.mustInclude.join('\n'));
    setMustFix(compiledLedger.mustFix.join('\n'));
    setMustExclude(compiledLedger.mustExclude.join('\n'));
    setOpenDisputes(compiledLedger.openDisputes.join('\n'));

    onUpdateProject({
      ...project,
      consensusLedger: compiledLedger
    });
  };

  const hasJudges = Object.keys(project.judgeBallots || {}).length > 0;

  return (
    <div className="space-y-6">
      {/* Intro Block */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Stage 2C — Consensus Ledger (The Constitution)
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Compile evaluators critiques into a unified shared constitution. This ledger guides Stage 3, enforcing convergence so model editors satisfy specific criteria rather than writing in isolation.
            </p>
          </div>
          <span className="rounded-full bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 text-xs text-brand-accent font-medium font-mono">
            Step 3 of 5
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleAutoCompile}
            disabled={!hasJudges}
            className="flex items-center gap-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 px-4 py-2.5 text-xs font-bold text-brand-accent hover:bg-brand-accent hover:text-brand-bg disabled:opacity-50 transition-all cursor-pointer shadow-md"
          >
            <Wand2 className="h-4 w-4" />
            Aggregate Critiques From Judges
          </button>
          
          <button
            onClick={() => handleSaveLedger(true)}
            className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-xs font-semibold text-brand-text hover:border-brand-text-muted hover:text-white transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editing Section (Left side 2/3 wide on desktop) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-border/40 pb-2.5">
              Consensus Mapping Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1.5">
                  Base Candidate Model ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. chatgpt"
                  value={baseId}
                  onChange={(e) => setBaseId(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">
                  Model whose Stage 1 response will act as the baseline template. Selected as: <strong className="text-brand-accent">{getModelName(baseId) || 'None'}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1.5">
                  Runner-up Candidate IDs (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gemini, deepseek"
                  value={runnerUpsStr}
                  onChange={(e) => setRunnerUpsStr(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block leading-normal">
                  Alternative models containing high-quality sections to borrow.
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Lists */}
          <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-border/40 pb-2.5">
              Directive Directives (One per line)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Must Include */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-green-400 uppercase tracking-wider">
                  Must Include / Retain
                </label>
                <textarea
                  placeholder="Exact items or facts that MUST reside in the final output..."
                  value={mustInclude}
                  onChange={(e) => setMustInclude(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg p-3.5 text-xs text-white focus:border-brand-accent focus:outline-none font-sans leading-relaxed"
                />
              </div>

              {/* Must Fix */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  Must Fix / Correct
                </label>
                <textarea
                  placeholder="Factual, numerical, or logic corrections to make..."
                  value={mustFix}
                  onChange={(e) => setMustFix(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg p-3.5 text-xs text-white focus:border-brand-accent focus:outline-none font-sans leading-relaxed"
                />
              </div>

              {/* Must Exclude */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-brand-bad uppercase tracking-wider">
                  Must Exclude / Drop
                </label>
                <textarea
                  placeholder="Superfluous lists, style bloat, or errors to scrub..."
                  value={mustExclude}
                  onChange={(e) => setMustExclude(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg p-3.5 text-xs text-white focus:border-brand-accent focus:outline-none font-sans leading-relaxed"
                />
              </div>

              {/* Open Disputes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider">
                  Open Disputes / Nuances
                </label>
                <textarea
                  placeholder="Nuanced claims or points requiring balanced compromise..."
                  value={openDisputes}
                  onChange={(e) => setOpenDisputes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg p-3.5 text-xs text-white focus:border-brand-accent focus:outline-none font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview (Right side 1/3 wide) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-brand-border/40 pb-2.5 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-accent" />
              Constitutional Blueprint
            </h3>

            <div className="space-y-3.5 divide-y divide-brand-border/40 text-xs">
              <div>
                <span className="font-bold text-brand-text-muted">Baseline Draft:</span>
                <p className="font-semibold text-brand-accent mt-0.5">{getModelName(baseId) || 'Unset'}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-brand-text-muted">Alternative Sources:</span>
                <p className="text-white font-medium mt-0.5">
                  {runnerUpsStr.split(',').map(x => x.trim()).filter(Boolean).map(getModelName).join(', ') || 'None'}
                </p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-green-400">Include directives ({parseLines(mustInclude).length}):</span>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-400 text-[11px] leading-relaxed">
                  {parseLines(mustInclude).slice(0, 4).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                  {parseLines(mustInclude).length > 4 && <li>+ {parseLines(mustInclude).length - 4} more items</li>}
                  {parseLines(mustInclude).length === 0 && <li className="italic text-slate-600 list-none pl-0">None defined</li>}
                </ul>
              </div>

              <div className="pt-3">
                <span className="font-bold text-yellow-400">Fix directives ({parseLines(mustFix).length}):</span>
                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-400 text-[11px] leading-relaxed">
                  {parseLines(mustFix).slice(0, 4).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                  {parseLines(mustFix).length > 4 && <li>+ {parseLines(mustFix).length - 4} more items</li>}
                  {parseLines(mustFix).length === 0 && <li className="italic text-slate-600 list-none pl-0">None defined</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation block */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-sans">Launch Final Synthesis</h4>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Once you have formulated the ledger, save it and proceed to the final synthesis station. One chosen model will integrate the winning base answer, runner-up material, and ledger directives.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            handleSaveLedger(false);
            onNavigate('stage3');
          }}
          disabled={!baseId}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-bold text-brand-bg hover:bg-brand-accent/90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-accent/15"
        >
          Build Final Prompt
          <Play className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
