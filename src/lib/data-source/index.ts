import 'server-only';

import { magentoGraphQLAdapter } from './magento/magento-graphql-adapter';
import type { DataSource } from './types';

/**
 * DataSource resolution module — the SINGLE place allowed to import a concrete
 * backend adapter (architectural rule: all backend access goes through the
 * DataSource interface; only this resolution module imports a concrete
 * adapter).
 *
 * Every page, component, Route Handler and Server Action imports `getDataSource`
 * (or the canonical types) from here — never `./magento/*` directly. The
 * adapter-import restriction check fails the build if any other module imports
 * `magento-graphql-adapter`.
 *
 * V0.1.0 resolves to the one shipped adapter (Magento GraphQL). When a second
 * adapter (REST, or a second GraphQL backend) exists, the selection logic lives
 * here alone — callers are untouched because they only ever see `DataSource`.
 */
export function getDataSource(): DataSource {
  return magentoGraphQLAdapter;
}

// Re-export the canonical model + interface so rendering code has a single
// import surface for everything DataSource-related.
export type {
  CanonicalCategory,
  CanonicalProduct,
  CmsBlock,
  DataSource,
  MerchandisingSlot,
  Money,
  StoreConfig,
} from './types';
