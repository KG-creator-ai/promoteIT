import React from 'react';
import { LayoutDashboard, Wand2, FileVideo, Lightbulb, Settings, Mic, Activity, Puzzle } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeView: string;
  onNavigate: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'AV-ArtVark', icon: LayoutDashboard },
  { id: 'wizard', label: 'Wizard', icon: Wand2 },
  { id: 'studio', label: 'Resource Stitcher', icon: Puzzle },
  { id: 'script', label: 'Script Studio', icon: FileVideo },
  { id: 'prompts', label: 'Prompt Hub', icon: Lightbulb },
  { id: 'audio', label: 'Audio Studio', icon: Mic },
  { id: 'system', label: 'System Health', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen, activeView, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <div className={`hidden md:flex backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300 flex-col ${isOpen ? 'w-64' : 'w-16'} overflow-hidden`}>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive 
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold border border-primary/20 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                <span className={`text-sm ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex justify-around items-center px-1 py-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                <span className="text-[10px] font-medium leading-none tracking-tight text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
