import type { MerchandisingSlot } from '@/lib/data-source/types';

/**
 * Maps each home merchandising slot to the backend curation category that
 * supplies its products (home merchandising: five dedicated, non-navigable
 * categories used purely as curation containers).
 *
 * The default category IDs match the Luma-seeded curation categories in the
 * V0.1.0 dev/staging backend. Each is overridable per deployment via an env
 * var so a different backend instance can be repointed WITHOUT a code change:
 * these are content-config, distinct from the three connector-repoint vars
 * (`MAGENTO_GRAPHQL_ENDPOINT` / `MAGENTO_STORE_CODE` / `MAGENTO_CURRENCY`).
 */
const SLOT_CATEGORY_ENV: Record<MerchandisingSlot, string> = {
  highlighted: 'MAGENTO_CAT_HIGHLIGHTED',
  weekdeals: 'MAGENTO_CAT_WEEKDEALS',
  'new-in': 'MAGENTO_CAT_NEW_IN',
  featured: 'MAGENTO_CAT_FEATURED',
  'product-of-month': 'MAGENTO_CAT_PRODUCT_OF_MONTH',
};

const SLOT_CATEGORY_DEFAULT: Record<MerchandisingSlot, string> = {
  highlighted: '41',
  weekdeals: '42',
  'new-in': '43',
  featured: '44',
  'product-of-month': '45',
};

/**
 * Resolve the backend curation-category id for a merchandising slot.
 * Reads the slot's env override, falling back to the seeded default.
 */
export function resolveSlotCategoryId(slot: MerchandisingSlot): string {
  const override = process.env[SLOT_CATEGORY_ENV[slot]];
  return override && override.trim() !== ''
    ? override.trim()
    : SLOT_CATEGORY_DEFAULT[slot];
}
