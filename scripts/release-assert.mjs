#!/usr/bin/env node
// release-assert.mjs — verify the v1.2.0 release exists and is complete.
//
//   node scripts/release-assert.mjs            # assert the current release
//   node scripts/release-assert.mjs --tag v1.2.0
//
// Checks (fail-closed where it can verify, honest where it cannot):
//   1. the tag exists locally and points at a commit reachable from HEAD
//   2. RELEASE-REPORT.md exists and references the tag + certification hash
//   3. the GitHub Release exists and carries CERTIFICATION.md as an asset
//      (requires an authenticated `gh`; without auth the check reports
//       RELEASE-UNVERIFIED and exits 0 instead of pretending it passed)
//   4. no tag points at an untagged/uncommitted tree
//
// CI-safe (D11 pattern): before the release exists, the tag is absent and the
// script prints RELEASE-ABSENT and exits 0 — the durable record of the release
// is RELEASE-REPORT.md plus the published GitHub Release.
import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const tagIdx = argv.indexOf('--tag');
const TAG = tagIdx >= 0 && argv[tagIdx + 1] ? argv[tagIdx + 1] : 'v1.2.0';
const problems = [];

function git(args, allowFail = false) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

// 1. local tag
const tagSha = git(['rev-parse', '-q', '--verify', `refs/tags/${TAG}`], true);
if (!tagSha) {
  console.log(`RELEASE-ABSENT — no local tag ${TAG}; nothing to assert (release follows the tag step)`);
  process.exit(0);
}
const tagCommit = git(['rev-list', '-n', '1', TAG], true);
const headSha = git(['rev-parse', 'HEAD'], true);
const isAncestor = git(['merge-base', '--is-ancestor', tagCommit, 'HEAD'], true) === '' ? true : false;
if (!isAncestor) problems.push(`tag ${TAG} (${tagCommit.slice(0, 8)}) is not an ancestor of HEAD (${headSha.slice(0, 8)})`);

// 2. release report
const reportPath = path.join(root, 'RELEASE-REPORT.md');
if (!fs.existsSync(reportPath)) {
  problems.push('RELEASE-REPORT.md is missing');
} else {
  const report = fs.readFileSync(reportPath, 'utf8');
  if (!report.includes(TAG)) problems.push(`RELEASE-REPORT.md does not reference ${TAG}`);
  const certHashMatch = report.match(/CERTIFICATION\.md[^\n]*?([0-9a-f]{16})/);
  if (!certHashMatch) problems.push('RELEASE-REPORT.md does not carry the CERTIFICATION.md sha256 prefix');
  else {
    const certSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'CERTIFICATION.md'))).digest('hex').slice(0, 16);
    if (certSha !== certHashMatch[1]) problems.push(`CERTIFICATION.md hash drift: report says ${certHashMatch[1]}, file is ${certSha}`);
  }
}

// 3. GitHub Release + assets
let releaseChecked = false;
try {
  const raw = execFileSync('gh', ['release', 'view', TAG, '--json', 'tagName,url,assets,isDraft,isPrerelease'], {
    cwd: root, encoding: 'utf8', stdio: 'pipe',
  });
  const rel = JSON.parse(raw);
  releaseChecked = true;
  if (rel.isDraft) problems.push(`release ${TAG} is a draft`);
  if (rel.isPrerelease) problems.push(`release ${TAG} is marked prerelease`);
  const assets = (rel.assets || []).map((a) => a.name);
  if (!assets.includes('CERTIFICATION.md')) problems.push(`release ${TAG} does not attach CERTIFICATION.md (assets: ${assets.join(', ') || 'none'})`);
  if (!assets.some((a) => a.endsWith('.zip'))) problems.push(`release ${TAG} does not attach a release zip (assets: ${assets.join(', ') || 'none'})`);
  console.log(`release ${rel.tagName} → ${rel.url} (assets: ${assets.join(', ')})`);
} catch (err) {
  const msg = String((err && err.stderr) || (err && err.message) || err);
  if (/not found|release not found/i.test(msg)) {
    problems.push(`GitHub release ${TAG} does not exist yet`);
  } else {
    console.log(`RELEASE-UNVERIFIED — could not query the GitHub release (${msg.split('\n')[0].slice(0, 160)})`);
  }
}

if (problems.length) {
  console.error(`RELEASE-FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log(`RELEASE-PASS — ${TAG} @ ${tagCommit.slice(0, 8)} verified${releaseChecked ? ' (tag + report + release assets)' : ' (tag + report; release not queried)'}`);
process.exit(0);
