/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** The list of available currency codes. */
export type CurrencyEnum =
  | 'AED'
  | 'AFN'
  | 'ALL'
  | 'AMD'
  | 'ANG'
  | 'AOA'
  | 'ARS'
  | 'AUD'
  | 'AWG'
  | 'AZM'
  | 'AZN'
  | 'BAM'
  | 'BBD'
  | 'BDT'
  | 'BGN'
  | 'BHD'
  | 'BIF'
  | 'BMD'
  | 'BND'
  | 'BOB'
  | 'BRL'
  | 'BSD'
  | 'BTN'
  | 'BUK'
  | 'BWP'
  | 'BYN'
  | 'BZD'
  | 'CAD'
  | 'CDF'
  | 'CHE'
  | 'CHF'
  | 'CHW'
  | 'CLP'
  | 'CNY'
  | 'COP'
  | 'CRC'
  | 'CUP'
  | 'CVE'
  | 'CZK'
  | 'DJF'
  | 'DKK'
  | 'DOP'
  | 'DZD'
  | 'EEK'
  | 'EGP'
  | 'ERN'
  | 'ETB'
  | 'EUR'
  | 'FJD'
  | 'FKP'
  | 'GBP'
  | 'GEK'
  | 'GEL'
  | 'GHS'
  | 'GIP'
  | 'GMD'
  | 'GNF'
  | 'GQE'
  | 'GTQ'
  | 'GYD'
  | 'HKD'
  | 'HNL'
  | 'HRK'
  | 'HTG'
  | 'HUF'
  | 'IDR'
  | 'ILS'
  | 'INR'
  | 'IQD'
  | 'IRR'
  | 'ISK'
  | 'JMD'
  | 'JOD'
  | 'JPY'
  | 'KES'
  | 'KGS'
  | 'KHR'
  | 'KMF'
  | 'KPW'
  | 'KRW'
  | 'KWD'
  | 'KYD'
  | 'KZT'
  | 'LAK'
  | 'LBP'
  | 'LKR'
  | 'LRD'
  | 'LSL'
  | 'LSM'
  | 'LTL'
  | 'LVL'
  | 'LYD'
  | 'MAD'
  | 'MDL'
  | 'MGA'
  | 'MKD'
  | 'MMK'
  | 'MNT'
  | 'MOP'
  | 'MRO'
  | 'MUR'
  | 'MVR'
  | 'MWK'
  | 'MXN'
  | 'MYR'
  | 'MZN'
  | 'NAD'
  | 'NGN'
  | 'NIC'
  | 'NOK'
  | 'NPR'
  | 'NZD'
  | 'OMR'
  | 'PAB'
  | 'PEN'
  | 'PGK'
  | 'PHP'
  | 'PKR'
  | 'PLN'
  | 'PYG'
  | 'QAR'
  | 'RHD'
  | 'ROL'
  | 'RON'
  | 'RSD'
  | 'RUB'
  | 'RWF'
  | 'SAR'
  | 'SBD'
  | 'SCR'
  | 'SDG'
  | 'SEK'
  | 'SGD'
  | 'SHP'
  | 'SKK'
  | 'SLL'
  | 'SOS'
  | 'SRD'
  | 'STD'
  | 'SVC'
  | 'SYP'
  | 'SZL'
  | 'THB'
  | 'TJS'
  | 'TMM'
  | 'TND'
  | 'TOP'
  | 'TRL'
  | 'TRY'
  | 'TTD'
  | 'TWD'
  | 'TZS'
  | 'UAH'
  | 'UGX'
  | 'USD'
  | 'UYU'
  | 'UZS'
  | 'VEB'
  | 'VEF'
  | 'VND'
  | 'VUV'
  | 'WST'
  | 'XCD'
  | 'XOF'
  | 'XPF'
  | 'YER'
  | 'YTL'
  | 'ZAR'
  | 'ZMK'
  | 'ZWD';

/** This enumeration states whether a product stock status is in stock or out of stock */
export type ProductStockStatus =
  | 'IN_STOCK'
  | 'OUT_OF_STOCK';

/** Indicates the status of the request. */
export type SubscriptionStatusesEnum =
  | 'NOT_ACTIVE'
  | 'SUBSCRIBED'
  | 'UNCONFIRMED'
  | 'UNSUBSCRIBED';

