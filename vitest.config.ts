import path from 'path';
import { defineConfig } from 'vitest/config';

// jsdom 30 / undici 8 require worker_threads.markAsUncloneable (Node >= 22).
// On older Node (e.g. WSL Node 20 here), run unit tests only and skip component
// tests with a warning instead of failing. CI pins Node 22 so both run there.
const NODE_MAJOR = Number(process.version.slice(1).split('.')[0]);
const JSDOM_OK = NODE_MAJOR >= 22;
if (!JSDOM_OK) console.warn(`[vitest] Node ${process.version}: running tests/unit only (component tests need Node >= 22)`);

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: JSDOM_OK ? ['tests/**/*.test.{ts,tsx}'] : ['tests/unit/**/*.test.{ts,tsx}'],
    // Several suites exercise the real harness CLIs as node subprocesses
    // (quorum/decision-gate/graph) — a cold node start plus git probes takes
    // longer than vitest's 5s default and flakes under parallel load.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
