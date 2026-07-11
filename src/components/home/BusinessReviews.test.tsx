import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectAllVarTokensAreContractKeys } from '../ui/test-utils/tokenAssertions';
import { BusinessReviews } from './BusinessReviews';
import type { BusinessReviewsContent } from '@/lib/home/editorial';

const content: BusinessReviewsContent = {
  score: '4,7 van de 5',
  basis: 'op basis van 1.284 beoordelingen',
  testimonials: [
    { quote: 'Snelle levering.', author: 'Marieke, Utrecht' },
    { quote: 'Goed advies.', author: 'Bas, Rotterdam' },
  ],
};

describe('BusinessReviews', () => {
  it('renders nothing when neither score nor testimonials exist', () => {
    const { container } = render(
      <BusinessReviews content={{ score: '', basis: '', testimonials: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the aggregate score and each testimonial with its author', () => {
    render(<BusinessReviews content={content} />);
    expect(screen.getByText('4,7 van de 5')).toBeInTheDocument();
    expect(screen.getByText('op basis van 1.284 beoordelingen')).toBeInTheDocument();
    expect(screen.getByText('Snelle levering.')).toBeInTheDocument();
    expect(screen.getByText('Marieke, Utrecht')).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<BusinessReviews content={content} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
