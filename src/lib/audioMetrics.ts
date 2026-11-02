/**
 * PCM audio metrics (SPEC-020 AC-001, extended by SPEC-021).
 *
 * The implementation lives in the shared core (src/lib/avMetricsCore.mjs) so
 * the browser path and the local analyser CLI cannot drift apart.
 */
import {
  analyzePcm as coreAnalyzePcm,
  assessAudioTrack as coreAssessAudioTrack,
  SILENCE_FLOOR as CORE_SILENCE_FLOOR,
  MAX_SILENCE_RATIO as CORE_MAX_SILENCE_RATIO,
  SILENCE_FRAME_THRESHOLD as CORE_SILENCE_FRAME_THRESHOLD,
  CLIP_THRESHOLD as CORE_CLIP_THRESHOLD,
} from './avMetricsCore.mjs';

export type { AudioMetrics, AudioAssessment } from './avFacts';

export const SILENCE_FLOOR = CORE_SILENCE_FLOOR;
export const MAX_SILENCE_RATIO = CORE_MAX_SILENCE_RATIO;
export const SILENCE_FRAME_THRESHOLD = CORE_SILENCE_FRAME_THRESHOLD;
export const CLIP_THRESHOLD = CORE_CLIP_THRESHOLD;

export function analyzePcm(samples: Float32Array | number[], sampleRate = 48000) {
  return coreAnalyzePcm(samples, sampleRate);
}

export function assessAudioTrack(metrics: Parameters<typeof coreAssessAudioTrack>[0]) {
  return coreAssessAudioTrack(metrics);
}

/**
 * Synthesize a bed-like signal for tests and dry runs: a sine wave with a
 * given amplitude. Used to prove the exporter can produce an audible bus.
 */
export function synthesizeTone(seconds: number, frequency = 220, amplitude = 0.2, sampleRate = 48000): Float32Array {
  const n = Math.max(1, Math.floor(seconds * sampleRate));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return out;
}
