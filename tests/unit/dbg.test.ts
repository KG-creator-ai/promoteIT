import { it, expect } from 'vitest';
import { parseSpecACs } from '../../.spec-graph/ops/spec-parse.mjs';
it('imports parser', () => { expect(typeof parseSpecACs).toBe('function'); });
