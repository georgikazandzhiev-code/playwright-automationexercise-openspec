import { expect, Locator, Page } from '@playwright/test';
import {
  LOGIN_ERROR_INCORRECT,
  LOGIN_SECTION_HEADING,
  NEW_USER_SIGNUP_HEADING,
  UI_PATH_LOGIN,
} from '@utils/constants';
import { BasePage } from './base.page';

/**
 * Login form on `/login`.
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (top) ── (testIdAttribute = data-qa)
  get emailInput(): Locator {
    return this.page.getByTestId('login-email');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('login-password');
  }

  get loginButton(): Locator {
    return this.page.getByTestId('login-button');
  }

  get loginErrorParagraph(): Locator {
    return this.page.getByText(LOGIN_ERROR_INCORRECT);
  }

  get loginSectionHeading(): Locator {
    return this.page.getByRole('heading', { name: LOGIN_SECTION_HEADING });
  }

  get newUserSignupHeading(): Locator {
    return this.page.getByRole('heading', { name: NEW_USER_SIGNUP_HEADING });
  }

  /**
   * The error paragraph located STRUCTURALLY, not by its text.
   *
   * `loginErrorParagraph` above finds the element by the expected copy, which is
   * circular for TC-07: it can only ever return the string we already assumed. TC-07
   * has to compare the two refusal messages the site actually renders, so it needs a
   * locator that is blind to their content. Verified against the live DOM:
   * `<div class="login-form"><form action="/login">…<p style="color: red;">…</p></form></div>`.
   */
  get loginErrorMessage(): Locator {
    return this.page.locator('.login-form form p');
  }

  // ── Methods (below) ──
  /**
   * Perform login with provided credentials.
   * @param email - Registered user email.
   * @param password - Account password.
   */
  loginWithCredentials = async (email: string, password: string): Promise<void> => {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert logged-in banner shows expected display name.
   * @param displayName - Name portion shown after "Logged in as".
   */
  assertLoggedInAs = async (displayName: string): Promise<void> => {
    const banner = this.page.getByText(
      new RegExp(`Logged in as\\s+${escapeRegExp(displayName)}`, 'i'),
    );
    await expect(banner).toBeVisible();
  };

  /**
   * Assert any authenticated banner is visible (when exact display text is unknown).
   */
  assertAuthenticatedSessionVisible = async (): Promise<void> => {
    await expect(this.page.getByText(/Logged in as/i)).toBeVisible();
  };

  /**
   * Assert incorrect credentials message is shown.
   */
  assertLoginErrorVisible = async (): Promise<void> => {
    await expect(this.loginErrorParagraph).toBeVisible();
  };

  /**
   * Assert both entry points of the login page are present (REQ-AUT-01).
   */
  assertBothEntryPointsVisible = async (): Promise<void> => {
    await expect(this.loginSectionHeading).toBeVisible();
    await expect(this.newUserSignupHeading).toBeVisible();
  };

  /**
   * Read the refusal message the site actually rendered, located structurally.
   * Used by TC-07 to compare two refusals against each other rather than each
   * against a constant — two identically-changed messages would still pass that.
   */
  readLoginErrorText = async (): Promise<string> => {
    await expect(this.loginErrorMessage).toBeVisible();
    return (await this.loginErrorMessage.innerText()).trim();
  };

  /**
   * Submit the login form without filling anything (REQ-AUT-06).
   */
  submitEmptyLoginForm = async (): Promise<void> => {
    await this.loginButton.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Submit with an email but no password (REQ-AUT-06).
   * @param email - A syntactically valid address.
   */
  submitLoginWithEmailOnly = async (email: string): Promise<void> => {
    await this.emailInput.fill(email);
    await this.loginButton.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert the browser's native constraint validation rejects the email field.
   *
   * `ValidityState` has no Playwright locator API — `evaluate` on the element is the
   * only route to it. Confined to this page object so no spec touches the DOM, and
   * paired at the call site with the user-observable consequences (no navigation,
   * no session), which ARE asserted through locators.
   */
  assertEmailFieldRejectedByBrowser = async (): Promise<void> => {
    const isValid = await this.emailInput.evaluate<boolean, HTMLInputElement>(
      (element) => element.validity.valid,
    );
    expect(isValid, 'expected native constraint validation to reject the email field').toBe(false);
  };

  /**
   * Assert the form did not submit — still on the login route (REQ-AUT-06).
   */
  assertStillOnLoginRoute = async (): Promise<void> => {
    await expect(this.page).toHaveURL(new RegExp(`${UI_PATH_LOGIN}$`));
  };
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
