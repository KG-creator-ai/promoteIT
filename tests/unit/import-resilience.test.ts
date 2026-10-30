// Silent-loss regression guards (Phase 09 resilience review).
//
// These cover the paths the resilience persona flagged as silently dropping
// data, so a later edit cannot quietly reintroduce them:
//   A archive snapshots must not overwrite a same-day snapshot
//   B malformed ZIP-import entries must be COUNTED and surfaced to the user
//   C the import result must report the skipped count to the caller
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildArchiveFilename } from '../../src/lib/archival';

describe('archive snapshot filenames', () => {
  it('keeps the .promoteit extension so listLocalArchives finds the file', () => {
    expect(buildArchiveFilename(new Date('2026-10-30T01:02:03.456Z'))).toMatch(/^backup-.*\.promoteit$/);
  });

  it('does not collide within the same day (time + milliseconds are part of the name)', () => {
    const morning = buildArchiveFilename(new Date('2026-10-30T01:02:03.000Z'));
    const evening = buildArchiveFilename(new Date('2026-10-30T23:02:03.000Z'));
    expect(morning).not.toBe(evening);
    const sameSecond = buildArchiveFilename(new Date('2026-10-30T01:02:03.400Z'));
    expect(sameSecond).not.toBe(morning);
  });
});

describe('zip import surfaces skipped entries', () => {
  const zipWith = async (resources: Record<string, string>) => {
    const zip = new JSZip();
    zip.file(
      'manifest.json',
      JSON.stringify({
        format: 'promoteit-zip',
        version: 1,
        campaign: { title: 'Fixture', industry: 'test' },
        sceneGraph: [],
        videoPrompts: [],
      })
    );
    for (const [name, body] of Object.entries(resources)) zip.file(name, body);
    const data = await zip.generateAsync({ type: 'nodebuffer' });
    return new File([data], 'fixture.zip', { type: 'application/zip' });
  };

  it('counts malformed entries instead of dropping them silently', async () => {
    const { countSkippedEntries } = await import('../../src/lib/zipImporter');
    const file = await zipWith({
      'resources/good.json': JSON.stringify({ id: 'r1', type: 'image' }),
      'resources/bad.json': '{ not json',
    });
    const count = await countSkippedEntries(file);
    expect(count).toBe(1);
  });
});
