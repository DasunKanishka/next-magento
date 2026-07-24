import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { defaultTokens } from '@/theme/brands/default';
import { CountrySelector } from '@/components/ui/i18n/CountrySelector';
import { LanguageSelector } from '@/components/ui/i18n/LanguageSelector';
import { MobileMenu } from '@/components/header/MobileMenu';
import type { NavCategory } from '@/components/header/types';
import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import codeChipStyles from './codeChip.module.css';

const MODULE_CSS_PATH = join(process.cwd(), 'src/components/ui/core/codeChip.module.css');
const CSS_TEXT = readFileSync(MODULE_CSS_PATH, 'utf8');

vi.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

const categories: NavCategory[] = [
  { id: '11', name: 'Mannen', urlPath: 'mannen', children: [] },
  { id: '20', name: 'Vrouwen', urlPath: 'vrouwen', children: [] },
];

/**
 * Pulls the declaration block of a single top-level rule out of the raw CSS
 * text (mirrors panelSurface.test.tsx / Eyebrow.test.tsx's helper of the same
 * name).
 */
function ruleBody(cssText: string, selector: string): string {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(withoutComments);
  if (!match) {
    throw new Error(`rule .${selector} not found in CSS text`);
  }
  return match[1];
}

describe('codeChip (shared language/country code badge)', () => {
  // (a) module-css-real-tokens
  it('references only real contract tokens', () => {
    expectModuleCssReferencesRealTokens(CSS_TEXT);
  });

  it('base rule declares the full badge shape', () => {
    const body = ruleBody(CSS_TEXT, 'codeChip');
    const props = Array.from(body.matchAll(/([a-z-]+)\s*:/g), (m) => m[1]).sort();
    expect(props).toEqual(
      [
        'align-items',
        'background',
        'border-radius',
        'color',
        'display',
        'font-family',
        'font-size',
        'font-weight',
        'justify-content',
        'line-height',
        'min-width',
        'padding',
      ].sort(),
    );
    expect(body).toMatch(/min-width:\s*var\(--space-7\)/);
    expect(body).toMatch(/padding:\s*var\(--space-1\)\s+var\(--space-2\)/);
    expect(body).toMatch(/border-radius:\s*var\(--radius-sm\)/);
    expect(body).toMatch(/font-family:\s*var\(--font-brand\)/);
    expect(body).toMatch(/font-size:\s*var\(--type-meta-size\)/);
    expect(body).toMatch(/font-weight:\s*var\(--type-weight-bold\)/);
    expect(body).toMatch(/line-height:\s*var\(--type-meta-line-height\)/);
    expect(body).toMatch(/background:\s*var\(--color-surface-inset-b\)/);
    expect(body).toMatch(/color:\s*var\(--color-text-muted\)/);
  });

  it('active modifier flips to the brand fill with on-brand text', () => {
    const body = ruleBody(CSS_TEXT, 'codeChipActive');
    expect(body).toMatch(/background:\s*var\(--color-brand\)/);
    expect(body).toMatch(/color:\s*var\(--color-on-brand\)/);
  });

  // (b) bridge-consistency: N/A. codeChip is fully static — every declaration
  // is a direct var(--token) reference, never a --local-* bridge property —
  // so there is no bridge surface to cross-check in either direction.
  it('sets no --local-* bridge property (nothing to cross-check)', () => {
    const withoutComments = CSS_TEXT.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(withoutComments).not.toMatch(/--local-/);
  });

  // (c) token-swap overridability
  it('every codeChip token is independently overridable, inactive and active', () => {
    const base = renderWithBrandTokens(
      <span data-testid="chip" className={codeChipStyles.codeChip}>
        NL
      </span>,
    );
    const baseEl = base.getByTestId('chip');
    expect(resolvedToken(baseEl, '--space-7')).toBe(defaultTokens['--space-7']);
    expect(resolvedToken(baseEl, '--space-1')).toBe(defaultTokens['--space-1']);
    expect(resolvedToken(baseEl, '--space-2')).toBe(defaultTokens['--space-2']);
    expect(resolvedToken(baseEl, '--radius-sm')).toBe(defaultTokens['--radius-sm']);
    expect(resolvedToken(baseEl, '--font-brand')).toBe(defaultTokens['--font-brand']);
    expect(resolvedToken(baseEl, '--type-meta-size')).toBe(
      defaultTokens['--type-meta-size'],
    );
    expect(resolvedToken(baseEl, '--type-weight-bold')).toBe(
      defaultTokens['--type-weight-bold'],
    );
    expect(resolvedToken(baseEl, '--type-meta-line-height')).toBe(
      defaultTokens['--type-meta-line-height'],
    );
    expect(resolvedToken(baseEl, '--color-surface-inset-b')).toBe(
      defaultTokens['--color-surface-inset-b'],
    );
    expect(resolvedToken(baseEl, '--color-text-muted')).toBe(
      defaultTokens['--color-text-muted'],
    );
    base.unmount();

    const active = renderWithBrandTokens(
      <span
        data-testid="chip-active"
        className={`${codeChipStyles.codeChip} ${codeChipStyles.codeChipActive}`}
      >
        EN
      </span>,
    );
    const activeEl = active.getByTestId('chip-active');
    expect(resolvedToken(activeEl, '--color-brand')).toBe(defaultTokens['--color-brand']);
    expect(resolvedToken(activeEl, '--color-on-brand')).toBe(
      defaultTokens['--color-on-brand'],
    );
    active.unmount();

    const overrides = {
      '--space-7': '40px',
      '--space-1': '5px',
      '--space-2': '9px',
      '--radius-sm': '3px',
      '--font-brand': "'Scratch', sans-serif",
      '--type-meta-size': '17px',
      '--type-weight-bold': '900',
      '--type-meta-line-height': '1.5',
      '--color-surface-inset-b': 'rgb(1, 2, 3)',
      '--color-text-muted': 'rgb(4, 5, 6)',
      '--color-brand': 'rgb(7, 8, 9)',
      '--color-on-brand': 'rgb(10, 11, 12)',
    };
    const over = renderWithBrandTokens(
      <span
        data-testid="chip-over"
        className={`${codeChipStyles.codeChip} ${codeChipStyles.codeChipActive}`}
      >
        FR
      </span>,
      overrides,
    );
    const overEl = over.getByTestId('chip-over');
    for (const [token, value] of Object.entries(overrides)) {
      expect(resolvedToken(overEl, token)).toBe(value);
    }
  });

  // (d) className-wiring — each of the 3 consumers composes the shared class
  // onto its rendered code badge; MobileMenu in particular must draw it from
  // ui/core, never from the i18n selectors' internal module.
  it('CountrySelector wires the shared class onto the language column code badges', () => {
    render(<CountrySelector value="NL" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    const menu = screen.getByRole('menu');
    const english = within(menu).getByRole('menuitemradio', { name: /English/ });
    const code = english.querySelector('span');
    expect(code?.className).toContain(codeChipStyles.codeChip);
    expect(code?.className).toContain(codeChipStyles.codeChipActive);
  });

  it('LanguageSelector wires the shared class onto the trigger badge and option badges', () => {
    render(<LanguageSelector value="en" />);
    const trigger = screen.getByRole('button', { name: /Language: English/ });
    const triggerBadge = trigger.querySelector('span');
    expect(triggerBadge?.className).toContain(codeChipStyles.codeChip);
    expect(triggerBadge?.className).toContain(codeChipStyles.codeChipActive);

    fireEvent.click(trigger);
    const englishOption = screen.getByRole('menuitemradio', { name: /English/ });
    const optionBadge = englishOption.querySelector('span');
    expect(optionBadge?.className).toContain(codeChipStyles.codeChip);
    expect(optionBadge?.className).toContain(codeChipStyles.codeChipActive);
  });

  it('MobileMenu wires the shared class onto its language list badges (no selectorShared import)', () => {
    render(<MobileMenu categories={categories} locale="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const english = screen.getByRole('menuitemradio', { name: /English/ });
    const code = english.querySelector('span');
    expect(code?.className).toContain(codeChipStyles.codeChip);
    expect(code?.className).toContain(codeChipStyles.codeChipActive);
  });

  it('MobileMenu.tsx no longer imports selectorShared.module.css', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/header/MobileMenu.tsx'),
      'utf8',
    );
    expect(source).not.toMatch(/selectorShared/);
  });
});
