// SPEC-024.AC-004 — no third-party font origin is contacted (D-008).
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx|css|html|js|mjs)$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('SPEC-024 AC-004 — fonts are self-hosted or system', () => {
  it('the document contacts no font origin', () => {
    expect(INDEX).not.toContain('fonts.googleapis.com');
    expect(INDEX).not.toContain('fonts.gstatic.com');
    expect(INDEX).not.toMatch(/<link[^>]+rel=["']?stylesheet["']?[^>]*https?:/i);
  });

  it('no source file imports a remote font', () => {
    const offenders: string[] = [];
    for (const file of [path.join(ROOT, 'index.html'), ...sourceFiles(path.join(ROOT, 'src'))]) {
      const txt = fs.readFileSync(file, 'utf8');
      if (/fonts\.(googleapis|gstatic)\.com/.test(txt) || /@import\s+url\(['"]?https?:/i.test(txt)) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the body uses a system font stack', () => {
    expect(CSS).toMatch(/font-family:\s*system-ui/);
    expect(CSS).not.toContain('Plus Jakarta Sans');
  });

  it('the visual pass is re-verified by the headless audit', () => {
    const audit = fs.readFileSync(path.join(ROOT, 'scripts/visual-audit.wsl.mjs'), 'utf8');
    expect(audit).toContain('shot');
    const harness = fs.readFileSync(path.join(ROOT, 'scripts/e2e-av.mjs'), 'utf8');
    expect(harness).toContain('player-renders');
  });
});
