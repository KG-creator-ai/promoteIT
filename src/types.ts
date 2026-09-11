export interface Scene {
  id: string;
  actNumber: number;
  actTitle: string;
  sceneTitle: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  imageSrc: string;
  videoSrc?: string;
  mediaType?: 'image' | 'video';
  motionType: 'drone_sweep' | 'pan_right' | 'macro_zoom' | 'orbital_sweep' | 'slow_push_in' | 'outro_reveal';
  startScale: number;
  endScale: number;
  panDirection?: 'left_to_right' | 'right_to_left' | 'center' | 'bottom_to_top';
  ostTag: string;
  ostTitle: string;
  aiPrompt: string;
  voiceoverText: string;
  audioCues: string;
  aspectRatio?: string;
}

export interface Act {
  number: number;
  title: string;
  subtitle: string;
  timeRange: string;
  startTime: number;
  endTime: number;
  scenes: Scene[];
  summary: string;
}

export interface VideoSettings {
  aspectRatio: '16:9' | '9:16';
  resolution: '1080p' | '720p';
  voiceoverEnabled: boolean;
  voicePitch: number;
  voiceRate: number;
  selectedVoiceURI?: string;
  voiceoverMode: 'seamless_full' | 'per_act';
  bgmEnabled: boolean;
  bgmVolume: number;
  showSubtitles: boolean;
  showLowerThird: boolean;
  showWatermark: boolean;
  colorGrade: 'golden_hour' | 'cinematic_teal' | 'natural';
}

export type { AVResourceRef, AVSceneNode } from './db/db';

export interface CampaignPreset {
  id: string;
  title: string;
  region: string;
  targetAudience: string;
  products: string[];
  businessTarget: string;
  languageTone: string;
  badge: string;
  description: string;
  scenes: Scene[];
  sceneGraph?: import('./db/db').AVSceneNode[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSceneIndex: number;
  activeAct: number;
  isRecording: boolean;
  recordProgress: number;
  playbackMode: 'act1' | 'full';
}
