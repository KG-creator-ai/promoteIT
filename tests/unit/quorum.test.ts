import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
// NOTE (toolchain quirk): .spec-graph/ops/*.mjs must NOT be imported into the
// vitest worker (static or dynamic — vite's transform pipeline stalls). The
// pure parser is exercised via plain-node subprocess below: same real code,
// no vite involved. CLI surface is covered black-box through quorum.mjs exec.

// SPEC-014.AC-001: schema v3.2.0 domains on spec_atom nodes; init parses `- Domains:`.
describe('schema v3.2.0 domains (SPEC-014.AC-001)', () => {
  const G = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../.spec-graph/graph.json'), 'utf8'));

  it('graph version is 3.2.0 and every spec_atom carries a domains array', () => {
    expect(G.version).toBe('3.2.0');
    const atoms = G.nodes.filter((n: any) => n.kind === 'spec_atom');
    expect(atoms.length).toBeGreaterThan(36);
    for (const n of atoms) expect(Array.isArray(n.domains)).toBe(true);
  });

  it('backfill tags match the SPEC-014 contract', () => {
    const dom = (spec: string) => G.nodes.find((n: any) => n.kind === 'spec_atom' && n.spec === spec).domains;
    expect(dom('SPEC-005-docs')).toEqual(['docs']);
    expect(dom('SPEC-008')).toEqual(['ux']);
    expect(dom('SPEC-009')).toEqual(['ux', 'perf']);
    expect(dom('SPEC-010')).toEqual(['security']);
    expect(dom('SPEC-011')).toEqual(['ux']);
    expect(dom('SPEC-012')).toEqual(['resilience']);
  });

  it('parseSpecACs reads the - Domains: line (via plain node probe script)', () => {
    const probe = (file: string) =>
      JSON.parse(
        execSync(`node "${path.resolve(__dirname, '../../scripts/spec-parse-probe.mjs')}" "${file}"`, {
          encoding: 'utf8',
        }),
      );
    const real = probe(path.resolve(__dirname, '../../.spec-graph/specs/SPEC-010-providers.md'));
    expect(real.id).toBe('SPEC-010-providers');
    expect(real.acs.length).toBe(3);
    expect(real.domains).toEqual(['security']);
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-')), 'SPEC-9.md');
    fs.writeFileSync(tmp, '# SPEC-9\n- Domains: security, perf\n\n- [ ] AC-001 (SPEC-9.AC-001): x — verified by: y\n');
    expect(probe(tmp).domains).toEqual(['security', 'perf']);
  });
});

// SPEC-014.AC-001/002: tiered quorum — core6 always; domain auditors iff specs carry domains.
const QUORUM = path.resolve(__dirname, '../../.spec-graph/ops/quorum.mjs');
const CORE = ['po', 'architect', 'builder', 'qa', 'redteam', 'releaser'];

let dir: string;
const writeVerdict = (persona: string, v = 'approve', specs: string[] = []) =>
  fs.writeFileSync(
    path.join(dir, `phase-09-${persona}.json`),
    JSON.stringify({ persona, phase: '09', verdict: v, evidence: ['quorum-test'], specs, ts: '2026-10-13T00:00:00Z' }),
  );

const run = (specs: string) => {
  try {
    const out = execSync(`node ${QUORUM} --phase 09 --specs ${specs} --verdicts-dir ${dir}`, { encoding: 'utf8' });
    return { exit: 0, json: JSON.parse(out) };
  } catch (e: any) {
    return { exit: e.status, json: JSON.parse((e.stdout || '{}').toString()) };
  }
};

