import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { buildBrandStyleBlock } from '@/theme/css';
import { getActiveBrand, resolveTokens } from '@/theme/resolver';
import './globals.css';

// Self-hosted at build time by next/font (no runtime request to Google) and
// exposed as a CSS variable so the brand contract's `--font-brand` token can
// resolve to it. Weights match the set the brand type-scale uses.
const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Storefront',
  description: 'A fast, accessible online store.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side, at render time (no client JS involved): resolve the
  // deployment's active brand and its full token sheet, then inject the
  // resolved CSS custom-property block directly into the document so every
  // `var(--contract-name)` reference is already defined on first paint —
  // there is no unstyled flash and no client-side theme-application step.
  const activeBrand = getActiveBrand();
  const tokens = resolveTokens(activeBrand);
  const brandStyleBlock = buildBrandStyleBlock(activeBrand, tokens);

  return (
    <html lang="en" data-brand={activeBrand} className={figtree.variable}>
      <head>
        <style id="brand-tokens" dangerouslySetInnerHTML={{ __html: brandStyleBlock }} />
      </head>
      <body data-brand={activeBrand}>{children}</body>
    </html>
  );
}
