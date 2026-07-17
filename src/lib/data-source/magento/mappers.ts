import type {
  CanonicalCategory,
  CanonicalProduct,
  CmsBlock,
  StoreConfig,
  StoreIdentity,
} from '@/lib/data-source/types';
import { sanitizeCmsHtml } from '@/lib/sanitize/cms-html';
import {
  STORE_DELIVERY_COPY_CLASS,
  STORE_DELIVERY_CUTOFF_HOUR_CLASS,
  STORE_DELIVERY_PROMISE_BLOCK,
  STORE_FOOTER_COLUMNS_BLOCK,
  STORE_FOOTER_COLUMN_CLASS,
  STORE_FOOTER_PAYMENT_METHODS_BLOCK,
  STORE_IDENTITY_LEGAL_BLOCK,
  STORE_IDENTITY_LEGAL_ENTITY_CLASS,
  STORE_IDENTITY_REGISTRATION_NUMBER_CLASS,
  STORE_IDENTITY_TAGLINE_BLOCK,
} from '@/config/store-identity-content';

/**
 * Pure raw-response → canonical-model mapping functions for the Magento
 * adapter. Kept free of any I/O or `graphql-request` dependency so they are
 * directly unit-testable with plain objects.
 *
 * Every field the committed schema snapshot returns for `storeConfig`,
 * `categoryList`, `products` (`HomeProductFields`) and `cmsBlocks` is mapped
 * explicitly below — nothing is silently dropped or passed through as
 * `undefined`.
 *
 * Magento leaf fields are largely nullable in the schema; every access
 * coalesces so a canonical non-optional field is never `undefined`.
 *
 * `composeStoreIdentity` (bottom of file) is one level up from raw→canonical
 * mapping: it takes the already-canonical `StoreConfig` + `CmsBlock[]` (the
 * adapter has already fetched and mapped both) and composes the canonical
 * `StoreIdentity`. It is still a pure function — no I/O — so it stays
 * directly unit-testable with plain fixture objects, same as the mappers
 * above.
 */

// --- Raw input shapes (structurally match the codegen query result types) ---

interface RawPriceValue {
  value?: number | null;
  currency?: string | null;
}

interface RawHomeProduct {
  sku?: string | null;
  name?: string | null;
  url_key?: string | null;
  small_image?: { url?: string | null; label?: string | null } | null;
  price_range: {
    minimum_price: {
      regular_price: RawPriceValue;
      final_price: RawPriceValue;
    };
  };
  rating_summary?: number | null;
  review_count?: number | null;
  stock_status?: string | null;
}

interface RawCategory {
  id?: number | null;
  name?: string | null;
  url_path?: string | null;
  image?: string | null;
  children?: (RawCategory | null)[] | null;
}

interface RawStoreConfig {
  store_code?: string | null;
  locale?: string | null;
  base_currency_code?: string | null;
  secure_base_media_url?: string | null;
  cms_home_page?: string | null;
  header_logo_src?: string | null;
  logo_alt?: string | null;
  copyright?: string | null;
  store_name?: string | null;
}

interface RawCmsBlock {
  identifier?: string | null;
  title?: string | null;
  content?: string | null;
}

// --- Mappers ---

export function mapStoreConfig(raw: RawStoreConfig): StoreConfig {
  return {
    storeCode: raw.store_code ?? '',
    locale: raw.locale ?? '',
    currencyCode: raw.base_currency_code ?? '',
    mediaBaseUrl: raw.secure_base_media_url ?? '',
    cmsHomePage: raw.cms_home_page ?? '',
    // Store-identity fields: `null` (not '') when Magento returns the field
    // empty/absent — these are optional display scalars, not required for the
    // cache-key/home-page-resolution role the existing fields above play, so
    // no fabricated default is appropriate here. `|| null` (not `?? null`)
    // normalizes a backend-returned empty string '' to null too — for these
    // optional strings '' is the only falsy value and it means "unset".
    headerLogoSrc: raw.header_logo_src || null,
    logoAlt: raw.logo_alt || null,
    copyright: raw.copyright || null,
    storeName: raw.store_name || null,
  };
}

