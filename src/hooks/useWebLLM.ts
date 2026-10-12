import { useState, useRef, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport, ChatCompletionMessageParam, ChatCompletion } from '@mlc-ai/web-llm';
import {
  resolveRemoteConfig,
  geminiChatCompletion,
  openAIChatCompletion,
  toChatCompletion,
  type RemoteConfig,
} from '../lib/providers';

export type LLMFallbackProvider = 'webgpu' | 'wasm-simd' | 'remote-api';

export function useWebLLM(remoteApiKey?: string) {
  const [engine, setEngine] = useState<MLCEngine | null>(null);
  const [provider, setProvider] = useState<LLMFallbackProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<MLCEngine | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const IDLE_TIMEOUT_MS = 300000; // 5 minutes

  // Teardown function to free VRAM
  const unloadEngine = useCallback(async () => {
    if (engineRef.current) {
      console.log('Unloading MLCEngine and freeing VRAM...');
      try {
        await engineRef.current.unload();
      } catch (err) {
        console.warn('Error during engine unload:', err);
      }
      engineRef.current = null;
      setEngine(null);
      setProvider(null);
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      console.warn(`Idle timeout of ${IDLE_TIMEOUT_MS}ms reached. Unloading WebGPU model.`);
      unloadEngine();
    }, IDLE_TIMEOUT_MS);
  }, [unloadEngine]);

  const initEngine = useCallback(async (modelId: string = 'Qwen2.5-7B-Instruct-q4f16_1-MLC') => {
    setIsLoading(true);
    setError(null);

    // 1. Check for WebGPU Support
    let gpuSupported = false;
    const navGpu = (navigator as unknown as { gpu?: any }).gpu;
    
    if (navGpu) {
      try {
        const adapter = await navGpu.requestAdapter();
        if (adapter) {
          gpuSupported = true;
          // Handle context loss
          // Note: the exact API for adapter error listening may vary, but we can listen to general unload
        }
      } catch (e) {
        console.warn('WebGPU requestAdapter failed:', e);
      }
    }

    if (!gpuSupported) {
      console.warn('WebGPU not supported or requestAdapter failed. Falling back to remote API.');
      setProvider('remote-api');
      setIsLoading(false);
      return;
    }

    try {
      const newEngine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report: InitProgressReport) => {
          setProgress(report.text);
        }
      });
      
      engineRef.current = newEngine;
      setEngine(newEngine);
      setProvider('webgpu');
      resetIdleTimer();
    } catch (err: unknown) {
      console.error('Failed to init WebGPU MLCEngine:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize local AI engine.');
      setProvider('remote-api');
    } finally {
      setIsLoading(false);
    }
  }, [resetIdleTimer]);

  const resolveRemoteConfigCb = useCallback((): RemoteConfig | null => {
    // Explicit hook arg keeps legacy behavior: a raw Gemini key override.
    if (remoteApiKey) {
      return { provider: 'gemini', apiKey: remoteApiKey, model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com' };
    }
    return resolveRemoteConfig();
  }, [remoteApiKey]);

  const fallbackToRemoteAPI = async (messages: ChatCompletionMessageParam[], userApiKey?: string): Promise<ChatCompletion> => {
    // Zero-backend failover: browser calls the provider REST endpoint directly.
    // The key never leaves the user's machine except to the selected provider.
    const cfg: RemoteConfig | null = userApiKey
      ? { provider: 'gemini', apiKey: userApiKey, model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com' }
      : resolveRemoteConfigCb();
    if (!cfg?.apiKey) {
      throw new Error('Remote API key missing for fallback.');
    }
    const text = cfg.provider === 'gemini'
      ? await geminiChatCompletion(cfg, messages)
      : await openAIChatCompletion(cfg, messages);
    return toChatCompletion(text, cfg.model);
  };

  const generateResponse = useCallback(async (messages: ChatCompletionMessageParam[]) => {
    if (provider === 'remote-api') {
      return fallbackToRemoteAPI(messages, remoteApiKey);
    }

    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    resetIdleTimer();

    try {
      const reply = await engineRef.current.chat.completions.create({
        messages,
        stream: false
      });
      return reply;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : '';
      
      if (errorMessage.includes('out of memory') || errorName === 'OperationError') {
        console.error('Out of Memory during generation. Falling back.');
        await unloadEngine();
        setProvider('remote-api');
        return fallbackToRemoteAPI(messages, remoteApiKey);
      }
      throw err;
    } finally {
      resetIdleTimer();
    }
  }, [provider, remoteApiKey, resetIdleTimer, unloadEngine]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      unloadEngine();
    };
  }, [unloadEngine]);

  return {
    engine,
    provider,
    isLoading,
    progress,
    error,
    initEngine,
    generateResponse,
    unloadEngine
  };
}
