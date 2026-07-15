import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import {
  expectAllVarTokensAreContractKeys,
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
  pxValue,
} from '../test-utils/tokenAssertions';
import { IconButton } from './IconButton';
import styles from './IconButton.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/IconButton.module.css',
);

function renderAllVariants() {
  return render(
    <>
      <IconButton shape="circle" aria-label="A">
        +
      </IconButton>
      <IconButton shape="rounded" aria-label="B" bordered={false}>
        -
      </IconButton>
      <IconButton
        shape="circle"
        aria-label="C"
        size={40}
        color="var(--color-urgency)"
        style={{ '--local-bg': 'var(--color-cta)' } as React.CSSProperties}
      >
        ♡
      </IconButton>
    </>,
  );
}

describe('IconButton', () => {
  it('wires the module class and the shape data-attribute', () => {
    const { container: circleContainer } = render(
      <IconButton shape="circle" aria-label="Wishlist">
        ♥
      </IconButton>,
    );
    const btn = within(circleContainer).getByRole('button');
    expect(btn.className).toContain(styles.iconButton);
    expect(btn.getAttribute('data-shape')).toBe('circle');

    const { container: roundedContainer } = render(
      <IconButton shape="rounded" aria-label="Increase quantity">
        +
      </IconButton>,
    );
    expect(within(roundedContainer).getByRole('button').getAttribute('data-shape')).toBe(
      'rounded',
    );
  });

  it('defaults to the --tap-target-min token (44px) — meets the minimum touch target', () => {
    const { getByRole } = render(<IconButton aria-label="Add">+</IconButton>);
    const btn = getByRole('button');
    expect(btn.style.getPropertyValue('--local-size')).toBe('var(--tap-target-min)');
    expect(pxValue(defaultTokens['--tap-target-min'])).toBeGreaterThanOrEqual(44);
  });

  it('accepts an explicit numeric size override', () => {
    const { getByRole } = render(
      <IconButton size={40} aria-label="Small">
        +
      </IconButton>,
    );
    expect(getByRole('button').style.getPropertyValue('--local-size')).toBe('40px');
  });

  it('bordered defaults to true using --color-border-field', () => {
    const { getByRole } = render(<IconButton aria-label="Bordered">+</IconButton>);
    expect(getByRole('button').style.getPropertyValue('--local-border')).toContain(
      'var(--color-border-field)',
    );
  });

  it('unbordered removes the border', () => {
    const { getByRole } = render(
      <IconButton bordered={false} aria-label="Unbordered">
        +
      </IconButton>,
    );
    expect(getByRole('button').style.getPropertyValue('--local-border')).toBe('none');
  });

  it('default glyph color is --color-brand', () => {
    const { getByRole } = render(<IconButton aria-label="Default color">+</IconButton>);
    expect(getByRole('button').style.getPropertyValue('--local-fg')).toBe(
      'var(--color-brand)',
    );
  });

  it('a consumer-supplied style override (--local-bg) wins over the component default', () => {
    const { getByRole } = render(
      <IconButton
        aria-label="Filled"
        style={{ '--local-bg': 'var(--color-cta)' } as React.CSSProperties}
      >
        +
      </IconButton>,
    );
    expect(getByRole('button').style.getPropertyValue('--local-bg')).toBe(
      'var(--color-cta)',
    );
  });

  it('fires onClick', () => {
    let clicked = false;
    const { getByRole } = render(
      <IconButton aria-label="Click me" onClick={() => (clicked = true)}>
        +
      </IconButton>,
    );
    fireEvent.click(getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('every var(--*) this component emits is a real contract token', () => {
    const { container } = renderAllVariants();
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent both ways: every property set is consumed, and vice versa', () => {
    const { container } = renderAllVariants();
    const buttons = Array.from(container.querySelectorAll('button'));
    expectBridgePropsConsistent(buttons, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('token-swap: overriding a consumed color token reflects on the button', () => {
    const base = renderWithBrandTokens(<IconButton aria-label="Base">+</IconButton>);
    const baseBtn = base.getByRole('button');
    expect(resolvedToken(baseBtn, '--color-brand')).toBe(defaultTokens['--color-brand']);
    base.unmount();

    const overrideColor = 'rgb(9, 9, 9)';
    const over = renderWithBrandTokens(<IconButton aria-label="Over">+</IconButton>, {
      '--color-brand': overrideColor,
    });
    const overBtn = over.getByRole('button');
    expect(resolvedToken(overBtn, '--color-brand')).toBe(overrideColor);
    expect(overBtn.style.getPropertyValue('--local-fg')).toBe('var(--color-brand)');
  });
});
