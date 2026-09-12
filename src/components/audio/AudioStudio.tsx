import React, { useState } from 'react';
import { Play, Square, Volume2, Settings2, Download, Waves, Layers } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useCampaignContext } from '../../context/CampaignContext';

export function AudioStudio() {
  const { activeCampaign, scenes } = useCampaignContext();
  const campaign = activeCampaign;
  const [isPlaying, setIsPlaying] = useState(false);

  // Prefer sceneGraph, fall back to avScript
  const legacyCuts = campaign?.avScript || [];
  const hasContent = scenes.length > 0 || legacyCuts.length > 0;

  if (!campaign || !hasContent) {
    return <div className="text-center py-10 text-slate-500">No script available to generate audio.</div>;
  }

  const segmentCount = scenes.length > 0 ? scenes.length : legacyCuts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audio Studio</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Client-side WebCompute TTS Voiceover Synthesis & Waveform Preview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              Waveform Visualizer
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={isPlaying ? "Stop waveform" : "Play waveform"}
              >
                {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            </div>
          </div>

          <div className="h-32 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden relative">
            {/* Mock Waveform */}
            <div className="absolute inset-0 flex items-end justify-center gap-1 p-2 opacity-60">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-primary rounded-t-full transition-all duration-300"
                  style={{ 
                    height: `${Math.max(10, Math.random() * 100)}%`,
                    opacity: isPlaying ? 1 : 0.5,
                    transform: isPlaying ? `scaleY(${0.5 + Math.random() * 0.5})` : 'scaleY(1)'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Voiceover Segments ({segmentCount} Scenes)
            </h3>
            <div className="space-y-2">
              {scenes.length > 0 ? (
                /* N-Scene rendering */
                scenes.map((scene, idx) => (
                  <div key={scene.id || idx} className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0" aria-label="Play segment">
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <div className="truncate">
                        <span className="text-xs font-bold text-primary uppercase mr-2">{scene.actName}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 italic truncate block sm:inline">"{scene.voiceoverText}"</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">{scene.timeStart}</span>
                  </div>
                ))
              ) : (
                /* Legacy AVCut rendering */
                legacyCuts.map((cut, idx) => (
                  <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0" aria-label="Play segment">
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <div className="truncate">
                        <span className="text-xs font-bold text-primary uppercase mr-2">Act {cut.act}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 italic truncate block sm:inline">"{cut.audioVoiceover}"</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">{cut.timestampStart}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">TTS Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Voice Model (Client-Side)</label>
              <select className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent">
                <option>Piper TTS (en-in-x-low)</option>
                <option>Sherpa-ONNX (en-us-high)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Speaking Rate</span>
                <span className="text-primary font-mono font-medium">1.1x</span>
              </label>
              <input type="range" min="0.5" max="2" step="0.1" defaultValue="1.1" className="w-full accent-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Master Volume</span>
                <span className="text-primary font-mono font-medium">80%</span>
              </label>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <input type="range" min="0" max="100" defaultValue="80" className="w-full accent-primary" />
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-md">
            <Download className="w-4 h-4" />
            Export Master Track (WAV)
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
