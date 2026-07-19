import React from 'react';

import type { BannerTile } from '@/lib/home/editorial';
import styles from './BannerTiles.module.css';

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
    <ul className={styles.grid}>
      {tiles.map((tile, i) => {
        const inner = (
          <>
            <h3 className={styles.title}>{tile.title}</h3>
            {tile.body ? <p className={styles.body}>{tile.body}</p> : null}
            {tile.label ? <span className={styles.label}>{tile.label} →</span> : null}
          </>
        );

        return (
          <li key={tile.title || i} className={styles.item}>
            {tile.href ? (
              <a href={tile.href} className={styles.card}>
                {inner}
              </a>
            ) : (
              <div className={styles.card}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
