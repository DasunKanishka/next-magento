import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectModuleCssReferencesRealTokens } from '../ui/test-utils/tokenAssertions';
import { BusinessReviews } from './BusinessReviews';
import styles from './BusinessReviews.module.css';
import type { BusinessReviewsContent } from '@/lib/home/editorial';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/home/BusinessReviews.module.css',
);

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

  it('carries its module class on the section', () => {
    const { container } = render(<BusinessReviews content={content} />);
    expect(container.querySelector('section')?.className).toContain(styles.section);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
