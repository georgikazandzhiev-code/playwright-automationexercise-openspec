## Why

The suite has exactly one security assertion: TC-07, the anti-enumeration comparison in
`authentication`. Everything else it proves is functional. A security audit of the repo
against the OWASP Top 10 (2021) and the OWASP API Security Top 10 (2023) found the
following, and this change exists to close as much of it as black-box QA honestly can.

1. **Access control is untested — the highest-weight category is at zero.** Every existing
   test acts as one principal: the account it seeded. No test asks what happens when a
   _different_ caller, or _no_ caller, requests the same resource. That is precisely the
   blind spot BOLA (API1) and A01 describe.
2. **The one endpoint that serves personal data has no test at all.** `REQ-API-14`
   (`GET /api/getUserDetailByEmail`) is in the baseline and in `openspec/specs/public-api`,
   and nothing exercises it. It is also the only endpoint in the published list that
   returns a person's address, date of birth and employer.
3. **Injection has no coverage.** Search, the review form and the contact form all take
   free text. No payload has ever been sent at any of them, and nothing asserts what the
   site does with one when it renders it back.
4. **The response surface is unasserted.** No test reads a single response header or cookie
   flag. `harden-authentication-coverage`'s own test plan §4 recorded this as deferred to
   "a `session-security` capability that does not exist yet". This change is that
   capability, widened past cookies to the whole response surface.
