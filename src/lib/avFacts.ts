/**
 * Typed AV facts — the browser half of the measurement harness (SPEC-021).
 *
 * The on-disk facts come from scripts/av-analyze.mjs (ffprobe/ffmpeg); the
 * in-browser facts come from the exported blob via decodeAudioData. Both use
 * the same core (src/lib/avMetricsCore.mjs) and the same verdict, so the two
 * paths agree by construction.
 */
import {
  analyzePcm,
  assessAudioTrack,
  assessAvFacts,
  computeAvDrift,
  SILENCE_FLOOR,
  MAX_SILENCE_RATIO,
  SILENCE_FRAME_THRESHOLD,
  CLIP_THRESHOLD,
  DEFAULT_FPS,
} from './avMetricsCore.mjs';

export {
  analyzePcm,
  assessAudioTrack,
  assessAvFacts,
  computeAvDrift,
  SILENCE_FLOOR,
  MAX_SILENCE_RATIO,
  SILENCE_FRAME_THRESHOLD,
  CLIP_THRESHOLD,
  DEFAULT_FPS,
};

export interface AudioMetrics {
  peak: number;
  rms: number;
  silenceRatio: number;
  clippingRatio: number;
  durationSec: number;
  sampleCount: number;
}

export interface AudioAssessment {
  pass: boolean;
  reasons: string[];
}

export interface AudioFacts {
  peak: number;
  rms: number;
  silenceRatio: number;
  clippingRatio: number;
  durationSec: number;
  sampleCount: number;
}

export interface StreamFacts {
  codec: string;
  durationSec: number;
  bitrate: number;
  channels?: number;
  sampleRate?: number;
  width?: number;
  height?: number;
  fps?: number;
}

export interface AvFacts {
  artifact: { path: string; sha256: string; bytes: number };
  streams: { video: StreamFacts | null; audio: StreamFacts | null };
  audio: AudioFacts;
  av: { driftSec: number; toleranceSec: number; withinTolerance: boolean };
  video: { blackFrameCount: number; blackFrameRatio: number; freezeFrameCount: number };
  verdict: { pass: boolean; reasons: string[] };
}

export interface DecodedAudio {
  numberOfChannels: number;
  sampleRate: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

export type AudioDecoder = (arrayBuffer: ArrayBuffer) => Promise<DecodedAudio>;

/**
 * Decode an exported blob and compute the audio facts — no server involved.
 */
export async function analyzeBlobAudio(
  blob: Blob,
  decode: AudioDecoder,
): Promise<{ audio: AudioFacts; stream: StreamFacts }> {
  const buffer = await blob.arrayBuffer();
  const decoded = await decode(buffer);
  const channels = Math.max(1, decoded.numberOfChannels || 1);
  // Mix to mono: the bed and the narration are summed by the browser anyway.
  const mono = new Float32Array(decoded.length);
  for (let c = 0; c < channels; c++) {
    const data = decoded.getChannelData(c);
    for (let i = 0; i < decoded.length; i++) mono[i] += data[i] / channels;
  }
  const audio = analyzePcm(mono, decoded.sampleRate || 48000) as AudioFacts;
  return {
    audio,
    stream: {
      codec: 'pcm',
      durationSec: audio.durationSec,
      bitrate: Math.round(decoded.sampleRate * channels * 32),
      channels,
      sampleRate: decoded.sampleRate,
    },
  };
}

/**
 * Build the full facts object from an in-browser decode and (optionally) the
 * picture facts measured on disk.
 */
export function buildAvFacts(input: {
  artifact: AvFacts['artifact'];
  video: StreamFacts | null;
  audio: AudioFacts;
  audioStream: StreamFacts;
  blackFrameCount?: number;
  freezeFrameCount?: number;
}): AvFacts {
  const videoDuration = input.video?.durationSec ?? 0;
  const drift = computeAvDrift(videoDuration, input.audio.durationSec, input.video?.fps || DEFAULT_FPS);
  const facts: AvFacts = {
    artifact: input.artifact,
    streams: { video: input.video, audio: input.audioStream },
    audio: input.audio,
    av: drift,
    video: {
      blackFrameCount: input.blackFrameCount ?? 0,
      blackFrameRatio: videoDuration > 0 ? (input.blackFrameCount ?? 0) / Math.max(1, videoDuration * (input.video?.fps || DEFAULT_FPS)) : 0,
      freezeFrameCount: input.freezeFrameCount ?? 0,
    },
    verdict: { pass: false, reasons: [] },
  };
  facts.verdict = assessAvFacts(facts);
  return facts;
}
