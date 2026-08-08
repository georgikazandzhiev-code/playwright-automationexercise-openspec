import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import {
  ApiMessageResponseSchema,
  VerifyLoginResponseSchema,
  type ApiMessageResponse,
  type VerifyLoginResponse,
} from '../schemas/automation-exercise.schema';
import type { SeedAccountPayload } from '../data-providers/account-api.data';
import {
  API_CREATE_ACCOUNT_PATH,
  API_DELETE_ACCOUNT_PATH,
  API_RESPONSE_CODE_CREATED,
  API_RESPONSE_CODE_OK,
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
