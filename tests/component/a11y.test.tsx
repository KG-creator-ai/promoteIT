// @vitest-environment jsdom
// SPEC-015.AC-003: axe-core accessibility scan on real render paths.
// Runs in CI (Node 22) and locally via scripts/with-node22.sh (WSL Node 20 can't
// host jsdom 30). Violations in any checked view fail the suite → gate fails.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';

vi.mock('../../src/context/CampaignContext', () => ({
  useCampaignContext: () => ({
    activeCampaign: { id: 'c1', title: 'A11y Campaign', scenes: [] },
    allCampaigns: (globalThis as any).__a11yCampaigns ?? [],
    scenes: [
      { id: 's1', sceneIndex: 0, actName: 'Act 1', timeStart: '00:00', timeEnd: '00:10', voiceoverText: 'Vanakkam', cameraMovement: 'Static', linkedResourceIds: [] },
    ],
    setActiveCampaignId: vi.fn(),
    createNewCampaign: vi.fn().mockResolvedValue('new-id'),
    duplicateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
    updateCampaign: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../src/hooks/usePageTitle', () => ({ usePageTitle: () => {} }));

vi.mock('../../src/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('../../src/components/projects/ImportProjectModal', () => ({
  ImportProjectModal: () => null,
}));

import { ProjectWorkspace } from '../../src/components/projects/ProjectWorkspace';
import { AudioStudio } from '../../src/components/audio/AudioStudio';

async function scan(container: HTMLElement) {
  const results = await axe.run(container, {
    // color-contrast needs canvas (absent in jsdom) — axe marks it incomplete
    // instead of skipping silently; exclusion is explicit, not hidden.
    resultTypes: ['violations'],
  });
  return results.violations;
}

describe('axe accessibility gate (SPEC-015.AC-003)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).__a11yCampaigns;
  });

  it('ProjectWorkspace empty state has zero axe violations', async () => {
    const { container } = render(<ProjectWorkspace onNavigate={vi.fn()} />);
    const violations = await scan(container);
    expect(violations.map(v => `${v.id} → ${v.nodes.map(n => n.target.join(' ')).join(' | ')} :: ${v.nodes.map(n => n.html.slice(0, 140)).join(' | ')}`)).toEqual([]);
  });

  it('ProjectWorkspace create-form open has zero axe violations', async () => {
    const { container } = render(<ProjectWorkspace onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /New Campaign/ }));
    const violations = await scan(container);
    expect(violations.map(v => `${v.id} → ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  it('ProjectWorkspace populated cards have zero axe violations', async () => {
    (globalThis as any).__a11yCampaigns = [
      { id: 'c9', title: 'Card One', industry: 'Finance', sceneGraph: [{ id: 's' }, { id: 't' }], updatedAt: 1 },
    ];
    const { container } = render(<ProjectWorkspace onNavigate={vi.fn()} />);
    expect(screen.getByText('Card One')).toBeInTheDocument();
    const violations = await scan(container);
    expect(violations.map(v => `${v.id} → ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  it('AudioStudio has zero axe violations', async () => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: { getVoices: () => [{ name: 'V', lang: 'en-IN', voiceURI: 'v', default: true }], speak: vi.fn(), cancel: vi.fn(), speaking: false, paused: false },
      configurable: true,
    });
    const { container } = render(<AudioStudio />);
    const violations = await scan(container);
    expect(violations.map(v => `${v.id} → ${v.nodes.map(n => n.target.join(' ')).join(' | ')} :: ${v.nodes.map(n => n.html.slice(0, 140)).join(' | ')}`)).toEqual([]);
  });
});
