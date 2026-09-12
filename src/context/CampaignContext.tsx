import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Campaign, AVCut, AVSceneNode, AVResourceRef } from '../db/db';

export interface CampaignProject {
  id?: string;
  title: string;
  industry?: string;
  status?: Campaign['status'];
  sceneGraph: AVSceneNode[];
  resourceLibrary: AVResourceRef[];
  avScript?: AVCut[];
  videoPrompts?: any[];
  rawBriefText?: string;
  brandTemplateId?: string;
  clientBrandId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignContextType {
  activeCampaign: CampaignProject | null;
  activeCampaignId: string | null;
  scenes: AVSceneNode[];
  resources: AVResourceRef[];
  allCampaigns: CampaignProject[];
  setActiveCampaignId: (id: string | null) => Promise<void>;
  createNewCampaign: (title: string, industry?: string) => Promise<string>;
  duplicateCampaign: (id: string) => Promise<string>;
  deleteCampaign: (id: string) => Promise<void>;
  updateScene: (sceneId: string, delta: Partial<AVSceneNode>) => Promise<void>;
  addScene: (actName: string) => Promise<void>;
  removeScene: (sceneId: string) => Promise<void>;
  updateCampaign: (id: string, delta: Partial<Campaign>) => Promise<void>;
  linkResource: (sceneId: string, resourceId: string) => Promise<void>;
  unlinkResource: (sceneId: string, resourceId: string) => Promise<void>;
  refreshCampaignData: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export function useCampaignContext(): CampaignContextType {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaignContext must be used within CampaignProvider');
  return ctx;
}

function checkQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(est => {
      const pct = (est.usage || 0) / (est.quota || 1);
      if (pct > 0.8) console.warn(`Storage quota exceeded 80% (${(pct * 100).toFixed(2)}%)`);
    });
  }
}

interface CampaignProviderProps {
  children: ReactNode;
  onActiveCampaignChange?: (id: string | null) => void;
}

