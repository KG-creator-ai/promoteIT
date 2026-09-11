import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SutraAssistant } from '../chat/SutraAssistant';
import { SutraFAB } from '../chat/SutraFAB';
import { CommandPalette } from '../common/CommandPalette';
import { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  onEngineInit: () => void;
  onGenerateResponse: (messages: ChatCompletionMessageParam[]) => Promise<any>;
  engineState: {
    isLoading: boolean;
    provider: string | null;
    progress: string;
  };
}

export function Layout({ children, activeView, onNavigate, onEngineInit, onGenerateResponse, engineState }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSutraOpen, setIsSutraOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Keyboard shortcut Cmd+J to toggle S.U.T.R.A. AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsSutraOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onEngineInit={onEngineInit}
        engineState={engineState}
        isSutraOpen={isSutraOpen}
        onToggleSutra={() => setIsSutraOpen(!isSutraOpen)}
      />
      <div className="flex flex-1 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <Sidebar 
          isOpen={isSidebarOpen} 
          activeView={activeView} 
          onNavigate={onNavigate} 
        />
        
        {/* Main Content Area - Unaltered stable workspace canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 md:mb-0 mb-16 relative focus:outline-none bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Non-blocking floating glass S.U.T.R.A. AI Assistant */}
        <SutraAssistant 
          isOpen={isSutraOpen} 
          onClose={() => setIsSutraOpen(false)} 
          engineState={engineState}
          onGenerateResponse={onGenerateResponse}
        />
        
        <SutraFAB 
          isOpen={isSutraOpen}
          onClick={() => setIsSutraOpen(true)}
        />
      </div>
      
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        setIsOpen={setIsCommandPaletteOpen}
        onNavigate={onNavigate}
      />
    </div>
  );
}
