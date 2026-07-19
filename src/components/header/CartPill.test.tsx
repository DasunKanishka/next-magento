import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { CartPill } from './CartPill';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/header/CartPill.module.css');

describe('CartPill', () => {
  it('shows the running total and describes count + total in its label', () => {
    render(<CartPill count={0} total={0} />);
    const button = screen.getByRole('button', { name: /Winkelmandje: 0 artikelen/ });
    expect(button).toHaveTextContent('€0,00');
  });

  it('renders a count badge only when there are items', () => {
    const { rerender } = render(<CartPill count={0} total={0} />);
    expect(screen.getByRole('button')).not.toHaveTextContent('3');
    rerender(<CartPill count={3} total={49.9} />);
    expect(screen.getByRole('button', { name: /3 artikelen/ })).toHaveTextContent('3');
  });

  it('forwards clicks', () => {
    const onClick = vi.fn();
    render(<CartPill onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('meets the minimum tap target via the module stylesheet', () => {
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/min-height:\s*var\(--tap-target-min\)/);
    expect(css).toMatch(/min-width:\s*var\(--tap-target-min\)/);
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
