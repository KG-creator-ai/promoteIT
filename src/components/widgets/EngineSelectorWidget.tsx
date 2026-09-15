import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Wifi, Zap, ChevronDown } from 'lucide-react';
import type { LLMFallbackProvider } from '../../hooks/useWebLLM';

interface EngineSelectorWidgetProps {
  provider: LLMFallbackProvider | null;
  isLoading: boolean;
  progress: string;
  onEngineInit: () => void;
}

export function EngineSelectorWidget({ provider, isLoading, progress, onEngineInit }: EngineSelectorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modes = [
    { id: 'auto', label: 'Auto (WebGPU)', icon: Zap, desc: 'Best available engine' },
    { id: 'webgpu', label: 'WebLLM Local', icon: Cpu, desc: 'On-device inference' },
    { id: 'remote-api', label: 'Gemini API', icon: Wifi, desc: 'Cloud fallback' },
  ] as const;

  const currentMode = provider === 'webgpu' ? 'WebLLM Local' : provider === 'remote-api' ? 'Gemini API' : 'Auto (WebGPU)';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 min-h-[44px] rounded-full text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          provider === 'webgpu' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
          provider === 'remote-api' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
          isLoading ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse' :
          'bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-300/50 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-slate-800'
        }`}
        title={progress || 'Engine Selector'}
      >
        <Cpu className="w-4 h-4" />
        <span className="hidden lg:inline">
          {isLoading ? 'Loading...' : currentMode}
        </span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inference Engine</p>
          </div>
          <div className="p-1">
            {modes.map(mode => (
              <button
                key={mode.id}
                onClick={() => {
                  if (mode.id === 'auto' || (mode.id === provider)) {
                    onEngineInit();
                  }
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <mode.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{mode.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</p>
                </div>
              </button>
            ))}
          </div>
          {progress && (
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{progress}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
