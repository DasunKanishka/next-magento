import type { TokenSheet } from './contract';
import type { BrandId } from './brand';
import { SUPPORTED_BRAND_IDS } from './brand';
import { BRAND_TOKEN_SHEETS } from './registry';

function isSupportedBrandId(value: string): value is BrandId {
  return (SUPPORTED_BRAND_IDS as readonly string[]).includes(value);
}

function resolveActiveBrandFromEnv(): BrandId {
  const raw = process.env.NEXT_BRAND ?? 'default';

  if (!isSupportedBrandId(raw)) {
    throw new Error(
      `Fail-closed brand resolution: NEXT_BRAND="${raw}" is not a recognized brand id ` +
        `(supported: ${SUPPORTED_BRAND_IDS.join(', ')}). Refusing to serve any request with an ` +
        'unstyled or partially-styled theme — set NEXT_BRAND to a supported id, or unset it to use the default.',
    );
  }

  return raw;
}

// Resolved and validated at module-evaluation time — the very first import
// of this module runs this line. An unknown/invalid NEXT_BRAND value throws
// here, before any route handler or React render has a chance to run, which
// is what makes this fail-closed rather than a lazy per-request check with a
// silent unstyled fallback.
const ACTIVE_BRAND: BrandId = resolveActiveBrandFromEnv();

/** Returns the brand this deployment is running as (resolved once, at startup). */
export function getActiveBrand(): BrandId {
  return ACTIVE_BRAND;
}

/** Resolves a brand id to its complete `TokenSheet`. Every contract key is present. */
export function resolveTokens(brandId: BrandId): TokenSheet {
  const sheet = BRAND_TOKEN_SHEETS[brandId];

  if (!sheet) {
    throw new Error(
      `Fail-closed brand resolution: no TokenSheet registered for brand id "${brandId}".`,
    );
  }

  return sheet;
}

export type { BrandId, TokenSheet };
