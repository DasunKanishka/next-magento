import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { DeliveryNote } from './DeliveryNote';

describe('DeliveryNote', () => {
  it('defaults the title to the PRD-unified phrasing, not the design-spec default', () => {
    render(<DeliveryNote />);
    expect(screen.getByText('Voor 22:00 besteld, morgen in huis')).toBeInTheDocument();
    expect(
      screen.queryByText('Besteld vóór 22:00, morgen in huis'),
    ).not.toBeInTheDocument();
  });

  it('renders the countdown and threshold by default', () => {
    render(<DeliveryNote />);
    expect(screen.getByText('5u 42m')).toBeInTheDocument();
    expect(screen.getByText(/Gratis vanaf €150/)).toBeInTheDocument();
  });

  it('omits the countdown clause entirely when countdown is null', () => {
    render(<DeliveryNote countdown={null} threshold="Gratis vanaf €150" />);
    expect(screen.queryByText(/om vandaag te bestellen/)).not.toBeInTheDocument();
    expect(screen.getByText('Gratis vanaf €150')).toBeInTheDocument();
  });

  it('accepts a custom title, countdown and threshold', () => {
    render(
      <DeliveryNote
        title="Voor 20:00 besteld"
        countdown="2u 10m"
        threshold="Gratis vanaf €75"
      />,
    );
    expect(screen.getByText('Voor 20:00 besteld')).toBeInTheDocument();
    expect(screen.getByText('2u 10m')).toBeInTheDocument();
    expect(screen.getByText(/Gratis vanaf €75/)).toBeInTheDocument();
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(<DeliveryNote />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
