import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db/db';
import { buildArchiveBundle, parseArchiveBundle, validateCampaignRows } from '../../src/lib/archival';

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

// ─────────────────────────────────────────────────────────────
// SPEC-024.AC-005 (D-009): restored campaign rows are validated
// row by row against the v4 schema. A malformed row is rejected
// with its own reason instead of being written to db.campaigns.
// ─────────────────────────────────────────────────────────────
describe('restored campaign rows are validated row by row', () => {
  const validRow = {
    id: 'c1',
    title: 'Arka Fincap',
    status: 'draft',
    createdAt: 1,
    updatedAt: 2,
    sceneGraph: [
      {
        id: 's1',
        sceneIndex: 0,
        actName: 'Act 1',
        timeStart: '00:00',
        timeEnd: '00:10',
        visualDescription: 'Dawn',
        cameraMovement: 'Static',
        voiceoverText: 'Vanakkam',
        linkedResourceIds: [],
      },
    ],
  };

  it('accepts a well-formed row', () => {
    const result = validateCampaignRows([validRow]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('rejects a row that is not an object', () => {
    const result = validateCampaignRows(['nope']);
    expect(result.valid).toBe(false);
    expect(result.issues[0]).toMatchObject({ index: 0, reason: 'row is not an object' });
  });

  it('rejects a missing title and bad timestamps', () => {
    const result = validateCampaignRows([{ ...validRow, title: '  ', createdAt: 'now' }]);
    expect(result.valid).toBe(false);
    const reasons = result.issues.map(i => i.reason).join(' | ');
    expect(reasons).toMatch(/title must be a non-empty string/);
    expect(reasons).toMatch(/createdAt must be a finite number/);
  });

  it('rejects an unknown status', () => {
    const result = validateCampaignRows([{ ...validRow, status: 'not-a-status' }]);
    expect(result.valid).toBe(false);
    expect(result.issues.map(i => i.reason).join(' ')).toMatch(/unknown status/);
  });

  it('rejects a malformed scene inside the row', () => {
    const result = validateCampaignRows([
      { ...validRow, sceneGraph: [{ id: '', sceneIndex: 'x', linkedResourceIds: 'nope' }] },
    ]);
    expect(result.valid).toBe(false);
    const reasons = result.issues.map(i => i.reason).join(' | ');
    expect(reasons).toMatch(/sceneGraph\[0\]\.id/);
    expect(reasons).toMatch(/sceneGraph\[0\]\.sceneIndex/);
    expect(reasons).toMatch(/sceneGraph\[0\]\.linkedResourceIds/);
  });

  it('reports every bad row with its own index and reason', () => {
    const result = validateCampaignRows([validRow, { title: 'x' }, 'junk']);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(3);
    expect(result.issues.map(i => i.index)).toContain(1);
    expect(result.issues.map(i => i.index)).toContain(2);
  });

  it('a malformed snapshot is rejected before it can reach db.campaigns', () => {
    const bundle = buildArchiveBundle([validRow, { id: 'bad', title: '' } as any]);
    // The bundle itself builds (export does not validate), but parsing rejects it.
    expect(() => parseArchiveBundle(JSON.stringify(bundle))).toThrow(/invalid campaign row/);
  });

  it('a valid snapshot still parses', () => {
    const bundle = buildArchiveBundle([validRow]);
    const parsed = parseArchiveBundle(JSON.stringify(bundle));
    expect(parsed.campaignCount).toBe(1);
  });
});
