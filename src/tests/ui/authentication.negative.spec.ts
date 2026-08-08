import {
  buildSyntacticallyValidEmail,
  buildUnknownCredentials,
} from '@data-providers/authentication.data';
import { LOGIN_ERROR_INCORRECT, UI_PATH_LOGIN, WRONG_PASSWORD_PLACEHOLDER } from '@utils/constants';
import { expect, test } from '../../ui/fixtures';

/**
 * authentication — REQ-AUT-03 (refusal and non-disclosure) and REQ-AUT-06
 * (empty credentials blocked before submission).
 */
test.describe('authentication — refusal of invalid credentials', () => {
  test(
    'TC-05 an email with no account is refused',
    { tag: '@negative' },
    async ({ navigationPage, loginPage }) => {
      const unknown = buildUnknownCredentials();

      await test.step('GIVEN a guest on the login page', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('WHEN an unregistered email is submitted', async () => {
        await loginPage.loginWithCredentials(unknown.email, unknown.password);
      });

      await test.step('THEN it is refused and no session is created', async () => {
        await expect(loginPage.loginErrorMessage).toHaveText(LOGIN_ERROR_INCORRECT);
        await navigationPage.assertNotAuthenticated();
      });
    },
  );

  test(
    'TC-06 a wrong password for a real account is refused',
    { tag: '@negative' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      await test.step('GIVEN a guest on the login page and an account that exists', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step("WHEN its email is submitted with someone else's password", async () => {
        await loginPage.loginWithCredentials(seededAccount.email, WRONG_PASSWORD_PLACEHOLDER);
      });

      await test.step('THEN it is refused and no session is created', async () => {
        await expect(loginPage.loginErrorMessage).toHaveText(LOGIN_ERROR_INCORRECT);
        await navigationPage.assertNotAuthenticated();
      });
    },
  );

  test(
    'TC-07 the two refusals are indistinguishable — no account enumeration',
    { tag: '@negative' },
    async ({ navigationPage, loginPage, seededAccount }) => {
      const unknown = buildUnknownCredentials();

      const unknownEmailMessage = await test.step(
        'WHEN an unregistered email is refused, capture what the site rendered',
        async () => {
          await navigationPage.gotoPath(UI_PATH_LOGIN);
          await loginPage.loginWithCredentials(unknown.email, unknown.password);
          return loginPage.readLoginErrorText();
        },
      );

      const wrongPasswordMessage = await test.step(
        'WHEN a real account with a wrong password is refused, capture that too',
        async () => {
          await navigationPage.gotoPath(UI_PATH_LOGIN);
          await loginPage.loginWithCredentials(seededAccount.email, WRONG_PASSWORD_PLACEHOLDER);
          return loginPage.readLoginErrorText();
        },
      );

      await test.step('THEN the two messages are identical', async () => {
        // Compared against EACH OTHER, not each against a constant: two messages
        // both changed to new-but-different values would still pass that weaker check.
        // A difference here is an account-enumeration finding (OWASP A07) — it is
        // recorded in docs/requirements.md §10 and reported, never absorbed by
        // loosening this assertion.
        expect(
          wrongPasswordMessage,
          'an unknown email and a wrong password must be indistinguishable to an attacker',
        ).toBe(unknownEmailMessage);
      });
    },
  );
});

test.describe('authentication — empty credentials are blocked by the browser', () => {
  test(
    'TC-11 submitting an empty login form does not reach the site',
    { tag: '@negative' },
    async ({ navigationPage, loginPage }) => {
      await test.step('GIVEN a guest on the login page with both fields empty', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('WHEN the login control is activated', async () => {
        await loginPage.submitEmptyLoginForm();
      });

      await test.step('THEN the browser rejects the field and nothing was submitted', async () => {
        await loginPage.assertEmailFieldRejectedByBrowser();
        await loginPage.assertStillOnLoginRoute();
        await navigationPage.assertNotAuthenticated();
      });
    },
  );

  test(
    'TC-12 a valid email with an empty password does not submit',
    { tag: '@negative' },
    async ({ navigationPage, loginPage }) => {
      await test.step('GIVEN a guest with a valid email and no password', async () => {
        await navigationPage.gotoPath(UI_PATH_LOGIN);
      });

      await test.step('WHEN the login control is activated', async () => {
        await loginPage.submitLoginWithEmailOnly(buildSyntacticallyValidEmail());
      });

      await test.step('THEN nothing was submitted and no session exists', async () => {
        await loginPage.assertStillOnLoginRoute();
        await navigationPage.assertNotAuthenticated();
      });
    },
  );
});
