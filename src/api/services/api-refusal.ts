import { APIResponse, expect } from '@playwright/test';
import {
  ApiErrorResponseSchema,
  type ApiErrorResponse,
} from '../schemas/automation-exercise.schema';
import {
  API_METHOD_NOT_ALLOWED_MESSAGE,
  API_RESPONSE_CODE_METHOD_NOT_ALLOWED,
  HTTP_STATUS_OK,
} from '@utils/constants';

/**
 * Assert the site refused an unsupported HTTP method (REQ-API-02, REQ-API-04, REQ-API-09).
 *
 * Shared by the catalogue and account services because the refusal is one contract across
 * three endpoints; duplicating it per service would let the three drift apart.
 *
 * The message is asserted verbatim, which the framework normally forbids — here it is
 * published in the site's own API list as part of the contract, and both REQ-API-02 and
 * REQ-API-04 quote it.
 * @param response - The response to the unsupported call.
 * @param label - Endpoint and verb, used in the assertion message.
 */
export const assertMethodNotAllowed = async (
  response: APIResponse,
  label: string,
): Promise<ApiErrorResponse> => {
  expect(response.status(), `${label} HTTP status`).toBe(HTTP_STATUS_OK);
  const body = ApiErrorResponseSchema.parse(await response.json());
  expect(body.responseCode, `${label} responseCode`).toBe(API_RESPONSE_CODE_METHOD_NOT_ALLOWED);
  expect(body.message, `${label} message`).toBe(API_METHOD_NOT_ALLOWED_MESSAGE);
  return body;
};
