// dep-audit.mjs — dependency audit with ADR-pinned allowlist (SPEC-015.AC-001).
// Runs FULL `npm audit --json` (dev tools included: build/test tooling touches
// network + runs in CI) and FAILs on any advisory NOT in ALLOWLIST.
// Allowlist entries cite the ADR + rationale; resolved advisories are REMOVED
// so the list stays regression-sensitive (D18).
import { execSync } from 'child_process';

const ALLOWLIST = {
  // D18: deepmerge (low) via vite-plugin-pwa→workbox-build chain — build-time
  // only, never shipped; upstream fix requires breaking vite-plugin-pwa@0.2.1
  // downgrade. Re-triage when vite-plugin-pwa ships a non-breaking path.
  'GHSA-gcqx-w48m-w2h4': { adr: 'D18', reason: 'dev/build chain (vite-plugin-pwa/workbox); breaking-fix only' },
};

let audit;
try {
  audit = JSON.parse(execSync('npm audit --json', { encoding: 'utf8', timeout: 300000, stdio: ['ignore', 'pipe', 'pipe'] }));
} catch (e) {
  // npm audit exits non-zero when vulnerabilities exist — output still parses
  try { audit = JSON.parse((e.stdout || '').toString()); }
  catch { console.log('DEP-AUDIT FAIL — npm audit did not return parseable JSON'); process.exit(1); }
}

const unknown = [];
const vulns = audit.vulnerabilities || {};
for (const [name, v] of Object.entries(vulns)) {
  const urls = [];
  const collect = (node) => {
    for (const via of node.via || []) {
      if (typeof via === 'string') { if (vulns[via]) collect(vulns[via]); }
      else if (via && via.url) urls.push(via.url);
    }
  };
  collect(v);
  const ids = [...new Set(urls.map(u => (u.match(/GHSA-[a-z0-9-]+/i) || [])[0]).filter(Boolean))];
  const unlisted = ids.filter(id => !ALLOWLIST[id.toLowerCase()] && !ALLOWLIST[id.toUpperCase()] && !Object.keys(ALLOWLIST).some(k => k.toLowerCase() === id.toLowerCase()));
  if (unlisted.length) unknown.push(`${name}: ${unlisted.join(', ')}`);
}

if (unknown.length) {
  console.log(`DEP-AUDIT FAIL — ${unknown.length} unallowlisted advisories:`);
  for (const u of unknown) console.log(' - ' + u);
  process.exit(1);
}
console.log(`DEP-AUDIT PASS — advisories all allowlisted (${Object.keys(ALLOWLIST).length} pinned by ADR)`);
