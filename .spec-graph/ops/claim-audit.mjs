// claim-audit.mjs — anti-hallucination: cross-check agent claims vs graph+filesystem+fresh re-runs.
// Usage: node claim-audit.mjs [--recheck]   (--recheck re-runs verified evidence commands)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { requiredFor, CORE, DOMAIN_MAP } from './quorum.mjs';
import { parseSpecACs } from './spec-parse.mjs';

const root = process.env.SPEC_GRAPH_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GRAPH = path.join(root, '.spec-graph/graph.json');
const problems = [];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

if (!fs.existsSync(GRAPH)) { console.log(JSON.stringify({ verdict: 'FAIL', problems: ['graph.json missing — run graph.mjs init'] }, null, 2)); process.exit(1); }
const g = JSON.parse(fs.readFileSync(GRAPH, 'utf8'));
const RECHECK = process.argv.includes('--recheck');

// 1. Every verified node must trace to evidence with exit 0 + cmd + hashes
for (const n of g.nodes.filter(n => n.status === 'verified')) {
  if (n.kind === 'evidence') {
    if (!n.cmd) problems.push(`${n.id}: verified evidence has no cmd`);
    if (n.exit !== 0) problems.push(`${n.id}: verified evidence exit != 0`);
  }
}
// 2. Freshness: recompute hashes of evidence-linked paths
for (const n of g.nodes.filter(n => n.kind === 'evidence' && n.status === 'verified')) {
  for (const [p, h] of Object.entries(n.hashes || {})) {
    if (p.endsWith('graph.json')) continue; // ledger-exclusion rule (see GRAPH-SCHEMA.md)
    const f = path.join(root, p);
    const cur = fs.existsSync(f) ? sha(fs.readFileSync(f)) : 'MISSING';
    if (cur !== h) problems.push(`${n.id}: STALE — ${p} changed since evidence`);
  }
  // 3. Optional adversarial re-run
  if (RECHECK && n.cmd) {
    try { execSync(n.cmd, { cwd: root, stdio: 'pipe', timeout: 600000 }); }
    catch { problems.push(`${n.id}: RE-RUN FAILED — ${n.cmd}`); }
  }
}
// 4. Code/test paths referenced by verified nodes must exist
for (const n of g.nodes.filter(n => (n.kind === 'code' || n.kind === 'test') && n.status === 'verified')) {
  for (const p of n.paths || []) if (!fs.existsSync(path.join(root, p))) problems.push(`${n.id}: verified but path missing: ${p}`);
}
// 5. Verdict files must exist for current phase (if any verdicts recorded)
const vd = path.join(root, '.spec-graph/personas/verdicts');
// 6. Tiered quorum (SPEC-014): per phase, required = CORE6 + domain-mapped
//    personas of the specs listed in that phase's verdicts `specs` fields
//    (phases without `specs` resolve to core6 — backward compat with 00–08).
//    Any block/request_changes verdict fails (advance rule, PERSONAS.md).
if (fs.existsSync(vd)) {
  const byPhase = {};
  for (const f of fs.readdirSync(vd).filter(f => f.endsWith('.json'))) {
    try {
      const v = JSON.parse(fs.readFileSync(path.join(vd, f), 'utf8'));
      if (!['approve', 'request_changes', 'block'].includes(v.verdict)) problems.push(`${f}: invalid verdict`);
      const ph = (v.phase || '').toString().padStart(2, '0');
      (byPhase[ph] = byPhase[ph] || []).push({ file: f, v });
    } catch { problems.push(`${f}: unparsable`); }
  }
  for (const [ph, vs] of Object.entries(byPhase)) {
    for (const { file, v } of vs) {
      if (v.verdict === 'block') problems.push(`${file}: BLOCK verdict unresolved`);
      else if (v.verdict === 'request_changes') problems.push(`${file}: request_changes unresolved`);
    }
    const specs = [...new Set(vs.flatMap(({ v }) => v.specs || []))];
    const { required, unknown } = requiredFor(g, specs);
    for (const d of unknown) problems.push(`phase-${ph}: unmapped domain "${d}" — no persona is required for it (add it to ops/quorum.mjs DOMAIN_MAP)`);
    const have = new Set(vs.filter(({ v }) => v.verdict === 'approve').map(({ v }) => v.persona));
    for (const p of required) {
      if (!have.has(p)) problems.push(`phase-${ph}: quorum missing approve from ${p} (specs: ${specs.join(',') || 'core-only'})`);
    }
    for (const p of CORE) {
      if (!vs.some(({ v }) => v.persona === p)) problems.push(`phase-${ph}: core verdict missing: ${p}`);
    }
  }
}

// 7. Spec domain lint (D21): every `- Domains:` value must map to a persona.
//    An unmapped domain would make its auditor silently optional (D-013).
{
  const specsDir = path.join(root, '.spec-graph/specs');
  const files = fs.existsSync(specsDir) ? fs.readdirSync(specsDir).filter(f => f.endsWith('.md')) : [];
  for (const f of files) {
    const { domains } = parseSpecACs(path.join(specsDir, f));
    for (const d of domains) {
      if (!DOMAIN_MAP[d]) problems.push(`${f}: unmapped domain "${d}" — no persona is mapped to it (ops/quorum.mjs DOMAIN_MAP)`);
    }
  }
}

console.log(JSON.stringify({ verdict: problems.length ? 'FAIL' : 'PASS', problems }, null, 2));
process.exit(problems.length ? 1 : 0);
