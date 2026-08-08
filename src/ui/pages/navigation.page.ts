import { expect, Locator, Page } from '@playwright/test';
import { LOGGED_IN_AS_TEXT, UI_PATH_CART, UI_PATH_PRODUCTS } from '@utils/constants';
import { BasePage } from './base.page';

/**
 * Top navigation for Automation Exercise.
 */
export class NavigationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (top) ──
  get signupLoginLink(): Locator {
    return this.page.getByRole('link', { name: 'Signup / Login' });
  }

  get logoutLink(): Locator {
    return this.page.getByRole('link', { name: 'Logout' });
  }

  get productsLink(): Locator {
    return this.page.getByRole('link', { name: 'Products' });
  }

  get cartLink(): Locator {
    return this.page.getByRole('link', { name: 'Cart' });
  }

  get homeLogoLink(): Locator {
    return this.page.locator('a[href="/"]').first();
  }

  get sessionIndicator(): Locator {
    return this.page.getByText(LOGGED_IN_AS_TEXT);
  }

  /** The `<b>` inside the header indicator that carries the account's registered name. */
  get sessionUserName(): Locator {
    return this.sessionIndicator.locator('b');
  }

  // ── Methods (below) ──
  /**
   * Open home page from header logo.
   */
  goToHome = async (): Promise<void> => {
    await this.gotoPath('/');
  };

  /**
   * Open Signup / Login page.
   * Uses direct navigation because header "Signup / Login" clicks are intermittently
   * blocked by Google vignette ad interstitials on this practice site (the click
   * intercepts and times out). Landing on `/login` is equivalent for the flows here.
   */
  goToSignupLogin = async (): Promise<void> => {
    await this.gotoPath('/login');
  };

  /**
   * Open products listing.
   */
  goToProducts = async (): Promise<void> => {
    await this.productsLink.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Open shopping cart.
   * Uses direct navigation because header "Cart" clicks are often blocked by ad
   * interstitials on this practice site; the line-item assertions still cover cart UX.
   */
  goToCart = async (): Promise<void> => {
    await this.gotoPath('/view_cart');
  };

  /**
   * Log out current session.
   */
  logout = async (): Promise<void> => {
    await this.logoutLink.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert Signup / Login link is visible (logged-out header).
   */
  assertSignupLoginVisible = async (): Promise<void> => {
    await expect(this.signupLoginLink).toBeVisible();
  };

  /**
   * Assert Logout control is visible (logged-in header).
   */
  assertLogoutVisible = async (): Promise<void> => {
    await expect(this.logoutLink).toBeVisible();
  };

  /**
   * Open the products listing by path (REQ-AUT-05 navigation leg).
   * Direct navigation rather than a header click — see `goToSignupLogin` and site defect D2.
   */
  goToProductsByPath = async (): Promise<void> => {
    await this.gotoPath(UI_PATH_PRODUCTS);
  };

  /**
   * Open the cart by path (REQ-AUT-05 navigation leg).
   */
  goToCartByPath = async (): Promise<void> => {
    await this.gotoPath(UI_PATH_CART);
  };

  /**
   * Reload the current page and clear any overlay that reappears (REQ-AUT-05).
   */
  reloadPage = async (): Promise<void> => {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert the header names EXACTLY this account — not merely that some session exists.
   * This is the assertion REQ-AUT-02 was tightened to require: a prefix match on
   * "Logged in as" is satisfied by a session as the wrong user.
   * @param registeredName - The `name` the account was registered with.
   */
  assertLoggedInAsExactly = async (registeredName: string): Promise<void> => {
    await expect(this.sessionUserName).toHaveText(registeredName);
  };

  /**
   * Assert no session is indicated in the header (REQ-AUT-04, REQ-AUT-06).
   */
  assertNotAuthenticated = async (): Promise<void> => {
    await expect(this.sessionIndicator).toBeHidden();
    await expect(this.signupLoginLink).toBeVisible();
  };
}
