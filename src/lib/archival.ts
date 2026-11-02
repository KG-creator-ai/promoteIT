/**
 * promote-IT OPFS Archival Module
 * Zero-backend: import/export encrypted campaign bundles via Origin Private File System.
 */

const ARCHIVE_DIR = 'archives';
const BUNDLE_VERSION = 1;

export interface ArchiveBundle {
  version: number;
  format: 'promoteit';
  exportedAt: number;
  campaignCount: number;
  payload: string; // JSON stringified array of campaign objects
}

// ──────────────────────────────────────────────
// Get OPFS Root Directory
// ──────────────────────────────────────────────
async function getArchiveDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  try {
    return await root.getDirectoryHandle(ARCHIVE_DIR, { create: true });
  } catch {
    return await root.getDirectoryHandle(ARCHIVE_DIR, { create: true });
  }
}

// ──────────────────────────────────────────────
// Pure bundle seam (SPEC-015.AC-004) — browser-free build/parse/validate,
// so backup/restore integrity is unit-testable in node.
// ──────────────────────────────────────────────

const CAMPAIGN_STATUSES = new Set([
  'briefing',
  'scripting',
  'prompting',
  'audio_sync',
  'export_ready',
  'draft',
  'active',
]);

export interface CampaignRowIssue {
  index: number;
  id?: string;
  reason: string;
}

export interface CampaignRowValidation {
  valid: boolean;
  issues: CampaignRowIssue[];
}

/**
 * Validate restored campaign rows against the v4 schema, row by row (D-009).
 * A malformed row is reported with its own reason so the snapshot is rejected
 * instead of writing junk rows into db.campaigns.
 */
export function validateCampaignRows(rows: unknown[]): CampaignRowValidation {
  const issues: CampaignRowIssue[] = [];

  rows.forEach((row, index) => {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      issues.push({ index, reason: 'row is not an object' });
      return;
    }
    const r = row as Record<string, unknown>;
    const id = typeof r.id === 'string' ? r.id : undefined;

    if (typeof r.title !== 'string' || !r.title.trim()) {
      issues.push({ index, id, reason: 'title must be a non-empty string' });
    }
    if (typeof r.createdAt !== 'number' || !Number.isFinite(r.createdAt)) {
      issues.push({ index, id, reason: 'createdAt must be a finite number' });
    }
    if (typeof r.updatedAt !== 'number' || !Number.isFinite(r.updatedAt)) {
      issues.push({ index, id, reason: 'updatedAt must be a finite number' });
    }
    if (r.status !== undefined && (typeof r.status !== 'string' || !CAMPAIGN_STATUSES.has(r.status))) {
      issues.push({ index, id, reason: `unknown status: ${String(r.status)}` });
    }
    if (r.sceneGraph !== undefined) {
      if (!Array.isArray(r.sceneGraph)) {
        issues.push({ index, id, reason: 'sceneGraph must be an array' });
      } else {
        r.sceneGraph.forEach((scene, sIdx) => {
          if (scene === null || typeof scene !== 'object' || Array.isArray(scene)) {
            issues.push({ index, id, reason: `sceneGraph[${sIdx}] is not an object` });
            return;
          }
          const s = scene as Record<string, unknown>;
          if (typeof s.id !== 'string' || !s.id) {
            issues.push({ index, id, reason: `sceneGraph[${sIdx}].id must be a non-empty string` });
          }
          if (typeof s.sceneIndex !== 'number' || !Number.isFinite(s.sceneIndex)) {
            issues.push({ index, id, reason: `sceneGraph[${sIdx}].sceneIndex must be a number` });
          }
          if (!Array.isArray(s.linkedResourceIds)) {
            issues.push({ index, id, reason: `sceneGraph[${sIdx}].linkedResourceIds must be an array` });
          }
        });
      }
    }
    if (r.resourceLibrary !== undefined && !Array.isArray(r.resourceLibrary)) {
      issues.push({ index, id, reason: 'resourceLibrary must be an array' });
    }
    if (r.videoPrompts !== undefined && !Array.isArray(r.videoPrompts)) {
      issues.push({ index, id, reason: 'videoPrompts must be an array' });
    }
    if (r.avScript !== undefined && !Array.isArray(r.avScript)) {
      issues.push({ index, id, reason: 'avScript must be an array' });
    }
  });

  return { valid: issues.length === 0, issues };
}

