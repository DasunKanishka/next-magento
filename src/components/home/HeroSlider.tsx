'use client';

import React from 'react';

import type { HeroSlide } from '@/lib/home/editorial';

export interface HeroSliderProps {
  slides: HeroSlide[];
}

/**
 * Rotating hero campaign slider. Shows one panel at a time with dot controls
 * and previous/next buttons; headline type scales fluidly down for small
 * screens. Renders nothing when no panels are authored, and works with any
 * count up to the zone cap. All controls are real, keyboard-operable buttons.
 */
export function HeroSlider({ slides }: HeroSliderProps) {
  const [active, setActive] = React.useState(0);

  if (slides.length === 0) return null;

  const index = Math.min(active, slides.length - 1);
  const slide = slides[index];
  const go = (next: number) => setActive((next + slides.length) % slides.length);

  return (
    <section aria-label="Uitgelichte campagnes" aria-roledescription="carousel">
      <style>{`
        .hero-headline { font-size: clamp(30px, 5vw, 48px); }
      `}</style>
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          background: 'var(--color-brand)',
          color: 'var(--color-text-on-brand)',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 640,
            padding: '48px clamp(20px, 5vw, 56px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h2
            className="hero-headline"
            style={{
              margin: 0,
              fontFamily: 'var(--font-brand)',
              fontWeight:
                'var(--type-display-weight)' as React.CSSProperties['fontWeight'],
              lineHeight: 'var(--type-display-line-height)',
              color: '#fff',
            }}
          >
            {slide.title}
          </h2>
          {slide.body ? (
            <p
              style={{
                margin: 0,
                maxWidth: 520,
                font: '400 16px/1.6 var(--font-brand)',
                color: 'var(--color-text-on-brand)',
              }}
            >
              {slide.body}
            </p>
          ) : null}
          {slide.ctaHref && slide.ctaLabel ? (
            <a
              href={slide.ctaHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                alignSelf: 'flex-start',
                minHeight: 'var(--tap-target-min)',
                padding: '0 22px',
                marginTop: 8,
                background: 'var(--color-cta)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                font: '700 15px/1 var(--font-brand)',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-cta)',
              }}
            >
              {slide.ctaLabel}
            </a>
          ) : null}
        </div>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Vorige campagne"
              onClick={() => go(index - 1)}
              style={arrowStyle('left')}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Volgende campagne"
              onClick={() => go(index + 1)}
              style={arrowStyle('right')}
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div
          role="tablist"
          aria-label="Kies een campagne"
          style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}
        >
          {slides.map((s, i) => (
            <button
              key={s.title || i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Campagne ${i + 1}`}
              onClick={() => setActive(i)}
              style={{
                width: i === index ? 26 : 12,
                height: 12,
                minWidth: 12,
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background:
                  i === index ? 'var(--color-cta)' : 'var(--color-border-field)',
                cursor: 'pointer',
                transition: 'width .2s ease',
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    minWidth: 'var(--tap-target-min)',
    minHeight: 'var(--tap-target-min)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    background: 'var(--color-surface-on-brand)',
    color: '#fff',
    font: '700 20px/1 var(--font-brand)',
    cursor: 'pointer',
  };
}
