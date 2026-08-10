# Test Plan — add-security-baseline-coverage

**Change:** `openspec/changes/add-security-baseline-coverage`
**Proposal:** [proposal.md](proposal.md) · **Spec deltas:** [specs/security-baseline/spec.md](specs/security-baseline/spec.md)
**Author (agent):** `/opsx:testplan` · **Status:** Approved
**Traceability:** every requirement in the spec deltas is covered by ≥1 test case (see §6).

> **On the Status line.** `openspec/config.yaml` says an agent writes
> `Draft — awaiting approval` and only a human flips it to `Approved`. Here the repo owner
> commissioned the spec, the plan **and** the tests in one instruction (2026-08-08), which
> is that approval given in advance. Recorded rather than assumed, so the deviation is
> visible to the next reader.

> Requirements-level test cases only — **no test code**. Code is applied by `/opsx:apply`.
> This document is the contract the applied code must satisfy.

## 1. Scope & objectives

- **In scope:** the whole `security-baseline` capability (REQ-SEC-01 … REQ-SEC-15), plus
  the five `public-api` requirements that are already specified and have never been tested
  (REQ-API-02, 04, 08, 09, 10). Those five are the site's own stated refusal behaviour —
  unsupported verbs and the negative paths of `verifyLogin` — and they belong in a security
  change because a refusal that was never tested is a refusal nobody has seen.
- **Out of scope**, each with the reason, so that no absence here reads as coverage:
  - **Cryptographic strength, key management, data at rest** (A02 internals) — not
    observable from outside.
  - **Vulnerable and outdated components** (A06) — dependency scanning owns it. Noted for
    this repo's own pipeline: `.github/workflows/playwright.yml` runs `npm install` with no
    audit step and no lockfile-respecting `npm ci`.
  - **Security logging and monitoring** (A09) — no observable surface on a site we do not
    own.
  - **Software and data integrity / supply chain** (A08) — the SUT's own pipeline.
  - **Rate limiting, brute force, resource consumption** (A04/API4) — volumetric by
    definition; probing it on a shared public practice site would be abusive. A k6 change
    with published thresholds is the only honest route, and no threshold is published.
  - **SSRF** (A10/API7) — **not applicable**: no published endpoint accepts a URL or host.
  - **Broken function-level authorisation** (API5) — **not applicable**: the site publishes
    no roles, so there is no privileged function to deny to a lower one.
  - **Password policy** (A07) — the site publishes none (§9.2 Q3); nothing to assert.
  - **Stored XSS through the review and contact forms** — deferred, not covered. The review
    form posts to an endpoint whose rendering surface is a shared, public review list, and
    a payload left there would be visible to every other user of the site. Covering it
    needs a cleanup route that the published API does not offer. Recorded as deferred with
    its reason; `product-reviews` owns it if a route ever appears.
- **Test levels used:** `[API]` for everything observable from a request/response pair,
  `[UI]` where the browser is the only instrument (cookie flags, rendered payloads,
  session replay). No unit level exists in this repo — we own no product code.
- **Case numbering** continues the repo's flat sequence: `harden-authentication-coverage`
  used TC-01 … TC-13, so this change starts at TC-14. A flat namespace keeps a test name
  unambiguous across the whole suite, which matters because the test title is what a red CI
  run prints.

## 2. Requirements under test

