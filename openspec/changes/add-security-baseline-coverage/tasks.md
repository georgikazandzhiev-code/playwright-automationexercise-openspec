# Tasks — add-security-baseline-coverage

**Inputs:** [proposal.md](proposal.md) · [specs/security-baseline/spec.md](specs/security-baseline/spec.md) · [test-plan.md](test-plan.md)

Every task traces to a `TC-NN`, except where labelled **enabling scaffolding**. Tests are
written before the supporting code they need.

Seven cases are expected to fail because the site violates the requirement. For those, the
task is complete when the case has been **proved red**, the defect recorded in
`docs/requirements.md` §10, and the `test(...)` block commented out in place with
`// TODO: FIXME: D<n>`. A commented-out case is a reported finding; a `test.skip()` would be
a false green.

## 1. Tests (write first)

- [x] 1.1 API spec: plain HTTP is redirected `301` to HTTPS (covers TC-14)
- [x] 1.2 API spec: the storefront serves `x-frame-options`, `x-content-type-options`, `referrer-policy` (covers TC-15)
- [x] 1.3 API spec: `/api/productsList` serves the framing and sniffing headers (covers TC-16)
- [x] 1.4 API spec: `content-security-policy` and `strict-transport-security` are declared — **expected RED → D4** (covers TC-17)
- [x] 1.5 API spec: no `x-powered-by` banner — **expected RED → D5** (covers TC-18)
- [x] 1.6 UI spec: the session cookie is `HttpOnly` with a `SameSite` policy other than `None` (covers TC-19)
- [x] 1.7 UI spec: every cookie set by the site carries `Secure` — **expected RED → D6** (covers TC-20)
- [x] 1.8 UI spec: a session identifier captured before logout does not authenticate after it (covers TC-21)
- [x] 1.9 API spec: a foreign `Origin` receives no `access-control-allow-origin` (covers TC-22)
- [x] 1.10 API spec: every payload in the curated injection list returns `responseCode` 200, empty `products`, no diagnostic text (covers TC-23)
- [x] 1.11 UI spec: a script-markup search term renders the results page, raises no dialog, produces no result (covers TC-24)
- [x] 1.12 API spec: the user-detail body parses against a strict schema that admits no credential field (covers TC-25)
- [x] 1.13 API spec: an unauthenticated caller is refused the account's personal details — **expected RED → D7** (covers TC-26)
- [x] 1.14 API spec: a registered and an unregistered email produce indistinguishable answers — **expected RED → D8** (covers TC-27)
- [x] 1.15 API spec: a guest is served neither the checkout address block nor the payment form — **expected RED → D9** (covers TC-28)
- [x] 1.16 API spec: a guest is not served the `Account Deleted!` confirmation — **expected RED → D10** (covers TC-29)
- [x] 1.17 API spec: `POST /api/productsList` returns `responseCode` 405 (covers TC-30)
- [x] 1.18 API spec: `PUT /api/brandsList` returns `responseCode` 405 (covers TC-31)
- [x] 1.19 API spec: `DELETE /api/verifyLogin` returns `responseCode` 405 (covers TC-32)
- [x] 1.20 API spec: `verifyLogin` without a password returns `responseCode` 400 naming the missing parameter (covers TC-33)
- [x] 1.21 API spec: `verifyLogin` with unknown credentials returns `responseCode` 404 `User not found!` (covers TC-34)

## 2. Supporting code

