/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, FolderOpen, Calendar, ChevronRight, X, FolderPlus } from 'lucide-react';
import { Project } from '../types';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Record<string, Project>;
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (title: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectManager({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject
}: ProjectManagerProps) {
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newTitle.trim()) {
      setError('Project title cannot be blank.');
      return;
    }
    onCreateProject(newTitle.trim());
    setNewTitle('');
    setError(null);
  };

  const projectList = Object.values(projects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-brand-border bg-brand-panel shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Project Workspaces</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Switch workspaces to isolate different comparative studies and consensus prompt sets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-brand-text-muted hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Core content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* New Project Creator */}
          <div className="rounded-xl border border-brand-border bg-brand-panel-light/20 p-4.5 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderPlus className="h-4.5 w-4.5 text-brand-accent" />
              Create New Workspace
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="e.g. AI safety policy debate"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none"
              />
              <button
                onClick={handleCreate}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer"
              >
                Create
              </button>
            </div>
            {error && <span className="text-xs font-semibold text-brand-bad block">{error}</span>}
          </div>

          {/* Project List */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider block">
              Saved Projects ({projectList.length})
            </span>

            <div className="space-y-2.5">
              {projectList.map((proj) => {
                const isActive = proj.id === activeProjectId;
                const formattedDate = new Date(proj.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={proj.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200
                      ${isActive 
                        ? 'border-brand-accent bg-brand-accent/5' 
                        : 'border-brand-border bg-brand-bg hover:border-brand-text-muted hover:bg-brand-panel-light/10'}
                    `}
                  >
                    <button
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className="flex-1 text-left flex items-start gap-3.5 min-w-0 cursor-pointer group"
                    >
                      <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0
                        ${isActive 
                          ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent' 
                          : 'bg-brand-panel-light/50 border-brand-border text-brand-text-muted group-hover:text-white'}
                      `}>
                        <FolderOpen className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-sm font-bold text-white truncate leading-tight group-hover:text-brand-accent transition-colors">
                          {proj.title || 'Untitled Project'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {formattedDate}</span>
                        </div>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-4">
                      <button
                        onClick={() => {
                          if (confirm(`Permanently delete the "${proj.title}" project? This is irreversible.`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        disabled={projectList.length <= 1}
                        className="rounded-lg border border-transparent p-2 text-brand-text-muted hover:border-brand-bad/30 hover:bg-brand-bad/10 hover:text-brand-bad disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        title="Delete project workspace"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
