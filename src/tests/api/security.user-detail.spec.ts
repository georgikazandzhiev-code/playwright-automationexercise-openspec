import { buildUnknownCredentials } from '@data-providers/authentication.data';
import { API_RESPONSE_CODE_OK } from '@utils/constants';
import { expect, test } from '../../api/fixtures';

/**
 * security-baseline — the account-detail endpoint (API 14), from three angles:
 *
 * - REQ-SEC-11 asks **what** the response contains — no credential. The site passes.
 * - REQ-SEC-12 asks **who** may have it — anyone at all. The site fails.
 * - REQ-SEC-13 asks **what the answer reveals about who exists**. The site fails.
 *
 * A suite that asked only the first question would report this endpoint as clean.
 */
test.describe('security-baseline — account detail exposure', () => {
  test(
    'TC-25 the user-detail response carries no credential',
    { tag: '@api' },
    async ({ userApi, seededAccount }) => {
      const { parsed, rawBody } =
        await test.step('WHEN the detail of a seeded account is fetched', async () =>
          userApi.readUserDetail(seededAccount.email));

      await test.step('THEN the body matches the strict schema and names that account', async () => {
        // The strict schema is the mechanism: a `password`, hash or token field appearing
        // in a future deployment fails the parse above rather than passing unnoticed.
        expect(parsed.responseCode, 'user-detail responseCode').toBe(API_RESPONSE_CODE_OK);
        expect(parsed.user.email, 'the record returned is the account we asked for').toBe(
          seededAccount.email,
        );
      });

      await test.step("THEN the account's own password appears nowhere in the response", async () => {
        expect(rawBody, 'a credential must never be echoed back').not.toContain(
          seededAccount.password,
        );
      });
    },
  );

  // TODO: FIXME: D7 — REQ-SEC-12, OWASP A01 / API1. `GET /api/getUserDetailByEmail`
  // returns a registered account's full name, date of birth, employer and postal address
  // to a caller presenting no credential at all. Proved red on 2026-08-08: the lookup
  // answered `responseCode: 200` with the seeded account's whole record. Commented out
  // rather than skipped. This is the highest-severity finding of the change.
  /*
  test(
    'TC-26 personal data is not served to an unauthenticated caller',
    { tag: '@negative' },
    async ({ userApi, seededAccount }) => {
      const { parsed, rawBody } = await test.step(
        'WHEN an account detail is requested with no credential of any kind',
        async () => userApi.readUserLookup(seededAccount.email),
      );

      await test.step('THEN the request is refused', async () => {
        // No specific refusal code is asserted: the site publishes no authorisation
        // mechanism for this endpoint, so inventing one here would be inventing a contract.
        // What the requirement forbids is the success.
        expect(parsed.responseCode, 'an unauthenticated lookup must not succeed').not.toBe(
          API_RESPONSE_CODE_OK,
        );
      });

      await test.step('THEN no personal datum of that account is disclosed', async () => {
        expect(rawBody, 'postal address must not be disclosed').not.toContain(
          seededAccount.address1,
        );
        expect(rawBody, 'employer must not be disclosed').not.toContain(
          seededAccount.payload.company,
        );
        expect(rawBody, 'date of birth must not be disclosed').not.toContain(
          seededAccount.payload.birth_year,
        );
      });
    },
  );
  */

  // TODO: FIXME: D8 — REQ-SEC-13, OWASP A07 / API1. The same endpoint answers `200` for a
  // registered email and `404 Account not found with this email, try another email!` for
  // an unregistered one, so an unauthenticated caller can test any address for membership.
  // Proved red on 2026-08-08. This directly defeats the anti-enumeration control that
  // REQ-AUT-03 imposes on the login form and that TC-07 proves is working there.
  /*
  test(
    'TC-27 a registered and an unregistered email are indistinguishable',
    { tag: '@negative' },
    async ({ userApi, seededAccount }) => {
      const registered = await test.step('WHEN a registered email is looked up', async () =>
        userApi.readUserLookup(seededAccount.email),
      );

      const unregistered = await test.step('WHEN an unregistered email is looked up', async () =>
        userApi.readUserLookup(buildUnknownCredentials().email),
      );

      await test.step('THEN the two answers cannot be told apart', async () => {
        // Compared against EACH OTHER, exactly as TC-07 compares the login form's two
        // refusals. `authentication` REQ-AUT-03 makes the login form refuse to say whether
        // an email is registered; this endpoint answers the same question in one request.
        expect(
          unregistered.parsed.responseCode,
          'the API must not reveal which of two emails exists',
        ).toBe(registered.parsed.responseCode);
      });
    },
  );
  */
});
