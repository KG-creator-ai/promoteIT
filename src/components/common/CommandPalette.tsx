import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, FileText, Video, Settings, Play } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNavigate: (view: string) => void;
}

export function CommandPalette({ isOpen, setIsOpen, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (view: string) => {
    onNavigate(view);
    setIsOpen(false);
  };

  const commands = [
    { id: 'dashboard', label: 'Go to AV-ArtVark', icon: Play, action: () => handleSelect('dashboard') },
    { id: 'wizard', label: 'Open Campaign Wizard', icon: FileText, action: () => handleSelect('wizard') },
    { id: 'prompts', label: 'View AI Video Prompts', icon: Video, action: () => handleSelect('prompts') },
    { id: 'settings', label: 'Open Customizer', icon: Settings, action: () => handleSelect('settings') },
  ];

  const filtered = query 
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div 
        role="dialog" 
        aria-modal="true"
        aria-label="Command Palette"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands or jump to..."
            className="flex-1 bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base"
          />
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2" aria-live="polite">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No commands found.</div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
                >
                  <Icon className="w-4 h-4 opacity-70 text-primary" />
                  {cmd.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
