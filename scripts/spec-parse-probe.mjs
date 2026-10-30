// spec-parse-probe.mjs — invoke the pure spec parser in a plain node process
// (vitest workers can't import .spec-graph/ops modules — vite transform stall).
// Usage: node scripts/spec-parse-probe.mjs <spec-file>   → prints parser JSON.
//        node scripts/spec-parse-probe.mjs --all [dir]   → parses every *.md in dir.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));
const parser = await import(pathToFileURL(path.resolve(here, '../.spec-graph/ops/spec-parse.mjs')).href);

if (process.argv[2] === '--all') {
  const dir = path.resolve(process.argv[3] || path.resolve(here, '../.spec-graph/specs'));
  const out = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    out[f] = parser.parseSpecACs(path.join(dir, f));
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/spec-parse-probe.mjs <spec-file> | --all [dir]'); process.exit(2); }
console.log(JSON.stringify(parser.parseSpecACs(file)));
