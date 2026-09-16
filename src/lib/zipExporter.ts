import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CampaignProject } from '../context/CampaignContext';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function exportCampaignZip(campaign: CampaignProject): Promise<void> {
  const zip = new JSZip();

  // ── manifest.json ──
  const manifest = {
    version: 1,
    format: 'promoteit-zip',
    exportedAt: Date.now(),
    campaign: {
      id: campaign.id,
      title: campaign.title,
      industry: campaign.industry,
      status: campaign.status,
      brandTemplateId: campaign.brandTemplateId,
      clientBrandId: campaign.clientBrandId,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    },
    sceneGraph: campaign.sceneGraph || [],
    videoPrompts: campaign.videoPrompts || [],
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // ── resources/ folder ──
  const resourceFolder = zip.folder('resources');
  if (resourceFolder && campaign.resourceLibrary) {
    for (const res of campaign.resourceLibrary) {
      const resData = {
        id: res.id,
        type: res.type,
        title: res.title,
        mimeType: res.mimeType,
        blobOrTextRef: res.blobOrTextRef,
        metadata: res.metadata,
        createdAt: res.createdAt,
      };
      resourceFolder.file(`${res.id}.json`, JSON.stringify(resData, null, 2));
    }
  }

  // ── audio/ folder ──
  const audioFolder = zip.folder('audio');
  if (audioFolder) {
    // Store raw script text as audio placeholder
    if (campaign.sceneGraph) {
      for (const scene of campaign.sceneGraph) {
        if (scene.voiceoverText) {
          audioFolder.file(`scene-${scene.sceneIndex}-voiceover.txt`, scene.voiceoverText);
        }
      }
    }
  }

  // ── prompts/ folder ──
  const promptsFolder = zip.folder('prompts');
  if (promptsFolder && campaign.videoPrompts) {
    for (const prompt of campaign.videoPrompts) {
      promptsFolder.file(`${prompt.id}.json`, JSON.stringify(prompt, null, 2));
    }
  }

  // ── Generate & Download ──
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const filename = `${slugify(campaign.title)}-promoteit-backup.zip`;
  saveAs(blob, filename);
}
