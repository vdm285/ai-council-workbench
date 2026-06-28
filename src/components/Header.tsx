/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Settings, FolderOpen, Database } from 'lucide-react';
import { Project } from '../types';

interface HeaderProps {
  activeProject: Project | null;
  onOpenRoster: () => void;
  onOpenProjects: () => void;
  onOpenBackup: () => void;
}

export default function Header({
  activeProject,
  onOpenRoster,
  onOpenProjects,
  onOpenBackup
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-brand-border bg-brand-panel px-6 shadow-md backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
          <Cpu className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Manual AI Council Workbench
          </h1>
          <p className="text-xs text-brand-text-muted">
            Multi-model coordination via clipboard proxy — fully private & transparent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeProject ? (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-1.5 text-xs text-brand-text">
            <FolderOpen className="h-3.5 w-3.5 text-brand-accent" />
            <span className="font-semibold text-brand-text-muted">Active:</span>
            <span className="max-w-[150px] truncate font-medium text-brand-accent">
              {activeProject.title || 'Untitled Project'}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-dashed border-brand-border bg-brand-bg/50 px-3 py-1.5 text-xs text-brand-text-muted">
            No active project selected
          </div>
        )}

        <button
          onClick={onOpenProjects}
          className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel-light/40 px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
          title="Switch or Create Projects"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={onOpenRoster}
          className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel-light/40 px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
          title="Configure Council Models"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Roster</span>
        </button>

        <button
          onClick={onOpenBackup}
          className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel-light/40 px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
          title="Backup & Restore Project Data"
        >
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">Backup</span>
        </button>
      </div>
    </header>
  );
}
