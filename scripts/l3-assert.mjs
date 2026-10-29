// l3-assert.mjs — validates the L3 vision verdict (SPEC-016.AC-002).
// Local (frames present): full schema + coverage + hash check; overall!=pass ⇒ fail.
// CI (no artifacts): exit 0 with L3-VERDICT-ABSENT marker (D11 pattern).
// Never fabricates a review — absence locally after extraction is a FAIL.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'audit-artifacts');
const framesDir = path.join(artifacts, 'l3-frames');
const verdictPath = path.join(artifacts, 'l3-verdict.json');
const problems = [];

if (!fs.existsSync(framesDir)) {
  console.log('L3-VERDICT-ABSENT — no l3-frames/ (D11: artifacts not present in this environment)');
  process.exit(0);
}
if (!fs.existsSync(verdictPath)) { console.log('L3-ASSERT FAIL — frames extracted but audit-artifacts/l3-verdict.json missing (run the vision review)'); process.exit(1); }

const meta = JSON.parse(fs.readFileSync(path.join(framesDir, 'meta.json'), 'utf8'));
const v = JSON.parse(fs.readFileSync(verdictPath, 'utf8'));

if (!v.reviewer) problems.push('missing reviewer');
if (!v.reviewedAt || Number.isNaN(Date.parse(v.reviewedAt))) problems.push('missing/invalid reviewedAt');
if (v.source !== meta.source) problems.push(`source mismatch: verdict=${v.source} vs meta=${meta.source}`);

const webm = path.join(artifacts, meta.source);
if (fs.existsSync(webm)) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(webm)).digest('hex').slice(0, 16);
  if (v.sourceHash !== hash) problems.push(`sourceHash mismatch: ${v.sourceHash} != ${hash} (artifact changed since review)`);
}

// frame coverage ≥75% of extracted frames
const frameFiles = meta.frames.map(f => f.name);
const reviewed = new Set((v.frames || []).map(f => f.name));
const missing = frameFiles.filter(n => !reviewed.has(n));
if (frameFiles.length && missing.length / frameFiles.length > 0.25) problems.push(`frame coverage too low: ${frameFiles.length - missing.length}/${frameFiles.length} (${missing.join(',')})`);

// per-frame checks F1–F3 with notes
for (const f of v.frames || []) {
  if (!f.notes) problems.push(`${f.name}: missing notes`);
  for (const k of ['F1', 'F2', 'F3']) {
    if (!['pass', 'fail', 'note'].includes(f.checks?.[k])) problems.push(`${f.name}: ${k} missing/invalid`);
  }
}
// screenshots present in artifacts must be reviewed
const shots = fs.existsSync(artifacts) ? fs.readdirSync(artifacts).filter(f => f.endsWith('.png')) : [];
for (const s of shots) {
  const entry = (v.screenshots || []).find(x => x.name === s);
  if (!entry) problems.push(`screenshot not reviewed: ${s}`);
  else if (entry.checks?.[shots.length ? Object.keys(entry.checks)[0] : ''] === undefined) problems.push(`${s}: no checks`);
}
// honest-status trio
for (const k of ['H1', 'H2', 'H3']) {
  if (!['pass', 'fail', 'note'].includes(v.honestStatus?.[k])) problems.push(`honestStatus.${k} missing/invalid`);
}
if (v.overall !== 'pass') problems.push(`overall verdict is '${v.overall}' — L3 did not pass`);

if (problems.length) {
  console.log(`L3-ASSERT FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log(`L3-ASSERT PASS — reviewer=${v.reviewer}, frames=${(v.frames || []).length}/${frameFiles.length}, screenshots=${(v.screenshots || []).length}, followUps=${(v.followUps || []).length}`);
