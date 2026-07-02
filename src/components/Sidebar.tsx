/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Send,
  EyeOff,
  BarChart3,
  FileSpreadsheet,
  Wand2,
  Award,
  Database,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'stage1'
  | 'stage2'
  | 'results'
  | 'ledger'
  | 'stage3'
  | 'stage4'
  | 'final'
  | 'backup';

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

interface SidebarItem {
  id: TabId;
  label: string;
  num: string;
  icon: React.ComponentType<any>;
  description: string;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const items: SidebarItem[] = [
    {
      id: 'overview',
      num: '0',
      label: 'Overview',
      icon: BookOpen,
      description: 'Council pipeline philosophy'
    },
    {
      id: 'stage1',
      num: '1',
      label: 'Independent Answers',
      icon: Send,
      description: 'Pristine raw model replies'
    },
    {
      id: 'stage2',
      num: '2',
      label: 'Blind Evaluation',
      icon: EyeOff,
      description: 'Fresh anonymous critiques'
    },
    {
      id: 'results',
      num: '2B',
      label: 'Election Results',
      icon: BarChart3,
      description: 'Condorcet & IRV analytics'
    },
    {
      id: 'ledger',
      num: '2C',
      label: 'Consensus Ledger',
      icon: FileSpreadsheet,
      description: 'The editing constitution'
    },
    {
      id: 'stage3',
      num: '3',
      label: 'Final Synthesis',
      icon: Wand2,
      description: 'One chosen model compiles'
    },
    {
      id: 'final',
      num: '★',
      label: 'Final Answer',
      icon: Award,
      description: 'The council-approved result'
    },
    {
      id: 'backup',
      num: '📥',
      label: 'Import / Export',
      icon: Database,
      description: 'Save project runs to JSON'
    }
  ];

  const handleSelect = (id: TabId) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top navigation toggle */}
      <div className="flex items-center justify-between border-b border-brand-border bg-brand-panel px-4 py-3 md:hidden">
        <span className="text-sm font-semibold tracking-wide text-brand-text">Workflow Navigator</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-1.5 text-brand-text hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar container */}
      <nav
        className={`
          fixed inset-y-0 left-0 z-30 w-72 transform border-r border-brand-border bg-brand-panel py-6 px-4 transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:translate-x-0
          ${mobileOpen ? 'translate-x-0 top-16' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-1">
          <div className="mb-4 px-2">
            <span className="text-xs font-semibold tracking-wider text-brand-text-muted uppercase">
              Council Pipeline Stages
            </span>
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`
                  group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer duration-200
                  ${
                    isActive
                      ? 'border-brand-accent bg-brand-accent/10 text-white shadow-[0_0_15px_rgba(94,146,255,0.1)]'
                      : 'border-transparent text-brand-text-muted hover:border-brand-border hover:bg-brand-panel-light/30 hover:text-brand-text'
                  }
                `}
              >
                <div
                  className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-semibold text-xs transition-all duration-200
                    ${
                      isActive
                        ? 'border-brand-accent bg-brand-accent text-brand-bg shadow-sm'
                        : 'border-brand-border bg-brand-bg text-brand-text-muted group-hover:border-brand-text-muted group-hover:text-brand-text'
                    }
                  `}
                >
                  {item.num}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold truncate leading-tight group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 leading-normal truncate">
                    {item.description}
                  </span>
                </div>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-all duration-200
                    ${isActive ? 'text-brand-accent opacity-100 translate-x-0.5' : 'text-slate-500'}
                  `}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile background backdrop overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-20 bg-brand-bg/65 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
