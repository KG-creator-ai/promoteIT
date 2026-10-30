// RED TEAM (Phase 09) — adversarial anti-hallucination guard for CERTIFICATION.md.
//
// CERTIFICATION.md is the DURABLE + PUBLIC record (D11): it is attached to the
// GitHub Release. Every number in it must be re-derivable from the repo or the
// local artifacts. This file RE-DERIVES the claims instead of trusting the
// prose, so a later edit cannot quietly outrun its evidence.
//
// Coverage map (bad input / boundary / failure path):
//   A artifact index drift      -> bytes / sha256 prefix no longer match disk
//   B L3 hash-binding drift     -> export artifact edited after the review
//   C carried-forward honesty   -> a "fresh run" claim or D11 wording removed
//   D D10 self-reference        -> certification cites its own commit's CI run
//   E ledger over-claim         -> "0 stale" / "0 open" / wrong atom count
//   F quorum over-claim         -> "12 personas approve" with < 12 verdicts
//   G budget drift              -> quoted chunk size != shipped chunk
//   H SPEC-015 regression guard -> the seams the certification names disappear
//
// NOTE (D11): audit-artifacts/ and dist/ are local/gitignored. Where an
// artifact is absent the assertion is SKIPPED with an explicit marker rather
// than silently passing (same pattern as scripts/e2e-assert.mjs).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '../..');
const CERT = fs.readFileSync(path.join(ROOT, 'CERTIFICATION.md'), 'utf8');
const ART = path.join(ROOT, 'audit-artifacts');
const DIST = path.join(ROOT, 'dist', 'assets');
const hasArtifacts = fs.existsSync(ART);
const hasDist = fs.existsSync(DIST);
if (!hasArtifacts) console.warn('[cert-claims] audit-artifacts/ absent — artifact assertions skipped (D11)');
if (!hasDist) console.warn('[cert-claims] dist/assets absent — budget assertions skipped (run vite build first)');

const sha16 = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);
const sizeOf = (f: string) => fs.statSync(f).size;

