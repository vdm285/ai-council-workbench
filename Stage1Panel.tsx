/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Model, Project } from '../types';

interface Stage1PanelProps {
  project: Project;
  models: Model[];
  onUpdateProject: (updated: Project) => void;
  onGenerateOrders: () => void;
  onNavigate: (tab: any) => void;
}

export default function Stage1Panel({
  project,
  models,
  onUpdateProject,
  onGenerateOrders,
  onNavigate
}: Stage1PanelProps) {
  const [title, setTitle] = useState(project.title);
  const [prompt, setPrompt] = useState(project.originalPrompt);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});
  const [generalCopy, setGeneralCopy] = useState(false);

  const handleSaveMeta = () => {
    onUpdateProject({
      ...project,
      title: title.trim(),
      originalPrompt: prompt.trim()
    });
  };

  const handleCopyText = async (text: string, id: string, isGeneral = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isGeneral) {
        setGeneralCopy(true);
        setTimeout(() => setGeneralCopy(false), 1500);
      } else {
        setCopyState(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopyState(prev => ({ ...prev, [id]: false })), 1500);
      }
    } catch (e) {
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  };

  const handleDownloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleResponseChange = (modelId: string, val: string) => {
    onUpdateProject({
      ...project,
      stage1Responses: {
        ...project.stage1Responses,
        [modelId]: val
      }
    });
  };

  const pastedCount = models.filter(m => !!project.stage1Responses[m.id]).length;

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Stage 1 — Independent Council Briefing
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Paste the original prompt exactly as you would normally ask it. This keeps candidate answers free from "council" bias.
            </p>
          </div>
          <span className="rounded-full bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 text-xs text-brand-accent font-medium font-mono">
            Step 1 of 5
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted mb-1.5 uppercase tracking-wider">
              Project Title
            </label>
            <input
              type="text"
              placeholder="e.g. Solar panel economics council"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted mb-1.5 uppercase tracking-wider">
              Original Prompt
            </label>
            <textarea
              placeholder="Paste the precise prompt you intend to run against all chatbots..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-brand-border bg-brand-bg p-4 text-sm text-white focus:border-brand-accent focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleSaveMeta}
            disabled={!title.trim() || !prompt.trim()}
            className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 disabled:opacity-50 transition-all cursor-pointer shadow-md"
          >
            <Save className="h-4 w-4" />
            Save Project Brief
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyText(prompt, 'general', true)}
              disabled={!prompt.trim()}
              className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-xs font-medium text-brand-text hover:border-brand-text-muted hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              {generalCopy ? 'Copied Brief!' : 'Copy Brief Prompt'}
            </button>

            <button
              onClick={() => handleDownloadText('stage1_brief_prompt.txt', prompt)}
              disabled={!prompt.trim()}
              className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-xs font-medium text-brand-text hover:border-brand-text-muted hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Download TXT
            </button>
          </div>
        </div>
      </div>

      {/* Model Briefings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-wider text-brand-text-muted uppercase">
              Isolated Chat Pasteboard
            </span>
            <p className="text-xs text-slate-500">
              Submit your brief to each chatbot in independent tabs. Paste the full, unaltered response into the matching model drawer below.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-panel/30 px-3.5 py-1.5 text-xs">
            <span className="font-semibold text-brand-text-muted">Progress:</span>
            <span className="font-bold text-brand-accent font-mono">{pastedCount} / {models.length}</span>
            <span className="text-slate-500">Pasted</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {models.map((model) => {
            const hasResponse = !!project.stage1Responses[model.id];
            return (
              <div
                key={model.id}
                className={`rounded-2xl border bg-brand-panel p-5 space-y-4 transition-all duration-300
                  ${hasResponse ? 'border-brand-border/80 shadow-md' : 'border-brand-border border-dashed'}
                `}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${hasResponse ? 'bg-brand-good animate-ping' : 'bg-brand-warn'}`} />
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {model.name}
                      <span className="rounded-md bg-brand-panel-light px-2 py-0.5 text-[10px] font-semibold text-brand-text-muted font-mono uppercase">
                        {model.bloc}
                      </span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleCopyText(project.originalPrompt || prompt, model.id)}
                      className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-xs text-brand-text hover:border-brand-text-muted hover:text-white transition-all cursor-pointer"
                      title="Copy raw prompt text"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copyState[model.id] ? 'Copied' : 'Copy'}
                    </button>

                    <button
                      onClick={() => handleDownloadText(`${model.id}_stage1_prompt.txt`, project.originalPrompt || prompt)}
                      className="flex items-center gap-1 rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-xs text-brand-text hover:border-brand-text-muted hover:text-white transition-all cursor-pointer"
                      title="Download prompt as TXT file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      TXT
                    </button>

                    <a
                      href={model.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1.5 text-xs text-brand-accent hover:bg-brand-accent/20 hover:text-white transition-all cursor-pointer"
                      title="Open chat interface in a new window"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Chatbox
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-brand-text-muted">
                      Paste full model response:
                    </label>
                    {hasResponse && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-good font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Checked in
                      </span>
                    )}
                  </div>
                  <textarea
                    placeholder={`Paste the entire response returned by ${model.name} here...`}
                    value={project.stage1Responses[model.id] || ''}
                    onChange={(e) => handleResponseChange(model.id, e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-brand-border bg-brand-bg p-4 text-xs text-white focus:border-brand-accent focus:outline-none font-mono"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Judge Orders */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-start gap-3.5 max-w-xl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Next Step: Blind Randomization</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Once responses are pasted, clicking "Initiate Blind Stage" will seed deterministic shuffle orders for Stage 2. Candidates are anonymized as "A", "B", "C" uniquely for each evaluator.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleSaveMeta();
              onGenerateOrders();
              onNavigate('stage2');
            }}
            disabled={pastedCount < 2}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-bold text-brand-bg hover:bg-brand-accent/90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-accent/15"
          >
            Initiate Blind Stage
            <CheckCircle2 className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
