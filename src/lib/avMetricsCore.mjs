/**
 * Shared AV measurement core — dependency-free ESM.
 *
 * Consumed by BOTH the local analyser CLI (scripts/av-analyze.mjs) and the
 * browser path (src/lib/avFacts.ts), so the on-disk facts and the in-browser
 * facts cannot drift apart. Kept as plain JS because the CLI runs on node
 * without a TypeScript loader.
 */

/** A peak below this is indistinguishable from silence. */
export const SILENCE_FLOOR = 0.01;
/** More than this share of silent frames means the track is effectively mute. */
export const MAX_SILENCE_RATIO = 0.9;
/** A frame shorter than this is treated as silence (absolute value). */
export const SILENCE_FRAME_THRESHOLD = 0.01;
/** Samples at or above this level count as clipped. */
export const CLIP_THRESHOLD = 0.99;
/** Default video frame rate used for the A/V drift tolerance. */
export const DEFAULT_FPS = 30;

/**
 * @param {Float32Array|number[]} samples
 * @param {number} sampleRate
 */
export function analyzePcm(samples, sampleRate = 48000) {
  const data = samples instanceof Float32Array ? samples : Float32Array.from(samples);
  const n = data.length;
  if (n === 0) {
    return { peak: 0, rms: 0, silenceRatio: 1, clippingRatio: 0, durationSec: 0, sampleCount: 0 };
  }
  let peak = 0;
  let sumSquares = 0;
  let silent = 0;
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    const v = data[i];
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    sumSquares += v * v;
    if (abs < SILENCE_FRAME_THRESHOLD) silent++;
    if (abs >= CLIP_THRESHOLD) clipped++;
  }
  return {
    peak,
    rms: Math.sqrt(sumSquares / n),
    silenceRatio: silent / n,
    clippingRatio: clipped / n,
    durationSec: n / Math.max(1, sampleRate),
    sampleCount: n,
  };
}

/**
 * @param {{peak:number,rms:number,silenceRatio:number,clippingRatio:number,durationSec:number,sampleCount:number}} metrics
 */
export function assessAudioTrack(metrics) {
  const reasons = [];
  if (!metrics || metrics.sampleCount === 0) reasons.push('no audio samples');
  if (metrics && metrics.peak < SILENCE_FLOOR) reasons.push(`peak ${metrics.peak.toFixed(5)} below silence floor ${SILENCE_FLOOR}`);
  if (metrics && metrics.silenceRatio > MAX_SILENCE_RATIO) {
    reasons.push(`silence ratio ${metrics.silenceRatio.toFixed(3)} above ceiling ${MAX_SILENCE_RATIO}`);
  }
  if (metrics && metrics.clippingRatio > 0.01) {
    reasons.push(`clipping ratio ${metrics.clippingRatio.toFixed(4)} above 0.01`);
  }
  return { pass: reasons.length === 0, reasons };
}

/**
 * Picture-and-sound drift and its tolerance (one frame).
 * @param {number} videoDurationSec
 * @param {number} audioDurationSec
 * @param {number} fps
 */
export function computeAvDrift(videoDurationSec, audioDurationSec, fps = DEFAULT_FPS) {
  const drift = Math.abs((videoDurationSec || 0) - (audioDurationSec || 0));
  const tolerance = 1 / Math.max(1, fps || DEFAULT_FPS);
  return { driftSec: Number(drift.toFixed(6)), toleranceSec: Number(tolerance.toFixed(6)), withinTolerance: drift <= tolerance };
}

/**
 * The AV facts check: the verdict that no false "audible, in sync" claim can
 * slip through.
 * @param {any} facts
 */
export function assessAvFacts(facts) {
  const reasons = [];
  const video = facts?.streams?.video;
  const audio = facts?.streams?.audio;

  if (!video) reasons.push('no video stream');
  if (!audio) {
    reasons.push('no audio stream');
  } else {
    const audioVerdict = assessAudioTrack(facts?.audio);
    if (!audioVerdict.pass) reasons.push(...audioVerdict.reasons);
  }

  if (video && audio) {
    const drift = facts?.av?.driftSec ?? computeAvDrift(video.durationSec, audio.durationSec, video.fps).driftSec;
    const tolerance = facts?.av?.toleranceSec ?? computeAvDrift(video.durationSec, audio.durationSec, video.fps).toleranceSec;
    if (drift > tolerance) reasons.push(`A/V drift ${drift.toFixed(3)}s exceeds one-frame tolerance ${tolerance.toFixed(3)}s`);
  }

  const blackRatio = facts?.video?.blackFrameRatio ?? 0;
  if (blackRatio > 0.5) reasons.push(`black frame ratio ${blackRatio.toFixed(3)} above 0.5`);

  return { pass: reasons.length === 0, reasons };
}
