import { db, type AppNotification } from '../db/db';

let lastEmittedAt: Record<string, number> = {};

export async function pushNotification(
  title: string,
  message: string,
  options: Partial<Pick<AppNotification, 'type' | 'category'>> = {},
  dedupeKey?: string
): Promise<void> {
  const now = Date.now();
  if (dedupeKey && lastEmittedAt[dedupeKey] && now - lastEmittedAt[dedupeKey] < 5000) {
    return;
  }
  if (dedupeKey) lastEmittedAt[dedupeKey] = now;

  try {
    await db.notifications.add({
      type: options.type || 'info',
      category: options.category || 'general',
      title,
      message,
      read: false,
      timestamp: now,
    });
    // Keep only the latest 100 notifications
    const all = await db.notifications.orderBy('timestamp').reverse().toArray();
    if (all.length > 100) {
      const stale = all.slice(100).map(n => n.id).filter(Boolean) as string[];
      await db.notifications.bulkDelete(stale);
    }
  } catch (err) {
    console.warn('Failed to persist notification:', err);
  }
}

export async function clearNotifications(): Promise<void> {
  await db.notifications.clear();
}

export async function markAllNotificationsRead(): Promise<void> {
  await db.notifications.where('read').equals(0).modify({ read: true });
}