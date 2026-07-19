/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query StoreConfig {\n    storeConfig {\n      store_code\n      locale\n      base_currency_code\n      secure_base_media_url\n      cms_home_page\n      header_logo_src\n      logo_alt\n      copyright\n      store_name\n    }\n  }\n": typeof types.StoreConfigDocument,
    "\n  query NavigationCategories($rootCategoryId: String!) {\n    categoryList(filters: { parent_id: { eq: $rootCategoryId } }) {\n      id\n      name\n      url_path\n      image\n      children {\n        id\n        name\n        url_path\n      }\n    }\n  }\n": typeof types.NavigationCategoriesDocument,
    "\n  fragment HomeProductFields on ProductInterface {\n    sku\n    name\n    url_key\n    small_image {\n      url\n      label\n    }\n    price_range {\n      minimum_price {\n        regular_price {\n          value\n          currency\n        }\n        final_price {\n          value\n          currency\n        }\n      }\n    }\n    rating_summary\n    review_count\n    stock_status\n  }\n": typeof types.HomeProductFieldsFragmentDoc,
    "\n  query MerchandisingProducts($categoryId: String!, $pageSize: Int!) {\n    products(filter: { category_id: { eq: $categoryId } }, pageSize: $pageSize) {\n      items {\n        ...HomeProductFields\n      }\n    }\n  }\n": typeof types.MerchandisingProductsDocument,
    "\n  query EditorialBlocks($identifiers: [String]!) {\n    cmsBlocks(identifiers: $identifiers) {\n      items {\n        identifier\n        title\n        content\n      }\n    }\n  }\n": typeof types.EditorialBlocksDocument,
    "\n  mutation SubscribeNewsletter($email: String!) {\n    subscribeEmailToNewsletter(email: $email) {\n      status\n    }\n  }\n": typeof types.SubscribeNewsletterDocument,
};
const documents: Documents = {
    "\n  query StoreConfig {\n    storeConfig {\n      store_code\n      locale\n      base_currency_code\n      secure_base_media_url\n      cms_home_page\n      header_logo_src\n      logo_alt\n      copyright\n      store_name\n    }\n  }\n": types.StoreConfigDocument,
    "\n  query NavigationCategories($rootCategoryId: String!) {\n    categoryList(filters: { parent_id: { eq: $rootCategoryId } }) {\n      id\n      name\n      url_path\n      image\n      children {\n        id\n        name\n        url_path\n      }\n    }\n  }\n": types.NavigationCategoriesDocument,
    "\n  fragment HomeProductFields on ProductInterface {\n    sku\n    name\n    url_key\n    small_image {\n      url\n      label\n    }\n    price_range {\n      minimum_price {\n        regular_price {\n          value\n          currency\n        }\n        final_price {\n          value\n          currency\n        }\n      }\n    }\n    rating_summary\n    review_count\n    stock_status\n  }\n": types.HomeProductFieldsFragmentDoc,
    "\n  query MerchandisingProducts($categoryId: String!, $pageSize: Int!) {\n    products(filter: { category_id: { eq: $categoryId } }, pageSize: $pageSize) {\n      items {\n        ...HomeProductFields\n      }\n    }\n  }\n": types.MerchandisingProductsDocument,
    "\n  query EditorialBlocks($identifiers: [String]!) {\n    cmsBlocks(identifiers: $identifiers) {\n      items {\n        identifier\n        title\n        content\n      }\n    }\n  }\n": types.EditorialBlocksDocument,
    "\n  mutation SubscribeNewsletter($email: String!) {\n    subscribeEmailToNewsletter(email: $email) {\n      status\n    }\n  }\n": types.SubscribeNewsletterDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query StoreConfig {\n    storeConfig {\n      store_code\n      locale\n      base_currency_code\n      secure_base_media_url\n      cms_home_page\n      header_logo_src\n      logo_alt\n      copyright\n      store_name\n    }\n  }\n"): (typeof documents)["\n  query StoreConfig {\n    storeConfig {\n      store_code\n      locale\n      base_currency_code\n      secure_base_media_url\n      cms_home_page\n      header_logo_src\n      logo_alt\n      copyright\n      store_name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NavigationCategories($rootCategoryId: String!) {\n    categoryList(filters: { parent_id: { eq: $rootCategoryId } }) {\n      id\n      name\n      url_path\n      image\n      children {\n        id\n        name\n        url_path\n      }\n    }\n  }\n"): (typeof documents)["\n  query NavigationCategories($rootCategoryId: String!) {\n    categoryList(filters: { parent_id: { eq: $rootCategoryId } }) {\n      id\n      name\n      url_path\n      image\n      children {\n        id\n        name\n        url_path\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment HomeProductFields on ProductInterface {\n    sku\n    name\n    url_key\n    small_image {\n      url\n      label\n    }\n    price_range {\n      minimum_price {\n        regular_price {\n          value\n          currency\n        }\n        final_price {\n          value\n          currency\n        }\n      }\n    }\n    rating_summary\n    review_count\n    stock_status\n  }\n"): (typeof documents)["\n  fragment HomeProductFields on ProductInterface {\n    sku\n    name\n    url_key\n    small_image {\n      url\n      label\n    }\n    price_range {\n      minimum_price {\n        regular_price {\n          value\n          currency\n        }\n        final_price {\n          value\n          currency\n        }\n      }\n    }\n    rating_summary\n    review_count\n    stock_status\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MerchandisingProducts($categoryId: String!, $pageSize: Int!) {\n    products(filter: { category_id: { eq: $categoryId } }, pageSize: $pageSize) {\n      items {\n        ...HomeProductFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query MerchandisingProducts($categoryId: String!, $pageSize: Int!) {\n    products(filter: { category_id: { eq: $categoryId } }, pageSize: $pageSize) {\n      items {\n        ...HomeProductFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EditorialBlocks($identifiers: [String]!) {\n    cmsBlocks(identifiers: $identifiers) {\n      items {\n        identifier\n        title\n        content\n      }\n    }\n  }\n"): (typeof documents)["\n  query EditorialBlocks($identifiers: [String]!) {\n    cmsBlocks(identifiers: $identifiers) {\n      items {\n        identifier\n        title\n        content\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubscribeNewsletter($email: String!) {\n    subscribeEmailToNewsletter(email: $email) {\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation SubscribeNewsletter($email: String!) {\n    subscribeEmailToNewsletter(email: $email) {\n      status\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;