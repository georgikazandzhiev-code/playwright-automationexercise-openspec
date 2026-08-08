import { test as base } from '@playwright/test';
import { buildSeededAccount, type SeededAccount } from '@api-data-providers/account-api.data';
import { AccountApiService } from './services/account-api.service';
import { ProductsApiService } from './services/products-api.service';
import { SecurityProbeService } from './services/security-probe.service';
import { UserApiService } from './services/user-api.service';

type ApiFixtures = {
  productsApi: ProductsApiService;
  accountApi: AccountApiService;
  userApi: UserApiService;
  securityProbe: SecurityProbeService;
  seededAccount: SeededAccount;
};

/**
 * API test fixtures — service layer only; specs must not call `request` directly.
 */
export const test = base.extend<ApiFixtures>({
  productsApi: async ({ request }, use) => {
    await use(new ProductsApiService(request));
  },
  accountApi: async ({ request }, use) => {
    await use(new AccountApiService(request));
  },
  userApi: async ({ request }, use) => {
    await use(new UserApiService(request));
  },
  securityProbe: async ({ request }, use) => {
    await use(new SecurityProbeService(request));
  },
  /**
   * An account that exists for the duration of one test, deleted afterwards even when
   * the test failed. Mirrors the UI fixture of the same name — the environment is
   * shared and never reset (constraint C2).
   */
  seededAccount: async ({ accountApi }, use) => {
    const account = buildSeededAccount();
    await accountApi.seedAccount(account.payload);
    await use(account);
    await accountApi.removeAccount(account.email, account.password);
  },
});

export { expect } from '@playwright/test';