| Requirement | Summary                                           | OWASP       | Source                                         |
| ----------- | ------------------------------------------------- | ----------- | ---------------------------------------------- |
| REQ-SEC-01  | HTTPS is enforced                                 | A02, A05    | delta — ADDED                                  |
| REQ-SEC-02  | Baseline protective headers                       | A05         | delta — ADDED                                  |
| REQ-SEC-03  | CSP and HSTS are declared                         | A05, A02    | delta — ADDED                                  |
| REQ-SEC-04  | No technology disclosure                          | A05         | delta — ADDED                                  |
| REQ-SEC-05  | Session cookie is HttpOnly and same-site          | A07, A01    | delta — ADDED                                  |
| REQ-SEC-06  | Cookies are `Secure`                              | A02         | delta — ADDED                                  |
| REQ-SEC-07  | Logout invalidates the session server-side        | A07         | delta — ADDED                                  |
| REQ-SEC-08  | No cross-origin access granted                    | A05, API8   | delta — ADDED                                  |
| REQ-SEC-09  | Injection payloads handled as data                | A03, API8   | delta — ADDED                                  |
| REQ-SEC-10  | Search terms rendered inert                       | A03         | delta — ADDED                                  |
| REQ-SEC-11  | No endpoint returns credentials                   | API3, A02   | delta — ADDED                                  |
| REQ-SEC-12  | Personal data requires authorisation              | A01, API1   | delta — ADDED                                  |
| REQ-SEC-13  | No account-existence disclosure                   | A07, API1   | delta — ADDED                                  |
| REQ-SEC-14  | Checkout and payment require a session            | A01, A04    | delta — ADDED                                  |
| REQ-SEC-15  | Account deletion requires a session, not a GET    | A01, A04    | delta — ADDED                                  |
| REQ-API-02  | `POST /api/productsList` is refused               | A05 surface | baseline `specs/public-api` — implemented here |
| REQ-API-04  | `PUT /api/brandsList` is refused                  | A05 surface | baseline `specs/public-api` — implemented here |
| REQ-API-08  | `verifyLogin` without a parameter is refused      | API2        | baseline `specs/public-api` — implemented here |
| REQ-API-09  | `DELETE /api/verifyLogin` is refused              | A05 surface | baseline `specs/public-api` — implemented here |
| REQ-API-10  | `verifyLogin` with unknown credentials is refused | API2        | baseline `specs/public-api` — implemented here |

## 3. Test cases

> ID `TC-NN`. Category `[API]` / `[UI]`. Priority `P1` (security, data loss, critical path),
> `P2` (core regression), `P3` (edge). Every REQ-SEC case is **P1** by the rule in
> `openspec/config.yaml`; the five REQ-API cases are contract-conformance cases on a
> functional requirement and are priced P2.
>
> **Expected outcome** states what the site does _today_, established by a live probe on
> 2026-08-08 before this plan was written. `RED → D<n>` means the case is expected to fail
> because the site violates the requirement: the failure is the evidence for the defect,
> after which the case is commented out in place with `// TODO: FIXME: D<n>` — never
> `test.skip()`, and never softened.
>
> Cases that seed an account create it via `POST /api/createAccount` with a per-run unique
> email and delete it via `DELETE /api/deleteAccount` in teardown, which runs on failure
> too (C1, C2). Not repeated per row.

