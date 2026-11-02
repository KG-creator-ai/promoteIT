// SPEC-022.AC-001 / AC-004 — rubric v2 (A1–A6, V1–V4) and the achieved
// review level the certification must state explicitly.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadRubric, REVIEW_LEVELS, achievedReviewLevel } from '../../scripts/lib/l3-av-schema.mjs';

const ROOT = path.resolve(__dirname, '../..');
const RUBRIC = loadRubric();
const TEMPLATE = fs.readFileSync(path.join(ROOT, '.spec-graph/templates/L3-AV-RUBRIC.md'), 'utf8');
const CERT = fs.readFileSync(path.join(ROOT, 'CERTIFICATION.md'), 'utf8');

describe('SPEC-022 AC-001 — rubric v2 defines the audio and video criteria', () => {
  it('defines audio criteria A1–A6', () => {
    const ids = RUBRIC.audio.map(c => c.id);
    expect(ids).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    for (const c of RUBRIC.audio) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.passCriterion.length).toBeGreaterThan(20);
    }
  });

  it('defines video criteria V1–V4', () => {
    const ids = RUBRIC.video.map(c => c.id);
    expect(ids).toEqual(['V1', 'V2', 'V3', 'V4']);
    for (const c of RUBRIC.video) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.passCriterion.length).toBeGreaterThan(20);
    }
  });

  it('covers the criteria the spec names', () => {
    const titles = [...RUBRIC.audio, ...RUBRIC.video].map(c => `${c.id} ${c.title}`.toLowerCase());
    expect(titles.some(t => t.includes('audible'))).toBe(true);
    expect(titles.some(t => t.includes('clipping'))).toBe(true);
    expect(titles.some(t => t.includes('voice'))).toBe(true);
    expect(titles.some(t => t.includes('intelligible'))).toBe(true);
    expect(titles.some(t => t.includes('dead air'))).toBe(true);
    expect(titles.some(t => t.includes('sync'))).toBe(true);
    expect(titles.some(t => t.includes('rendered'))).toBe(true);
    expect(titles.some(t => t.includes('legible'))).toBe(true);
    expect(titles.some(t => t.includes('correspondence'))).toBe(true);
    expect(titles.some(t => t.includes('continuity'))).toBe(true);
  });

  it('binds the review to the artifact hash', () => {
    expect(RUBRIC.artifactBinding.kind).toBe('sha256-prefix');
    expect(RUBRIC.artifactBinding.length).toBe(16);
    expect(RUBRIC.artifactBinding.field).toBe('sourceHash');
    expect(RUBRIC.artifactBinding.rule).toMatch(/changed artifact re-opens the review/i);
  });

  it('keeps the human rubric template in sync with the machine rubric', () => {
    for (const c of [...RUBRIC.audio, ...RUBRIC.video]) {
      expect(TEMPLATE).toContain(`**${c.id} ${c.title}**`);
    }
    expect(TEMPLATE).toContain('reviewerKind');
    expect(TEMPLATE).toContain('human-verified');
    expect(TEMPLATE).toContain('agent-proxy');
    expect(TEMPLATE).toContain('machine-only');
  });
});

describe('SPEC-022 AC-004 — the certification states the achieved review level', () => {
  it('names an allowed level explicitly', () => {
    const m = CERT.match(/Achieved review level:\s*`([a-z-]+)`/i);
    expect(m, 'the certification must state the achieved review level').toBeTruthy();
    expect(REVIEW_LEVELS).toContain(m![1]);
  });

  it('states the level that is actually on record', () => {
    const m = CERT.match(/Achieved review level:\s*`([a-z-]+)`/i)!;
    const onRecord = achievedReviewLevel(path.join(ROOT, 'audit-artifacts/l3-av-verdict.json'), path.join(ROOT, 'audit-artifacts'));
    expect(m[1]).toBe(onRecord);
  });

  it('never implies a human reviewed what a persona reviewed', () => {
    const m = CERT.match(/Achieved review level:\s*`([a-z-]+)`/i)!;
    if (m[1] === 'human-verified') return; // a real attestation is on record
    const section = CERT.slice(Math.max(0, CERT.indexOf('Achieved review level') - 400), CERT.indexOf('Achieved review level') + 1200);
    expect(section).not.toMatch(/human[ -](verified|reviewed|approved|attested|checked)/i);
    expect(section).not.toMatch(/reviewed by a human/i);
  });

  it('defines the three levels in the rubric', () => {
    expect(Object.keys(RUBRIC.levels).sort()).toEqual([...REVIEW_LEVELS].sort());
  });
});
