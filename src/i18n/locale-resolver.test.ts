import { describe, expect, it } from 'vitest';

import { localeResolver } from './locale-resolver';
import { supportedLocales } from './locales';

describe('localeResolver', () => {
  it('exposes the full supported-locale set', () => {
    expect(localeResolver.supportedLocales).toEqual([...supportedLocales]);
  });

  it('resolves nl to the single real-content store view (default/EUR)', () => {
    expect(localeResolver.resolve('nl')).toEqual({
      storeViewCode: 'default',
      currencyCode: 'EUR',
    });
  });

  it('falls back every non-nl locale to default/EUR without throwing', () => {
    for (const locale of supportedLocales) {
      const resolution = localeResolver.resolve(locale);
      expect(resolution.storeViewCode).toBe('default');
      expect(resolution.currencyCode).toBe('EUR');
    }
  });

  it('resolve is total over the supported-locale set', () => {
    for (const locale of localeResolver.supportedLocales) {
      expect(() => localeResolver.resolve(locale)).not.toThrow();
    }
  });
});
