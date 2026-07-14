import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
  pxValue,
} from '../test-utils/tokenAssertions';
import { Button } from './Button';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/Button.module.css');

// All variant background slots the module can paint a fill from. The CTA rule
// forbids any of these mapping to the brand/navy trust color.
const BG_SLOTS = [
  '--local-bg',
  '--local-bg-hover',
  '--local-bg-active',
  '--local-bg-disabled',
] as const;

function bgValues(el: HTMLElement): string[] {
  return BG_SLOTS.map((slot) => el.style.getPropertyValue(slot));
}

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

  it('CTA rule: primary fill resolves to --color-cta', () => {
    const { getByRole } = render(<Button variant="primary">Buy</Button>);
    expect(getByRole('button').style.getPropertyValue('--local-bg')).toBe(
      'var(--color-cta)',
    );
  });

  it('CTA rule: no variant maps a fill to --color-brand (navy is never a CTA)', () => {
    for (const variant of ['primary', 'secondary', 'tertiary'] as const) {
      const { getByRole, unmount } = render(<Button variant={variant}>Action</Button>);
      for (const value of bgValues(getByRole('button'))) {
        expect(value).not.toContain('--color-brand');
      }
      unmount();
    }
    // link has no fill at all (the module forces a transparent background and
    // the component sets no --local-bg), so it trivially maps no fill to navy.
    const { getByRole } = render(<Button variant="link">Action</Button>);
    expect(getByRole('button').style.getPropertyValue('--local-bg')).toBe('');
  });

  it('secondary may use --color-brand for border (trust identity), not for a fill', () => {
    const { getByRole } = render(<Button variant="secondary">Secondary</Button>);
    const btn = getByRole('button');
    expect(btn.style.getPropertyValue('--local-border')).toContain('var(--color-brand)');
    for (const value of bgValues(btn)) {
      expect(value).not.toContain('--color-brand');
    }
  });

  it('default (md) size meets the 44×44px minimum touch target via --control-height-md', () => {
    const { getByRole } = render(<Button>Default</Button>);
    expect(getByRole('button').style.getPropertyValue('--local-height')).toBe(
      'var(--control-height-md)',
    );
    expect(pxValue(defaultTokens['--control-height-md'])).toBeGreaterThanOrEqual(44);
  });

  it('lg size resolves via --control-height-lg (56px, ≥44)', () => {
    const { getByRole } = render(<Button size="lg">Large</Button>);
    expect(getByRole('button').style.getPropertyValue('--local-height')).toBe(
      'var(--control-height-lg)',
    );
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

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="link">Link</Button>
      </>,
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    expectBridgePropsConsistent(buttons, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('token-swap: overriding a consumed color and size token reflects on the button', () => {
    const overrideColor = 'rgb(123, 45, 67)';
    const overrideHeight = '99px';

    // Baseline: the button inherits the brand values.
    const base = renderWithBrandTokens(<Button variant="primary">Buy</Button>);
    const baseBtn = base.getByRole('button');
    expect(resolvedToken(baseBtn, '--color-cta')).toBe(defaultTokens['--color-cta']);
    expect(resolvedToken(baseBtn, '--control-height-md')).toBe(
      defaultTokens['--control-height-md'],
    );
    base.unmount();

    // Override the tokens on an ancestor; the resolved values follow.
    const over = renderWithBrandTokens(<Button variant="primary">Buy</Button>, {
      '--color-cta': overrideColor,
      '--control-height-md': overrideHeight,
    });
    const overBtn = over.getByRole('button');
    expect(resolvedToken(overBtn, '--color-cta')).toBe(overrideColor);
    expect(resolvedToken(overBtn, '--control-height-md')).toBe(overrideHeight);

    // Wiring: the fill and height are bound to those tokens through the bridge,
    // so an override necessarily changes the painted properties.
    expect(overBtn.style.getPropertyValue('--local-bg')).toBe('var(--color-cta)');
    expect(overBtn.style.getPropertyValue('--local-height')).toBe(
      'var(--control-height-md)',
    );
  });
});
