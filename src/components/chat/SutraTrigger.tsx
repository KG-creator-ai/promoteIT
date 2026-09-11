import React from 'react';
import { SutraAvatar } from './SutraAvatar';

interface SutraTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
  isEngineReady?: boolean;
}

export function SutraTrigger({ onClick, isOpen = false, isEngineReady = true }: SutraTriggerProps) {
  return (
    <button
      onClick={onClick}
      id="sutra-header-trigger"
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-sm ${
        isOpen
          ? 'bg-primary/25 border-primary text-slate-900 dark:text-white shadow-[0_0_12px_rgba(25,152,139,0.3)] ring-1 ring-primary'
          : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-slate-800 dark:text-slate-100 hover:scale-[1.02] active:scale-[0.98]'
      }`}
      aria-label="Toggle S.U.T.R.A. AI Assistant (Cmd+J)"
      title="Toggle S.U.T.R.A. AI Assistant (Cmd+J)"
    >
      <div className="relative flex items-center justify-center">
        <SutraAvatar className="w-4 h-4" size={16} />
        {isEngineReady && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
        )}
      </div>
      <span className="font-semibold tracking-wide whitespace-nowrap">S.U.T.R.A.</span>
    </button>
  );
}
