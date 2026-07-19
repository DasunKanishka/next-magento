import React from 'react';
import { render } from '@testing-library/react';

import { defaultTokens } from '@/theme/brands/default';

/**
 * Reusable token-override test harness.
 *
 * Renders `ui` inside a scope that carries the full default token set as
 * inherited custom properties, plus any per-test `overrides`. This lets a test
 * prove that a component's styling is genuinely bound to a token: override the
 * token, then read the resolved custom-property value back off the rendered
 * element with `resolvedToken`.
 *
 * The tokens are applied as inline custom properties (rather than only via the
 * attribute-scoped brand block) because the test DOM resolves custom-property
 * inheritance but does NOT substitute `var()` into the properties that consume
 * it. So the reliable, environment-independent assertion is a diff on the
 * resolved token itself — the value the component's bridge then feeds into the
 * painted property. A browser-based pass can additionally assert the painted
 * property directly.
 */
export function renderWithBrandTokens(
  ui: React.ReactElement,
  overrides: Record<string, string> = {},
) {
  const scopeStyle = { ...defaultTokens, ...overrides } as React.CSSProperties;
  return render(
    <div data-brand="default" style={scopeStyle}>
      {ui}
    </div>,
  );
}

/** Reads the resolved (inherited) value of a custom property off an element. */
export function resolvedToken(el: Element, tokenName: string): string {
  return getComputedStyle(el).getPropertyValue(tokenName).trim();
}
