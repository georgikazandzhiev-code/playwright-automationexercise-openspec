# Test Plan — harden-authentication-coverage

**Change:** `openspec/changes/harden-authentication-coverage`
**Proposal:** [proposal.md](proposal.md) · **Spec deltas:** [specs/authentication/spec.md](specs/authentication/spec.md)
**Author (agent):** `/opsx:testplan` · **Status:** Approved
**Traceability:** every requirement in the spec deltas is covered by ≥1 test case (see §5).

> Requirements-level test cases only — **no test code**. Code is applied later by
> `/opsx:apply`. This document is the contract the applied code must satisfy.

## 1. Scope & objectives

- **In scope:** the whole `authentication` capability — the two requirements this change
  adds (REQ-AUT-05, REQ-AUT-06), the one it tightens (REQ-AUT-02), and the three already
  in the baseline but never properly tested (REQ-AUT-01, REQ-AUT-03, REQ-AUT-04).
- **Out of scope:**
  - Account creation and deletion through the **UI** — that is `account-lifecycle`'s own
    change. Here the API is used only as a *precondition*.
  - Cart and checkout behaviour that depends on a session — `shopping-cart` and `checkout`.
  - Password policy. The site publishes none (`docs/requirements.md` Q3), so none is
    claimed and none is tested.
- **Test levels used:**
  - **[UI]** — the capability is a browser-facing one; the session indicator exists only
    in the DOM.
  - **[API]** — one case, to prove the seeding precondition itself works. Without it, a
    seeding failure would present as an authentication failure and be misdiagnosed.
  - No **[Unit]** level exists in this repo: we own no product code (see
    `openspec/AGENTS.md`).

## 2. Requirements under test

| Requirement | Summary | Source |
|-------------|---------|--------|
| REQ-AUT-02 | Valid credentials establish a session; the header names **the registered** user | delta — MODIFIED |
| REQ-AUT-05 | The session persists across navigation and reload | delta — ADDED |
| REQ-AUT-06 | Empty credentials are refused by native validation before submission | delta — ADDED |
| REQ-AUT-01 | The login page presents both the returning-user and new-user entry points | baseline `specs/authentication` — implemented by this change |
| REQ-AUT-03 | Invalid credentials are refused, with an identical message either way | baseline `specs/authentication` — implemented by this change |
| REQ-AUT-04 | Logout terminates the session | baseline `specs/authentication` — implemented by this change |

## 3. Test cases

> ID `TC-NN`. Category `[UI] / [API] / [E2E]`. Priority `P1` (critical path / security /
> data-loss), `P2` (core regression), `P3` (edge).
>
> **Every UI case seeds its own account** via `POST /api/createAccount` with a per-run
> unique email, and deletes it via `DELETE /api/deleteAccount` in teardown, which runs on
> failure too (constraints C1, C2). This is not repeated per row.

