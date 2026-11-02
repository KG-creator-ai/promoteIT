// SPEC-024.AC-001 — a Content-Security-Policy that is compatible with the
// Vite build, the Web Workers and the blob/data URLs the app uses (D-005).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function cspContent(): string {
  const m = INDEX.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  expect(m, 'index.html must declare a Content-Security-Policy meta').toBeTruthy();
  return m![1];
}

function directive(name: string): string | null {
  const m = cspContent().match(new RegExp(`${name}\\s+([^;]+)`));
  return m ? m[1].trim() : null;
}

describe('SPEC-024 AC-001 — the Content-Security-Policy', () => {
  it('is declared in the document', () => {
    expect(INDEX).toContain('http-equiv="Content-Security-Policy"');
  });

  it('locks down the dangerous defaults', () => {
    expect(directive('default-src')).toContain("'self'");
    expect(directive('object-src')).toBe("'none'");
    expect(directive('base-uri')).toContain("'self'");
  });

  it('allows the app script and the WebLLM WASM runtime, and nothing inline', () => {
    const script = directive('script-src')!;
    expect(script).toContain("'self'");
    expect(script).toContain("'wasm-unsafe-eval'");
    expect(script).not.toMatch(/'unsafe-inline'/);
  });

  it('allows the Web Workers (module + blob)', () => {
    const worker = directive('worker-src')!;
    expect(worker).toContain("'self'");
    expect(worker).toContain('blob:');
  });

  it('allows the blob/data URLs the media path uses', () => {
    expect(directive('media-src')).toContain('blob:');
    expect(directive('media-src')).toContain('data:');
    expect(directive('img-src')).toContain('blob:');
    expect(directive('img-src')).toContain('data:');
  });

  it('allows inline styles (the app sets style attributes) and self-hosted fonts', () => {
    expect(directive('style-src')).toContain("'unsafe-inline'");
    const font = directive('font-src')!;
    expect(font).toContain("'self'");
    expect(font).not.toMatch(/https?:\/\//);
  });

  it('allows exactly the model/provider origins the app talks to', () => {
    const connect = directive('connect-src')!;
    expect(connect).toContain("'self'");
    expect(connect).toContain('https://generativelanguage.googleapis.com');
    expect(connect).toContain('https://openrouter.ai');
    expect(connect).toContain('https://integrate.api.nvidia.com');
    expect(connect).toContain('https://huggingface.co');
    // No wildcard origin.
    expect(connect).not.toContain('*');
  });

  it('the headless harness asserts the policy is present', () => {
    const harness = fs.readFileSync(path.join(ROOT, 'scripts/e2e-av.mjs'), 'utf8');
    expect(harness).toContain('csp-present');
    expect(harness).toContain('securitypolicyviolation');
  });
});
