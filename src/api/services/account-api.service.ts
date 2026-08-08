import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import {
  ApiErrorResponseSchema,
  ApiMessageResponseSchema,
  VerifyLoginResponseSchema,
  type ApiErrorResponse,
  type ApiMessageResponse,
  type VerifyLoginResponse,
} from '../schemas/automation-exercise.schema';
import type { SeedAccountPayload } from '../data-providers/account-api.data';
import { assertMethodNotAllowed } from './api-refusal';
import {
  API_CREATE_ACCOUNT_PATH,
  API_DELETE_ACCOUNT_PATH,
  API_MESSAGE_USER_NOT_FOUND,
  API_RESPONSE_CODE_CREATED,
  API_RESPONSE_CODE_LEGACY_BAD_REQUEST,
  API_RESPONSE_CODE_NOT_FOUND,
  API_RESPONSE_CODE_OK,
  API_VERIFY_LOGIN_MISSING_PARAM_MARKERS,
  API_VERIFY_LOGIN_PATH,
  HTTP_STATUS_OK,
} from '@utils/constants';

/**
 * Account lifecycle endpoints (API 11 createAccount, API 12 deleteAccount).
 * Used to SEED a known-credentialed user for UI login/checkout tests and to
 * CLEAN UP created accounts, so no test relies on `test.skip` or leaves state.
 */
export class AccountApiService {
  constructor(private readonly request: APIRequestContext) {}

  createAccount = async (payload: SeedAccountPayload): Promise<APIResponse> =>
    this.request.post(API_CREATE_ACCOUNT_PATH, { form: { ...payload } });

  deleteAccount = async (email: string, password: string): Promise<APIResponse> =>
    this.request.delete(API_DELETE_ACCOUNT_PATH, { form: { email, password } });

  verifyLogin = async (email: string, password: string): Promise<APIResponse> =>
    this.request.post(API_VERIFY_LOGIN_PATH, { form: { email, password } });

  /**
   * Verify credentials and return the parsed body (API 7 / 10).
   * Asserts only the transport — the caller asserts `responseCode`, because both
   * "exists" and "not found" are legitimate outcomes depending on the requirement.
   * @param email - Account email.
   * @param password - Account password.
   */
  readVerifyLogin = async (email: string, password: string): Promise<VerifyLoginResponse> => {
    const response = await this.verifyLogin(email, password);
    expect(response.status(), 'verifyLogin HTTP status').toBe(HTTP_STATUS_OK);
    return VerifyLoginResponseSchema.parse(await response.json());
  };

  /**
   * DELETE /api/verifyLogin — an unsupported method on a POST-only endpoint (API 9).
   */
  deleteVerifyLogin = async (): Promise<APIResponse> => this.request.delete(API_VERIFY_LOGIN_PATH);

  /**
   * POST /api/verifyLogin carrying only an email (API 8).
   * @param email - Any email address; the password is deliberately absent.
   */
  verifyLoginWithoutPassword = async (email: string): Promise<APIResponse> =>
    this.request.post(API_VERIFY_LOGIN_PATH, { form: { email } });

  /**
   * Assert API 9: verifyLogin refuses DELETE (REQ-API-09).
   */
  assertVerifyLoginRefusesDelete = async (): Promise<ApiErrorResponse> =>
    assertMethodNotAllowed(await this.deleteVerifyLogin(), 'DELETE verifyLogin');

  /**
   * Assert API 8: verifyLogin without a password is a bad request naming what is missing
   * (REQ-API-08). The message is matched on markers rather than verbatim — the wording
   * varies by deployment, and pinning it would make a copy change look like a regression.
   * @param email - Email to send without a password.
   */
  assertVerifyLoginRejectsMissingPassword = async (email: string): Promise<ApiErrorResponse> => {
    const response = await this.verifyLoginWithoutPassword(email);
    expect(response.status(), 'verifyLogin missing-password HTTP status').toBe(HTTP_STATUS_OK);
    const body = ApiErrorResponseSchema.parse(await response.json());
    expect(body.responseCode, 'verifyLogin missing-password responseCode').toBe(
      API_RESPONSE_CODE_LEGACY_BAD_REQUEST,
    );
    const normalizedMessage = body.message.toLowerCase();
    for (const marker of API_VERIFY_LOGIN_MISSING_PARAM_MARKERS) {
      expect(normalizedMessage, `message should mention ${marker}`).toContain(marker);
    }
    return body;
  };

  /**
   * Assert API 10: credentials matching no account are refused (REQ-API-10).
   * @param email - Email of no account.
   * @param password - Any password.
   */
  assertVerifyLoginRejectsUnknownCredentials = async (
    email: string,
    password: string,
  ): Promise<VerifyLoginResponse> => {
    const body = await this.readVerifyLogin(email, password);
    expect(body.responseCode, 'unknown-credentials responseCode').toBe(API_RESPONSE_CODE_NOT_FOUND);
    expect(body.message, 'unknown-credentials message').toBe(API_MESSAGE_USER_NOT_FOUND);
    return body;
  };

  /**
   * Create an account and assert the site confirms it (body responseCode 201).
   */
  seedAccount = async (payload: SeedAccountPayload): Promise<ApiMessageResponse> => {
    const response = await this.createAccount(payload);
    expect(response.status(), 'createAccount HTTP status').toBe(HTTP_STATUS_OK);
    const body = ApiMessageResponseSchema.parse(await response.json());
    expect(body.responseCode, 'createAccount responseCode').toBe(API_RESPONSE_CODE_CREATED);
    return body;
  };

  /**
   * Delete an account created during the test (best-effort teardown — leaves env as found).
   */
  removeAccount = async (email: string, password: string): Promise<void> => {
    const response = await this.deleteAccount(email, password);
    expect(response.status(), 'deleteAccount HTTP status').toBe(HTTP_STATUS_OK);
    const body = ApiMessageResponseSchema.parse(await response.json());
    expect(body.responseCode, 'deleteAccount responseCode').toBe(API_RESPONSE_CODE_OK);
  };

  /**
   * Teardown for a test whose SUBJECT is deleting the account (TC-13), where the
   * account is already gone by the time teardown runs. Issues the delete without
   * asserting the outcome, so the fixture cannot leak an account if the test failed
   * before its own delete step — and cannot fail the run when it succeeded.
   *
   * Deliberately NOT used by `seededAccount`: for every other test, a failed cleanup
   * is a real problem on this shared environment and must surface.
   * @param email - Account email.
   * @param password - Account password.
   */
  discardAccount = async (email: string, password: string): Promise<void> => {
    await this.deleteAccount(email, password);
  };
}