| ID | Title | Category | Priority | Covers | Given / When / Then (intent) | Expected result |
|----|-------|----------|----------|--------|------------------------------|-----------------|
| TC-01 | Seeding precondition is sound | [API] | P1 | REQ-AUT-02 (precondition) | GIVEN an account created via `POST /api/createAccount` WHEN `POST /api/verifyLogin` is called with the same credentials THEN it confirms the account | Body `responseCode` 200, message `User exists!`. A failure here means the *seed* broke, not authentication — it must be distinguishable |
| TC-02 | Login page presents both entry points | [UI] | P2 | REQ-AUT-01 | GIVEN a guest WHEN the login page is opened THEN both sections are present | `Login to your account` and `New User Signup!` both visible |
| TC-03 | Seeded account logs in | [UI] | P1 | REQ-AUT-02 | GIVEN a seeded account WHEN its credentials are submitted THEN a session is established | Storefront displayed; header shows `Logged in as …` |
| TC-04 | Header names the registered user, exactly | [UI] | P1 | REQ-AUT-02 | GIVEN an account seeded with a per-run unique name WHEN it logs in THEN the header names **that** user | Header text equals `Logged in as <that exact name>`. A prefix match is explicitly insufficient — this case exists to fail if the site ever showed a different user's name |
| TC-05 | Unknown email is refused | [UI] | P1 | REQ-AUT-03 | GIVEN the login form WHEN an email with no account is submitted THEN it is refused | No session; error `Your email or password is incorrect!` |
| TC-06 | Wrong password is refused | [UI] | P1 | REQ-AUT-03 | GIVEN a seeded account WHEN its email is submitted with a different password THEN it is refused | No session; error `Your email or password is incorrect!` |
| TC-07 | The two refusals are indistinguishable | [UI] | P1 | REQ-AUT-03 | GIVEN both refusals captured in one run WHEN their rendered error text is compared THEN they are identical | The two strings are equal. **Anti-enumeration control** — a difference is a security finding, recorded in `docs/requirements.md` §10, never absorbed by relaxing this case |
| TC-08 | Logout terminates the session | [UI] | P1 | REQ-AUT-04 | GIVEN an authenticated user WHEN they log out THEN the session ends | Login page displayed; header shows `Signup / Login`; header no longer shows `Logged in as` |
| TC-09 | Session survives navigation | [UI] | P1 | REQ-AUT-05 | GIVEN a logged-in user WHEN they navigate to products and then to the cart THEN the session holds on each page | Header shows `Logged in as <registered name>` on both; never `Signup / Login` |
| TC-10 | Session survives a reload | [UI] | P2 | REQ-AUT-05 | GIVEN a logged-in user WHEN the page is reloaded THEN the session holds | Header still shows `Logged in as <registered name>` |
| TC-11 | Empty form is blocked by native validation | [UI] | P2 | REQ-AUT-06 | GIVEN both login fields empty WHEN login is activated THEN the browser blocks it | Email field reports invalid; URL unchanged; header still `Signup / Login` |
| TC-12 | Valid email with empty password is blocked | [UI] | P3 | REQ-AUT-06 | GIVEN a valid email and an empty password WHEN login is activated THEN the form does not submit | No navigation, no session |
| TC-13 | Deleted credentials no longer authenticate | [E2E] | P1 | REQ-AUT-03 | GIVEN a seeded account deleted via `DELETE /api/deleteAccount` WHEN its former credentials are submitted to the login form THEN they are refused | No session; error `Your email or password is incorrect!` |

### Notes on individual cases

- **TC-01** is deliberately an API case inside a UI change. Every other case depends on
  seeding; if seeding silently fails, twelve UI cases go red at once and the cause is
  invisible. TC-01 makes the precondition fail loudly and on its own.
- **TC-04** is the case that gives the REQ-AUT-02 tightening its teeth. Without it,
  `Logged in as anybody` satisfies the requirement.
- **TC-07** compares two strings captured in the same run rather than each against a
  constant. Comparing each to a constant would still pass if the site changed *both*
  messages to two new, different values.
- **TC-13** also exercises `account-lifecycle` REQ-ACC-07's second scenario. Coverage of
  REQ-ACC-07 is **not** claimed here — that belongs to the `account-lifecycle` change.
  Noted so the overlap is visible and not double-counted.

## 4. Non-functional candidates

| Area | Applies? | Case(s) / notes |
|------|----------|-----------------|
| Security | **Yes** | TC-07 — account enumeration via differing error messages (OWASP A07, Identification and Authentication Failures). P1. TC-13 — credentials must not survive account deletion. P1. |
| Security — deferred | — | **Brute-force / rate limiting on the login form is not tested.** The site publishes no rate-limit behaviour, and probing one on a shared public practice site would be abusive. Recorded as deferred with its reason, not silently dropped. |
| Security — deferred | — | **Session fixation and cookie flags** (`HttpOnly`, `Secure`, `SameSite`) are not asserted. They belong to a `session-security` capability that does not exist yet. Deferred, not covered. |
| Performance / load | No | None identified. No latency target is published (`docs/requirements.md` §9.4). |
| Accessibility | No | Deferred — no conformance target is published, so there is nothing to assert against. Recorded rather than assumed absent. |

