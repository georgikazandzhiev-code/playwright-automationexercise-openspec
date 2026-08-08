/**
 * Curated injection payloads for REQ-SEC-09 and REQ-SEC-10.
 *
 * Synthetic only — no real credential, token or personal datum appears here, and none
 * ever should: these strings are sent to a third-party site and printed in reports.
 *
 * Every payload is **read-only by construction**. Destructive SQL (`DROP`, `DELETE`,
 * `UPDATE`) and timing payloads (`SLEEP`) are deliberately excluded: the site under test
 * is a shared public environment, and a payload that succeeded would damage it for
 * everyone. A test that can only be safely run if the application is *not* vulnerable is
 * not a security test — it is a gamble. What we assert instead is that the tautology
 * returns nothing and the union clause returns nothing, which is the same evidence
 * without the blast radius.
 */
export type InjectionPayload = {
  /** Short label naming the class of attack — used as the assertion message. */
  label: string;
  /** The value sent as the search term. */
  value: string;
};

const INJECTION_PAYLOADS: readonly InjectionPayload[] = [
  { label: 'script tag', value: '<script>alert(1)</script>' },
  { label: 'event-handler markup', value: '<img src=x onerror=alert(1)>' },
  { label: 'SQL tautology', value: "' OR '1'='1" },
  { label: 'SQL union read', value: "top' UNION SELECT NULL--" },
  { label: 'template expression', value: '{{7*7}}' },
  { label: 'path traversal', value: '../../etc/passwd' },
] as const;

/**
 * The payloads a search term is probed with (REQ-SEC-09).
 */
export const getInjectionPayloads = (): readonly InjectionPayload[] => INJECTION_PAYLOADS;

/**
 * The single payload submitted through the browser to prove the render branch
 * (REQ-SEC-10). Script markup rather than an event handler, because a `<script>` element
 * that survived escaping would execute on parse — the strongest signal available.
 */
export const getRenderedXssPayload = (): InjectionPayload => INJECTION_PAYLOADS[0];
