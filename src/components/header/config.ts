/**
 * Header data-resolution config.
 *
 * The nav root category and the mega-menu editorial block are both repointable
 * per deployment via env, defaulting to the seeded dev/staging values — the
 * same content-config pattern the merchandising slots use.
 */

/** Root category whose children populate the header nav. Defaults to the seeded catalog root. */
export function resolveNavRootCategoryId(): number {
  const raw = process.env.MAGENTO_ROOT_CATEGORY_ID?.trim();
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

/**
 * Identifier of the CMS block that supplies the mega-menu promo panel + custom
 * links. Authored in the CMS, fetched via the editorial-content path, and
 * sanitized before render. When the block is absent the mega-menu renders its
 * category columns without a promo panel (graceful degradation).
 */
export const MEGA_MENU_PROMO_BLOCK =
  process.env.MAGENTO_MEGA_MENU_BLOCK?.trim() || 'header_mega_menu';
