/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  FileJson,
  Check,
  HelpCircle
} from 'lucide-react';
import { Project } from '../types';

interface BackupPanelProps {
  project: Project;
  onImportProject: (imported: any) => void;
  onResetProject: () => void;
  fullState: any;
}

export default function BackupPanel({
  project,
  onImportProject,
  onResetProject,
  fullState
}: BackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const titleSlug = (project.title || 'unnamed_council')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .slice(0, 50);
    const filename = `${titleSlug}_full_council_project.json`;
    const jsonStr = JSON.stringify(project, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid JSON layout structure.');
        }
        // Basic validity check
        if (!importedData.id && !importedData.projects) {
          throw new Error('Selected JSON is not a valid Council project export file.');
        }

        onImportProject(importedData);
        setSuccess(true);
        setError(null);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err: any) {
        setError(`Failed to import project: ${err.message || 'JSON structure is corrupt.'}`);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Import & Export Project Configuration
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
                Preserve your entire multi-model runs (stage responses, random shuffles, judge ballots, ledger adjustments, synthesis choices, and final answers) inside self-contained JSON records.
            </p>
          </div>
          <span className="rounded-full bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-0.5 text-xs text-brand-accent font-medium font-mono">
            Utilities
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export & Import Panel */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-brand-border/40 pb-2.5">
            Backup Controls
          </h3>

          <div className="space-y-4">
            {/* Export */}
            <div className="rounded-xl border border-brand-border bg-brand-bg/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Download Project JSON</h4>
                <p className="text-[11px] text-brand-text-muted">
                  Saves the current project state, mappings, and pasted transcripts.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-4.5 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer shadow-md"
              >
                <Download className="h-4 w-4" />
                Export Project JSON
              </button>
            </div>

            {/* Import */}
            <div className="rounded-xl border border-brand-border bg-brand-bg/40 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Restore Project Backup</h4>
                  <p className="text-[11px] text-brand-text-muted font-sans">
                    Upload an existing <code>.json</code> file to resume your multi-model run.
                  </p>
                </div>
                
                <button
                  onClick={triggerFileInput}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-bg px-4.5 py-2.5 text-xs font-bold text-white hover:border-brand-text-muted hover:bg-brand-panel-light/30 transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-brand-accent" />
                  Upload JSON File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept="application/json"
                  className="hidden"
                />
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-lg bg-brand-good/10 border border-brand-good/20 px-3 py-2 text-xs text-brand-good font-semibold font-sans">
                  <Check className="h-4 w-4 shrink-0" /> Loaded project configuration successfully!
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-brand-bad/10 border border-brand-bad/20 px-3 py-2 text-xs text-brand-bad font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Danger zone / resets */}
        <div className="rounded-2xl border border-brand-border bg-brand-panel p-6 space-y-6">
          <h3 className="text-sm font-bold text-brand-bad uppercase tracking-wider border-b border-brand-bad/20 pb-2.5">
            Maintenance Zone
          </h3>

          <div className="space-y-4">
            <div className="rounded-xl border border-brand-bad/20 bg-brand-bad/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-brand-bad">Reset Active Project</h4>
                <p className="text-[11px] text-brand-text-muted leading-relaxed">
                  Permanently wipe all Stage data, randomized mapping tables, and pasted drafts from this project. This is irreversible.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Permanently wipe this project? Make sure to export first if you want a backup.')) {
                    onResetProject();
                  }
                }}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-brand-bad/10 border border-brand-bad/20 px-4.5 py-2.5 text-xs font-bold text-brand-bad hover:bg-brand-bad hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Raw state inspect */}
      <details className="group rounded-2xl border border-brand-border bg-brand-panel p-5 overflow-hidden transition-all duration-300">
        <summary className="flex items-center justify-between font-bold text-xs text-brand-text-muted uppercase tracking-wider cursor-pointer select-none">
          <span className="flex items-center gap-2">
            <FileJson className="h-4.5 w-4.5 text-brand-accent" />
            Inspect Raw state memory tree
          </span>
          <span className="text-[10px] text-slate-500 font-mono group-open:hidden">Click to Expand</span>
          <span className="text-[10px] text-slate-500 font-mono hidden group-open:inline">Click to Hide</span>
        </summary>
        <div className="mt-4 border-t border-brand-border/40 pt-4 overflow-x-auto max-h-[450px]">
          <pre className="text-[11px] text-slate-400 font-mono bg-brand-bg p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(fullState, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
