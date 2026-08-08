# Tasks — harden-authentication-coverage

**Inputs:** [proposal.md](proposal.md) · [specs/authentication/spec.md](specs/authentication/spec.md) · [test-plan.md](test-plan.md)

Every task below traces to a `TC-NN` from the test plan, except where explicitly labelled
enabling scaffolding. Tests are written before the supporting code they need.

## 1. Tests (write first)

> Written against page objects and fixtures that do not exist yet — they fail to compile
> first, which is this repo's equivalent of a red run for structure. Behavioural red is
> proved separately in group 3.

- [x] 1.1 API spec asserting the seeding precondition — create an account, verify it via `POST /api/verifyLogin` (covers TC-01)
- [x] 1.2 UI spec: login page presents `Login to your account` and `New User Signup!` (covers TC-02)
- [x] 1.3 UI spec: seeded account logs in and the header indicates a session (covers TC-03)
- [x] 1.4 UI spec: header text equals `Logged in as <the registered name>`, exact match, not prefix (covers TC-04)
- [x] 1.5 UI spec: unknown email is refused with the documented error (covers TC-05)
- [x] 1.6 UI spec: seeded account's email with a wrong password is refused (covers TC-06)
- [x] 1.7 UI spec: the two refusal messages captured in one run are compared for equality (covers TC-07)
- [x] 1.8 UI spec: logout returns to the login page and the header reverts (covers TC-08)
- [x] 1.9 UI spec: session holds across navigation to products and to the cart (covers TC-09)
- [x] 1.10 UI spec: session holds across a page reload (covers TC-10)
- [x] 1.11 UI spec: empty login form is blocked by native constraint validation (covers TC-11)
- [x] 1.12 UI spec: valid email with empty password does not submit (covers TC-12)
- [x] 1.13 E2E spec: credentials of a deleted account no longer authenticate (covers TC-13)

## 2. Supporting code

- [x] 2.1 **Enabling scaffolding** — `seededAccount` fixture: creates an account via `POST /api/createAccount` with a per-run unique email and deletes it via `DELETE /api/deleteAccount` in teardown, including on failure. Has no test case of its own; it is asserted through TC-01 … TC-13
- [x] 2.2 **Enabling scaffolding** — account data provider producing a unique name/email/password/address payload per run (constraint C1, REQ-X-03)
- [x] 2.3 Register the fixture in `src/ui/fixtures.ts` and, where the API context is needed, in `src/api/fixtures.ts` — **enabling scaffolding**, no direct coverage
- [x] 2.4 `LoginPage`: locators and actions for the returning-user form, the new-user section, the error message and the exact session-indicator text (covers TC-02, TC-03, TC-04, TC-05, TC-06, TC-07)
- [x] 2.5 `LoginPage`: native-validity read on the email field (covers TC-11, TC-12). **Deviation from the original task text, recorded rather than glossed:** this was written as "without `page.evaluate`". `ValidityState` has no Playwright locator API, so `locator.evaluate` is the only route to it. It is confined to the page object and paired at the call site with the user-observable consequences — no navigation, no session — which _are_ asserted through locators
- [x] 2.6 `NavigationPage`: assertion that the session indicator holds on an arbitrary page, plus a reload action (covers TC-09, TC-10)
- [x] 2.7 `AccountApiService`: `verifyLogin` method returning the parsed body (covers TC-01)
- [x] 2.8 Zod schema for the `verifyLogin` response as a `z.strictObject` (covers TC-01)
- [x] 2.9 Move every new site literal into `src/utils/constants.ts` — no user-visible string inline in a spec (covers TC-02 … TC-13)

## 3. Prove red — the step that makes green mean something

> The site already exists, so a new assertion can pass on its first run. A green run from
> an assertion never observed failing is not evidence. See `openspec/AGENTS.md` §
> _Proving red_.

- [x] 3.1 TC-04: point the expected name at a value the account was not registered with; confirm the failure message names the mismatch; restore (covers TC-04)
- [x] 3.2 TC-07: compare the captured message against a deliberately different string; confirm red; restore (covers TC-07)
- [x] 3.3 TC-05, TC-06: assert the _absence_ of the error message; confirm red; restore (covers TC-05, TC-06)
- [x] 3.4 TC-09, TC-10: assert the logged-out header after login; confirm red; restore (covers TC-09, TC-10)
- [x] 3.5 TC-11, TC-12: submit a valid credential pair and assert the field is invalid; confirm red; restore (covers TC-11, TC-12)
- [x] 3.6 TC-01, TC-13: swap the expected `responseCode` / error expectation; confirm red; restore (covers TC-01, TC-13)
- [x] 3.7 Record in the change report which assertions were proved red and how

## 4. Retire the superseded spec

- [x] 4.1 Delete `src/tests/ui/task3-login-logout.spec.ts` — superseded by 1.2 … 1.13, whose assertions are strictly stronger (covers TC-02 … TC-08)
- [x] 4.2 Delete `src/ui/data-providers/login.data.ts` — dead code; nothing imports it, and its only effect is to make `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` look required — **enabling scaffolding**
- [x] 4.3 Correct `README.md`, `docs/TEST-EXECUTION-REPORT.md`, `.cursor/rules/project-overview.mdc` and `.github/workflows/playwright.yml`, which all document a conditional skip and an env dependency the suite does not have — **enabling scaffolding**, documentation follow-through. This stale text is what produced the false premise corrected at the top of `proposal.md`

## 5. Verify

- [x] 5.1 `npm run typecheck` clean
- [x] 5.2 `npm run test:api` — report actual counts and every failure verbatim
- [x] 5.3 `npm run test:ui` — report actual counts and every failure verbatim
- [x] 5.4 Any divergence between the site and the spec recorded in `docs/requirements.md` §10 as a site defect, and reported — never absorbed by softening an assertion
- [x] 5.5 Confirm every account created during the run was deleted; no residue left on the shared environment (constraint C2)
