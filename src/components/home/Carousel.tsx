'use client';

import React from 'react';

import styles from './Carousel.module.css';

export interface CarouselProps {
  /** Accessible label for the carousel region. */
  label: string;
  children: React.ReactNode;
  /** Approximate item min-width in px (drives the track column sizing). */
  itemMinWidth?: number;
}

/**
 * Horizontally scrollable product/content track. On touch/mobile it is a native
 * horizontal scroller with the scrollbar visually hidden; on pointer/desktop it
 * additionally offers previous/next paging buttons. Every item keeps its own
 * tab order, so the whole track is reachable by keyboard even without the arrows.
 */
export function Carousel({ label, children, itemMinWidth = 240 }: CarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const page = React.useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.round(track.clientWidth * 0.9),
      behavior: 'smooth',
    });
  }, []);

  // itemMinWidth is a caller-supplied layout parameter (business data), not a
  // design token — it bridges as a plain computed px value, mirroring
  // FreeShippingProgress's --local-fill-width precedent.
  const bridge = {
    '--local-item-min-w': `${itemMinWidth}px`,
  } as React.CSSProperties;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        aria-label="Vorige"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={() => page(-1)}
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className={styles.track}
        role="group"
        aria-label={label}
        tabIndex={0}
        style={bridge}
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Volgende"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={() => page(1)}
      >
        ›
      </button>
    </div>
  );
}
