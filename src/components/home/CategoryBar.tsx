import React from 'react';

import { Link } from '@/i18n/navigation';
import type { HomeCategory } from '@/lib/home/home-data';

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
      <h2
        style={{
          margin: '0 0 16px',
          font: '700 22px/1.1 var(--font-brand)',
          color: 'var(--color-brand-ink)',
        }}
      >
        Shop per categorie
      </h2>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/${category.urlPath}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 'var(--tap-target-min)',
                padding: '0 18px',
                background: 'var(--color-surface-inset-b)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-full)',
                font: '600 14px/1 var(--font-brand)',
                textDecoration: 'none',
              }}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
