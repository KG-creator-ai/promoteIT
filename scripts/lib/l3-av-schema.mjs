/**
 * L3-AV verdict schema + validation (SPEC-022.AC-002 / AC-005).
 *
 * Shared by scripts/l3-av-assert.mjs and the unit tests, so the rules the
 * tests assert are exactly the rules the assert script enforces.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const REVIEWER_KINDS = ['human', 'agent-proxy'];
export const VERDICT_LEVELS = ['pass', 'fail', 'note'];
export const REVIEW_LEVELS = ['human-verified', 'agent-proxy', 'machine-only'];

export function loadRubric() {
  return JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/l3-av-rubric.json'), 'utf8'));
}

/**
 * Validate an L3-AV verdict.
 * @param {any} verdict
 * @param {{artifactHash?: string, expectedClips?: number, rubric?: any}} ctx
 * @returns {{ok: boolean, problems: string[], level: string}}
 */
export function validateL3AvVerdict(verdict, ctx = {}) {
  const rubric = ctx.rubric || loadRubric();
  const problems = [];

  if (!verdict || typeof verdict !== 'object') {
    return { ok: false, problems: ['verdict is not an object'], level: 'machine-only' };
  }

  // reviewerKind: missing or unknown is rejected.
  if (!verdict.reviewerKind) problems.push('missing reviewerKind (human | agent-proxy)');
  else if (!REVIEWER_KINDS.includes(verdict.reviewerKind)) {
    problems.push(`unknown reviewerKind: ${verdict.reviewerKind}`);
  }

  if (!verdict.reviewer) problems.push('missing reviewer');
  if (!verdict.reviewedAt || Number.isNaN(Date.parse(verdict.reviewedAt))) {
    problems.push('missing/invalid reviewedAt');
  }
  if (!verdict.source) problems.push('missing source');
  if (!verdict.sourceHash) problems.push('missing sourceHash');

  // The reviewer taxonomy is binding.
  if (verdict.reviewerKind === 'human') {
    const att = verdict.humanAttestation;
    if (!att || !att.attestedBy || !att.attestedAt || !att.statement) {
      problems.push('reviewerKind=human requires a human attestation (attestedBy, attestedAt, statement)');
    }
  }
  if (verdict.reviewerKind === 'agent-proxy' && verdict.humanAttestation) {
    problems.push('reviewerKind=agent-proxy must not carry a human attestation');
  }

  // Artifact binding: a stale review cannot certify a changed recording.
  if (ctx.artifactHash && verdict.sourceHash && verdict.sourceHash !== ctx.artifactHash) {
    problems.push(`sourceHash mismatch: ${verdict.sourceHash} != ${ctx.artifactHash} (artifact changed since review)`);
  }

  // Per-criterion verdicts.
  const checkGroup = (group, criteria) => {
    const entries = Array.isArray(verdict[group]) ? verdict[group] : [];
    const byId = new Map(entries.map(e => [e && e.criterion, e]));
    for (const c of criteria) {
      const entry = byId.get(c.id);
      if (!entry) {
        problems.push(`${group}: missing criterion ${c.id}`);
        continue;
      }
      if (!VERDICT_LEVELS.includes(entry.verdict)) problems.push(`${c.id}: invalid verdict ${entry.verdict}`);
      if (!entry.detail) problems.push(`${c.id}: missing detail`);
    }
    for (const entry of entries) {
      if (!entry || !criteria.some(c => c.id === entry.criterion)) {
        problems.push(`${group}: unknown criterion ${entry && entry.criterion}`);
      }
    }
  };
  checkGroup('audio', rubric.audio);
  checkGroup('video', rubric.video);

  // Coverage.
  const minRatio = rubric.coverageRule?.minimumRatio ?? 0.75;
  const total = ctx.expectedClips ?? verdict.coverage?.clips ?? 0;
  const reviewed = verdict.coverage?.reviewed ?? 0;
  if (!verdict.coverage || typeof reviewed !== 'number') {
    problems.push('missing coverage');
  } else if (total > 0 && reviewed / total < minRatio) {
    problems.push(`coverage too low: ${reviewed}/${total} (minimum ${minRatio})`);
  }

  if (!['pass', 'fail'].includes(verdict.overall)) problems.push(`invalid overall verdict: ${verdict.overall}`);

  const level =
    verdict.reviewerKind === 'human' ? 'human-verified' : verdict.reviewerKind === 'agent-proxy' ? 'agent-proxy' : 'machine-only';

  return { ok: problems.length === 0, problems, level };
}

/**
 * The review level that is actually on record: a verdict's reviewer kind, or
 * machine-only when no L3-AV verdict exists.
 */
export function achievedReviewLevel(verdictPath, artifactsDir) {
  const p = verdictPath || path.join(artifactsDir || path.join(root, 'audit-artifacts'), 'l3-av-verdict.json');
  if (!fs.existsSync(p)) return 'machine-only';
  try {
    const v = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (v.reviewerKind === 'human') return 'human-verified';
    if (v.reviewerKind === 'agent-proxy') return 'agent-proxy';
  } catch {
    /* unreadable verdict = no review on record */
  }
  return 'machine-only';
}
