/**
 * SPEC-012: CampaignPreset (legacy Scene[]) → live campaign rows.
 * Pure + unit-tested. Image/video assets become `image_asset`/`video_asset`
 * resource refs so the player adapter (SPEC-009) resolves real imagery.
 */
import type { CampaignPreset, Scene } from '../types';
import type { AVSceneNode, AVResourceRef, VideoPrompt } from '../db/db';

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const MOTION_TO_CAMERA: Record<string, string> = {
  drone_sweep: 'drone_sweep',
  pan_right: 'pan_right',
  macro_zoom: 'macro_zoom',
  orbital_sweep: 'orbital_sweep',
  slow_push_in: 'slow_push_in',
  outro_reveal: 'outro_reveal',
};

export interface PresetCampaignData {
  sceneGraph: AVSceneNode[];
  resourceLibrary: AVResourceRef[];
  videoPrompts: VideoPrompt[];
}

export function presetToCampaignData(preset: CampaignPreset): PresetCampaignData {
  const now = Date.now();
  const resourceLibrary: AVResourceRef[] = [];
  const sceneGraph: AVSceneNode[] = (preset.scenes || []).map((s: Scene, idx: number) => {
    const linkedResourceIds: string[] = [];
    const registerAsset = (src: string | undefined, kind: 'image_asset' | 'video_asset', mime: string, title: string) => {
      if (!src) return;
      const id = `preset-${preset.id}-r${idx}-${kind === 'image_asset' ? 'img' : 'vid'}`;
      resourceLibrary.push({
        id,
        type: kind,
        title,
        mimeType: mime,
        blobOrTextRef: src,
        metadata: { source: 'campaign-preset', presetId: preset.id },
        createdAt: now,
      });
      linkedResourceIds.push(id);
    };
    registerAsset(s.imageSrc, 'image_asset', 'image/jpeg', `${s.sceneTitle} — still`);
    registerAsset(s.videoSrc, 'video_asset', 'video/mp4', `${s.sceneTitle} — clip`);
    return {
      id: `scene-${s.id || `p${idx}`}`.slice(0, 32),
      sceneIndex: idx,
      actName: s.actTitle || `Act ${s.actNumber || idx + 1}`,
      timeStart: fmtTime(s.startTime || 0),
      timeEnd: fmtTime(s.endTime || 0),
      visualDescription: s.aiPrompt || s.sceneTitle || '',
      cameraMovement: MOTION_TO_CAMERA[s.motionType] || 'Static Center',
      voiceoverText: s.voiceoverText || '',
      bgmCue: [s.ostTag, s.ostTitle].filter(Boolean).join(' — ') || undefined,
      linkedResourceIds,
    };
  });
  return { sceneGraph, resourceLibrary, videoPrompts: [] };
}
