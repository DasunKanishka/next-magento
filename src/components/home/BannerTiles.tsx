import React from 'react';

import type { BannerTile } from '@/lib/home/editorial';

export interface BannerTilesProps {
  tiles: BannerTile[];
}

/**
 * A row of editorial banner tiles. Each tile is a single large, keyboard-
 * reachable link carrying a heading and supporting copy. Renders whatever tiles
 * are present (up to the zone cap) and nothing at all when the set is empty.
 */
export function BannerTiles({ tiles }: BannerTilesProps) {
  if (tiles.length === 0) return null;

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
        gap: 16,
      }}
    >
      {tiles.map((tile, i) => {
        const inner = (
          <>
            <h3
              style={{
                margin: 0,
                font: '700 18px/1.2 var(--font-brand)',
                color: 'var(--color-brand-ink)',
              }}
            >
              {tile.title}
            </h3>
            {tile.body ? (
              <p
                style={{
                  margin: '8px 0 0',
                  font: '400 14px/1.5 var(--font-brand)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {tile.body}
              </p>
            ) : null}
            {tile.label ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: 12,
                  font: '600 13px/1 var(--font-brand)',
                  color: 'var(--color-trust)',
                }}
              >
                {tile.label} →
              </span>
            ) : null}
          </>
        );

        const cardStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'var(--tap-target-min)',
          height: '100%',
          padding: 20,
          background: 'var(--color-surface)',
          border: 'var(--border-width-default) solid var(--color-border-card)',
          borderRadius: 'var(--radius-lg)',
          textDecoration: 'none',
        };

        return (
          <li key={tile.title || i} style={{ display: 'flex' }}>
            {tile.href ? (
              <a href={tile.href} style={cardStyle}>
                {inner}
              </a>
            ) : (
              <div style={cardStyle}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
