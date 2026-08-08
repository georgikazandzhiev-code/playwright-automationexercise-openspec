import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import {
  UserDetailResponseSchema,
  UserLookupResponseSchema,
  type UserDetailResponse,
  type UserLookupResponse,
} from '../schemas/automation-exercise.schema';
import { API_USER_DETAIL_PATH, HTTP_STATUS_OK } from '@utils/constants';

/** A lookup outcome plus the raw text, because REQ-SEC-12 asserts on what was *disclosed*. */
export type UserLookupOutcome = {
  parsed: UserLookupResponse;
  rawBody: string;
};

/**
 * API 14 — `GET /api/getUserDetailByEmail`.
 *
 * The only published endpoint that returns a person's date of birth, employer and postal
 * address, which makes it the subject of REQ-SEC-11 (what is returned), REQ-SEC-12 (to
 * whom) and REQ-SEC-13 (what the answer discloses about who exists).
 *
 * No credential parameter exists on this endpoint. That is the finding, not an omission
 * in this client.
 */
export class UserApiService {
  constructor(private readonly request: APIRequestContext) {}

  getUserDetailByEmail = async (email: string): Promise<APIResponse> =>
    this.request.get(API_USER_DETAIL_PATH, { params: { email } });

  /**
   * Read a lookup for an account known to exist and validate it against the strict detail
   * schema. The strictness is REQ-SEC-11's mechanism — a credential field appearing in the
   * response fails this parse.
   * @param email - Email of a seeded account.
   */
  readUserDetail = async (
    email: string,
  ): Promise<{ parsed: UserDetailResponse; rawBody: string }> => {
    const response = await this.getUserDetailByEmail(email);
    expect(response.status(), 'getUserDetailByEmail HTTP status').toBe(HTTP_STATUS_OK);
    const rawBody = await response.text();
    return { parsed: UserDetailResponseSchema.parse(JSON.parse(rawBody)), rawBody };
  };

  /**
   * Read a lookup whose outcome is not known in advance — the account may or may not
   * exist — returning both the validated body and the raw text.
   * @param email - Any email address.
   */
  readUserLookup = async (email: string): Promise<UserLookupOutcome> => {
    const response = await this.getUserDetailByEmail(email);
    expect(response.status(), 'getUserDetailByEmail HTTP status').toBe(HTTP_STATUS_OK);
    const rawBody = await response.text();
    return { parsed: UserLookupResponseSchema.parse(JSON.parse(rawBody)), rawBody };
  };
}