5. **Five requirements that are already specified are still untested** — `REQ-API-02`,
   `REQ-API-04`, `REQ-API-09` (unsupported verbs must be refused) and `REQ-API-08`,
   `REQ-API-10` (`verifyLogin`'s negative paths). They cost one request each and they are
   the site's own stated contract. Leaving them untested while adding new security
   requirements would be incoherent.

### What the live probe found before a line of spec was written

Every requirement below was checked against `https://www.automationexercise.com` first, so
the spec states a contract we know the site can be measured against rather than a guess.
Read requests only; one account created and deleted per probe.

| Behaviour                                                      | Observed                                                                                       | Verdict        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------- |
| `http://` → `https://`                                         | `301` to the canonical HTTPS URL                                                               | secure         |
| `x-frame-options`, `x-content-type-options`, `referrer-policy` | `DENY`, `nosniff`, `same-origin`                                                               | secure         |
| `content-security-policy`, `strict-transport-security`         | absent on every response                                                                       | **defect D4**  |
| `x-powered-by`                                                 | `Phusion Passenger(R) 6.1.2` — framework and version                                           | **defect D5**  |
| `sessionid` cookie                                             | `HttpOnly`, `SameSite=Lax`                                                                     | secure         |
| `Secure` flag on `sessionid` / `csrftoken`                     | absent on both                                                                                 | **defect D6**  |
| Replaying a session cookie after logout                        | not honoured — header reverts to `Signup / Login`                                              | secure         |
| `Access-Control-Allow-Origin` for a foreign `Origin`           | not sent                                                                                       | secure         |
| XSS / SQL payloads at `POST /api/searchProduct`                | `responseCode` 200, `products: []`, no error text                                              | secure         |
| Credentials in any account response                            | `getUserDetailByEmail` returns no password field                                               | secure         |
| `GET /api/getUserDetailByEmail?email=<registered>`             | full name, DOB, employer and postal address returned to an **unauthenticated** caller          | **defect D7**  |
| Same endpoint, unregistered email                              | `404 Account not found with this email` — registered and unregistered are distinguishable      | **defect D8**  |
| `GET /checkout`, `GET /payment` unauthenticated                | `200`, rendering `Address Details` / `Place Order` and the `card_number` field                 | **defect D9**  |
| `GET /delete_account` unauthenticated                          | `200`, rendering `Account Deleted!` — and it is a `GET`, so it is state-changing by navigation | **defect D10** |

Eight of the fifteen requirements this change adds are already satisfied by the site. Seven
are not, and become defects D4 … D10 in `docs/requirements.md` §10.

### How a requirement the site fails is handled

`openspec/AGENTS.md` rule 3 forbids softening an assertion to match a bug, and rule 9
requires `npm test` to be clean before the change is reported complete. Those two collide
the moment a security requirement is genuinely violated.

The resolution, applied uniformly and stated here so it is a decision and not a drift:

- The test is **written in full**, asserting the secure contract, and **proved red** — the
  red run _is_ the evidence for the defect.
- It is then **commented out in place** with `// TODO: FIXME: D<n>` naming the defect, per
  the framework rule _no silent coverage drops_. Never `test.skip()`, which would report a
  false green to a reader counting skips.
- The defect is recorded in `docs/requirements.md` §10 with the observed evidence.

The requirement stays in the spec asserting what the site _should_ do. When the site is
fixed, uncommenting one block is the whole of the work.

## What Changes

- **ADD** a new capability `security-baseline` with `REQ-SEC-01 … REQ-SEC-15` — the
  cross-cutting security contract: transport, response headers, cookie hardening, session
  invalidation, cross-origin exposure, injection handling, credential exposure,
  authorisation of personal data, and authentication of state-changing routes.
- **ADD** `docs/requirements.md` §6.12 as the baseline section for `REQ-SEC-*`, and add
  security to §2.1 _In scope_ — today §2.2 lists neither, so the omission is currently
  silent rather than deliberate.
- **Implement** the five already-specified but never-tested `public-api` requirements —
  `REQ-API-02`, `REQ-API-04`, `REQ-API-08`, `REQ-API-09`, `REQ-API-10`. No spec delta:
  they already say what they say.
- **Record** defects D4 … D10 in `docs/requirements.md` §10, each with the probe evidence.
- **Close** the deferral recorded in `harden-authentication-coverage`'s test plan §4
  (cookie flags and session fixation, "deferred to a `session-security` capability that
  does not exist yet").

Not breaking: no existing requirement is weakened, removed, or re-scoped.

### What this change deliberately does not claim

Named here so that no reader mistakes silence for coverage. Each is out of reach of
black-box functional QA, not merely unfinished.

| Area                                                 | OWASP      | Why not, and who owns it                                                                                                                                                    |
| ---------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cryptographic strength, key management, data at rest | A02        | Not observable from outside. Needs a security review of the system we do not own                                                                                            |
| Vulnerable and outdated components                   | A06        | Belongs to dependency scanning in CI (`npm audit` / SCA), not to a Playwright spec. Flagged for the repo's own pipeline: the workflow runs `npm install` with no audit step |
| Security logging, monitoring and alerting            | A09        | No observable surface on a third-party site                                                                                                                                 |
| Software and data integrity, supply chain            | A08        | DevSecOps concern for the SUT's own pipeline                                                                                                                                |
| Rate limiting, brute force, resource consumption     | A04 / API4 | Volumetric by definition. Probing it on a shared public practice site would be abusive. Belongs to a k6 change with explicit thresholds, if ever                            |
| SSRF                                                 | A10 / API7 | **Not applicable** — no published endpoint accepts a URL, host or webhook target                                                                                            |
| Broken function-level authorisation                  | API5       | **Not applicable** — the site publishes no roles, so there is no privileged function to deny a lower role. Recorded as N/A rather than as a gap                             |
| Server-side password policy                          | A07        | The site publishes none (`docs/requirements.md` Q3). Nothing to assert against                                                                                              |

## Capabilities

### New Capabilities

- `security-baseline` — the site's cross-cutting security contract, `REQ-SEC-01 …
REQ-SEC-15`. It is a capability rather than a set of additions to the existing eleven
  because these requirements are not properties of one feature: the same header contract
  binds the storefront and the API, and the same authorisation contract binds checkout and
  account deletion. Splitting them across `public-api`, `authentication` and `checkout`
  would scatter one contract into three partial ones.

### Modified Capabilities

_(none — `public-api`'s requirements are implemented, not changed)_

## Impact

| Area                                       | Effect                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openspec/specs/security-baseline/spec.md` | Created on archive — fifteen requirements                                                                                                              |
| `docs/requirements.md`                     | New §6.12 (`REQ-SEC-*`); §2.1 gains security; §10 gains D4 … D10                                                                                       |
| `src/tests/api/`                           | New `security-*.spec.ts` and `public-api-negative.spec.ts`                                                                                             |
| `src/tests/ui/`                            | New `security-*.spec.ts` for the cookie, session-replay and rendered-payload cases                                                                     |
| `src/api/services/`                        | New `user-api.service.ts` (API 14) and `security-probe.service.ts` (headers, verbs)                                                                    |
| `src/api/schemas/`                         | `UserDetailResponseSchema` as a `z.strictObject` — a credential field appearing in the response fails the parse, which is REQ-SEC-11's whole mechanism |
| `src/api/data-providers/`                  | `injection.data.ts` — curated XSS and SQL payloads, synthetic only                                                                                     |
| `src/utils/constants.ts`                   | Header names, protected routes, expected header values                                                                                                 |
| Runtime                                    | Roughly 25 extra requests per run, three seeded accounts, each deleted in teardown                                                                     |

## Risks

| Risk                                                                         | Mitigation                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A security test that fails looks like a broken suite rather than a finding   | Seven are commented out with `// TODO: FIXME: D<n>` after being proved red, and every one is listed in §10 and in the change report. A reader sees findings, not noise                                                                  |
| Probing a third-party site could be abusive                                  | Read-only, single requests, no volumetric or brute-force testing, no access to any account but the ones this suite creates and deletes. The abusive categories are excluded above with their reasons                                    |
| Cloudflare sits in front of the site and can alter headers                   | Accepted and recorded: the assertions describe what a client observes, which is the only thing a black-box test can describe. A header appearing or vanishing at the edge is still a change in the site's security posture as delivered |
| `x-powered-by` and the missing CSP may be judged out of the vendor's control | They are still reported. Whether the owner acts is not a QA decision; recording them is                                                                                                                                                 |
| Fifteen new requirements is a large delta for one change                     | They share one contract and one evidence run. Splitting them would produce changes that each fail the coverage gate for want of the others' fixtures                                                                                    |
