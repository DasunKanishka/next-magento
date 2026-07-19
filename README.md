# next-bns — Frontend

Headless, multi-brand storefront framework built on **Next.js 16 (App Router) +
TypeScript**. A neutral parent theme (token contract) is filled by one child
brand per deployment. This repo is the Next.js frontend only — the Magento
backend lives in a separate `backend/` repo.

## Prerequisites

- **Node 24**, **pnpm 10**
- A reachable stock Magento 2 GraphQL endpoint
- If that endpoint uses a self-signed / privately-signed certificate (e.g. a local dev instance), its root CA on disk (see `.env.example` / `NODE_EXTRA_CA_CERTS`)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then adjust values for your machine
pnpm schema:pull             # refresh the committed schema.graphql snapshot
pnpm codegen                 # generate typed GraphQL documents into src/gql/
pnpm dev                     # http://localhost:3000
```

## Environment

Server-only configuration (never `NEXT_PUBLIC_` — the connector is `server-only`,
enforcing a server-only trust boundary where the browser never talks to Magento
directly). See `.env.example` for the full list.

| Var                        | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `MAGENTO_GRAPHQL_ENDPOINT` | Magento `/graphql` URL                           |
| `MAGENTO_STORE_CODE`       | default `Store` header (store view)              |
| `NODE_EXTRA_CA_CERTS`      | trust a self-signed/private CA for local TLS     |
| `MAGENTO_CAT_*`            | optional per-slot curation-category id overrides |

These two vars (`MAGENTO_GRAPHQL_ENDPOINT` / `MAGENTO_STORE_CODE`) repoint the
adapter at any **stock** Magento instance with **no code change** and no custom
backend module. For the full connection + native-content authoring guide (which
store-config fields and CMS blocks to author in the Magento admin, and the
fail-closed behavior), see [`docs/backend-configuration.md`](docs/backend-configuration.md).

**Currency is not configured** — it is resolved from the Magento store **scope**
(Store View → Website → Default), exactly like categories, navigation and CMS
content. The `Store` header selects the scope; the scope's currency is read from
`storeConfig` and threaded back as an explicit `Content-Currency` header on
cached catalog calls, so multi-store responses never cross-contaminate a
shared cache (cache-key correctness).

## Scripts

| Script                         | What it does                                              |
| ------------------------------ | --------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Next.js dev server / production build / serve             |
| `pnpm lint`                    | ESLint (Next core-web-vitals + TS, Prettier-compatible)   |
| `pnpm format` / `format:check` | Prettier write / check                                    |
| `pnpm test`                    | Vitest unit tests (jsdom)                                 |
| `pnpm test:e2e`                | Playwright E2E (390px mobile viewport)                    |
| `pnpm schema:pull`             | Introspect the dev endpoint → `schema.graphql` (dev only) |
| `pnpm codegen`                 | Generate typed documents from the committed snapshot      |
| `pnpm codegen:check`           | Git-free drift check (regenerate to temp + diff)          |
| `pnpm check:imports`           | Enforce the DataSource adapter-import boundary            |

## Architecture — DataSource connector

All backend data access goes through a **backend-agnostic `DataSource`
interface** over a **canonical model** (`CanonicalProduct` / `CanonicalCategory`
/ `StoreConfig` / `CmsBlock`). No page, component, Route Handler, or Server
Action talks to Magento directly.

```
rendering code
    │  imports { getDataSource, canonical types }
    ▼
src/lib/data-source/index.ts        ← resolution module (ONLY importer of the adapter)
    │  resolves to
    ▼
src/lib/data-source/magento/        ← the concrete adapter package (server-only)
    ├── magento-graphql-adapter.ts    implements DataSource
    ├── client.ts                     getMagentoClient() — Store + Content-Currency headers
    ├── operations.ts                 graphql() documents → typed by codegen
    └── mappers.ts                    pure raw → canonical mapping (unit-tested)
    ▼
Magento GraphQL  (typed by @graphql-codegen client-preset against schema.graphql)
```

- **`server-only`**: the adapter, client, and resolution module import the
  `server-only` package — importing them from a Client Component is a build
  error. The browser never sees the endpoint or a token.
- **Typed end-to-end**: `operations.ts` authors queries with `graphql()`;
  codegen emits `TypedDocumentNode`s into `src/gql/` (committed). CI regenerates
  against the committed `schema.graphql` and **fails on drift**.
- **Import boundary**: `pnpm check:imports` (and CI) fail if anything other than
  `src/lib/data-source/index.ts` imports the Magento adapter.
- **Content model**: structured home zones are declared in
  `src/config/content-zones.ts` (a swappable config map, not string literals);
  free-form editorial is fetched via `getEditorialContent` (`cmsBlocks`) and must
  be sanitized before render.

Generated types (`src/gql/`) and `schema.graphql` are **committed** so a clean
checkout builds without network access; CI proves they stay in sync.

## Git Flow

Branching model: **`main` ← `develop` ← `feature/*`**. Feature branches open
PRs into `develop`; after a PR merges, `main` is fast-forwarded to `develop` so
the two stay in sync (`main == develop`). Never commit directly to `main`.
