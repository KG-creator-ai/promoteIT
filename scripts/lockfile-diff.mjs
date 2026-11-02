#!/usr/bin/env node
/**
 * lockfile-diff.mjs — dependency delta between releases (D-010, SPEC-024.AC-006).
 *
 *   node scripts/lockfile-diff.mjs [--base <git-ref>] [--json] [--out <file>]
 *
 * The release process pins package-lock.json and CI runs `npm ci`, but nothing
 * used to diff the lockfile against the previously released one. This emits the
 * delta (added / removed / updated packages) so the release report can carry
 * it. The base defaults to the most recent tag.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argValue = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const LOCKFILE = 'package-lock.json';

function git(args, allowFail = false) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

function readLockfile(text) {
  const data = JSON.parse(text);
  const packages = data.packages || {};
  const out = new Map();
  for (const [pathKey, meta] of Object.entries(packages)) {
    if (!pathKey.startsWith('node_modules/')) continue;
    const name = pathKey.slice('node_modules/'.length);
    if (!meta || !meta.version) continue;
    out.set(name, meta.version);
  }
  return out;
}

function currentBase() {
  const explicit = argValue('--base', null);
  if (explicit) return explicit;
  return git(['describe', '--tags', '--abbrev=0'], true);
}

/**
 * @returns {{base: string, added: {name: string, version: string}[], removed: {name: string, version: string}[], updated: {name: string, from: string, to: string}[], unchanged: number}}
 */
export function diffLockfiles(baseText, currentText, base = 'base') {
  const before = readLockfile(baseText);
  const after = readLockfile(currentText);
  const added = [];
  const removed = [];
  const updated = [];
  let unchanged = 0;

  for (const [name, version] of after) {
    if (!before.has(name)) added.push({ name, version });
    else if (before.get(name) !== version) updated.push({ name, from: before.get(name), to: version });
    else unchanged++;
  }
  for (const [name, version] of before) {
    if (!after.has(name)) removed.push({ name, version });
  }

  added.sort((a, b) => a.name.localeCompare(b.name));
  removed.sort((a, b) => a.name.localeCompare(b.name));
  updated.sort((a, b) => a.name.localeCompare(b.name));

  return { base, added, removed, updated, unchanged };
}

export function renderMarkdown(diff) {
  const lines = [
    '## Dependency delta (lockfile diff)',
    '',
    `- Base: \`${diff.base}\``,
    `- Added: ${diff.added.length} · Removed: ${diff.removed.length} · Updated: ${diff.updated.length} · Unchanged: ${diff.unchanged}`,
    '',
  ];
  if (diff.added.length) {
    lines.push('### Added', '');
    for (const p of diff.added) lines.push(`- \`${p.name}\` @ ${p.version}`);
    lines.push('');
  }
  if (diff.removed.length) {
    lines.push('### Removed', '');
    for (const p of diff.removed) lines.push(`- \`${p.name}\` @ ${p.version}`);
    lines.push('');
  }
  if (diff.updated.length) {
    lines.push('### Updated', '');
    for (const p of diff.updated) lines.push(`- \`${p.name}\` ${p.from} → ${p.to}`);
    lines.push('');
  }
  if (!diff.added.length && !diff.removed.length && !diff.updated.length) {
    lines.push('No dependency changes since the base.', '');
  }
  return lines.join('\n');
}

function main() {
  const base = currentBase();
  if (!base) {
    console.log('LOCKFILE-DIFF-ABSENT — no base tag to diff against (nothing to compare)');
    return;
  }
  const baseText = git(['show', `${base}:${LOCKFILE}`], true);
  if (!baseText) {
    console.log(`LOCKFILE-DIFF-ABSENT — ${base} has no ${LOCKFILE} to diff against`);
    return;
  }
  const currentText = fs.readFileSync(path.join(root, LOCKFILE), 'utf8');
  const diff = diffLockfiles(baseText, currentText, base);
  const md = renderMarkdown(diff);

  const out = argValue('--out', null);
  if (out) {
    fs.writeFileSync(path.resolve(root, out), md + '\n');
    console.log(`LOCKFILE-DIFF-WRITTEN: ${path.relative(root, path.resolve(root, out))}`);
  }
  if (argv.includes('--json')) console.log(JSON.stringify(diff, null, 2));
  else console.log(md);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