export function mapCategory(raw: RawCategory): CanonicalCategory {
  const category: CanonicalCategory = {
    id: raw.id != null ? String(raw.id) : '',
    name: raw.name ?? '',
    urlPath: raw.url_path ?? '',
    children: (raw.children ?? [])
      .filter((child): child is RawCategory => child != null)
      .map(mapCategory),
  };
  // `image` is optional in the canonical model — set only when present so we
  // never pass `imageUrl: undefined` through explicitly.
  if (raw.image != null && raw.image !== '') {
    category.imageUrl = raw.image;
  }
  return category;
}

export function mapCategories(raw: RawCategory[]): CanonicalCategory[] {
  return raw.map(mapCategory);
}

function toStockStatus(raw?: string | null): CanonicalProduct['stockStatus'] {
  // Fail-safe: anything not explicitly IN_STOCK is treated as OUT_OF_STOCK so a
  // missing/unknown status never presents an unbuyable product as buyable.
  return raw === 'IN_STOCK' ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

export function mapProduct(raw: RawHomeProduct): CanonicalProduct {
  const minimum = raw.price_range.minimum_price;
  const finalPrice = minimum.final_price;
  const regularPrice = minimum.regular_price;

  const currency = finalPrice.currency ?? regularPrice.currency ?? '';
  const finalAmount = finalPrice.value ?? 0;
  const regularAmount = regularPrice.value ?? finalAmount;

  const product: CanonicalProduct = {
    sku: raw.sku ?? '',
    name: raw.name ?? '',
    urlKey: raw.url_key ?? '',
    // HomeProductFields carries no brand attribute; the canonical `brand` has no
    // source field in this fragment (known gap — documented here deliberately).
    brand: '',
    imageUrl: raw.small_image?.url ?? '',
    // `small_image.label` is Magento's image alt text — mapped for a11y so no
    // fetched field is dropped. '' when the backend supplies no label.
    imageAlt: raw.small_image?.label ?? '',
    price: { amount: finalAmount, currency },
    stockStatus: toStockStatus(raw.stock_status),
  };

  // oldPrice: present only when there is a genuine discount (regular > final).
  // Equal prices → no oldPrice (the "missing oldPrice" edge case).
  if (regularPrice.value != null && regularAmount > finalAmount) {
    product.oldPrice = { amount: regularAmount, currency };
  }

  // ratingSummary: Magento `rating_summary` is a 0–100 percentage; canonical is
  // 0–5. A value of 0 / null means "no reviews" → omit (the "missing
  // rating_summary" edge case).
  if (raw.rating_summary != null && raw.rating_summary > 0) {
    product.ratingSummary = raw.rating_summary / 20;
  }

  if (raw.review_count != null && raw.review_count > 0) {
    product.reviewCount = raw.review_count;
  }

  return product;
}

export function mapProducts(raw: RawHomeProduct[]): CanonicalProduct[] {
  return raw.map(mapProduct);
}

export function mapCmsBlock(raw: RawCmsBlock): CmsBlock {
  return {
    identifier: raw.identifier ?? '',
    title: raw.title ?? '',
    content: raw.content ?? '',
  };
}

export function mapCmsBlocks(raw: RawCmsBlock[]): CmsBlock[] {
  return raw.map(mapCmsBlock);
}

/**
 * Map the backend newsletter-subscribe status enum to the neutral
 * `{ status: 'subscribed' | 'error' }` contract.
 *
 * Both `SUBSCRIBED` (single opt-in complete) and `NOT_ACTIVE` (double opt-in
 * pending a confirmation email) are success outcomes — the address was
 * accepted and a confirmation flow started. Any other value (including
 * `null`/`undefined` or an unknown status) maps to `'error'` so the caller
 * never over-reports success. This is a pure function so the success/error
 * mapping is unit-testable without any I/O.
 */
export function mapNewsletterStatus(raw?: string | null): 'subscribed' | 'error' {
  return raw === 'SUBSCRIBED' || raw === 'NOT_ACTIVE' ? 'subscribed' : 'error';
}

// --- Store identity composition ---------------------------------------

/**
 * The four legal/identity fields `getStoreIdentity` must never return
 * defaulted or missing. Kept as a literal union so every call site to
 * `requireLegalField` is checked against this exact set.
 */
type LegalIdentityField = 'name' | 'legalEntity' | 'registrationNumber' | 'copyright';

/**
 * Enforce the fail-closed rule for a legal/identity field: throw (with a
 * greppable, field-naming marker logged at `error` level first) when the
 * sourced value is missing or empty. No secret/PII is logged — only the field
 * name and a generic reason.
 */
function requireLegalField(field: LegalIdentityField, value: string): string {
  if (value === '') {
    // Stable, greppable marker: a fail-closed compliance event must never be
    // indistinguishable from a generic error.
    console.error(`store-identity:fail-closed field=${field}`);
    throw new Error(`store-identity:fail-closed field=${field}`);
  }
  return value;
}

/**
 * Resolve the raw `headerLogoSrc` Magento returns into an absolute media URL.
 * `null` when no logo is configured. Guards against double-prefixing an
 * already-absolute value and against a missing/duplicated path separator at
 * the join point.
 */
function resolveLogoSrc(
  headerLogoSrc: string | null,
  mediaBaseUrl: string,
): string | null {
  if (!headerLogoSrc) return null;
  if (/^https?:\/\//i.test(headerLogoSrc)) return headerLogoSrc;
  const base = mediaBaseUrl.endsWith('/') ? mediaBaseUrl : `${mediaBaseUrl}/`;
  const path = headerLogoSrc.startsWith('/') ? headerLogoSrc.slice(1) : headerLogoSrc;
  return `${base}${path}`;
}

function findBlockContent(blocks: CmsBlock[], identifier: string): string {
  return blocks.find((b) => b.identifier === identifier)?.content ?? '';
}

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Decode the handful of entities the sanitizer can leave behind. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&[a-zA-Z#0-9]+;/g, (match) => NAMED_ENTITIES[match] ?? match);
}

/** Reduce an inline HTML fragment to trimmed, entity-decoded plain text. */
function toText(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match `className` as a WHOLE space-delimited token inside a `class="…"`
 * attribute value: it must sit at the start of the value or be preceded by
 * whitespace, and end at the closing quote or be followed by whitespace. This
 * avoids a superset-class false match (e.g. `legal-entity` must not match
 * `legal-entity-x`), which the previous `\b…\b` form allowed because `-` is a
 * regex word boundary. Emitted as a non-capturing group so surrounding capture
 * indices are unchanged.
 */
function classTokenPattern(className: string): string {
  return `class="(?:[^"]*\\s)?${className}(?:\\s[^"]*)?"`;
}

/** Inner content of the first element (any tag) carrying `className`, or `''`. */
function firstByClass(html: string, className: string): string {
  const re = new RegExp(
    `<([a-z0-9]+)\\b[^>]*${classTokenPattern(className)}[^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i',
  );
  const match = re.exec(html);
  return match ? match[2] : '';
}

/** Every `<div class="...{className}...">` wrapper's inner content, in order. */
function itemBlocks(html: string, className: string): string[] {
  const re = new RegExp(
    `<div\\b[^>]*${classTokenPattern(className)}[^>]*>([\\s\\S]*?)</div>`,
    'gi',
  );
  return Array.from(html.matchAll(re), (m) => m[1]);
}

function firstHeading(block: string): string {
  const match = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/i.exec(block);
  return match ? toText(match[2]) : '';
}

/**
 * Extract `legalEntity` + `registrationNumber` from the legal-identity block.
 * Plain-text-only extraction (sanitize, then strip markup) — these are short
 * legal facts, never rendered as markup.
 */
function parseLegalIdentity(raw: string): {
  legalEntity: string;
  registrationNumber: string;
} {
  const clean = sanitizeCmsHtml(raw);
  return {
    legalEntity: toText(firstByClass(clean, STORE_IDENTITY_LEGAL_ENTITY_CLASS)),
    registrationNumber: toText(
      firstByClass(clean, STORE_IDENTITY_REGISTRATION_NUMBER_CLASS),
    ),
  };
}

/** The tagline block's whole sanitized text content. `''` when unauthored. */
function parseTagline(raw: string): string {
  return toText(sanitizeCmsHtml(raw));
}

/** Every `<li>` text in the payment-methods block, in order. `[]` when unauthored. */
function parsePaymentMethods(raw: string): string[] {
  const clean = sanitizeCmsHtml(raw);
  return Array.from(clean.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi), (m) =>
    toText(m[1]),
  ).filter((item) => item !== '');
}

/**
 * Parse the repeated `.footer-column` wrappers into heading + link lists.
 * Plain-text/attribute extraction only — hrefs and labels, never raw markup.
 */
function parseFooterColumns(raw: string): StoreIdentity['footerColumns'] {
  const clean = sanitizeCmsHtml(raw);
  return itemBlocks(clean, STORE_FOOTER_COLUMN_CLASS)
    .map((block) => {
      const heading = firstHeading(block);
      const links = Array.from(
        block.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi),
        (m) => ({ href: m[1], label: toText(m[2]) }),
      ).filter((link) => link.label !== '');
      return { heading, links };
    })
    .filter((column) => column.heading !== '' || column.links.length > 0);
}

const EMPTY_DELIVERY_PROMISE: StoreIdentity['deliveryPromise'] = {
  copy: '',
  cutoffHour: 0,
};

/**
 * Parse the delivery-promise block. Degrades ATOMICALLY: unless both `copy`
 * and a valid integer `cutoffHour` are present, the whole field resolves to
 * `EMPTY_DELIVERY_PROMISE` rather than a partially-authored mixed state.
 */
function parseDeliveryPromise(raw: string): StoreIdentity['deliveryPromise'] {
  const clean = sanitizeCmsHtml(raw);
  const copy = toText(firstByClass(clean, STORE_DELIVERY_COPY_CLASS));
  const cutoffText = toText(firstByClass(clean, STORE_DELIVERY_CUTOFF_HOUR_CLASS));
  const cutoffHour = /^\d+$/.test(cutoffText) ? Number(cutoffText) : NaN;
  if (copy === '' || Number.isNaN(cutoffHour)) {
    return EMPTY_DELIVERY_PROMISE;
  }
  return { copy, cutoffHour };
}

/**
 * Compose the canonical `StoreIdentity` from the already-canonical
 * `StoreConfig` (native scalars) and the already-canonical `CmsBlock[]`
 * (admin-authorable content, fetched via the identifiers in
 * `STORE_IDENTITY_CONTENT_IDENTIFIERS`). Pure — no I/O, no adapter/network
 * awareness — so it is directly unit-testable with plain fixtures.
 *
 * THROWS (fail-closed) when `name`, `legalEntity`, `registrationNumber`, or
 * `copyright` is missing/empty — whether because the source was unreachable
 * (the caller passes an empty `StoreConfig`/`blocks` on a transport failure)
 * or because the value itself is absent. Every other field degrades to its
 * documented empty value and never throws.
 */
export function composeStoreIdentity(args: {
  storeConfig: StoreConfig;
  blocks: CmsBlock[];
}): StoreIdentity {
  const { storeConfig, blocks } = args;

  const name = requireLegalField('name', storeConfig.storeName ?? '');
  const copyright = requireLegalField('copyright', storeConfig.copyright ?? '');

  const { legalEntity: rawLegalEntity, registrationNumber: rawRegistrationNumber } =
    parseLegalIdentity(findBlockContent(blocks, STORE_IDENTITY_LEGAL_BLOCK));
  const legalEntity = requireLegalField('legalEntity', rawLegalEntity);
  const registrationNumber = requireLegalField(
    'registrationNumber',
    rawRegistrationNumber,
  );

  return {
    name,
    logo: {
      src: resolveLogoSrc(storeConfig.headerLogoSrc, storeConfig.mediaBaseUrl),
      alt: storeConfig.logoAlt ?? '',
      fallbackText: name,
    },
    tagline: parseTagline(findBlockContent(blocks, STORE_IDENTITY_TAGLINE_BLOCK)),
    registrationNumber,
    legalEntity,
    copyright,
    paymentMethods: parsePaymentMethods(
      findBlockContent(blocks, STORE_FOOTER_PAYMENT_METHODS_BLOCK),
    ),
    footerColumns: parseFooterColumns(
      findBlockContent(blocks, STORE_FOOTER_COLUMNS_BLOCK),
    ),
    deliveryPromise: parseDeliveryPromise(
      findBlockContent(blocks, STORE_DELIVERY_PROMISE_BLOCK),
    ),
  };
}
