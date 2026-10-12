// graph.mjs — traceability graph CLI (single source of truth)
// Usage:
//   node graph.mjs init                  — build graph.json from .spec-graph/specs/*.md AC lines
//   node graph.mjs status                — progress summary (JSON)
//   node graph.mjs open                  — next actionable open atom (topological order)
//   node graph.mjs verify <atomId> --cmd "<cmd>" [--paths a,b]  — run cmd, record evidence
//   node graph.mjs reopen <atomId> --reason "..."
//   node graph.mjs add-spec <SPEC-ID>     — scaffold 5 nodes per AC found in spec file
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sg = path.join(root, '.spec-graph');
const GRAPH = path.join(sg, 'graph.json');

const load = () => JSON.parse(fs.readFileSync(GRAPH, 'utf8'));
const save = (g) => { g.updatedAt = new Date().toISOString(); fs.writeFileSync(GRAPH, JSON.stringify(g, null, 2)); };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const hashPaths = (paths) => {
  const out = {};
  for (const p of paths || []) {
    const f = path.join(root, p);
    out[p] = fs.existsSync(f) ? sha(fs.readFileSync(f)) : 'MISSING';
  }
  return out;
};

function parseSpecACs(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const id = path.basename(file, '.md');
  const acs = [];
  for (const m of txt.matchAll(/AC-(\d+)\s*\(\s*([^)]+?)\s*\)/g)) acs.push({ ac: `AC-${m[1]}`, atom: m[2].trim() });
  return { id, acs };
}

function init() {
  const specsDir = path.join(sg, 'specs');
  const files = fs.existsSync(specsDir) ? fs.readdirSync(specsDir).filter(f => f.endsWith('.md')) : [];
  const g = { version: '3.0.0', project: path.basename(root), updatedAt: new Date().toISOString(), nodes: [], edges: [] };
  for (const f of files) {
    const { id, acs } = parseSpecACs(path.join(specsDir, f));
    for (const { ac, atom } of acs) {
      g.nodes.push(
        { id: atom, kind: 'spec_atom', spec: id, ac, status: 'open', title: `${id} ${ac}` },
        { id: atom + '.task', kind: 'task', spec: id, ac, status: 'open', dependsOn: [atom] },
        { id: atom + '.code', kind: 'code', spec: id, ac, status: 'open', paths: [] },
        { id: atom + '.test', kind: 'test', spec: id, ac, status: 'open', paths: [], cmd: '' },
        { id: atom + '.ev', kind: 'evidence', spec: id, ac, status: 'open', cmd: '', exit: null, hashes: {}, log: '' },
      );
      g.edges.push(
        { from: atom + '.task', to: atom, rel: 'derives_from' },
        { from: atom + '.code', to: atom + '.task', rel: 'implements' },
        { from: atom + '.test', to: atom, rel: 'covers' },
        { from: atom + '.ev', to: atom + '.test', rel: 'verifies' },
      );
    }
  }
  save(g);
  console.log(`graph init: ${g.nodes.length} nodes from ${files.length} specs`);
}

function status() {
  const g = load();
  const by = {};
  for (const n of g.nodes) { by[n.status] = (by[n.status] || 0) + 1; }
  const atoms = g.nodes.filter(n => n.kind === 'spec_atom');
  const done = atoms.filter(n => n.status === 'verified').length;
  const stale = [];
  for (const n of g.nodes.filter(n => n.kind === 'evidence' && n.status === 'verified')) {
    const cur = hashPaths(Object.keys(n.hashes || {}));
    for (const k of Object.keys(cur)) if (cur[k] !== n.hashes[k]) { stale.push(n.id); break; }
  }
  console.log(JSON.stringify({ total: g.nodes.length, byStatus: by, atoms: `${done}/${atoms.length}`, staleEvidence: stale, openAtoms: atoms.filter(n => n.status !== 'verified' && n.status !== 'waived').map(n => n.id) }, null, 2));
}

const KIND_ORDER = { spec_atom: 0, task: 1, code: 2, test: 3, evidence: 4 };
function open() {
  const g = load();
  const cand = g.nodes.filter(n => n.status === 'open').sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.id < b.id ? -1 : 1));
  if (!cand.length) { console.log('GRAPH-CLOSED: zero open nodes'); return; }
  console.log(JSON.stringify(cand[0], null, 2));
}

function verify(atomId, cmd, extraPaths) {
  const g = load();
  const ev = g.nodes.find(n => n.id === atomId + '.ev' || n.id === atomId);
  if (!ev) { console.error(`unknown atom ${atomId}`); process.exit(1); }
  const evNode = ev.kind === 'evidence' ? ev : g.nodes.find(n => n.id === atomId + '.ev');
  const testNode = g.nodes.find(n => n.id === atomId + '.test' || (atomId.endsWith('.test') && n.id === atomId));
  const paths = [...new Set([...(testNode?.paths || []), ...(extraPaths || [])])];
  let exit = 0, out = '';
  try { out = execSync(cmd, { cwd: root, stdio: 'pipe', timeout: 600000 }).toString().slice(-4000); }
  catch (e) { exit = e.status ?? 1; out = ((e.stdout || '') + '' + (e.stderr || '')).slice(-4000); }
  evNode.cmd = cmd; evNode.exit = exit; evNode.log = out; evNode.hashes = hashPaths(paths);
  evNode.status = exit === 0 ? 'verified' : 'open';
  evNode.verifiedAt = new Date().toISOString();
  if (exit === 0 && testNode) { testNode.status = 'verified'; testNode.cmd = cmd; }
  if (exit === 0) {
    const base = atomId.replace(/\.(ev|test)$/, '');
    for (const n of g.nodes.filter(n => n.id === base || n.id === base + '.task' || n.id === base + '.code')) n.status = 'verified';
  }
  save(g);
  console.log(JSON.stringify({ atom: atomId, exit, status: evNode.status }, null, 2));
  process.exit(exit === 0 ? 0 : 1);
}

function reopen(atomId, reason) {
  const g = load();
  const base = atomId.replace(/\.(ev|test|task|code)$/, '');
  for (const n of g.nodes.filter(n => n.id === base || n.id.startsWith(base + '.'))) {
    if (n.status === 'verified') { n.status = 'open'; n.reopenedReason = reason; n.reopenedAt = new Date().toISOString(); }
  }
  save(g);
  console.log(`reopened ${base}* — ${reason}`);
}

const [, , cmd, ...rest] = process.argv;
if (cmd === 'init') init();
else if (cmd === 'status') status();
else if (cmd === 'open') open();
else if (cmd === 'verify') {
  const ci = rest.indexOf('--cmd');
  const pi = rest.indexOf('--paths');
  verify(rest[0], ci >= 0 ? rest[ci + 1] : '', pi >= 0 ? rest[pi + 1].split(',') : []);
}
else if (cmd === 'reopen') reopen(rest[0], rest.slice(rest.indexOf('--reason') + 1).join(' ') || 'manual');
else { console.error('usage: init|status|open|verify <atom> --cmd "<cmd>" [--paths a,b]|reopen <atom> --reason ...'); process.exit(2); }