describe('tiered quorum (SPEC-014)', () => {
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quorum-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('AC-001: a spec id without domain metadata passes on core6 approve', () => {
    CORE.forEach((p) => writeVerdict(p));
    const r = run('SPEC-000'); // no atoms => no domains => core6 only (backward compat)
    expect(r.exit).toBe(0);
    expect(r.json.verdict).toBe('PASS');
    expect(r.json.domains).toEqual([]);
    expect(r.json.required).toEqual(CORE);
  });

  it('AC-002: domain specs require their auditors (missing => FAIL)', () => {
    CORE.forEach((p) => writeVerdict(p));
    const r = run('SPEC-009'); // backfilled domains: ux+perf
    expect(r.exit).toBe(1);
    expect(r.json.verdict).toBe('FAIL');
    expect(r.json.missing).toContain('design-reviewer');
    expect(r.json.missing).toContain('perf-engineer');
  });

  it('AC-002: domain specs pass once auditors approve', () => {
    CORE.forEach((p) => writeVerdict(p));
    writeVerdict('design-reviewer');
    writeVerdict('perf-engineer');
    const r = run('SPEC-009');
    expect(r.exit).toBe(0);
    expect(r.json.verdict).toBe('PASS');
  });

  it('AC-002: block verdict fails quorum even when all present', () => {
    CORE.forEach((p) => writeVerdict(p));
    writeVerdict('design-reviewer');
    writeVerdict('perf-engineer', 'block');
    const r = run('SPEC-009');
    expect(r.exit).toBe(1);
    expect(r.json.nonApprove).toContain('perf-engineer=block');
  });

  it('AC-002: security domain maps to security-auditor', () => {
    CORE.forEach((p) => writeVerdict(p));
    const r = run('SPEC-010'); // backfilled: security
    expect(r.json.missing).toContain('security-auditor');
    writeVerdict('security-auditor');
    expect(run('SPEC-010').exit).toBe(0);
  });
});

// SPEC-023.AC-004 (D21/D-013): an unmapped domain must FAIL CLOSED — it may
// never silently drop its auditor (the old behaviour produced a vacuous quorum).
describe('fail-closed domains (SPEC-023.AC-004)', () => {
  let root: string;
  let verdictsDir: string;

  const approve = (persona: string) =>
    fs.writeFileSync(
      path.join(verdictsDir, `phase-10-${persona}.json`),
      JSON.stringify({ persona, phase: '10', verdict: 'approve', evidence: ['quorum-test'], specs: [], ts: '2026-11-02T00:00:00Z' }),
    );

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-root-'));
    verdictsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quorum-'));
    fs.mkdirSync(path.join(root, '.spec-graph'), { recursive: true });
    fs.writeFileSync(
      path.join(root, '.spec-graph/graph.json'),
      JSON.stringify({
        version: '3.2.0',
        nodes: [
          { id: 'SPEC-900.AC-001', kind: 'spec_atom', spec: 'SPEC-900', ac: 'AC-001', status: 'open', domains: ['totally-unmapped'] },
          { id: 'SPEC-901.AC-001', kind: 'spec_atom', spec: 'SPEC-901', ac: 'AC-001', status: 'open', domains: ['av-quality'] },
        ],
        edges: [],
      }),
    );
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(verdictsDir, { recursive: true, force: true });
  });

  const runIn = (specs: string) => {
    try {
      const out = execSync(`node ${QUORUM} --phase 10 --specs ${specs} --verdicts-dir ${verdictsDir}`, {
        encoding: 'utf8',
        env: { ...process.env, SPEC_GRAPH_ROOT: root },
      });
      return { exit: 0, json: JSON.parse(out) };
    } catch (e: any) {
      return { exit: e.status, json: JSON.parse((e.stdout || '{}').toString()) };
    }
  };

  it('an unmapped domain fails the quorum with a named error (never silently ignored)', () => {
    CORE.forEach((p) => approve(p));
    const r = runIn('SPEC-900');
    expect(r.exit).toBe(1);
    expect(r.json.verdict).toBe('FAIL');
    expect(r.json.unknown).toEqual(['totally-unmapped']);
  });

  it('the av-quality domain requires the creative-director persona', () => {
    CORE.forEach((p) => approve(p));
    const r = runIn('SPEC-901');
    expect(r.json.unknown).toEqual([]);
    expect(r.json.required).toContain('creative-director');
    expect(r.json.missing).toContain('creative-director');
    approve('creative-director');
    expect(runIn('SPEC-901').exit).toBe(0);
  });

  it('claim-audit rejects a spec file that declares an unmapped domain', () => {
    const specsDir = path.join(root, '.spec-graph/specs');
    fs.mkdirSync(specsDir, { recursive: true });
    fs.writeFileSync(path.join(specsDir, 'SPEC-902-bogus.md'), '# SPEC-902\n- Domains: totally-unmapped\n\n- [ ] AC-001 (SPEC-902.AC-001): x — verified by: y\n');
    const audit = path.resolve(__dirname, '../../.spec-graph/ops/claim-audit.mjs');
    let out = '';
    let exit = 0;
    try {
      out = execSync(`node ${audit}`, { encoding: 'utf8', env: { ...process.env, SPEC_GRAPH_ROOT: root } });
    } catch (e: any) {
      exit = e.status;
      out = (e.stdout || '{}').toString();
    }
    expect(exit).toBe(1);
    expect(out).toContain('unmapped domain');
    expect(out).toContain('totally-unmapped');
  });
});
