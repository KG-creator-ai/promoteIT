import { useLiveQuery } from 'dexie-react-hooks';
import { db, Campaign, BrandTemplate, AVSceneNode, AVResourceRef } from '../db/db';
import { useState, useCallback } from 'react';

export function useDexieCampaign() {
  const [error, setError] = useState<string | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const campaigns = useLiveQuery(() => db.campaigns.toArray());
  const brandTemplates = useLiveQuery(() => db.brandTemplates.toArray());

  // Derive active campaign: explicit selection, or fallback to first
  const activeCampaign = useLiveQuery(
    () => {
      if (activeCampaignId) {
        return db.campaigns.get(activeCampaignId);
      }
      return db.campaigns.toCollection().first();
    },
    [activeCampaignId]
  );

  const checkQuota = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usagePercent = (estimate.usage || 0) / (estimate.quota || 1);
      if (usagePercent > 0.8) {
        console.warn(`Storage quota exceeded 80% (${(usagePercent * 100).toFixed(2)}%)`);
      }
    }
  };

  const setActiveCampaign = useCallback((id: string | null) => {
    setActiveCampaignId(id);
  }, []);

  const addCampaign = useCallback(async (campaign: Omit<Campaign, 'createdAt' | 'updatedAt'>) => {
    try {
      await checkQuota();
      const id = crypto.randomUUID();
      await db.campaigns.add({
        ...campaign,
        id,
        status: campaign.status || 'draft',
        sceneGraph: campaign.sceneGraph || [],
        resourceLibrary: campaign.resourceLibrary || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return id;
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to add campaign');
      throw err;
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, updates: Partial<Campaign>) => {
    try {
      await checkQuota();
      await db.campaigns.update(id, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to update campaign');
      throw err;
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string) => {
    try {
      await db.campaigns.delete(id);
      // If the deleted campaign was active, reset selection
      if (activeCampaignId === id) {
        setActiveCampaignId(null);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to delete campaign');
      throw err;
    }
  }, [activeCampaignId]);

  // ── Scene CRUD (N-Scene Support) ──

  const addScene = useCallback(async (campaignId: string, scene: AVSceneNode) => {
    try {
      const campaign = await db.campaigns.get(campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const updatedGraph = [...(campaign.sceneGraph || []), scene];
      await db.campaigns.update(campaignId, {
        sceneGraph: updatedGraph,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to add scene');
      throw err;
    }
  }, []);

  const removeScene = useCallback(async (campaignId: string, sceneId: string) => {
    try {
      const campaign = await db.campaigns.get(campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const updatedGraph = (campaign.sceneGraph || []).filter(s => s.id !== sceneId);
      await db.campaigns.update(campaignId, {
        sceneGraph: updatedGraph,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to remove scene');
      throw err;
    }
  }, []);

  // ── Resource CRUD ──

  const addResource = useCallback(async (campaignId: string, resource: AVResourceRef) => {
    try {
      await checkQuota();
      const campaign = await db.campaigns.get(campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const updatedLibrary = [...(campaign.resourceLibrary || []), resource];
      await db.campaigns.update(campaignId, {
        resourceLibrary: updatedLibrary,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to add resource');
      throw err;
    }
  }, []);

  const linkResource = useCallback(async (campaignId: string, sceneId: string, resourceId: string) => {
    try {
      const campaign = await db.campaigns.get(campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const updatedGraph = (campaign.sceneGraph || []).map(scene => {
        if (scene.id === sceneId && !scene.linkedResourceIds.includes(resourceId)) {
          return { ...scene, linkedResourceIds: [...scene.linkedResourceIds, resourceId] };
        }
        return scene;
      });
      await db.campaigns.update(campaignId, {
        sceneGraph: updatedGraph,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to link resource');
      throw err;
    }
  }, []);

  const unlinkResource = useCallback(async (campaignId: string, sceneId: string, resourceId: string) => {
    try {
      const campaign = await db.campaigns.get(campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const updatedGraph = (campaign.sceneGraph || []).map(scene => {
        if (scene.id === sceneId) {
          return { ...scene, linkedResourceIds: scene.linkedResourceIds.filter(id => id !== resourceId) };
        }
        return scene;
      });
      await db.campaigns.update(campaignId, {
        sceneGraph: updatedGraph,
        updatedAt: Date.now()
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to unlink resource');
      throw err;
    }
  }, []);

  const addBrandTemplate = useCallback(async (template: Omit<BrandTemplate, 'updatedAt'>) => {
    try {
      await checkQuota();
      const id = crypto.randomUUID();
      await db.brandTemplates.add({
        ...template,
        id,
        updatedAt: Date.now()
      });
      return id;
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Failed to add brand template');
      throw err;
    }
  }, []);

  return {
    campaigns,
    brandTemplates,
    activeCampaign,
    activeCampaignId,
    setActiveCampaign,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    addBrandTemplate,
    addScene,
    removeScene,
    addResource,
    linkResource,
    unlinkResource,
    error
  };
}
