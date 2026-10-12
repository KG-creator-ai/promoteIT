// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelStudio } from '../../src/components/settings/ModelStudio';

describe('ModelStudio provider config (SPEC-010)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('defaults to local WebLLM with Qwen models listed first', () => {
    render(<ModelStudio />);
    expect(screen.getByLabelText(/Active provider/)).toHaveValue('webllm');
    const ids = screen.getAllByText(/MLC$/, { selector: 'p' }).map(e => e.textContent);
    expect(ids[0]).toContain('Qwen2.5-7B');
  });

  it('shows NVIDIA key field when provider selected', () => {
    render(<ModelStudio />);
    fireEvent.change(screen.getByLabelText(/Active provider/), { target: { value: 'nvidia' } });
    expect(screen.getByPlaceholderText('nvapi-...')).toBeInTheDocument();
  });

  it('Test Connection reports success honestly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    render(<ModelStudio />);
    fireEvent.change(screen.getByLabelText(/Active provider/), { target: { value: 'openrouter' } });
    fireEvent.change(screen.getByPlaceholderText('sk-or-v1-...'), { target: { value: 'sk-test' } });
    fireEvent.click(screen.getByRole('button', { name: /Test Connection/ }));
    await waitFor(() => expect(screen.getByText(/Connected to/)).toBeInTheDocument());
  });

  it('Test Connection reports auth failure honestly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    render(<ModelStudio />);
    fireEvent.change(screen.getByLabelText(/Active provider/), { target: { value: 'nvidia' } });
    fireEvent.change(screen.getByPlaceholderText('nvapi-...'), { target: { value: 'nv-bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Test Connection/ }));
    await waitFor(() => expect(screen.getByText(/Authentication rejected/)).toBeInTheDocument());
  });

  it('Download & Load delegates to the real engine loader', async () => {
    const loader = vi.fn().mockResolvedValue(undefined);
    render(<ModelStudio onLoadModel={loader} engineState={{ isLoading: false, provider: null, progress: '' }} />);
    const buttons = screen.getAllByRole('button', { name: /Download & Load/ });
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    // buttons[0] = first non-active model (7B is pre-selected active)
    expect(loader.mock.calls[0][0]).toBe('Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  });
});
