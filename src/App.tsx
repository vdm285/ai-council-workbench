/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Model, Project, WorkbenchState, ConsensusLedger, JudgeBallot } from './types';
import { seededShuffle, computeElections } from './utils';

// Sub-components
import Header from './components/Header';
import Sidebar, { TabId } from './components/Sidebar';
import RosterManager from './components/RosterManager';
import ProjectManager from './components/ProjectManager';

// Panels
import OverviewPanel from './components/OverviewPanel';
import Stage1Panel from './components/Stage1Panel';
import Stage2Panel from './components/Stage2Panel';
import ResultsPanel from './components/ResultsPanel';
import LedgerPanel from './components/LedgerPanel';
import Stage3Panel from './components/Stage3Panel';
import FinalPanel from './components/FinalPanel';
import BackupPanel from './components/BackupPanel';

const STORAGE_KEY = 'manual_ai_council_workbench_v1_react';

const DEFAULT_MODELS: Model[] = [
  { id: 'chatgpt', name: 'ChatGPT', bloc: 'Western', url: 'https://chatgpt.com' },
  { id: 'gemini', name: 'Gemini', bloc: 'Western', url: 'https://gemini.google.com' },
  { id: 'grok', name: 'Grok', bloc: 'Western', url: 'https://grok.com' },
  { id: 'deepseek', name: 'DeepSeek', bloc: 'Eastern', url: 'https://chat.deepseek.com' },
  { id: 'qwen', name: 'Qwen', bloc: 'Eastern', url: 'https://chat.qwen.ai' },
  { id: 'kimi', name: 'Kimi', bloc: 'Eastern', url: 'https://kimi.moonshot.cn' }
];

function createFreshProject(id: string, title: string): Project {
  return {
    id,
    title,
    originalPrompt: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeModelIds: DEFAULT_MODELS.map(m => m.id),
    stage1Responses: {},
    stage2Orders: {},
    stage2Raw: {},
    judgeBallots: {},
    electionResults: null,
    consensusLedger: {
      baseCandidateId: '',
      runnerUpCandidateIds: [],
      mustInclude: [],
      mustFix: [],
      mustExclude: [],
      openDisputes: []
    },
    stage3Raw: {},
    consensusProposals: {},
    stage4Orders: {},
    stage4Raw: {},
    approvalBallots: {},
    finalSelection: null,
    finalSynthesisModelId: '',
    finalAnswerText: ''
  };
}

