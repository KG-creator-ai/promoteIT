// report.mjs — phase/release report + DoD checklist + human sign-off card.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const phase = process.argv[2] || 'PHASE-0X';
const g = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/graph.json'), 'utf8'));
const atoms = g.nodes.filter(n => n.kind === 'spec_atom');
const done = atoms.filter(n => n.status === 'verified').length;
const vd = path.join(root, '.spec-graph/personas/verdicts');
const verdicts = fs.existsSync(vd) ? fs.readdirSync(vd).filter(f => f.startsWith(phase)).map(f => `${f}:${JSON.parse(fs.readFileSync(path.join(vd, f), 'utf8')).verdict}`) : [];

let gate = 'UNKNOWN';
try { execSync('node .spec-graph/ops/gate.mjs', { cwd: root, stdio: 'pipe', timeout: 600000 }); gate = 'PASS'; } catch { gate = 'FAIL'; }
let audit = 'UNKNOWN';
try { execSync('node .spec-graph/ops/claim-audit.mjs', { cwd: root, stdio: 'pipe', timeout: 300000 }); audit = 'PASS'; } catch { audit = 'FAIL'; }

console.log(`# SPEC-GRAPH Report — ${phase}
- Date: ${new Date().toISOString()}
- Graph: ${done}/${atoms.length} atoms verified (${atoms.length ? Math.round(100 * done / atoms.length) : 0}%)
- Open atoms: ${atoms.filter(n => n.status !== 'verified' && n.status !== 'waived').map(n => n.id).join(', ') || 'NONE'}
- Gate: ${gate} | Claim-audit: ${audit}
- Verdicts: ${verdicts.join(' | ') || 'none recorded'}
## DoD checklist
- [${done === atoms.length && atoms.length ? 'x' : ' '}] 0 open/blocked atoms
- [${gate === 'PASS' ? 'x' : ' '}] gate.mjs PASS
- [${audit === 'PASS' ? 'x' : ' '}] claim-audit.mjs PASS
- [ ] 6/6 persona approvals recorded for ${phase}
${phase === 'PHASE-01' ? '\n## HUMAN SIGN-OFF #1 REQUESTED\nReview .spec-graph/ROADMAP.md + specs/*.md. Reply APPROVED or list changes.\n' : ''}
`);
