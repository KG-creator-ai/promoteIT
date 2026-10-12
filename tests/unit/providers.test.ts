import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveRemoteConfig,
  openAIChatCompletion,
  geminiChatCompletion,
  toChatCompletion,
  testRemoteConnection,
  PROVIDER_DEFAULTS,
  type RemoteConfig,
} from '../../src/lib/providers';

const MSGS: any[] = [
  { role: 'system', content: 'You are a structurer.' },
  { role: 'user', content: 'Build a 2-act campaign.' },
];

function stubStorage(values: Record<string, string>) {
  const store = new Map(Object.entries(values));
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  } as any);
}

describe('resolveRemoteConfig', () => {
  // NOTE: vitest loads .env.local into import.meta.env, so tests sanitize it
  // to stay hermetic — and NEVER assert real key values (no secrets in output).
  const ENV = import.meta.env as any;
  const saved: Record<string, string | undefined> = {};
  for (const k of ['VITE_GEMINI_API_KEY', 'VITE_OPENROUTER_API_KEY', 'VITE_NVIDIA_API_KEY', 'VITE_OPENROUTER_MODEL', 'VITE_NVIDIA_MODEL', 'VITE_GEMINI_MODEL']) {
    saved[k] = ENV[k];
    delete ENV[k];
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no key is configured', () => {
    stubStorage({});
    expect(resolveRemoteConfig('openrouter')).toBeNull();
  });

  it('resolves openrouter config with default model', () => {
    stubStorage({ promote_it_openrouter_key: 'sk-test', promote_it_remote_provider: 'openrouter' });
    const cfg = resolveRemoteConfig();
    expect(cfg?.provider).toBe('openrouter');
    expect(cfg?.model).toBe(PROVIDER_DEFAULTS.openrouter.model);
    expect(cfg?.baseUrl).toContain('openrouter.ai');
    expect(cfg?.apiKey).toBe('sk-test');
  });

  it('falls back to VITE_ env keys when storage is empty', () => {
    stubStorage({});
    ENV.VITE_NVIDIA_API_KEY = 'nv-env-test';
    const cfg = resolveRemoteConfig('nvidia');
    expect(cfg?.provider).toBe('nvidia');
    expect(cfg?.apiKey).toBe('nv-env-test');
    delete ENV.VITE_NVIDIA_API_KEY;
  });

  it('rejects unknown provider ids', () => {
    stubStorage({ promote_it_remote_provider: 'mystery' });
    expect(resolveRemoteConfig()).toBeNull();
  });
});

describe('openAIChatCompletion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cfg: RemoteConfig = { provider: 'openrouter', apiKey: 'sk-test', model: 'qwen/qwen-2.5-7b-instruct', baseUrl: 'https://openrouter.ai/api/v1' };

  it('posts to /chat/completions with bearer auth and returns text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"avScript":[]}' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const text = await openAIChatCompletion(cfg, MSGS);
    expect(text).toBe('{"avScript":[]}');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((init.headers as any).Authorization).toBe('Bearer sk-test');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('qwen/qwen-2.5-7b-instruct');
    expect(body.messages[0].role).toBe('system');
  });

  it('throws on HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(openAIChatCompletion(cfg, MSGS)).rejects.toThrow(/HTTP 401/);
  });
});

describe('geminiChatCompletion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps candidates to text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'hello' }] } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const text = await geminiChatCompletion(
      { provider: 'gemini', apiKey: 'k', model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com' },
      MSGS,
    );
    expect(text).toBe('hello');
    expect(fetchMock.mock.calls[0][0]).toContain(':generateContent');
  });
});

describe('toChatCompletion', () => {
  it('wraps text in ChatCompletion shape', () => {
    const c = toChatCompletion('x', 'm');
    expect(c.choices[0].message.content).toBe('x');
    expect(c.model).toBe('m');
  });
});

describe('testRemoteConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const cfg: RemoteConfig = { provider: 'nvidia', apiKey: 'nv-test', model: 'qwen/qwen2.5-7b-instruct', baseUrl: 'https://integrate.api.nvidia.com/v1' };

  it('reports ok on 200 models listing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const r = await testRemoteConnection(cfg);
    expect(r.ok).toBe(true);
  });

  it('reports auth rejection honestly on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const r = await testRemoteConnection(cfg);
    expect(r.ok).toBe(false);
    expect(r.detail).toMatch(/Authentication rejected/);
  });

  it('reports network errors honestly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    const r = await testRemoteConnection(cfg);
    expect(r.ok).toBe(false);
    expect(r.detail).toMatch(/Network error/);
  });
});
