import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { countries } from '@/i18n/countries';
import { languages } from '@/i18n/languages';
import { countryDisplayName, languageDisplayName } from '@/i18n/display-names';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import { CountrySelector } from './CountrySelector';
import styles from './selectorShared.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/i18n/selectorShared.module.css',
);

describe('CountrySelector', () => {
  it('renders the full trigger with the "Deliver to" label + country name', () => {
    render(<CountrySelector value="NL" />);
    const trigger = screen.getByRole('button', { name: /Delivery country: Netherlands/ });
    expect(within(trigger).getByText('Deliver to')).toBeInTheDocument();
    expect(within(trigger).getByText('Netherlands')).toBeInTheDocument();
  });

  it('compact mode omits the label (flag + chevron only)', () => {
    render(<CountrySelector value="NL" compact />);
    expect(screen.queryByText('Deliver to')).not.toBeInTheDocument();
    // Trigger still present and reachable.
    expect(
      screen.getByRole('button', { name: /Delivery country: Netherlands/ }),
    ).toBeInTheDocument();
  });

  it('opens a two-column dropdown listing all 7 countries and every supported language (currently one), names resolved via Intl.DisplayNames in the active locale', () => {
    render(<CountrySelector value="NL" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    const menu = screen.getByRole('menu', { name: 'Country and language' });

    // Exact-text lookups avoid substring collisions between country/language
    // names (e.g. "Germany" vs "Germany", "Netherlands" vs "Netherlands");
    // names are resolved from each entry's ISO code, not a hardcoded table.
    for (const c of countries) {
      expect(
        within(menu).getByText(countryDisplayName('en', c.code)),
      ).toBeInTheDocument();
    }
    for (const l of languages) {
      expect(
        within(menu).getByText(languageDisplayName('en', l.locale)),
      ).toBeInTheDocument();
    }
  });

  it('marks the active country (left) and active language (right) as checked', () => {
    render(<CountrySelector value="FR" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    expect(screen.getByRole('menuitemradio', { name: /France/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: /English/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('closes on country selection and reports the chosen code', () => {
    const onCountryChange = vi.fn();
    render(<CountrySelector value="NL" onCountryChange={onCountryChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Germany/ }));
    expect(onCountryChange).toHaveBeenCalledWith('DE');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on language selection and reports the chosen locale', () => {
    const onLanguageChange = vi.fn();
    render(
      <CountrySelector value="NL" language="en" onLanguageChange={onLanguageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<CountrySelector value="NL" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <button type="button">outside</button>
        <CountrySelector value="NL" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger carries the shared module class in both modes, meeting the tap target via the module', () => {
    const { rerender } = render(<CountrySelector value="NL" />);
    expect(screen.getByRole('button', { name: /Delivery country/ }).className).toContain(
      styles.trigger,
    );
    rerender(<CountrySelector value="NL" compact />);
    expect(screen.getByRole('button', { name: /Delivery country/ }).className).toContain(
      styles.trigger,
    );
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-height:\s*var\(--tap-target-min\)/);
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-width:\s*var\(--tap-target-min\)/);
  });

  it('alignLeft anchors the dropdown to the left edge (else the right)', () => {
    const left = render(<CountrySelector value="NL" alignLeft />);
    fireEvent.click(
      within(left.container).getByRole('button', { name: /Delivery country/ }),
    );
    const leftMenu = within(left.container).getByRole('menu');
    expect(leftMenu.className).toContain(styles.panelLeft);
    expect(leftMenu.className).not.toContain(styles.panelRight);

    const right = render(<CountrySelector value="NL" />);
    fireEvent.click(
      within(right.container).getByRole('button', { name: /Delivery country/ }),
    );
    const rightMenu = within(right.container).getByRole('menu');
    expect(rightMenu.className).toContain(styles.panelRight);
  });

  it('wraps each column in a labeled group', () => {
    render(<CountrySelector value="NL" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    expect(screen.getByRole('group', { name: 'Country' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });

  it('roves focus across options with ArrowDown/ArrowUp and wraps around', () => {
    render(<CountrySelector value="NL" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Delivery country/ }));
    const menu = screen.getByRole('menu');
    const options = screen.getAllByRole('menuitemradio');

    options[0].focus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(options[0]).toHaveFocus();

    // ArrowUp from the first option wraps to the last.
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(options[options.length - 1]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Home' });
    expect(options[0]).toHaveFocus();
  });

  it('the shared selector stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
