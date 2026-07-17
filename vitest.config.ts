import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The `server-only` marker package throws on import outside a
      // React-Server build (it has no `react-server` export condition active
      // under Vitest). Alias it to its own no-op entry so server-only modules
      // (the connector, the BFF route) are importable in tests. This does not
      // weaken the boundary — the real build still resolves the throwing entry
      // in any client bundle, and the adapter-import check stays enforced.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    // Needed for CSS Modules `composes: ... from '<file>'` (cross-file
    // composition, e.g. the shared panel-surface class) to actually merge
    // into the consuming module's exported class string. Left off, Vitest's
    // default CSS handling still hashes each module's own classes correctly
    // but skips the full composition pass, so a composed class silently goes
    // missing only in tests — the real Next.js build always resolves it.
    css: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Playwright specs live under e2e/ and are run by `pnpm test:e2e`.
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
  },
});
