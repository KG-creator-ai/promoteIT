import { describe, it, expect } from 'vitest';
import { buildArchiveBundle, parseArchiveBundle } from '../../src/lib/archival';

// SPEC-015.AC-004: backup/restore integrity (threat model T2).
const ROWS = [
  { id: 'c1', title: 'One', sceneGraph: [{ id: 's1' }] },
  { id: 'c2', title: 'Two', sceneGraph: [] },
];

describe('archive bundle round-trip', () => {
  it('builds a versioned bundle and parses it back losslessly', () => {
    const bundle = buildArchiveBundle(ROWS);
    expect(bundle.format).toBe('promoteit');
    expect(bundle.version).toBe(1);
    expect(bundle.campaignCount).toBe(2);
    const back = parseArchiveBundle(JSON.stringify(bundle));
    expect(JSON.parse(back.payload)).toEqual(ROWS);
  });

  it('rejects foreign formats', () => {
    expect(() => parseArchiveBundle(JSON.stringify({ format: 'zip', version: 1, campaignCount: 0, payload: '[]' }))).toThrow(/format/);
  });

  it('rejects future versions', () => {
    const b = buildArchiveBundle([]);
    expect(() => parseArchiveBundle(JSON.stringify({ ...b, version: 999 }))).toThrow(/not supported/);
  });

  it('rejects non-array payloads', () => {
    const b = buildArchiveBundle([]);
    expect(() => parseArchiveBundle(JSON.stringify({ ...b, payload: '{"a":1}' }))).toThrow(/not a campaign array/);
  });

  it('rejects count mismatches (truncated/tampered payload)', () => {
    const b = buildArchiveBundle(ROWS);
    const tampered = { ...b, payload: JSON.stringify([ROWS[0]]) };
    expect(() => parseArchiveBundle(JSON.stringify(tampered))).toThrow(/count mismatch/);
  });

  it('rejects malformed JSON outright', () => {
    expect(() => parseArchiveBundle('not json{{{')).toThrow();
  });
});
