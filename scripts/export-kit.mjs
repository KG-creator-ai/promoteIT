#!/usr/bin/env node
// export-kit.mjs — prove the SPEC-GRAPH kit boots outside this repo (clean-room).
//
//   node scripts/export-kit.mjs            # self-test (default)
//   node scripts/export-kit.mjs --pack DIR # copy kit to DIR for distribution
//
// Self-test: copies .spec-graph/ + .opencode/ + opencode.json into a temp dir
// with a fixture package.json (no dependencies) and a fixture spec, then runs
// the kit's own bootstrap headless: ops/init.mjs, ops/graph.mjs init, ops/graph.mjs status.
// Any missing artifact => exit 1. Success => CLEANROOM-PASS exit 0.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT_DIRS = ['.spec-graph', '.opencode'];
const KIT_FILES = ['opencode.json'];
const EXCLUDE = new Set(['node_modules', '.git', 'local-profile.json', 'graph.json', 'audit-artifacts']);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyKit(target) {
  const missing = [];
  for (const d of KIT_DIRS) {
    const s = path.join(root, d);
    if (!fs.existsSync(s)) { missing.push(d); continue; }
    copyDir(s, path.join(target, d));
  }
  for (const f of KIT_FILES) {
    const s = path.join(root, f);
    if (!fs.existsSync(s)) { missing.push(f); continue; }
    fs.copyFileSync(s, path.join(target, f));
  }
  return missing;
}

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', timeout: 120000 });
}

function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-graph-cleanroom-'));
  console.log(`clean-room fixture: ${tmp}`);
  try {
    const missing = copyKit(tmp);
    if (missing.length) {
      console.error(`CLEANROOM-FAIL — kit artifacts missing: ${missing.join(', ')}`);
      return 1;
    }

    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'kit-cleanroom-fixture', version: '0.0.0', private: true }, null, 2)
    );

    const specDir = path.join(tmp, '.spec-graph', 'specs');
    fs.mkdirSync(specDir, { recursive: true });
    for (const f of fs.readdirSync(specDir)) {
      if (f.endsWith('.md')) fs.rmSync(path.join(specDir, f));
    }
    fs.writeFileSync(
      path.join(specDir, 'SPEC-001-fixture.md'),
      [
        '# SPEC-001: fixture spec',
        '- Status: draft',
        '- Phase: 00',
        '- Owner-persona: po',
        '- Domains: docs',
        '',
        '## Acceptance Criteria',
        '- [ ] AC-001 (SPEC-001.AC-001): the clean-room fixture bootstraps the graph harness.',
        '',
      ].join('\n')
    );

    run(process.execPath, [path.join(tmp, '.spec-graph', 'ops', 'init.mjs')], tmp);
    const profile = path.join(tmp, '.spec-graph', 'local-profile.json');
    if (!fs.existsSync(profile)) {
      console.error('CLEANROOM-FAIL — init.mjs did not write local-profile.json');
      return 1;
    }

    run(process.execPath, [path.join(tmp, '.spec-graph', 'ops', 'graph.mjs'), 'init'], tmp);
    const graphPath = path.join(tmp, '.spec-graph', 'graph.json');
    if (!fs.existsSync(graphPath)) {
      console.error('CLEANROOM-FAIL — graph.mjs init did not write graph.json');
      return 1;
    }
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const atoms = graph.nodes.filter(n => n.kind === 'spec_atom').map(n => n.id);
    if (!atoms.includes('SPEC-001.AC-001')) {
      console.error(`CLEANROOM-FAIL — fixture atom missing from graph: ${JSON.stringify(atoms)}`);
      return 1;
    }
    if (atoms.length !== 1) {
      console.error(`CLEANROOM-FAIL — expected 1 fixture atom, got ${atoms.length}`);
      return 1;
    }

    const statusOut = run(process.execPath, [path.join(tmp, '.spec-graph', 'ops', 'graph.mjs'), 'status'], tmp);
    const status = JSON.parse(statusOut);
    if (status.atoms !== '0/1' || status.openAtoms.length !== 1) {
      console.error(`CLEANROOM-FAIL — unexpected graph status: ${statusOut}`);
      return 1;
    }

    console.log(`CLEANROOM-PASS — init + graph init + status OK (nodes=${graph.nodes.length}, atoms=${status.atoms})`);
    return 0;
  } catch (err) {
    console.error(`CLEANROOM-FAIL — ${err && err.message ? err.message : err}`);
    console.error(`fixture kept for debugging: ${tmp}`);
    return 1;
  } finally {
    if (process.env.KEEP_CLEANROOM !== '1') {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }
    }
  }
}

function pack(destArg) {
  const dest = path.resolve(process.cwd(), destArg);
  const missing = copyKit(dest);
  if (missing.length) {
    console.error(`PACK-FAIL — kit artifacts missing: ${missing.join(', ')}`);
    return 1;
  }
  console.log(`PACKED — kit copied to ${dest}`);
  console.log('Next in the target repo: node .spec-graph/ops/init.mjs');
  return 0;
}

const argv = process.argv.slice(2);
if (argv[0] === '--pack') {
  if (!argv[1]) { console.error('usage: export-kit.mjs --pack DIR'); process.exit(2); }
  process.exit(pack(argv[1]));
}
process.exit(selfTest());