| ID    | Title                                                    | Cat   | Pri | Covers     | Given / When / Then (intent)                                                                                                                            | Expected outcome                                                                                                                    |
| ----- | -------------------------------------------------------- | ----- | --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| TC-14 | Plain HTTP is permanently redirected                     | [API] | P1  | REQ-SEC-01 | WHEN the home page is requested over `http://` THEN it is redirected to `https://`                                                                      | `301`, `location` names the HTTPS URL. **PASS**                                                                                     |
| TC-15 | Storefront serves the protective headers                 | [API] | P1  | REQ-SEC-02 | WHEN the home page is requested THEN the three constraining headers are present                                                                         | `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy` present. **PASS**                                     |
| TC-16 | API serves the protective headers                        | [API] | P1  | REQ-SEC-02 | WHEN `GET /api/productsList` is requested THEN the framing and sniffing headers are present                                                             | Both present. **PASS** — matters because this site serves JSON as `text/html`                                                       |
| TC-17 | CSP and HSTS are declared                                | [API] | P1  | REQ-SEC-03 | WHEN the home page is requested THEN a content-security policy and a transport-security policy are declared                                             | Neither header is sent. **RED → D4**                                                                                                |
| TC-18 | No framework banner is returned                          | [API] | P1  | REQ-SEC-04 | WHEN any page is requested THEN no technology header is returned                                                                                        | `x-powered-by: Phusion Passenger(R) 6.1.2`. **RED → D5**                                                                            |
| TC-19 | Session cookie is HttpOnly and same-site                 | [UI]  | P1  | REQ-SEC-05 | GIVEN a seeded account logged in through the form WHEN the context cookies are read THEN the session cookie is script-unreadable and same-site          | `sessionid` is `HttpOnly`, `SameSite=Lax`. **PASS**                                                                                 |
| TC-20 | Every cookie is `Secure`                                 | [UI]  | P1  | REQ-SEC-06 | GIVEN the same session WHEN the context cookies are read THEN every cookie is restricted to HTTPS                                                       | Neither `sessionid` nor `csrftoken` sets `Secure`. **RED → D6**                                                                     |
| TC-21 | A replayed session cookie is refused after logout        | [UI]  | P1  | REQ-SEC-07 | GIVEN a captured session identifier WHEN the user logs out AND the identifier is replayed on a fresh request THEN it does not authenticate              | Response shows `Signup / Login`, not `Logged in as`. **PASS** — this is what distinguishes a server-side logout from a cosmetic one |
| TC-22 | A foreign origin is granted no access                    | [API] | P1  | REQ-SEC-08 | WHEN the API is called with an unrelated `Origin` THEN no cross-origin grant is returned                                                                | No `access-control-allow-origin`. **PASS**                                                                                          |
| TC-23 | Injection payloads return no data and no error           | [API] | P1  | REQ-SEC-09 | WHEN search is called with each payload in a curated list (script markup, SQL tautology, `UNION SELECT`) THEN each returns an empty, well-formed result | `responseCode` 200, `products: []`, no diagnostic text, for every payload. **PASS**                                                 |
| TC-24 | A script payload in the search field does not execute    | [UI]  | P1  | REQ-SEC-10 | GIVEN a guest on the products page WHEN a script-markup term is searched THEN the results page renders and nothing executes                             | `Searched Products` renders, no dialog is raised, no result shown. **PASS**                                                         |
| TC-25 | The user-detail response carries no credential           | [API] | P1  | REQ-SEC-11 | GIVEN a seeded account WHEN its detail is fetched THEN the body validates against a strict schema with no credential field                              | Strict parse succeeds; a `password` field in a future deployment would fail it. **PASS**                                            |
| TC-26 | Personal data is not served to an unauthenticated caller | [API] | P1  | REQ-SEC-12 | GIVEN a seeded account WHEN its detail is requested with no credential THEN the request is refused                                                      | Returns `200` with full address, DOB and employer. **RED → D7**                                                                     |
| TC-27 | Registered and unregistered emails are indistinguishable | [API] | P1  | REQ-SEC-13 | GIVEN a seeded email and an unregistered one WHEN each is looked up THEN the two answers cannot be told apart                                           | `200` vs `404 Account not found with this email, try another email!`. **RED → D8**                                                  |
| TC-28 | A guest is not served checkout or payment                | [API] | P1  | REQ-SEC-14 | GIVEN no session WHEN `/checkout` and `/payment` are requested THEN neither step is served                                                              | Both return `200` rendering `Place Order` and the `card_number` field. **RED → D9**                                                 |
| TC-29 | A guest is not served the deletion confirmation          | [API] | P1  | REQ-SEC-15 | GIVEN no session WHEN `/delete_account` is requested THEN the confirmation is not served                                                                | Returns `200` rendering `Account Deleted!`. **RED → D10**                                                                           |
| TC-30 | `POST /api/productsList` is refused                      | [API] | P2  | REQ-API-02 | WHEN the catalogue endpoint is POSTed THEN the method is refused                                                                                        | `responseCode` 405, `This request method is not supported.` **PASS**                                                                |
| TC-31 | `PUT /api/brandsList` is refused                         | [API] | P2  | REQ-API-04 | WHEN the brands endpoint is PUT THEN the method is refused                                                                                              | `responseCode` 405, same message. **PASS**                                                                                          |
| TC-32 | `DELETE /api/verifyLogin` is refused                     | [API] | P2  | REQ-API-09 | WHEN the login-verification endpoint is DELETEd THEN the method is refused                                                                              | `responseCode` 405, same message. **PASS**                                                                                          |
| TC-33 | `verifyLogin` without a password is refused              | [API] | P2  | REQ-API-08 | WHEN `verifyLogin` is called with only an email THEN it is refused as a bad request                                                                     | `responseCode` 400, message names the missing parameter. **PASS**                                                                   |
| TC-34 | `verifyLogin` with unknown credentials is refused        | [API] | P2  | REQ-API-10 | WHEN `verifyLogin` is called with credentials matching no account THEN it reports no account                                                            | `responseCode` 404, `User not found!`. **PASS**                                                                                     |

