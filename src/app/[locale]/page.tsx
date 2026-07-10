import { getTranslations, setRequestLocale } from 'next-intl/server';

import { localeResolver } from '@/i18n/locale-resolver';
import { isSupportedLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';
import styles from './page.module.css';
import { LocaleSwitcher } from './LocaleSwitcher';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isSupportedLocale(raw) ? raw : routing.defaultLocale;
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  // Pure, backend-free resolution — every locale resolves to a store view +
  // currency (only `nl` distinct; all others fall back to `default`/EUR).
  const { storeViewCode, currencyCode } = localeResolver.resolve(locale);

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ gap: 24, alignItems: 'flex-start' }}>
        <h1
          style={{ font: '600 30px/1.1 var(--font-brand)', color: 'var(--color-brand)' }}
        >
          {t('title')}
        </h1>
        <p
          style={{
            font: '400 15px/1.6 var(--font-brand)',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('intro')}
        </p>

        <LocaleSwitcher locale={locale} />

        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: '4px 16px',
            font: '500 14px/1.4 var(--font-brand)',
            color: 'var(--color-text-primary)',
          }}
        >
          <dt style={{ color: 'var(--color-text-muted)' }}>{t('storeLabel')}</dt>
          <dd data-testid="resolved-store" style={{ margin: 0, fontWeight: 700 }}>
            {storeViewCode}
          </dd>
          <dt style={{ color: 'var(--color-text-muted)' }}>{t('currencyLabel')}</dt>
          <dd data-testid="resolved-currency" style={{ margin: 0, fontWeight: 700 }}>
            {currencyCode}
          </dd>
          <dt style={{ color: 'var(--color-text-muted)' }}>Locale</dt>
          <dd data-testid="active-locale" style={{ margin: 0, fontWeight: 700 }}>
            {locale}
          </dd>
        </dl>
      </main>
    </div>
  );
}
