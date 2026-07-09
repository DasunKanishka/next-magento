import type { TokenSheet } from './contract';
import type { BrandId } from './brand';
import { defaultTokens } from './brands/default';

/** Maps every supported brand id to its complete `TokenSheet`. */
export const BRAND_TOKEN_SHEETS: Record<BrandId, TokenSheet> = {
  default: defaultTokens,
};
