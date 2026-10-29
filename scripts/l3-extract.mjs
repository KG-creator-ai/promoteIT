// l3-extract.mjs — vision-L3 frame extraction (SPEC-016.AC-001).
// Picks evenly-spaced frames from export .webm artifacts so agent vision (or a
// human) reviews a deterministic frame set instead of scrubbing a player.
// CI-safe (D11): no artifacts ⇒ exit 0 + L3-ARTIFACTS-ABSENT marker.
// Artifacts present but ffmpeg missing ⇒ exit 1 (silent skip = fake review).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'audit-artifacts');
const outDir = path.join(artifacts, 'l3-frames');
const FRAMES = 8;

const webs = fs.existsSync(artifacts) ? fs.readdirSync(artifacts).filter(f => f.endsWith('.webm')) : [];
if (webs.length === 0) {
  console.log('L3-ARTIFACTS-ABSENT — no .webm in audit-artifacts/ (D11: exit 0 without artifacts)');
  process.exit(0);
}

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG,
    path.join(process.env.HOME || '', '.local/ffmpeg/ffmpeg'),
    'ffmpeg',
  ].filter(Boolean);
  for (const c of candidates) {
    try { execFileSync(c, ['-version'], { stdio: 'pipe', timeout: 10000 }); return c; } catch { /* next */ }
  }
  return null;
}

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.log('L3-EXTRACT FAIL — artifacts present but ffmpeg not found (set FFMPEG= or install ffmpeg)');
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const src = path.join(artifacts, webs[0]);
const probe = execFileSync(
  ffmpeg.replace(/ffmpeg$/, 'ffprobe') === ffmpeg ? ffmpeg : ffmpeg.replace(/ffmpeg$/, 'ffprobe'),
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', src],
  { encoding: 'utf8', timeout: 60000 },
).trim();
const duration = Number(probe);
if (!Number.isFinite(duration) || duration <= 0) {
  console.log(`L3-EXTRACT FAIL — could not probe duration of ${webs[0]} (got: ${probe})`);
  process.exit(1);
}

const frames = [];
for (let i = 0; i < FRAMES; i++) {
  // sample mid-segment points, avoid the very first/last sliver
  const t = ((i + 0.5) * duration) / FRAMES;
  const name = `frame-${String(i).padStart(2, '0')}.jpg`;
  execFileSync(ffmpeg, [
    '-y', '-ss', t.toFixed(3), '-i', src,
    '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3',
    path.join(outDir, name),
  ], { stdio: 'pipe', timeout: 120000 });
  frames.push({ name, at: Number(t.toFixed(3)) });
}

const meta = { source: webs[0], duration: Number(duration.toFixed(3)), frames, extractedAt: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
console.log(`L3-EXTRACT OK — ${frames.length} frames from ${webs[0]} (${duration.toFixed(1)}s) → audit-artifacts/l3-frames/`);
