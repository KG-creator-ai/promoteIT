import React, { useEffect, useState } from 'react';
import { Menu, Wifi, WifiOff, Download } from 'lucide-react';
import { PromoteITLogo } from '../common/PromoteITLogo';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ThemeToggle } from './ThemeToggle';
import { SutraTrigger } from '../chat/SutraTrigger';
import { EngineSelectorWidget } from '../widgets/EngineSelectorWidget';
import { NotificationWidget } from '../widgets/NotificationWidget';
import { ProfileWidget } from '../widgets/ProfileWidget';

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
      {/* ═══════════════════════════════════════════════════════
          MODULE 1: Brand Lockup
          ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <PromoteITLogo className="w-8 h-8 shrink-0 text-slate-900 dark:text-white" />
          <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent select-none whitespace-nowrap">
            promote-IT
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODULES 2-5: Right Toolbar Controls
          ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* MODULE 2: Inference Mode & Engine Switcher */}
        <EngineSelectorWidget
          provider={engineState.provider as any}
          isLoading={engineState.isLoading}
          progress={engineState.progress}
          onEngineInit={onEngineInit}
        />

        {/* MODULE 3: Notifications Widget */}
        <NotificationWidget />

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* MODULE 4: S.U.T.R.A. Assistant Trigger */}
        <SutraTrigger
          onClick={onToggleSutra || (() => {})}
          isOpen={!!isSutraOpen}
          isEngineReady={!!engineState.provider || !engineState.isLoading}
        />

        {/* MODULE 5: Profile & Security Badge */}
        <ProfileWidget />

        {/* Offline / Online Status Badge */}
        <div className={`hidden md:flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 min-h-[44px] rounded-lg sm:rounded-full text-xs font-bold border ${
          isOffline
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            : 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-white/10'
        }`}>
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{isOffline ? 'Offline' : 'Online'}</span>
        </div>
      </div>
    </header>
  );
}
