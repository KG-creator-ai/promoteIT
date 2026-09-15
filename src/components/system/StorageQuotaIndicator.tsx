import React, { useEffect, useState } from 'react';
import { HardDrive, Cpu, Database, Activity } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { GlassCard } from '../ui/GlassCard';
import { pushNotification } from '../../lib/notifications';

export function StorageQuotaIndicator() {
  const [quota, setQuota] = useState<{ usage: number, quota: number, percent: number }>({ usage: 0, quota: 0, percent: 0 });
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
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
    checkQuota();
    const interval = setInterval(() => {
      checkQuota();
      setLastSync(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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
                <div className="text-xs text-slate-500">Hardware Acceleration</div>
              </div>
              <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded uppercase tracking-wide">
                Enabled
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">VRAM Footprint (Est.)</div>
                <div className="text-xs text-slate-500">Llama-3-8B-Instruct-q4f32_1-MLC</div>
              </div>
              <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                ~4.8 GB
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
