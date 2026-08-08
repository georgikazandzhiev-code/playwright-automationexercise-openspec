import { request as apiRequest, type APIRequestContext } from '@playwright/test';
import { buildSeededAccount, type SeededAccount } from '../../api/data-providers/account-api.data';
import { AccountApiService } from '../../api/services/account-api.service';
import { getDummyPayment, getOrderComment } from '@data-providers/checkout.data';
import { DEFAULT_BASE_URL } from '@utils/constants';
import { test } from '../../ui/fixtures';
import { withStepContext } from '@utils/assert-context';

const baseURL = process.env.BASE_URL ?? DEFAULT_BASE_URL;

test.describe('Task 4 — Checkout and payment', () => {
  let apiContext: APIRequestContext;
  let account: SeededAccount;

  test.beforeAll(async () => {
    apiContext = await apiRequest.newContext({ baseURL });
    account = buildSeededAccount();
    await new AccountApiService(apiContext).seedAccount(account.payload);
  });

  test.afterAll(async () => {
    await new AccountApiService(apiContext).removeAccount(account.email, account.password);
    await apiContext.dispose();
  });

  test(
    'Logged-in user completes checkout and payment with the saved address',
    { tag: '@e2e' },
    async ({
      navigationPage,
      loginPage,
      productsPage,
      productDetailsPage,
      cartPage,
      checkoutPage,
      paymentPage,
    }) => {
      // Longest end-to-end flow (login → catalog → cart → checkout → payment) on a
      // slow, ad-heavy demo site; allow the extended budget rather than a hard wait.
      test.slow();
      await withStepContext('Log in with the seeded account', async () => {
        await navigationPage.gotoPath('/');
        await navigationPage.goToSignupLogin();
        await loginPage.loginWithCredentials(account.email, account.password);
        await loginPage.assertAuthenticatedSessionVisible();
      });
      await withStepContext('Add a product to the cart', async () => {
        await navigationPage.goToProducts();
        await productsPage.openFirstViewProduct();
        await productDetailsPage.addToCartAndContinueShopping();
      });
      await withStepContext('Proceed to checkout', async () => {
        await navigationPage.goToCart();
        await cartPage.proceedToCheckout();
      });
      await withStepContext('Verify the saved delivery address', async () => {
        await checkoutPage.assertDeliveryAddressMatches(account);
      });
      await withStepContext('Add a comment and place the order', async () => {
        await checkoutPage.addOrderComment(getOrderComment());
        await checkoutPage.placeOrder();
      });
      await withStepContext('Pay and confirm the order', async () => {
        await paymentPage.fillAndPay(getDummyPayment());
        await paymentPage.assertOrderConfirmed();
      });
    },
  );
});
