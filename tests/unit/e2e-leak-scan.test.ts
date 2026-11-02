// SPEC-024.AC-003 — the headless harness scans console/page output for
// key-shaped strings and fails the leg, never printing the value (D-007).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { scanForLeaks, redactLeaks, LEAK_PATTERNS } from '../../scripts/lib/leak-scan.mjs';

const ROOT = path.resolve(__dirname, '../..');

// The fixtures are assembled at runtime: a key-shaped literal must never be
// committed (the release secret-scan would flag it).
const GH = 'ghp_' + 'a'.repeat(30);
const GOOGLE = 'AIza' + 'b'.repeat(30);
const OPENAI = 'sk-' + 'c'.repeat(24);
const BEARER = 'Bearer ' + 'eyJ' + 'd'.repeat(10) + '.' + 'e'.repeat(10) + '.' + 'f'.repeat(8);

describe('SPEC-024 AC-003 — the console leak scanner', () => {
  it('detects key-shaped strings', () => {
    const samples = [
      `Authorization: ${GH}`,
      `key=${GOOGLE}`,
      `using ${OPENAI}`,
      BEARER,
    ];
    for (const s of samples) {
      const result = scanForLeaks(s);
      expect(result.clean, `expected a hit in: ${s.slice(0, 12)}…`).toBe(false);
      expect(result.total).toBeGreaterThan(0);
    }
  });

  it('never reports the matched value', () => {
    const secret = GH;
    const result = scanForLeaks(`leaked ${secret}`);
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain(secret);
    expect(result.hits[0].id).toBe('github-token');
    expect(result.hits[0].count).toBe(1);
  });

  it('redacts a secret before the text is printed or stored', () => {
    const secret = GH;
    const redacted = redactLeaks(`leaked ${secret} in a console line`);
    expect(redacted).not.toContain(secret);
    expect(redacted).toContain('[REDACTED]');
  });

  it('passes clean output through', () => {
    const result = scanForLeaks(['rendered 6 scenes', 'clock advanced to 00:10', 'no errors']);
    expect(result.clean).toBe(true);
    expect(result.hits).toEqual([]);
  });

  it('covers the key shapes the threat model names', () => {
    const ids = LEAK_PATTERNS.map(p => p.id);
    for (const id of ['github-token', 'google-api-key', 'openai-style-key', 'bearer-token']) {
      expect(ids).toContain(id);
    }
  });

  it('the harness scans the captured output and fails the leg', () => {
    const harness = fs.readFileSync(path.join(ROOT, 'scripts/e2e-av.mjs'), 'utf8');
    expect(harness).toContain('scanForLeaks');
    expect(harness).toContain('secret-leak-scan');
    expect(harness).toContain('redactLeaks');
    // The leg result must never carry the matched value.
    expect(harness).toContain('values redacted');
  });
});
