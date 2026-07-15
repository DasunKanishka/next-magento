import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  expectBridgePropsConsistent,
  expectModuleCssReferencesRealTokens,
} from '../ui/test-utils/tokenAssertions';
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
