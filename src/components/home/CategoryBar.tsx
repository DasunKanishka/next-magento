import React from 'react';

import { Link } from '@/i18n/navigation';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import type { HomeCategory } from '@/lib/home/home-data';
import styles from './CategoryBar.module.css';

export interface CategoryBarProps {
  categories: HomeCategory[];
  /** Active locale — resolved from `storeConfig` by the caller. */
  locale?: SupportedLocale;
}

/**
 * "Shop by category" quick-links bar, populated from the store's live category
 * tree. Each entry is a real, locale-aware, keyboard-reachable link. Renders
 * nothing when the tree is empty.
 */
export function CategoryBar({ categories, locale = defaultLocale }: CategoryBarProps) {
  if (categories.length === 0) return null;
  const copy = getChromeCopy(locale);

  return (
    <section aria-label={copy.categoryBarLabel}>
      <h2 className={styles.heading}>{copy.categoryBarLabel}</h2>
      <ul className={styles.list}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/${category.urlPath}`} className={styles.link}>
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
