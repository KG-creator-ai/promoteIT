import React, { useState } from 'react';
import { useDexieCampaign } from '../../hooks/useDexieCampaign';
import { Copy, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

const MODELS = ['veo3', 'runway_gen3', 'sora2', 'pika2'] as const;

export function PromptHub() {
  const { activeCampaign } = useDexieCampaign();
  const campaign = activeCampaign;
  const [activeModel, setActiveModel] = useState<typeof MODELS[number]>('veo3');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Prefer sceneGraph, fall back to avScript
  const scenes = campaign?.sceneGraph || [];
  const legacyCuts = campaign?.avScript || [];
  const hasContent = scenes.length > 0 || legacyCuts.length > 0;

  if (!campaign || !hasContent) {
    return <div className="text-center py-10 text-slate-500 dark:text-slate-400">No prompts available.</div>;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate prompts from sceneGraph or legacy avScript
  const prompts = campaign.videoPrompts || (scenes.length > 0
    ? scenes.map((scene, idx) => ({
        id: `prompt-${scene.id || idx}`,
        actIndex: scene.sceneIndex + 1,
        actName: scene.actName,
        targetModel: activeModel,
        promptText: `${scene.visualDescription}. Camera: ${scene.cameraMovement}. High quality, cinematic.`
      }))
    : legacyCuts.map((cut, idx) => ({
        id: `prompt-${idx}`,
        actIndex: cut.act,
        actName: `Act ${cut.act}`,
        targetModel: activeModel,
        promptText: `${cut.visualDescription}. Camera: ${cut.cameraMovement}. High quality, cinematic.`
      }))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Video Prompt Hub</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Ready-to-copy generator prompts for multi-modal rendering.</p>
      </div>

      {/* Model Tabs */}
      <div className="flex p-1 bg-slate-200/70 dark:bg-slate-900/60 border border-slate-300/80 dark:border-white/10 rounded-xl w-fit overflow-x-auto max-w-full no-scrollbar">
        {MODELS.map(model => (
          <button
            key={model}
            onClick={() => setActiveModel(model)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeModel === model 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300/60 dark:border-white/10' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {model === 'veo3' ? 'Google Veo 3' : 
             model === 'runway_gen3' ? 'Runway Gen-3' : 
             model === 'sora2' ? 'Sora 2' : 'Pika 2.2'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((prompt: any) => (
          <GlassCard key={prompt.id} className="p-5 group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wide">{prompt.actName || `Act ${prompt.actIndex}`}</span>
              </div>
              <button
                onClick={() => handleCopy(prompt.promptText, prompt.id)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                {copiedId === prompt.id ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Copied</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Prompt</>
                )}
              </button>
            </div>
            
            <div className="bg-slate-100 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-white/5 font-mono text-sm text-slate-800 dark:text-slate-300 min-h-[120px] whitespace-pre-wrap">
              {prompt.promptText}
            </div>

            {activeModel === 'runway_gen3' && (
              <div className="mt-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300 font-mono text-xs p-3 rounded-lg overflow-x-auto">
                <span className="text-amber-600 dark:text-amber-400">{'// Camera JSON Parameters'}</span><br/>
                {`{ "horizontal": 2.0, "vertical": 0.0, "zoom": 1.5 }`}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
