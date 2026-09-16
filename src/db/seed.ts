import { db } from './db';

export async function seedDatabase() {
  const templatesCount = await db.brandTemplates.count();
  if (templatesCount === 0) {
    // Seed default brand template only — campaigns start clean
    await db.brandTemplates.put({
      id: 'template-arka-default',
      name: 'promote-IT Brand',
      primaryColor: '#062A30',
      secondaryColor: '#19988B',
      accentColor: '#C37C5B',
      updatedAt: Date.now()
    });
  }
  // Campaigns are now user-created or imported via ZIP/sample — no auto-seed
}
