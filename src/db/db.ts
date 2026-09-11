import Dexie, { type Table } from 'dexie';

// ──────────────────────────────────────────────
// Core Brand Template
// ──────────────────────────────────────────────
export interface BrandTemplate {
  id?: string;
  name: string;
  logoBase64?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customStyles?: string;
  updatedAt: number;
}

// ──────────────────────────────────────────────
// Legacy 6-Act Flat Structure (preserved for migration)
// ──────────────────────────────────────────────
export interface AVCut {
  act: number;
  timestampStart: string;
  timestampEnd: string;
  visualDescription: string;
  cameraMovement: string;
  audioVoiceover: string;
  bgmCue: string;
}

// ──────────────────────────────────────────────
// Arbitrary Resource Reference (Protocol 2)
// ──────────────────────────────────────────────
export interface AVResourceRef {
  id: string;
  type: 'pdf_brief' | 'ocr_extract' | 'raw_script' | 'tts_audio' | 'video_prompt' | 'timeline_render';
  title: string;
  mimeType: string;
  blobOrTextRef?: string; // IndexedDB key or raw text
  metadata?: Record<string, any>;
  createdAt: number;
}

// ──────────────────────────────────────────────
// Dynamic N-Scene Node (Protocol 2)
// ──────────────────────────────────────────────
export interface AVSceneNode {
  id: string;
  sceneIndex: number;
  actName: string; // Dynamic label (e.g. "Hook", "Problem", "Solution", "CTA")
  timeStart: string; // e.g. "00:00"
  timeEnd: string;   // e.g. "00:15"
  visualDescription: string;
  cameraMovement: string;
  voiceoverText: string;
  phoneticGuide?: string;
  bgmCue?: string;
  linkedResourceIds: string[]; // ID links to AVResourceRef elements
}

// ──────────────────────────────────────────────
// Multi-Model Video Prompt
// ──────────────────────────────────────────────
export interface VideoPrompt {
  id: string;
  actIndex: number;
  targetModel: 'veo3' | 'runway_gen3' | 'sora2' | 'pika2';
  promptText: string;
  jsonParameters?: string;
}

// ──────────────────────────────────────────────
// Campaign (Extended for Multi-Project + N-Scene)
// ──────────────────────────────────────────────
export interface Campaign {
  id?: string;
  title: string;
  clientBrandId?: string;
  industry?: string;
  rawBriefText?: string;
  normalizedBrief?: string;
  brandTemplateId?: string;
  status?: 'briefing' | 'scripting' | 'prompting' | 'audio_sync' | 'export_ready' | 'draft' | 'active';
  // Legacy flat 6-Act structure (preserved for backward compat)
  avScript?: AVCut[];
  // New N-Scene dynamic graph
  sceneGraph?: AVSceneNode[];
  // Arbitrary resource library
  resourceLibrary?: AVResourceRef[];
  videoPrompts?: VideoPrompt[];
  createdAt: number;
  updatedAt: number;
}

// ──────────────────────────────────────────────
// Export History
// ──────────────────────────────────────────────
export interface ExportHistory {
  id?: string;
  campaignId: string;
  timestamp: number;
}

// ──────────────────────────────────────────────
// Dexie Database Class
// ──────────────────────────────────────────────
export class PromoteITDatabase extends Dexie {
  brandTemplates!: Table<BrandTemplate>;
  campaigns!: Table<Campaign>;
  exports!: Table<ExportHistory>;

  constructor() {
    super('PromoteITDatabase');
    
    // Version 1 Initial Schema
    this.version(1).stores({
      brandTemplates: 'id, name, updatedAt',
      campaigns: 'id, title, brandTemplateId, createdAt, updatedAt',
      exports: 'id, campaignId, timestamp'
    });

    // Version 2 — Added status index + cameraMovement backfill
    this.version(2).stores({
      campaigns: 'id, title, brandTemplateId, status, createdAt, updatedAt'
    }).upgrade(async tx => {
      return tx.table('campaigns').toCollection().modify(campaign => {
        campaign.status = campaign.status || 'draft';
        if (campaign.avScript) {
          // Normalize nested 6-Act structure if schema updated
          campaign.avScript = campaign.avScript.map((cut: any) => ({
            ...cut,
            cameraMovement: cut.cameraMovement || 'Static Center'
          }));
        }
      });
    });

    // Version 3 — Multi-Project N-Scene + Resource Library migration
    this.version(3).stores({
      campaigns: 'id, title, brandTemplateId, clientBrandId, status, createdAt, updatedAt'
    }).upgrade(async tx => {
      return tx.table('campaigns').toCollection().modify(campaign => {
        // Auto-convert legacy avScript → sceneGraph if not already present
        if (!campaign.sceneGraph && campaign.avScript && campaign.avScript.length > 0) {
          campaign.sceneGraph = campaign.avScript.map((cut: AVCut, idx: number) => ({
            id: `scene-${crypto.randomUUID().slice(0, 8)}`,
            sceneIndex: idx,
            actName: `Act ${cut.act}`,
            timeStart: cut.timestampStart,
            timeEnd: cut.timestampEnd,
            visualDescription: cut.visualDescription,
            cameraMovement: cut.cameraMovement || 'Static Center',
            voiceoverText: cut.audioVoiceover,
            phoneticGuide: undefined,
            bgmCue: cut.bgmCue,
            linkedResourceIds: []
          }));
        }
        // Initialize empty resource library if not present
        if (!campaign.resourceLibrary) {
          campaign.resourceLibrary = [];
        }
        // Set clientBrandId from brandTemplateId if available
        if (!campaign.clientBrandId && campaign.brandTemplateId) {
          campaign.clientBrandId = campaign.brandTemplateId;
        }
      });
    });
  }
}

export const db = new PromoteITDatabase();
