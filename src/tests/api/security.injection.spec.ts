import { getInjectionPayloads } from '@api-data-providers/injection.data';
import { API_RESPONSE_CODE_OK, ERROR_LEAK_MARKERS } from '@utils/constants';
import { expect, test } from '../../api/fixtures';

/**
 * security-baseline — REQ-SEC-09: a search term is data, never code.
 *
 * The payload list is curated and read-only by construction (see `injection.data.ts`);
 * destructive and timing payloads are excluded because the site is a shared public
 * environment. REQ-SEC-10 covers the other branch — what happens when a term is rendered.
 */
test.describe('security-baseline — injection payloads in product search', () => {
  test(
    'TC-23 hostile search terms return no data and leak no error',
    { tag: '@negative' },
    async ({ productsApi }) => {
      for (const payload of getInjectionPayloads()) {
        await test.step(`WHEN the catalogue is searched with a ${payload.label}`, async () => {
          const { parsed, rawBody } = await productsApi.readSearchProduct(payload.value);

          // A tautology that returned the catalogue, or a union clause that returned rows,
          // would show up here as a non-empty array — that is the whole test.
          expect(parsed.responseCode, `${payload.label} responseCode`).toBe(API_RESPONSE_CODE_OK);
          expect(parsed.products, `${payload.label} must match no products`).toHaveLength(0);

          const normalizedBody = rawBody.toLowerCase();
          for (const marker of ERROR_LEAK_MARKERS) {
            expect(normalizedBody, `${payload.label} must not leak "${marker}"`).not.toContain(
              marker,
            );
          }
        });
      }
    },
  );
});
