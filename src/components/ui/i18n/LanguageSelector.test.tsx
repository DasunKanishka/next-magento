import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { languages } from '@/i18n/languages';
import { languageDisplayName } from '@/i18n/display-names';
import { expectModuleCssReferencesRealTokens } from '../test-utils/tokenAssertions';
import { LanguageSelector } from './LanguageSelector';
import styles from './selectorShared.module.css';

const MODULE_CSS_PATH = join(
  process.cwd(),
  'src/components/ui/i18n/selectorShared.module.css',
);

describe('LanguageSelector', () => {
  it('renders the full trigger with a label + active language name', () => {
    render(<LanguageSelector value="en" />);
    const trigger = screen.getByRole('button', { name: /Language: English/ });
    expect(within(trigger).getByText('Language')).toBeInTheDocument();
    expect(within(trigger).getByText('English')).toBeInTheDocument();
  });

  it('compact mode omits the descriptive label', () => {
    render(<LanguageSelector value="en" compact />);
    // The word "Language" label copy is not rendered in compact mode.
    expect(screen.queryByText('Language')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Language: English/ })).toBeInTheDocument();
  });

  it('opens a single-column list of every supported language (currently one — the store view the backend defines)', () => {
    render(<LanguageSelector value="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    const menu = screen.getByRole('menu', { name: 'Language' });
    for (const l of languages) {
      expect(
        within(menu).getByText(languageDisplayName('en', l.locale)),
      ).toBeInTheDocument();
    }
  });

  it('marks the active language as checked', () => {
    render(<LanguageSelector value="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    expect(screen.getByRole('menuitemradio', { name: /English/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('closes on selection and reports the chosen locale', () => {
    const onLanguageChange = vi.fn();
    render(<LanguageSelector value="en" onLanguageChange={onLanguageChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));
    expect(onLanguageChange).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<LanguageSelector value="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside click', () => {
    render(
      <div>
        <button type="button">outside</button>
        <LanguageSelector value="en" />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger carries the shared module class in both modes, meeting the tap target via the module', () => {
    const { rerender } = render(<LanguageSelector value="en" />);
    expect(screen.getByRole('button', { name: /Language:/ }).className).toContain(
      styles.trigger,
    );
    rerender(<LanguageSelector value="en" compact />);
    expect(screen.getByRole('button', { name: /Language:/ }).className).toContain(
      styles.trigger,
    );
    const css = readFileSync(MODULE_CSS_PATH, 'utf8');
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-height:\s*var\(--tap-target-min\)/);
    expect(css).toMatch(/\.trigger\s*\{[\s\S]*?min-width:\s*var\(--tap-target-min\)/);
  });

  it('wraps the option list in a labeled group', () => {
    render(<LanguageSelector value="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });

  it('roving focus starts on the (sole) first option and Escape still closes the panel', () => {
    // Only one language is supported today (the frontend tracks the backend's
    // store views, currently one), so ArrowDown/ArrowUp
    // wrap-around across >1 option is exercised by CountrySelector's combined
    // country+language menu instead (see CountrySelector.test.tsx and the
    // selector-keyboard E2E) — this test only confirms the single option is
    // focusable and the panel still closes correctly around it.
    render(<LanguageSelector value="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Language:/ }));
    const menu = screen.getByRole('menu');
    const options = screen.getAllByRole('menuitemradio');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveFocus();

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('the shared selector stylesheet references only real tokens', () => {
    expectModuleCssReferencesRealTokens(readFileSync(MODULE_CSS_PATH, 'utf8'));
  });
});
