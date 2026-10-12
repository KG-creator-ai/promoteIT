import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // NOTE: unit tests run in node env (no DOM needed: pure logic + WebCrypto).
    // Component tests use `// @vitest-environment jsdom` per-file and require
    // Node >= 22 locally (jsdom30/undici8 needs worker_threads.markAsUncloneable).
    // CI pins Node 22 so both run there.
    environment: 'node',
    setupFiles: [],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
