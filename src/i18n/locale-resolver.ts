import { supportedLocales, type SupportedLocale } from './locales';

/**
 * The two backend-scope values that must accompany every Magento call for a
 * given locale — the store view and its currency. These become the explicit
 * `Store` + `Content-Currency` cache-key headers (see the data-source layer),
 * which is why they are resolved from the locale rather than pinned globally.
 */
export interface LocaleResolution {
  storeViewCode: string;
  currencyCode: string;
}

/**
 * PRD M4 deep-module interface: given a request locale, resolve the store view
 * and currency that must accompany every backend call. The shape is fixed by
 * the PRD and must not drift — `resolve(locale)` plus the readonly
 * `supportedLocales` list are the entire contract.
 */
export interface LocaleResolver {
  resolve(locale: SupportedLocale): LocaleResolution;
  readonly supportedLocales: SupportedLocale[];
}

/**
 * The locale→store-view/currency mapping table.
 *
 * V0.1.0 has EXACTLY ONE real-content entry — `nl` — backed by a live Magento
 * store view. This is a deliberate, disclosed limitation of the single-store
 * V0.1.0 backend (PRD M4 + Design Decisions "Country/language selector
 * fallback"): the selector UI is fully real for all 6 languages / 7 countries,
 * but only `nl` currently resolves to distinct real content. V0.2.0+ locales
 * are additive entries in THIS object — no new UI, no re-architecture.
 */
const LOCALE_STORE_MAP: Partial<Record<SupportedLocale, LocaleResolution>> = {
  nl: { storeViewCode: 'default', currencyCode: 'EUR' },
};

/**
 * Fallback scope for any locale not present in `LOCALE_STORE_MAP`. In V0.1.0
 * this is the same `default`/EUR store view the `nl` entry points at — every
 * non-`nl` selection resolves here without a runtime error, which is the exact
 * behavior asserted by the AC#7 E2E test. It is a named constant (not the `nl`
 * entry re-used) so that when a second store view ships, changing the fallback
 * is an isolated decision from changing the `nl` mapping.
 */
const FALLBACK_RESOLUTION: LocaleResolution = {
  storeViewCode: 'default',
  currencyCode: 'EUR',
};

export const localeResolver: LocaleResolver = {
  resolve(locale: SupportedLocale): LocaleResolution {
    return LOCALE_STORE_MAP[locale] ?? FALLBACK_RESOLUTION;
  },
  supportedLocales: [...supportedLocales],
};
