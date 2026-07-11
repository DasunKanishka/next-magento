import 'server-only';

import { getDataSource } from '@/lib/data-source';
import { resolveStoreContext } from '@/lib/data-source/store-context';
import { allSlotCategoryIds } from '@/config/merchandising-slots';
import { sanitizeCmsHtml } from '@/lib/sanitize/cms-html';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { HeaderShell } from './HeaderShell';
import { MEGA_MENU_PROMO_BLOCK, resolveNavRootCategoryId } from './config';
import type { NavCategory } from './types';

export interface HeaderProps {
  locale?: SupportedLocale;
}

/**
 * Server entry point for the site header. Resolves the live category tree and
 * the mega-menu editorial block through the DataSource connector, sanitizes the
 * CMS HTML server-side, then hands plain data to the interactive client shell.
 *
 * The merchandising curation categories are content containers, not shopping
 * categories, so they are filtered out of the nav. The mega-menu promo block is
 * fetched defensively: a missing block is expected (it is optional editorial),
 * so its absence degrades to a category-only mega-menu rather than an error.
 */
export async function Header({ locale = defaultLocale }: HeaderProps) {
  const dataSource = getDataSource();
  const { storeCode, currency } = await resolveStoreContext();

  const rawCategories = await dataSource.getNavigationCategories({
    storeCode,
    currency,
    rootCategoryId: resolveNavRootCategoryId(),
  });

  const slotIds = allSlotCategoryIds();
  const categories: NavCategory[] = rawCategories
    .filter((c) => !slotIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      urlPath: c.urlPath,
      children: c.children.map((child) => ({
        id: child.id,
        name: child.name,
        urlPath: child.urlPath,
      })),
    }));

  let megaPromoHtml = '';
  try {
    const blocks = await dataSource.getEditorialContent({
      storeCode,
      identifiers: [MEGA_MENU_PROMO_BLOCK],
    });
    megaPromoHtml = sanitizeCmsHtml(blocks[0]?.content ?? '');
  } catch {
    // Optional editorial: absent/misconfigured block → no promo bar.
    megaPromoHtml = '';
  }

  return (
    <HeaderShell locale={locale} categories={categories} megaPromoHtml={megaPromoHtml} />
  );
}
