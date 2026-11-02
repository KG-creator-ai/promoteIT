#!/usr/bin/env node
/**
 * l3-av-assert.mjs — validates the L3-AV verdict (SPEC-022.AC-002 / AC-005).
 *
 * Local (verdict present): full schema + taxonomy + coverage + hash binding.
 * CI (no artifacts): exit 0 with the L3-AV-VERDICT-ABSENT marker (D11).
 * Never fabricates a review — absence locally after extraction is a FAIL.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { validateL3AvVerdict, achievedReviewLevel, loadRubric } from './lib/l3-av-schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'audit-artifacts');
const verdictPath = process.env.L3_AV_VERDICT || path.join(artifacts, 'l3-av-verdict.json');
const packageDir = path.join(artifacts, 'l3-av-package');

if (!fs.existsSync(verdictPath)) {
  console.log('L3-AV-VERDICT-ABSENT — no l3-av-verdict.json (D11: artifacts not present in this environment)');
  console.log(`L3-AV-LEVEL: ${achievedReviewLevel(verdictPath, artifacts)}`);
  process.exit(0);
}

const verdict = JSON.parse(fs.readFileSync(verdictPath, 'utf8'));
const rubric = loadRubric();

let artifactHash = null;
let expectedClips = null;
const manifestPath = path.join(packageDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  artifactHash = manifest.sourceHash || null;
  expectedClips = Array.isArray(manifest.clips) ? manifest.clips.length : null;
}
if (!artifactHash && verdict.source) {
  const src = path.join(artifacts, verdict.source);
  if (fs.existsSync(src)) {
    artifactHash = crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex').slice(0, 16);
  }
}

const { ok, problems, level } = validateL3AvVerdict(verdict, { artifactHash, expectedClips, rubric });

if (!ok) {
  console.error('L3-AV-ASSERT FAIL — verdict rejected:');
  for (const p of problems) console.error(` - ${p}`);
  console.error(`L3-AV-LEVEL: ${level}`);
  process.exit(1);
}

if (verdict.overall !== 'pass') {
  console.error(`L3-AV-ASSERT FAIL — overall verdict is '${verdict.overall}' — L3-AV did not pass`);
  console.error(`L3-AV-LEVEL: ${level}`);
  process.exit(1);
}

console.log(`L3-AV-ASSERT PASS — ${rubric.audio.length} audio + ${rubric.video.length} video criteria, reviewerKind=${verdict.reviewerKind}`);
console.log(`L3-AV-LEVEL: ${level}`);
process.exit(0);
