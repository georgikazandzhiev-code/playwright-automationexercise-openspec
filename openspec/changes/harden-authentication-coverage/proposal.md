## Why

The `authentication` capability is the load-bearing one: `shopping-cart` (REQ-CRT-06) and
every `checkout` requirement depend on a session existing and staying alive. It is also
the capability whose inherited test coverage is worst.

> **Correction, recorded rather than quietly edited.** This proposal's first draft claimed
> `task3-login-logout.spec.ts` skips when `TEST_USER_EMAIL` is unset. Reading the file
> proved otherwise — it already seeds through `POST /api/createAccount` and skips nothing.
> The claim came from `README.md`, which still says it does. The real problem turned out to
> be narrower and more interesting, and is stated below. Left visible because a proposal
> built on an unchecked premise is exactly what this workflow exists to catch.

Today's coverage of `authentication` is `src/tests/ui/task3-login-logout.spec.ts`: two
tests, correctly seeded. What is wrong with it is not the seeding — it is what it asserts.

1. **The positive test cannot fail for the right reason.** It calls
   `assertAuthenticatedSessionVisible()`, which matches the regex `/Logged in as/i`. Any
   session, as any user, satisfies it. If the site logged you in as somebody else, the test
   stays green. This is precisely the weakness the REQ-AUT-02 tightening below targets.
2. **The negative test conflates two distinct requirements.** It submits an unknown email
   _and_ a wrong password in one action, so it cannot distinguish REQ-AUT-03's two
   scenarios, and it proves nothing at all about non-disclosure between them.
3. **Four of six requirements have no test.** REQ-AUT-01, REQ-AUT-05 and REQ-AUT-06 are
   untested; REQ-AUT-04 is asserted only as "the `Signup / Login` link is back".
4. **A `TEST_USER_EMAIL` trap is still armed.** `src/ui/data-providers/login.data.ts`
   exports `getExistingUserCredentials()`, which throws unless two env vars are set.
   Nothing imports it — it is dead code. `README.md`, `docs/TEST-EXECUTION-REPORT.md`,
   `.cursor/rules/project-overview.mdc` and `.github/workflows/playwright.yml` all still
   present those vars as required and state that Task 3 skips without them. Documentation
   that describes a suite the repo does not have is worse than no documentation: it is what
   produced the false premise at the top of this section.

Writing the capability's tests properly also surfaced two genuine gaps in the baseline
spec, which is what a spec review is for:

- Nothing in `authentication` states that the session **survives navigation**. Every
  checkout requirement silently assumes it. An assumption relied on by another capability
  and written down nowhere is the definition of a spec gap.
- `account-lifecycle` (REQ-ACC-03) and `subscription` (REQ-SUB-03) both claim native
  constraint validation on their email fields. `authentication` claims nothing equivalent,
  with no stated reason. That inconsistency is in our baseline, not in the site.

## What Changes

- **ADD** `REQ-AUT-05` — the session survives navigation across the site.
- **ADD** `REQ-AUT-06` — the login form refuses empty credentials before submitting.
- **MODIFY** `REQ-AUT-02` — bind the header indicator to the _registered_ name rather than
  an unspecified `<name>`. `Logged in as <somebody>` currently satisfies the requirement as
  written; it should not.
- Implement the full `authentication` capability (REQ-AUT-01 … REQ-AUT-06) as Playwright
  specs that **seed their own account** through `POST /api/createAccount` and delete it
  through `DELETE /api/deleteAccount` in teardown.
- **Remove** `src/tests/ui/task3-login-logout.spec.ts`, superseded by the above.
- **Remove** `src/ui/data-providers/login.data.ts` — dead code whose only effect is to make
  two env vars look required.
- **Correct** `README.md`, `docs/TEST-EXECUTION-REPORT.md`,
  `.cursor/rules/project-overview.mdc` and `.github/workflows/playwright.yml`, which
  document a `TEST_USER_EMAIL` dependency and a conditional skip that no longer exist.

Not breaking: no existing requirement is weakened or removed.

## Capabilities

### New Capabilities

_(none — `authentication` already exists in `openspec/specs/`)_

### Modified Capabilities

- `authentication`: adds REQ-AUT-05 (session persistence) and REQ-AUT-06 (empty-credential
  refusal); tightens REQ-AUT-02 so the header name must match the registered name.

## Impact

| Area                                      | Effect                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `openspec/specs/authentication/spec.md`   | Two requirements added, one tightened, on archive                          |
| `src/tests/ui/`                           | New `authentication.*.spec.ts` files; `task3-login-logout.spec.ts` deleted |
| `src/api/services/account-api.service.ts` | Reused for seeding; extended only if a gap appears                         |
| `src/ui/pages/login.page.ts`              | New locators/actions for the empty-submit and name-binding assertions      |
| `src/utils/constants.ts`                  | Any new site copy lands here, not inline                                   |
| `.env`                                    | `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` become unused by this capability  |
| Runtime                                   | Each test costs one account create + one delete against the live site      |

## Risks

| Risk                                                               | Mitigation                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The site is third-party and can change copy at any time            | Expected strings live in `src/utils/constants.ts`; a copy change is a one-line diff, and a failure is reported as a site change rather than patched away                                          |
| Ad interstitials intercept the header `Logout` control (defect D2) | Overlay resolution runs centrally after navigation; if `Logout` proves unclickable, that is recorded as a defect, not routed around inside the test                                               |
| Seeding via API then asserting in the UI couples two capabilities  | Accepted deliberately: the alternative is a shared `.env` account, which is the problem this change exists to remove. `public-api` REQ-API-11 already asserts the seeding endpoint's own contract |
