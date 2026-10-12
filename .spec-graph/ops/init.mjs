// init.mjs — project-agnostic bootstrap. Detects toolchain, writes local-profile.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sg = path.join(root, '.spec-graph');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const hasBin = (n) => fs.existsSync(path.join(root, 'node_modules/.bin', n)) || fs.existsSync(path.join(root, 'node_modules/.bin', n + '.cmd'));
const hasDep = (d) => Boolean((pkg.dependencies && pkg.dependencies[d]) || (pkg.devDependencies && pkg.devDependencies[d]));
const hasFile = (p) => fs.existsSync(path.join(root, p));

const bin = (name, fallback) => hasBin(name) ? `./node_modules/.bin/${name}` : fallback;

// Per AGENTS.md: npm on PATH may be Windows-only while shims are POSIX — prefer direct binaries.
const profile = {
  project: pkg.name || path.basename(root),
  generatedAt: new Date().toISOString(),
  toolchain: {
    node: true,
    typescript: hasDep('typescript'),
    vite: hasDep('vite'),
    vitest: hasDep('vitest'),
    react: hasDep('react'),
    dexie: hasDep('dexie'),
  },
  gates: {
    typecheck: hasDep('typescript') ? `${bin('tsc', 'npx tsc')} --noEmit` : null,
    test: hasDep('vitest') ? `${bin('vitest', 'npx vitest')} run` : null,
    build: hasDep('vite') ? `${bin('vite', 'npx vite')} build` : null,
    audit: hasFile('scripts/visual-audit.wsl.mjs') ? `node scripts/visual-audit.wsl.mjs` : null,
  },
  paths: { graph: '.spec-graph/graph.json', verdicts: '.spec-graph/personas/verdicts' },
};

fs.writeFileSync(path.join(sg, 'local-profile.json'), JSON.stringify(profile, null, 2));
console.log(JSON.stringify(profile, null, 2));
console.log('\nWrote .spec-graph/local-profile.json');
