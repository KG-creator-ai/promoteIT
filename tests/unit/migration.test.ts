import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/db';

// SPEC-015.AC-004: Dexie v1 → v4 upgrade path (resilience: no silent data loss).
// Seeds a legacy v1 row (avScript, no status/cameraMovement), then opens the
// real v4 database — v2/v3 upgrades must backfill and convert deterministically.
const LEGACY_ROW: any = {
  id: 'legacy-1',
  title: 'Legacy Campaign',
  brandTemplateId: 'bt1',
  createdAt: 1,
  updatedAt: 2,
  avScript: [
    {
      act: 1, timestampStart: '00:00', timestampEnd: '00:30',
      visualDescription: 'Aerial dawn', audioVoiceover: 'Vanakkam', bgmCue: 'Nadaswaram',
    },
  ],
};

async function seedLegacyV1() {
  db.close(); // drop any handle from a previous test before deleting the backing store
  await Dexie.delete('PromoteITDatabase');
  const legacy = new Dexie('PromoteITDatabase');
  legacy.version(1).stores({
    brandTemplates: 'id, name, updatedAt',
    campaigns: 'id, title, brandTemplateId, createdAt, updatedAt',
    exports: 'id, campaignId, timestamp',
  });
  await legacy.table('campaigns').put(structuredClone(LEGACY_ROW));
  legacy.close();
  await db.open(); // explicitly-closed instances don't auto-reopen (probe-verified)
}

describe('dexie v1→v4 migration', () => {
  beforeEach(seedLegacyV1);

  it('backfills status + cameraMovement (v2) and converts avScript→sceneGraph (v3)', async () => {
    const row: any = await db.campaigns.get('legacy-1');
    expect(row).toBeDefined();
    expect(row.status).toBe('draft');
    expect(row.sceneGraph).toHaveLength(1);
    expect(row.sceneGraph[0]).toMatchObject({
      actName: 'Act 1',
      visualDescription: 'Aerial dawn',
      voiceoverText: 'Vanakkam',
      bgmCue: 'Nadaswaram',
      cameraMovement: 'Static Center',
    });
    expect(row.resourceLibrary).toEqual([]);
    expect(row.clientBrandId).toBe('bt1');
  });

  it('is idempotent across reopens (no duplicate scenes)', async () => {
    const first: any = await db.campaigns.get('legacy-1'); // opens + migrates
    expect(first.sceneGraph).toHaveLength(1);
    db.close();
    await db.open();
    const row: any = await db.campaigns.get('legacy-1');
    expect(row.sceneGraph).toHaveLength(1);
  });
});
