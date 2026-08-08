## Why

The `authentication` capability is the load-bearing one: `shopping-cart` (REQ-CRT-06) and
every `checkout` requirement depend on a session existing and staying alive. It is also
the capability whose inherited test coverage is worst.

Today `src/tests/ui/task3-login-logout.spec.ts` reads `TEST_USER_EMAIL` /
`TEST_USER_PASSWORD` from `.env` and **skips when they are absent**. That is a false green
in three ways:

1. CI without the secrets reports success while testing nothing.
2. The shared account can be deleted by any other run against this public site (constraint
   C1), turning a real regression into a skip.
3. A skip is invisible in a summary line — the signal this whole workflow exists to
   protect is exactly the one being lost.

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
- **MODIFY** `REQ-AUT-02` — bind the header indicator to the *registered* name rather than
  an unspecified `<name>`. `Logged in as <somebody>` currently satisfies the requirement as
  written; it should not.
- Implement the full `authentication` capability (REQ-AUT-01 … REQ-AUT-06) as Playwright
  specs that **seed their own account** through `POST /api/createAccount` and delete it
  through `DELETE /api/deleteAccount` in teardown.
- **Remove** `src/tests/ui/task3-login-logout.spec.ts`, superseded by the above. Its
  `TEST_USER_EMAIL` dependency and its `test.skip()` go with it.

Not breaking: no existing requirement is weakened or removed.

## Capabilities

### New Capabilities

*(none — `authentication` already exists in `openspec/specs/`)*

### Modified Capabilities

- `authentication`: adds REQ-AUT-05 (session persistence) and REQ-AUT-06 (empty-credential
  refusal); tightens REQ-AUT-02 so the header name must match the registered name.

## Impact

| Area | Effect |
|------|--------|
| `openspec/specs/authentication/spec.md` | Two requirements added, one tightened, on archive |
| `src/tests/ui/` | New `authentication.*.spec.ts` files; `task3-login-logout.spec.ts` deleted |
| `src/api/services/account-api.service.ts` | Reused for seeding; extended only if a gap appears |
| `src/ui/pages/login.page.ts` | New locators/actions for the empty-submit and name-binding assertions |
| `src/utils/constants.ts` | Any new site copy lands here, not inline |
| `.env` | `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` become unused by this capability |
| Runtime | Each test costs one account create + one delete against the live site |

## Risks

| Risk | Mitigation |
|------|-----------|
| The site is third-party and can change copy at any time | Expected strings live in `src/utils/constants.ts`; a copy change is a one-line diff, and a failure is reported as a site change rather than patched away |
| Ad interstitials intercept the header `Logout` control (defect D2) | Overlay resolution runs centrally after navigation; if `Logout` proves unclickable, that is recorded as a defect, not routed around inside the test |
| Seeding via API then asserting in the UI couples two capabilities | Accepted deliberately: the alternative is a shared `.env` account, which is the problem this change exists to remove. `public-api` REQ-API-11 already asserts the seeding endpoint's own contract |
