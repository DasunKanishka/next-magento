import React from 'react';

import { Link } from '@/i18n/navigation';
import type { HomeCategory } from '@/lib/home/home-data';
import styles from './CategoryBar.module.css';

export interface CategoryBarProps {
  categories: HomeCategory[];
}

/**
 * "Shop by category" quick-links bar, populated from the store's live category
 * tree. Each entry is a real, locale-aware, keyboard-reachable link. Renders
 * nothing when the tree is empty.
 */
export function CategoryBar({ categories }: CategoryBarProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-label="Shop per categorie">
      <h2 className={styles.heading}>Shop per categorie</h2>
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
