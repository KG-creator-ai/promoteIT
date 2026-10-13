import { describe, it, expect } from 'vitest';
import { presetToCampaignData } from '../../src/lib/presetAdapter';
import type { CampaignPreset, Scene } from '../../src/types';

const PRESET: CampaignPreset = {
  id: 'p1',
  title: 'Test Preset',
  region: 'Tamil Nadu',
  targetAudience: 'MSMEs',
  products: ['Loans'],
  businessTarget: 'Growth',
  languageTone: 'Warm',
  badge: 'Test',
  description: 'desc',
  scenes: [
    {
      id: 's1', actNumber: 1, actTitle: 'Opening', sceneTitle: 'Dawn',
      startTime: 0, endTime: 75, imageSrc: '/img/a.jpg', videoSrc: '/vid/a.mp4',
      motionType: 'drone_sweep', startScale: 1, endScale: 1.15,
      ostTag: 'TAG', ostTitle: 'Title', aiPrompt: 'Aerial dawn',
      voiceoverText: 'Vanakkam', audioCues: 'Nadaswaram',
    },
    {
      id: 's2', actNumber: 2, actTitle: 'Middle', sceneTitle: 'Noon',
      startTime: 75, endTime: 90, imageSrc: '', motionType: 'teleport' as unknown as Scene['motionType'],
      startScale: 1, endScale: 1, ostTag: '', ostTitle: '',
      aiPrompt: '', voiceoverText: '', audioCues: '',
    },
  ],
};

describe('presetToCampaignData (SPEC-012)', () => {
  it('converts scenes to AVSceneNodes with mm:ss timing', () => {
    const { sceneGraph } = presetToCampaignData(PRESET);
    expect(sceneGraph).toHaveLength(2);
    expect(sceneGraph[0].timeStart).toBe('00:00');
    expect(sceneGraph[0].timeEnd).toBe('01:15');
    expect(sceneGraph[0].cameraMovement).toBe('drone_sweep');
    expect(sceneGraph[0].voiceoverText).toBe('Vanakkam');
    expect(sceneGraph[1].cameraMovement).toBe('Static Center');
  });

  it('registers image/video asset refs and links them', () => {
    const { sceneGraph, resourceLibrary } = presetToCampaignData(PRESET);
    const kinds = resourceLibrary.map(r => r.type).sort();
    expect(kinds).toEqual(['image_asset', 'video_asset']);
    expect(sceneGraph[0].linkedResourceIds).toHaveLength(2);
    expect(sceneGraph[1].linkedResourceIds).toHaveLength(0);
    const img = resourceLibrary.find(r => r.type === 'image_asset')!;
    expect(img.blobOrTextRef).toBe('/img/a.jpg');
    expect(img.mimeType).toBe('image/jpeg');
  });

  it('returns empty videoPrompts (AI prompts come from the provider path)', () => {
    expect(presetToCampaignData(PRESET).videoPrompts).toEqual([]);
  });
});
