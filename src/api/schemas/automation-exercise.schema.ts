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

export type ProductCategory = z.infer<typeof ProductCategorySchema>;
export type CatalogProduct = z.infer<typeof CatalogProductSchema>;
export type ProductsListResponse = z.infer<typeof ProductsListResponseSchema>;
export type SearchProductsResponse = z.infer<typeof SearchProductsResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiMessageResponse = z.infer<typeof ApiMessageResponseSchema>;
export type VerifyLoginResponse = z.infer<typeof VerifyLoginResponseSchema>;
