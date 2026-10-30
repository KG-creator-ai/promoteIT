import JSZip from 'jszip';
import { db, type Campaign, type AVSceneNode, type AVResourceRef, type VideoPrompt } from '../db/db';

interface ZipManifest {
  version: number;
  format: string;
  exportedAt: number;
  campaign: {
    id?: string;
    title: string;
    industry?: string;
    status?: string;
    brandTemplateId?: string;
    clientBrandId?: string;
    createdAt: number;
    updatedAt: number;
  };
  sceneGraph: AVSceneNode[];
  videoPrompts: VideoPrompt[];
}

export interface ImportResult {
  campaignId: string;
  title: string;
  sceneCount: number;
  resourceCount: number;
  skippedCount: number;
}

async function readZipContents(zip: JSZip, manifest: ZipManifest): Promise<{ resourceLibrary: AVResourceRef[]; videoPrompts: VideoPrompt[]; skippedCount: number }> {
  const resourceLibrary: AVResourceRef[] = [];
  const videoPrompts: VideoPrompt[] = [...(manifest.videoPrompts || [])];
  let skippedCount = 0;

  const resourcesFolder = zip.folder('resources');
  if (resourcesFolder) {
    for (const [filename, zipEntry] of Object.entries(resourcesFolder.files)) {
      if (zipEntry.dir || !filename.startsWith('resources/') || !filename.endsWith('.json')) continue;
      try {
        const content = await zipEntry.async('text');
        resourceLibrary.push(JSON.parse(content));
      } catch {
        skippedCount += 1;
      }
    }
  }

  const audioFolder = zip.folder('audio');
  if (audioFolder) {
    for (const [filename, zipEntry] of Object.entries(audioFolder.files)) {
      if (zipEntry.dir || !filename.startsWith('audio/')) continue;
      try {
        const content = await zipEntry.async('text');
        resourceLibrary.push({
          id: `audio-${filename.replace(/\.[^.]+$/, '')}`,
          type: 'tts_audio',
          title: filename,
          mimeType: 'text/plain',
          blobOrTextRef: content,
          metadata: { source: 'zip-import' },
          createdAt: Date.now(),
        });
      } catch {
        skippedCount += 1;
      }
    }
  }

  const promptsFolder = zip.folder('prompts');
  if (promptsFolder) {
    for (const [filename, zipEntry] of Object.entries(promptsFolder.files)) {
      if (zipEntry.dir || !filename.startsWith('prompts/') || !filename.endsWith('.json')) continue;
      try {
        const content = await zipEntry.async('text');
        const prompt: VideoPrompt = JSON.parse(content);
        if (!videoPrompts.find(p => p.id === prompt.id)) {
          videoPrompts.push(prompt);
        }
      } catch {
        skippedCount += 1;
      }
    }
  }

  return { resourceLibrary, videoPrompts, skippedCount };
}

export async function countSkippedEntries(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) return 0;
  const manifest: ZipManifest = JSON.parse(await manifestFile.async('text'));
  const { skippedCount } = await readZipContents(zip, manifest);
  return skippedCount;
}

export async function importCampaignZip(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid archive: missing manifest.json');
  }
  const manifest: ZipManifest = JSON.parse(await manifestFile.async('text'));

  if (manifest.format !== 'promoteit-zip' && manifest.format !== 'promoteit') {
    throw new Error('Invalid archive format. Expected promoteit-zip.');
  }

  const { resourceLibrary, videoPrompts, skippedCount } = await readZipContents(zip, manifest);

  // ── Create new campaign in IndexedDB ──
  const newId = crypto.randomUUID();
  const campaign: Campaign = {
    id: newId,
    title: manifest.campaign.title || 'Imported Campaign',
    industry: manifest.campaign.industry,
    status: 'draft',
    brandTemplateId: manifest.campaign.brandTemplateId,
    clientBrandId: manifest.campaign.clientBrandId,
    sceneGraph: manifest.sceneGraph || [],
    resourceLibrary,
    videoPrompts,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.campaigns.put(campaign);

  return {
    campaignId: newId,
    title: campaign.title,
    sceneCount: campaign.sceneGraph?.length || 0,
    resourceCount: resourceLibrary.length,
    skippedCount,
  };
}
