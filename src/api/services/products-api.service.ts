import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import {
  ApiErrorResponseSchema,
  ProductsListResponseSchema,
  SearchProductsResponseSchema,
  type ApiErrorResponse,
  type ProductsListResponse,
  type SearchProductsResponse,
} from '../schemas/automation-exercise.schema';
import { assertMethodNotAllowed } from './api-refusal';
import {
  API_BRANDS_LIST_PATH,
  API_PRODUCTS_LIST_PATH,
  API_RESPONSE_CODE_CLIENT_ERROR,
  API_RESPONSE_CODE_LEGACY_BAD_REQUEST,
  API_RESPONSE_CODE_OK,
  API_SEARCH_MISSING_PARAM_MESSAGE_MARKERS,
  API_SEARCH_PRODUCT_PATH,
  HTTP_STATUS_OK,
} from '@utils/constants';

/**
 * Automation Exercise catalog/search endpoints (see /api_list on the site).
 * Every response is validated against a Zod strict schema; only business values
 * are asserted afterwards (shape/types are already proven by `.parse`).
 */
export class ProductsApiService {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * GET /api/productsList — full product catalog.
   */
  getAllProducts = async (): Promise<APIResponse> => this.request.get(API_PRODUCTS_LIST_PATH);

  /**
   * POST /api/searchProduct — optional `search_product` form field.
   * @param searchProduct - When omitted, the site returns API 6 (bad request).
   */
  searchProduct = async (searchProduct?: string): Promise<APIResponse> => {
    if (searchProduct === undefined) {
      return this.request.post(API_SEARCH_PRODUCT_PATH);
    }
    return this.request.post(API_SEARCH_PRODUCT_PATH, {
      form: { search_product: searchProduct },
    });
  };

  /**
   * Assert API 1: GET products returns HTTP 200 and a non-empty catalog.
   */
  assertGetAllProductsReturnsCatalog = async (): Promise<ProductsListResponse> => {
    const response = await this.getAllProducts();
    expect(response.status(), 'GET productsList HTTP status').toBe(HTTP_STATUS_OK);
    const body = ProductsListResponseSchema.parse(await response.json());
    expect(body.responseCode, 'GET productsList responseCode').toBe(API_RESPONSE_CODE_OK);
    expect(body.products.length, 'catalog should contain products').toBeGreaterThan(0);
    return body;
  };

  /**
   * Assert API 5: POST search with a keyword returns matching products.
   * @param keyword - Value for `search_product` (e.g. top, tshirt).
   */
  assertSearchProductReturnsResults = async (keyword: string): Promise<SearchProductsResponse> => {
    const response = await this.searchProduct(keyword);
    expect(response.status(), 'POST searchProduct HTTP status').toBe(HTTP_STATUS_OK);
    const body = SearchProductsResponseSchema.parse(await response.json());
    expect(body.responseCode, 'search responseCode').toBe(API_RESPONSE_CODE_OK);
    expect(body.products.length, 'search should return at least one product').toBeGreaterThan(0);
    return body;
  };

  /**
   * POST /api/productsList — an unsupported method on a read-only endpoint (API 2).
   */
  postProductsList = async (): Promise<APIResponse> => this.request.post(API_PRODUCTS_LIST_PATH);

  /**
   * PUT /api/brandsList — an unsupported method on a read-only endpoint (API 4).
   */
  putBrandsList = async (): Promise<APIResponse> => this.request.put(API_BRANDS_LIST_PATH);

  /**
   * Assert API 2: the catalogue endpoint refuses POST (REQ-API-02).
   */
  assertProductsListRefusesPost = async (): Promise<ApiErrorResponse> =>
    assertMethodNotAllowed(await this.postProductsList(), 'POST productsList');

  /**
   * Assert API 4: the brands endpoint refuses PUT (REQ-API-04).
   */
  assertBrandsListRefusesPut = async (): Promise<ApiErrorResponse> =>
    assertMethodNotAllowed(await this.putBrandsList(), 'PUT brandsList');

  /**
   * Search with an arbitrary term, returning both the validated body and the raw text.
   *
   * The raw text is what REQ-SEC-09 needs: a leaked database error would arrive as prose
   * in the message, which a parsed-and-typed view of the body hides behind a `string`.
   * @param keyword - Value for `search_product`, including hostile input.
   */
  readSearchProduct = async (
    keyword: string,
  ): Promise<{ parsed: SearchProductsResponse; rawBody: string }> => {
    const response = await this.searchProduct(keyword);
    expect(response.status(), 'POST searchProduct HTTP status').toBe(HTTP_STATUS_OK);
    const rawBody = await response.text();
    return { parsed: SearchProductsResponseSchema.parse(JSON.parse(rawBody)), rawBody };
  };

  /**
   * Assert API 6: POST search without `search_product` is rejected (JSON body, not HTTP 4xx).
   */
  assertSearchProductRejectsMissingParameter = async (): Promise<ApiErrorResponse> => {
    const response = await this.searchProduct();
    expect(response.status(), 'missing search_product HTTP status').toBe(HTTP_STATUS_OK);
    const body = ApiErrorResponseSchema.parse(await response.json());
    expect(
      [API_RESPONSE_CODE_CLIENT_ERROR, API_RESPONSE_CODE_LEGACY_BAD_REQUEST],
      'missing search_product responseCode',
    ).toContain(body.responseCode);
    const normalizedMessage = body.message.toLowerCase();
    for (const marker of API_SEARCH_MISSING_PARAM_MESSAGE_MARKERS) {
      expect(normalizedMessage, `message should mention ${marker}`).toContain(marker);
    }
    return body;
  };
}
