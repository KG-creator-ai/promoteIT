// @vitest-environment jsdom
// Phase-09 resilience regression: the import result's skipped-entry count must
// actually reach the user.
//
// The resilience persona proved the previous implementation never painted the
// banner: the modal set its result AND called onImportComplete in the same
// React batch, the parent closed the modal in that batch, and the result view
// was discarded. The modal now keeps itself open when entries were skipped and
// the acknowledgement button performs the import hand-off.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ImportProjectModal } from '../../src/components/projects/ImportProjectModal';

const importCampaignZip = vi.fn();
vi.mock('../../src/lib/zipImporter', () => ({
  importCampaignZip: (...args: unknown[]) => importCampaignZip(...args),
}));

afterEach(() => {
  cleanup();
  importCampaignZip.mockReset();
});

const zipFile = () => new File(['zip-bytes'], 'campaign.zip', { type: 'application/zip' });

const renderModal = (onImportComplete = vi.fn()) => {
  const utils = render(
    <ImportProjectModal isOpen onClose={vi.fn()} onImportComplete={onImportComplete} />
  );
  const input = utils.container.querySelector('input[type="file"]') as HTMLInputElement;
  return { input, onImportComplete };
};

describe('import result surfaces skipped entries', () => {
  it('keeps the modal open and shows the skipped count when entries were dropped', async () => {
    importCampaignZip.mockResolvedValue({
      campaignId: 'c1',
      title: 'Imported',
      sceneCount: 2,
      resourceCount: 1,
      skippedCount: 3,
    });
    const { input, onImportComplete } = renderModal();

    fireEvent.change(input, { target: { files: [zipFile()] } });

    expect(await screen.findByText(/3 malformed entries were skipped/i)).toBeTruthy();
    expect(onImportComplete).not.toHaveBeenCalled();
  });

  it('hands the import over when the user acknowledges the result', async () => {
    importCampaignZip.mockResolvedValue({
      campaignId: 'c1',
      title: 'Imported',
      sceneCount: 2,
      resourceCount: 1,
      skippedCount: 1,
    });
    const { input, onImportComplete } = renderModal();

    fireEvent.change(input, { target: { files: [zipFile()] } });
    const banner = await screen.findByText(/1 malformed entry was skipped/i);
    expect(banner).toBeTruthy();

    fireEvent.click(screen.getByText('Open Imported Campaign'));
    expect(onImportComplete).toHaveBeenCalledTimes(1);
    expect(onImportComplete.mock.calls[0][0]).toMatchObject({ campaignId: 'c1', skippedCount: 1 });
  });

  it('auto-completes the import when nothing was skipped', async () => {
    importCampaignZip.mockResolvedValue({
      campaignId: 'c2',
      title: 'Clean',
      sceneCount: 1,
      resourceCount: 0,
      skippedCount: 0,
    });
    const { input, onImportComplete } = renderModal();

    fireEvent.change(input, { target: { files: [zipFile()] } });

    await waitFor(() => expect(onImportComplete).toHaveBeenCalledTimes(1));
    expect(onImportComplete.mock.calls[0][0]).toMatchObject({ campaignId: 'c2' });
  });
});
