// orphan-scan.mjs — reports src modules with zero importers (wire-or-delete input).
// Usage: node orphan-scan.mjs [--json]   Exit 0 only if zero orphans.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(root, 'src');
const EXCLUDE = [/\.test\./, /\.spec\./, /\.d\.ts$/];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC).filter(f => !EXCLUDE.some(rx => rx.test(f)));
// Candidates exclude entrypoints (main/seed are roots, not orphans) but every
// file — including entrypoints — still counts as a potential importer.
const ENTRY = [/\/main\.tsx$/, /\/seed\.ts$/];
const candidates = files.filter(f => !ENTRY.some(rx => rx.test(f)));
const orphans = [];
for (const f of candidates) {
  const base = path.basename(f).replace(/\.(ts|tsx)$/, '');
  // Extension-tolerant: matches './App', '../db/db', './x.tsx', worker URLs, dynamic imports
  const rx = new RegExp(`['"][^'"]*/${base}(\\.tsx?)?['"\\)]`);
  let imported = false;
  for (const g of files) {
    if (g === f) continue;
    const txt = fs.readFileSync(g, 'utf8');
    if (rx.test(txt) || txt.includes(base + 'Worker')) { imported = true; break; }
  }
  if (!imported) orphans.push(path.relative(root, f));
}

if (process.argv.includes('--json')) console.log(JSON.stringify({ orphans }, null, 2));
else if (orphans.length) { console.log('ORPHANS:\n' + orphans.map(o => '  ' + o).join('\n')); process.exit(1); }
else console.log('ORPHAN-SCAN: zero orphans');
process.exit(orphans.length ? 1 : 0);
