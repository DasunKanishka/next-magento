import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Enables the `"use cache"` directive so the home page's editorial +
  // navigation shell can be cached and tagged for on-demand revalidation,
  // while each merchandising band still reads fresh price/stock per request.
  experimental: {
    useCache: true,
  },
};

// Wires next-intl's server integration; resolves `src/i18n/request.ts` by
// convention for per-request locale + message-catalog resolution.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
