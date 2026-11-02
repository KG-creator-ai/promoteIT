/**
 * Pure PCM audio metrics (SPEC-020 AC-001, extended by SPEC-021).
 *
 * These are the measurements that decide whether an exported track is audible
 * or silent — the exact failure the AV audit must catch.
 */

export interface AudioMetrics {
  peak: number;
  rms: number;
  silenceRatio: number;
  durationSec: number;
  sampleCount: number;
}

/** A peak below this is indistinguishable from silence. */
export const SILENCE_FLOOR = 0.01;
/** More than this share of silent frames means the track is effectively mute. */
export const MAX_SILENCE_RATIO = 0.9;
/** A frame shorter than this is treated as silence (absolute value). */
export const SILENCE_FRAME_THRESHOLD = 0.01;

export function analyzePcm(samples: Float32Array | number[], sampleRate = 48000): AudioMetrics {
  const data = samples instanceof Float32Array ? samples : Float32Array.from(samples);
  const n = data.length;
  if (n === 0) {
    return { peak: 0, rms: 0, silenceRatio: 1, durationSec: 0, sampleCount: 0 };
  }
  let peak = 0;
  let sumSquares = 0;
  let silent = 0;
  for (let i = 0; i < n; i++) {
    const v = data[i];
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    sumSquares += v * v;
    if (abs < SILENCE_FRAME_THRESHOLD) silent++;
  }
  return {
    peak,
    rms: Math.sqrt(sumSquares / n),
    silenceRatio: silent / n,
    durationSec: n / Math.max(1, sampleRate),
    sampleCount: n,
  };
}

export interface AudioAssessment {
  pass: boolean;
  reasons: string[];
}

/**
 * An exported track passes only when it is measurably audible.
 */
export function assessAudioTrack(metrics: AudioMetrics): AudioAssessment {
  const reasons: string[] = [];
  if (metrics.sampleCount === 0) reasons.push('no audio samples');
  if (metrics.peak < SILENCE_FLOOR) reasons.push(`peak ${metrics.peak.toFixed(5)} below silence floor ${SILENCE_FLOOR}`);
  if (metrics.silenceRatio > MAX_SILENCE_RATIO) {
    reasons.push(`silence ratio ${metrics.silenceRatio.toFixed(3)} above ceiling ${MAX_SILENCE_RATIO}`);
  }
  return { pass: reasons.length === 0, reasons };
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
