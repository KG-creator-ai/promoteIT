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
