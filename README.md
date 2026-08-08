# playwright-automationexercise-openspec

Spec-driven Playwright tests for **https://www.automationexercise.com** — a public
practice storefront we do not own.

The tests are not the point. The chain that produces them is:

```
docs/requirements.md          reviewable baseline (REQ-*), distilled from the vendor's
                              26 published test cases and 14 published APIs
        ↓
openspec/specs/<cap>/spec.md  11 capability specs — behaviour contracts with Scenario blocks
        ↓
openspec/changes/<id>/        proposal → spec delta → test-plan (TC-*) → tasks
        ↓
src/tests/**                  Playwright specs, each named with its TC id
```

Every test traces back to a written requirement. Every requirement traces forward to the
test that proves it. A requirement with no test case blocks the workflow; a test with no
requirement should not exist.

Derived from [playwright-automationexercise](https://github.com/georgikazandzhiev-code/playwright-automationexercise)
— the page objects, fixtures and API services carry over; the requirements baseline, the
capability specs and the workflow are new.

## Why bother, for a site nobody owns

That is exactly why. There is no backend source, no product owner and no internal spec. Write
tests straight from a URL and every assertion encodes a private guess about intended
behaviour — invisible to review, and indistinguishable from a bug that has been quietly
accepted.

The requirements document makes the guesses explicit. The test plan makes the coverage
countable. Three consequences fall out, and they are what actually differ from an ordinary
Playwright repo:

**A failing test is a defect report about the site, not a bug in our code.** There is no
implementation to fix. When a requirement and the site disagree, either the site has a
defect — recorded in `docs/requirements.md` §10 — or our requirement was wrong, and it is
amended through a change. Softening the assertion is neither, and is forbidden.

**"Red then green" does not work, so we prove red instead.** The feature already exists; a
new test can pass on its first run, and a green run from an assertion never observed
failing is not evidence. Every new assertion is deliberately inverted, run, observed red,
and restored — see `openspec/AGENTS.md` § *Proving red* and group 3 of any change's
`tasks.md`.

**The environment is shared with the entire internet and never resets.** Every test seeds
its own account through `POST /api/createAccount` and deletes it in teardown, including on
failure. No shared `.env` credential, no `test.skip` when data is missing.

## Quick start

```powershell
npm install
npx playwright install
copy .env.example .env      # optional — BASE_URL only

npm test                    # full suite: UI + API
npm run test:ui             # chromium project only
npm run test:api            # REST API only, no browser
npm run typecheck           # tsc --noEmit

npm run spec:list           # active OpenSpec changes
npm run spec:validate       # strict validation of specs and changes
```

## Capabilities and coverage

Eleven capability specs cover all 26 vendor test cases and all 14 published APIs. Test
coverage is being built one change at a time — the gap between the two columns is visible
on purpose.

| Capability | Requirements | Automated |
|------------|--------------|-----------|
| `authentication` | REQ-AUT-01 … 06 | **✅ complete** — 13 cases, `harden-authentication-coverage` |
| `account-lifecycle` | REQ-ACC-01 … 07 | partial — inherited registration specs |
| `product-search` | REQ-SRH-01 … 03 | partial — inherited search specs |
| `shopping-cart` | REQ-CRT-01 … 06 | partial — inherited cart specs |
| `checkout` | REQ-CHK-01 … 07 | partial — inherited checkout spec |
| `public-api` | REQ-API-01 … 14 | partial — APIs 1, 5, 6, 7, 11, 12 |
| `product-catalog` | REQ-CAT-01 … 05 | — |
| `product-reviews` | REQ-REV-01 … 03 | — |
| `subscription` | REQ-SUB-01 … 03 | — |
| `contact-form` | REQ-CTC-01 … 03 | — |
| `site-navigation` | REQ-NAV-01 … 04 | — |

## The workflow

```
/opsx:explore → /opsx:propose → /opsx:testplan → /opsx:apply → /opsx:verify → /opsx:archive
                                └─ test plan ──┘  (tests first,   (coverage
                                   before code     then support     gate)
                                                   code)
```

The gate that matters: **`/opsx:apply` refuses to write test code until a human has
approved `test-plan.md`.** Not a formality — an agent that cannot see the required test
cases writes tests against its own guess of "done", and against a third-party site nothing
contradicts that guess.

Slash commands live in `.claude/commands/opsx/`; the rules an agent must obey are in
`openspec/AGENTS.md`.

## Layout

```
docs/requirements.md          requirements baseline (REQ-*)
openspec/
  config.yaml                 schema selection, project context, per-artifact rules
  AGENTS.md                   workflow rules for agents — read this first
  project.md                  stack, layout, non-negotiable conventions
  specs/<capability>/spec.md  current behaviour contract
  changes/<change-id>/        active changes
  schemas/                    spec-driven-testfirst templates
src/
  ui/pages/*.page.ts          page objects (extend BasePage)
  ui/fixtures.ts              POM + seededAccount dependency injection
  api/services/*.service.ts   REST clients
  api/schemas/*.schema.ts     Zod response contracts (z.strictObject)
  tests/ui/**.spec.ts         UI + E2E   (project: chromium)
  tests/api/**.spec.ts        API        (project: api)
  utils/constants.ts          every literal string, path and timeout
  utils/consent.ts            ad / consent overlay neutralisation
```

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `BASE_URL` | no | Defaults to `https://www.automationexercise.com` |

There is deliberately **no test-user credential**. Specs under the spec workflow seed their
own accounts through the REST API. If you find a `TEST_USER_*` reference anywhere, it is a
leftover — see `openspec/project.md` § *Known state of the inherited suite*.

## Conventions

Full list in `openspec/project.md`. The ones that get code rejected:

1. Import `test` from `src/ui/fixtures`, never from `@playwright/test`, in a UI spec.
2. Take page objects from fixtures — `new SomePage(page)` in a test is a rejection.
3. No `if`/`else`, no ternary, no `test.skip()` in a test body. Seed the data instead.
4. No `page.waitForTimeout`. Web-first assertions auto-retry.
5. Assert the API **body** `responseCode`, not the HTTP status — this site answers HTTP 200
   for almost everything.
6. Every user-visible string lives in `src/utils/constants.ts`.
7. Delete every account you create, in teardown, even on failure.
8. One tag per `test()`: `@e2e`, `@negative`, `@api`, `@sanity`. Never on `describe()`.

## Known site defects

Recorded in `docs/requirements.md` §10 so that a test asserting the documented contract may
fail *by design* rather than being weakened to match the bug. Currently: the
`searchProduct` error code divergence (D1), ad interstitials intercepting header clicks
(D2), and `createAccount` returning HTTP 200 with body 201 (D3).
