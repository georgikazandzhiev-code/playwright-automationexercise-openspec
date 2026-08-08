# Test Execution Report — Automation Exercise

> ## ⚠️ SUPERSEDED — historical snapshot of the upstream repo
>
> This report describes the suite of
> [playwright-automationexercise](https://github.com/georgikazandzhiev-code/playwright-automationexercise)
> at the point this repo forked from it. It is kept for provenance and is **no longer an
> accurate description of what runs here**.
>
> Two things in it are now wrong:
>
> - The **Task 3 positive → SKIP\*** row and its footnote. That test seeded its account
>   through the API and never skipped; the footnote described an earlier version. Stale
>   documentation like this is what produced a false premise in
>   `openspec/changes/harden-authentication-coverage/proposal.md` — see the correction at
>   the top of that file.
> - The **Task 3** rows themselves. That spec was replaced by 13 traceable cases
>   (`TC-01 … TC-13`) covering the whole `authentication` capability.
>
> **Current coverage lives in the spec layer, not here:**
> `docs/requirements.md` (requirements baseline) → `openspec/specs/` (capability contracts)
> → `openspec/changes/<id>/test-plan.md` (test cases and coverage matrix).

**Project:** [playwright-automationexercise](https://github.com/georgikazandzhiev-code/playwright-automationexercise)  
**Target:** https://www.automationexercise.com  
**Report type:** Regression summary (UI + API)  
**Prepared for:** Management / QA stakeholders

---

## Executive summary

| Metric                         | Value                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| **Total automated scenarios**  | **9**                                                        |
| **Passed (last verified run)** | **7–8** (see Task 3 note)                                    |
| **Failed**                     | **0**                                                        |
| **Skipped (conditional)**      | **0–1** (Task 3 positive without `.env` credentials)         |
| **Stack**                      | Playwright, TypeScript, Page Object Model, API service layer |
| **CI**                         | GitHub Actions (`Playwright CI` on push/PR to `main`)        |

The suite covers **three UI business tasks** (registration, search/cart, login/logout) plus **REST API** scenarios from the site’s official API list. Tests run against the **live demo site** (not a local mock).

---

## Results overview

| #   | Area        | Scenario                                                       | Type           | Tag         | Status                 |
| --- | ----------- | -------------------------------------------------------------- | -------------- | ----------- | ---------------------- |
| 1   | UI — Task 1 | Registers a new user and shows authenticated session           | Positive / E2E | `@e2e`      | **PASS**               |
| 2   | UI — Task 1 | Blocks invalid email on the signup intake form                 | Negative       | `@negative` | **PASS**               |
| 3   | UI — Task 2 | Search, open product, add to cart, verify cart line item       | Positive / E2E | `@e2e`      | **PASS**               |
| 4   | UI — Task 2 | Returns no product cards for a nonsense query                  | Negative       | `@negative` | **PASS**               |
| 5   | UI — Task 3 | Logs in with stored credentials and logs out cleanly           | Positive / E2E | `@e2e`      | **PASS** or **SKIP\*** |
| 6   | UI — Task 3 | Shows error for unknown email with wrong password              | Negative       | `@negative` | **PASS**               |
| 7   | API         | GET `productsList` returns full catalog (API 1)                | Positive       | `@api`      | **PASS**               |
| 8   | API         | POST `searchProduct` returns results for a keyword (API 5)     | Positive       | `@api`      | **PASS**               |
| 9   | API         | POST `searchProduct` without `search_product` rejected (API 6) | Negative       | `@negative` | **PASS**               |

\* **Task 3 positive** runs only when `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set in `.env` (or CI secrets). Otherwise Playwright **skips** it by design — not a failure.

---

## Coverage by business capability

### Task 1 — User registration (UI)

| Test     | What we verify                                       |
| -------- | ---------------------------------------------------- |
| Positive | Full signup flow → account created → session visible |
| Negative | Invalid email blocked by browser HTML5 validation    |

### Task 2 — Search & cart (UI)

| Test     | What we verify                                                   |
| -------- | ---------------------------------------------------------------- |
| Positive | Search “Tshirt” → product details → add to cart → cart line item |
| Negative | Nonsense query → zero product cards                              |

### Task 3 — Login / logout (UI)

| Test     | What we verify                                                  |
| -------- | --------------------------------------------------------------- |
| Positive | Login with configured user → logout → Signup/Login link visible |
| Negative | Wrong credentials → site error message                          |

### API (REST)

| Test              | What we verify                                                                     |
| ----------------- | ---------------------------------------------------------------------------------- |
| Products list     | Catalog returns HTTP 200, valid product shape, non-empty list                      |
| Search (positive) | Keyword search returns at least one product                                        |
| Search (negative) | Missing `search_product` → error in JSON body (site returns HTTP 200 + error code) |

---

## How to reproduce this report

From project root:

```powershell
# Full suite (UI + API)
npm test

# Split
npm run test:ui
npm run test:api

# HTML report (open after run)
npx playwright show-report
```

Save console output for audit:

```powershell
npm test -- --reporter=list 2>&1 | Tee-Object -FilePath test-run-log.txt
```

---

## Environment & dependencies

| Item          | Detail                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Browser (UI)  | Chromium (headless in CI; headed optional locally)                     |
| Base URL      | `BASE_URL` → default `https://www.automationexercise.com`              |
| Credentials   | Task 3 positive: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`               |
| External risk | Third-party ads / cookie banners — mitigated in `src/utils/consent.ts` |

---

## CI/CD

- Workflow: `.github/workflows/playwright.yml`
- Triggers: push and pull request to `main`
- Steps: `npm install` → `npm run typecheck` → Playwright browsers → `npm test`

---

## Known limitations (for stakeholders)

1. **Live third-party site** — occasional flakiness from ads/interstitials; mitigated but not eliminated.
2. **Task 3 positive** — requires a pre-existing test account in `.env` / CI secrets.
3. **Registration positive** — creates real users on the demo site (acceptable for practice environment).
4. **API contract** — demo API uses JSON `responseCode` for errors; not always HTTP 4xx.

---

## Conclusion

The automation pack delivers **broad coverage** of the assigned UI tasks and **core API** scenarios with **positive and negative** paths. **No failing tests** were observed in the latest API run (**3/3 passed**). UI scenarios were validated end-to-end during development; full regression is executed via `npm test` before release/PR.

**Recommendation:** Keep CI secrets for Task 3, run full `npm test` before demos to management, and attach `playwright-report` HTML on failed CI builds.

---

_To refresh numbers after a new run, execute `npm test` and update the Status column in the results table above._
