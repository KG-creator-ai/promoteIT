import React from 'react';
import { X, History, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Campaign } from '../../db/db';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
}

export function VersionHistoryModal({ isOpen, onClose, campaign }: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className="relative w-full max-w-5xl max-h-[90vh] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">Version History & Diff Viewer</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Previous Version */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/10 pb-2">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Previous Revision</h3>
                <span className="text-xs font-mono text-slate-500">v1.0 (2 hours ago)</span>
              </div>
              <div className="space-y-4">
                {campaign.avScript?.slice(0, 2).map((cut, idx) => (
                  <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 rounded-lg line-through opacity-80">
                    <div className="text-xs font-bold text-rose-500 mb-2 uppercase">Act {cut.act}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">"{cut.audioVoiceover}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Version */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-300 dark:border-white/10 pb-2">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">Current Revision</h3>
                <span className="text-xs font-mono text-emerald-500">v1.1 (Active)</span>
              </div>
              <div className="space-y-4">
                {campaign.avScript?.slice(0, 2).map((cut, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase">Act {cut.act}</div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">"{cut.audioVoiceover}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 dark:bg-slate-800 border-t border-slate-300 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Cancel
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-offset-slate-900">
            <ArrowLeftRight className="w-4 h-4" />
            Restore Previous Version
          </button>
        </div>
      </div>
    </div>
  );
}
