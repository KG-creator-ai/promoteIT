// spec-parse.mjs — pure spec-file parser (no CLI side effects; import-safe).
// Parses AC lines + the `- Domains:` metadata line (schema v3.1.0, SPEC-014).
import fs from 'fs';
import path from 'path';

export function parseSpecACs(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const id = path.basename(file, '.md');
  const acs = [];
  const dm = txt.match(/^- Domains:[ \t]*(.*)$/m);
  const domains = dm ? dm[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean) : [];
  for (const line of txt.split('\n')) {
    if (!/^- \[[ x]\] AC-\d+/.test(line)) continue;
    const m = line.match(/AC-(\d+)\s*\(\s*([^)]+?)\s*\)/);
    if (m) acs.push({ ac: `AC-${m[1]}`, atom: m[2].trim() });
  }
  return { id, acs, domains };
}
