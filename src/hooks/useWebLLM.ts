import { useState, useRef, useCallback, useEffect } from 'react';
import { CreateMLCEngine, MLCEngine, InitProgressReport, ChatCompletionMessageParam, ChatCompletion } from '@mlc-ai/web-llm';

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

  const initEngine = useCallback(async (modelId: string = 'Llama-3.1-8B-Instruct-q4f32_1-MLC') => {
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

  const resolveRemoteKey = useCallback(() => {
    if (remoteApiKey) return remoteApiKey;
    try {
      const stored = localStorage.getItem('promote_it_gemini_key');
      if (stored) return stored;
    } catch {
      // storage unavailable — fall through to env
    }
    return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
  }, [remoteApiKey]);

  const fallbackToRemoteAPI = async (messages: ChatCompletionMessageParam[], userApiKey?: string): Promise<ChatCompletion> => {
    // Zero-backend failover: browser calls the Gemini REST endpoint directly.
    // The key never leaves the user's machine except to Google's API.
    const key = userApiKey || resolveRemoteKey();
    if (!key) {
      throw new Error('Remote API key missing for fallback.');
    }
    const systemText = messages
      .filter(m => m.role === 'system')
      .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('\n');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
      }));
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
          contents,
        }),
      }
    );
    if (!res.ok) {
      throw new Error(`Remote API fallback failed (HTTP ${res.status}).`);
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
    return {
      id: 'gemini-fallback',
      choices: [{
        finish_reason: 'stop',
        index: 0,
        message: { role: 'assistant', content: text },
        logprobs: null
      }],
      created: Date.now(),
      model: 'gemini-2.0-flash',
      object: 'chat.completion',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    } as unknown as ChatCompletion;
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
