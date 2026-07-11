import React from 'react';

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
    <section
      aria-label="Over onze winkel"
      style={{
        background: 'var(--color-surface-inset-a)',
        border: 'var(--border-width-default) solid var(--color-border-card)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'clamp(24px, 4vw, 44px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {STAT_CALLOUTS.map((stat) => (
          <li
            key={stat.value}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '16px 20px',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: 'var(--border-width-default) solid var(--color-border-card)',
            }}
          >
            <strong
              style={{
                font: '800 24px/1.1 var(--font-brand)',
                color: 'var(--color-brand)',
              }}
            >
              {stat.value}
            </strong>
            <span
              style={{
                font: '500 13px/1.4 var(--font-brand)',
                color: 'var(--color-text-muted)',
              }}
            >
              {stat.label}
            </span>
          </li>
        ))}
      </ul>

      {hasCopy ? (
        <div
          data-testid="seo-copy"
          className="seo-copy"
          style={{ color: 'var(--color-text-primary)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      <style>{`
        .seo-copy h2 {
          font: 700 22px/1.2 var(--font-brand);
          color: var(--color-brand-ink);
          margin: 0 0 12px;
        }
        .seo-copy p {
          font: 400 15px/1.65 var(--font-brand);
          color: var(--color-text-muted);
          margin: 0 0 12px;
        }
        .seo-copy p:last-child { margin-bottom: 0; }
      `}</style>
    </section>
  );
}
