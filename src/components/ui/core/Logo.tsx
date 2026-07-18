import React from 'react';

import { Link } from '@/i18n/navigation';
import type { StoreIdentityLogo } from '@/lib/data-source';
import styles from './Logo.module.css';

export interface LogoProps {
  /**
   * Resolved logo (`StoreIdentity.logo`). `src` is already an absolute media
   * URL — this component does NO media-base resolution and hardcodes no
   * host. `fallbackText` is the store name, used for both the text wordmark
   * and the home-link accessible name.
   */
  logo: StoreIdentityLogo;
  /**
   * Consumer-owned class applied to the home link, carrying each slot's
   * existing wordmark styling (`HeaderShell.module.css`'s `.logo` or
   * `Footer.module.css`'s `.wordmark`) — the shared component owns none of
   * that layout, only the image-vs-text decision.
   */
  className: string;
}

/**
 * Shared home-link logo, used by both Header and Footer. Renders the
 * Magento-configured logo IMAGE when `logo.src` is present, else falls back
 * to the text wordmark (`logo.fallbackText`) — exactly the markup both
 * consumers rendered before this component existed. The accessible name of
 * the home link is `logo.alt` on the image path and the wordmark text on the
 * fallback path; either way the link itself carries the
 * `"{name} — naar de homepagina"` aria-label.
 */
export function Logo({ logo, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${logo.fallbackText} — naar de homepagina`}
      className={className}
    >
      {logo.src ? (
        // Matches the codebase's existing plain-<img> convention (see
        // AgeGate's flag icons); next/image needs a configured remote host,
        // which a per-store admin-authored media URL cannot provide statically.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.src} alt={logo.alt} className={styles.image} />
      ) : (
        logo.fallbackText
      )}
    </Link>
  );
}
