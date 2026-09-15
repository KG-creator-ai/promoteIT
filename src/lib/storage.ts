/**
 * promote-IT Storage Manager
 * Zero-backend: navigator.storage API for persistence and quota tracking.
 */

export interface StorageStats {
  usage: number;
  quota: number;
  usagePercentage: number;
  persisted: boolean;
}

// ──────────────────────────────────────────────
// Request Persistent Storage (prevent auto-eviction)
// ──────────────────────────────────────────────
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.warn('StorageManager.persist() not supported.');
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persist();
    if (isPersisted) {
      console.log('Persistent storage granted.');
    } else {
      console.warn('Persistent storage was denied by the user or browser.');
    }
    return isPersisted;
  } catch (err) {
    console.error('Failed to request persistent storage:', err);
    return false;
  }
}

// ──────────────────────────────────────────────
// Get Current Storage Usage
// ──────────────────────────────────────────────
export async function getStorageStats(): Promise<StorageStats> {
  const defaultStats: StorageStats = { usage: 0, quota: 0, usagePercentage: 0, persisted: false };

  if (!navigator.storage || !navigator.storage.estimate) {
    return defaultStats;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 1;
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;

    return {
      usage,
      quota,
      usagePercentage: (usage / quota) * 100,
      persisted,
    };
  } catch (err) {
    console.error('Failed to estimate storage:', err);
    return defaultStats;
  }
}

// ──────────────────────────────────────────────
// Format bytes to human-readable string
// ──────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ──────────────────────────────────────────────
// Monitor Storage Quota (registers a persistent watcher)
// ──────────────────────────────────────────────
let quotaCheckInterval: number | null = null;

export function startQuotaMonitor(callback: (stats: StorageStats) => void, intervalMs = 30_000): void {
  stopQuotaMonitor();
  const check = async () => {
    const stats = await getStorageStats();
    callback(stats);
    if (stats.usagePercentage > 90) {
      console.warn(`Storage critical: ${stats.usagePercentage.toFixed(1)}% used.`);
    }
  };
  check();
  quotaCheckInterval = window.setInterval(check, intervalMs);
}

export function stopQuotaMonitor(): void {
  if (quotaCheckInterval !== null) {
    clearInterval(quotaCheckInterval);
    quotaCheckInterval = null;
  }
}
