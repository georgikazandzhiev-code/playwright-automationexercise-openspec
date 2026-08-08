import { UI_PATH_LOGIN } from '@utils/constants';
import { test } from '../../ui/fixtures';

/**
 * authentication — REQ-AUT-01, REQ-AUT-02, REQ-AUT-04, REQ-AUT-05.
 *
 * Every test seeds its own account through POST /api/createAccount via the
 * `seededAccount` fixture and deletes it afterwards, including on failure
 * (constraints C1 and C2). No shared `.env` credential, no skip.
 */
test.describe('authentication — session establishment and persistence', () => {
  test(
    'TC-02 the login page presents both the returning-user and new-user entry points',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage }) => {
      await test.step('GIVEN a guest on the login page', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('THEN both sections are visible', async () => {
        await loginPage.assertBothEntryPointsVisible();
      });
    },
  );

  test(
    'TC-03 a seeded account logs in and the header indicates a session',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN a guest on the login page', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('WHEN the seeded credentials are submitted', async () => {
        await loginPage.loginWithCredentials(seededAccount.email, seededAccount.password);
      });

      await test.step('THEN a session is indicated', async () => {
        await loginPage.assertAuthenticatedSessionVisible();
      });
    },
  );

  test(
    'TC-04 the header names the registered user exactly, not merely some user',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN an account registered with a per-run unique name', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('WHEN that account logs in', async () => {
        await loginPage.loginWithCredentials(seededAccount.email, seededAccount.password);
      });

      await test.step('THEN the header names THAT account', async () => {
        // Exact text, not a prefix. `Logged in as <anybody>` must not satisfy this —
        // that weakness is why REQ-AUT-02 was tightened.
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });
    },
  );

  test(
    'TC-08 logout terminates the session and the header reverts',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN an authenticated user', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
        await loginPage.loginWithCredentials(seededAccount.email, seededAccount.password);
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });

      await test.step('WHEN they log out', async () => {
        await navigationPage.logout();
      });

      await test.step('THEN no session is indicated', async () => {
        await navigationPage.assertNotAuthenticated();
      });
    },
  );

  test(
    'TC-09 the session survives navigation across the site',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN a user who has just logged in', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
        await loginPage.loginWithCredentials(seededAccount.email, seededAccount.password);
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });

      await test.step('WHEN they navigate to the products listing', async () => {
        await navigationPage.goToProductsByPath();
      });

      await test.step('THEN the session still names them', async () => {
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });

      await test.step('WHEN they navigate on to the cart', async () => {
        await navigationPage.goToCartByPath();
      });

      await test.step('THEN the session still names them there too', async () => {
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });
    },
  );

  test(
    'TC-10 the session survives a full page reload',
    { tag: '@e2e' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN a user who has just logged in', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
        await loginPage.loginWithCredentials(seededAccount.email, seededAccount.password);
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });

      await test.step('WHEN the page is reloaded', async () => {
        await navigationPage.reloadPage();
      });

      await test.step('THEN the session still names them', async () => {
        await navigationPage.assertLoggedInAsExactly(seededAccount.name);
      });
    },
  );
});