export function CampaignProvider({ children, onActiveCampaignChange }: CampaignProviderProps) {
  const [activeCampaignId, setActiveCampaignIdState] = useState<string | null>(null);

  // Reactive Dexie queries
  const allCampaignsRaw = useLiveQuery(() => db.campaigns.toArray()) || [];
  const allCampaigns: CampaignProject[] = allCampaignsRaw.map(c => ({
    ...c,
    sceneGraph: c.sceneGraph || [],
    resourceLibrary: c.resourceLibrary || [],
  }));

  const activeCampaignRaw = useLiveQuery(
    () => {
      if (activeCampaignId) return db.campaigns.get(activeCampaignId);
      return db.campaigns.toCollection().first();
    },
    [activeCampaignId]
  );

  const activeCampaign: CampaignProject | null = activeCampaignRaw
    ? {
        ...activeCampaignRaw,
        sceneGraph: activeCampaignRaw.sceneGraph || [],
        resourceLibrary: activeCampaignRaw.resourceLibrary || [],
      }
    : null;

  const scenes: AVSceneNode[] = activeCampaign?.sceneGraph || [];
  const resources: AVResourceRef[] = activeCampaign?.resourceLibrary || [];

  // Notify parent of active campaign changes
  useEffect(() => {
    onActiveCampaignChange?.(activeCampaign?.id || null);
  }, [activeCampaign?.id]);

  // ── Core Methods ──

  const setActiveCampaignId = useCallback(async (id: string | null) => {
    setActiveCampaignIdState(id);
  }, []);

  const createNewCampaign = useCallback(async (title: string, industry?: string): Promise<string> => {
    checkQuota();
    const id = crypto.randomUUID();
    await db.campaigns.put({
      id,
      title: title.trim() || 'Untitled Campaign',
      industry: industry?.trim() || undefined,
      status: 'draft',
      sceneGraph: [],
      resourceLibrary: [],
      videoPrompts: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await setActiveCampaignIdState(id);
    return id;
  }, []);

  const duplicateCampaign = useCallback(async (sourceId: string): Promise<string> => {
    checkQuota();
    const source = await db.campaigns.get(sourceId);
    if (!source) throw new Error('Campaign not found');
    const id = crypto.randomUUID();
    await db.campaigns.put({
      ...source,
      id,
      title: `${source.title} (Copy)`,
      status: 'draft',
      sceneGraph: JSON.parse(JSON.stringify(source.sceneGraph || [])),
      resourceLibrary: JSON.parse(JSON.stringify(source.resourceLibrary || [])),
      videoPrompts: JSON.parse(JSON.stringify(source.videoPrompts || [])),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    await db.campaigns.delete(id);
    if (activeCampaignId === id) {
      await setActiveCampaignIdState(null);
    }
  }, [activeCampaignId]);

  const updateCampaign = useCallback(async (id: string, delta: Partial<Campaign>) => {
    checkQuota();
    await db.campaigns.update(id, { ...delta, updatedAt: Date.now() });
  }, []);

  // ── Scene CRUD ──

  const addScene = useCallback(async (actName: string) => {
    if (!activeCampaign?.id) return;
    const existing = activeCampaign.sceneGraph || [];
    const newScene: AVSceneNode = {
      id: `scene-${crypto.randomUUID().slice(0, 8)}`,
      sceneIndex: existing.length,
      actName,
      timeStart: '00:00',
      timeEnd: '00:15',
      visualDescription: '',
      cameraMovement: 'Static',
      voiceoverText: '',
      phoneticGuide: undefined,
      bgmCue: undefined,
      linkedResourceIds: [],
    };
    await db.campaigns.update(activeCampaign.id, {
      sceneGraph: [...existing, newScene],
      updatedAt: Date.now(),
    });
  }, [activeCampaign]);

  const updateScene = useCallback(async (sceneId: string, delta: Partial<AVSceneNode>) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.map(s => s.id === sceneId ? { ...s, ...delta } : s);
    await db.campaigns.update(activeCampaign.id, {
      sceneGraph: updated,
      updatedAt: Date.now(),
    });
  }, [activeCampaign, scenes]);

  const removeScene = useCallback(async (sceneId: string) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.filter(s => s.id !== sceneId);
    await db.campaigns.update(activeCampaign.id, {
      sceneGraph: updated,
      updatedAt: Date.now(),
    });
  }, [activeCampaign, scenes]);

  // ── Resource Linking ──

  const linkResource = useCallback(async (sceneId: string, resourceId: string) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.map(s => {
      if (s.id === sceneId && !s.linkedResourceIds.includes(resourceId)) {
        return { ...s, linkedResourceIds: [...s.linkedResourceIds, resourceId] };
      }
      return s;
    });
    await db.campaigns.update(activeCampaign.id, {
      sceneGraph: updated,
      updatedAt: Date.now(),
    });
  }, [activeCampaign, scenes]);

  const unlinkResource = useCallback(async (sceneId: string, resourceId: string) => {
    if (!activeCampaign?.id) return;
    const updated = scenes.map(s => {
      if (s.id === sceneId) {
        return { ...s, linkedResourceIds: s.linkedResourceIds.filter(id => id !== resourceId) };
      }
      return s;
    });
    await db.campaigns.update(activeCampaign.id, {
      sceneGraph: updated,
      updatedAt: Date.now(),
    });
  }, [activeCampaign, scenes]);

  const refreshCampaignData = useCallback(async () => {
    // Dexie useLiveQuery auto-refreshes; this is a no-op for compatibility
  }, []);

  const value: CampaignContextType = {
    activeCampaign,
    activeCampaignId: activeCampaign?.id || activeCampaignId,
    scenes,
    resources,
    allCampaigns,
    setActiveCampaignId,
    createNewCampaign,
    duplicateCampaign,
    deleteCampaign,
    updateScene,
    addScene,
    removeScene,
    updateCampaign,
    linkResource,
    unlinkResource,
    refreshCampaignData,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}
