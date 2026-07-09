import { graphql } from '@/gql';

/**
 * Magento GraphQL operations, authored as `graphql()` template documents so
 * `@graphql-codegen`'s client-preset generates a `TypedDocumentNode` for each
 * against the committed `schema.graphql` snapshot.
 *
 * Schema-shape note: Magento's `FilterEqualTypeInput.eq` is a `String`, so the
 * category-id filter variables below are typed `String!` (verified against the
 * live schema). The public `DataSource` method args stay `rootCategoryId:
 * number`; the adapter stringifies them before binding.
 */

/** Store config — drives `StoreConfig` + the cache-key headers + home-page id. */
export const StoreConfigDocument = graphql(`
  query StoreConfig {
    storeConfig {
      store_code
      locale
      base_currency_code
      secure_base_media_url
      cms_home_page
    }
  }
`);

/** Navigation categories (header nav, mega-menu, "Shop per categorie" bar). */
export const NavigationCategoriesDocument = graphql(`
  query NavigationCategories($rootCategoryId: String!) {
    categoryList(filters: { parent_id: { eq: $rootCategoryId } }) {
      id
      name
      url_path
      image
      children {
        id
        name
        url_path
      }
    }
  }
`);

/** Field set consumed by every home merchandising slot (`HomeProductFields`). */
export const HomeProductFieldsFragment = graphql(`
  fragment HomeProductFields on ProductInterface {
    sku
    name
    url_key
    small_image {
      url
      label
    }
    price_range {
      minimum_price {
        regular_price {
          value
          currency
        }
        final_price {
          value
          currency
        }
      }
    }
    rating_summary
    review_count
    stock_status
  }
`);

/**
 * Products for one merchandising slot. The original five-alias
 * `HomeMerchandising` query is decomposed into this per-slot form so it maps
 * 1:1 onto `DataSource.getProductsByMerchandisingSlot`, which takes a single
 * slot + limit.
 */
export const MerchandisingProductsDocument = graphql(`
  query MerchandisingProducts($categoryId: String!, $pageSize: Int!) {
    products(filter: { category_id: { eq: $categoryId } }, pageSize: $pageSize) {
      items {
        ...HomeProductFields
      }
    }
  }
`);

/** Editorial CMS blocks fetched by stable identifier (sanitized before render). */
export const EditorialBlocksDocument = graphql(`
  query EditorialBlocks($identifiers: [String]!) {
    cmsBlocks(identifiers: $identifiers) {
      items {
        identifier
        title
        content
      }
    }
  }
`);
