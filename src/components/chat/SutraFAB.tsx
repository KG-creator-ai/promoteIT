import React from 'react';
import { SutraAvatar } from './SutraAvatar';

interface SutraFABProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen: boolean;
}

export function SutraFAB({ onClick, unreadCount = 0, isOpen }: SutraFABProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      id="sutra-fab-trigger"
      className="fixed bottom-[80px] md:bottom-6 right-6 z-40 p-3.5 bg-gradient-to-tr from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-full shadow-[0_0_24px_rgba(25,152,139,0.4)] hover:shadow-[0_0_30px_rgba(195,124,91,0.5)] border border-white/20 transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent group"
      aria-label="Open S.U.T.R.A. AI Assistant (Cmd+J)"
      title="Open S.U.T.R.A. AI Assistant (Cmd+J)"
    >
      <div className="relative">
        <SutraAvatar className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
      </div>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-slate-900 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
