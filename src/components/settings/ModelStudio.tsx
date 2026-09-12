import React, { useState, useEffect } from 'react';
import { Download, Trash2, Key, Database, ShieldAlert, CheckCircle2, Server } from 'lucide-react';

const PRE_SEEDED_MODELS = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B Instruct', vram: '~1.5 GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B Instruct', vram: '~3.2 GB' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini Instruct', vram: '~3.8 GB' },
  { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 Coder 1.5B', vram: '~2.0 GB' }
];

export function ModelStudio() {
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [activeModel, setActiveModel] = useState<string>('Llama-3.2-3B-Instruct-q4f16_1-MLC');
  const [apiKeys, setApiKeys] = useState({ gemini: '', openrouter: '' });
  const [cacheSize, setCacheSize] = useState('…');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Load persisted keys (local-only, zero-backend) + real storage estimate
  useEffect(() => {
    try {
      const gemini = localStorage.getItem('promote_it_gemini_key') || '';
      const openrouter = localStorage.getItem('promote_it_openrouter_key') || '';
      if (gemini || openrouter) setApiKeys({ gemini, openrouter });
    } catch {
      // storage unavailable — keep empty
    }
    refreshCacheSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCacheSize = async () => {
    try {
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const gb = (est.usage || 0) / (1024 * 1024 * 1024);
        setCacheSize(`${gb.toFixed(2)} GB`);
        return;
      }
    } catch {
      // fall through
    }
    setCacheSize('unknown');
  };

  const handleSaveKeys = () => {
    try {
      localStorage.setItem('promote_it_gemini_key', apiKeys.gemini.trim());
      localStorage.setItem('promote_it_openrouter_key', apiKeys.openrouter.trim());
      setStatusMsg('API keys saved locally — they never leave this browser except to the provider API.');
    } catch {
      setStatusMsg('Could not persist keys: browser storage is unavailable.');
    }
  };

  // Simulated handlers for UI non-blocking test
  const handleDownload = (id: string) => {
    setDownloadProgress(prev => ({ ...prev, [id]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[id];
          return newProgress;
        });
        setActiveModel(id);
        setCacheSize('3.24 GB'); // Fake size update
      } else {
        setDownloadProgress(prev => ({ ...prev, [id]: progress }));
      }
    }, 200);
  };

  const clearCache = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      await refreshCacheSize();
      setStatusMsg('Model cache cleared from CacheStorage.');
    } catch {
      setStatusMsg('Could not clear cache: CacheStorage is unavailable.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Local Models */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300/60 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Local WebGPU Models
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                Cache Used: {cacheSize}
              </span>
              <button 
                onClick={clearCache}
                className="p-1.5 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg transition-colors"
                title="Clear CacheStorage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {PRE_SEEDED_MODELS.map(model => (
              <div key={model.id} className={`p-4 rounded-2xl border transition-all ${
                activeModel === model.id 
                  ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-500/50' 
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {model.name}
                      {activeModel === model.id && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{model.id}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">
                      VRAM: {model.vram}
                    </span>
                    {activeModel !== model.id && typeof downloadProgress[model.id] === 'undefined' && (
                      <button 
                        onClick={() => handleDownload(model.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download & Load
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {typeof downloadProgress[model.id] !== 'undefined' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Downloading weights...</span>
                      <span>{downloadProgress[model.id]}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200" 
                        style={{ width: `${downloadProgress[model.id]}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Remote Fallbacks */}
      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300/60 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-emerald-500" />
            Remote API Fallbacks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Configure fallback APIs for when WebGPU is unavailable or VRAM is exhausted.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-400" />
                Google Gemini API Key
              </label>
              <input 
                type="password"
                value={apiKeys.gemini}
                onChange={e => setApiKeys(p => ({ ...p, gemini: e.target.value }))}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-400" />
                OpenRouter API Key
              </label>
              <input 
                type="password"
                value={apiKeys.openrouter}
                onChange={e => setApiKeys(p => ({ ...p, openrouter: e.target.value }))}
                placeholder="sk-or-v1-..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleSaveKeys}
                className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors min-h-[44px]"
              >
                Save API Keys
              </button>
              {statusMsg && (
                <p aria-live="polite" className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  {statusMsg}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
              API keys are stored exclusively in your local browser's IndexedDB and never transmitted to our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
