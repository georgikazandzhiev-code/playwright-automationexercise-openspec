# AGENTS.md — instructions for AI agents working in this repo

Read [`project.md`](project.md) first for stack, layout and conventions, and
[`../docs/requirements.md`](../docs/requirements.md) for the requirements baseline.
This file states the workflow rules an agent must obey.

## The inversion you must hold in your head

This repo tests a **third-party site we do not own**. There is no product source, no
backend, no product owner.

| Normal OpenSpec repo | This repo |
|---|---|
| Spec describes the software you are about to write | Spec describes **automationexercise.com's** observable behaviour |
| Implementation = product code | Implementation = the **Playwright tests** that prove the behaviour |
| A failing test = a bug in your code, fix the code | A failing test = a **defect of the site**, record and report it |
| Red-then-green: the test fails because the feature does not exist | The feature already exists — see [Proving red](#proving-red) |

Consequence: you can never "fix the implementation to satisfy the spec." When a
requirement and the site disagree, exactly one of two things is true — the site has a
defect (record it in `docs/requirements.md` §10) or our requirement was wrong (amend the
baseline through a change). Silently softening the assertion is neither, and is forbidden.

## Workflow

```
/opsx:explore → /opsx:propose → /opsx:testplan → /opsx:apply → /opsx:verify → /opsx:archive
                                └─ test plan ──┘  (tests first,   (coverage
                                   before code     then support     gate)
                                                   code)
```

`/opsx:verify` is the coverage gate: it reports, it never fixes. `/opsx:sync` folds delta
specs into the main specs without archiving — `/opsx:archive` runs that same merge inline,
so `sync` is only needed when you want the specs updated while the change stays active.

Artifacts of a change live in `openspec/changes/<change-id>/`:

| Artifact | Produced by | Contains |
|----------|-------------|----------|
| `proposal.md` | `/opsx:propose` | Why, what changes, impact |
| `specs/<capability>/spec.md` | `/opsx:propose` | ADDED / MODIFIED / REMOVED requirements as a **delta** against `openspec/specs/` |
| `test-plan.md` | `/opsx:testplan` | Requirements-level test cases `TC-NN`, and the coverage matrix |
| `tasks.md` | tasks step | Test-first tasks, then supporting tasks each tagged `(covers TC-NN)` |

`/opsx:archive` folds an applied change's delta into `openspec/specs/<capability>/spec.md`
and moves the change under `openspec/changes/archive/`.

## Capabilities

| Capability | Covers | Baseline ids |
|------------|--------|--------------|
| `account-lifecycle` | registration, opt-ins, account deletion | REQ-ACC-* |
| `authentication` | login, logout, session indicator, anti-enumeration | REQ-AUT-* |
| `product-catalog` | all products, product detail, categories, brands, recommended | REQ-CAT-* |
| `product-search` | search results, empty results, result actions | REQ-SRH-* |
| `shopping-cart` | add, quantity, totals, remove, persistence across login | REQ-CRT-* |
| `checkout` | address review, order comment, payment, invoice | REQ-CHK-* |
| `product-reviews` | review form and acknowledgement | REQ-REV-* |
| `subscription` | footer newsletter block | REQ-SUB-* |
| `contact-form` | contact page and submission | REQ-CTC-* |
| `site-navigation` | home identity, static pages, scroll behaviour | REQ-NAV-* |
| `public-api` | REST API 1–14 | REQ-API-* |

A new capability folder requires a baseline section in `docs/requirements.md` in the
same change.

## Test-First (NON-NEGOTIABLE)

Every change's **test plan and test cases are generated and approved before any test code
is applied.**

- A change MUST have an approved `test-plan.md` (from `/opsx:testplan`, after
  `/opsx:propose`) before `/opsx:apply` writes code.
- Every requirement in the change's spec deltas — and every `Scenario:` within it — MUST
  be covered by ≥1 test case (`TC-NN`). A requirement with zero cases blocks the workflow.
- Every task MUST trace to ≥1 test-case id; every test case MUST have an implementing task.
- `/opsx:verify` treats an uncovered requirement, a test case with no task, or a task with
  no test-case reference as a **blocking** failure.
- `/opsx:archive` does not fold a change whose test plan has uncovered requirements.

**Rationale:** an agent that cannot see the required test cases writes tests against its
own guess of "done." Against a site we do not own, nothing contradicts that guess — there
is no compiler, no type error, no failing build. The test plan is the only contradiction
mechanism we have.

## Proving red

The site already exists, so a brand-new test can pass on its first run. A green run from
an assertion that was never observed failing is not evidence of anything.

So the red step becomes: **prove the assertion has teeth.**

For each new assertion, before accepting it:

1. Invert it (`toBeVisible` → `not.toBeVisible`), or point it at data that must not
   satisfy it (a wrong string, an unregistered email, an empty cart).
2. Run it. Observe the failure, and read the failure message — it must name the
   requirement clearly enough that a red CI run is diagnosable.
3. Restore the assertion and re-run green.
4. Record in the task that you did this.

An assertion that cannot be made to fail is asserting nothing. That is a defect in the
test, and it blocks the change.

## Hard rules while applying a change

1. **Do not write a test for a requirement that has no `TC`.** Stop and report the gap.
2. **Prove every new assertion can go red** before reporting green (above).
3. **Never weaken a test to make it pass.** A failing assertion that reflects the spec is
   a defect of the site. Record it in `docs/requirements.md` §10 and report it. Loosening
   a Zod schema, relaxing a strict object, or editing an expected string to match observed
   buggy output is forbidden.
4. **No conditional test logic.** No `if`/`else`, no ternary, no `test.skip()` to steer
   around data that setup should have seeded. Seed through the REST API (`/api/createAccount`)
   instead. A skip is a false green and corrupts the coverage signal this workflow exists
   to protect.
5. **No hard waits.** Never `page.waitForTimeout`. Web-first assertions auto-retry.
6. **Name each test with its `TC-NN`**, so a red run names the requirement.
7. **Leave the environment as found.** The site is a shared public environment with no
   reset. Every account created is deleted in teardown via `DELETE /api/deleteAccount`,
   and teardown runs even when assertions fail.
8. **Unique identities per run.** Anything registered uses a per-run unique email
   (REQ-X-03), so concurrent runs and CI reruns cannot collide.
9. **Assert on the API body, not the HTTP status.** Most `/api/*` endpoints return HTTP
   200 and carry the real status in `responseCode` (constraint C4).
10. `npm run typecheck` and `npm test` must both be clean before a change is reported
    complete. Report actual output, including failures and flakes.

## Where things go

| Kind | Location | Naming |
|------|----------|--------|
| UI spec | `src/tests/ui/<capability>.<slice>.spec.ts` | kebab-case |
| API spec | `src/tests/api/<endpoint>.<positive\|negative>.spec.ts` | kebab-case |
| Page object | `src/ui/pages/<name>.page.ts` | kebab-case file, `PascalCase` class |
| Fixture wiring | `src/ui/fixtures.ts` | every page object registered here |
| API service | `src/api/services/<name>-api.service.ts` | |
| Zod schema | `src/api/schemas/*.schema.ts` | `z.strictObject` for new schemas |
| Literal string / timeout | `src/utils/constants.ts` | never inline in a spec |
| Dynamic data | `src/{ui,api}/data-providers/*.data.ts` | unique per run |

Never `new SomePage(page)` inside a test — take it from the fixture. Never import `test`
from `@playwright/test` in a UI spec — import from `src/ui/fixtures`.

## Reporting

When you report a change complete, state:

- the actual `npm test` result — counts, and every failure verbatim;
- which assertions you proved red, and how;
- any site defect found, with its `docs/requirements.md` §10 entry;
- anything deferred, and why.

A step that was skipped is stated, not omitted.
