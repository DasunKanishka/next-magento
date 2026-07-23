'use client';

import React from 'react';

import type { HeroSlide } from '@/lib/home/editorial';
import { defaultLocale, type SupportedLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import { PagerButton } from '@/components/ui/core/PagerButton';
import styles from './HeroSlider.module.css';

export interface HeroSliderProps {
  slides: HeroSlide[];
  /** Active locale — resolved from `storeConfig` by the caller. */
  locale?: SupportedLocale;
}

/**
 * Rotating hero campaign slider. Shows one panel at a time with dot controls
 * and previous/next buttons; headline type scales fluidly down for small
 * screens. Renders nothing when no panels are authored, and works with any
 * count up to the zone cap. All controls are real, keyboard-operable buttons.
 */
export function HeroSlider({ slides, locale = defaultLocale }: HeroSliderProps) {
  const [active, setActive] = React.useState(0);
  const copy = getChromeCopy(locale);

  if (slides.length === 0) return null;

  const index = Math.min(active, slides.length - 1);
  const slide = slides[index];
  const go = (next: number) => setActive((next + slides.length) % slides.length);

  return (
    <section aria-label={copy.heroSliderLabel} aria-roledescription="carousel">
      <div className={styles.stage}>
        <div className={styles.content}>
          <h2 className={styles.headline}>{slide.title}</h2>
          {slide.body ? <p className={styles.body}>{slide.body}</p> : null}
          {slide.ctaHref && slide.ctaLabel ? (
            <a href={slide.ctaHref} className={styles.cta}>
              {slide.ctaLabel}
            </a>
          ) : null}
        </div>

        {slides.length > 1 ? (
          <>
            <PagerButton
              variant="on-brand"
              direction="prev"
              label={copy.heroSliderPrevLabel}
              onClick={() => go(index - 1)}
            />
            <PagerButton
              variant="on-brand"
              direction="next"
              label={copy.heroSliderNextLabel}
              onClick={() => go(index + 1)}
            />
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div
          role="tablist"
          aria-label={copy.heroSliderTablistLabel}
          className={styles.tablist}
        >
          {slides.map((s, i) => {
            const isActive = i === index;
            const bridge = {
              // 26px active width snapped to --space-6 (24px, -2px); 12px
              // inactive width matches --space-3 exactly.
              '--local-dot-width': isActive ? 'var(--space-6)' : 'var(--space-3)',
              '--local-dot-bg': isActive
                ? 'var(--color-cta)'
                : 'var(--color-border-field)',
            } as React.CSSProperties;
            return (
              <button
                key={s.title || i}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={copy.heroSliderDotLabel(i + 1)}
                onClick={() => setActive(i)}
                className={styles.dot}
                style={bridge}
              >
                <span aria-hidden="true" className={styles.dotPip} />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
