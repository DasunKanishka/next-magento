import 'server-only';
import { GraphQLClient } from 'graphql-request';

/**
 * Server-only Magento GraphQL client factory.
 *
 * `import 'server-only'` makes any accidental import of this module from a
 * Client Component a build-time error — enforcing the server-only trust
 * boundary: the browser never talks to Magento and never holds a token.
 *
 * The connector is repointed at any Magento instance by two env vars ALONE,
 * with no code change:
 *   - MAGENTO_GRAPHQL_ENDPOINT  the /graphql URL
 *   - MAGENTO_STORE_CODE        default `Store` header (store view)
 *
 * Currency is NOT an env var. Like categories, navigation and CMS content, it
 * is resolved from the Magento store SCOPE (Store View → Website → Default):
 * the `Store` header selects the scope and Magento returns that scope's data.
 * The scope's currency is read from `storeConfig` and threaded back as an
 * EXPLICIT `Content-Currency` header on cached catalog calls for cache-key
 * correctness — never pinned in code or env: currency follows the Magento
 * scope, it is not configured.
 */

export interface MagentoClientArgs {
  /** Store-view code → `Store` header. Falls back to MAGENTO_STORE_CODE. */
  storeCode?: string;
  /**
   * Currency code → `Content-Currency` header. Resolved from the store scope
   * (`storeConfig`) by the caller, not pinned. Omit to let Magento serve the
   * store view's own default display currency.
   */
  currency?: string;
  /** Customer bearer token (server-held only). Omitted for anonymous reads. */
  customerToken?: string;
}

function requireEndpoint(): string {
  const endpoint = process.env.MAGENTO_GRAPHQL_ENDPOINT;
  if (!endpoint || endpoint.trim() === '') {
    throw new Error(
      'MAGENTO_GRAPHQL_ENDPOINT is not set. The Magento connector cannot be ' +
        'constructed without an endpoint. Set it in .env.local (see .env.example).',
    );
  }
  return endpoint;
}

/**
 * Build a `GraphQLClient` bound to the configured Magento endpoint with the
 * cache-key-relevant `Store` and `Content-Currency` headers set explicitly.
 */
export function getMagentoClient(args: MagentoClientArgs = {}): GraphQLClient {
  const endpoint = requireEndpoint();
  const storeCode = args.storeCode ?? process.env.MAGENTO_STORE_CODE ?? 'default';

  // `Store` scopes the entire response (currency, catalog, CMS) to a store view.
  const headers: Record<string, string> = { Store: storeCode };

  // Content-Currency is never pinned from env/code — the caller resolves it from
  // the store scope (storeConfig) and passes it explicitly for cache-key
  // correctness. Omitted → Magento serves the store view's own default
  // display currency, which is still scope-driven.
  if (args.currency) {
    headers['Content-Currency'] = args.currency;
  }
  if (args.customerToken) {
    headers.Authorization = `Bearer ${args.customerToken}`;
  }

  return new GraphQLClient(endpoint, { headers });
}
