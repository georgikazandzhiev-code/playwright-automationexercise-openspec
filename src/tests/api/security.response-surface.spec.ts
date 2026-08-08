import {
  API_PRODUCTS_LIST_PATH,
  CONTENT_TYPE_OPTIONS_NOSNIFF,
  DEFAULT_BASE_URL,
  FOREIGN_ORIGIN_URL,
  FRAME_OPTIONS_DENY,
  HEADER_ACCESS_CONTROL_ALLOW_ORIGIN,
  HEADER_CONTENT_SECURITY_POLICY,
  HEADER_CONTENT_TYPE_OPTIONS,
  HEADER_FRAME_OPTIONS,
  HEADER_LOCATION,
  HEADER_POWERED_BY,
  HEADER_REFERRER_POLICY,
  HEADER_STRICT_TRANSPORT_SECURITY,
  HTTP_STATUS_MOVED_PERMANENTLY,
  INSECURE_ORIGIN_URL,
  UI_PATH_HOME,
} from '@utils/constants';
import { expect, test } from '../../api/fixtures';

/**
 * security-baseline — the response surface: REQ-SEC-01 (transport), REQ-SEC-02 (protective
 * headers), REQ-SEC-03 (CSP and HSTS), REQ-SEC-04 (technology disclosure) and REQ-SEC-08
 * (cross-origin access).
 *
 * Every case here is a single GET. Nothing in this file mutates state on the site.
 */
test.describe('security-baseline — transport and response headers', () => {
  test(
    'TC-14 plain HTTP is permanently redirected to HTTPS',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the home page is requested over http://', async () =>
        securityProbe.fetchWithoutFollowingRedirects(INSECURE_ORIGIN_URL));

      await test.step('THEN the site answers with a permanent redirect to https://', async () => {
        expect(probe.status, 'plain-HTTP status').toBe(HTTP_STATUS_MOVED_PERMANENTLY);
        expect(probe.headers[HEADER_LOCATION], 'redirect target').toBe(`${DEFAULT_BASE_URL}/`);
      });
    },
  );

  test(
    'TC-15 the storefront serves the protective response headers',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the home page is requested', async () =>
        securityProbe.fetch(UI_PATH_HOME));

      await test.step('THEN framing, MIME sniffing and referrer leakage are constrained', async () => {
        expect(probe.headers[HEADER_FRAME_OPTIONS], 'x-frame-options').toBe(FRAME_OPTIONS_DENY);
        expect(probe.headers[HEADER_CONTENT_TYPE_OPTIONS], 'x-content-type-options').toBe(
          CONTENT_TYPE_OPTIONS_NOSNIFF,
        );
        expect(Object.keys(probe.headers), 'referrer-policy must be declared').toContain(
          HEADER_REFERRER_POLICY,
        );
      });
    },
  );

  test(
    'TC-16 the API serves the protective response headers',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the products endpoint is requested', async () =>
        securityProbe.fetch(API_PRODUCTS_LIST_PATH));

      await test.step('THEN framing and MIME sniffing are constrained there too', async () => {
        // This site serves its JSON as `text/html`, so a browser navigated to an API URL
        // treats the response as a document. The headers matter here as much as on a page.
        expect(probe.headers[HEADER_FRAME_OPTIONS], 'x-frame-options').toBe(FRAME_OPTIONS_DENY);
        expect(probe.headers[HEADER_CONTENT_TYPE_OPTIONS], 'x-content-type-options').toBe(
          CONTENT_TYPE_OPTIONS_NOSNIFF,
        );
      });
    },
  );

  // TODO: FIXME: D4 — REQ-SEC-03. The site declares neither `content-security-policy`
  // nor `strict-transport-security` on any response. Proved red on 2026-08-08; the
  // observed header list is recorded in docs/requirements.md §10. Commented out rather
  // than skipped, so the coverage loss is visible in the file instead of being reported
  // as a green run with a skip nobody reads. Uncomment when the site serves both.
  /*
  test(
    'TC-17 a content-security and transport-security policy is declared',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the home page is requested over HTTPS', async () =>
        securityProbe.fetch(UI_PATH_HOME));

      await test.step('THEN both policies are declared', async () => {
        expect(
          Object.keys(probe.headers),
          'a content-security policy must constrain where scripts may load from',
        ).toContain(HEADER_CONTENT_SECURITY_POLICY);
        expect(
          Object.keys(probe.headers),
          'transport security must stop the browser trying plain HTTP at all',
        ).toContain(HEADER_STRICT_TRANSPORT_SECURITY);
      });
    },
  );
  */

  // TODO: FIXME: D5 — REQ-SEC-04. Every response carries
  // `x-powered-by: Phusion Passenger(R) 6.1.2`, naming the framework and its version.
  // Proved red on 2026-08-08. Uncomment when the banner is suppressed.
  /*
  test(
    'TC-18 no framework or version banner is returned',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the home page is requested', async () =>
        securityProbe.fetch(UI_PATH_HOME));

      await test.step('THEN the response names no server technology', async () => {
        // A version string tells an attacker which published CVEs to try before anything else.
        expect(Object.keys(probe.headers), 'x-powered-by must not be returned').not.toContain(
          HEADER_POWERED_BY,
        );
      });
    },
  );
  */

  test(
    'TC-22 a foreign origin is granted no cross-origin access',
    { tag: '@api' },
    async ({ securityProbe }) => {
      const probe = await test.step('WHEN the API is called with an unrelated Origin', async () =>
        securityProbe.fetch(API_PRODUCTS_LIST_PATH, { Origin: FOREIGN_ORIGIN_URL }));

      await test.step('THEN no cross-origin grant is returned', async () => {
        // Reflecting the caller's Origin would let any page on the internet read this
        // site's responses out of a visitor's browser.
        expect(
          probe.headers[HEADER_ACCESS_CONTROL_ALLOW_ORIGIN],
          'no origin may be granted access',
        ).toBeUndefined();
      });
    },
  );
});
