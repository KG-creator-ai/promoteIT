// budget.mjs — bundle ratchet (SPEC-015.AC-002). Fails on growth beyond
// .spec-graph/budgets.json. Run after `vite build` (gate --full, CI).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgets = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/budgets.json'), 'utf8'));
const dir = path.join(root, 'dist/assets');
const problems = [];

if (!fs.existsSync(dir)) { console.log('BUDGET FAIL — dist/assets missing (run vite build first)'); process.exit(1); }

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let total = 0;
for (const f of files) {
  const size = fs.statSync(path.join(dir, f)).size;
  total += size;
  const rule = budgets.js.find(r => new RegExp(r.pattern).test(f));
  if (!rule) {
    if (size > budgets.unlistedJsWarnBytes) problems.push(`UNLISTED chunk ${f} (${size}B) — add a budget rule or split intentionally`);
    continue;
  }
  if (size > rule.maxBytes) problems.push(`OVER BUDGET ${rule.label} ${f}: ${size}B > ${rule.maxBytes}B`);
  else console.log(`ok ${rule.label} ${f}: ${size}B / ${rule.maxBytes}B`);
}
if (total > budgets.totalJsMaxBytes) problems.push(`TOTAL JS ${total}B > ${budgets.totalJsMaxBytes}B`);
else console.log(`ok total JS: ${total}B / ${budgets.totalJsMaxBytes}B`);

if (problems.length) { console.log(`BUDGET FAIL — ${problems.length} problem(s):`); for (const p of problems) console.log(' - ' + p); process.exit(1); }
console.log('BUDGET PASS');
