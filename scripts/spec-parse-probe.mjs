// spec-parse-probe.mjs — invoke the pure spec parser in a plain node process
// (vitest workers can't import .spec-graph/ops modules — vite transform stall).
// Usage: node scripts/spec-parse-probe.mjs <spec-file>   → prints parser JSON.
import path from 'path';
import { pathToFileURL } from 'url';

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/spec-parse-probe.mjs <spec-file>'); process.exit(2); }
const parser = await import(pathToFileURL(path.resolve(import.meta.dirname, '../.spec-graph/ops/spec-parse.mjs')).href);
console.log(JSON.stringify(parser.parseSpecACs(file)));
