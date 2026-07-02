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
  HelpCircle,
  EyeOff,
  SkipForward
} from 'lucide-react';
import { Model, Project } from '../types';

interface Stage1PanelProps {
  project: Project;
  models: Model[];
  activeModelIds: string[];
  onSetActiveModelIds: (ids: string[]) => void;
  onUpdateProject: (updated: Project) => void;
  onGenerateOrders: (project?: Project) => void;
  onNavigate: (tab: any) => void;
}

export default function Stage1Panel({
  project,
  models,
  activeModelIds,
  onSetActiveModelIds,
  onUpdateProject,
  onGenerateOrders,
  onNavigate
}: Stage1PanelProps) {
  const [title, setTitle] = useState(project.title);
  const [prompt, setPrompt] = useState(project.originalPrompt);
  const [copyState, setCopyState] = useState<Record<string, boolean>>({});

  const activeModels = models.filter(m => activeModelIds.includes(m.id));
  const activePastedCount = activeModels.filter(m => !!project.stage1Responses[m.id]?.trim()).length;

  const buildSavedProject = () => ({
      ...project,
      title: title.trim(),
      originalPrompt: prompt.trim(),
      activeModelIds
    });

  const handleSaveMeta = () => {
    onUpdateProject(buildSavedProject());
  };

  const handleToggleActive = (modelId: string) => {
    const isActive = activeModelIds.includes(modelId);
    if (isActive && activeModelIds.length <= 2) return;
    const next = isActive
      ? activeModelIds.filter(id => id !== modelId)
      : [...activeModelIds, modelId];
    onSetActiveModelIds(next);
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopyState(prev => ({ ...prev, [id]: false })), 1500);
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
      activeModelIds,
      stage1Responses: {
        ...project.stage1Responses,
        [modelId]: val
      }
    });
  };

  const promptText = prompt;

  return (
    <div className="h-full min-h-[calc(100vh-88px)] space-y-3">
      <div className="rounded-lg border border-brand-border bg-brand-panel p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,0.8fr)_minmax(360px,1.4fr)_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
              Project
            </label>
            <input
              type="text"
              placeholder="Council session title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-lg border border-brand-border bg-brand-bg px-3 text-sm font-medium text-white focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted">
              Original Prompt
            </label>
            <textarea
              placeholder="Paste the exact question you want every active model to answer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="min-h-16 w-full resize-none rounded-lg border border-brand-border bg-brand-bg p-3 text-xs text-white focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button
              onClick={handleSaveMeta}
              disabled={!title.trim() || !prompt.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-accent px-3 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              onClick={() => handleCopyText(promptText, 'brief')}
              disabled={!promptText.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-bg px-3 text-xs font-medium text-brand-text hover:border-brand-text-muted hover:text-white disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              {copyState.brief ? 'Copied' : 'Copy Prompt'}
            </button>
            <button
              onClick={() => handleDownloadText('stage1_brief_prompt.txt', promptText)}
              disabled={!promptText.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-bg px-3 text-xs font-medium text-brand-text hover:border-brand-text-muted hover:text-white disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              TXT
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-border/50 pt-3 text-xs">
          <div className="inline-flex items-center gap-2 text-brand-text-muted">
            <EyeOff className="h-4 w-4 text-brand-accent" />
            <span>
              Active council: <strong className="text-white">{activeModels.length}</strong> models. Skipped models will not appear in anonymous judging.
            </span>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-bg px-3 py-1.5 font-mono text-[11px] text-brand-text-muted">
            Answers captured: <span className="font-bold text-brand-accent">{activePastedCount}</span> / {activeModels.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {models.map((model) => {
          const isActive = activeModelIds.includes(model.id);
          const hasResponse = !!project.stage1Responses[model.id]?.trim();
          return (
            <div
              key={model.id}
              className={`rounded-lg border p-3 transition-all ${
                isActive
                  ? hasResponse
                    ? 'border-brand-good/30 bg-brand-panel'
                    : 'border-brand-border bg-brand-panel'
                  : 'border-brand-border/50 bg-brand-panel/35 opacity-60'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleToggleActive(model.id)}
                    disabled={isActive && activeModelIds.length <= 2}
                    className="h-4 w-4 accent-brand-accent"
                    title="Include this model in the active council"
                  />
                  <span className="truncate text-sm font-bold text-white">{model.name}</span>
                  <span className="rounded bg-brand-panel-light px-1.5 py-0.5 text-[9px] font-semibold uppercase text-brand-text-muted">
                    {model.bloc}
                  </span>
                </label>

                <div className="flex shrink-0 items-center gap-1">
                  {hasResponse && isActive && (
                    <CheckCircle2 className="h-4 w-4 text-brand-good" />
                  )}
                  {!isActive && (
                    <SkipForward className="h-4 w-4 text-brand-text-muted" />
                  )}
                </div>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleCopyText(promptText, model.id)}
                  disabled={!isActive || !promptText.trim()}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-brand-border bg-brand-bg px-2 text-[11px] text-brand-text hover:border-brand-text-muted hover:text-white disabled:opacity-40"
                  title="Copy the original prompt"
                >
                  <Copy className="h-3 w-3" />
                  {copyState[model.id] ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={model.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] ${
                    isActive
                      ? 'border-brand-accent/20 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 hover:text-white'
                      : 'pointer-events-none border-brand-border bg-brand-bg text-brand-text-muted'
                  }`}
                  title="Open this model in a browser tab"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </a>
              </div>

              <textarea
                placeholder={isActive ? `Paste ${model.name}'s full answer here...` : 'Skipped for this run'}
                value={project.stage1Responses[model.id] || ''}
                onChange={(e) => handleResponseChange(model.id, e.target.value)}
                disabled={!isActive}
                rows={5}
                className="h-32 w-full resize-none rounded-lg border border-brand-border bg-brand-bg p-2.5 text-[11px] leading-relaxed text-white focus:border-brand-accent focus:outline-none disabled:cursor-not-allowed disabled:text-brand-text-muted"
              />
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 rounded-lg border border-brand-border bg-brand-panel/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Next: one shared blind judging packet</h4>
              <p className="text-xs leading-relaxed text-brand-text-muted">
                The app will anonymize only active pasted answers once, then produce a universal prompt you can reuse in every judge chat.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const savedProject = buildSavedProject();
              onUpdateProject(savedProject);
              onGenerateOrders(savedProject);
              onNavigate('stage2');
            }}
            disabled={activePastedCount < 2}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-5 text-sm font-bold text-brand-bg shadow-md hover:bg-brand-accent/90 disabled:opacity-50 sm:w-auto"
          >
            Build Blind Packet
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
