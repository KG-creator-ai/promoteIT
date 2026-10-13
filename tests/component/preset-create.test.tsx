// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const ctx = {
  allCampaigns: [],
  activeCampaign: null,
  setActiveCampaignId: vi.fn(),
  createNewCampaign: vi.fn().mockResolvedValue('new-id'),
  duplicateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  updateCampaign: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../src/context/CampaignContext', () => ({
  useCampaignContext: () => ctx,
}));

vi.mock('../../src/hooks/usePageTitle', () => ({
  usePageTitle: () => {},
}));

vi.mock('../../src/components/ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock('../../src/components/projects/ImportProjectModal', () => ({
  ImportProjectModal: () => null,
}));

import { ProjectWorkspace } from '../../src/components/projects/ProjectWorkspace';
import { CAMPAIGN_PRESETS } from '../../src/data/campaignPresets';

describe('ProjectWorkspace preset creation (SPEC-012)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists curated presets and creates a real campaign from one', async () => {
    const onNavigate = vi.fn();
    render(<ProjectWorkspace onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /Create Campaign/ }));
    const picker = screen.getByLabelText(/curated preset/) as HTMLSelectElement;
    expect(picker.options.length).toBe(CAMPAIGN_PRESETS.length);
    fireEvent.click(screen.getByRole('button', { name: /Create from Preset/ }));
    await vi.waitFor(() => expect(ctx.createNewCampaign).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(ctx.updateCampaign).toHaveBeenCalledTimes(1));
    const [id, delta] = ctx.updateCampaign.mock.calls[0] as any[];
    expect(id).toBe('new-id');
    expect(delta.sceneGraph.length).toBeGreaterThan(0);
    expect(delta.resourceLibrary.length).toBeGreaterThan(0);
    expect(delta.status).toBe('scripting');
    await vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith('script'));
  });
});
