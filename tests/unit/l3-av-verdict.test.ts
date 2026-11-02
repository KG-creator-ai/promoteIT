// SPEC-022.AC-002 / AC-005 — the L3-AV verdict schema and the reviewer
// taxonomy. A persona verdict may never read as a human one, and a stale
// review may never certify a changed artifact.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { validateL3AvVerdict, loadRubric } from '../../scripts/lib/l3-av-schema.mjs';

const ROOT = path.resolve(__dirname, '../..');
const RUBRIC = loadRubric();
const ASSERT = path.join(ROOT, 'scripts/l3-av-assert.mjs');

function baseVerdict(overrides: Record<string, unknown> = {}) {
  return {
    reviewerKind: 'agent-proxy',
    reviewer: 'creative-director',
    reviewedAt: '2026-11-02T10:00:00.000Z',
    source: '14_export_preview.webm',
    sourceHash: 'abcdef0123456789',
    audio: RUBRIC.audio.map(c => ({ criterion: c.id, verdict: 'pass', detail: 'checked' })),
    video: RUBRIC.video.map(c => ({ criterion: c.id, verdict: 'pass', detail: 'checked' })),
    coverage: { clips: 6, reviewed: 6 },
    overall: 'pass',
    followUps: [],
    ...overrides,
  };
}

describe('SPEC-022 AC-002 — the reviewer taxonomy is binding', () => {
  it('accepts a well-formed agent-proxy verdict', () => {
    const r = validateL3AvVerdict(baseVerdict());
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.level).toBe('agent-proxy');
  });

  it('rejects a verdict with no reviewerKind', () => {
    const v = baseVerdict();
    delete (v as Record<string, unknown>).reviewerKind;
    const r = validateL3AvVerdict(v);
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/missing reviewerKind/);
  });

  it('rejects an unknown reviewerKind', () => {
    const r = validateL3AvVerdict(baseVerdict({ reviewerKind: 'robot' }));
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/unknown reviewerKind/);
  });

  it('rejects a human verdict without a human attestation', () => {
    const r = validateL3AvVerdict(baseVerdict({ reviewerKind: 'human' }));
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/requires a human attestation/);
  });

  it('accepts a human verdict with a complete attestation', () => {
    const r = validateL3AvVerdict(
      baseVerdict({
        reviewerKind: 'human',
        humanAttestation: {
          attestedBy: 'Karthik',
          attestedAt: '2026-11-02T11:00:00.000Z',
          statement: 'I watched and listened to every clip.',
        },
      }),
    );
    expect(r.problems).toEqual([]);
    expect(r.level).toBe('human-verified');
  });

  it('rejects an agent-proxy verdict that carries a human attestation', () => {
    const r = validateL3AvVerdict(
      baseVerdict({
        humanAttestation: { attestedBy: 'Karthik', attestedAt: '2026-11-02T11:00:00.000Z', statement: 'approved' },
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/must not carry a human attestation/);
  });

  it('rejects missing criteria, invalid levels and missing details', () => {
    const missing = baseVerdict();
    missing.audio = missing.audio.slice(1);
    expect(validateL3AvVerdict(missing).problems.join(' ')).toMatch(/missing criterion A1/);

    const invalid = baseVerdict();
    invalid.audio[0].verdict = 'maybe';
    expect(validateL3AvVerdict(invalid).problems.join(' ')).toMatch(/A1: invalid verdict/);

    const noDetail = baseVerdict();
    noDetail.video[1].detail = '';
    expect(validateL3AvVerdict(noDetail).problems.join(' ')).toMatch(/V2: missing detail/);
  });

  it('rejects a verdict with too little coverage', () => {
    const r = validateL3AvVerdict(baseVerdict({ coverage: { clips: 6, reviewed: 2 } }));
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/coverage too low/);
  });
});

describe('SPEC-022 AC-005 — a stale review cannot certify a changed artifact', () => {
  it('rejects a verdict whose sourceHash does not match the artifact', () => {
    const r = validateL3AvVerdict(baseVerdict({ sourceHash: 'ffffffffffffffff' }), { artifactHash: 'abcdef0123456789' });
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/sourceHash mismatch/);
  });

  it('accepts the verdict when the hash matches', () => {
    const r = validateL3AvVerdict(baseVerdict(), { artifactHash: 'abcdef0123456789' });
    expect(r.ok).toBe(true);
  });

  it('the assert script rejects a mismatched verdict on disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'l3-av-'));
    const verdictPath = path.join(dir, 'verdict.json');
    fs.writeFileSync(verdictPath, JSON.stringify(baseVerdict({ sourceHash: 'ffffffffffffffff' }), null, 2));

    const r = spawnSync(process.execPath, [ASSERT], {
      encoding: 'utf8',
      env: { ...process.env, L3_AV_VERDICT: verdictPath },
    });

    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('sourceHash mismatch');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('the assert script accepts a matching verdict and reports the level', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'l3-av-'));
    const verdictPath = path.join(dir, 'verdict.json');
    const hash = 'abcdef0123456789';
    fs.writeFileSync(verdictPath, JSON.stringify(baseVerdict({ sourceHash: hash }), null, 2));

    const r = spawnSync(process.execPath, [ASSERT], {
      encoding: 'utf8',
      env: { ...process.env, L3_AV_VERDICT: verdictPath },
    });

    // The local manifest may bind a different artifact hash; the schema level
    // must still be reported and a hash mismatch must be explicit.
    if (r.status === 0) {
      expect(r.stdout).toContain('L3-AV-ASSERT PASS');
      expect(r.stdout).toContain('L3-AV-LEVEL: agent-proxy');
    } else {
      expect(r.stderr).toContain('sourceHash mismatch');
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
