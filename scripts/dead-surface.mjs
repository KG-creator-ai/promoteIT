#!/usr/bin/env node
// dead-surface.mjs — method-level dead-code scan (SPEC-020.AC-003).
//
// The module-level orphan scan (SPEC-012) cannot see a public method or a
// local callback that nothing calls. This scanner reports both kinds:
//
//   node scripts/dead-surface.mjs            # scan the configured targets
//   node scripts/dead-surface.mjs --json     # machine-readable output
//
// A member is ALIVE when it is called from another file under src/ or via
// `this.<name>(` inside its own file. Anything else is dead surface and must
// be wired or removed. Exit 1 when dead surface exists.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');

const TARGETS = [
  { file: 'src/services/audioEngine.ts', kind: 'public-method' },
  { file: 'src/components/studio/AVVideoPlayer.tsx', kind: 'use-callback' },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function membersOf(file, kind) {
  const txt = fs.readFileSync(file, 'utf8');
  const names = new Set();
  if (kind === 'public-method') {
    for (const m of txt.matchAll(/^\s*public\s+([A-Za-z0-9_]+)\s*\(/gm)) names.add(m[1]);
  } else {
    for (const m of txt.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*useCallback\b/g)) names.add(m[1]);
  }
  return [...names];
}

function isUsed(name, file, allFiles, kind) {
  const own = fs.readFileSync(file, 'utf8');
  if (new RegExp(`this\\.${name}\\s*\\(`).test(own)) return true;
  for (const other of allFiles) {
    if (other === file) continue;
    const txt = fs.readFileSync(other, 'utf8');
    if (new RegExp(`\\.${name}\\s*\\(`).test(txt)) return true;
  }
  // Same-file bare calls (`seekTo(0)`) count as usage; the definition itself
  // (`public name(`) does not.
  const bare = (own.match(new RegExp(`(?<![.\\w])${name}\\s*\\(`, 'g')) || []).length;
  const definition = kind === 'public-method' && new RegExp(`public\\s+${name}\\s*\\(`).test(own) ? 1 : 0;
  return bare > definition;
}

const allFiles = walk(SRC);
const dead = [];
for (const target of TARGETS) {
  const file = path.join(root, target.file);
  if (!fs.existsSync(file)) { dead.push({ file: target.file, member: '(file missing)', reason: 'target file not found' }); continue; }
  for (const name of membersOf(file, target.kind)) {
    if (!isUsed(name, file, allFiles, target.kind)) dead.push({ file: target.file, member: name, reason: 'no call site in src/' });
  }
}

const out = { scanned: TARGETS.map(t => t.file), deadSurface: dead, verdict: dead.length ? 'FAIL' : 'PASS' };
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 2));
} else if (dead.length) {
  console.log(`DEAD-SURFACE FAIL — ${dead.length} unused member(s):`);
  for (const d of dead) console.log(` - ${d.file}: ${d.member} (${d.reason})`);
} else {
  console.log(`DEAD-SURFACE PASS — no unused public methods or callbacks in ${TARGETS.length} target(s)`);
}
process.exit(dead.length ? 1 : 0);
