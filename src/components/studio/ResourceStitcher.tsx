import React, { useState } from 'react';
import { useCampaignContext } from '../../context/CampaignContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { GlassCard } from '../ui/GlassCard';
import { 
  FileText, FileImage, Mic, Video, Clock, Link2, Unlink, 
  Plus, ChevronDown, ChevronRight, Layers, Puzzle
} from 'lucide-react';
import type { AVResourceRef, AVSceneNode } from '../../db/db';

const RESOURCE_TYPE_META: Record<AVResourceRef['type'], { icon: typeof FileText; color: string; label: string }> = {
  pdf_brief:       { icon: FileText,  color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',     label: 'PDF Brief' },
  ocr_extract:     { icon: FileImage, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', label: 'OCR Extract' },
  raw_script:      { icon: FileText,  color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Script' },
  tts_audio:       { icon: Mic,       color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',   label: 'TTS Audio' },
  video_prompt:    { icon: Video,     color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',       label: 'Video Prompt' },
  timeline_render: { icon: Layers,    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',      label: 'Timeline Render' },
  image_asset:     { icon: FileImage, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',      label: 'Image Asset' },
  video_asset:     { icon: Video,     color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', label: 'Video Asset' },
};

export function ResourceStitcher() {
  const { activeCampaign, scenes, resources, linkResource, unlinkResource } = useCampaignContext();
  usePageTitle('Resource Stitcher', 'Correlate PDF briefs, OCR text, scripts, and audio.');
  const [expandedScene, setExpandedScene] = useState<string | null>(null);
  const [linkingScene, setLinkingScene] = useState<string | null>(null);

  if (!activeCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
        <Puzzle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No active campaign selected</p>
        <p className="text-sm mt-1">Create or select a campaign to start stitching resources.</p>
      </div>
    );
  }

  const getResourceById = (id: string) => resources.find(r => r.id === id);

  const handleLink = async (sceneId: string, resourceId: string) => {
    await linkResource(sceneId, resourceId);
    setLinkingScene(null);
  };

  const handleUnlink = async (sceneId: string, resourceId: string) => {
    await unlinkResource(sceneId, resourceId);
  };

  const getUnlinkedResources = (scene: AVSceneNode) => {
    return resources.filter(r => !scene.linkedResourceIds.includes(r.id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Resource Stitcher</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Visual Knowledge Matrix — Link ingested resources to timeline scenes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-semibold border border-primary/20">
            {scenes.length} Scenes
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-white/10">
            {resources.length} Resources
          </span>
        </div>
      </div>

      {/* Resource Library Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Resource Library</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {resources.map(resource => {
            const meta = RESOURCE_TYPE_META[resource.type];
            const Icon = meta.icon;
            return (
              <GlassCard key={resource.id} className="p-4 group hover:border-primary/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${meta.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{resource.title}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{meta.label}</span>
                  </div>
                </div>
                {resource.blobOrTextRef && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {resource.blobOrTextRef.substring(0, 120)}{resource.blobOrTextRef.length > 120 ? '...' : ''}
                  </p>
                )}
              </GlassCard>
            );
          })}
          {resources.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No resources ingested yet. Use the Campaign Wizard to upload briefs.
            </div>
          )}
        </div>
      </div>

      {/* Scene Timeline Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Scene Timeline</h2>
        <div className="space-y-3">
          {scenes.map((scene) => {
            const isExpanded = expandedScene === scene.id;
            const isLinking = linkingScene === scene.id;
            const linkedResources = scene.linkedResourceIds.map(getResourceById).filter(Boolean) as AVResourceRef[];

            return (
              <GlassCard key={scene.id} className="overflow-hidden">
                {/* Scene Header */}
                <button
                  onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide whitespace-nowrap">
                      {scene.actName}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      {scene.timeStart} – {scene.timeEnd}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {scene.visualDescription}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {linkedResources.length} linked
                    </span>
                    {linkedResources.length > 0 && (
                      <div className="flex -space-x-1">
                        {linkedResources.slice(0, 3).map(r => {
                          const meta = RESOURCE_TYPE_META[r.type];
                          const RIcon = meta.icon;
                          return (
                            <div key={r.id} className={`w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${meta.color}`}>
                              <RIcon className="w-3 h-3" />
                            </div>
                          );
                        })}
                        {linkedResources.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                            +{linkedResources.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-200 dark:border-white/5 space-y-4">
                    {/* Scene Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Voiceover</span>
                        <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 italic border-l-2 border-primary/30 pl-3">
                          "{scene.voiceoverText}"
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Camera</span>
                        <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{scene.cameraMovement}</p>
                        {scene.bgmCue && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">🎵 {scene.bgmCue}</p>
                        )}
                      </div>
                    </div>

                    {/* Linked Resources */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Linked Resources</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkingScene(isLinking ? null : scene.id); }}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Link Resource
                        </button>
                      </div>

                      {linkedResources.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {linkedResources.map(r => {
                            const meta = RESOURCE_TYPE_META[r.type];
                            const RIcon = meta.icon;
                            return (
                              <div key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${meta.color} text-xs font-medium`}>
                                <RIcon className="w-3 h-3" />
                                <span className="max-w-[120px] truncate">{r.title}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUnlink(scene.id, r.id); }}
                                  className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                                  title="Unlink resource"
                                >
                                  <Unlink className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">No resources linked to this scene.</p>
                      )}

                      {/* Link Picker Dropdown */}
                      {isLinking && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl space-y-1.5">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select a resource to link:</span>
                          {getUnlinkedResources(scene).map(r => {
                            const meta = RESOURCE_TYPE_META[r.type];
                            const RIcon = meta.icon;
                            return (
                              <button
                                key={r.id}
                                onClick={() => handleLink(scene.id, r.id)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 text-sm text-left transition-colors"
                              >
                                <RIcon className={`w-4 h-4 ${meta.color.split(' ')[1]}`} />
                                <span className="truncate">{r.title}</span>
                                <Link2 className="w-3 h-3 ml-auto text-slate-400" />
                              </button>
                            );
                          })}
                          {getUnlinkedResources(scene).length === 0 && (
                            <p className="text-xs text-slate-500 italic py-1">All resources already linked.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
          {scenes.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No scenes defined yet</p>
              <p className="text-sm mt-1">Use the Campaign Wizard to generate an AV script.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
