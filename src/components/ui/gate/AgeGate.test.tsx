import { fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { buildBrandStyleBlock } from '@/theme/css';
import { defaultTokens } from '@/theme/brands/default';
import { countries } from '@/i18n/countries';
import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { AgeGate } from './AgeGate';

// The gate embeds a LanguageSelector wired to next-intl navigation; stub the
// navigation hooks so the component renders standalone in jsdom.
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}));

function renderGate() {
  return render(<AgeGate locale="nl" recordConsentAction={vi.fn()} />);
}

describe('AgeGate', () => {
  it('renders all 7 seeded delivery countries as a real radio group', () => {
    renderGate();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(countries.length);
    for (const c of countries) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
    }
  });

  it('has no close/dismiss control (gate cannot be skipped)', () => {
    const { container } = renderGate();
    expect(
      within(container).queryByRole('button', { name: /sluit|close|✕|×/i }),
    ).toBeNull();
  });

  it('the 18+ checkbox is a real, non-pre-checked checkbox', () => {
    renderGate();
    const checkbox = screen.getByRole('checkbox', {
      name: /18 jaar of ouder/i,
    });
    expect(checkbox).not.toBeChecked();
  });

  it('submits to the recordConsent Server Action via a native form (progressive enhancement)', () => {
    const { container } = renderGate();
    const form = container.querySelector<HTMLFormElement>('form');
    expect(form).not.toBeNull();
    // Native inputs carry the payload with or without client JS.
    expect(form!.querySelector('input[name="country"]')).not.toBeNull();
    expect(form!.querySelector('input[name="ageConfirmed"]')).not.toBeNull();
    expect(form!.querySelector('input[name="locale"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: /De winkel betreden/ })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('CTA is disabled until a country is selected AND 18+ is confirmed, then enables (A-01/A-04)', () => {
    renderGate();
    const cta = screen.getByRole('button', { name: /De winkel betreden/ });
    // After hydration (effects flushed by RTL) the CTA gates on validity.
    expect(cta).toBeDisabled();

    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(cta).toBeDisabled(); // country only — still not enough

    fireEvent.click(screen.getByRole('checkbox', { name: /18 jaar of ouder/i }));
    expect(cta).toBeEnabled();
  });

  it('shows the EXACT legal fine-print notice', () => {
    renderGate();
    expect(
      screen.getByText(
        'Geen verkoop van alcohol onder de 18 jaar · Geniet, maar drink met mate',
      ),
    ).toBeInTheDocument();
  });

  it('embeds the compact LanguageSelector', () => {
    renderGate();
    expect(screen.getByRole('button', { name: /Taal:/ })).toBeInTheDocument();
  });

  it('every var(--*) the gate emits is a real contract token', () => {
    const { container } = renderGate();
    expectAllVarTokensAreContractKeys(container.innerHTML);
  });

  it('axe-core reports zero critical/serious violations on the rendered gate', async () => {
    const styleBlock = buildBrandStyleBlock('default', defaultTokens);
    const { container } = render(
      <div data-brand="default">
        <style dangerouslySetInnerHTML={{ __html: styleBlock }} />
        <AgeGate locale="nl" recordConsentAction={vi.fn()} />
      </div>,
    );

    const results = await axe.run(container, {
      rules: {
        // Deferred to the browser-based E2E pass (jsdom has no layout/paint):
        // see src/components/ui/a11y.axe.test.tsx for the rationale.
        'color-contrast': { enabled: false },
        'target-size': { enabled: false },
      },
    });

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    if (criticalOrSerious.length > 0) {
      const detail = criticalOrSerious
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      throw new Error(`axe-core found critical/serious violations:\n${detail}`);
    }
    expect(criticalOrSerious).toEqual([]);
  });
});
