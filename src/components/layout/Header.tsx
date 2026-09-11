import React, { useEffect, useState, useRef } from 'react';
import { Menu, Wifi, WifiOff, Cpu, ChevronDown, Download, Check, Layers } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { PromoteITLogo } from '../common/PromoteITLogo';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useDexieCampaign } from '../../hooks/useDexieCampaign';
import { ThemeToggle } from './ThemeToggle';
import { SutraTrigger } from '../chat/SutraTrigger';

interface HeaderProps {
  onMenuClick: () => void;
  onEngineInit: () => void;
  onToggleSutra?: () => void;
  isSutraOpen?: boolean;
  // Legacy aliases
  onToggleCopilot?: () => void;
  isCopilotOpen?: boolean;
  engineState: {
    isLoading: boolean;
    provider: string | null;
    progress: string;
  };
}

export function Header({ 
  onMenuClick, 
  onEngineInit, 
  onToggleSutra, 
  isSutraOpen, 
  onToggleCopilot, 
  isCopilotOpen = false, 
  engineState 
}: HeaderProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isInstallable, promptInstall } = usePWAInstall();
  const { campaigns, activeCampaign, setActiveCampaign } = useDexieCampaign();
  
  const templates = useLiveQuery(() => db.brandTemplates.toArray()) || [];
  const activeTemplate = templates.length > 0 ? templates[0] : null;

  const handleToggle = onToggleSutra || onToggleCopilot || (() => {});
  const isOpen = isSutraOpen !== undefined ? isSutraOpen : isCopilotOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-between px-4 sticky top-0 z-20 pt-[env(safe-area-inset-top)] box-content transition-colors">
      {/* Left: Menu + Primary Application Brand Lockup + Brand Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Primary Application Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <PromoteITLogo className="w-8 h-8 shrink-0 text-slate-900 dark:text-white" />
          <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent select-none whitespace-nowrap">
            promote-IT
          </span>
        </div>

        {/* Brand Switcher / Multi-Campaign Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="hidden md:flex items-center gap-2 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-white/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-700/60 transition-colors ml-1"
            title="Switch Campaign / Brand"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[140px] lg:max-w-[200px] truncate">
              {activeCampaign?.title || activeTemplate?.name || 'Active Campaign'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-1 mt-2 w-64 rounded-xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/60">
                Campaign Projects
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {campaigns && campaigns.length > 0 ? (
                  campaigns.map((c) => {
                    const isSelected = activeCampaign?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          if (c.id) setActiveCampaign(c.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors ${
                          isSelected ? 'font-semibold text-primary dark:text-emerald-400 bg-primary/5' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Layers className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{c.title}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-primary dark:text-emerald-400" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400">No campaigns found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Toolbar Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        {isInstallable && (
          <button 
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* S.U.T.R.A. Dedicated AI Assistant Trigger */}
        <SutraTrigger 
          onClick={handleToggle}
          isOpen={isOpen}
          isEngineReady={!!engineState.provider || !engineState.isLoading}
        />

        {/* S.U.T.R.A. WebLLM Engine Badge */}
        <button 
          onClick={onEngineInit}
          className={`flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-full text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${
            engineState.provider === 'webgpu' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
            engineState.provider === 'remote-api' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
            engineState.isLoading ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse' :
            'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-slate-800'
          }`}
          title={engineState.progress || 'Initialize S.U.T.R.A. AI Engine'}
        >
          <Cpu className="w-4 h-4" />
          <span className="hidden lg:inline">
            {engineState.isLoading ? 'Loading Model...' :
             engineState.provider === 'webgpu' ? 'WebGPU Active' :
             engineState.provider === 'remote-api' ? 'API Fallback' :
             'Load AI Engine'}
          </span>
        </button>

        {/* Offline / Online Status Badge */}
        <div className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-full text-xs font-bold border ${
          isOffline 
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
            : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-white/10'
        }`}>
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOffline ? 'Offline' : 'Online'}</span>
        </div>
      </div>
    </header>
  );
}
