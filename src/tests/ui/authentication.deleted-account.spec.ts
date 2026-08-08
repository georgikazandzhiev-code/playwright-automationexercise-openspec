import { LOGIN_ERROR_INCORRECT, UI_PATH_LOGIN } from '@utils/constants';
import { expect, test } from '../../ui/fixtures';

/**
 * authentication — REQ-AUT-03 from a second angle: credentials that USED to be valid.
 *
 * Uses `disposableAccount` rather than `seededAccount`, because deleting the account is
 * the test's own WHEN step — teardown then discards without asserting, which still
 * covers the case where the test failed before reaching that step.
 *
 * This also exercises `account-lifecycle` REQ-ACC-07's second scenario. Coverage of
 * REQ-ACC-07 is NOT claimed here; that belongs to the account-lifecycle change.
 */
test.describe('authentication — a deleted account cannot log in', () => {
  test(
    'TC-13 credentials of a deleted account no longer authenticate',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, accountApi, disposableAccount }) => {
      await test.step('GIVEN the account is deleted through the API', async () => {
        await accountApi.removeAccount(disposableAccount.email, disposableAccount.password);
      });

      await test.step('WHEN its former credentials are submitted to the login form', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
        await loginPage.loginWithCredentials(disposableAccount.email, disposableAccount.password);
      });

      await test.step('THEN they are refused and no session is created', async () => {
        await expect(loginPage.loginErrorMessage).toHaveText(LOGIN_ERROR_INCORRECT);
        await navigationPage.assertNotAuthenticated();
      });
    },
  );
});
