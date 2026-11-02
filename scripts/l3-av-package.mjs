#!/usr/bin/env node
/**
 * l3-av-package.mjs — builds the L3-AV review package (SPEC-022.AC-003).
 *
 * The owner (or a persona) should be able to judge the AV output in minutes:
 * short clips, their audio as separate files, a rubric form to fill, a verdict
 * template, and a manifest binding every artifact to a hash.
 *
 * CI-safe (D11): no artifact -> exit 0 with the L3-AV-PACKAGE-ABSENT marker.
 * Artifacts present but ffmpeg missing -> exit 1 (a silent skip would be a
 * fake review). Everything lands in the gitignored audit-artifacts/ tree.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadRubric } from './lib/l3-av-schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'audit-artifacts');
const outDir = path.join(artifacts, 'l3-av-package');
const CLIP_COUNT = 6;
const CLIP_SECONDS = 8;

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG,
    path.join(process.env.HOME || '', '.local/ffmpeg/ffmpeg'),
    'ffmpeg',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      execFileSync(c, ['-version'], { stdio: 'pipe', timeout: 10000 });
      return c;
    } catch {
      /* next */
    }
  }
  return null;
}

function findFfprobe(ffmpeg) {
  const candidates = [
    process.env.FFPROBE,
    ffmpeg ? ffmpeg.replace(/ffmpeg$/, 'ffprobe') : null,
    path.join(process.env.HOME || '', '.local/ffmpeg/ffprobe'),
    'ffprobe',
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      execFileSync(c, ['-version'], { stdio: 'pipe', timeout: 10000 });
      return c;
    } catch {
      /* next */
    }
  }
  return null;
}

const webs = fs.existsSync(artifacts) ? fs.readdirSync(artifacts).filter(f => f.endsWith('.webm')) : [];
if (webs.length === 0) {
  console.log('L3-AV-PACKAGE-ABSENT — no .webm in audit-artifacts/ (D11: exit 0 without artifacts)');
  process.exit(0);
}

const ffmpeg = findFfmpeg();
const ffprobe = findFfprobe(ffmpeg);
if (!ffmpeg || !ffprobe) {
  console.error('L3-AV-PACKAGE FAIL — artifacts present but ffmpeg/ffprobe not found (set FFMPEG= or install ffmpeg)');
  process.exit(1);
}

const sourceName = webs.sort((a, b) => fs.statSync(path.join(artifacts, b)).mtimeMs - fs.statSync(path.join(artifacts, a)).mtimeMs)[0];
const source = path.join(artifacts, sourceName);
const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0, 16);
const duration = Number(
  execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', source], {
    encoding: 'utf8',
    timeout: 60000,
  }).trim(),
);
if (!Number.isFinite(duration) || duration <= 0) {
  console.error(`L3-AV-PACKAGE FAIL — could not read the duration of ${sourceName}`);
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const rubric = loadRubric();
const clips = [];
const step = Math.max(0, (duration - CLIP_SECONDS) / Math.max(1, CLIP_COUNT - 1));

for (let i = 0; i < CLIP_COUNT; i++) {
  const start = Math.min(Math.max(0, duration - CLIP_SECONDS), Number((i * step).toFixed(3)));
  const name = `clip-${String(i + 1).padStart(2, '0')}`;
  const clipPath = path.join(outDir, `${name}.webm`);
  const audioPath = path.join(outDir, `${name}.wav`);
  execFileSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-ss', String(start), '-t', String(CLIP_SECONDS), '-i', source, '-c', 'copy', clipPath],
    { stdio: 'pipe', timeout: 120000 },
  );
  execFileSync(
    ffmpeg,
    ['-hide_banner', '-loglevel', 'error', '-ss', String(start), '-t', String(CLIP_SECONDS), '-i', source, '-vn', '-ac', '1', '-ar', '48000', audioPath],
    { stdio: 'pipe', timeout: 120000 },
  );
  clips.push({
    name,
    file: `${name}.webm`,
    audio: `${name}.wav`,
    startSec: start,
    durationSec: CLIP_SECONDS,
  });
}

const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(outDir, f))).digest('hex').slice(0, 16);
const bytes = f => fs.statSync(path.join(outDir, f)).size;

const form = [
  `# L3-AV review form — ${sourceName}`,
  '',
  `Source artifact sha256 prefix: \`${sourceHash}\``,
  '',
  'For every clip, watch it and listen to its audio, then mark each criterion.',
  'A verdict without a `detail` is not a verdict.',
  '',
  ...rubric.audio.map(c => `- **${c.id} ${c.title}** — ${c.passCriterion}`),
  '',
  ...rubric.video.map(c => `- **${c.id} ${c.title}** — ${c.passCriterion}`),
  '',
  '## Clip sheet',
  '',
  '| clip | start | audio | notes |',
  '| --- | --- | --- | --- |',
  ...clips.map(c => `| ${c.name} | ${c.startSec}s | ${c.audio} |  |`),
  '',
  '## Per-criterion verdicts',
  '',
  '| criterion | verdict (pass/fail/note) | detail |',
  '| --- | --- | --- |',
  ...[...rubric.audio, ...rubric.video].map(c => `| ${c.id} |  |  |`),
  '',
  `Coverage rule: at least ${Math.round((rubric.coverageRule.minimumRatio || 0.75) * 100)}% of the clips must be reviewed.`,
  '',
].join('\n');
fs.writeFileSync(path.join(outDir, 'rubric-form.md'), form);

const verdictTemplate = {
  reviewerKind: 'human',
  reviewer: '',
  reviewedAt: '',
  source: sourceName,
  sourceHash,
  machineFacts: { verdict: '', reasons: [] },
  audio: rubric.audio.map(c => ({ criterion: c.id, verdict: '', detail: '' })),
  video: rubric.video.map(c => ({ criterion: c.id, verdict: '', detail: '' })),
  coverage: { clips: clips.length, reviewed: 0 },
  humanAttestation: { attestedBy: '', attestedAt: '', statement: '' },
  overall: '',
  followUps: [],
};
fs.writeFileSync(path.join(outDir, 'verdict-template.json'), JSON.stringify(verdictTemplate, null, 2) + '\n');

const manifest = {
  generatedBy: 'scripts/l3-av-package.mjs',
  source: sourceName,
  sourceHash,
  sourceDurationSec: Number(duration.toFixed(3)),
  clips: clips.map(c => ({
    ...c,
    fileSha256: sha(c.file),
    fileBytes: bytes(c.file),
    audioSha256: sha(c.audio),
    audioBytes: bytes(c.audio),
  })),
  rubricVersion: rubric.version,
  rubricId: rubric.id,
  files: [
    { file: 'rubric-form.md', sha256: sha('rubric-form.md'), bytes: bytes('rubric-form.md') },
    { file: 'verdict-template.json', sha256: sha('verdict-template.json'), bytes: bytes('verdict-template.json') },
  ],
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`L3-AV-PACKAGE READY — ${clips.length} clips + audio, rubric form, verdict template, manifest`);
console.log(`L3-AV-PACKAGE DIR: ${path.relative(root, outDir)}`);
process.exit(0);
