// SPEC-021.AC-002 — the same audio facts must be computable in-browser from
// the exported blob (no server), and the in-browser and on-disk paths must
// agree on the duration within one frame.
import { describe, it, expect } from 'vitest';
import {
  analyzeBlobAudio,
  analyzePcm,
  buildAvFacts,
  computeAvDrift,
  type DecodedAudio,
} from '../../src/lib/avFacts';

function decodeFrom(samples: Float32Array, sampleRate = 48000, channels = 1): DecodedAudio {
  return {
    numberOfChannels: channels,
    sampleRate,
    length: samples.length,
    getChannelData: () => samples,
  };
}

function tone(seconds: number, frequency = 220, amplitude = 0.25, sampleRate = 48000): Float32Array {
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  return out;
}

describe('SPEC-021 AC-002 — in-browser audio facts', () => {
  it('computes the audio facts from a decoded blob without a server', async () => {
    const samples = tone(2, 220, 0.25);
    const blob = new Blob([new Uint8Array(samples.buffer)], { type: 'audio/webm' });

    const { audio, stream } = await analyzeBlobAudio(blob, async () => decodeFrom(samples));

    expect(audio.durationSec).toBeCloseTo(2, 3);
    expect(audio.peak).toBeCloseTo(0.25, 3);
    expect(audio.rms).toBeGreaterThan(0);
    expect(audio.silenceRatio).toBeLessThan(0.1);
    expect(audio.clippingRatio).toBe(0);
    expect(stream.sampleRate).toBe(48000);
    expect(stream.channels).toBe(1);
  });

  it('mixes a stereo track to mono', async () => {
    const left = tone(1, 220, 0.4);
    const right = tone(1, 330, 0.4);
    const blob = new Blob([new Uint8Array(8)], { type: 'audio/webm' });
    const decoder: DecodedAudio = {
      numberOfChannels: 2,
      sampleRate: 48000,
      length: left.length,
      getChannelData: (c: number) => (c === 0 ? left : right),
    };

    const { audio, stream } = await analyzeBlobAudio(blob, async () => decoder);

    expect(stream.channels).toBe(2);
    // The mono mix of two equal-amplitude tones stays below the source peak.
    expect(audio.peak).toBeLessThanOrEqual(0.4 + 1e-6);
    expect(audio.peak).toBeGreaterThan(0.1);
  });

  it('agrees with the on-disk path on the duration within one frame', async () => {
    const samples = tone(2.5, 180, 0.3);
    const blob = new Blob([new Uint8Array(samples.buffer)], { type: 'audio/webm' });

    const { audio } = await analyzeBlobAudio(blob, async () => decodeFrom(samples));
    // The on-disk path (scripts/av-analyze.mjs) measures the duration with the
    // same core function over the same PCM.
    const onDisk = analyzePcm(samples, 48000);
    const tolerance = 1 / 30;

    expect(Math.abs(audio.durationSec - onDisk.durationSec)).toBeLessThanOrEqual(tolerance);
    expect(audio.durationSec).toBeCloseTo(onDisk.durationSec, 6);
  });

  it('flags a silent blob through the same verdict as the analyser', async () => {
    const silence = new Float32Array(48000);
    const blob = new Blob([new Uint8Array(8)], { type: 'audio/webm' });

    const { audio } = await analyzeBlobAudio(blob, async () => decodeFrom(silence));
    const facts = buildAvFacts({
      artifact: { path: 'blob', sha256: '0000000000000000', bytes: 8 },
      video: { codec: 'vp9', durationSec: 1, bitrate: 100000, width: 320, height: 240, fps: 30 },
      audio,
      audioStream: { codec: 'pcm', durationSec: audio.durationSec, bitrate: 0, channels: 1, sampleRate: 48000 },
    });

    expect(facts.verdict.pass).toBe(false);
    expect(facts.verdict.reasons.join(' ')).toMatch(/silence/i);
  });

  it('passes an audible, in-sync artifact', async () => {
    const samples = tone(1, 220, 0.3);
    const blob = new Blob([new Uint8Array(samples.buffer)], { type: 'audio/webm' });

    const { audio } = await analyzeBlobAudio(blob, async () => decodeFrom(samples));
    const facts = buildAvFacts({
      artifact: { path: 'blob', sha256: '1111111111111111', bytes: 8 },
      video: { codec: 'vp9', durationSec: 1, bitrate: 100000, width: 320, height: 240, fps: 30 },
      audio,
      audioStream: { codec: 'pcm', durationSec: audio.durationSec, bitrate: 0, channels: 1, sampleRate: 48000 },
    });

    expect(facts.verdict.pass).toBe(true);
    expect(facts.verdict.reasons).toEqual([]);
    expect(facts.av.withinTolerance).toBe(true);
    expect(computeAvDrift(1, 1, 30).driftSec).toBe(0);
  });
});
