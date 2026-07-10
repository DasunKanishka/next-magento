import { expect } from 'vitest';

import { CONTRACT_TOKEN_NAMES } from '@/theme/contract';

const KNOWN_TOKENS = new Set<string>(CONTRACT_TOKEN_NAMES as readonly string[]);

// Matches `var(--x-y-z)` (no fallback segment) so a typo'd or removed
// contract key surfaces as a literal `var(--typo)` string left in the DOM
// instead of silently resolving to nothing.
const VAR_REFERENCE_RE = /var\((--[a-zA-Z0-9-]+)\)/g;

/** Extracts every `--*` token name referenced via `var(--*)` in a chunk of HTML/CSS text. */
export function extractVarTokenNames(html: string): string[] {
  return Array.from(html.matchAll(VAR_REFERENCE_RE), (m) => m[1]);
}

/**
 * Asserts every `var(--*)` reference found in the given rendered markup is a
 * real, currently-declared contract key (see `src/theme/contract.ts`) — i.e.
 * zero typo'd/missing tokens that would resolve to an unstyled fallback.
 * Fails loudly (naming the offending token) rather than passing silently.
 */
export function expectAllVarTokensAreContractKeys(html: string): void {
  const found = extractVarTokenNames(html);
  expect(
    found.length,
    'expected at least one var(--*) token reference to check',
  ).toBeGreaterThan(0);

  const unknown = found.filter((name) => !KNOWN_TOKENS.has(name));
  expect(
    unknown,
    `unknown/unresolved contract tokens referenced: ${unknown.join(', ')}`,
  ).toEqual([]);
}

/** Parses a `defaultTokens` px value (e.g. "44px") into a number for numeric assertions. */
export function pxValue(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());
  if (!match) {
    throw new Error(`Expected a px value, got "${value}"`);
  }
  return Number(match[1]);
}
