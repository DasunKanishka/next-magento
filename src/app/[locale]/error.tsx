'use client';

import React from 'react';

import { Alert, Button } from '@/components/ui';
import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './error.module.css';

export interface LocaleErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Segment error boundary for the locale route tree (the Home page and every
 * server read below it — most notably `getStoreIdentity()`'s fail-closed
 * throw when a legal/identity field is unsourceable). Next.js renders this IN
 * PLACE OF the page content on a thrown render error, so the storefront
 * either renders in full (header, footer, and every legal-copy line intact)
 * or not at all — never a partial page with a missing/empty legal line.
 */
export default function LocaleError({ error, reset }: LocaleErrorProps) {
  React.useEffect(() => {
    // Server-side render errors are logged here so they are observable
    // without exposing any error detail to the rendered page itself.
    console.error(error);
  }, [error]);

  // Next.js's segment error-boundary file convention fixes this component's
  // props to exactly `{ error, reset }` — it cannot receive a `locale` prop
  // from its parent layout/page. `defaultLocale` is store-scope-resolved
  // (see `src/i18n/locales.ts`), so this reads the same resolved locale every
  // other server boundary does; it is not an independent hardcoded-language
  // decision.
  const copy = getChromeCopy(defaultLocale);

  return (
    <div className={styles.wrap}>
      <Alert tone="error" title={copy.errorTitle}>
        {copy.errorBody}
      </Alert>
      <div className={styles.actions}>
        <Button variant="primary" onClick={reset}>
          {copy.errorRetry}
        </Button>
      </div>
    </div>
  );
}
