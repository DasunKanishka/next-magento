import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { StoreIdentityLogo } from '@/lib/data-source';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import { Logo } from './Logo';
import styles from './Logo.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Logo.module.css');

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

const TEXT_LOGO: StoreIdentityLogo = {
  src: null,
  alt: '',
  fallbackText: 'Test Store',
};

const IMAGE_LOGO: StoreIdentityLogo = {
  src: 'https://249.magento.default/media/logo/stores/1/logo.png',
  alt: 'Test Store logo',
  fallbackText: 'Test Store',
};

describe('Logo', () => {
  it('renders the text wordmark when logo.src is null, using fallbackText as the visible text', () => {
    render(<Logo logo={TEXT_LOGO} className="consumer-class" />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Test Store');
    expect(link.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders the text wordmark when logo.src is an empty string, same as null', () => {
    render(<Logo logo={{ ...TEXT_LOGO, src: '' }} className="consumer-class" />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Test Store');
    expect(link.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders an <img> from logo.src with the correct alt text when logo.src is configured', () => {
    render(<Logo logo={IMAGE_LOGO} className="consumer-class" />);
    const link = screen.getByRole('link');
    const img = link.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', IMAGE_LOGO.src);
    expect(img).toHaveAttribute('alt', IMAGE_LOGO.alt);
    expect(img?.className).toContain(styles.image);
  });

  it('does not re-resolve or transform logo.src — it is passed through verbatim as an absolute URL', () => {
    render(<Logo logo={IMAGE_LOGO} className="consumer-class" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', IMAGE_LOGO.src);
  });

  it('carries the home-link aria-label built from fallbackText on both the image and text paths', () => {
    const { unmount } = render(<Logo logo={TEXT_LOGO} className="consumer-class" />);
    expect(
      screen.getByRole('link', { name: 'Test Store — go to homepage' }),
    ).toBeInTheDocument();
    unmount();

    render(<Logo logo={IMAGE_LOGO} className="consumer-class" />);
    expect(
      screen.getByRole('link', { name: 'Test Store — go to homepage' }),
    ).toBeInTheDocument();
  });

  it('applies the consumer-supplied className to the home link on both paths (slot wiring)', () => {
    const { unmount } = render(<Logo logo={TEXT_LOGO} className="consumer-class" />);
    expect(screen.getByRole('link').className).toContain('consumer-class');
    unmount();

    render(<Logo logo={IMAGE_LOGO} className="consumer-class" />);
    expect(screen.getByRole('link').className).toContain('consumer-class');
  });

  it('sources the wordmark text from StoreIdentity — no hardcoded store name in the component', () => {
    render(<Logo logo={{ ...TEXT_LOGO, fallbackText: 'Another Store' }} className="c" />);
    expect(screen.getByText('Another Store')).toBeInTheDocument();
    expect(screen.queryByText('Test Store')).not.toBeInTheDocument();
  });

  it('the co-located stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
