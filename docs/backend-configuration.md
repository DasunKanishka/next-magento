# Backend configuration & content authoring

This storefront is a **headless frontend that connects to any stock Magento 2
backend** through Magento's **native GraphQL API**. It requires **no custom
Magento module, plugin, theme, or data patch** — point it at an existing stock
Magento 2 instance and author your content in the standard Magento admin.

Nothing brand-specific is baked into this frontend. Every piece of storefront
identity and copy is read at request time from the connected backend, so the
same codebase serves any store by changing configuration and backend content
alone.

## 1. Connect the storefront to a Magento backend

The connector is repointed at any Magento instance by **two environment
variables** — no code change:

| Variable                   | Purpose                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MAGENTO_GRAPHQL_ENDPOINT` | The backend's `/graphql` URL (server-only).                                                                                                                                   |
| `MAGENTO_STORE_CODE`       | The store-view code sent as the `Store` header (selects the store scope).                                                                                                     |
| `NODE_EXTRA_CA_CERTS`      | _(optional)_ Path to a root CA `.pem`, only when the endpoint uses a self-signed / privately-signed certificate (e.g. a local dev instance). Omit for publicly-trusted certs. |

Copy `.env.example` to `.env.local` (gitignored) and fill in your values:

```bash
cp .env.example .env.local
# edit .env.local:
#   MAGENTO_GRAPHQL_ENDPOINT=https://your-magento-host.example/graphql
#   MAGENTO_STORE_CODE=default
```

Notes:

- **Server-only trust boundary.** Never prefix a Magento value with
  `NEXT_PUBLIC_`. The connector runs server-side only; the browser must never
  see the endpoint, headers, or any token.
- **Currency is not configured here.** It is resolved from the Magento store
  scope (Store View → Website → Default) via `storeConfig`, exactly like
  categories, navigation, and CMS content.
- **Multi-store.** Serve a different store view by changing `MAGENTO_STORE_CODE`
  (or threading a per-request store code); the backend returns that scope's
  data.

Verify the connection with the same native query the storefront uses:

```bash
curl -s "$MAGENTO_GRAPHQL_ENDPOINT" \
  -H 'Content-Type: application/json' \
  -H "Store: $MAGENTO_STORE_CODE" \
  -d '{"query":"{ storeConfig { store_name base_currency_code } }"}'
```

## 2. Author the storefront content (native Magento only)

The storefront reads its identity from two **native** Magento sources: native
**store configuration** fields and native **CMS blocks** addressed by
identifier. Create these in the stock admin — no extension needed. The machine
contract for these identifiers and shapes lives in
`src/config/store-identity-content.ts`; this section is its human companion.

### 2a. Native store configuration

| Field (GraphQL `storeConfig`) | Admin location                                                             | Notes                                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store_name`                  | Stores → All Stores → _(your store view)_ → **Name**                       | Store/brand wordmark. **Required** (see fail-closed below). This is the store-view name; if the storefront reports it empty on your Magento version, also set Stores → Configuration → General → General → Store Information → **Store Name**. |
| `copyright`                   | Content → Design → Configuration → _(scope)_ → Footer → **Copyright**      | Copyright holder text (e.g. the legal entity). **Required.** The `©` glyph and current year are rendered by the storefront; author only the holder text.                                                                                       |
| `header_logo_src`             | Content → Design → Configuration → _(scope)_ → Header → **Logo Image**     | Upload a logo to show an image wordmark. **Leave empty** to render the store name as a text wordmark instead — both are fully supported.                                                                                                       |
| `logo_alt`                    | Content → Design → Configuration → _(scope)_ → Header → **Logo Image Alt** | Alt text used only when a logo image is set.                                                                                                                                                                                                   |

The logo image URL is resolved to an absolute URL against the store's media
base automatically — upload the image and nothing else is required.

### 2b. Native CMS blocks

Create each block under **Content → Elements → Blocks** with the exact
`Identifier` below, set it **Enabled**, and assign it to the relevant store
view(s). The frontend sanitizes all block HTML (allow-list) before reading it —
author content, not scripts.

