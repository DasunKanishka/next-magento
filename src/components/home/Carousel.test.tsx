import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
import pagerButtonStyles from '../ui/core/PagerButton.module.css';
import { Carousel } from './Carousel';
import styles from './Carousel.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/home/Carousel.module.css');

describe('Carousel', () => {
  it('exposes a labelled group containing its items', () => {
    render(
      <Carousel label="Weekdeals">
        <div>Item een</div>
        <div>Item twee</div>
      </Carousel>,
    );
    const group = screen.getByRole('group', { name: 'Weekdeals' });
    expect(within(group).getByText('Item een')).toBeInTheDocument();
    expect(within(group).getByText('Item twee')).toBeInTheDocument();
  });

  it('provides previous/next paging controls (shown on wider viewports)', () => {
    const { container } = render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    // Arrows are a desktop-only enhancement (CSS-hidden on mobile), so match by
    // their label attribute rather than by computed accessible name.
    expect(
      container.querySelector<HTMLElement>('button[aria-label="Vorige"]'),
    ).not.toBeNull();
    expect(
      container.querySelector<HTMLElement>('button[aria-label="Volgende"]'),
    ).not.toBeNull();
  });

  it('paging controls are the on-surface PagerButton variant', () => {
    const { container } = render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    const prev = container.querySelector<HTMLElement>('button[aria-label="Vorige"]')!;
    const next = container.querySelector<HTMLElement>('button[aria-label="Volgende"]')!;
    expect(prev.className).toContain(pagerButtonStyles.onSurface);
    expect(prev.className).toContain(pagerButtonStyles.prev);
    expect(next.className).toContain(pagerButtonStyles.onSurface);
    expect(next.className).toContain(pagerButtonStyles.next);
  });

  it('clicking prev/next scrolls the track in the matching direction', () => {
    // jsdom does not implement scrollBy natively (the property doesn't exist
    // on the prototype, so vi.spyOn can't wrap it) — stub it directly to
    // assert the direction Carousel's page() callback requests, preserving
    // the click-driven scroll/advance behavior across the PagerButton
    // extraction, then restore the prototype so no other test file inherits
    // the stub.
    const originalScrollBy = HTMLElement.prototype.scrollBy;
    const scrollBySpy = vi.fn();
    HTMLElement.prototype.scrollBy = scrollBySpy;

    try {
      const { container } = render(
        <Carousel label="Weekdeals">
          <div>Item</div>
        </Carousel>,
      );
      const prev = container.querySelector<HTMLElement>('button[aria-label="Vorige"]')!;
      const next = container.querySelector<HTMLElement>('button[aria-label="Volgende"]')!;
      // jsdom always reports 0 layout metrics; stub a non-zero clientWidth so
      // page()'s `track.clientWidth * 0.9` produces a distinguishable
      // non-zero scroll distance.
      const track = screen.getByRole('group', { name: 'Weekdeals' });
      Object.defineProperty(track, 'clientWidth', { value: 500, configurable: true });

      fireEvent.click(next);
      expect(scrollBySpy).toHaveBeenCalledTimes(1);
      expect(scrollBySpy.mock.calls[0][0]).toMatchObject({ behavior: 'smooth' });
      expect((scrollBySpy.mock.calls[0][0] as ScrollToOptions).left).toBeGreaterThan(0);

      fireEvent.click(prev);
      expect(scrollBySpy).toHaveBeenCalledTimes(2);
      expect((scrollBySpy.mock.calls[1][0] as ScrollToOptions).left).toBeLessThan(0);
    } finally {
      HTMLElement.prototype.scrollBy = originalScrollBy;
    }
  });

  it('carries its module class on the track', () => {
    render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    expect(screen.getByRole('group', { name: 'Weekdeals' }).className).toContain(
      styles.track,
    );
  });

  it('the co-located stylesheet references only bridge properties and real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });

  it('bridge is consistent, including with a caller-overridden item width', () => {
    const defaultWidth = render(
      <Carousel label="Weekdeals">
        <div>Item</div>
      </Carousel>,
    );
    const customWidth = render(
      <Carousel label="Weekdeals" itemMinWidth={200}>
        <div>Item</div>
      </Carousel>,
    );
    const elements = [
      ...defaultWidth.container.querySelectorAll('div'),
      ...customWidth.container.querySelectorAll('div'),
    ];
    expectBridgePropsConsistent(elements, readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
