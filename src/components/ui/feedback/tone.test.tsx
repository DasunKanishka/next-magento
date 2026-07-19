import { describe, expect, it } from 'vitest';

import { renderWithBrandTokens, resolvedToken } from '../test-utils/brandRender';
import { expectAllVarTokensAreContractKeys } from '../test-utils/tokenAssertions';
import { Alert } from './Alert';
import { Toast } from './Toast';
import { FEEDBACK_TONE_FAMILIES, FEEDBACK_TONE_ICONS } from './tone';

describe('feedback tone module', () => {
  it('declares exactly the three live tones — no warning tone invented', () => {
    expect(Object.keys(FEEDBACK_TONE_ICONS).sort()).toEqual(['error', 'info', 'success']);
    expect(Object.keys(FEEDBACK_TONE_FAMILIES).sort()).toEqual([
      'error',
      'info',
      'success',
    ]);
  });

  it('every tone family value is a real contract token, never a raw literal', () => {
    expectAllVarTokensAreContractKeys(JSON.stringify(FEEDBACK_TONE_FAMILIES));
  });

  it('each tone family carries the tint/border/accent fields both consumers project from', () => {
    for (const tone of ['success', 'info', 'error'] as const) {
      const family = FEEDBACK_TONE_FAMILIES[tone];
      expect(family.tint).toMatch(/^var\(--color-[\w-]+-tint\)$/);
      expect(family.border).toMatch(/^var\(--color-[\w-]+-tint-border\)$/);
      expect(family.accent).toMatch(/^var\(--color-[\w-]+\)$/);
    }
  });

  it('overriding one shared family token flows to BOTH Alert and Toast (success → cta family)', () => {
    const overrideTint = 'rgb(1, 2, 3)';
    const overrideAccent = 'rgb(4, 5, 6)';

    // Both consumers, rendered under the SAME override of the shared cta-family
    // tokens that back Alert's bg/accent and Toast's tint/accent.
    const scope = renderWithBrandTokens(
      <>
        <Alert tone="success" title="Gelukt">
          Toegevoegd
        </Alert>
        <Toast tone="success">Toegevoegd</Toast>
      </>,
      {
        '--color-cta-tint': overrideTint,
        '--color-cta': overrideAccent,
      },
    );

    const [alertEl, toastEl] = scope.getAllByRole('status');

    // The single override resolves inside each consumer's rendered subtree.
    expect(resolvedToken(alertEl, '--color-cta-tint')).toBe(overrideTint);
    expect(resolvedToken(alertEl, '--color-cta')).toBe(overrideAccent);
    expect(resolvedToken(toastEl, '--color-cta-tint')).toBe(overrideTint);
    expect(resolvedToken(toastEl, '--color-cta')).toBe(overrideAccent);

    // Wiring: each consumer binds the shared family tokens through its own
    // bridge props, so the swap necessarily repaints both surfaces.
    expect(alertEl.style.getPropertyValue('--local-bg')).toBe('var(--color-cta-tint)');
    expect(alertEl.style.getPropertyValue('--local-accent')).toBe('var(--color-cta)');
    expect(toastEl.style.getPropertyValue('--local-tint')).toBe('var(--color-cta-tint)');
    expect(toastEl.style.getPropertyValue('--local-accent')).toBe('var(--color-cta)');
  });
});