| Block identifier               | Provides                       | Expected content shape                                                                                                                                                |
| ------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store_identity_legal`         | Registration number (e.g. KvK) | One element with `class="registration-number"`. **Required.** (The legal-entity / copyright-holder name is the native `copyright` config above, not this block.)      |
| `store_identity_tagline`       | Brand tagline                  | The block's plain text is the tagline.                                                                                                                                |
| `store_footer_payment_methods` | Accepted payment methods       | A `<li>` per method name.                                                                                                                                             |
| `store_footer_columns`         | Footer link columns            | One `<div class="footer-column">` per column, each with a heading (`<h2>`–`<h6>`) and a list of `<a href="…">` links. Do **not** nest a `<div>` inside a column.      |
| `store_delivery_promise`       | Delivery promise               | One element with `class="delivery-copy"` (the message) and one with `class="delivery-cutoff-hour"` (an integer 0–23). Both must be present or the promise is omitted. |

Example block contents (replace the placeholder text with your own):

`store_identity_legal`

```html
<span class="registration-number">Reg. 00000000</span>
```

`store_identity_tagline`

```html
<p>Your short brand tagline goes here.</p>
```

`store_footer_payment_methods`

```html
<ul>
  <li>iDEAL</li>
  <li>Visa</li>
  <li>Mastercard</li>
</ul>
```

`store_footer_columns`

```html
<div class="footer-column">
  <h2>Shop</h2>
  <ul>
    <li><a href="/category-a">Category A</a></li>
    <li><a href="/category-b">Category B</a></li>
  </ul>
</div>
<div class="footer-column">
  <h2>Customer service</h2>
  <ul>
    <li><a href="/contact">Contact</a></li>
    <li><a href="/faq">FAQ</a></li>
  </ul>
</div>
```

`store_delivery_promise`

```html
<p class="delivery-copy">Order before 22:00, delivered tomorrow</p>
<p class="delivery-cutoff-hour">22</p>
```

## 3. Missing-content behavior

| Field                                           | When unauthored / unreachable                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `store_name`, `copyright`, `registrationNumber` | **Fail-closed** — the storefront throws rather than render a blank or wrong legal identity. Author these before serving traffic. |
| Logo image (`header_logo_src`)                  | Falls back to the store name as a text wordmark.                                                                                 |
| Tagline                                         | Renders empty.                                                                                                                   |
| Payment methods / footer columns                | Render as an empty list.                                                                                                         |
| Delivery promise                                | Omitted unless both the copy and a valid integer cut-off hour are present.                                                       |

The four legal/identity fields are fail-closed on purpose: there is no hardcoded
fallback for a legal fact anywhere in this codebase, so a misconfigured backend
can never present an incorrect company identity.

## 4. Propagating content updates

Content is cached (under the `store-identity` cache tag) and served fast. Two
mechanisms bound how long an admin edit takes to surface — one requires no
setup at all, the other is optional and immediate:

- **Time-based safety window (baseline, zero setup).** The cache entry
  refreshes on its own within **1 hour**. This applies with nothing configured
  — it is the worst-case staleness bound if no trigger below is ever wired up.
- **On-demand revalidation (optional, immediate).** `POST /api/revalidate`
  invalidates the `store-identity` cache tag on demand, so the next request
  re-fetches fresh content immediately instead of waiting out the window.
  Nothing on the Magento side needs to call this — it's entirely
  operator-configured. Wire ANY trigger you like at it: a cron job on a
  schedule shorter than 1h, a manual/CI call after a content deploy, or (only
  if your Magento platform happens to support outbound webhooks) a webhook
  from the admin save action. None of these is required; the storefront ships
  and works correctly with the safety window alone.

  **Request**

  ```
  POST /api/revalidate
  Header: x-revalidate-secret: <REVALIDATE_SECRET>
  Body (JSON, optional):
    { "tag": "store-identity", "storeCode": "default" }
  ```

  - `tag` defaults to `store-identity` (currently the only allow-listed tag —
    any other value is rejected).
  - `storeCode` is optional bookkeeping for the caller; it does not change
    which cache entries are invalidated (the tag is global across stores).
  - Set the `REVALIDATE_SECRET` env var (server-only — never `NEXT_PUBLIC_`)
    to a long random value and send the same value in the header. Missing or
    wrong secret, or an unset `REVALIDATE_SECRET` on the server, → `401` and
    nothing is invalidated. A malformed body or disallowed `tag` → `400`. Any
    method other than `POST` → `405`.
  - The call is safe to repeat (idempotent) — a scheduler or CI step can call
    it liberally without needing to track whether a previous call landed.
