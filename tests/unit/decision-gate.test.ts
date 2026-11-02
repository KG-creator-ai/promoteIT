import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// NOTE (toolchain quirk): .spec-graph/ops/*.mjs must NOT be imported into the
// vitest worker (vite's transform pipeline stalls). Every check below runs the
// real CLI as a plain-node subprocess against a fixture root.

const REPO = path.resolve(__dirname, '../..');
const GATE = path.join(REPO, '.spec-graph/ops/decision-gate.mjs');
const GRAPH_CLI = path.join(REPO, '.spec-graph/ops/graph.mjs');
const POLICIES = path.join(REPO, '.spec-graph/policies/policies.json');

interface GateResult {
  exit: number;
  json: any;
}

const runGate = (args: string[], root: string, log?: string): GateResult => {
  const env: NodeJS.ProcessEnv = { ...process.env, SPEC_GRAPH_ROOT: root };
  if (log) env.SPEC_GRAPH_DECISION_LOG = log;
  try {
    const out = execSync(`node ${GATE} ${args.join(' ')}`, { encoding: 'utf8', env });
    return { exit: 0, json: JSON.parse(out) };
  } catch (e: any) {
    return { exit: e.status, json: JSON.parse((e.stdout || '{}').toString()) };
  }
};

let root: string;
let log: string;

const fixtureGraph = (nodes: any[]) => ({
  version: '3.2.0',
  project: 'fixture',
  updatedAt: new Date().toISOString(),
  nodes,
  edges: [],
});

const atomNodes = (atom: string, domains: string[] = [], status = 'open') => [
  { id: atom, kind: 'spec_atom', spec: atom.split('.')[0], ac: 'AC-001', status, domains },
  { id: `${atom}.task`, kind: 'task', spec: atom.split('.')[0], status, dependsOn: [atom] },
  { id: `${atom}.code`, kind: 'code', spec: atom.split('.')[0], status, paths: [] },
  { id: `${atom}.test`, kind: 'test', spec: atom.split('.')[0], status, paths: [], cmd: '' },
  { id: `${atom}.ev`, kind: 'evidence', spec: atom.split('.')[0], status, cmd: '', exit: null, hashes: {}, log: '' },
];

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-root-'));
  log = path.join(root, 'decisions.jsonl');
  fs.mkdirSync(path.join(root, '.spec-graph'), { recursive: true });
  fs.copyFileSync(POLICIES, path.join(root, '.spec-graph/policies.json'));
  fs.mkdirSync(path.join(root, '.spec-graph/policies'), { recursive: true });
  fs.copyFileSync(POLICIES, path.join(root, '.spec-graph/policies/policies.json'));
  fs.writeFileSync(path.join(root, '.spec-graph/graph.json'), JSON.stringify(fixtureGraph(atomNodes('SPEC-900.AC-001')), null, 2));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// SPEC-023.AC-001: policies compile the hard stops into executable checks.
describe('decision gate policy registry (SPEC-023.AC-001)', () => {
  it('every policy cites its source and carries an id, severity and check type', () => {
    const reg = JSON.parse(fs.readFileSync(POLICIES, 'utf8'));
    expect(reg.policies.length).toBeGreaterThanOrEqual(12);
    const ids = new Set<string>();
    for (const p of reg.policies) {
      expect(p.id).toMatch(/^DG-\d{3}$/);
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.severity).toBe('block');
      expect(typeof p.source).toBe('string');
      expect(p.source.length).toBeGreaterThan(10);
      expect(typeof p.check.type).toBe('string');
      expect(Array.isArray(p.actions)).toBe(true);
    }
  });

  it('every registered check type is implemented by the gate (fail-closed on unknown types)', () => {
    const reg = JSON.parse(fs.readFileSync(POLICIES, 'utf8'));
    const src = fs.readFileSync(GATE, 'utf8');
    for (const p of reg.policies) {
      expect(src).toContain(p.check.type);
    }
  });

  it('the policies cover the hard stops named in GUARDRAILS and DECISIONS', () => {
    const reg = JSON.parse(fs.readFileSync(POLICIES, 'utf8'));
    const src = reg.policies.map((p: any) => p.source).join('\n');
    expect(src).toContain('.env');
    expect(src).toContain('force-push');
    expect(src).toContain('D10');
    expect(src).toContain('D21');
    expect(src).toContain('runtime deps');
  });
});

