import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { DeliveryCountdown } from './DeliveryCountdown';

describe('DeliveryCountdown', () => {
  it('renders a polite live region referencing the next-day promise', () => {
    render(<DeliveryCountdown />);
    const region = screen.getByText(/morgen/);
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<DeliveryCountdown />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
