// gate.mjs — runs the gate chain → JSON verdict. Exit 0 ONLY if ALL gates pass.
// Usage: node gate.mjs [--full]   (--full includes vite build + visual audit smoke)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const profile = JSON.parse(fs.readFileSync(path.join(root, '.spec-graph/local-profile.json'), 'utf8'));
const FULL = process.argv.includes('--full');
const results = [];

function run(name, cmd, opts = {}) {
  if (!cmd) { results.push({ name, status: 'skip', reason: 'no command in profile' }); return; }
  try {
    const out = execSync(cmd, { cwd: root, stdio: 'pipe', timeout: opts.timeout || 600000 }).toString();
    results.push({ name, status: 'pass', tail: out.trim().split('\n').slice(-5).join('\n') });
  } catch (e) {
    results.push({ name, status: 'fail', tail: (((e.stdout || '') + '' + (e.stderr || '')) || e.message).trim().split('\n').slice(-15).join('\n') });
  }
}

function secretScan() {
  // Release-gate secret scan: tracked files must not contain live secrets.
  const out = execSync('git ls-files | head -500', { cwd: root }).toString().trim().split('\n').filter(Boolean);
  const pats = [/sk-[A-Za-z0-9]{10,}/, /AIza[0-9A-Za-z_-]{20,}/, /-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----/, /xox[bap]-/, /ghp_[A-Za-z0-9]{20,}/];
  const hits = [];
  for (const f of out) {
    if (f.startsWith('.git/') || f === '.env' || f.startsWith('.env.')) continue;
    if (/\.(png|jpg|ico|mp4|woff2?|pbtxt)$/.test(f)) continue;
    let txt = '';
    try { txt = fs.readFileSync(path.join(root, f), 'utf8'); } catch { continue; }
    for (const p of pats) if (p.test(txt)) hits.push(`${f}:${p}`);
  }
  // .env must never be tracked
  try { execSync('git ls-files --error-unmatch .env', { cwd: root, stdio: 'pipe' }); hits.push('.env:tracked'); } catch { /* good */ }
  results.push(hits.length ? { name: 'secret-scan', status: 'fail', tail: hits.join('\n') } : { name: 'secret-scan', status: 'pass' });
}

run('typecheck', profile.gates.typecheck, { timeout: 300000 });
run('test', profile.gates.test, { timeout: 600000 });
secretScan();
if (FULL) {
  run('build', profile.gates.build, { timeout: 600000 });
  if (profile.gates.audit && process.env.RUN_AUDIT === '1') run('visual-audit', profile.gates.audit, { timeout: 600000 });
  else results.push({ name: 'visual-audit', status: 'skip', reason: 'set RUN_AUDIT=1 with dev server + Chrome to include' });
}

const failed = results.filter(r => r.status === 'fail');
console.log(JSON.stringify({ verdict: failed.length ? 'FAIL' : 'PASS', results }, null, 2));
process.exit(failed.length ? 1 : 0);