// ---------------------------------------------------------------- A. index
describe('CERTIFICATION.md artifact index re-derives from disk', () => {
  it.skipIf(!hasArtifacts)('every indexed artifact matches its on-disk byte count and sha256 prefix', () => {
    const rows = [...CERT.matchAll(/\|\s*`([^`]+)`\s*\|\s*([\d,]+)\s*\|\s*`([0-9a-f]{16})`\s*\|/g)];
    expect(rows.length).toBeGreaterThanOrEqual(6);
    for (const [, file, bytes, hash] of rows) {
      if (file.includes('..')) continue; // frame range row, not a single file
      const abs = path.join(ART, file);
      expect(fs.existsSync(abs), `indexed artifact missing on disk: ${file}`).toBe(true);
      expect(sizeOf(abs), `byte count drift for ${file}`).toBe(Number(bytes.replace(/,/g, '')));
      expect(sha16(abs), `sha256 prefix drift for ${file}`).toBe(hash);
    }
  });

  it.skipIf(!hasArtifacts)('the quoted export byte count is the real file, not a rounded figure', () => {
    const webm = path.join(ART, '14_export_preview.webm');
    expect(sizeOf(webm)).toBe(4096366);
    expect(CERT).toContain('4,096,366');
    // The v1.1.0 "6.2 MB" overstatement must not come back AS A CLAIM. It may
    // appear only inside an explicit correction of the earlier figure.
    if (/6\.2\s*MB/.test(CERT)) expect(CERT).toMatch(/Corrected here|v1\.1\.0 stated the export as/);
  });
});

// ------------------------------------------------------------- B. L3 binding
describe('CERTIFICATION.md L3 section is hash-bound to the reviewed artifact', () => {
  it.skipIf(!hasArtifacts)('cert, live artifact and l3-verdict.json agree on the source hash', () => {
    const webm = path.join(ART, '14_export_preview.webm');
    const live = sha16(webm);
    const verdict = JSON.parse(fs.readFileSync(path.join(ART, 'l3-verdict.json'), 'utf8'));
    expect(verdict.sourceHash).toBe(live);
    expect(CERT).toContain(live);
    expect(CERT).toContain(verdict.reviewer);
    expect(CERT).toContain(verdict.reviewedAt.slice(0, 10)); // date, not a fresh one
  });

  it.skipIf(!hasArtifacts)('the frame/screenshot/follow-up counts quoted in the cert match the verdict', () => {
    const verdict = JSON.parse(fs.readFileSync(path.join(ART, 'l3-verdict.json'), 'utf8'));
    expect(CERT).toMatch(new RegExp(`${verdict.frames.length}/8 frames`));
    expect(CERT).toMatch(new RegExp(`${verdict.screenshots.length} screenshots`));
    for (const fu of verdict.followUps) {
      // every recorded follow-up must be surfaced as a known limit / non-blocker
      const key = fu.includes('caption') ? 'caption' : fu.includes('watermark') ? 'watermark' : fu.includes('ACT-6') ? 'ACT-6' : 'imageless';
      expect(CERT.toLowerCase()).toContain(key.toLowerCase());
    }
  });
});

// ------------------------------------------------- C. carried-forward honesty
describe('CERTIFICATION.md honesty about carried-forward evidence', () => {
  it.skipIf(!hasArtifacts)('quotes the manifest date and never claims a fresh provider run', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ART, 'manifest.json'), 'utf8'));
    expect(CERT).toContain(manifest.date);
    expect(CERT).toMatch(/carried forward/i);
    expect(CERT).toMatch(/no fresh provider-backed E2E|no fresh provider run/i);
  });

  it('states the D11 durable-record wording (this document is the durable record)', () => {
    expect(CERT).toMatch(/durable\s+record/i);
    expect(CERT).toMatch(/audit-artifacts\/[\s\S]{0,200}(gitignored|working copy)/);
    expect(CERT).toMatch(/local\s+`?manifest\.json`?/i);
    expect(CERT).toMatch(/not a committed artifact|working copy, not committed/i);
  });
});

// ------------------------------------------------------- D. D10 no self-ref
describe('CERTIFICATION.md does not cite its own commit CI run (D10)', () => {
  it('contains no GitHub Actions run id / run URL', () => {
    expect(CERT).not.toMatch(/actions\/runs\//);
    expect(CERT).not.toMatch(/\brun id[: ]*\d{9,12}\b/i);
  });

  it('any durable record it points at for the pinned run actually exists', () => {
    const m = CERT.match(/recorded in\s+`?([A-Za-z0-9_.-]+\.md)`?/);
    if (!m) return; // no pointer -> nothing to falsify
    const target = path.join(ROOT, m[1]);
    expect(fs.existsSync(target), `certification points at a missing durable record: ${m[1]}`).toBe(true);
  });
});

// ------------------------------------------------------- E. ledger over-claim
describe('CERTIFICATION.md graph-ledger line matches .spec-graph/graph.json', () => {
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, '.spec-graph/graph.json'), 'utf8'));
  const atoms = G.nodes.filter((n: any) => n.kind === 'spec_atom');
  const verified = atoms.filter((n: any) => n.status === 'verified');
  const open = atoms.filter((n: any) => n.status !== 'verified' && n.status !== 'waived');
  // replicate graph.mjs staleness rule: recompute hash of every tracked path
  const stale: string[] = [];
  for (const n of G.nodes.filter((x: any) => x.kind === 'evidence' && x.status === 'verified')) {
    for (const p of Object.keys(n.hashes || {})) {
      const f = path.join(ROOT, p);
      const cur = fs.existsSync(f)
        ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16)
        : 'MISSING';
      if (cur !== n.hashes[p]) { stale.push(n.id); break; }
    }
  }

  it('a "0 stale" claim is backed by zero stale evidence nodes', () => {
    if (!/0 stale/.test(CERT)) return;
    expect(stale, `certification claims "0 stale" but ${stale.length} stale evidence node(s): ${stale.join(', ')}`).toEqual([]);
  });

  it('a "0 open" claim is backed by zero open atoms, or is explicitly scoped', () => {
    if (!/0 open/.test(CERT)) return;
    const scoped = /non-release|excluding SPEC-019|outside SPEC-019/i.test(CERT);
    if (scoped) return;
    expect(open.map((n: any) => n.id), 'certification claims "0 open" but the ledger has open atoms').toEqual([]);
  });

  it('the "N/N atoms verified" figure matches the ledger (whole graph or a named scope)', () => {
    const m = CERT.match(/(\d+)\/(\d+) atoms verified/);
    if (!m) return;
    const claimed = Number(m[1]);
    const nonRelease = verified.filter((n: any) => !String(n.id).startsWith('SPEC-019'));
    expect(
      [verified.length, nonRelease.length],
      `certification claims ${m[0]} but the ledger has ${verified.length}/${atoms.length} verified ` +
        `(non-SPEC-019 scope: ${nonRelease.length})`,
    ).toContain(claimed);
  });
});

// ------------------------------------------------------- F. quorum over-claim
describe('CERTIFICATION.md tiered-quorum claim is backed by quorum.mjs', () => {
  it('a "N personas approve Phase 09" claim means N approving verdict files exist and quorum resolves PASS', () => {
    const m = CERT.match(/(\d+)\s+personas?\s*\([^)]*\)\s*approve Phase 09/i);
    if (!m) return;
    const claimed = Number(m[1]);
    const dir = path.join(ROOT, '.spec-graph', 'personas', 'verdicts');
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('phase-09-') && f.endsWith('.json'));
    expect(files.length, `certification claims ${claimed} approving personas; only ${files.length} phase-09 verdict file(s) exist`).toBe(claimed);
    for (const f of files) {
      const v = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      expect(v.verdict, `${f} is not an approval`).toBe('approve');
    }
    const out = execSync(
      `node "${path.join(ROOT, '.spec-graph/ops/quorum.mjs')}" --phase 09 ` +
        `--specs SPEC-014,SPEC-015,SPEC-016,SPEC-017,SPEC-018,SPEC-019`,
      { encoding: 'utf8', cwd: ROOT },
    );
    expect(JSON.parse(out).verdict).toBe('PASS');
  });

  it('the "claim-audit PASS" claim is backed by every required persona approving (the audit\'s quorum rule)', () => {
    if (!/claim-audit[^\n]*PASS/i.test(CERT)) return;
    // claim-audit check #6 == "every required persona has an approving verdict for
    // the phase specs". Same substance as the quorum CLI, but cheap enough for a
    // unit test (claim-audit --recheck itself takes minutes).
    const out = execSync(
      `node "${path.join(ROOT, '.spec-graph/ops/quorum.mjs')}" --phase 09 ` +
        `--specs SPEC-014,SPEC-015,SPEC-016,SPEC-017,SPEC-018,SPEC-019`,
      { encoding: 'utf8', cwd: ROOT },
    );
    const q = JSON.parse(out);
    expect(q.missing, `claim-audit cannot be PASS: quorum is missing ${JSON.stringify(q.missing)}`).toEqual([]);
    expect(q.nonApprove, `claim-audit cannot be PASS: non-approve verdicts ${JSON.stringify(q.nonApprove)}`).toEqual([]);
  });
});

// ----------------------------------------------------------- G. budget drift
describe('CERTIFICATION.md bundle-budget line matches the shipped chunks', () => {
  it.skipIf(!hasDist)('every quoted chunk size equals the measured dist/assets size', () => {
    const budgets = JSON.parse(fs.readFileSync(path.join(ROOT, '.spec-graph/budgets.json'), 'utf8'));
    const start = CERT.indexOf('Bundle budget');
    expect(start).toBeGreaterThan(-1);
    const para = CERT.slice(start, start + 900);
    const quoted = [...para.matchAll(/([a-z0-9 ]+?)\s+([\d,]+)\s*\/\s*([\d,]+)\s*B/g)];
    expect(quoted.length).toBeGreaterThanOrEqual(6);
    for (const [, label, size, cap] of quoted) {
      const rule = budgets.js.find((r: any) => r.label === label.trim());
      expect(rule, `certification quotes an unknown budget label: "${label.trim()}"`).toBeTruthy();
      expect(Number(cap.replace(/,/g, '')), `cap drift for ${label.trim()}`).toBe(rule.maxBytes);
      const files = fs.readdirSync(DIST).filter((f) => new RegExp(rule.pattern).test(f));
      expect(files.length, `no dist chunk matches ${label.trim()}`).toBeGreaterThan(0);
      const measured = fs.statSync(path.join(DIST, files[0])).size;
      expect(
        Number(size.replace(/,/g, '')),
        `certification quotes ${label.trim()} = ${size} B but the shipped chunk is ${measured} B ` +
          `(budgets.json "measured" is a baseline; refresh it or quote the live size)`,
      ).toBe(measured);
    }
  });
});

// --------------------------------------- H. SPEC-015 seams the cert names
describe('the SPEC-015 seams named by the certification still exist', () => {
  it('src/lib/archival.ts exports the bundle build/parse seam (archive round-trip claim)', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/archival.ts'), 'utf8');
    expect(src).toMatch(/export function buildArchiveBundle/);
    expect(src).toMatch(/export function parseArchiveBundle/);
    expect(src).toMatch(/count mismatch/i);
  });

  it('ProjectWorkspace keeps the h2 heading order (a11y heading-order claim)', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/components/projects/ProjectWorkspace.tsx'), 'utf8');
    expect(src).not.toMatch(/<h3[^>]*>Create New Campaign/);
    expect(src).not.toMatch(/<h3[^>]*>No campaigns yet/);
    expect(src).toMatch(/<h2[^>]*>Create New Campaign/);
  });
});
