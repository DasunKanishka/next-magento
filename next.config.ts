import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {/* config options here */};

// Wires next-intl's server integration; resolves `src/i18n/request.ts` by
// convention for per-request locale + message-catalog resolution.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
