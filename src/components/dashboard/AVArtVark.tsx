import React, { useState } from 'react';
import { useCampaignContext } from '../../context/CampaignContext';
import { LayoutGrid, List as ListIcon, Columns, Plus, MoreVertical, Play, Calendar, Layers } from 'lucide-react';

interface AVArtVarkProps {
  onNavigate: (view: string) => void;
}

export function AVArtVark({ onNavigate }: AVArtVarkProps) {
  const { allCampaigns: campaigns, setActiveCampaignId: setActiveCampaign } = useCampaignContext();
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenCampaign = (campaignId: string, target: string) => {
    setActiveCampaign(campaignId);
    onNavigate(target);
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredCampaigns = q
    ? campaigns?.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.industry || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
      )
    : campaigns;

  // Helper: get scene count from either sceneGraph or legacy avScript
  const getSceneCount = (campaign: typeof campaigns extends (infer T)[] | undefined ? T : never) => {
    if (campaign.sceneGraph && campaign.sceneGraph.length > 0) return campaign.sceneGraph.length;
    return campaign.avScript?.length || 0;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'briefing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'scripting': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'prompting': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'audio_sync': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300';
      case 'export_ready': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      case 'active': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">AV-ArtVark Workspace</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and produce audio-visual corporate campaign assets.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-300 dark:border-white/10 backdrop-blur-md" role="group" aria-label="Workspace view mode">
          <button 
            onClick={() => setViewMode('kanban')}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-label="Kanban View"
            aria-pressed={viewMode === 'kanban'}
            title="Kanban View"
          >
            <Columns className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-label="Grid View"
            aria-pressed={viewMode === 'grid'}
            title="Grid View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            aria-label="List View"
            aria-pressed={viewMode === 'list'}
            title="List View"
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by title, industry, or status…"
          aria-label="Search campaigns"
          className="px-4 py-2 min-h-[44px] bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl text-sm w-full sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {q && (
          <p className="text-sm text-slate-500 dark:text-slate-400 self-center" aria-live="polite">
            {filteredCampaigns?.length || 0} of {campaigns?.length || 0} campaigns
          </p>
        )}
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            onClick={() => onNavigate('wizard')}
            className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:border-primary dark:hover:border-primary transition-all group backdrop-blur-sm bg-white/50 dark:bg-slate-950/50"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <span className="text-lg font-medium text-slate-900 dark:text-slate-100">New AV Campaign</span>
          </button>
          
          {filteredCampaigns?.map(campaign => {
            const sceneCount = getSceneCount(campaign);
            return (
              <div key={campaign.id} className="relative group flex flex-col h-64 bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all backdrop-blur-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(campaign.status)}`}>
                      {campaign.status || 'Draft'}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="More options">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{campaign.title}</h3>
                
                {campaign.industry && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-2">{campaign.industry}</span>
                )}

                <div className="flex items-center gap-2 mt-auto mb-4">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {sceneCount} Scenes
                    </span>
                    {(campaign.resourceLibrary?.length || 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {campaign.resourceLibrary!.length} Resources
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleOpenCampaign(campaign.id!, 'script')}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                    aria-label="Open script"
                  >
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-end items-center gap-4">
              <button onClick={() => onNavigate('wizard')} className="px-4 py-2 min-h-[44px] bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                + New Campaign
              </button>
            </div>
           <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
             <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
               <tr>
                 <th className="px-6 py-4">Campaign Title</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4">Scenes</th>
                 <th className="px-6 py-4">Resources</th>
                 <th className="px-6 py-4">Created</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {filteredCampaigns?.map(campaign => (
                 <tr key={campaign.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                   <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{campaign.title}</td>
                   <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                       {campaign.status || 'Draft'}
                     </span>
                   </td>
                   <td className="px-6 py-4">{getSceneCount(campaign)} Scenes</td>
                   <td className="px-6 py-4">{campaign.resourceLibrary?.length || 0}</td>
                   <td className="px-6 py-4">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                   <td className="px-6 py-4 text-right">
                     <button onClick={() => handleOpenCampaign(campaign.id!, 'script')} className="text-primary font-medium hover:underline">Open Studio</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {['Briefing', 'Scripting', 'Prompt Engineering', 'Audio Sync', 'Export Ready'].map((stage, idx) => {
            const stageKeys = ['briefing', 'scripting', 'prompting', 'audio_sync', 'export_ready'];
            const stageCampaigns = filteredCampaigns?.filter(c => c.status === stageKeys[idx]) || [];
            // For backward compat, put 'active'/'draft' campaigns in first column
            const allStageCampaigns = idx === 0 
              ? [...stageCampaigns, ...(filteredCampaigns?.filter(c => c.status === 'active' || c.status === 'draft' || !c.status) || [])]
              : stageCampaigns;

            return (
              <div key={stage} className="min-w-[320px] snap-center flex flex-col bg-slate-100/70 dark:bg-slate-900/30 rounded-3xl p-4 border border-slate-200 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 px-2 flex items-center justify-between">
                  {stage}
                  <span className="text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg">
                    {allStageCampaigns.length}
                  </span>
                </h3>
                <div className="flex-1 space-y-4">
                  {allStageCampaigns.map(campaign => (
                    <div 
                      key={campaign.id} 
                      className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors backdrop-blur-xl"
                      onClick={() => handleOpenCampaign(campaign.id!, 'script')}
                    >
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-2">{campaign.title}</h4>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                          {getSceneCount(campaign)} Scenes
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
