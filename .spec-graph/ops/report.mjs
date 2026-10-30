// report.mjs — phase/release report + DoD checklist + human sign-off card.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { requiredFor } from './quorum.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const phase = process.argv[2] || 'PHASE-0X';
const g = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/graph.json'), 'utf8'));
const atoms = g.nodes.filter(n => n.kind === 'spec_atom');
const done = atoms.filter(n => n.status === 'verified').length;
const vd = path.join(root, '.spec-graph/personas/verdicts');
const phaseKey = phase.toLowerCase().startsWith('phase-') ? phase.toLowerCase() : `phase-${phase.toLowerCase().replace(/^ph-?/, '')}`;
const verdictFiles = fs.existsSync(vd) ? fs.readdirSync(vd).filter(f => f.startsWith(phaseKey) && f.endsWith('.json')) : [];
const verdictData = verdictFiles.map(f => JSON.parse(fs.readFileSync(path.join(vd, f), 'utf8')));
const verdicts = verdictFiles.map((f, i) => `${f}:${verdictData[i].verdict}`);

// Tiered quorum (SPEC-014): required = core6 + domain-mapped personas of the
// phase's specs (from the verdicts' `specs` fields). Phases without `specs`
// resolve to core6 (backward compat).
const phaseSpecs = [...new Set(verdictData.flatMap(v => v.specs || []))];
const { required, domains } = requiredFor(g, phaseSpecs);
const approved = new Set(verdictData.filter(v => v.verdict === 'approve').map(v => v.persona));
const missingApprovers = required.filter(p => !approved.has(p));
const quorumOk = required.length > 0 && missingApprovers.length === 0;

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
- Quorum: ${approved.size}/${required.length} approvals required (${required.join(', ')}${domains.length ? ` — domains: ${domains.join(', ')}` : ''})
## DoD checklist
- [${done === atoms.length && atoms.length ? 'x' : ' '}] 0 open/blocked atoms
- [${gate === 'PASS' ? 'x' : ' '}] gate.mjs PASS
- [${audit === 'PASS' ? 'x' : ' '}] claim-audit.mjs PASS
- [${quorumOk ? 'x' : ' '}] tiered quorum approvals recorded for ${phase}${missingApprovers.length ? ` (missing: ${missingApprovers.join(', ')})` : ''}
${phase === 'PHASE-01' ? '\n## HUMAN SIGN-OFF #1 REQUESTED\nReview .spec-graph/ROADMAP.md + specs/*.md. Reply APPROVED or list changes.\n' : ''}
`);