export default function App() {
  const [state, setState] = useState<WorkbenchState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.projects) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load storage state:', e);
    }

    const defaultProjId = 'default_project';
    const defaultProject = createFreshProject(defaultProjId, 'First Council Session');
    return {
      projects: { [defaultProjId]: defaultProject },
      activeProjectId: defaultProjId,
      customModels: []
    };
  });

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [rosterOpen, setRosterOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  // Auto-save state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [state]);

  const activeProject = state.activeProjectId ? state.projects[state.activeProjectId] || null : null;
  const currentModels = state.customModels.length > 0 ? state.customModels : DEFAULT_MODELS;
  const configuredActiveIds = activeProject?.activeModelIds?.filter(id => currentModels.some(m => m.id === id)) || [];
  const activeModelIds = configuredActiveIds.length ? configuredActiveIds : currentModels.map(m => m.id);
  const activeModels = currentModels.filter(m => activeModelIds.includes(m.id));
  const cockpitMode = activeTab === 'stage1' || activeTab === 'stage2';

  const updateActiveProject = (updated: Project) => {
    if (!state.activeProjectId) return;
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [state.activeProjectId!]: {
          ...updated,
          updatedAt: new Date().toISOString()
        }
      }
    }));
  };

  const handleSelectProject = (id: string) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  };

  const handleCreateProject = (title: string) => {
    const id = `project_${Date.now()}`;
    const fresh = createFreshProject(id, title);
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [id]: fresh
      },
      activeProjectId: id
    }));
  };

  const handleDeleteProject = (id: string) => {
    if (Object.keys(state.projects).length <= 1) return;
    setState(prev => {
      const copy = { ...prev.projects };
      delete copy[id];
      const remainingIds = Object.keys(copy);
      return {
        ...prev,
        projects: copy,
        activeProjectId: remainingIds[0] || null
      };
    });
  };

  const handleUpdateRoster = (updated: Model[]) => {
    setState(prev => ({ ...prev, customModels: updated }));
  };

  const handleResetRoster = () => {
    setState(prev => ({ ...prev, customModels: [] }));
  };

  const handleSetActiveModelIds = (ids: string[]) => {
    if (!activeProject) return;
    updateActiveProject({
      ...activeProject,
      activeModelIds: ids
    });
  };

  const handleGenerateOrders = (projectOverride?: Project) => {
    const sourceProject = projectOverride || activeProject;
    if (!sourceProject) return;
    const candidateIds = activeModels.map(m => m.id);
    const sharedOrder = seededShuffle<string>(
      candidateIds,
      `${sourceProject.title}|shared-stage2|${sourceProject.originalPrompt}`
    );
    const orders: Record<string, string[]> = {};
    activeModels.forEach(judge => {
      orders[judge.id] = sharedOrder;
    });
    updateActiveProject({
      ...sourceProject,
      stage2Orders: orders
    });
  };

  const handleComputeElection = (ballotsOverride?: JudgeBallot[]) => {
    if (!activeProject) return;
    const sourceBallots = ballotsOverride || (Object.values(activeProject.judgeBallots) as JudgeBallot[]);
    const activeJudgeIds = new Set(activeModels.map(m => m.id));
    const ballots = sourceBallots.filter(
      b => activeJudgeIds.has(b.judgeId) && !b.parseError && b.ranking && b.ranking.length > 0
    );
    const candidateIds = activeModels.map(m => m.id);
    if (ballots.length < 2) return;
    const results = computeElections(candidateIds, ballots);

    // Default base and runner-ups selection
    const ledger = { ...activeProject.consensusLedger };
    if (!ledger.baseCandidateId && results.recommendedBase) {
      ledger.baseCandidateId = results.recommendedBase;
    }
    if ((!ledger.runnerUpCandidateIds || ledger.runnerUpCandidateIds.length === 0) && results.runnerUps) {
      ledger.runnerUpCandidateIds = results.runnerUps;
    }

    updateActiveProject({
      ...activeProject,
      electionResults: results,
      consensusLedger: ledger
    });
  };

  const handleImportFull = (imported: any) => {
    if (imported.projects && imported.activeProjectId) {
      setState(imported);
    } else if (imported.id) {
      // Single project format
      setState(prev => ({
        ...prev,
        projects: {
          ...prev.projects,
          [imported.id]: imported
        },
        activeProjectId: imported.id
      }));
    }
  };

  const handleResetActiveProject = () => {
    if (!state.activeProjectId) return;
    const fresh = createFreshProject(state.activeProjectId, activeProject?.title || 'Wiped Project');
    updateActiveProject(fresh);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans select-none antialiased">
      <Header
        activeProject={activeProject}
        onOpenRoster={() => setRosterOpen(true)}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenBackup={() => setActiveTab('backup')}
      />

      <div className="flex-1 flex flex-col md:flex-row relative">
        {!cockpitMode && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

        <main className={`flex-1 overflow-y-auto w-full select-text ${cockpitMode ? 'px-3 py-3 sm:px-4 max-w-none' : 'px-4 py-6 sm:px-6 sm:py-8 lg:px-10 max-w-7xl mx-auto'}`}>
          {activeProject ? (
            <>
              {activeTab === 'overview' && (
                <OverviewPanel
                  onNavigate={setActiveTab}
                  modelsCount={currentModels.length}
                />
              )}

              {activeTab === 'stage1' && (
                <Stage1Panel
                  project={activeProject}
                  models={currentModels}
                  activeModelIds={activeModelIds}
                  onSetActiveModelIds={handleSetActiveModelIds}
                  onUpdateProject={updateActiveProject}
                  onGenerateOrders={handleGenerateOrders}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'stage2' && (
                <Stage2Panel
                  project={activeProject}
                  models={activeModels}
                  onUpdateProject={updateActiveProject}
                  onNavigate={setActiveTab}
                  onComputeElection={handleComputeElection}
                />
              )}

              {activeTab === 'results' && (
                <ResultsPanel
                  project={activeProject}
                  models={activeModels}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'ledger' && (
                <LedgerPanel
                  project={activeProject}
                  models={activeModels}
                  onUpdateProject={updateActiveProject}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'stage3' && (
                <Stage3Panel
                  project={activeProject}
                  models={activeModels}
                  onUpdateProject={updateActiveProject}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'final' && (
                <FinalPanel
                  project={activeProject}
                  models={activeModels}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'backup' && (
                <BackupPanel
                  project={activeProject}
                  onImportProject={handleImportFull}
                  onResetProject={handleResetActiveProject}
                  fullState={state}
                />
              )}
            </>
          ) : (
            <div className="text-center py-24 space-y-4 max-w-sm mx-auto">
              <p className="text-sm text-brand-text-muted">No active project workspace could be located.</p>
              <button
                onClick={() => setProjectsOpen(true)}
                className="rounded-xl bg-brand-accent px-5 py-2.5 text-xs font-bold text-brand-bg hover:bg-brand-accent/90 cursor-pointer shadow-md"
              >
                Create Workspace
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Roster & Project Modals */}
      <RosterManager
        isOpen={rosterOpen}
        onClose={() => setRosterOpen(false)}
        models={currentModels}
        onUpdateModels={handleUpdateRoster}
        onResetToDefault={handleResetRoster}
      />

      <ProjectManager
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={state.projects}
        activeProjectId={state.activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  );
}
