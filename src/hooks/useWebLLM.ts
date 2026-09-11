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

  const fallbackToRemoteAPI = async (messages: ChatCompletionMessageParam[], userApiKey?: string): Promise<ChatCompletion> => {
    // This is a stub for calling Gemini API or OpenRouter
    if (!userApiKey) {
      throw new Error('Remote API key missing for fallback.');
    }
    // E.g., make fetch call to remote API here
    return {
      id: 'mock-id',
      choices: [{ 
        finish_reason: 'stop',
        index: 0,
        message: { role: 'assistant', content: 'This is a mocked remote API fallback response.' },
        logprobs: null
      }],
      created: Date.now(),
      model: 'remote-fallback',
      object: 'chat.completion',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    } as any;
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
