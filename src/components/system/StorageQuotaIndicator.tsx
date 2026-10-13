import React, { useEffect, useState } from 'react';
import { HardDrive, Cpu, Database, Activity, Archive, ArchiveRestore } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { GlassCard } from '../ui/GlassCard';
import { pushNotification } from '../../lib/notifications';
import { exportArchive, listLocalArchives, showImportPicker } from '../../lib/archival';

export function StorageQuotaIndicator() {
  const [quota, setQuota] = useState<{ usage: number, quota: number, percent: number }>({ usage: 0, quota: 0, percent: 0 });
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [gpuStatus, setGpuStatus] = useState<'probing' | 'available' | 'unavailable'>('probing');
  const [archives, setArchives] = useState<string[]>([]);
  const [archiveMsg, setArchiveMsg] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const campaignCount = useLiveQuery(() => db.campaigns.count()) ?? 0;
  const templateCount = useLiveQuery(() => db.brandTemplates.count()) ?? 0;
  const exportCount = useLiveQuery(() => db.exports.count()) ?? 0;

  useEffect(() => {
    const checkQuota = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = (estimate.usage || 0) / (1024 * 1024);
        const total = (estimate.quota || 0) / (1024 * 1024);
        const percent = total > 0 ? (usage / total) * 100 : 0;
        setQuota({ usage, quota: total, percent });
      }
    };
    // SPEC-012: probe the real adapter instead of hardcoding "Enabled".
    const probeGpu = async () => {
      try {
        const navGpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        if (!navGpu) {
          setGpuStatus('unavailable');
          return;
        }
        const adapter = await navGpu.requestAdapter();
        setGpuStatus(adapter ? 'available' : 'unavailable');
      } catch {
        setGpuStatus('unavailable');
      }
    };
    const refreshArchives = async () => {
      try {
        setArchives(await listLocalArchives());
      } catch {
        // OPFS unavailable — snapshot card reports honestly on action
      }
    };
    checkQuota();
    probeGpu();
    refreshArchives();
    const interval = setInterval(() => {
      checkQuota();
      setLastSync(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // SPEC-012: OPFS snapshot archive — real backup/restore of campaign rows.
  const handleSnapshot = async () => {
    setArchiving(true);
    setArchiveMsg(null);
    try {
      const campaigns = await db.campaigns.toArray();
      await exportArchive(campaigns);
      setArchives(await listLocalArchives());
      setArchiveMsg(`Snapshot saved (${campaigns.length} campaigns) to OPFS + download.`);
    } catch {
      setArchiveMsg('Snapshot unavailable — this browser lacks Origin Private File System support.');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    setArchiving(true);
    setArchiveMsg(null);
    try {
      const bundle = await showImportPicker();
      if (!bundle) {
        setArchiveMsg('Restore cancelled — no file chosen.');
        return;
      }
      const rows = JSON.parse(bundle.payload);
      if (!Array.isArray(rows)) throw new Error('bad bundle');
      await db.campaigns.bulkPut(rows);
      setArchiveMsg(`Restored ${rows.length} campaigns from snapshot.`);
    } catch {
      setArchiveMsg('Restore failed — pick a valid .promoteit snapshot (Chrome/Edge file picker).');
    } finally {
      setArchiving(false);
    }
  };

  // Push storage quota notifications
  useEffect(() => {
    if (quota.percent > 0) {
      if (quota.percent > 80) {
        pushNotification(
          'Storage Quota Warning',
          `IndexedDB usage at ${quota.percent.toFixed(1)}%. Consider archiving old campaigns.`,
          { type: 'warning', category: 'storage' },
          'storage_high'
        );
      } else if (quota.percent > 50) {
        pushNotification(
          'Storage Usage',
          `IndexedDB usage at ${quota.percent.toFixed(1)}% (${quota.usage.toFixed(1)} MB).`,
          { type: 'info', category: 'storage' },
          'storage_info'
        );
      }
    }
  }, [quota.percent]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Real-time telemetry for WebCompute and Storage APIs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-300 dark:border-white/10 pb-4">
            <HardDrive className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Origin Storage Quota</h2>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Total Usage</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{quota.usage.toFixed(2)} MB / {quota.quota > 1000 ? (quota.quota / 1024).toFixed(2) + ' GB' : quota.quota.toFixed(2) + ' MB'}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, quota.percent))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Database className="w-3 h-3" /> IndexedDB</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{campaignCount + templateCount + exportCount} Records</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {campaignCount} campaigns · {templateCount} templates · {exportCount} exports
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Synced {lastSync}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Cache API</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">Active (PWA)</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-300 dark:border-white/10 pb-4">
            <Cpu className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">WebGPU Compute Health</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Adapter Status</div>
                <div className="text-xs text-slate-500">Hardware Acceleration (probed live)</div>
              </div>
              <div className={`px-2 py-1 text-xs font-semibold rounded uppercase tracking-wide ${
                gpuStatus === 'available'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : gpuStatus === 'unavailable'
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {gpuStatus === 'probing' ? 'Probing…' : gpuStatus}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">VRAM Footprint (Est.)</div>
                <div className="text-xs text-slate-500">Qwen2.5-7B-Instruct-q4f16_1-MLC (default)</div>
              </div>
              <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                ~4.7 GB
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-300 dark:border-white/10 pb-4">
            <Archive className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Campaign Snapshots (OPFS)</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Back up all campaigns to the Origin Private File System (+ download), or restore from a snapshot.
            {archives.length > 0 ? ` ${archives.length} snapshot(s) on this device.` : ' No snapshots on this device yet.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSnapshot}
              disabled={archiving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-500 disabled:opacity-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              {archiving ? 'Working…' : 'Snapshot Now'}
            </button>
            <button
              onClick={handleRestore}
              disabled={archiving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ArchiveRestore className="w-4 h-4" />
              Restore Snapshot
            </button>
          </div>
          {archiveMsg && (
            <p aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">{archiveMsg}</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
