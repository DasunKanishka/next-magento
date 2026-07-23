import React from 'react';

import type { StatCallout } from '@/lib/home/editorial';
import styles from './SeoContent.module.css';

export interface SeoContentProps {
  /** Already-sanitized free-form editorial HTML. */
  html: string;
  /**
   * Headline proof-point figures shown above the copy (e.g. assortment size,
   * average rating, delivery promise) — admin-authored via the
   * `home_stat_callouts` CMS block (see `content-zones.ts`), never a
   * hardcoded/fallback set. Renders none when unauthored.
   */
  stats: StatCallout[];
}

/**
 * Search-optimised content block: headline figures over a panel of authored,
 * already-sanitized editorial copy. Both the figures AND the copy are
 * backend-sourced; renders nothing at all when neither is authored, and
 * whatever subset is present otherwise.
 */
export function SeoContent({ html, stats }: SeoContentProps) {
  const hasCopy = html.trim() !== '';
  if (!hasCopy && stats.length === 0) return null;

  return (
    <section aria-label="Over onze winkel" className={styles.section}>
      {stats.length > 0 ? (
        <ul className={styles.statGrid}>
          {stats.map((stat, i) => (
            <li key={stat.label || i} className={styles.statItem}>
              <strong className={styles.statValue}>{stat.value}</strong>
              {stat.label ? <span className={styles.statLabel}>{stat.label}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {hasCopy ? (
        <div
          data-testid="seo-copy"
          className={styles.copy}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </section>
  );
}
