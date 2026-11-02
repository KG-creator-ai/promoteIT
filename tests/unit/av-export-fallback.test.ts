// SPEC-020.AC-004 (redteam) — the failure path: no tab-capture permission and
// no bed must still export a playable file, and must never claim audio.
import { describe, it, expect } from 'vitest';
import {
  attachExportRecorder,
  buildExportContents,
  resolveExportAudio,
  startBedSafely,
} from '../../src/lib/avExport';

class FakeRecorder {
  ondataavailable: ((ev: { data: Blob }) => void) | null = null;
  onstop: ((ev?: unknown) => void) | null = null;
  started = false;
  stopped = false;
  start() { this.started = true; }
  stop() {
    this.stopped = true;
    this.ondataavailable?.({ data: new Blob([new Uint8Array(512)], { type: 'video/webm' }) });
    this.onstop?.();
  }
}

describe('SPEC-020 AC-004 — export fallback without audio', () => {
  it('labels a file without audio as "video + subtitles only (no audio)"', () => {
    const contents = buildExportContents({ audioBed: false, narration: false });

    expect(contents.label).toBe('video + subtitles only (no audio)');
    expect(contents.audioBed).toBe(false);
    expect(contents.narration).toBe(false);
    expect(contents.subtitles).toBe(true);
  });

  it('never claims the browser speech voiceover is inside the file', () => {
    const contents = buildExportContents({ audioBed: false, narration: false });

    expect(contents.browserVoiceoverInFile).toBe(false);
    expect(contents.voiceoverNote).toMatch(/not part of the exported file/i);
  });

  it('survives a bed that cannot start (no AudioContext)', () => {
    const broken = {
      startContinuousBgm: () => {
        throw new Error('AudioContext unavailable');
      },
    };

    expect(startBedSafely(broken, 0, 10)).toBe(false);
    const selection = resolveExportAudio({ busTrack: null, narrationTrack: null });
    expect(selection.audioIncluded).toBe(false);
    expect(selection.tracks).toHaveLength(0);
  });

  it('still produces a non-empty webm blob when the stream carries no audio', async () => {
    const recorder = new FakeRecorder();
    const { done } = attachExportRecorder(recorder as unknown as Parameters<typeof attachExportRecorder>[0]);

    recorder.start();
    recorder.stop();
    const blob = await done;

    expect(recorder.started).toBe(true);
    expect(recorder.stopped).toBe(true);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toContain('webm');
  });
});
