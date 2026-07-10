import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import {
  expectAllVarTokensAreContractKeys,
  pxValue,
} from '../test-utils/tokenAssertions';
import { Button } from './Button';

describe('Button', () => {
  it('renders all four documented variants', () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="link">Link</Button>
      </>,
    );
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Secondary')).toBeInTheDocument();
    expect(screen.getByText('Tertiary')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('CTA rule: primary resolves to --color-cta', () => {
    const { getByRole } = render(<Button variant="primary">Buy</Button>);
    const btn = getByRole('button');
    expect(btn.style.background).toContain('var(--color-cta)');
  });

  it('CTA rule: no variant maps its background/action-surface to --color-brand (navy is never a CTA)', () => {
    const variants = ['primary', 'secondary', 'tertiary'] as const;
    for (const variant of variants) {
      const { getByRole, unmount } = render(<Button variant={variant}>Action</Button>);
      const btn = getByRole('button');
      expect(btn.style.background).not.toContain('var(--color-brand)');
      unmount();
    }
    // link variant has no background at all (text-only), so it trivially
    // never maps a fill to --color-brand either.
    const { getByRole } = render(<Button variant="link">Action</Button>);
    expect(getByRole('button').style.background).toBe('none');
  });

  it('secondary/link variants may use --color-brand for border/text (trust identity), not for background', () => {
    const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
    const btn = getByRole('button');
    expect(btn.style.border).toContain('var(--color-brand)');
    expect(btn.style.background).not.toContain('var(--color-brand)');
  });

  it('default (md) size meets the 44×44px minimum touch target via --control-height-md', () => {
    const { getByRole } = render(<Button>Default</Button>);
    const btn = getByRole('button');
    expect(btn.style.height).toBe('var(--control-height-md)');
    expect(pxValue(defaultTokens['--control-height-md'])).toBeGreaterThanOrEqual(44);
  });

  it('lg size resolves via --control-height-lg (56px, ≥44)', () => {
    const { getByRole } = render(<Button size="lg">Large</Button>);
    expect(getByRole('button').style.height).toBe('var(--control-height-lg)');
    expect(pxValue(defaultTokens['--control-height-lg'])).toBeGreaterThanOrEqual(44);
  });

  it('disabled button does not fire onClick', () => {
    let clicked = false;
    const { getByRole } = render(
      <Button disabled onClick={() => (clicked = true)}>
        Disabled
      </Button>,
    );
    fireEvent.click(getByRole('button'));
    expect(clicked).toBe(false);
  });

  it('fires onClick when enabled', () => {
    let clicked = false;
    const { getByRole } = render(<Button onClick={() => (clicked = true)}>Go</Button>);
    fireEvent.click(getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('renders subLabel stacked under the main label', () => {
    render(
      <Button variant="primary" subLabel="Totaal €34,95">
        In winkelmandje
      </Button>,
    );
    expect(screen.getByText('In winkelmandje')).toBeInTheDocument();
    expect(screen.getByText('Totaal €34,95')).toBeInTheDocument();
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="link">Link</Button>
      </>,
    );
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });
});