export type StoreConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type StoreConfigQuery = { storeConfig: { store_code: string | null, locale: string | null, base_currency_code: string | null, secure_base_media_url: string | null, cms_home_page: string | null } | null };

export type NavigationCategoriesQueryVariables = Exact<{
  rootCategoryId: string;
}>;


export type NavigationCategoriesQuery = { categoryList: Array<{ id: number | null, name: string | null, url_path: string | null, image: string | null, children: Array<{ id: number | null, name: string | null, url_path: string | null } | null> | null } | null> | null };

type HomeProductFields_BundleProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

type HomeProductFields_ConfigurableProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

type HomeProductFields_DownloadableProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

type HomeProductFields_GroupedProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

type HomeProductFields_SimpleProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

type HomeProductFields_VirtualProduct_Fragment = { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } };

export type HomeProductFieldsFragment =
  | HomeProductFields_BundleProduct_Fragment
  | HomeProductFields_ConfigurableProduct_Fragment
  | HomeProductFields_DownloadableProduct_Fragment
  | HomeProductFields_GroupedProduct_Fragment
  | HomeProductFields_SimpleProduct_Fragment
  | HomeProductFields_VirtualProduct_Fragment
;

export type MerchandisingProductsQueryVariables = Exact<{
  categoryId: string;
  pageSize: number;
}>;


export type MerchandisingProductsQuery = { products: { items: Array<
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
      | { sku: string | null, name: string | null, url_key: string | null, rating_summary: number, review_count: number, stock_status: ProductStockStatus | null, small_image: { url: string | null, label: string | null } | null, price_range: { minimum_price: { regular_price: { value: number | null, currency: CurrencyEnum | null }, final_price: { value: number | null, currency: CurrencyEnum | null } } } }
     | null> | null } | null };

export type EditorialBlocksQueryVariables = Exact<{
  identifiers: Array<string | null | undefined> | string;
}>;


export type EditorialBlocksQuery = { cmsBlocks: { items: Array<{ identifier: string | null, title: string | null, content: string | null } | null> | null } | null };

export type SubscribeNewsletterMutationVariables = Exact<{
  email: string;
}>;


export type SubscribeNewsletterMutation = { subscribeEmailToNewsletter: { status: SubscriptionStatusesEnum | null } | null };

export const HomeProductFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HomeProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProductInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url_key"}},{"kind":"Field","name":{"kind":"Name","value":"small_image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"price_range"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimum_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regular_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"final_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"rating_summary"}},{"kind":"Field","name":{"kind":"Name","value":"review_count"}},{"kind":"Field","name":{"kind":"Name","value":"stock_status"}}]}}]} as unknown as DocumentNode<HomeProductFieldsFragment, unknown>;
export const StoreConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeConfig"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"store_code"}},{"kind":"Field","name":{"kind":"Name","value":"locale"}},{"kind":"Field","name":{"kind":"Name","value":"base_currency_code"}},{"kind":"Field","name":{"kind":"Name","value":"secure_base_media_url"}},{"kind":"Field","name":{"kind":"Name","value":"cms_home_page"}}]}}]}}]} as unknown as DocumentNode<StoreConfigQuery, StoreConfigQueryVariables>;
export const NavigationCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NavigationCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rootCategoryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"parent_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rootCategoryId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url_path"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url_path"}}]}}]}}]}}]} as unknown as DocumentNode<NavigationCategoriesQuery, NavigationCategoriesQueryVariables>;
export const MerchandisingProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MerchandisingProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"category_id"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"eq"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HomeProductFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HomeProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ProductInterface"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url_key"}},{"kind":"Field","name":{"kind":"Name","value":"small_image"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"price_range"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimum_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regular_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"final_price"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"rating_summary"}},{"kind":"Field","name":{"kind":"Name","value":"review_count"}},{"kind":"Field","name":{"kind":"Name","value":"stock_status"}}]}}]} as unknown as DocumentNode<MerchandisingProductsQuery, MerchandisingProductsQueryVariables>;
export const EditorialBlocksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EditorialBlocks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identifiers"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cmsBlocks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"identifiers"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identifiers"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"identifier"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]}}]} as unknown as DocumentNode<EditorialBlocksQuery, EditorialBlocksQueryVariables>;
export const SubscribeNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubscribeNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subscribeEmailToNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<SubscribeNewsletterMutation, SubscribeNewsletterMutationVariables>;