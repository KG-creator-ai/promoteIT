// e2e-assert.mjs — D11-aware E2E evidence checks.
// Real assertions when audit-artifacts/ exist (local Chrome runs); explicit
// E2E-ARTIFACTS-ABSENT exit-0 otherwise (CI checkouts never have them).
// Usage: node scripts/e2e-assert.mjs <leg NAME | webm | manifest | no-page-errors>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'audit-artifacts', 'manifest.json');
const WEBM = path.join(root, 'audit-artifacts', '14_export_preview.webm');

function absent(what) {
  console.log(`E2E-ARTIFACTS-ABSENT: no ${what} (local-Chrome-only evidence; see CERTIFICATION.md L2)`);
  process.exit(0);
}

const [, , cmd, arg] = process.argv;
if (!fs.existsSync(MANIFEST) && cmd !== 'webm') absent('manifest.json');

if (cmd === 'leg') {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const hit = m.legs.find(l => l.leg === arg && l.ok);
  if (!hit) { console.error(`E2E leg '${arg}' not green`); process.exit(1); }
  console.log(`E2E-LEG-OK ${arg} — ${hit.detail || ''}`);
} else if (cmd === 'webm') {
  if (!fs.existsSync(WEBM)) absent('export webm');
  const buf = fs.readFileSync(WEBM);
  const hasVideo = buf.includes(Buffer.from('V_VP9')) || buf.includes(Buffer.from('V_VP8')) || buf.includes(Buffer.from('V_AV1'));
  const hasAudio = buf.includes(Buffer.from('A_OPUS')) || buf.includes(Buffer.from('A_VORBIS'));
  if (buf.length < 20000 || !hasVideo || !hasAudio) {
    console.error(`WEAK-EXPORT bytes=${buf.length} video=${hasVideo} audio=${hasAudio}`);
    process.exit(1);
  }
  console.log(`WEBM-AV-OK bytes=${buf.length} video=${hasVideo} audio=${hasAudio}`);
} else if (cmd === 'manifest') {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const bad = (m.artifacts || []).filter(a => !(a.bytes > 0));
  if (bad.length) { console.error('EMPTY-ARTIFACTS ' + bad.map(a => a.file).join(',')); process.exit(1); }
  console.log(`MANIFEST-OK artifacts=${m.artifacts.length} legs=${m.legs.filter(l => l.ok).length}/${m.legs.length}`);
} else if (cmd === 'no-page-errors') {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  if ((m.pageErrors || []).length) { console.error('PAGE-ERRORS ' + JSON.stringify(m.pageErrors.slice(0, 3))); process.exit(1); }
  console.log('NO-PAGE-ERRORS-OK');
} else {
  console.error('usage: leg NAME | webm | manifest | no-page-errors');
  process.exit(2);
}
