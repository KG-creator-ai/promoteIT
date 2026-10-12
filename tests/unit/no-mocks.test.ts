import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// SPEC-008/012 honesty guard: product views must not ship mock data generators.
describe('no mock data in product views', () => {
  it('AudioStudio has no Math.random in its render path', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/audio/AudioStudio.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/Math\.random/);
  });
});
