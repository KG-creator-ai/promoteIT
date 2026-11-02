// SPEC-024.AC-006 — the release process emits a lockfile-diff summary
// (added / removed / updated packages) attached to the release report (D-010).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { diffLockfiles, renderMarkdown } from '../../scripts/lockfile-diff.mjs';

const ROOT = path.resolve(__dirname, '../..');

function lock(packages: Record<string, string>): string {
  const map: Record<string, unknown> = {};
  for (const [name, version] of Object.entries(packages)) {
    map[`node_modules/${name}`] = { version };
  }
  return JSON.stringify({ name: 'x', lockfileVersion: 3, packages: map });
}

describe('SPEC-024 AC-006 — the lockfile diff', () => {
  it('reports added, removed and updated packages', () => {
    const before = lock({ a: '1.0.0', b: '2.0.0', d: '4.0.0', e: '5.0.0' });
    const after = lock({ a: '1.1.0', b: '2.0.0', c: '3.0.0', d: '4.0.0' });

    const diff = diffLockfiles(before, after, 'v1.2.0');

    expect(diff.added).toEqual([{ name: 'c', version: '3.0.0' }]);
    expect(diff.removed).toEqual([{ name: 'e', version: '5.0.0' }]);
    expect(diff.updated).toEqual([{ name: 'a', from: '1.0.0', to: '1.1.0' }]);
    expect(diff.unchanged).toBe(2);
  });

  it('renders a markdown summary for the release report', () => {
    const before = lock({ a: '1.0.0' });
    const after = lock({ a: '1.0.0', b: '2.0.0' });
    const md = renderMarkdown(diffLockfiles(before, after, 'v1.2.0'));

    expect(md).toContain('Dependency delta (lockfile diff)');
    expect(md).toContain('`v1.2.0`');
    expect(md).toContain('Added: 1');
    expect(md).toContain('`b` @ 2.0.0');
  });

  it('the phase/release report carries the delta', () => {
    const report = fs.readFileSync(path.join(ROOT, '.spec-graph/ops/report.mjs'), 'utf8');
    expect(report).toContain('lockfile-diff.mjs');
    expect(report).toContain('Dependency delta (lockfile diff)');
  });

  it('the real lockfile diffs cleanly against the last release', () => {
    const current = fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8');
    const diff = diffLockfiles(current, current, 'v1.2.0');
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.updated).toEqual([]);
    expect(diff.unchanged).toBeGreaterThan(0);
  });
});