export function buildArchiveBundle(campaigns: any[]): ArchiveBundle {
  return {
    version: BUNDLE_VERSION,
    format: 'promoteit',
    exportedAt: Date.now(),
    campaignCount: campaigns.length,
    payload: JSON.stringify(campaigns, null, 2),
  };
}

export function parseArchiveBundle(text: string): ArchiveBundle {
  const bundle: ArchiveBundle = JSON.parse(text);
  if (bundle.format !== 'promoteit') {
    throw new Error('Invalid archive format. Expected .promoteit bundle.');
  }
  if (bundle.version > BUNDLE_VERSION) {
    throw new Error(`Archive version ${bundle.version} is not supported by this version.`);
  }
  const rows = JSON.parse(bundle.payload);
  if (!Array.isArray(rows)) throw new Error('Archive payload is not a campaign array.');
  if (rows.length !== bundle.campaignCount) {
    throw new Error(`Archive count mismatch: header ${bundle.campaignCount} vs payload ${rows.length}.`);
  }
  // D-009: validate every restored row against the v4 schema before it can
  // reach db.campaigns; a malformed row is rejected with its own reason.
  const validation = validateCampaignRows(rows);
  if (!validation.valid) {
    const detail = validation.issues
      .slice(0, 10)
      .map(i => `row ${i.index}${i.id ? ` (${i.id})` : ''}: ${i.reason}`)
      .join('; ');
    throw new Error(
      `Archive rejected — ${validation.issues.length} invalid campaign row(s): ${detail}${validation.issues.length > 10 ? '; …' : ''}`,
    );
  }
  return bundle;
}

export function buildArchiveFilename(now: Date = new Date()): string {
  return `backup-${now.toISOString().replace(/[:.]/g, '-').slice(0, 23)}.promoteit`;
}

// ──────────────────────────────────────────────
// Export Campaigns to .promoteit Bundle
// ──────────────────────────────────────────────
export async function exportArchive(campaigns: any[]): Promise<void> {
  const dir = await getArchiveDir();
  const bundle = buildArchiveBundle(campaigns);

  const filename = buildArchiveFilename();
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(bundle, null, 2));
  await writable.close();

  // Also trigger browser download
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
// Import from File Handle (.promoteit)
// ──────────────────────────────────────────────
export async function importFromFileHandle(fileHandle: FileSystemFileHandle): Promise<ArchiveBundle> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  return parseArchiveBundle(text);
}

// ──────────────────────────────────────────────
// List Local Archives
// ──────────────────────────────────────────────
export async function listLocalArchives(): Promise<string[]> {
  try {
    const dir = await getArchiveDir();
    const files: string[] = [];
    const entries = (dir as any).entries ? (dir as any).entries() : (dir as any);
    for await (const [name] of entries) {
      if (name.endsWith('.promoteit')) {
        files.push(name);
      }
    }
    return files.sort().reverse();
  } catch (err) {
    console.warn('[archival] listing local archives failed', err);
    return [];
  }
}

// ──────────────────────────────────────────────
// Delete a Local Archive
// ──────────────────────────────────────────────
export async function deleteLocalArchive(filename: string): Promise<void> {
  const dir = await getArchiveDir();
  await dir.removeEntry(filename);
}

// ──────────────────────────────────────────────
// Show Open File Picker for Import
// ──────────────────────────────────────────────
export async function showImportPicker(): Promise<ArchiveBundle | null> {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('File System Access API is not supported in this browser.');
  }
  const [handle] = await (window as any).showOpenFilePicker({
    types: [{ description: 'promote-IT Archive', accept: { 'application/json': ['.promoteit'] } }],
    multiple: false,
  });
  return importFromFileHandle(handle);
}
