import type { ReactNode } from 'react';

/**
 * Shared tone system for feedback surfaces (Alert banners, Toast pills).
 * Both components render the same three SVG glyph shapes and derive their
 * per-tone colors from the same cta/trust/urgency semantic families; this
 * module is the single place those live so neither component duplicates them.
 * Internal to the feedback components — not exported from the public barrel.
 */

export type FeedbackTone = 'success' | 'info' | 'error';

/**
 * Byte-identical SVG glyph shapes for the three live tones. Each consumer
 * wraps these in its own `<svg>` (own size/stroke-width), so only the inner
 * shape markup lives here.
 */
export const FEEDBACK_TONE_ICONS: Record<FeedbackTone, ReactNode> = {
  success: <polyline points="20 6 9 17 4 12" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </>
  ),
};

export interface FeedbackToneFamily {
  /** Tinted fill — Alert's `bg`, Toast's `tint`. */
  tint: string;
  /** Tinted border — Alert-only; Toast's pill border is a static token, not per-tone. */
  border: string;
  /** Full-strength accent — shared by both consumers. */
  accent: string;
}

/**
 * Shared cta/trust/urgency tone → color-family tokens, common to Alert and
 * Toast. Every value is a `var(--token)` reference, so each tone stays
 * brand-overridable. Each consumer projects only the fields it needs:
 *  - Toast's two-field `{tint, accent}` map reads `tint`/`accent` directly.
 *  - Alert's five-field map reuses `tint`/`border`/`accent` from here and adds
 *    its own per-tone `title`/`body` ink tokens (Alert-only — no Toast
 *    equivalent exists, so they are declared locally in Alert.tsx).
 * `warning` is intentionally absent — reserved headroom, no warning surface
 * exists yet.
 */
export const FEEDBACK_TONE_FAMILIES: Record<FeedbackTone, FeedbackToneFamily> = {
  success: {
    tint: 'var(--color-cta-tint)',
    border: 'var(--color-cta-tint-border)',
    accent: 'var(--color-cta)',
  },
  info: {
    tint: 'var(--color-trust-tint)',
    border: 'var(--color-trust-tint-border)',
    accent: 'var(--color-trust)',
  },
  error: {
    tint: 'var(--color-urgency-tint)',
    border: 'var(--color-urgency-tint-border)',
    accent: 'var(--color-urgency)',
  },
};
