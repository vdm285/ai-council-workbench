/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, AlertTriangle, ExternalLink, X, Check } from 'lucide-react';
import { Model } from '../types';

interface RosterManagerProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  onUpdateModels: (updated: Model[]) => void;
  onResetToDefault: () => void;
}

export default function RosterManager({
  isOpen,
  onClose,
  models,
  onUpdateModels,
  onResetToDefault
}: RosterManagerProps) {
  const [newModel, setNewModel] = useState<{ name: string; url: string; bloc: 'Western' | 'Eastern' | 'Custom' }>({
    name: '',
    url: '',
    bloc: 'Custom'
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newModel.name.trim()) {
      setError('Model Name is required.');
      return;
    }
    const id = newModel.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (models.some(m => m.id === id)) {
      setError('A model with this name or similar identifier already exists.');
      return;
    }

    const added: Model = {
      id,
      name: newModel.name.trim(),
      url: newModel.url.trim() || 'https://google.com',
      bloc: newModel.bloc
    };

    onUpdateModels([...models, added]);
    setNewModel({ name: '', url: '', bloc: 'Custom' });
    setError(null);
  };

  const handleRemoveField = (id: string) => {
    if (models.length <= 2) {
      setError('The council must contain at least 2 models for comparative voting.');
      return;
    }
    onUpdateModels(models.filter(m => m.id !== id));
    setError(null);
  };

  const handleEditField = (id: string, key: keyof Model, value: any) => {
    const updated = models.map(m => {
      if (m.id === id) {
        return { ...m, [key]: value };
      }
      return m;
    });
    onUpdateModels(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-brand-border bg-brand-panel shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">Council Roster Configuration</h2>
            <p className="text-xs text-brand-text-muted">
              Define the 3 Western and 3 Eastern models (or configure your own custom models).
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-brand-text-muted hover:bg-brand-panel-light hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-brand-bad/30 bg-brand-bad/10 p-4 text-sm text-brand-bad">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <span className="text-xs font-semibold tracking-wider text-brand-text-muted uppercase">
              Current Active Council ({models.length} Models)
            </span>
            <div className="grid grid-cols-1 gap-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-brand-border bg-brand-bg p-3.5 transition-all hover:border-brand-text-muted"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Model Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={model.name}
                        onChange={(e) => handleEditField(model.id, 'name', e.target.value)}
                        className="w-full rounded-lg border border-brand-border bg-brand-panel-light px-3 py-1.5 text-xs text-white font-medium focus:border-brand-accent focus:outline-none"
                      />
                    </div>

                    {/* Bloc Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1">
                        Philosophical Bloc
                      </label>
                      <select
                        value={model.bloc}
                        onChange={(e) => handleEditField(model.id, 'bloc', e.target.value as any)}
                        className="w-full rounded-lg border border-brand-border bg-brand-panel-light px-3 py-1.5 text-xs text-white focus:border-brand-accent focus:outline-none"
                      >
                        <option value="Western">Western Bloc</option>
                        <option value="Eastern">Eastern Bloc</option>
                        <option value="Custom">Custom Bloc</option>
                      </select>
                    </div>

                    {/* Chatbot Interface URL */}
                    <div>
                      <label className="block text-[10px] font-bold text-brand-text-muted uppercase mb-1">
                        Chatbot URL
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={model.url}
                          onChange={(e) => handleEditField(model.id, 'url', e.target.value)}
                          className="w-full rounded-lg border border-brand-border bg-brand-panel-light pl-3 pr-8 py-1.5 text-xs text-white font-mono focus:border-brand-accent focus:outline-none"
                        />
                        <a
                          href={model.url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute right-2 text-brand-text-muted hover:text-brand-accent"
                          title="Open interface in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-end justify-end sm:self-end h-full pt-1">
                    <button
                      onClick={() => handleRemoveField(model.id)}
                      className="rounded-lg border border-transparent p-2 text-brand-text-muted hover:border-brand-bad/30 hover:bg-brand-bad/10 hover:text-brand-bad transition-all cursor-pointer"
                      title="Remove model from council"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add custom model */}
          <div className="rounded-2xl border border-brand-border bg-brand-panel-light/20 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Add Custom Model to Council</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1.5">
                  Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Claude 3.5 Sonnet"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1.5">
                  Philosophical Bloc
                </label>
                <select
                  value={newModel.bloc}
                  onChange={(e) => setNewModel({ ...newModel, bloc: e.target.value as any })}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white focus:border-brand-accent focus:outline-none"
                >
                  <option value="Western">Western Bloc</option>
                  <option value="Eastern">Eastern Bloc</option>
                  <option value="Custom">Custom / Neutral Bloc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted mb-1.5">
                  Chatbot URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://claude.ai"
                  value={newModel.url}
                  onChange={(e) => setNewModel({ ...newModel, url: e.target.value })}
                  className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-white font-mono focus:border-brand-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleAddField}
                className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-bg hover:bg-brand-accent/90 transition-all cursor-pointer shadow-lg shadow-brand-accent/10"
              >
                <Plus className="h-4 w-4" />
                Add to Council
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-brand-border px-6 py-4 bg-brand-panel-light/20">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to restore the standard 3 Western + 3 Eastern roster? Any custom models will be removed.')) {
                onResetToDefault();
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-bg px-4 py-2 text-xs font-medium text-brand-text-muted hover:border-brand-text-muted hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Defaults
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-brand-panel-light border border-brand-border px-5 py-2 text-xs font-bold text-white hover:bg-brand-panel-light/80 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4 text-brand-good" />
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
