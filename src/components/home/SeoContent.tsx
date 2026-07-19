import React from 'react';

import styles from './SeoContent.module.css';

export interface SeoContentProps {
  /** Already-sanitized free-form editorial HTML. */
  html: string;
}

/**
 * A single headline figure shown above the search-optimised copy. These three
 * figures are the store's standing proof points (assortment size, average
 * rating, delivery promise); the surrounding prose is authored editorial.
 */
interface StatCallout {
  value: string;
  label: string;
}

const STAT_CALLOUTS: StatCallout[] = [
  { value: '8.000+', label: 'producten op voorraad' },
  { value: '4,8 ★', label: 'gemiddelde klantbeoordeling' },
  { value: 'Morgen in huis', label: 'bij bestelling voor 22:00' },
];

/**
 * Search-optimised content block: three headline figures over a panel of
 * authored, already-sanitized editorial copy. The copy is the only place the
 * page injects sanitized markup; the figures are static store proof points.
 */
export function SeoContent({ html }: SeoContentProps) {
  const hasCopy = html.trim() !== '';
  if (!hasCopy && STAT_CALLOUTS.length === 0) return null;

  return (
    <section aria-label="Over onze winkel" className={styles.section}>
      <ul className={styles.statGrid}>
        {STAT_CALLOUTS.map((stat) => (
          <li key={stat.value} className={styles.statItem}>
            <strong className={styles.statValue}>{stat.value}</strong>
            <span className={styles.statLabel}>{stat.label}</span>
          </li>
        ))}
      </ul>

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
