import React, { useState } from 'react';
import { useCampaignContext } from '../../context/CampaignContext';
import { Download, Clock, Camera, Mic, History, Layers, Play } from 'lucide-react';
import { exportScriptToPdf } from '../../lib/exporters';
import { GlassCard } from '../ui/GlassCard';
import { VersionHistoryModal } from './VersionHistoryModal';

interface MasterScriptTableProps {
  onNavigate?: (view: string) => void;
}

export function MasterScriptTable({ onNavigate }: MasterScriptTableProps) {
  const { activeCampaign } = useCampaignContext();
  const campaign = activeCampaign;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!campaign) {
    return <div className="text-center py-10 text-slate-500">No active campaign to display.</div>;
  }

  const handleExport = () => {
    exportScriptToPdf(campaign);
  };

  // Prefer sceneGraph (N-Scene), fall back to legacy avScript
  const scenes = campaign.sceneGraph || [];
  const legacyCuts = campaign.avScript || [];
  const useSceneGraph = scenes.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Master Script Studio</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
            {campaign.title}
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {useSceneGraph ? scenes.length : legacyCuts.length} Scenes
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => onNavigate?.('player')}
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Preview Player</span>
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300 dark:hover:bg-slate-800 border border-slate-300/50 dark:border-white/10 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Version History</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-offset-slate-900"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-200/80 dark:bg-slate-800/80 border-b border-slate-300 dark:border-white/10 p-4 font-semibold text-slate-700 dark:text-slate-200 text-sm sticky top-0 z-10 backdrop-blur-md">
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Timeline Cues
              </div>
              <div className="col-span-5 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                Visuals / Camera / OST
              </div>
              <div className="col-span-5 flex items-center gap-2">
                <Mic className="w-4 h-4 text-slate-500" />
                VO Script / Audio SFX
              </div>
            </div>

            {/* Table Body — N-Scene Graph */}
            {useSceneGraph ? (
              <div className="divide-y divide-slate-300 dark:divide-white/5">
                {scenes.map((scene, idx) => (
                  <div key={scene.id || idx} className="grid grid-cols-12 p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                    <div className="col-span-2 pr-4 border-r border-slate-300 dark:border-white/5">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">{scene.actName}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                        {scene.timeStart} - {scene.timeEnd}
                      </div>
                      {scene.linkedResourceIds.length > 0 && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          🔗 {scene.linkedResourceIds.length} resources
                        </div>
                      )}
                    </div>
                    <div className="col-span-5 px-4 border-r border-slate-300 dark:border-white/5 space-y-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{scene.visualDescription}</p>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-white/5 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Camera className="w-3 h-3" />
                        {scene.cameraMovement}
                      </div>
                    </div>
                    <div className="col-span-5 pl-4 space-y-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic border-l-2 border-primary/30 pl-3">"{scene.voiceoverText}"</p>
                      {scene.phoneticGuide && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                          📖 {scene.phoneticGuide}
                        </div>
                      )}
                      {scene.bgmCue && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                          🎵 {scene.bgmCue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: Legacy AVCut rendering */
              <div className="divide-y divide-slate-300 dark:divide-white/5">
                {legacyCuts.map((cut, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                    <div className="col-span-2 pr-4 border-r border-slate-300 dark:border-white/5">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">Act {cut.act}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                        {cut.timestampStart} - {cut.timestampEnd}
                      </div>
                    </div>
                    <div className="col-span-5 px-4 border-r border-slate-300 dark:border-white/5 space-y-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{cut.visualDescription}</p>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-white/5 rounded text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Camera className="w-3 h-3" />
                        {cut.cameraMovement}
                      </div>
                    </div>
                    <div className="col-span-5 pl-4 space-y-3">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic border-l-2 border-primary/30 pl-3">"{cut.audioVoiceover}"</p>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                        🎵 {cut.bgmCue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <VersionHistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        campaign={campaign} 
      />
    </div>
  );
}
