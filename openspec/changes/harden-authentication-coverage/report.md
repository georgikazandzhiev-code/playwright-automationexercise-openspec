# Change report — harden-authentication-coverage

**Status:** applied · **Coverage:** 6 requirements, 13 test cases, 0 uncovered
**Artifacts:** [proposal.md](proposal.md) · [specs/authentication/spec.md](specs/authentication/spec.md) · [test-plan.md](test-plan.md) · [tasks.md](tasks.md)

## What shipped

| Requirement | Cases | Files |
|-------------|-------|-------|
| REQ-AUT-01 | TC-02 | `src/tests/ui/authentication.session.spec.ts` |
| REQ-AUT-02 (tightened) | TC-01, TC-03, TC-04 | `src/tests/api/verify-login.positive.spec.ts`, `…/authentication.session.spec.ts` |
| REQ-AUT-03 | TC-05, TC-06, TC-07, TC-13 | `…/authentication.negative.spec.ts`, `…/authentication.deleted-account.spec.ts` |
| REQ-AUT-04 | TC-08 | `…/authentication.session.spec.ts` |
| REQ-AUT-05 (new) | TC-09, TC-10 | `…/authentication.session.spec.ts` |
| REQ-AUT-06 (new) | TC-11, TC-12 | `…/authentication.negative.spec.ts` |

Supporting: `seededAccount` / `disposableAccount` / `accountApi` fixtures,
`AccountApiService.readVerifyLogin` + `discardAccount`, `VerifyLoginResponseSchema`,
`LoginPage` and `NavigationPage` extensions, `authentication.data.ts`.

Removed: `src/tests/ui/task3-login-logout.spec.ts`, `src/ui/data-providers/login.data.ts`.

## Proving red — what was verified, and how

Six assertions were deliberately broken, run against the live site, observed failing, and
restored. Verified afterwards that zero mutation markers remained and `npm run typecheck`
was clean.

| Case | Mutation applied | Failure observed |
|------|------------------|------------------|
| TC-01 | Expected `responseCode` 201 instead of 200 | `Expected: 201 / Received: 200` |
| TC-04 | Expected the registered name with a suffix appended | `Expected: "Seed User 1786207073543 MUTATED" / Received: "Seed User 1786207073543"` |
| TC-05 | Asserted the error paragraph is **hidden** | `toBeHidden() failed — Expected: hidden / Received: visible` on `.login-form form p` |
| TC-07 | Compared the two refusals against a deliberately different string | `Expected: "…incorrect! MUTATED" / Received: "…incorrect!"` |
| TC-09 | Asserted the logged-out header immediately after logging in | `toBeHidden() failed` on `getByText('Logged in as')` |
| TC-11 | Filled a valid email, then still asserted the field is browser-rejected | `expected native constraint validation to reject the email field — Expected: false / Received: true` |

Result: **6 failed, 0 passed** under mutation. Every failure message names the requirement
it belongs to, so a red CI run is diagnosable without opening a trace.

TC-02, TC-03, TC-06, TC-08, TC-10, TC-12 were not individually mutated. They share their
assertion mechanics with a mutated sibling — TC-06 with TC-05, TC-10 with TC-09, TC-12 with
TC-11, TC-03 with TC-04, and TC-02/TC-08 with the visibility assertions exercised in TC-05
and TC-09. Stated here as a limit of what was proved, rather than left to look like full
mutation coverage.

## Divergences and deviations

1. **The proposal's original premise was wrong.** It claimed the inherited
   `task3-login-logout.spec.ts` skipped when `TEST_USER_EMAIL` was unset. Reading the file
   proved it already seeded through the API. The claim came from `README.md`, which still
   said so. Corrected in place at the top of `proposal.md` and left visible; the real
   weakness turned out to be the *assertions*, not the seeding. The four stale documents
   that caused it are fixed under task 4.3.
2. **Task 2.5 said "without `page.evaluate`".** `ValidityState` has no locator API, so
   `locator.evaluate` was used, confined to the page object and paired with locator-based
   assertions on the observable consequences. Recorded on the task itself.

## Open question answered by this change

`test-plan.md` Q-B asked whether the `Logged in as` header shows the intake name or the
first name from the address block. **It shows the intake `name`** — confirmed against the
live DOM (`<a><i class="fa fa-user"></i> Logged in as <b>Seed User …</b></a>`). REQ-ACC-05
and REQ-AUT-02 already assert the intake name, so no amendment is needed.

## No new site defects

Nothing observed during this change diverges from `docs/requirements.md`. §10 is unchanged.

## Environment left as found

Every account created was deleted. `seededAccount` teardown asserts the deletion and runs
after failures, so the six mutated runs cleaned up too.