## 5. Coverage matrix (requirement → test cases)

> Hard rule: **no empty right-hand cell.**

| Requirement | Covered by | Planned task(s) |
|-------------|-----------|-----------------|
| REQ-AUT-01 | TC-02 | 1.2 |
| REQ-AUT-02 | TC-01, TC-03, TC-04 | 1.1, 1.3, 1.4 |
| REQ-AUT-03 | TC-05, TC-06, TC-07, TC-13 | 1.5, 1.6, 1.7, 1.13 |
| REQ-AUT-04 | TC-08 | 1.8 |
| REQ-AUT-05 | TC-09, TC-10 | 1.9, 1.10 |
| REQ-AUT-06 | TC-11, TC-12 | 1.11, 1.12 |

### Scenario-level coverage

| Requirement | Delta / baseline scenario | Covered by |
|-------------|---------------------------|-----------|
| REQ-AUT-01 | Both sections are visible | TC-02 |
| REQ-AUT-02 | Known credentials log in | TC-03 |
| REQ-AUT-02 | The indicator names the registered user | TC-04 |
| REQ-AUT-03 | Unknown email is refused | TC-05 |
| REQ-AUT-03 | Wrong password is refused | TC-06 |
| REQ-AUT-03 | The two rejections are indistinguishable | TC-07 |
| REQ-AUT-04 | Logout returns to the login page | TC-08 |
| REQ-AUT-05 | Session indicator survives navigation | TC-09 |
| REQ-AUT-05 | Session survives a full page reload | TC-10 |
| REQ-AUT-06 | Empty form does not submit | TC-11 |
| REQ-AUT-06 | Empty password with a valid email does not submit | TC-12 |

No empty cell. TC-01 and TC-13 cover no scenario of their own by design — TC-01 guards the
precondition, TC-13 covers REQ-AUT-03 from a second angle (a formerly-valid account).

## 6. Assumptions & open questions

**Assumptions**

1. `POST /api/createAccount` produces an account indistinguishable from one registered
   through the UI. `public-api` REQ-API-11's second scenario asserts exactly this, so the
   assumption is itself under test — elsewhere, but under test.
2. The header indicator is the site's only session signal. No cookie or storage assertion
   is made, because no cookie contract is published.
3. The site's error copy is `Your email or password is incorrect!` verbatim. It lives in
   `src/utils/constants.ts`; a copy change is a one-line diff and a reported site change,
   not a test patch.

**Partial assertions — stated so they are not mistaken for full coverage**

- **TC-09** proves the session survives two specific navigations, not all navigation. That
  is the honest limit of a finite case.
- **TC-11 / TC-12** assert that the browser blocks submission. They do **not** assert what
  the server would do with empty credentials, because the request never leaves the browser.
  Server-side rejection of empty credentials is untested and unclaimed.

**Open questions**

| # | Question | Blocks a P1? |
|---|----------|--------------|
| Q-A | Does the site set a session cookie with `HttpOnly` / `Secure`? Unknown, and no contract is published. | No — deferred to a future `session-security` capability, recorded in §4 |
| Q-B | Is the `Logged in as` name the intake name or the first name from the address block? TC-04 will answer it on first run. | No — TC-04 is written to assert the intake name per REQ-ACC-05; if the site disagrees, that is a finding to record, and the requirement is amended through a change rather than the assertion being loosened |

---

**Approval:** on review, change Status to `Approved`. The tasks step, `/opsx:apply`,
`/opsx:verify` and `/opsx:archive` treat this file as the coverage source of truth.