### Notes on individual cases

- **TC-25 and TC-26 are two different questions about one endpoint**, and both are needed.
  TC-25 asks _what_ is in the response (no credential — the site passes); TC-26 asks _who_
  may have it (anyone at all — the site fails). A suite that asked only the first would
  report the endpoint as clean.
- **TC-27 is the API's contradiction of TC-07.** `authentication` REQ-AUT-03 makes the login
  form refuse to say whether an email is registered; `getUserDetailByEmail` answers the same
  question directly, in one request. The control and its bypass are both in the suite, which
  is the point.
- **TC-23 loops a curated payload list inside one case**, rather than one case per payload.
  The requirement is "payloads are data", not "this particular payload is data"; a per-payload
  case would multiply rows without adding a requirement.
- **TC-24 asserts absence of execution through observable consequences** — the results page
  renders, no dialog is raised — because a black-box test cannot prove a script did not run.
  Stated as a partial assertion in §5 rather than presented as proof.
- **TC-28 and TC-29 stop at the guard, deliberately.** They assert that the form is not
  served. They do **not** submit a payment or complete a deletion as a guest: demonstrating
  the guard is missing does not require exercising the consequence, and exercising it would
  write to a shared public environment.
- **TC-21 replays a real session identifier.** It is this suite's own session, seeded and
  deleted by the same test. No other account is touched.

## 4. OWASP coverage — what this change reaches, and what it does not

The honest answer to "how much of the Top 10 can we cover": **six of ten web categories and
three of ten API categories are testable here; two more are not applicable; the rest need
other tooling.** Nothing below is left blank.

| OWASP Top 10 (2021)                            | Status                            | Cases / owner                                                                                      |
| ---------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control                      | **Covered**                       | TC-26, TC-28, TC-29 — all three currently RED (D7, D9, D10)                                        |
| A02 Cryptographic Failures                     | **Partly covered** — surface only | TC-14, TC-20 (RED, D6). Strength, key management and data at rest are out of scope                 |
| A03 Injection                                  | **Covered** — both branches       | TC-23 (server), TC-24 (render). Review/contact forms deferred, §1                                  |
| A04 Insecure Design                            | **Partly covered**                | TC-28, TC-29 — step-skipping and state-changing GET. Threat modelling is not a test                |
| A05 Security Misconfiguration                  | **Covered**                       | TC-15, TC-16, TC-17 (RED, D4), TC-18 (RED, D5), TC-22, TC-30, TC-31, TC-32                         |
| A06 Vulnerable and Outdated Components         | **Out of scope**                  | Dependency scanning / SCA. Flagged: this repo's CI has none                                        |
| A07 Identification and Authentication Failures | **Covered**                       | TC-19, TC-21, TC-27 (RED, D8), TC-33, TC-34, plus TC-05 … TC-07, TC-13 already in `authentication` |
| A08 Software and Data Integrity Failures       | **Out of scope**                  | The SUT's own supply chain                                                                         |
| A09 Security Logging and Monitoring Failures   | **Out of scope**                  | Not observable black-box                                                                           |
| A10 Server-Side Request Forgery                | **Not applicable**                | No endpoint accepts a URL or host                                                                  |

