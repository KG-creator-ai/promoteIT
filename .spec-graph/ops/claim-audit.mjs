// claim-audit.mjs — anti-hallucination: cross-check agent claims vs graph+filesystem+fresh re-runs.
// Usage: node claim-audit.mjs [--recheck]   (--recheck re-runs verified evidence commands)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
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
if (fs.existsSync(vd)) {
  for (const f of fs.readdirSync(vd).filter(f => f.endsWith('.json'))) {
    try {
      const v = JSON.parse(fs.readFileSync(path.join(vd, f), 'utf8'));
      if (!['approve', 'request_changes', 'block'].includes(v.verdict)) problems.push(`${f}: invalid verdict`);
    } catch { problems.push(`${f}: unparsable`); }
  }
}

console.log(JSON.stringify({ verdict: problems.length ? 'FAIL' : 'PASS', problems }, null, 2));
process.exit(problems.length ? 1 : 0);
