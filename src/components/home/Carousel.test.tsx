import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('exposes a labelled group containing its items', () => {
    render(
      <Carousel label="Weekdeals">
        <div>Item een</div>
        <div>Item twee</div>
      </Carousel>,
    );
    const group = screen.getByRole('group', { name: 'Weekdeals' });
    expect(within(group).getByText('Item een')).toBeInTheDocument();
    expect(within(group).getByText('Item twee')).toBeInTheDocument();
  });

  it('provides previous/next paging controls (shown on wider viewports)', () => {
    const { container } = render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    // Arrows are a desktop-only enhancement (CSS-hidden on mobile), so match by
    // their label attribute rather than by computed accessible name.
    expect(
      container.querySelector<HTMLElement>('button[aria-label="Vorige"]'),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLElement>('button[aria-label="Volgende"]'),
    ).not.toBeNull();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
