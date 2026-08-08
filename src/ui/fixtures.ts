import { test as base } from '@playwright/test';
import {
  blockThirdPartyAdRoutes,
  installConsentHandler,
  installVignetteCloseHandler,
} from '@utils/consent';
import { buildSeededAccount, type SeededAccount } from '@api-data-providers/account-api.data';
import { AccountApiService } from '../api/services/account-api.service';
import { AccountCreatedPage } from './pages/account-created.page';
import { CartPage } from './pages/cart.page';
import { CheckoutPage } from './pages/checkout.page';
import { LoginPage } from './pages/login.page';
import { NavigationPage } from './pages/navigation.page';
import { PaymentPage } from './pages/payment.page';
import { ProductDetailsPage } from './pages/product-details.page';
import { ProductsPage } from './pages/products.page';
import { RegisterAccountPage } from './pages/register-account.page';
import { SignupLoginPage } from './pages/signup-login.page';

type PageFixtures = {
  accountApi: AccountApiService;
  seededAccount: SeededAccount;
  disposableAccount: SeededAccount;
  navigationPage: NavigationPage;
  signupLoginPage: SignupLoginPage;
  registerAccountPage: RegisterAccountPage;
  accountCreatedPage: AccountCreatedPage;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  paymentPage: PaymentPage;
};

/**
 * Custom Playwright fixtures wiring Page Objects (POM). Extend here when new pages appear.
 */
export const test = base.extend<PageFixtures>({
  page: async ({ page }, use) => {
    await blockThirdPartyAdRoutes(page);
    try {
      await installConsentHandler(page);
    } catch {
      // optional
    }
    try {
      await installVignetteCloseHandler(page);
    } catch {
      // optional
    }
    await use(page);
  },
  accountApi: async ({ request }, use) => {
    await use(new AccountApiService(request));
  },
  /**
   * An account that exists for the duration of one test, created through the REST API
   * and deleted after it — including when the test failed.
   *
   * This is how a UI test gets "an account that exists" without a shared `.env`
   * credential that any other run against this public site can delete (constraint C1),
   * and without a `test.skip` when it is missing. The teardown ASSERTS the deletion:
   * on a shared environment with no reset, a cleanup that silently fails is a leak.
   */
  seededAccount: async ({ accountApi }, use) => {
    const account = buildSeededAccount();
    await accountApi.seedAccount(account.payload);
    await use(account);
    await accountApi.removeAccount(account.email, account.password);
  },
  /**
   * Same, for a test whose SUBJECT is deleting the account (TC-13). Teardown discards
   * without asserting, because by then the account is meant to be gone — while still
   * covering the case where the test failed before its own delete step.
   */
  disposableAccount: async ({ accountApi }, use) => {
    const account = buildSeededAccount();
    await accountApi.seedAccount(account.payload);
    await use(account);
    await accountApi.discardAccount(account.email, account.password);
  },
  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },
  signupLoginPage: async ({ page }, use) => {
    await use(new SignupLoginPage(page));
  },
  registerAccountPage: async ({ page }, use) => {
    await use(new RegisterAccountPage(page));
  },
  accountCreatedPage: async ({ page }, use) => {
    await use(new AccountCreatedPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },
});

export { expect } from '@playwright/test';
