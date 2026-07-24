import React from 'react';

import { defaultLocale } from '@/i18n/locales';
import { getChromeCopy } from '@/i18n/chrome-copy';
import styles from './DeliveryNote.module.css';

export interface DeliveryNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The delivery-promise headline. No default — the store's actual promise is
   * backend-sourced content (`getStoreIdentity().deliveryPromise.copy`), so a
   * caller must supply it explicitly rather than this component fabricating
   * one.
   */
  title: string;
  /** Countdown to the same-day order deadline, e.g. "5h 42m". Omit/null to hide. */
  countdown?: string | null;
  /** Free-shipping threshold line. An illustrative example default, not real store content. */
  threshold?: string;
  /** "Order within {countdown} <suffix>" copy, resolved to the store locale. */
  orderPrefix?: string;
  orderSuffix?: string;
  style?: React.CSSProperties;
}

/** Blue delivery-reassurance block for the buy box (deadline + countdown). */
export function DeliveryNote({
  title,
  countdown = '5h 42m',
  threshold = 'Free from €150',
  orderPrefix = getChromeCopy(defaultLocale).deliveryNoteOrderPrefix,
  orderSuffix = getChromeCopy(defaultLocale).deliveryNoteOrderSuffix,
  style = {},
  ...rest
}: DeliveryNoteProps) {
  return (
    <div className={styles.wrap} style={style} {...rest}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={styles.icon}
      >
        <rect x="1" y="3" width="15" height="13" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.body}>
          {countdown ? (
            <>
              {orderPrefix} <strong>{countdown}</strong> {orderSuffix}{' '}
            </>
          ) : null}
          {threshold}
        </div>
      </div>
    </div>
  );
}
