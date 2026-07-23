import { describe, expect, it } from 'vitest';

import { resolveActiveLocale } from './resolve-locale';

describe('resolveActiveLocale', () => {
  it('resolves a Magento-style locale tag to its language subtag', () => {
    expect(resolveActiveLocale('en_US')).toBe('en');
  });

  it('is case-insensitive and accepts a hyphenated tag', () => {
    expect(resolveActiveLocale('EN-us')).toBe('en');
  });

  it('falls back to the default locale for a store locale the frontend has no catalog for', () => {
    expect(resolveActiveLocale('de_DE')).toBe('en');
    expect(resolveActiveLocale('')).toBe('en');
  });
});
