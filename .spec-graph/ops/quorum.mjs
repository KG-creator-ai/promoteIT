// quorum.mjs — tiered-quorum resolver (SPEC-014, schema v3.1.0).
// Required verdict set = CORE6 + domain-mapped personas for the phase's specs.
// Usage: node quorum.mjs --phase 09 --specs SPEC-014,SPEC-015 [--verdicts-dir <dir>]
// Exit 0 + {"verdict":"PASS",...} iff every required persona approved; else FAIL.
// Phases whose verdicts carry no `specs` field resolve to core6 only (backward compat).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = process.env.SPEC_GRAPH_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CORE = ['po', 'architect', 'builder', 'qa', 'redteam', 'releaser'];
export const DOMAIN_MAP = {
  security: 'security-auditor',
  perf: 'perf-engineer',
  ux: 'design-reviewer',
  resilience: 'resilience-engineer',
  docs: 'docs-reviewer',
  discovery: 'analyst',
  'av-quality': 'creative-director',
};

export function requiredFor(graph, specs) {
  const domains = new Set();
  for (const n of graph.nodes || []) {
    if (n.kind === 'spec_atom' && specs.includes(n.spec)) {
      for (const d of n.domains || []) domains.add(d);
    }
  }
  const req = [...CORE];
  const unknown = [];
  for (const d of domains) {
    const p = DOMAIN_MAP[d];
    // Fail closed (D21): an unmapped domain must never silently drop its
    // auditor — that is a vacuous quorum. It is reported as an error.
    if (!p) { unknown.push(d); continue; }
    if (!req.includes(p)) req.push(p);
  }
  return { required: req, domains: [...domains], unknown };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// Test seam: allow require() invocation without argv side effects.
export function check({ phase, specs, verdictsDir }) {
  const g = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/graph.json'), 'utf8'));
  const { required, domains, unknown } = requiredFor(g, specs);
  const present = {};
  const missing = [];
  const nonApprove = [];
  for (const p of required) {
    const f = path.join(verdictsDir, `phase-${phase}-${p}.json`);
    if (!fs.existsSync(f)) { missing.push(p); continue; }
    try {
      const v = JSON.parse(fs.readFileSync(f, 'utf8'));
      present[p] = v.verdict;
      if (v.verdict !== 'approve') nonApprove.push(`${p}=${v.verdict}`);
    } catch { nonApprove.push(`${p}=unparsable`); }
  }
  const ok = missing.length === 0 && nonApprove.length === 0 && unknown.length === 0;
  return { verdict: ok ? 'PASS' : 'FAIL', phase, specs, domains, unknown, required, present, missing, nonApprove };
}

const invokedDirectly = process.argv[1] && path.basename(process.argv[1]) === 'quorum.mjs';
if (invokedDirectly) {
  const phase = arg('--phase');
  const specsArg = arg('--specs');
  const vd = arg('--verdicts-dir') || path.join(root, '.spec-graph/personas/verdicts');
  if (!phase || !specsArg) {
    console.error('usage: node quorum.mjs --phase <NN> --specs SPEC-014,... [--verdicts-dir <dir>]');
    process.exit(2);
  }
  const out = check({ phase, specs: specsArg.split(','), verdictsDir: vd });
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.verdict === 'PASS' ? 0 : 1);
}
