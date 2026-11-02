// SPEC-022.AC-003 — the review-package generator: short clips, their audio, a
// rubric form, a verdict template and a hash manifest — all gitignored.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { loadRubric } from '../../scripts/lib/l3-av-schema.mjs';

const ROOT = path.resolve(__dirname, '../..');
const PACKAGE_DIR = path.join(ROOT, 'audit-artifacts/l3-av-package');
const GENERATOR = path.join(ROOT, 'scripts/l3-av-package.mjs');
const RUBRIC = loadRubric();

function ffmpegAvailable(): boolean {
  const local = path.join(os.homedir(), '.local/ffmpeg/ffmpeg');
  if (fs.existsSync(local)) return true;
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;
}

const hasFfmpeg = ffmpegAvailable();

beforeAll(() => {
  if (!hasFfmpeg) {
    console.warn('[l3-av-package] ffmpeg unavailable — the package assertions are skipped locally');
    return;
  }
  const r = spawnSync(process.execPath, [GENERATOR], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  expect(r.status, r.stderr).toBe(0);
});

afterAll(() => {
  /* the package is gitignored evidence — it stays on disk for the reviewer */
});

describe('SPEC-022 AC-003 — the review package', () => {
  it('emits the clips, their audio, a rubric form, a verdict template and a manifest', () => {
    if (!hasFfmpeg) return;
    expect(fs.existsSync(PACKAGE_DIR)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'manifest.json'), 'utf8'));
    expect(manifest.clips.length).toBeGreaterThan(0);
    for (const clip of manifest.clips) {
      expect(fs.existsSync(path.join(PACKAGE_DIR, clip.file))).toBe(true);
      expect(fs.existsSync(path.join(PACKAGE_DIR, clip.audio))).toBe(true);
      expect(clip.fileSha256).toHaveLength(16);
      expect(clip.audioSha256).toHaveLength(16);
    }

    expect(fs.existsSync(path.join(PACKAGE_DIR, 'rubric-form.md'))).toBe(true);
    expect(fs.existsSync(path.join(PACKAGE_DIR, 'verdict-template.json'))).toBe(true);
  });

  it('binds every packaged artifact to its hash', () => {
    if (!hasFfmpeg) return;
    const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'manifest.json'), 'utf8'));

    const check = (file: string, sha: string, bytes: number) => {
      const buf = fs.readFileSync(path.join(PACKAGE_DIR, file));
      expect(crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16)).toBe(sha);
      expect(buf.length).toBe(bytes);
    };
    for (const clip of manifest.clips) {
      check(clip.file, clip.fileSha256, clip.fileBytes);
      check(clip.audio, clip.audioSha256, clip.audioBytes);
    }
    for (const f of manifest.files) check(f.file, f.sha256, f.bytes);
  });

  it('carries the source hash and every criterion into the form and the template', () => {
    if (!hasFfmpeg) return;
    const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'manifest.json'), 'utf8'));
    const form = fs.readFileSync(path.join(PACKAGE_DIR, 'rubric-form.md'), 'utf8');
    const template = JSON.parse(fs.readFileSync(path.join(PACKAGE_DIR, 'verdict-template.json'), 'utf8'));

    expect(form).toContain(manifest.sourceHash);
    expect(template.sourceHash).toBe(manifest.sourceHash);
    for (const c of [...RUBRIC.audio, ...RUBRIC.video]) {
      expect(form).toContain(`**${c.id} ${c.title}**`);
      expect(template.audio.concat(template.video).some((e: any) => e.criterion === c.id)).toBe(true);
    }
  });

  it('keeps the package out of version control', () => {
    const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    expect(ignore).toMatch(/^audit-artifacts\/?$/m);
  });
});
