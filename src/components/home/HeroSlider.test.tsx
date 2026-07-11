import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { HeroSlider } from './HeroSlider';
import type { HeroSlide } from '@/lib/home/editorial';

const slides: HeroSlide[] = [
  { title: 'Eerste campagne', body: 'Body een', ctaHref: '/een', ctaLabel: 'Shop een' },
  {
    title: 'Tweede campagne',
    body: 'Body twee',
    ctaHref: '/twee',
    ctaLabel: 'Shop twee',
  },
];

describe('HeroSlider', () => {
  it('renders nothing when there are no panels', () => {
    const { container } = render(<HeroSlider slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first panel with its cta link', () => {
    render(<HeroSlider slides={slides} />);
    expect(screen.getByRole('heading', { name: 'Eerste campagne' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop een' })).toHaveAttribute(
      'href',
      '/een',
    );
  });

  it('advances to the next panel via the dot controls', async () => {
    const user = userEvent.setup();
    render(<HeroSlider slides={slides} />);
    const tablist = screen.getByRole('tablist');
    await user.click(within(tablist).getByRole('tab', { name: 'Campagne 2' }));
    expect(screen.getByRole('heading', { name: 'Tweede campagne' })).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<HeroSlider slides={slides} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