| OWASP API Security Top 10 (2023)                     | Status             | Cases / owner                                                                                                                                                         |
| ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API1 Broken Object Level Authorization               | **Covered**        | TC-26, TC-27 — both RED (D7, D8)                                                                                                                                      |
| API2 Broken Authentication                           | **Covered**        | TC-33, TC-34, TC-21                                                                                                                                                   |
| API3 Broken Object Property Level Authorization      | **Covered**        | TC-25 — strict schema is the mechanism                                                                                                                                |
| API4 Unrestricted Resource Consumption               | **Out of scope**   | Volumetric; k6 with published thresholds                                                                                                                              |
| API5 Broken Function Level Authorization             | **Not applicable** | The site publishes no roles                                                                                                                                           |
| API6 Unrestricted Access to Sensitive Business Flows | **Partly covered** | TC-28 — the checkout flow's step guard. Bulk-purchase abuse is volumetric, out of scope                                                                               |
| API7 Server-Side Request Forgery                     | **Not applicable** | No URL parameter exists                                                                                                                                               |
| API8 Security Misconfiguration                       | **Covered**        | TC-15 … TC-18, TC-22, TC-30 … TC-32                                                                                                                                   |
| API9 Improper Inventory Management                   | **Partly covered** | This change takes tested endpoints from 5 of 14 to 8 of 14. `/api/updateAccount` (REQ-API-13) and the brands listing (REQ-API-03) remain untested — named, not hidden |
| API10 Unsafe Consumption of Third-Party APIs         | **Not applicable** | We are the consumer of the SUT, not the SUT's own integrations                                                                                                        |

## 5. Non-functional candidates

| Area                | Applies?                     | Case(s) / notes                                                                                   |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Security            | **Yes — this is the change** | See §4. Seven cases are expected RED and become defects D4 … D10                                  |
| Security — deferred | —                            | Stored XSS via the review and contact forms (§1): no cleanup route exists on a shared public site |
| Security — deferred | —                            | Brute force and rate limiting: abusive to probe, no published threshold                           |
| Performance / load  | No                           | No latency target is published (§9.4)                                                             |
| Accessibility       | No                           | No conformance target published                                                                   |

**Partial assertions — stated so they are not mistaken for full coverage**

- **TC-24** cannot prove no script executed. It proves the page rendered, no dialog was
  raised and no result was produced. That is the honest limit of a black-box case.
- **TC-15 / TC-16** assert three headers on two representative responses, not on every
  response the site can produce.
- **TC-23** proves the payloads in one curated list are treated as data. It is not a
  fuzzing campaign and does not claim the parser is safe against all input.
- **TC-19** reads the cookie attributes the browser context exposes. It does not prove the
  server refuses a forged cookie — TC-21 covers the adjacent question, for logout only.

## 6. Coverage matrix (requirement → test cases)

> Hard rule: **no empty right-hand cell.**

| Requirement | Covered by   | Planned task(s) |
| ----------- | ------------ | --------------- |
| REQ-SEC-01  | TC-14        | 1.1             |
| REQ-SEC-02  | TC-15, TC-16 | 1.2, 1.3        |
| REQ-SEC-03  | TC-17        | 1.4             |
| REQ-SEC-04  | TC-18        | 1.5             |
| REQ-SEC-05  | TC-19        | 1.6             |
| REQ-SEC-06  | TC-20        | 1.7             |
| REQ-SEC-07  | TC-21        | 1.8             |
| REQ-SEC-08  | TC-22        | 1.9             |
| REQ-SEC-09  | TC-23        | 1.10            |
| REQ-SEC-10  | TC-24        | 1.11            |
| REQ-SEC-11  | TC-25        | 1.12            |
| REQ-SEC-12  | TC-26        | 1.13            |
| REQ-SEC-13  | TC-27        | 1.14            |
| REQ-SEC-14  | TC-28        | 1.15            |
| REQ-SEC-15  | TC-29        | 1.16            |
| REQ-API-02  | TC-30        | 1.17            |
| REQ-API-04  | TC-31        | 1.18            |
| REQ-API-08  | TC-33        | 1.20            |
| REQ-API-09  | TC-32        | 1.19            |
| REQ-API-10  | TC-34        | 1.21            |

