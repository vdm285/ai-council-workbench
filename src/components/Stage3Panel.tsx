/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  CheckCircle2,
  Wand2,
  BrainCircuit,
  Trophy,
  GitCompareArrows
} from 'lucide-react';
import { Model, Project, JudgeBallot } from '../types';
import { labelForIndex } from '../utils';

interface Stage3PanelProps {
  project: Project;
  models: Model[];
  onUpdateProject: (updated: Project) => void;
  onNavigate: (tab: any) => void;
}

function pairwiseAgreement(reference: string[], ranking: string[]): number {
  if (reference.length < 2 || ranking.length < 2) return 0;
  const refPos = Object.fromEntries(reference.map((id, i) => [id, i]));
  const rankPos = Object.fromEntries(ranking.map((id, i) => [id, i]));
  let total = 0;
  let agreed = 0;

  for (let i = 0; i < reference.length; i++) {
    for (let j = i + 1; j < reference.length; j++) {
      const a = reference[i];
      const b = reference[j];
      if (rankPos[a] === undefined || rankPos[b] === undefined) continue;
      total += 1;
      if ((refPos[a] < refPos[b]) === (rankPos[a] < rankPos[b])) agreed += 1;
    }
  }

  return total ? agreed / total : 0;
}

export default function Stage3Panel({
  project,
  models,
  onUpdateProject,
  onNavigate
}: Stage3PanelProps) {
  const [copied, setCopied] = useState(false);

  const getModelName = (id: string | null | undefined) => {
    if (!id) return 'Unset';
    return models.find(m => m.id === id)?.name || id;
  };

  const sharedOrder = useMemo(() => {
    const stored = project.stage2Orders[models[0]?.id || ''] || [];
    const active = new Set(models.map(m => m.id));
    const filtered = stored.filter(id => active.has(id));
    return filtered.length ? filtered : models.map(m => m.id);
  }, [project.stage2Orders, models]);

  const letterForCandidate = (id: string) => {
    const idx = sharedOrder.indexOf(id);
    return idx >= 0 ? labelForIndex(idx) : '?';
  };

  const finalRanking = project.electionResults?.finalRanking?.length
    ? project.electionResults.finalRanking
    : sharedOrder;

  const validBallots = Object.values(project.judgeBallots || {})
    .filter((b): b is JudgeBallot => !!b && !b.parseError && !!b.ranking?.length);

  const alignedJudge = validBallots
    .map(ballot => ({
      judgeId: ballot.judgeId,
      agreement: pairwiseAgreement(finalRanking, ballot.ranking || [])
    }))
    .sort((a, b) => b.agreement - a.agreement || getModelName(a.judgeId).localeCompare(getModelName(b.judgeId)))[0];

  const recommendedSynthesizer =
    project.consensusLedger.baseCandidateId ||
    project.electionResults?.recommendedBase ||
    alignedJudge?.judgeId ||
    models[0]?.id ||
    '';

  const selectedSynthesizerId = project.finalSynthesisModelId || recommendedSynthesizer;
  const selectedModel = models.find(m => m.id === selectedSynthesizerId) || models[0];

  const setSynthesizer = (id: string) => {
    onUpdateProject({
      ...project,
      finalSynthesisModelId: id
    });
  };

  const setFinalAnswer = (answer: string) => {
    onUpdateProject({
      ...project,
      finalSynthesisModelId: selectedSynthesizerId,
      finalAnswerText: answer,
      finalSelection: {
        winnerProposalId: selectedSynthesizerId,
        stats: {},
        sorted: selectedSynthesizerId ? [selectedSynthesizerId] : [],
        finalAnswer: answer
      }
    });
  };

  const l = project.consensusLedger;
  const baseId = l.baseCandidateId || project.electionResults?.recommendedBase || finalRanking[0] || '';
  const runnerIds = l.runnerUpCandidateIds?.length ? l.runnerUpCandidateIds : finalRanking.filter(id => id !== baseId).slice(0, 2);
  const sourceIds = [...new Set([baseId, ...runnerIds].filter(Boolean))];

  const candidateBlocks = sourceIds
    .map(id => {
      const letter = letterForCandidate(id);
      const answer = project.stage1Responses[id] || '[missing answer]';
      return `\n--- Candidate ${letter} (${id === baseId ? 'recommended base' : 'runner-up source'}) ---\n<candidate_data>\n${answer}\n</candidate_data>\n`;
    })
    .join('\n');

  const judgeGuidance = validBallots
    .map(ballot => {
      const ranking = (ballot.ranking || []).map(id => `Candidate ${letterForCandidate(id)}`).join(' > ');
      const guidance = ballot.bestCombinedAnswer || 'No synthesis guidance provided.';
      return `Judge ${getModelName(ballot.judgeId)} ranking: ${ranking}\nGuidance: ${guidance}`;
    })
    .join('\n\n');

  const ledgerText = `Recommended base: Candidate ${letterForCandidate(baseId)}
Consensus ranking: ${finalRanking.map(id => `Candidate ${letterForCandidate(id)}`).join(' > ')}

Must include:
${(l.mustInclude || []).map(x => `- ${x}`).join('\n') || '- none'}

Must fix:
${(l.mustFix || []).map(x => `- ${x}`).join('\n') || '- none'}

Must exclude:
${(l.mustExclude || []).map(x => `- ${x}`).join('\n') || '- none'}

Open disputes:
${(l.openDisputes || []).map(x => `- ${x}`).join('\n') || '- none'}`;

  const finalPrompt = `You are the final synthesizer for a blind multi-model council.

You are receiving anonymous candidate answers, a deterministic ranking result, and a human-edited consensus ledger.

Important rules:
- Do not guess or mention which model wrote any candidate answer.
- If one candidate resembles your own earlier answer, ignore that fact.
- Use Candidate ${letterForCandidate(baseId)} as the default base unless the ledger clearly requires a change.
- Borrow only concrete improvements from runner-up candidates and judge guidance.
- Apply every relevant "must include" and "must fix" item.
- Avoid every relevant "must exclude" item.
- Resolve open disputes with careful, balanced wording.
- Do not describe the council process in the final answer unless the original user explicitly asked for it.
- Return the final answer only. No ballot, no JSON, no preface.

Original user prompt:
${project.originalPrompt}

Consensus ledger:
${ledgerText}

Source candidate answers:
${candidateBlocks}

Judge synthesis guidance:
${judgeGuidance || 'No judge guidance was parsed.'}

Now write the strongest final answer to the original user prompt.`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      alert('Failed to copy text.');
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([finalPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'final_synthesis_prompt.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
              <Wand2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Final synthesis station</span>
              <h2 className="text-xl font-black text-white">One prompt. One chosen synthesizer. One final answer.</h2>
              <p className="max-w-2xl text-xs leading-relaxed text-brand-text-muted">
                The council has already voted and built the ledger. This step sends the winning base, runner-up material, and critique ledger to a single model for the final clean synthesis.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Copy Final Prompt'}
            </button>
            <button
              onClick={handleDownloadText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-xs font-semibold text-brand-text hover:border-brand-text-muted hover:text-white"
            >
              <Download className="h-3.5 w-3.5" />
              TXT
            </button>
            {selectedModel && (
              <a
                href={selectedModel.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-accent/20 bg-brand-accent/10 px-4 py-2.5 text-xs font-semibold text-brand-accent hover:bg-brand-accent/20 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Synthesizer
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-4">
            <h3 className="flex items-center gap-2 border-b border-brand-border/40 pb-3 text-xs font-bold uppercase tracking-wider text-white">
              <BrainCircuit className="h-4 w-4 text-brand-accent" />
              Synthesizer choice
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-brand-text-muted">Model to continue with</label>
              <select
                value={selectedSynthesizerId}
                onChange={(e) => setSynthesizer(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm font-semibold text-white focus:border-brand-accent focus:outline-none"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
                <div className="mb-1 flex items-center gap-2 text-brand-text-muted">
                  <Trophy className="h-3.5 w-3.5 text-brand-accent" />
                  Recommended base winner
                </div>
                <div className="font-bold text-white">{getModelName(baseId)} <span className="font-mono text-brand-accent">Candidate {letterForCandidate(baseId)}</span></div>
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-bg/50 p-3">
                <div className="mb-1 flex items-center gap-2 text-brand-text-muted">
                  <GitCompareArrows className="h-3.5 w-3.5 text-green-400" />
                  Most consensus-aligned judge
                </div>
                <div className="font-bold text-white">
                  {alignedJudge ? getModelName(alignedJudge.judgeId) : 'Not enough ballots'}
                  {alignedJudge && (
                    <span className="ml-2 font-mono text-brand-good">{Math.round(alignedJudge.agreement * 100)}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-3">
            <h3 className="border-b border-brand-border/40 pb-3 text-xs font-bold uppercase tracking-wider text-white">Prompt preview</h3>
            <textarea
              readOnly
              value={finalPrompt}
              className="min-h-[420px] w-full resize-y rounded-xl border border-brand-border bg-brand-bg p-4 font-mono text-[11px] leading-relaxed text-brand-text-muted focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="h-4 w-4 text-brand-good" />
              Paste final synthesized answer
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Stored offline</span>
          </div>

          <textarea
            placeholder="Paste the final answer from your chosen synthesizer here..."
            value={project.finalAnswerText || project.finalSelection?.finalAnswer || ''}
            onChange={(e) => setFinalAnswer(e.target.value)}
            className="min-h-[560px] w-full resize-y rounded-xl border border-brand-border bg-brand-bg p-5 text-sm leading-relaxed text-white focus:border-brand-accent focus:outline-none"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-brand-text-muted">
              This replaces the old multi-proposal approval loop. The voting math chooses the base; the ledger controls the synthesis; one final model performs the rewrite.
            </p>
            <button
              onClick={() => onNavigate('final')}
              disabled={!(project.finalAnswerText || project.finalSelection?.finalAnswer || '').trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-bold text-brand-bg hover:bg-brand-accent/90 disabled:opacity-50"
            >
              Review Final Answer
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
