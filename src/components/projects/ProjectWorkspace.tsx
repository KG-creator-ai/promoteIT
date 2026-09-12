import React, { useState } from 'react';
import { useCampaignContext } from '../../context/CampaignContext';
import { GlassCard } from '../ui/GlassCard';
import { 
  FolderOpen, Plus, Trash2, Copy, Play, Calendar, Layers, 
  FileText, Settings, Pencil, Check, X 
} from 'lucide-react';

interface ProjectWorkspaceProps {
  onNavigate: (view: string) => void;
}

export function ProjectWorkspace({ onNavigate }: ProjectWorkspaceProps) {
  const { allCampaigns, activeCampaign, setActiveCampaignId, createNewCampaign, duplicateCampaign, deleteCampaign, updateCampaign } = useCampaignContext();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const id = await createNewCampaign(newTitle.trim(), newIndustry.trim() || undefined);
    setNewTitle('');
    setNewIndustry('');
    setIsCreating(false);
    onNavigate('wizard');
  };

  const handleDuplicate = async (campaign: typeof allCampaigns[number]) => {
    await duplicateCampaign(campaign.id!);
    onNavigate('script');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    await deleteCampaign(id);
  };

  const handleOpen = (id: string) => {
    setActiveCampaignId(id);
    onNavigate('script');
  };

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await updateCampaign(id, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
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

  const getSceneCount = (c: typeof allCampaigns[number]) => {
    if (c.sceneGraph && c.sceneGraph.length > 0) return c.sceneGraph.length;
    return 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Campaign Workspace</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all AV campaign projects. Create, edit, duplicate, or delete campaigns.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Create form */}
      {isCreating && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create New Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="new-campaign-title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Campaign Title *</label>
              <input id="new-campaign-title" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Q3 Regional Expansion" className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-campaign-industry" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Industry / Region</label>
              <input id="new-campaign-industry" type="text" value={newIndustry} onChange={e => setNewIndustry(e.target.value)} placeholder="e.g. Financial Services" className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setIsCreating(false); setNewTitle(''); setNewIndustry(''); }} className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={!newTitle.trim()} className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">Create & Start Wizard</button>
          </div>
        </GlassCard>
      )}

      {/* Campaign cards */}
      {!isCreating && allCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCampaigns.map(campaign => {
            const isActive = activeCampaign?.id === campaign.id;
            const scenes = getSceneCount(campaign);
            const isEditing = editingId === campaign.id;
            return (
              <GlassCard key={campaign.id} className={`p-6 flex flex-col ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="flex-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary" autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit(campaign.id!)} />
                      <button onClick={() => saveEdit(campaign.id!)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="Save"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(campaign.status)}`}>
                          {campaign.status || 'Draft'}
                        </span>
                        {isActive && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active</span>}
                      </div>
                      <button onClick={() => startEdit(campaign.id!, campaign.title)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors" title="Rename">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                {!isEditing && <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">{campaign.title}</h3>}
                {campaign.industry && !isEditing && <span className="text-xs text-slate-500 dark:text-slate-400 mb-3">{campaign.industry}</span>}

                {!isEditing && (
                  <>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-auto mb-4">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {scenes} scenes</span>
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {campaign.resourceLibrary?.length || 0} resources</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-4 gap-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleOpen(campaign.id!)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-white rounded-lg hover:scale-105 transition-transform shadow-sm" title="Open in Script Studio" aria-label="Open campaign">
                          <Play className="w-4 h-4 ml-0.5" />
                        </button>
                        <button onClick={() => handleDuplicate(campaign)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" title="Duplicate campaign" aria-label="Duplicate campaign">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => handleDelete(campaign.id!)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors" title="Delete campaign" aria-label="Delete campaign">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isCreating && allCampaigns.length === 0 && (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No campaigns yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first campaign to start generating AV scripts, video prompts, and voiceovers.
          </p>
          <button onClick={() => setIsCreating(true)} className="px-6 py-3 min-h-[44px] bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm">
            Create Campaign
          </button>
        </div>
      )}
    </div>
  );
}
