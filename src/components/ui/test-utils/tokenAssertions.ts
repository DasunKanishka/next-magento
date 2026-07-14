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

/**
 * Asserts every `var(--*)` reference in a component's CSS-module source is
 * either a bridge property (`--local-*`, supplied at runtime by the component)
 * or a real, currently-declared contract key. Guards against a stylesheet
 * pointing at a token that does not exist (typo or removed key), which would
 * silently render unstyled. Pass the raw text of a `*.module.css` file.
 */
export function expectModuleCssReferencesRealTokens(cssText: string): void {
  // Strip block comments so example token names in doc comments are not
  // mistaken for real declarations.
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = extractVarTokenNames(withoutComments);
  expect(
    found.length,
    'expected at least one var(--*) reference in the module CSS',
  ).toBeGreaterThan(0);

  const unknown = found.filter(
    (name) => !name.startsWith('--local-') && !KNOWN_TOKENS.has(name),
  );
  expect(
    unknown,
    `module CSS references unknown token(s): ${unknown.join(', ')}`,
  ).toEqual([]);
}

/** Extracts every `var(--local-*)` bridge property consumed in CSS text. */
export function extractConsumedLocalProps(cssText: string): string[] {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  return extractVarTokenNames(withoutComments).filter((name) =>
    name.startsWith('--local-'),
  );
}

/** Extracts every `--local-*` custom property set on an element's inline style. */
export function extractSetLocalProps(el: Element): string[] {
  const style = el.getAttribute('style') ?? '';
  return Array.from(style.matchAll(/(--local-[a-zA-Z0-9-]+)\s*:/g), (m) => m[1]);
}

/**
 * Cross-checks the bridge contract between a component and its stylesheet in
 * BOTH directions, so a typo on either side fails loudly rather than rendering
 * silently unstyled:
 *   - every `--local-*` the module reads (`var(--local-*)`) is set by at least
 *     one of the rendered elements — else the rule resolves to nothing; and
 *   - every `--local-*` the elements set is read by the module — else the value
 *     is dead (e.g. a misspelled property that nothing consumes).
 * Pass elements covering every variant so their union of set properties is the
 * component's full bridge surface.
 */
export function expectBridgePropsConsistent(elements: Element[], cssText: string): void {
  const consumed = new Set(extractConsumedLocalProps(cssText));
  const set = new Set(elements.flatMap((el) => extractSetLocalProps(el)));

  expect(
    consumed.size,
    'expected the module to consume at least one --local-* bridge property',
  ).toBeGreaterThan(0);
  expect(
    set.size,
    'expected the component to set at least one --local-* bridge property',
  ).toBeGreaterThan(0);

  const unfed = [...consumed].filter((name) => !set.has(name)).sort();
  const dead = [...set].filter((name) => !consumed.has(name)).sort();

  expect(
    unfed,
    `module reads bridge properties the component never sets: ${unfed.join(', ')}`,
  ).toEqual([]);
  expect(
    dead,
    `component sets bridge properties the module never reads: ${dead.join(', ')}`,
  ).toEqual([]);
}
