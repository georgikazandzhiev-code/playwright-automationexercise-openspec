import { APIRequestContext } from '@playwright/test';

/**
 * What a client observes about a single response, reduced to the three things the
 * security baseline asserts on: the status line, the headers and the body text.
 */
export type ProbeResult = {
  status: number;
  /** Header names are lower-cased by Playwright, so lookups here are case-stable. */
  headers: Record<string, string>;
  body: string;
};

/**
 * Read-only probes of the site's response surface (REQ-SEC-01 … REQ-SEC-04, REQ-SEC-08,
 * REQ-SEC-14, REQ-SEC-15).
 *
 * Deliberately dumb: it issues one request and hands back what came back. The security
 * requirements differ in what they assert, not in how the request is made, so putting the
 * assertions here would spread one contract across six near-identical methods.
 *
 * Every method is a GET. Nothing in this service mutates state on the site.
 */
export class SecurityProbeService {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Fetch a path or absolute URL, following redirects as a browser would.
   * @param url - Path relative to `baseURL`, or an absolute URL.
   * @param headers - Extra request headers, e.g. an `Origin` or a replayed `Cookie`.
   */
  fetch = async (url: string, headers?: Record<string, string>): Promise<ProbeResult> => {
    const response = await this.request.get(url, { headers });
    return { status: response.status(), headers: response.headers(), body: await response.text() };
  };

  /**
   * Fetch without following redirects, so that the redirect itself is observable.
   * Proving REQ-SEC-01 requires seeing the `301`, which a followed redirect hides.
   * @param url - Path relative to `baseURL`, or an absolute URL.
   */
  fetchWithoutFollowingRedirects = async (url: string): Promise<ProbeResult> => {
    const response = await this.request.get(url, { maxRedirects: 0 });
    return { status: response.status(), headers: response.headers(), body: await response.text() };
  };
}
