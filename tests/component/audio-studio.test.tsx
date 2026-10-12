// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { audioEngine } from '../../src/services/audioEngine';

vi.mock('../../src/context/CampaignContext', () => ({
  useCampaignContext: () => ({
    activeCampaign: { id: 'c1', title: 'Test Campaign' },
    scenes: [
      { id: 's1', sceneIndex: 0, actName: 'Act 1', timeStart: '00:00', timeEnd: '00:10', voiceoverText: 'Vanakkam Tamil Nadu', cameraMovement: 'Static', linkedResourceIds: [] },
      { id: 's2', sceneIndex: 1, actName: 'Act 2', timeStart: '00:10', timeEnd: '00:20', voiceoverText: 'Arka Fincap welcomes you', cameraMovement: 'Pan', linkedResourceIds: [] },
    ],
  }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: () => {},
}));

vi.mock('../../src/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

import { AudioStudio } from '../../src/components/audio/AudioStudio';

const VOICES = [
  { name: 'Test Hindi Voice', lang: 'hi-IN', voiceURI: 'test:hindi', default: true },
  { name: 'Test Tamil Voice', lang: 'ta-IN', voiceURI: 'test:tamil', default: false },
];

function setup() {
  Object.defineProperty(window, 'speechSynthesis', {
    value: { getVoices: () => VOICES, speak: vi.fn(), cancel: vi.fn(), speaking: false, paused: false, onvoiceschanged: null },
    configurable: true,
    writable: true,
  });
  return vi.spyOn(audioEngine, 'playVoiceover').mockImplementation(() => {});
}

describe('AudioStudio (real TTS wiring)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists real browser voices in the picker', () => {
    const play = setup();
    render(<AudioStudio />);
    expect(screen.getByText(/Test Hindi Voice — hi-IN/)).toBeInTheDocument();
    expect(screen.getByText(/Test Tamil Voice — ta-IN/)).toBeInTheDocument();
    play.mockRestore();
  });

  it('segment Play speaks the scene text via the engine', () => {
    const play = setup();
    render(<AudioStudio />);
    fireEvent.click(screen.getByRole('button', { name: 'Play scene 1' }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.calls[0][0]).toBe('Vanakkam Tamil Nadu');
    expect(play.mock.calls[0][5]).toBe(0);
    play.mockRestore();
  });

  it('rate slider value reaches the engine', () => {
    const play = setup();
    render(<AudioStudio />);
    fireEvent.change(screen.getByLabelText(/Speaking Rate/), { target: { value: '1.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Play scene 2' }));
    expect(play.mock.calls[0][2]).toBe(1.5);
    play.mockRestore();
  });

  it('export downloads a voiceover package (anchor click fired)', () => {
    setup();
    (URL as any).createObjectURL = vi.fn(() => 'blob:edl');
    (URL as any).revokeObjectURL = vi.fn();
    const click = vi.fn();
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string, ...rest: any[]) => {
      const el = (origCreate as any)(tag, ...rest);
      if (tag === 'a') el.click = click;
      return el;
    }) as any);
    render(<AudioStudio />);
    fireEvent.click(screen.getByRole('button', { name: /Export Voiceover Package/ }));
    expect(click).toHaveBeenCalled();
    createSpy.mockRestore();
  });
});
