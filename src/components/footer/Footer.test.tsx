import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { STORE_IDENTITY } from '@/config/store-identity';
import {
  expectAllVarTokensAreContractKeys,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import { Footer } from './Footer';
import styles from './Footer.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/footer/Footer.module.css');

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('Footer', () => {
  it('renders the brand block: wordmark home link, tagline, and four payment badges', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /naar de homepagina/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(STORE_IDENTITY.tagline)).toBeInTheDocument();
    const payments = screen.getByRole('list', { name: 'Betaalmethoden' });
    for (const method of ['iDEAL', 'Visa', 'Mastercard', 'PayPal']) {
      expect(within(payments).getByText(method)).toBeInTheDocument();
    }
  });

  it('renders the three static link columns', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: 'Assortiment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Klantenservice' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `Over ${STORE_IDENTITY.name}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Whisky' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('renders the legal bottom bar with registration number and the age notice', () => {
    render(<Footer />);
    expect(screen.getByText(new RegExp(STORE_IDENTITY.legalEntity))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(STORE_IDENTITY.registrationNumber)),
    ).toBeInTheDocument();
    expect(screen.getByText(/18 jaar en ouder/)).toBeInTheDocument();
    expect(screen.getByText(/drink met mate/)).toBeInTheDocument();
  });

  it('includes the newsletter signup', () => {
    render(<Footer />);
    expect(screen.getByRole('button', { name: 'Inschrijven' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<Footer />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('carries its module class on the contentinfo root', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo').className).toContain(styles.footer);
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
