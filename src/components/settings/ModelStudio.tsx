import React, { useState, useEffect } from 'react';
import { Download, Trash2, Key, Database, ShieldAlert, CheckCircle2, Server, FlaskConical } from 'lucide-react';
import {
  PROVIDER_DEFAULTS,
  persistRemoteConfig,
  testRemoteConnection,
  type RemoteProviderId,
  type RemoteConfig,
} from '../../lib/providers';

const PRE_SEEDED_MODELS = [
  { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 7B Instruct (default)', vram: '~4.7 GB' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B Instruct (edge devices)', vram: '~1.9 GB' },
  { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 Coder 1.5B', vram: '~2.0 GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B Instruct', vram: '~1.8 GB' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B Instruct', vram: '~1.1 GB' },
  { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini Instruct', vram: '~2.3 GB' },
];

const DEFAULT_MODEL = PRE_SEEDED_MODELS[0].id;

interface ModelStudioProps {
  onLoadModel?: (modelId: string) => Promise<void> | void;
  engineState?: { isLoading: boolean; provider: string | null; progress: string };
}

export function ModelStudio({ onLoadModel, engineState }: ModelStudioProps = {}) {
  const [activeModel, setActiveModel] = useState<string>(DEFAULT_MODEL);
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'webllm' | RemoteProviderId>('webllm');
  const [apiKeys, setApiKeys] = useState({ gemini: '', openrouter: '', nvidia: '' });
  const [remoteModel, setRemoteModel] = useState('');
  const [cacheSize, setCacheSize] = useState('…');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [probeMsg, setProbeMsg] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  // Load persisted keys + provider (local-only, zero-backend) + real storage estimate
  useEffect(() => {
    try {
      const gemini = localStorage.getItem('promote_it_gemini_key') || '';
      const openrouter = localStorage.getItem('promote_it_openrouter_key') || '';
      const nvidia = localStorage.getItem('promote_it_nvidia_key') || '';
      const savedProvider = localStorage.getItem('promote_it_remote_provider') as RemoteProviderId | null;
      const savedModel = localStorage.getItem('promote_it_remote_model') || '';
      if (gemini || openrouter || nvidia) setApiKeys({ gemini, openrouter, nvidia });
      if (savedProvider === 'gemini' || savedProvider === 'openrouter' || savedProvider === 'nvidia') {
        setProvider(savedProvider);
      }
      if (savedModel) setRemoteModel(savedModel);
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

  // Real model load: delegates to the app WebLLM engine (user gesture → WebGPU).
  const handleDownload = async (id: string) => {
    setLoadError(null);
    if (!onLoadModel) {
      setLoadError('Engine wiring is unavailable in this view — load the model from the header engine button.');
      return;
    }
    setLoadingModel(id);
    try {
      await onLoadModel(id);
      setActiveModel(id);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Model load failed — WebGPU may be unavailable on this device.');
    } finally {
      setLoadingModel(null);
    }
  };

  const currentKey = provider === 'gemini' ? apiKeys.gemini : provider === 'openrouter' ? apiKeys.openrouter : apiKeys.nvidia;

  const handleSaveKeys = () => {
    if (provider === 'webllm') {
      setStatusMsg('Local WebLLM needs no key — weights download from HuggingFace into CacheStorage.');
      return;
    }
    try {
      persistRemoteConfig({
        provider,
        apiKey: currentKey.trim(),
        model: remoteModel.trim() || PROVIDER_DEFAULTS[provider].model,
      });
      setStatusMsg('Provider config saved locally — keys never leave this browser except to the provider API.');
    } catch {
      setStatusMsg('Could not persist config: browser storage is unavailable.');
    }
  };

  const handleProbe = async () => {
    if (provider === 'webllm') {
      setProbeMsg('Local path needs no probe — load a model above and watch live progress.');
      return;
    }
    const cfg: RemoteConfig = {
      provider,
      apiKey: currentKey.trim(),
      model: remoteModel.trim() || PROVIDER_DEFAULTS[provider].model,
      baseUrl: PROVIDER_DEFAULTS[provider].baseUrl,
    };
    if (!cfg.apiKey) {
      setProbeMsg('Enter an API key first — the probe makes one no-cost request.');
      return;
    }
    setProbing(true);
    setProbeMsg(null);
    const result = await testRemoteConnection(cfg);
    setProbing(false);
    setProbeMsg(result.detail);
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
                className="p-1.5 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Clear CacheStorage"
                aria-label="Clear model cache"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {engineState?.isLoading && (
            <p aria-live="polite" className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
              {engineState.progress || 'Loading engine…'}
            </p>
          )}
          {loadError && (
            <p role="alert" className="text-sm text-rose-700 dark:text-rose-400 mb-4">{loadError}</p>
          )}

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
                    {activeModel !== model.id && (
                      <button
                        onClick={() => handleDownload(model.id)}
                        disabled={loadingModel !== null || engineState?.isLoading}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 min-h-[44px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {loadingModel === model.id ? 'Loading…' : 'Download & Load'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            Weights download from HuggingFace into CacheStorage on first load (works offline/airgapped afterwards).
            Loading a model requires WebGPU — unavailable browsers should use a remote provider below.
          </p>
        </div>
      </div>

      {/* Right Column: Inference Provider */}
      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-300/60 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-emerald-500" />
            Inference Provider
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Local WebLLM first; remote fallback when WebGPU is unavailable or VRAM is exhausted.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="ms-provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Active provider
              </label>
              <select
                id="ms-provider"
                value={provider}
                onChange={e => { setProvider(e.target.value as typeof provider); setProbeMsg(null); }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              >
                <option value="webllm">Local WebLLM (WebGPU, offline-capable)</option>
                <option value="gemini">Google Gemini (REST)</option>
                <option value="openrouter">OpenRouter (OpenAI-compatible)</option>
                <option value="nvidia">NVIDIA NIM (OpenAI-compatible)</option>
              </select>
            </div>

            {provider !== 'webllm' && (
              <>
                <div>
                  <label htmlFor="ms-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-slate-400" />
                    {PROVIDER_DEFAULTS[provider].label} API Key
                  </label>
                  <input
                    id="ms-key"
                    type="password"
                    value={provider === 'gemini' ? apiKeys.gemini : provider === 'openrouter' ? apiKeys.openrouter : apiKeys.nvidia}
                    onChange={e => setApiKeys(p => ({ ...p, [provider]: e.target.value }))}
                    placeholder={PROVIDER_DEFAULTS[provider].keyHint}
                    autoComplete="off"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="ms-model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Model (default: {PROVIDER_DEFAULTS[provider].model})
                  </label>
                  <input
                    id="ms-model"
                    type="text"
                    value={remoteModel}
                    onChange={e => setRemoteModel(e.target.value)}
                    placeholder={PROVIDER_DEFAULTS[provider].model}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            <div className="pt-2 space-y-2">
              {provider !== 'webllm' && (
                <button
                  onClick={handleSaveKeys}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors min-h-[44px]"
                >
                  Save Provider Config
                </button>
              )}
              <button
                onClick={handleProbe}
                disabled={probing}
                className="w-full py-2.5 border border-slate-300 dark:border-white/15 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FlaskConical className="w-4 h-4" />
                {probing ? 'Probing…' : 'Test Connection'}
              </button>
              {(statusMsg || probeMsg) && (
                <p aria-live="polite" className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  {[statusMsg, probeMsg].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
              Keys stay in this browser's local storage (or your own env file) and go only to the selected provider. Never commit them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
