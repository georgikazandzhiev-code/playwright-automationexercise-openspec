import { API_MESSAGE_USER_EXISTS, API_RESPONSE_CODE_OK } from '@utils/constants';
import { expect, test } from '../../api/fixtures';

/**
 * public-api — REQ-API-07 (verifyLogin with valid details).
 *
 * This case exists inside the `harden-authentication-coverage` change as the
 * SEEDING PRECONDITION GUARD. Every UI case in that change depends on
 * POST /api/createAccount producing a usable account; if seeding breaks, twelve UI
 * tests go red at once and the cause is invisible. This one fails on its own, first,
 * and names the real problem.
 */
test.describe('public-api — verifyLogin (API 7)', () => {
  test(
    'TC-01 an account created through the API verifies as existing',
    { tag: '@api' },
    async ({ accountApi, seededAccount }) => {
      const body =
        await test.step('WHEN verifyLogin is called with the seeded credentials', async () =>
          accountApi.readVerifyLogin(seededAccount.email, seededAccount.password));

      await test.step('THEN the site confirms the account exists', async () => {
        // The site answers HTTP 200 for every outcome; the contract is in the body (C4).
        expect(body.responseCode, 'verifyLogin responseCode').toBe(API_RESPONSE_CODE_OK);
        expect(body.message, 'verifyLogin message').toBe(API_MESSAGE_USER_EXISTS);
      });
    },
  );
});
