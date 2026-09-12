import { db } from './db';
import { FULL_AV_SCENES } from '../data/scriptData';
import type { AVSceneNode, AVResourceRef } from './db';

export async function seedDatabase() {
  const templatesCount = await db.brandTemplates.count();
  if (templatesCount === 0) {
    // Seed default Arka Template (put = idempotent under concurrent/double seed runs)
    await db.brandTemplates.put({
      id: 'template-arka-default',
      name: 'Arka Corporate Brand',
      primaryColor: '#062A30', // Dark Teal
      secondaryColor: '#19988B', // Teal
      accentColor: '#C37C5B', // Copper
      updatedAt: Date.now()
    });
  }

  const campaignsCount = await db.campaigns.count();
  if (campaignsCount === 0) {
    const title = 'Arka Regional Expansion 2026';

    // Legacy avScript (preserved for backward compat)
    const script = FULL_AV_SCENES.map(scene => ({
      act: scene.actNumber,
      timestampStart: formatTime(scene.startTime),
      timestampEnd: formatTime(scene.endTime),
      visualDescription: scene.sceneTitle,
      cameraMovement: scene.motionType,
      audioVoiceover: scene.voiceoverText,
      bgmCue: scene.audioCues
    }));

    // New N-Scene dynamic graph (auto-generated from scenes)
    const sceneGraph: AVSceneNode[] = FULL_AV_SCENES.map((scene, idx) => ({
      id: `scene-seed-${idx}`,
      sceneIndex: idx,
      actName: scene.actTitle || `Act ${scene.actNumber}`,
      timeStart: formatTime(scene.startTime),
      timeEnd: formatTime(scene.endTime),
      visualDescription: scene.sceneTitle,
      cameraMovement: scene.motionType,
      voiceoverText: scene.voiceoverText,
      phoneticGuide: undefined,
      bgmCue: scene.audioCues,
      linkedResourceIds: []
    }));

    // Seed initial resource library entries
    const resourceLibrary: AVResourceRef[] = [
      {
        id: 'res-seed-brief',
        type: 'pdf_brief',
        title: 'Arka Regional Expansion Brief',
        mimeType: 'application/pdf',
        blobOrTextRef: 'Arka Fincap regional expansion corporate strategy document — Q3 2026 targets, MSME penetration goals, and brand awareness KPIs.',
        metadata: { pages: 12, source: 'client_upload' },
        createdAt: Date.now()
      },
      {
        id: 'res-seed-script',
        type: 'raw_script',
        title: 'Master AV Script v1',
        mimeType: 'text/plain',
        blobOrTextRef: 'Auto-generated 6-Act AV script from ingested brief.',
        metadata: { version: 1, actCount: sceneGraph.length },
        createdAt: Date.now()
      }
    ];

    await db.campaigns.put({
      id: 'campaign-default',
      title: title,
      brandTemplateId: 'template-arka-default',
      clientBrandId: 'template-arka-default',
      industry: 'Financial Services',
      avScript: script,
      sceneGraph: sceneGraph,
      resourceLibrary: resourceLibrary,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
