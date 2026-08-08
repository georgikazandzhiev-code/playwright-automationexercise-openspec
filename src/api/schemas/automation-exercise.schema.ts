import { z } from 'zod';

/**
 * Zod schemas for the Automation Exercise REST API (see /api_list).
 * Strict objects: an unexpected/extra field is a contract change and must fail —
 * never loosen a schema to make a test pass.
 */

export const ProductCategorySchema = z.strictObject({
  usertype: z.strictObject({ usertype: z.string() }),
  category: z.string(),
});

export const CatalogProductSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().min(1),
  price: z.string().regex(/^Rs\.\s*\d/i, 'price should be a "Rs. <n>" string'),
  brand: z.string().min(1),
  category: ProductCategorySchema,
});

export const ProductsListResponseSchema = z.strictObject({
  responseCode: z.number(),
  products: z.array(CatalogProductSchema),
});

export const SearchProductsResponseSchema = z.strictObject({
  responseCode: z.number(),
  products: z.array(CatalogProductSchema),
});

/** Error body — the site returns HTTP 200 with a JSON responseCode + message. */
export const ApiErrorResponseSchema = z.strictObject({
  responseCode: z.number(),
  message: z.string().min(1),
});

/** Generic message body used by createAccount / deleteAccount. */
export const ApiMessageResponseSchema = z.strictObject({
  responseCode: z.number(),
  message: z.string().min(1),
});

/**
 * verifyLogin body (API 7 / 8 / 10). Structurally identical to the generic message
 * body today, but kept as its own schema so a divergence in one endpoint's contract
 * fails that endpoint's tests instead of silently spreading across every caller.
 */
export const VerifyLoginResponseSchema = z.strictObject({
  responseCode: z.number(),
  message: z.string().min(1),
});

/**
 * The `user` object returned by API 14 (`getUserDetailByEmail`).
 *
 * The strictness here is not stylistic — it IS the mechanism of REQ-SEC-11. The site
 * currently returns no password, hash or token, and this schema is what makes a future
 * deployment that starts returning one fail the suite instead of passing unnoticed.
 * Adding a credential field to this object to "make the parse work" would delete the
 * requirement.
 */
export const UserDetailSchema = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email(),
  title: z.string(),
  birth_day: z.string(),
  birth_month: z.string(),
  birth_year: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string(),
  address1: z.string(),
  address2: z.string(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  zipcode: z.string(),
});

export const UserDetailResponseSchema = z.strictObject({
  responseCode: z.number(),
  user: UserDetailSchema,
});

/**
 * Either outcome of a user lookup — the detail body or the error envelope. Used by the
 * cases that must compare a registered and an unregistered email without knowing in
 * advance which shape each returns (REQ-SEC-13).
 */
export const UserLookupResponseSchema = z.union([UserDetailResponseSchema, ApiErrorResponseSchema]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type CatalogProduct = z.infer<typeof CatalogProductSchema>;
export type ProductsListResponse = z.infer<typeof ProductsListResponseSchema>;
export type SearchProductsResponse = z.infer<typeof SearchProductsResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiMessageResponse = z.infer<typeof ApiMessageResponseSchema>;
export type VerifyLoginResponse = z.infer<typeof VerifyLoginResponseSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
export type UserDetailResponse = z.infer<typeof UserDetailResponseSchema>;
export type UserLookupResponse = z.infer<typeof UserLookupResponseSchema>;
