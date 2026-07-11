import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { FreeShippingProgress } from './FreeShippingProgress';

describe('FreeShippingProgress', () => {
  it('invites the visitor toward the threshold at an empty cart', () => {
    render(<FreeShippingProgress cartTotal={0} />);
    expect(screen.getByText(/Nog €150,00 tot gratis bezorging/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('confirms free shipping once the threshold is reached', () => {
    render(<FreeShippingProgress cartTotal={200} />);
    expect(screen.getByText(/Je hebt gratis bezorging/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<FreeShippingProgress cartTotal={75} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
