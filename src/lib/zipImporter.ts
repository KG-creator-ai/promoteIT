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
}

export async function importCampaignZip(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // ── Read manifest ──
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    throw new Error('Invalid archive: missing manifest.json');
  }
  const manifest: ZipManifest = JSON.parse(await manifestFile.async('text'));

  if (manifest.format !== 'promoteit-zip' && manifest.format !== 'promoteit') {
    throw new Error('Invalid archive format. Expected promoteit-zip.');
  }

  // ── Read resources ──
  const resourceLibrary: AVResourceRef[] = [];
  const resourcesFolder = zip.folder('resources');
  if (resourcesFolder) {
    for (const [filename, zipEntry] of Object.entries(resourcesFolder.files)) {
      if (zipEntry.dir || !filename.endsWith('.json')) continue;
      try {
        const content = await zipEntry.async('text');
        const res: AVResourceRef = JSON.parse(content);
        resourceLibrary.push(res);
      } catch {
        // skip malformed resource files
      }
    }
  }

  // ── Read audio files as text references ──
  const audioFolder = zip.folder('audio');
  if (audioFolder) {
    for (const [filename, zipEntry] of Object.entries(audioFolder.files)) {
      if (zipEntry.dir) continue;
      try {
        const content = await zipEntry.async('text');
        const resId = `audio-${filename.replace(/\.[^.]+$/, '')}`;
        resourceLibrary.push({
          id: resId,
          type: 'tts_audio',
          title: filename,
          mimeType: 'text/plain',
          blobOrTextRef: content,
          metadata: { source: 'zip-import' },
          createdAt: Date.now(),
        });
      } catch {
        // skip
      }
    }
  }

  // ── Read prompts ──
  const videoPrompts: VideoPrompt[] = manifest.videoPrompts || [];
  const promptsFolder = zip.folder('prompts');
  if (promptsFolder) {
    for (const [filename, zipEntry] of Object.entries(promptsFolder.files)) {
      if (zipEntry.dir || !filename.endsWith('.json')) continue;
      try {
        const content = await zipEntry.async('text');
        const prompt: VideoPrompt = JSON.parse(content);
        if (!videoPrompts.find(p => p.id === prompt.id)) {
          videoPrompts.push(prompt);
        }
      } catch {
        // skip
      }
    }
  }

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
  };
}
