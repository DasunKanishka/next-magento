/**
 * Store-identity admin-authorable content-contract config map.
 *
 * `getStoreIdentity()` composes two kinds of source into one canonical
 * `StoreIdentity`:
 *
 *   - Native `storeConfig` scalars — `name` (← `storeName`), `logo.src` (←
 *     `headerLogoSrc`, resolved to an absolute URL), `logo.alt` (← `logoAlt`),
 *     `copyright` (← `copyright`). These are NOT listed here — they come
 *     straight off the already-fetched `StoreConfig` (see
 *     `src/lib/data-source/types.ts`).
 *   - Admin-authorable CMS blocks, listed below as stable identifiers — the
 *     same "config map, not string literals in the adapter" discipline the
 *     home content zones follow (`./content-zones.ts`).
 *
 * Field → source decision, recorded here as the single place it is decided:
 *
 *   | Field                | Source                                          | Degrades to when unauthored |
 *   |----------------------|--------------------------------------------------|------------------------------|
 *   | name                 | native `storeConfig.store_name`                  | THROWS (legal/identity)      |
 *   | copyright            | native `storeConfig.copyright`                   | THROWS (legal/identity)      |
 *   | logo.src / logo.alt  | native `storeConfig.header_logo_src` / `logo_alt`| `src: null`, `alt: ''`       |
 *   | registrationNumber   | `STORE_IDENTITY_LEGAL_BLOCK`, `.registration-number` | THROWS (legal/identity) |
 *   | tagline              | `STORE_IDENTITY_TAGLINE_BLOCK` (whole-block text)| `''`                         |
 *   | paymentMethods       | `STORE_FOOTER_PAYMENT_METHODS_BLOCK` (`<li>` list)| `[]`                        |
 *   | footerColumns        | `STORE_FOOTER_COLUMNS_BLOCK` (repeated `.footer-column`) | `[]`                 |
 *   | deliveryPromise      | `STORE_DELIVERY_PROMISE_BLOCK` (`.delivery-copy` + `.delivery-cutoff-hour`) | `{ copy: '', cutoffHour: 0 }`, atomic — see note below |
 *
 * `registrationNumber` lives in `STORE_IDENTITY_LEGAL_BLOCK`. The footer's
 * legal/copyright line is sourced from the native `storeConfig.copyright`
 * scalar, so there is no separate `legalEntity` field — the merchant authors
 * the legal-entity / copyright-holder name in Magento's native footer
 * copyright config, and the registration number (e.g. KvK) — which has no
 * native Magento field — in this CMS block.
 *
 * `deliveryPromise` degrades ATOMICALLY: unless both `copy` AND a valid
 * integer `cutoffHour` are present in the block, the whole field resolves to
 * `{ copy: '', cutoffHour: 0 }` rather than a partially-authored, potentially
 * nonsensical mixed state (e.g. a cut-off hour with no matching copy).
 */

/** Legal identity block: carries `.registration-number` (fail-closed). */
export const STORE_IDENTITY_LEGAL_BLOCK = 'store_identity_legal';
/** Free-form plain-text tagline (whole block content is the tagline). */
export const STORE_IDENTITY_TAGLINE_BLOCK = 'store_identity_tagline';
/** `<li>`-per-item list of accepted payment method names. */
export const STORE_FOOTER_PAYMENT_METHODS_BLOCK = 'store_footer_payment_methods';
/** Repeated `.footer-column` wrappers, each a heading + a list of links. */
export const STORE_FOOTER_COLUMNS_BLOCK = 'store_footer_columns';
/** `.delivery-copy` + `.delivery-cutoff-hour` — the delivery-promise pair. */
export const STORE_DELIVERY_PROMISE_BLOCK = 'store_delivery_promise';

/** Wrapper-class shape contract for `STORE_IDENTITY_LEGAL_BLOCK`. */
export const STORE_IDENTITY_REGISTRATION_NUMBER_CLASS = 'registration-number';
/** Wrapper-class shape contract for `STORE_FOOTER_COLUMNS_BLOCK` (one per column). */
export const STORE_FOOTER_COLUMN_CLASS = 'footer-column';
/** Wrapper-class shape contract for `STORE_DELIVERY_PROMISE_BLOCK`. */
export const STORE_DELIVERY_COPY_CLASS = 'delivery-copy';
export const STORE_DELIVERY_CUTOFF_HOUR_CLASS = 'delivery-cutoff-hour';

/**
 * Every identity CMS-block identifier, fetched in a single batched
 * `getEditorialContent` call by `getStoreIdentity` (the existing
 * multi-identifier `cmsBlocks` fetch path, reused rather than duplicated).
 */
export const STORE_IDENTITY_CONTENT_IDENTIFIERS: string[] = [
  STORE_IDENTITY_LEGAL_BLOCK,
  STORE_IDENTITY_TAGLINE_BLOCK,
  STORE_FOOTER_PAYMENT_METHODS_BLOCK,
  STORE_FOOTER_COLUMNS_BLOCK,
  STORE_DELIVERY_PROMISE_BLOCK,
];
