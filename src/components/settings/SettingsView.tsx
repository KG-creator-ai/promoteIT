import React, { useState } from 'react';
import { ThemeCustomizer } from './ThemeCustomizer';
import { ModelStudio } from './ModelStudio';
import { Settings as SettingsIcon, Cpu } from 'lucide-react';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'theme' | 'models'>('models');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Platform Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure workspace themes and AI model endpoints.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-300 dark:border-white/10">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'models' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          WebLLM Model Studio
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'theme' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Theme & Branding
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'models' ? <ModelStudio /> : <ThemeCustomizer />}
      </div>
    </div>
  );
}
