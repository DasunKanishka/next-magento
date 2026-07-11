import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { CartPill } from './CartPill';

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

  it('meets the minimum tap target', () => {
    render(<CartPill />);
    const button = screen.getByRole('button');
    expect(button.style.minHeight).toBe('var(--tap-target-min)');
    expect(button.style.minWidth).toBe('var(--tap-target-min)');
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<CartPill count={2} total={12.5} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
