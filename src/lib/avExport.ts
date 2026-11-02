/**
 * Pure AV export contract (SPEC-020).
 *
 * The export UI, the voiceover EDL and the tests all describe the exported
 * file through these helpers, so the label can never drift from what the
 * exporter actually muxes.
 *
 * Truth rules (D11 spirit):
 *  - The browser speech voiceover is NEVER inside the exported file: Chrome
 *    cannot route speechSynthesis output into a MediaRecorder graph.
 *  - A recorded narration track (tab capture) CAN be muxed, client-side.
 *  - The audio bed is a real signal source and is included when it is active.
 */

export interface ExportContents {
  audioBed: boolean;
  narration: boolean;
  subtitles: boolean;
  browserVoiceoverInFile: false;
  label: string;
  voiceoverNote: string;
}

export const VOICEOVER_NOTE =
  'The browser speech voiceover is not part of the exported file. Record a narration track in Audio Studio to include spoken audio.';

export function buildExportContents(opts: { audioBed: boolean; narration: boolean }): ExportContents {
  const audioBed = !!opts.audioBed;
  const narration = !!opts.narration;
  let label: string;
  if (audioBed && narration) label = 'video + audio bed + recorded narration + subtitles';
  else if (audioBed) label = 'video + audio bed + subtitles';
  else if (narration) label = 'video + recorded narration + subtitles';
  else label = 'video + subtitles only (no audio)';
  return {
    audioBed,
    narration,
    subtitles: true,
    browserVoiceoverInFile: false,
    label,
    voiceoverNote: VOICEOVER_NOTE,
  };
}

export interface ExportAudioSelection {
  tracks: MediaStreamTrack[];
  audioIncluded: boolean;
}

/**
 * Decide which audio tracks enter the exported stream. The video track always
 * survives: a file without audio is still a playable file (AC-004).
 */
export function resolveExportAudio(opts: {
  busTrack?: MediaStreamTrack | null;
  narrationTrack?: MediaStreamTrack | null;
}): ExportAudioSelection {
  const tracks: MediaStreamTrack[] = [];
  if (opts.busTrack) tracks.push(opts.busTrack);
  if (opts.narrationTrack) tracks.push(opts.narrationTrack);
  return { tracks, audioIncluded: tracks.length > 0 };
}

/**
 * Start the audio bed for the export window without ever failing the export.
 * Returns true when a bed was requested and started.
 */
export function startBedSafely(
  engine: { startContinuousBgm: (offset?: number, duration?: number) => void },
  offset = 0,
  duration = 105,
): boolean {
  try {
    engine.startContinuousBgm(offset, duration);
    return true;
  } catch {
    return false;
  }
}

export interface VoiceoverEdlSegment {
  sceneIndex: number;
  actName: string;
  timeStart: string | number;
  timeEnd: string | number;
  voiceoverText: string;
  phoneticGuide: string;
}

export interface VoiceoverEdl {
  campaign: string;
  exportedAt: string;
  voiceURI: string;
  rate: number;
  volume: number;
  audioIncluded: ExportContents;
  browserVoiceoverInFile: false;
  voiceoverNote: string;
  segments: VoiceoverEdlSegment[];
}

/**
 * The voiceover EDL states exactly what the exported media contains.
 */
export function buildVoiceoverEdl(opts: {
  campaign: string;
  exportedAt: string;
  voiceURI: string;
  rate: number;
  volume: number;
  contents: ExportContents;
  segments: VoiceoverEdlSegment[];
}): VoiceoverEdl {
  return {
    campaign: opts.campaign,
    exportedAt: opts.exportedAt,
    voiceURI: opts.voiceURI,
    rate: opts.rate,
    volume: opts.volume,
    audioIncluded: opts.contents,
    browserVoiceoverInFile: false,
    voiceoverNote: opts.contents.voiceoverNote,
    segments: opts.segments,
  };
}

export interface ExportRecorderLike {
  start(timeslice?: number): void;
  stop(): void;
  ondataavailable: ((ev: { data: Blob }) => void) | null;
  onstop: ((ev?: unknown) => void) | null;
}

/**
 * Attach a recorder and collect its chunks. The returned promise resolves with
 * the recorded blob — whether or not the stream carried audio (AC-004).
 */
export function attachExportRecorder(
  recorder: ExportRecorderLike,
  mimeType = 'video/webm',
): { chunks: Blob[]; done: Promise<Blob> } {
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const done = new Promise<Blob>(resolve => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });
  return { chunks, done };
}
