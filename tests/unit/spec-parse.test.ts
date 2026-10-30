// Domains metadata parsing + ledger agreement (SPEC-014.AC-001 follow-up).
//
// Regression coverage:
//   A an EMPTY `- Domains:` line must parse to [] — it must NOT swallow the
//     next markdown line (a `\s*` in the regex spanned the newline and
//     produced domains like ["##","Goal"]),
//   B every spec file declares exactly one `- Domains:` line,
//   C the ledger's spec_atom domains equal what the spec files parse to, so
//     `graph.mjs init` reproduces the ledger instead of dropping the tags.
//
// NOTE (toolchain quirk): `.spec-graph/ops/*.mjs` must NOT be imported into the
// vitest worker (vite's transform pipeline stalls) — the pure parser is
// exercised through the plain-node probe script instead.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '../..');
const SPECS_DIR = path.join(ROOT, '.spec-graph', 'specs');
const PROBE = path.join(ROOT, 'scripts', 'spec-parse-probe.mjs');
const specFiles = fs.readdirSync(SPECS_DIR).filter((f) => f.endsWith('.md'));

const probe = (file: string) => JSON.parse(execSync(`node "${PROBE}" "${file}"`, { encoding: 'utf8' }));

describe('parseSpecACs domains parsing', () => {
  it('an empty Domains line yields no domains (no newline swallowing)', () => {
    const fixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-parse-')), 'SPEC-999-fixture.md');
    fs.writeFileSync(
      fixture,
      ['# SPEC-999: fixture', '- Status: draft', '- Phase: 09', '- Domains:', '', '## Goal', 'nothing here', ''].join('\n')
    );
    expect(probe(fixture).domains).toEqual([]);
  });

  it('parses a comma/space separated Domains list', () => {
    const fixture = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-parse-')), 'SPEC-998-fixture.md');
    fs.writeFileSync(fixture, ['# SPEC-998: fixture', '- Domains: security, perf ux', '', '## Goal', ''].join('\n'));
    expect(probe(fixture).domains).toEqual(['security', 'perf', 'ux']);
  });

  it('every spec file declares exactly one Domains line', () => {
    for (const f of specFiles) {
      const txt = fs.readFileSync(path.join(SPECS_DIR, f), 'utf8');
      const lines = txt.split('\n').filter((l) => /^- Domains:/.test(l));
      expect(lines.length, `${f} must declare exactly one "- Domains:" line`).toBe(1);
    }
  });
});

describe('ledger domains agree with the spec files', () => {
  it('every spec_atom node carries the domains parsed from its spec file', () => {
    const graph = JSON.parse(fs.readFileSync(path.join(ROOT, '.spec-graph', 'graph.json'), 'utf8'));
    const all = JSON.parse(execSync(`node "${PROBE}" --all "${SPECS_DIR}"`, { encoding: 'utf8' })) as Record<
      string,
      { id: string; domains: string[] }
    >;
    const parsed = new Map<string, string[]>();
    for (const { id, domains } of Object.values(all)) {
      parsed.set(id, domains);
      parsed.set(id.split('-').slice(0, 2).join('-'), domains);
    }
    const mismatches: string[] = [];
    for (const n of graph.nodes.filter((x: any) => x.kind === 'spec_atom')) {
      const expected = parsed.get(n.spec);
      if (!expected) {
        mismatches.push(`${n.id}: spec ${n.spec} has no spec file`);
        continue;
      }
      if (JSON.stringify(n.domains || []) !== JSON.stringify(expected)) {
        mismatches.push(`${n.id}: ledger ${JSON.stringify(n.domains || [])} != spec ${JSON.stringify(expected)}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