// SPEC-023.AC-002: interception before the evidence command runs.
describe('decision gate interception (SPEC-023.AC-002)', () => {
  it('an unknown atom is blocked with structured feedback', () => {
    const r = runGate(['check', '--action', 'verify', '--atom', 'SPEC-999.AC-001', '--cmd', 'echo ok'], root, log);
    expect(r.exit).toBe(1);
    expect(r.json.verdict).toBe('block');
    const p = r.json.feedback.find((f: any) => f.policy === 'DG-002');
    expect(p).toBeTruthy();
    expect(p.fact).toContain('not in the ledger');
    expect(p.remediation.length).toBeGreaterThan(5);
  });

  it('a missing evidence command is blocked (no prose-only AC)', () => {
    const r = runGate(['check', '--action', 'verify', '--atom', 'SPEC-900.AC-001'], root, log);
    expect(r.exit).toBe(1);
    expect(r.json.feedback.map((f: any) => f.policy)).toContain('DG-003');
  });

  it('a missing evidence path is blocked', () => {
    const r = runGate(['check', '--action', 'verify', '--atom', 'SPEC-900.AC-001', '--cmd', 'echo ok', '--paths', 'does/not/exist.ts'], root, log);
    expect(r.exit).toBe(1);
    expect(r.json.feedback.map((f: any) => f.policy)).toContain('DG-004');
  });

  it('a legitimate verification is allowed', () => {
    const r = runGate(['check', '--action', 'verify', '--atom', 'SPEC-900.AC-001', '--cmd', 'echo ok'], root, log);
    expect(r.exit).toBe(0);
    expect(r.json.verdict).toBe('allow');
    expect(r.json.feedback).toEqual([]);
  });

  it('graph.mjs verify refuses to mark an atom verified when a policy blocks', () => {
    let exit = 0;
    let out = '';
    try {
      out = execSync(`node ${GRAPH_CLI} verify SPEC-900.AC-001 --cmd "echo ok" --paths does/not/exist.ts`, {
        encoding: 'utf8',
        env: { ...process.env, SPEC_GRAPH_ROOT: root, SPEC_GRAPH_DECISION_LOG: log },
      });
    } catch (e: any) {
      exit = e.status;
      out = (e.stdout || '').toString();
    }
    expect(exit).toBe(1);
    expect(out).toContain('block');
    const g = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/graph.json'), 'utf8'));
    const atom = g.nodes.find((n: any) => n.id === 'SPEC-900.AC-001');
    const ev = g.nodes.find((n: any) => n.id === 'SPEC-900.AC-001.ev');
    expect(atom.status).toBe('open');
    expect(ev.status).toBe('open');
  });
});

// SPEC-023.AC-003: premature-termination detection.
describe('premature-termination detection (SPEC-023.AC-003)', () => {
  it('declaring done while atoms are open is blocked', () => {
    const r = runGate(['check', '--action', 'done', '--target', 'phase-10'], root, log);
    expect(r.exit).toBe(1);
    const p = r.json.feedback.find((f: any) => f.policy === 'DG-010');
    expect(p).toBeTruthy();
    expect(p.fact).toContain('still open');
  });

  it('declaring done is allowed once every atom is verified', () => {
    const nodes = atomNodes('SPEC-900.AC-001', [], 'verified');
    fs.writeFileSync(path.join(root, '.spec-graph/graph.json'), JSON.stringify(fixtureGraph(nodes), null, 2));
    const r = runGate(['check', '--action', 'done', '--target', 'phase-10'], root, log);
    expect(r.json.verdict).toBe('allow');
    expect(r.json.feedback.map((f: any) => f.policy)).not.toContain('DG-010');
  });
});

// SPEC-023.AC-005: bounded revision — the third block demands an escalation card.
describe('bounded revision (SPEC-023.AC-005)', () => {
  it('the third consecutive block for the same target requires an escalation card', { timeout: 30000 }, () => {
    const args = ['check', '--action', 'verify', '--atom', 'SPEC-999.AC-001', '--cmd', 'echo ok'];
    const first = runGate(args, root, log);
    expect(first.exit).toBe(1);
    expect(first.json.revisionCount).toBe(1);
    expect(first.json.escalationRequired).toBe(false);
    const second = runGate(args, root, log);
    expect(second.json.revisionCount).toBe(2);
    expect(second.json.escalationRequired).toBe(false);
    const third = runGate(args, root, log);
    expect(third.json.revisionCount).toBe(3);
    expect(third.json.escalationRequired).toBe(true);
  });

  it('blocks for different targets are counted independently', { timeout: 30000 }, () => {
    runGate(['check', '--action', 'verify', '--atom', 'SPEC-999.AC-001', '--cmd', 'echo ok'], root, log);
    const other = runGate(['check', '--action', 'verify', '--atom', 'SPEC-998.AC-001', '--cmd', 'echo ok'], root, log);
    expect(other.json.revisionCount).toBe(1);
  });
});

// SPEC-023.AC-006: the probabilistic layer is optional and honest.
describe('optional probabilistic layer (SPEC-023.AC-006)', () => {
  it('without a provider key the judgment is recorded as unverified, never as a pass', { timeout: 30000 }, () => {
    const env = { ...process.env };
    delete env.GEMINI_API_KEY;
    delete env.VITE_GEMINI_API_KEY;
    let out = '';
    try {
      out = execSync(`node ${GATE} check --action release --target v1.3.0 --phase 10 --specs SPEC-900`, {
        encoding: 'utf8',
        env: { ...env, SPEC_GRAPH_ROOT: root, SPEC_GRAPH_DECISION_LOG: log },
      });
    } catch (e: any) {
      out = (e.stdout || '{}').toString();
    }
    const json = JSON.parse(out);
    expect(json.judgment.status).toBe('unverified-probabilistic');
    expect(json.judgment.verdict).not.toBe('pass');
    expect(String(json.judgment.reason || '')).toContain('never reported as a pass');
  });

  it('the decision record is append-only and contains the judgment status', { timeout: 30000 }, () => {
    runGate(['check', '--action', 'verify', '--atom', 'SPEC-999.AC-001', '--cmd', 'echo ok'], root, log);
    runGate(['check', '--action', 'verify', '--atom', 'SPEC-900.AC-001', '--cmd', 'echo ok'], root, log);
    const lines = fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines.length).toBe(2);
    expect(lines[0].verdict).toBe('block');
    expect(lines[1].verdict).toBe('allow');
    expect(lines[0].judgment).toBeTruthy();
    expect(lines[0].revisionCount).toBe(1);
  });
});
