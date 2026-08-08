import { buildUnknownCredentials } from '@data-providers/authentication.data';
import { test } from '../../api/fixtures';
import { withStepContext } from '@utils/assert-context';

/**
 * public-api — the refusal paths that were specified in the baseline and never tested:
 * REQ-API-02, REQ-API-04 and REQ-API-09 (unsupported methods) and REQ-API-08, REQ-API-10
 * (`verifyLogin`'s negative outcomes).
 *
 * They live in the security change because a refusal nobody has ever seen the site perform
 * is not a control — it is an assumption. Unsupported verbs are the site's own attack
 * surface reduction (OWASP A05); the `verifyLogin` pair is API2, Broken Authentication.
 */
test.describe('public-api — unsupported methods are refused', () => {
  test(
    'TC-30 POST is refused by the products endpoint (API 2)',
    { tag: '@negative' },
    async ({ productsApi }) => {
      await withStepContext('POST the read-only catalogue endpoint', async () => {
        await productsApi.assertProductsListRefusesPost();
      });
    },
  );

  test(
    'TC-31 PUT is refused by the brands endpoint (API 4)',
    { tag: '@negative' },
    async ({ productsApi }) => {
      await withStepContext('PUT the read-only brands endpoint', async () => {
        await productsApi.assertBrandsListRefusesPut();
      });
    },
  );

  test(
    'TC-32 DELETE is refused by the login-verification endpoint (API 9)',
    { tag: '@negative' },
    async ({ accountApi }) => {
      await withStepContext('DELETE the POST-only verifyLogin endpoint', async () => {
        await accountApi.assertVerifyLoginRefusesDelete();
      });
    },
  );
});

test.describe('public-api — verifyLogin refuses incomplete and unknown credentials', () => {
  test(
    'TC-33 verifyLogin without a password is a bad request (API 8)',
    { tag: '@negative' },
    async ({ accountApi }) => {
      const unknown = buildUnknownCredentials();
      await withStepContext('POST verifyLogin carrying only an email', async () => {
        await accountApi.assertVerifyLoginRejectsMissingPassword(unknown.email);
      });
    },
  );

  test(
    'TC-34 verifyLogin with credentials of no account reports no user (API 10)',
    { tag: '@negative' },
    async ({ accountApi }) => {
      const unknown = buildUnknownCredentials();
      await withStepContext('POST verifyLogin with credentials matching no account', async () => {
        await accountApi.assertVerifyLoginRejectsUnknownCredentials(
          unknown.email,
          unknown.password,
        );
      });
    },
  );
});
