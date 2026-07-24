import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StoreIdentity } from '@/lib/data-source';
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

// Fixture stand-in for `getStoreIdentity()` output — Footer is a pure
// presentational component that receives the resolved identity as a prop, it
// never fetches it itself.
const TEST_IDENTITY: StoreIdentity = {
  name: 'Test Store',
  logo: { src: null, alt: '', fallbackText: 'Test Store' },
  tagline: 'Test tagline copy.',
  registrationNumber: 'KvK 12345678',
  copyright: 'Test Store B.V.',
  paymentMethods: ['iDEAL', 'Visa', 'Mastercard', 'PayPal'],
  footerColumns: [
    {
      heading: 'Assortiment',
      links: [
        { label: 'Whisky', href: '/whisky' },
        { label: 'Gin', href: '/gin' },
      ],
    },
    {
      heading: 'Klantenservice',
      links: [{ label: 'Contact', href: '/contact' }],
    },
    {
      heading: 'Over Test Store',
      links: [{ label: 'Over ons', href: '/over-ons' }],
    },
  ],
  deliveryPromise: { copy: 'Voor 22:00 besteld, morgen in huis', cutoffHour: 22 },
  alcoholLegalNotice:
    '18+ Sale of alcohol only to persons 18 years and older · Enjoy, but drink responsibly.',
};

describe('Footer', () => {
  it('renders the brand block: wordmark home link, tagline, and payment badges', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: /go to homepage/ }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(TEST_IDENTITY.tagline)).toBeInTheDocument();
    const payments = screen.getByRole('list', { name: 'Payment methods' });
    for (const method of TEST_IDENTITY.paymentMethods) {
      expect(within(payments).getByText(method)).toBeInTheDocument();
    }
  });

  it('renders the backend-authored link columns', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    expect(screen.getByRole('heading', { name: 'Assortiment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Klantenservice' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `Over ${TEST_IDENTITY.name}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Whisky' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('renders the legal bottom bar with the copyright holder, registration number, and the backend-sourced alcohol notice', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    expect(screen.getByText(new RegExp(TEST_IDENTITY.copyright))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(TEST_IDENTITY.registrationNumber)),
    ).toBeInTheDocument();
    expect(screen.getByText(TEST_IDENTITY.alcoholLegalNotice)).toBeInTheDocument();
  });

  it('renders no alcohol-notice element when identity.alcoholLegalNotice is "" (graceful degrade, never a hardcoded fallback)', () => {
    render(<Footer identity={{ ...TEST_IDENTITY, alcoholLegalNotice: '' }} />);
    expect(screen.queryByText(/drink responsibly/i)).toBeNull();
    expect(screen.queryByText(/18 years and older/i)).toBeNull();
  });

  it('includes the newsletter signup', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('emits only real contract tokens', () => {
    const { container } = render(<Footer identity={TEST_IDENTITY} />);
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('carries its module class on the contentinfo root', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    expect(screen.getByRole('contentinfo').className).toContain(styles.footer);
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('falls back to the text wordmark carrying the .wordmark class when logo.src is null', () => {
    render(<Footer identity={TEST_IDENTITY} />);
    const link = screen.getByRole('link', {
      name: `${TEST_IDENTITY.name} — go to homepage`,
    });
    expect(link).toHaveTextContent(TEST_IDENTITY.name);
    expect(link.className).toContain(styles.wordmark);
    expect(link.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders the logo IMAGE when logo.src is configured, keeping the .wordmark class + home-link aria-label', () => {
    const identityWithImage: StoreIdentity = {
      ...TEST_IDENTITY,
      logo: {
        src: 'https://249.magento.default/media/logo/stores/1/logo.png',
        alt: 'Test Store logo',
        fallbackText: TEST_IDENTITY.name,
      },
    };
    render(<Footer identity={identityWithImage} />);
    const link = screen.getByRole('link', {
      name: `${TEST_IDENTITY.name} — go to homepage`,
    });
    expect(link.className).toContain(styles.wordmark);
    const img = link.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', identityWithImage.logo.src as string);
    expect(img).toHaveAttribute('alt', identityWithImage.logo.alt);
  });
});
