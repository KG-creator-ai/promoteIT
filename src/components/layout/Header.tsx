import React, { useEffect, useState } from 'react';
import { Menu, Wifi, WifiOff, Cpu, Download } from 'lucide-react';
import { PromoteITLogo } from '../common/PromoteITLogo';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ThemeToggle } from './ThemeToggle';
import { SutraTrigger } from '../chat/SutraTrigger';

interface HeaderProps {
  onMenuClick: () => void;
  onEngineInit: () => void;
  onToggleSutra?: () => void;
  isSutraOpen?: boolean;
  engineState: {
    isLoading: boolean;
    provider: string | null;
    progress: string;
  };
}

export function Header({ onMenuClick, onEngineInit, onToggleSutra, isSutraOpen, engineState }: HeaderProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { isInstallable, promptInstall } = usePWAInstall();

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
      {/* Left: Menu + promote-IT Brand Lockup */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onMenuClick} 
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[44px] min-h-[44px] flex items-center justify-center"
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
      </div>
      
      {/* Right Toolbar Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        {isInstallable && (
          <button 
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* S.U.T.R.A. Dedicated AI Assistant Trigger */}
        <SutraTrigger 
          onClick={onToggleSutra || (() => {})}
          isOpen={!!isSutraOpen}
          isEngineReady={!!engineState.provider || !engineState.isLoading}
        />

        {/* S.U.T.R.A. WebLLM Engine Badge */}
        <button 
          onClick={onEngineInit}
          className={`flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 min-h-[44px] rounded-lg sm:rounded-full text-xs font-semibold border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${
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
        <div className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 min-h-[44px] rounded-lg sm:rounded-full text-xs font-bold border ${
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
