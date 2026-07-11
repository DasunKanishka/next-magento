'use client';

import React from 'react';

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
  // A per-instance, CSS-safe class prefix so each track's scoped rules stay
  // isolated (`useId` output contains colons, which are invalid in selectors).
  const cls = `carousel${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const page = React.useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * Math.round(track.clientWidth * 0.9),
      behavior: 'smooth',
    });
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .${cls}-track {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(${itemMinWidth}px, 1fr);
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .${cls}-track::-webkit-scrollbar { display: none; }
        .${cls}-track > * { scroll-snap-align: start; }
        .${cls}-arrow { display: none; }
        @media (min-width: 901px) {
          .${cls}-track { grid-auto-columns: minmax(${itemMinWidth}px, 1fr); }
          .${cls}-arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 44px;
            height: 44px;
            z-index: 3;
          }
          .${cls}-arrow-prev { left: -8px; }
          .${cls}-arrow-next { right: -8px; }
        }
      `}</style>

      <button
        type="button"
        aria-label="Vorige"
        className={`${cls}-arrow ${cls}-arrow-prev`}
        onClick={() => page(-1)}
        style={{
          minWidth: 'var(--tap-target-min)',
          minHeight: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          border: 'var(--border-width-default) solid var(--color-border-card)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          font: '700 18px/1 var(--font-brand)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        ‹
      </button>

      <div
        ref={trackRef}
        className={`${cls}-track`}
        role="group"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Volgende"
        className={`${cls}-arrow ${cls}-arrow-next`}
        onClick={() => page(1)}
        style={{
          minWidth: 'var(--tap-target-min)',
          minHeight: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          border: 'var(--border-width-default) solid var(--color-border-card)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          font: '700 18px/1 var(--font-brand)',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer',
        }}
      >
        ›
      </button>
    </div>
  );
}
