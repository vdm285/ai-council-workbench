/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  Sliders,
  Scale,
  FileSpreadsheet,
  Shuffle,
  Vote,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { TabId } from './Sidebar';

interface OverviewPanelProps {
  onNavigate: (tab: TabId) => void;
  modelsCount: number;
}

export default function OverviewPanel({ onNavigate, modelsCount }: OverviewPanelProps) {
  const pipeline = [
    {
      num: '1',
      title: 'Diversity (Stage 1)',
      icon: Sliders,
      color: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20',
      desc: 'Prompt each model in independent, isolated chats. No "council" framing to preserve unbiased, raw knowledge.'
    },
    {
      num: '2',
      title: 'Blind Evaluation (Stage 2)',
      icon: Scale,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      desc: 'Judges see shuffled, anonymized replies. They issue structured evaluations, rankings, scores, and flaw critiques.'
    },
    {
      num: '3',
      title: 'Voting & Ledger (Stage 2B & 2C)',
      icon: FileSpreadsheet,
      color: 'text-green-400 bg-green-400/10 border-green-400/20',
      desc: 'The app computes voting math (Condorcet, IRV, Borda, scores) and generates a shared, human-edited "Consensus Ledger".'
    },
    {
      num: '4',
      title: 'Convergence (Stage 3)',
      icon: Shuffle,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      desc: 'Models are given the base answer plus ledger. They act as cooperative editors, creating a unified consensus proposal.'
    },
    {
      num: '5',
      title: 'Closure (Stage 4 & Final)',
      icon: Vote,
      color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
      desc: 'Judges approve/reject proposals. The app tier-selects the winning draft. Get the ultimate answer without extra rewrites.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-brand-panel to-brand-bg p-8">
        <div className="absolute top-0 right-0 h-96 w-96 -translate-y-24 translate-x-24 rounded-full bg-brand-accent/5 blur-3xl" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent border border-brand-accent/20">
            Strategic Synthesis Engine
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Manual AI Council Workbench
          </h2>
          <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed">
            Running multiple LLMs simultaneously is easy, but getting them to reach rigorous, verified consensus is hard. 
            This workbench guides you through an <strong>offline-first, zero-API, multi-model consensus workflow</strong>. 
            By acting as the manual clipboard proxy, you maintain absolute privacy, avoid API costs, and extract 
            unmatched, mathematically-derived reasoning.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('stage1')}
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-bold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer shadow-lg shadow-brand-accent/10"
            >
              Initialize New Council
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Philosophy Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-panel/50 p-5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-bold text-sm">
            🛡️
          </div>
          <h3 className="text-sm font-bold text-white">Absolute Privacy</h3>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Since you paste prompt texts directly into standard browser chats, no API keys are required and you retain whatever standard security/privacy constraints your corporate LLM accounts provide.
          </p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-panel/50 p-5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-bold text-sm">
            ⚖️
          </div>
          <h3 className="text-sm font-bold text-white">Blind Evaluation</h3>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Judges evaluate candidate responses under strict double-blind randomization (seeded per-project). This prevents brand-bias and forces evaluation purely on factual accuracy and utility.
          </p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-panel/50 p-5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20 font-bold text-sm">
            🧮
          </div>
          <h3 className="text-sm font-bold text-white">Algorithmic Consolidation</h3>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            We compute multiple ballot-counting systems simultaneously (Condorcet Pairwise, IRV, Borda totals, and median approvals) to bypass standard single-system voting paradoxes.
          </p>
        </div>
      </div>

      {/* Roster Summary */}
      <div className="rounded-xl border border-brand-border bg-brand-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Council Roster
            </h3>
            <p className="text-xs text-brand-text-muted mt-1">
              Currently configured to consult {modelsCount} advanced model personalities.
            </p>
          </div>
          <button
            onClick={() => onNavigate('backup')}
            className="text-xs font-semibold text-brand-accent hover:underline cursor-pointer"
          >
            Manage Roster &rarr;
          </button>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="space-y-4">
        <span className="text-xs font-semibold tracking-wider text-brand-text-muted uppercase">
          Workflow Pipeline Timeline
        </span>
        
        <div className="grid grid-cols-1 gap-4">
          {pipeline.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-brand-border bg-brand-panel/40 p-5 hover:bg-brand-panel/70 transition-all duration-200"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-bold text-lg ${step.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-brand-accent font-mono text-xs">0{step.num}.</span>
                    {step.title}
                  </h4>
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
