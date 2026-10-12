import { describe, it, expect } from 'vitest';
import { formatBytes } from '../../src/lib/storage';

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats kilobytes and megabytes', () => {
    expect(formatBytes(1024)).toMatch(/1(\.0)?\s?KB/);
    expect(formatBytes(1024 * 1024)).toMatch(/1(\.0)?\s?MB/);
  });

  it('formats gigabytes with two decimals', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });
});
