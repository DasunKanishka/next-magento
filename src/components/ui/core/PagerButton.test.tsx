import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import {
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../test-utils/tokenAssertions';
import { PagerButton } from './PagerButton';
import styles from './PagerButton.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/PagerButton.module.css',
);
// PagerButton composes IconButton for the round shell, so the --local-* bridge
// values it sets (bg/fg/font-size/border) are consumed by IconButton's
// stylesheet, not PagerButton's own — the bridge-consistency check below
// cross-references that file, matching the actual composition seam.
const ICON_BUTTON_MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/core/IconButton.module.css',
);

function renderAllVariants() {
  return render(
    <>
      <PagerButton
        variant="on-surface"
        direction="prev"
        label="Vorige"
        onClick={() => {}}
      />
      <PagerButton
        variant="on-surface"
        direction="next"
        label="Volgende"
        onClick={() => {}}
      />
      <PagerButton
        variant="on-brand"
        direction="prev"
        label="Vorige campagne"
        onClick={() => {}}
      />
      <PagerButton
        variant="on-brand"
        direction="next"
        label="Volgende campagne"
        onClick={() => {}}
      />
    </>,
  );
}

describe('PagerButton', () => {
  it('renders an accessible button per direction and fires onClick', () => {
    // on-surface is desktop-gated (`display: none` until the module's media
    // query), which jsdom's default viewport doesn't match, and a CSS-hidden
    // element's accessible NAME computes empty even with `hidden: true` — the
    // same reason Carousel.test.tsx matches by the aria-label attribute
    // rather than a computed accessible name/role.
    let clicked = '';
    const { container } = render(
      <PagerButton
        variant="on-surface"
        direction="prev"
        label="Vorige"
        onClick={() => (clicked = 'prev')}
      />,
    );
    fireEvent.click(container.querySelector<HTMLElement>('button[aria-label="Vorige"]')!);
    expect(clicked).toBe('prev');
  });

  it('carries the pagerButton module class plus the variant/direction placement classes', () => {
    const { container } = render(
      <PagerButton
        variant="on-surface"
        direction="next"
        label="Volgende"
        onClick={() => {}}
      />,
    );
    const btn = container.querySelector<HTMLElement>('button[aria-label="Volgende"]')!;
    expect(btn.className).toContain(styles.pagerButton);
    expect(btn.className).toContain(styles.onSurface);
    expect(btn.className).toContain(styles.next);
  });

  it('on-brand carries the onBrand + prev placement classes', () => {
    const { getByRole } = render(
      <PagerButton
        variant="on-brand"
        direction="prev"
        label="Vorige campagne"
        onClick={() => {}}
      />,
    );
    const btn = getByRole('button', { name: 'Vorige campagne' });
    expect(btn.className).toContain(styles.onBrand);
    expect(btn.className).toContain(styles.prev);
  });

  it('sets the border per variant via the --local-border bridge (on-surface bordered, on-brand none)', () => {
    const { container } = renderAllVariants();
    const buttons = Array.from(container.querySelectorAll('button'));
    const onSurfaceBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Vorige')!;
    const onBrandBtn = buttons.find(
      (b) => b.getAttribute('aria-label') === 'Vorige campagne',
    )!;
    expect(onSurfaceBtn.style.getPropertyValue('--local-border')).toBe(
      'var(--border-width-default) solid var(--color-border-card)',
    );
    expect(onBrandBtn.style.getPropertyValue('--local-border')).toBe('none');
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent with the composed IconButton: every --local-* PagerButton sets across both variants is read by IconButton.module.css, and vice versa', () => {
    const { container } = renderAllVariants();
    const buttons = Array.from(container.querySelectorAll('button'));
    expectBridgePropsConsistent(
      buttons,
      readFileSync(ICON_BUTTON_MODULE_CSS_PATH, 'utf8'),
    );
  });

  it('token-swap: overriding --color-surface-on-brand reflects through the on-brand background bridge', () => {
    const base = renderWithBrandTokens(
      <PagerButton
        variant="on-brand"
        direction="prev"
        label="Vorige campagne"
        onClick={() => {}}
      />,
    );
    const baseBtn = base.getByRole('button');
    expect(resolvedToken(baseBtn, '--color-surface-on-brand')).toBe(
      defaultTokens['--color-surface-on-brand'],
    );
    expect(baseBtn.style.getPropertyValue('--local-bg')).toBe(
      'var(--color-surface-on-brand)',
    );
    base.unmount();

    const overrideBg = 'rgb(9, 9, 9)';
    const over = renderWithBrandTokens(
      <PagerButton
        variant="on-brand"
        direction="prev"
        label="Vorige campagne"
        onClick={() => {}}
      />,
      { '--color-surface-on-brand': overrideBg },
    );
    const overBtn = over.getByRole('button');
    expect(resolvedToken(overBtn, '--color-surface-on-brand')).toBe(overrideBg);
    expect(overBtn.style.getPropertyValue('--local-bg')).toBe(
      'var(--color-surface-on-brand)',
    );
  });
});
