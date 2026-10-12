/**
 * Zero-backend remote provider layer (SPEC-010).
 * All calls are direct browser→provider fetches. Keys live in the user's
 * browser (localStorage) or `.env.local` (VITE_*); they are never committed,
 * never logged, and never proxied through any server.
 */
import type { ChatCompletionMessageParam, ChatCompletion } from '@mlc-ai/web-llm';

export type RemoteProviderId = 'gemini' | 'openrouter' | 'nvidia';

export interface RemoteConfig {
  provider: RemoteProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export const PROVIDER_DEFAULTS: Record<RemoteProviderId, { baseUrl: string; model: string; keyHint: string; label: string }> = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.0-flash',
    keyHint: 'AIzaSy...',
    label: 'Google Gemini',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'qwen/qwen-2.5-7b-instruct',
    keyHint: 'sk-or-v1-...',
    label: 'OpenRouter (OpenAI-compatible)',
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'qwen/qwen2.5-7b-instruct',
    keyHint: 'nvapi-...',
    label: 'NVIDIA NIM (OpenAI-compatible)',
  },
};

const LS = {
  provider: 'promote_it_remote_provider',
  geminiKey: 'promote_it_gemini_key',
  openrouterKey: 'promote_it_openrouter_key',
  nvidiaKey: 'promote_it_nvidia_key',
  model: 'promote_it_remote_model',
} as const;

function lsGet(k: string): string {
  try {
    return localStorage.getItem(k) || '';
  } catch {
    return '';
  }
}

function envGet(k: string): string {
  try {
    return (import.meta.env?.[k] as string | undefined) || '';
  } catch {
    return '';
  }
}

/** Resolution order per provider: localStorage → VITE_* env → built-in default model. */
export function resolveRemoteConfig(provider?: RemoteProviderId): RemoteConfig | null {
  const p: RemoteProviderId =
    provider || (lsGet(LS.provider) as RemoteProviderId) || 'gemini';
  if (p !== 'gemini' && p !== 'openrouter' && p !== 'nvidia') return null;
  const d = PROVIDER_DEFAULTS[p];
  const key =
    p === 'gemini'
      ? lsGet(LS.geminiKey) || envGet('VITE_GEMINI_API_KEY')
      : p === 'openrouter'
        ? lsGet(LS.openrouterKey) || envGet('VITE_OPENROUTER_API_KEY')
        : lsGet(LS.nvidiaKey) || envGet('VITE_NVIDIA_API_KEY');
  if (!key) return null;
  const model = lsGet(LS.model) || envGet(p === 'gemini' ? 'VITE_GEMINI_MODEL' : p === 'openrouter' ? 'VITE_OPENROUTER_MODEL' : 'VITE_NVIDIA_MODEL') || d.model;
  return { provider: p, apiKey: key, model, baseUrl: d.baseUrl };
}

export function persistRemoteConfig(cfg: { provider: RemoteProviderId; apiKey: string; model: string }): void {
  try {
    localStorage.setItem(LS.provider, cfg.provider);
    localStorage.setItem(LS.model, cfg.model);
    if (cfg.provider === 'gemini') localStorage.setItem(LS.geminiKey, cfg.apiKey);
    else if (cfg.provider === 'openrouter') localStorage.setItem(LS.openrouterKey, cfg.apiKey);
    else localStorage.setItem(LS.nvidiaKey, cfg.apiKey);
  } catch {
    // storage unavailable — caller reports honestly
    throw new Error('Could not persist provider config: browser storage is unavailable.');
  }
}

interface OAIContent { role: string; content: string }

function toOpenAIMessages(messages: ChatCompletionMessageParam[]): { system?: string; chat: OAIContent[] } {
  const system = messages
    .filter(m => m.role === 'system')
    .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join('\n');
  const chat = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));
  return { system: system || undefined, chat };
}

/** OpenAI-compatible chat call (OpenRouter, NVIDIA NIM, any /v1 base). */
export async function openAIChatCompletion(
  cfg: RemoteConfig,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const { system, chat } = toOpenAIMessages(messages);
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: system ? [{ role: 'system', content: system }, ...chat] : chat,
  };
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.provider === 'openrouter' && typeof window !== 'undefined'
        ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'promote-IT AV Studio' }
        : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Remote API fallback failed (HTTP ${res.status}).`);
  }
  const data = await res.json();
  const text: string =
    data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  return text;
}

/** Gemini REST call (kept provider-specific: systemInstruction + model roles). */
export async function geminiChatCompletion(
  cfg: RemoteConfig,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
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
    `${cfg.baseUrl}/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        contents,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Remote API fallback failed (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || ''
  );
}

/** Wraps raw provider text in a ChatCompletion-shaped reply. */
export function toChatCompletion(text: string, model: string): ChatCompletion {
  return {
    id: `remote-${Date.now()}`,
    choices: [{
      finish_reason: 'stop',
      index: 0,
      message: { role: 'assistant', content: text },
      logprobs: null,
    }],
    created: Date.now(),
    model,
    object: 'chat.completion',
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  } as unknown as ChatCompletion;
}

/** Real connectivity probe: no-cost model listing. Never logs the key. */
export async function testRemoteConnection(
  cfg: RemoteConfig,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const url =
      cfg.provider === 'gemini'
        ? `${cfg.baseUrl}/v1beta/models?key=${encodeURIComponent(cfg.apiKey)}`
        : `${cfg.baseUrl}/models`;
    const res = await fetch(url, {
      headers: cfg.provider === 'gemini' ? {} : { Authorization: `Bearer ${cfg.apiKey}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        detail:
          res.status === 401 || res.status === 403
            ? `Authentication rejected (HTTP ${res.status}) — check the key.`
            : `Probe failed (HTTP ${res.status}).`,
      };
    }
    return { ok: true, detail: `Connected to ${PROVIDER_DEFAULTS[cfg.provider].label}.` };
  } catch (err) {
    return { ok: false, detail: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