- [x] 2.1 `SecurityProbeService` — issues a request and exposes its status, headers and body text without following redirects, so a redirect is assertable rather than invisible (covers TC-14 … TC-18, TC-22, TC-28, TC-29)
- [x] 2.2 `UserApiService` — `GET /api/getUserDetailByEmail` (API 14), returning the raw response for the negative cases and the parsed body for the positive one (covers TC-25, TC-26, TC-27)
- [x] 2.3 `ProductsApiService` — unsupported-verb probes for `productsList`, `brandsList`, `verifyLogin`, and the `verifyLogin` negative paths (covers TC-30 … TC-34)
- [x] 2.4 `UserDetailResponseSchema` as a `z.strictObject` over the observed fields — the strictness _is_ REQ-SEC-11's mechanism, so it is never relaxed (covers TC-25)
- [x] 2.5 `MethodNotAllowedResponseSchema` / reuse of `ApiErrorResponseSchema` for the 405 and 400 bodies (covers TC-30 … TC-34)
- [x] 2.6 `injection.data.ts` — curated script-markup and SQL payloads, synthetic only, no real credential or PII (covers TC-23, TC-24)
- [x] 2.7 `ProductsPage` — search action and a results-page assertion usable by the payload case (covers TC-24)
- [x] 2.8 `NavigationPage` / `LoginPage` — reuse for the login and logout steps of the cookie and replay cases; extend only if a gap appears (covers TC-19, TC-20, TC-21)
- [x] 2.9 Every new header name, route, expected header value and site literal into `src/utils/constants.ts` — no literal inline in a spec (covers TC-14 … TC-34)
- [x] 2.10 **Enabling scaffolding** — register any new service in `src/api/fixtures.ts` and any new page object in `src/ui/fixtures.ts`; no `new Service(...)` inside a test

## 3. Prove red — the step that makes green mean something

> The site already exists, so a new assertion can pass on its first run. See
> `openspec/AGENTS.md` § _Proving red_.

- [x] 3.1 TC-14: assert the redirect target is a different host; confirm red; restore (covers TC-14)
- [x] 3.2 TC-15, TC-16: assert a header value the site does not send (`SAMEORIGIN`); confirm red; restore (covers TC-15, TC-16)
- [x] 3.3 TC-19: assert `HttpOnly` is false; confirm red; restore (covers TC-19)
- [x] 3.4 TC-21: assert the replayed identifier _does_ authenticate; confirm red; restore (covers TC-21)
- [x] 3.5 TC-22: assert the foreign origin _is_ granted; confirm red; restore (covers TC-22)
- [x] 3.6 TC-23: add a payload that must match the catalogue and assert it returns nothing; confirm red; restore (covers TC-23)
- [x] 3.7 TC-24: assert the results heading is absent; confirm red; restore (covers TC-24)
- [x] 3.8 TC-25: add a `password` field to the strict schema's expectation and confirm the parse fails as designed; restore (covers TC-25)
- [x] 3.9 TC-30 … TC-34: swap each expected `responseCode`; confirm red; restore (covers TC-30, TC-31, TC-32, TC-33, TC-34)
- [x] 3.10 TC-17, TC-18, TC-20, TC-26, TC-27, TC-28, TC-29: these are red on first run by construction — that run **is** the proof. Capture the failure output verbatim as the defect evidence before commenting each out (covers TC-17, TC-18, TC-20, TC-26, TC-27, TC-28, TC-29)
- [x] 3.11 Record in the change report which assertions were proved red and how

## 4. Record the findings

- [x] 4.1 `docs/requirements.md` §10: add D4 (no CSP/HSTS), D5 (`x-powered-by` version disclosure), D6 (cookies not `Secure`), D7 (personal data served unauthenticated), D8 (account-existence disclosure), D9 (checkout/payment reachable as a guest), D10 (`Account Deleted!` served to a guest, via GET) — each with observed evidence and its OWASP category (covers TC-17, TC-18, TC-20, TC-26 … TC-29)
- [x] 4.2 Comment out each RED case in place with `// TODO: FIXME: D<n>` and a one-line statement of what it asserts, so the coverage loss is visible in the file (covers TC-17, TC-18, TC-20, TC-26 … TC-29)
- [x] 4.3 `report.md` for the change: what passed, what is red and why, and the OWASP coverage reached (covers TC-14 … TC-34)

## 5. Verify

- [x] 5.1 `npm run typecheck` clean
- [x] 5.2 `npm run spec:validate` clean
- [x] 5.3 `npm run test:api` — report actual counts and every failure verbatim
- [x] 5.4 `npm run test:ui` — report actual counts and every failure verbatim
- [x] 5.5 Confirm every account created during the run was deleted; no residue on the shared environment (C2)
- [x] 5.6 Confirm no test sends a real credential, real PII or a destructive request, and that no account other than this suite's own was touched
