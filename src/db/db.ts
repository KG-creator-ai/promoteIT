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
  type: 'pdf_brief' | 'ocr_extract' | 'raw_script' | 'tts_audio' | 'video_prompt' | 'timeline_render' | 'image_asset' | 'video_asset';
  title: string;
  mimeType: string;
  blobOrTextRef?: string;
  metadata?: Record<string, any>;
  createdAt: number;
}

// ──────────────────────────────────────────────
// Dynamic N-Scene Node (Protocol 2)
// ──────────────────────────────────────────────
export interface AVSceneNode {
  id: string;
  sceneIndex: number;
  actName: string;
  timeStart: string;
  timeEnd: string;
  visualDescription: string;
  cameraMovement: string;
  voiceoverText: string;
  phoneticGuide?: string;
  bgmCue?: string;
  linkedResourceIds: string[];
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
  avScript?: AVCut[];
  sceneGraph?: AVSceneNode[];
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
// User Profile (Zero-Backend Auth)
// ──────────────────────────────────────────────
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  authMethod: 'password_pin' | 'fido2_passkey';
  passwordSalt: string;
  passwordHash: string;
  pinHash: string;
  credentialId?: string;
  publicKey?: string;
  encryptedVaultKey: string;
  createdAt: number;
  lastLoginAt: number;
}

// ──────────────────────────────────────────────
// Encrypted Campaign Vault (Per-User Isolation)
// ──────────────────────────────────────────────
export interface EncryptedCampaignVault {
  id: string;
  userId: string;
  encryptedPayload: string;
  iv: string;
  updatedAt: number;
}

// ──────────────────────────────────────────────
// Notification Log (Background Worker Events)
// ──────────────────────────────────────────────
export interface AppNotification {
  id?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'worker' | 'storage' | 'auth' | 'engine' | 'general';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

// ──────────────────────────────────────────────
// Dexie Database Class
// ──────────────────────────────────────────────
export class PromoteITDatabase extends Dexie {
  brandTemplates!: Table<BrandTemplate>;
  campaigns!: Table<Campaign>;
  exports!: Table<ExportHistory>;
  userProfiles!: Table<UserProfile>;
  encryptedVaults!: Table<EncryptedCampaignVault>;
  notifications!: Table<AppNotification>;

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
        if (!campaign.resourceLibrary) {
          campaign.resourceLibrary = [];
        }
        if (!campaign.clientBrandId && campaign.brandTemplateId) {
          campaign.clientBrandId = campaign.brandTemplateId;
        }
      });
    });

    // Version 4 — Auth, Vault, Notifications
    this.version(4).stores({
      userProfiles: 'id, username, email, authMethod',
      encryptedVaults: 'id, userId, updatedAt',
      notifications: 'id, type, category, read, timestamp'
    });
  }
}

export const db = new PromoteITDatabase();
