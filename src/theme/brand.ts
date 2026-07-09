/**
 * The set of brand identifiers this deployment knows how to resolve a
 * `TokenSheet` for. V0.1.0 ships exactly one child brand; adding a second
 * means adding both a member here and a matching entry in `./registry`.
 */
export type BrandId = 'default';

/** Every brand id this build supports, in registration order. */
export const SUPPORTED_BRAND_IDS: readonly BrandId[] = ['default'] as const;
