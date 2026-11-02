// SPEC-021.AC-001 / AC-003 / AC-004 — the AV facts analyser.
//
//   AC-001: a machine-readable facts JSON (streams, audio levels, drift,
//           black/freeze frames) bound to the artifact's sha256 prefix.
//   AC-003: CI-safe — no artifact -> AV-ARTIFACTS-ABSENT + exit 0; an
//           artifact but no ffmpeg -> loud failure with a non-zero exit.
//   AC-004: a synthetic artifact with a silent audio track and a truncated
//           video track is REJECTED by the facts check.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(__dirname, '../..');
const CLI = path.join(ROOT, 'scripts/av-analyze.mjs');

function resolveFfmpeg(): string | null {
  const fromEnv = process.env.AV_ANALYZE_FFMPEG;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const local = path.join(os.homedir(), '.local', 'ffmpeg', 'ffmpeg');
  if (fs.existsSync(local)) return local;
  const which = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return which.status === 0 ? 'ffmpeg' : null;
}

function runCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    maxBuffer: 64 * 1024 * 1024,
  });
}

let tmpDir: string;
let synthetic: string | null = null;
const ffmpeg = resolveFfmpeg();

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'av-analyze-'));
  if (ffmpeg) {
    // Silent audio track (anullsrc) + a short picture track: the exact
    // artifact shape the facts check must reject.
    synthetic = path.join(tmpDir, 'synthetic-silent.webm');
    const gen = spawnSync(
      ffmpeg,
      [
        '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=30:duration=2',
        '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono:duration=4',
        '-c:v', 'libvpx-vp9', '-b:v', '150k', '-c:a', 'libopus',
        synthetic,
      ],
      { encoding: 'utf8' },
    );
    if (gen.status !== 0) synthetic = null;
  }
});

afterAll(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('SPEC-021 AC-003 — the analyser is CI-safe', () => {
  it('prints AV-ARTIFACTS-ABSENT and exits 0 when there is no artifact', () => {
    const r = runCli([path.join(tmpDir, 'does-not-exist.webm')]);

    expect(r.status).toBe(0);
    expect(r.stdout).toContain('AV-ARTIFACTS-ABSENT');
    expect(r.stderr).not.toContain('AV-ANALYZE-TOOL-MISSING');
  });

  it('fails loudly with a non-zero exit when an artifact exists but ffmpeg is missing', () => {
    const artifact = path.join(tmpDir, 'present-but-unanalysable.webm');
    fs.writeFileSync(artifact, Buffer.from('not-a-real-webm'));

    const r = runCli([artifact], {
      AV_ANALYZE_FFMPEG: path.join(tmpDir, 'no-such-ffmpeg'),
      AV_ANALYZE_FFPROBE: path.join(tmpDir, 'no-such-ffprobe'),
    });

    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain('AV-ANALYZE-TOOL-MISSING');
    expect(r.stdout).not.toContain('AV-FACTS-VERDICT');
  });
});

describe('SPEC-021 AC-001 — the facts JSON', () => {
  it('reports streams, audio levels, drift and picture events bound to the artifact hash', () => {
    if (!synthetic) {
      console.warn('[av-analyze] ffmpeg unavailable — the facts assertions are skipped locally');
      return;
    }

    const before = crypto.createHash('sha256').update(fs.readFileSync(synthetic)).digest('hex');
    const r = runCli([synthetic, '--json']);

    expect(r.status).toBe(0);
    const facts = JSON.parse(r.stdout);

    // The facts are bound to the artifact's sha256 prefix.
    expect(facts.artifact.sha256).toBe(before.slice(0, 16));
    expect(facts.artifact.bytes).toBe(fs.statSync(synthetic).size);

    // Per-stream facts.
    expect(facts.streams.video.codec).toBeTruthy();
    expect(facts.streams.video.durationSec).toBeGreaterThan(0);
    expect(facts.streams.video.width).toBe(320);
    expect(facts.streams.video.height).toBe(240);
    expect(facts.streams.video.fps).toBeGreaterThan(0);
    expect(facts.streams.audio.codec).toBeTruthy();
    expect(facts.streams.audio.channels).toBe(1);
    expect(facts.streams.audio.sampleRate).toBe(48000);

    // Audio levels.
    expect(typeof facts.audio.peak).toBe('number');
    expect(typeof facts.audio.rms).toBe('number');
    expect(typeof facts.audio.silenceRatio).toBe('number');
    expect(typeof facts.audio.clippingRatio).toBe('number');
    expect(facts.audio.durationSec).toBeGreaterThan(0);

    // A/V drift with a one-frame tolerance.
    expect(facts.av.driftSec).toBeGreaterThanOrEqual(0);
    expect(facts.av.toleranceSec).toBeCloseTo(1 / 30, 5);

    // Picture events.
    expect(typeof facts.video.blackFrameCount).toBe('number');
    expect(typeof facts.video.freezeFrameCount).toBe('number');

    // The analyser must never modify the artifact.
    const after = crypto.createHash('sha256').update(fs.readFileSync(synthetic)).digest('hex');
    expect(after).toBe(before);
  });

  it('writes the facts to a file with --out', () => {
    if (!synthetic) return;
    const out = path.join(tmpDir, 'facts.json');
    const r = runCli([synthetic, '--out', out]);

    expect(r.status).toBe(0);
    const facts = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(facts.artifact.sha256).toHaveLength(16);
  });
});

describe('SPEC-021 AC-004 — the facts check rejects a broken artifact', () => {
  it('rejects a silent-audio artifact — no false "audible, in sync" verdict', () => {
    if (!synthetic) {
      console.warn('[av-analyze] ffmpeg unavailable — the rejection assertions are skipped locally');
      return;
    }

    const r = runCli([synthetic, '--json']);
    expect(r.status).toBe(0);
    const facts = JSON.parse(r.stdout);

    // The audio track really is silent.
    expect(facts.audio.peak).toBeLessThan(0.01);
    expect(facts.audio.silenceRatio).toBeGreaterThan(0.9);

    // And the verdict says so.
    expect(facts.verdict.pass).toBe(false);
    expect(facts.verdict.reasons.join(' ')).toMatch(/silence/i);
    expect(r.stderr).toContain('AV-FACTS-VERDICT: FAIL');
  });

  it('exits non-zero with --assert when the facts check fails', () => {
    if (!synthetic) return;
    const r = runCli([synthetic, '--assert']);
    expect(r.status).not.toBe(0);
  });
});
