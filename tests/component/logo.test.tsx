// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromoteITLogo } from '../../src/components/common/PromoteITLogo';

describe('PromoteITLogo smoke (jsdom)', () => {
  it('renders an accessible img role', () => {
    render(<PromoteITLogo />);
    expect(screen.getByRole('img', { name: 'promote-IT Logo' })).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(<PromoteITLogo className="w-16 h-16" />);
    expect(container.querySelector('svg')).toHaveClass('w-16', 'h-16');
  });
});
