# Project — playwright-automationexercise-openspec

## What this is

A spec-driven Playwright suite for **https://www.automationexercise.com**, a public
practice storefront we do not own.

The point of the repo is not the tests. It is the chain that produces them:

```
docs/requirements.md          reviewable baseline (REQ-* ids), derived from the
                              vendor's published test-case catalogue and API list
        ↓
openspec/specs/<cap>/spec.md  per-capability behaviour contract, Scenario blocks
        ↓
openspec/changes/<id>/        proposal → spec delta → test-plan (TC-*) → tasks
        ↓
src/tests/**                  Playwright specs, each named with its TC id
```

Every test can be traced back to a written requirement, and every requirement can be
traced forward to the test that proves it. A requirement with no test blocks the
workflow; a test with no requirement should not exist.

Derived from [playwright-automationexercise](https://github.com/georgikazandzhiev-code/playwright-automationexercise)
— the page objects, fixtures and API services carry over; the specs, the requirements
baseline and the workflow are new.

## Stack

|           |                                                                   |
| --------- | ----------------------------------------------------------------- |
| Runner    | `@playwright/test`                                                |
| Language  | TypeScript, strict                                                |
| Contracts | Zod (`z.strictObject`) for API response validation                |
| Pattern   | Page Object Model with fixture dependency injection               |
| Workflow  | OpenSpec, `spec-driven-testfirst` schema (`@fission-ai/openspec`) |

## Layout

```
docs/requirements.md            requirements baseline (REQ-*)
openspec/
  config.yaml                   schema selection + project context and rules
  AGENTS.md                     workflow rules for agents (read this)
  project.md                    this file
  specs/<capability>/spec.md    current behaviour contract per capability
  changes/<change-id>/          active changes
  changes/archive/              folded changes
  schemas/spec-driven-testfirst templates + artifact instructions
src/
  ui/pages/*.page.ts            page objects, extend BasePage
  ui/fixtures.ts                POM dependency injection — every page registered here
  ui/data-providers/*.data.ts   dynamic UI data (unique per run)
  api/services/*.service.ts     REST API clients
  api/schemas/*.schema.ts       Zod response contracts
  api/data-providers/*.data.ts  dynamic API payloads
  api/fixtures.ts               API request context fixtures
  tests/ui/**.spec.ts           UI + E2E specs      (project: chromium)
  tests/api/**.spec.ts          API specs           (project: api)
  utils/constants.ts            every literal string, path and timeout
  utils/consent.ts              ad / consent overlay neutralisation
  utils/env.ts                  environment access
```

## Commands

```powershell
npm install
npx playwright install

npm test                # full suite — UI + API
npm run test:ui         # chromium project only
npm run test:api        # API project only (no browser)
npm run test:headed     # watch it run
npm run typecheck       # tsc --noEmit
npm run format          # prettier --write .

npm run spec:list       # OpenSpec: active changes
npm run spec:validate   # OpenSpec: strict validation of specs and changes
```

## Environment

| Variable                                 | Required for      | Notes                                                                                  |
| ---------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `BASE_URL`                               | optional          | Defaults to `https://www.automationexercise.com`                                       |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | legacy specs only | New specs **seed their own account** via `POST /api/createAccount` instead — see below |

Copy `.env.example` to `.env` before the first run.

## Conventions that are not negotiable

These exist because of what the system under test is. Each one traces to a constraint in
`docs/requirements.md` §5.

1. **Seed, never skip.** A test that needs an account creates one through
   `POST /api/createAccount` in setup. It does not read a shared account from `.env` and
   it does not `test.skip()` when data is missing. _(C1, C2, REQ-X-01)_

   The inherited specs still use `TEST_USER_EMAIL`; migrating them off it is tracked as
   its own change.

2. **Delete what you create.** Teardown calls `DELETE /api/deleteAccount` and runs even
   when the test failed. The environment is shared and never reset. _(C2, REQ-X-02)_

3. **Unique per run.** Every registered email is unique to the run. _(C1, REQ-X-03)_

4. **Assert the body, not the HTTP status.** Most `/api/*` endpoints answer HTTP 200 and
   put the real status in `responseCode`. _(C4)_

5. **Overlays are handled once, centrally.** `src/utils/consent.ts` plus the `page`
   fixture. No test contains ad-dismissal logic. Header clicks are unreliable on this
   site; direct `goto` to a known path is the sanctioned workaround, and the interception
   itself is logged as site defect D2. _(C3, REQ-X-04)_

6. **No global-count assertions.** The catalogue, review list and account table are
   shared with the whole internet. Assert on data this test created. _(C1)_

7. **Literals live in `src/utils/constants.ts`.** A user-visible string quoted in a spec
   file is a bug — it belongs in constants, where a site copy change is a one-line diff.

8. **Page objects are injected.** `new SomePage(page)` inside a test is a review
   rejection. Import `test` from `src/ui/fixtures`, not from `@playwright/test`.

9. **Tags.** `@e2e`, `@negative`, `@api`, `@sanity` — one per test, on `test()`, never on
   `describe()`.

10. **A site defect is reported, not absorbed.** Record it in `docs/requirements.md` §10
    and leave the test asserting the documented contract.

## Known state of the inherited suite

Carried over as-is and not yet under the spec workflow. Each is a candidate change:

| Item                                   | Issue                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `task3-login-logout.spec.ts`           | Depends on `TEST_USER_EMAIL`; skips when absent. Violates convention 1.        |
| `task1-…`, `task2-…`, `task4-…` naming | Named after an exercise task, not a capability or a `TC` id.                   |
| No coverage                            | TC 6, 7, 10, 11, 13, 17, 18, 19, 21, 22, 23, 25, 26 have no test at all.       |
| API coverage                           | Only APIs 1, 5, 6, 11, 12 are exercised; 2, 3, 4, 7, 8, 9, 10, 13, 14 are not. |

These gaps are visible on purpose. Closing them is what the changes in `openspec/changes/`
are for.
