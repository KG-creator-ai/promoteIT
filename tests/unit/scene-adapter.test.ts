import { describe, it, expect } from 'vitest';
import { sceneToRendererScene } from '../../src/components/studio/AVVideoPlayer';
import type { AVSceneNode } from '../../src/db/db';

const base: AVSceneNode = {
  id: 'scene-1',
  sceneIndex: 0,
  actName: 'Act 1',
  timeStart: '00:00',
  timeEnd: '00:10',
  visualDescription: 'Chennai Central at dawn',
  cameraMovement: 'pan_right',
  voiceoverText: 'Vanakkam',
  bgmCue: 'Nadaswaram',
  linkedResourceIds: [],
};

describe('sceneToRendererScene adapter (SPEC-009)', () => {
  it('maps timing and text fields', () => {
    const s = sceneToRendererScene(base, 0, 0, 10, '');
    expect(s.startTime).toBe(0);
    expect(s.endTime).toBe(10);
    expect(s.voiceoverText).toBe('Vanakkam');
    expect(s.aiPrompt).toBe('Chennai Central at dawn');
    expect(s.audioCues).toBe('Nadaswaram');
  });

  it('maps known camera motions to renderer motion types', () => {
    expect(sceneToRendererScene({ ...base, cameraMovement: 'pan_right' }, 0, 0, 10, '').motionType).toBe('pan_right');
    expect(sceneToRendererScene({ ...base, cameraMovement: 'drone_sweep' }, 0, 0, 10, '').motionType).toBe('drone_sweep');
  });

  it('keeps static scenes still (no Ken Burns drift)', () => {
    const s = sceneToRendererScene({ ...base, cameraMovement: 'Static Center' }, 0, 0, 10, '');
    expect(s.startScale).toBe(1);
    expect(s.endScale).toBe(1);
  });

  it('applies Ken Burns push to moving scenes', () => {
    const s = sceneToRendererScene(base, 0, 0, 10, '');
    expect(s.endScale).toBeGreaterThan(s.startScale);
  });

  it('carries linked image sources through', () => {
    const s = sceneToRendererScene(base, 2, 20, 30, 'blob:img1');
    expect(s.imageSrc).toBe('blob:img1');
    expect(s.mediaType).toBe('image');
    expect(s.actNumber).toBe(3);
  });

  it('falls back safely on unknown motion', () => {
    const s = sceneToRendererScene({ ...base, cameraMovement: 'teleport' }, 0, 0, 10, '');
    expect(s.motionType).toBe('slow_push_in');
  });
});