### Scenario-level coverage

| Requirement | Delta scenario                                                           | Covered by |
| ----------- | ------------------------------------------------------------------------ | ---------- |
| REQ-SEC-01  | Plain HTTP is permanently redirected                                     | TC-14      |
| REQ-SEC-02  | The storefront serves the protective headers                             | TC-15      |
| REQ-SEC-02  | The API serves the protective headers                                    | TC-16      |
| REQ-SEC-03  | A content-security policy is declared                                    | TC-17      |
| REQ-SEC-03  | Transport security is declared                                           | TC-17      |
| REQ-SEC-04  | No technology banner is returned                                         | TC-18      |
| REQ-SEC-05  | The session cookie is HttpOnly and same-site constrained                 | TC-19      |
| REQ-SEC-06  | Session and CSRF cookies are Secure                                      | TC-20      |
| REQ-SEC-07  | A replayed session identifier is not honoured after logout               | TC-21      |
| REQ-SEC-08  | A foreign origin is not granted access                                   | TC-22      |
| REQ-SEC-09  | Script markup as a search term returns no data and no error              | TC-23      |
| REQ-SEC-09  | SQL metacharacters as a search term return no data and no error          | TC-23      |
| REQ-SEC-10  | Script markup submitted through the search field does not execute        | TC-24      |
| REQ-SEC-11  | The user-detail response carries no credential field                     | TC-25      |
| REQ-SEC-12  | An unauthenticated caller does not receive an account's personal details | TC-26      |
| REQ-SEC-13  | Registered and unregistered emails produce indistinguishable answers     | TC-27      |
| REQ-SEC-14  | A guest is not served the checkout address step                          | TC-28      |
| REQ-SEC-14  | A guest is not served the payment step                                   | TC-28      |
| REQ-SEC-15  | A guest is not served the account-deleted confirmation                   | TC-29      |

No empty cell. TC-17 covers both scenarios of REQ-SEC-03 and TC-28 both of REQ-SEC-14,
because each pair is one assertion about one response surface; splitting them would
duplicate the request without adding a question.

## 7. Assumptions & open questions

**Assumptions**

1. The headers observed on 2026-08-08 are the site's steady state, not a transient edge
   configuration. Cloudflare fronts the site and could change them; a later difference is a
   change in the delivered security posture and is reported as such, not patched away.
2. `sessionid` is the session cookie. It is the only cookie whose value changes at login
   and which the server stops honouring at logout — TC-21 is what establishes that, so the
   assumption is itself under test.
3. `GET /api/getUserDetailByEmail` is the published contract (REQ-API-14) and its lack of
   authorisation is a property of the site, not of how we call it. No auth parameter is
   published for it.

**Open questions**

| #   | Question                                                                                                                                                                                                         | Blocks a P1? |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Q-C | Does `/delete_account` actually delete when a guest hits it, or only render the confirmation? Unresolved deliberately — answering it means deleting something. TC-29 asserts the guard, which is the requirement | No           |
| Q-D | Is the absent CSP a vendor decision for a deliberately-hackable practice site? Possibly. It is still reported: whether the owner acts is not a QA decision                                                       | No           |
| Q-E | Does the site rate-limit `getUserDetailByEmail`? Unknown and deliberately unprobed — finding out means enumerating                                                                                               | No           |

---

**Approval:** granted in advance by the repo owner (see the note under the Status line).
`/opsx:apply`, `/opsx:verify` and `/opsx:archive` treat this file as the coverage source of
truth.
