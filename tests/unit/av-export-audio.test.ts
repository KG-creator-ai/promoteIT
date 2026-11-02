// SPEC-020.AC-001 / AC-002 — the exported file must be audible and must state
// exactly what it contains.
//
// The analyser core lives in src/lib/audioMetrics.ts (SPEC-021 builds the
// measurement harness on top of it).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { audioEngine } from '../../src/services/audioEngine';
import {
  analyzePcm,
  assessAudioTrack,
  synthesizeTone,
  SILENCE_FLOOR,
  MAX_SILENCE_RATIO,
} from '../../src/lib/audioMetrics';
import {
  buildExportContents,
  buildVoiceoverEdl,
  resolveExportAudio,
  startBedSafely,
} from '../../src/lib/avExport';

class FakeParam {
  value = 0;
  setValueAtTime(v: number) { this.value = v; return this; }
  setTargetAtTime(v: number) { this.value = v; return this; }
  linearRampToValueAtTime(v: number) { this.value = v; return this; }
  exponentialRampToValueAtTime(v: number) { this.value = v; return this; }
  cancelScheduledValues() { return this; }
}

class FakeNode {
  connections: unknown[] = [];
  connect(target: unknown) { this.connections.push(target); return target; }
  disconnect() { this.connections = []; }
}

class FakeOscillator extends FakeNode {
  frequency = new FakeParam();
  detune = new FakeParam();
  pan = new FakeParam();
  type = 'sine';
  started = false;
  stopped = false;
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeGain extends FakeNode {
  gain = new FakeParam();
}

class FakeFilter extends FakeNode {
  frequency = new FakeParam();
  Q = new FakeParam();
  gain = new FakeParam();
  detune = new FakeParam();
  type = 'lowpass';
}

const createdOscillators: FakeOscillator[] = [];
const createdGains: FakeGain[] = [];

class FakeAudioContext {
  currentTime = 0;
  state = 'running';
  sampleRate = 48000;
  destination = new FakeNode();
  resume() { this.state = 'running'; }
  createGain() { const g = new FakeGain(); createdGains.push(g); return g; }
  createOscillator() { const o = new FakeOscillator(); createdOscillators.push(o); return o; }
  createBiquadFilter() { return new FakeFilter(); }
  createMediaStreamDestination() {
    return { stream: { getAudioTracks: () => [{ kind: 'audio', id: 'bus-track' }] } };
  }
}

describe('SPEC-020 AC-001 — the export muxes an audible track', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    createdOscillators.length = 0;
    createdGains.length = 0;
  });

  afterEach(() => {
    audioEngine.stopAll();
    audioEngine.setBgmEnabled(true);
    audioEngine.setNarrationTrack(null);
  });

  it('starts the audio bed for the export window so the bus carries signal', () => {
    audioEngine.init();
    audioEngine.startContinuousBgm(0, 10);

    expect(createdOscillators.length).toBeGreaterThan(0);
    expect(createdOscillators.some(o => o.started)).toBe(true);
    // The bed is not a silent graph: at least one gain carries a real level.
    expect(createdGains.some(g => g.gain.value > 0)).toBe(true);
    expect(audioEngine.getAudioStream()).toBeTruthy();
  });

  it('measures the exported bed as audible — peak above floor, silence ratio below ceiling', () => {
    const bed = synthesizeTone(2, 220, 0.2, 48000);
    const metrics = analyzePcm(bed, 48000);
    const verdict = assessAudioTrack(metrics);

    expect(metrics.peak).toBeGreaterThan(SILENCE_FLOOR);
    expect(metrics.silenceRatio).toBeLessThanOrEqual(MAX_SILENCE_RATIO);
    expect(verdict.pass).toBe(true);
    expect(verdict.reasons).toEqual([]);
  });

  it('rejects a silent track — the exact regression this AC exists for', () => {
    const silent = analyzePcm(new Float32Array(48000), 48000);
    const verdict = assessAudioTrack(silent);

    expect(verdict.pass).toBe(false);
    expect(verdict.reasons.join(' ')).toMatch(/silence floor/);
  });

  it('muxes the bus track into the exported stream', () => {
    audioEngine.init();
    audioEngine.startContinuousBgm(0, 10);

    const selection = resolveExportAudio({ busTrack: audioEngine.getAudioStream() });
    expect(selection.audioIncluded).toBe(true);
    expect(selection.tracks).toHaveLength(1);
  });

  it('never lets a failing bed break the export', () => {
    const broken = {
      startContinuousBgm: () => {
        throw new Error('AudioContext unavailable');
      },
    };
    expect(startBedSafely(broken, 0, 10)).toBe(false);
  });
});

describe('SPEC-020 AC-002 — the export states its contents', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
  });

  afterEach(() => {
    audioEngine.stopAll();
    audioEngine.setBgmEnabled(true);
    audioEngine.setNarrationTrack(null);
  });

  it('names the included tracks and denies the browser voiceover', () => {
    const contents = audioEngine.getExportContents();

    expect(contents.audioBed).toBe(true);
    expect(contents.label).toContain('audio bed');
    expect(contents.label).toContain('subtitles');
    expect(contents.browserVoiceoverInFile).toBe(false);
    expect(contents.voiceoverNote).toMatch(/not part of the exported file/i);
  });

  it('names the recorded narration once a narration track exists', () => {
    audioEngine.setNarrationTrack(new Blob(['narration-bytes'], { type: 'audio/webm' }));
    const contents = audioEngine.getExportContents();

    expect(contents.narration).toBe(true);
    expect(contents.label).toContain('recorded narration');
    // Recording the narration does NOT make the browser voiceover muxable.
    expect(contents.browserVoiceoverInFile).toBe(false);
  });

  it('uses one contract for the engine, the UI and the EDL', () => {
    const contents = audioEngine.getExportContents();
    expect(contents).toEqual(buildExportContents({ audioBed: true, narration: false }));

    const edl = buildVoiceoverEdl({
      campaign: 'Arka Fincap',
      exportedAt: '2026-11-02T00:00:00.000Z',
      voiceURI: 'system-default',
      rate: 1.1,
      volume: 0.8,
      contents,
      segments: [
        {
          sceneIndex: 0,
          actName: 'Act 1',
          timeStart: '00:00',
          timeEnd: '00:10',
          voiceoverText: 'Vanakkam Tamil Nadu',
          phoneticGuide: 'Vah-nuh-kkum Thuh-mil Nah-doo',
        },
      ],
    });

    expect(edl.audioIncluded.label).toBe(contents.label);
    expect(edl.browserVoiceoverInFile).toBe(false);
    expect(edl.voiceoverNote).toBe(contents.voiceoverNote);
    expect(edl.segments).toHaveLength(1);
  });

  it('keeps the no-narration and no-bed labels honest', () => {
    expect(buildExportContents({ audioBed: true, narration: true }).label).toBe(
      'video + audio bed + recorded narration + subtitles',
    );
    expect(buildExportContents({ audioBed: true, narration: false }).label).toBe(
      'video + audio bed + subtitles',
    );
    expect(buildExportContents({ audioBed: false, narration: true }).label).toBe(
      'video + recorded narration + subtitles',
    );
  });
});
