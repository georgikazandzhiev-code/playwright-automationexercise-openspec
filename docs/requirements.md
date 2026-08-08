# Requirements — automationexercise.com

**Status:** Baseline, reverse-engineered
**Source of truth:** the vendor-published [test case catalogue](https://automationexercise.com/test_cases) (26 cases) and [API list](https://automationexercise.com/api_list) (14 endpoints), cross-checked against the live site.
**Consumers:** `openspec/specs/**` (capability specs), which in turn gate every test written in this repo.

---

## 1. Why this document exists

We do not own the system under test. There is no backend source, no product owner, and no
internal specification for automationexercise.com. Writing tests directly from a URL means
every assertion encodes a private guess about intended behaviour, and those guesses are
invisible to review.

This document makes the guesses explicit. It is the **requirements baseline**: a written,
reviewable statement of what the site is supposed to do, derived from the only two artifacts
the vendor publishes as authoritative — the test-case catalogue and the API list.

Everything downstream is derived from here:

```
docs/requirements.md        ← this file (human-readable baseline, REQ-* ids)
        ↓ distilled per capability
openspec/specs/<cap>/spec.md ← machine-checkable requirements + Scenario blocks
        ↓ changed via
openspec/changes/<id>/       ← proposal → spec delta → test-plan (TC-*) → tasks
        ↓ implemented as
src/tests/**                 ← Playwright specs, each named with its TC id
```

A requirement that is not in this file must not appear in a capability spec. A capability
spec requirement that has no test case blocks the OpenSpec workflow.

---

## 2. Scope

### 2.1 In scope

The public storefront at `https://www.automationexercise.com` and its public REST API:

- account lifecycle (register, log in, log out, delete)
- product catalogue browsing (all products, product detail, categories, brands)
- product search
- product reviews
- shopping cart
- checkout, payment and invoice download
- newsletter subscription
- contact form
- static/navigational pages and scroll behaviour
- REST API 1–14 as published on `/api_list`

### 2.2 Out of scope

| Area | Reason |
|------|--------|
| Admin/back-office behaviour | Not exposed publicly |
| Database state, email delivery | No access; the site sends no verifiable mail |
| Payment processor integration | The site accepts any card data; no real gateway |
| Performance, load, availability SLOs | No SLO is published; see [k6 note](#94-non-functional) |
| Cross-browser matrix beyond Chromium | Deliberate first-iteration scope decision |
| Accessibility conformance | No published target; candidate for a later change |

---

## 3. Actors

| Actor | Definition |
|-------|------------|
| **Guest** | Unauthenticated visitor. Can browse, search, review, subscribe, use the cart and start checkout. |
| **Registered user** | Holds an account (email + password). Adds delivery/billing address at registration. Can complete checkout. |
| **API client** | Any HTTP client calling `/api/*`. Unauthenticated; identity is asserted by email+password in the request body. |

---

## 4. Glossary

| Term | Meaning |
|------|---------|
| **Intake form** | The name + email form under *New User Signup!* on `/login`; gateway into the full registration form. |
| **Account information form** | The full registration form on `/signup` (title, password, DOB, address, newsletter/offers opt-ins). |
| **Authenticated banner** | The header text `Logged in as <username>` — the site's only visible session indicator. |
| **Line item** | One product row in the cart: name, price, quantity, computed total. |
| **`responseCode`** | A status-like integer inside the JSON **body** of an API response. It is independent of the HTTP status, which is `200` for most endpoints. |
| **Vignette** | A Google full-page interstitial ad (`#google_vignette`) that intercepts clicks on this site. |

---

## 5. Environmental constraints

These are properties of the system under test, not of our framework. They constrain every
requirement below and must be reflected in the capability specs.

| # | Constraint | Consequence for testing |
|---|-----------|------------------------|
| **C1** | **Shared public environment.** Anyone in the world mutates the same catalogue, review list and account table concurrently. | No test may assert on global counts, on "the newest review", or on a fixed product id existing forever. Assert on *self-created* data. |
| **C2** | **No data reset.** Every account created stays until deleted. | Every test that creates an account MUST delete it in teardown, via API 12 (`DELETE /api/deleteAccount`) rather than the UI, so cleanup survives a mid-test failure. |
| **C3** | **Ad interstitials.** Google vignette and a CMP consent dialog intercept clicks unpredictably. | Header navigation is unreliable; direct `goto` to a known path is the sanctioned workaround. Overlay resolution must be centralised, never per-test. |
| **C4** | **HTTP status is not the API contract.** Most `/api/*` endpoints return HTTP `200` and carry the real status in `responseCode`. Some deployments return `responseCode: 3` where the docs promise `400`. | API assertions must be made on the **body**. Any divergence from `/api_list` is a defect of the site and is recorded in [§10 Known defects](#10-known-defects-of-the-system-under-test), never hidden by loosening a schema. |
| **C5** | **No email verification.** Registration completes without confirming the address. | Any address in a domain we control is usable; no mailbox polling is required. |
| **C6** | **Payment is not real.** Any 16-digit number and any future expiry is accepted. | Card data is synthetic; no negative payment-validation requirement is claimed beyond what the site actually enforces. |

---

## 6. Functional requirements

Requirement ids are stable. `REQ-<CAP>-<nn>`. Each carries its acceptance criteria in
Given/When/Then form; the capability specs in `openspec/specs/` restate these as
`Scenario:` blocks.

### 6.1 Account registration — `ACC`

#### REQ-ACC-01 — Intake form starts registration
**GIVEN** a guest on `/login`
**WHEN** they submit a name and an email address not already registered
**THEN** the account information form is displayed with heading `ENTER ACCOUNT INFORMATION`
**AND** the submitted name and email are pre-filled and the email is read-only.

#### REQ-ACC-02 — Duplicate email is rejected at intake
**GIVEN** a guest on `/login`
**WHEN** they submit the intake form with an email that already has an account
**THEN** registration does not proceed
**AND** the error `Email Address already exist!` is displayed on the same page.

#### REQ-ACC-03 — Malformed email is rejected before submission
**GIVEN** a guest on `/login`
**WHEN** they enter a value that is not a valid email address and submit the intake form
**THEN** the browser's native constraint validation blocks submission
**AND** the page does not navigate.

#### REQ-ACC-04 — Full registration creates an account
**GIVEN** a guest who has passed intake
**WHEN** they complete the account information form — title, password, date of birth, first
name, last name, company, address, address 2, country, state, city, zipcode, mobile number —
and submit
**THEN** the page `ACCOUNT CREATED!` is displayed with a `Continue` control.

#### REQ-ACC-05 — Continue establishes an authenticated session
**GIVEN** the `ACCOUNT CREATED!` page
**WHEN** the user activates `Continue`
**THEN** they are returned to the storefront
**AND** the header shows `Logged in as <name>` with the name submitted at intake.

#### REQ-ACC-06 — Optional opt-ins are honoured
**GIVEN** the account information form
**WHEN** the user selects `Sign up for our newsletter!` and/or `Receive special offers from our partners!`
**THEN** submission succeeds with those preferences recorded
**AND** neither checkbox is required to complete registration.

#### REQ-ACC-07 — Account deletion
**GIVEN** an authenticated user
**WHEN** they activate `Delete Account`
**THEN** `ACCOUNT DELETED!` is displayed with a `Continue` control
**AND** after `Continue` the session is terminated and the header shows `Signup / Login`
**AND** the deleted credentials no longer authenticate.

> Traces: TC 1, TC 5, TC 14, TC 15, TC 23.

---

### 6.2 Authentication — `AUT`

#### REQ-AUT-01 — Login page is reachable and labelled
**GIVEN** a guest
**WHEN** they open `Signup / Login`
**THEN** the section `Login to your account` and the section `New User Signup!` are both visible.

#### REQ-AUT-02 — Valid credentials authenticate
**GIVEN** a registered account
**WHEN** its email and password are submitted to the login form
**THEN** the user is returned to the storefront
**AND** the header shows `Logged in as <name>`.

#### REQ-AUT-03 — Invalid credentials are rejected
**GIVEN** the login form
**WHEN** an unknown email, or a known email with the wrong password, is submitted
**THEN** no session is created
**AND** the error `Your email or password is incorrect!` is displayed
**AND** the error text is identical for an unknown email and a wrong password — the site must
not disclose which of the two was wrong.

#### REQ-AUT-04 — Logout terminates the session
**GIVEN** an authenticated user
**WHEN** they activate `Logout`
**THEN** they are navigated to the login page
**AND** the header shows `Signup / Login` instead of `Logged in as <name>`.

> Traces: TC 2, TC 3, TC 4.
> Note: REQ-AUT-03's non-disclosure clause is **our** requirement, not the vendor's. It is a
> standard anti-enumeration control (OWASP). If the site were to differentiate the messages,
> that is a finding, not a test failure to be adjusted away.

---

### 6.3 Product catalogue — `CAT`

#### REQ-CAT-01 — All Products page lists the catalogue
**GIVEN** any visitor
**WHEN** they open `Products`
**THEN** the page heading `ALL PRODUCTS` is visible
**AND** at least one product card is rendered
**AND** each card exposes a name, a price and a `View Product` affordance.

#### REQ-CAT-02 — Product detail exposes the full descriptor
**GIVEN** the All Products page
**WHEN** the visitor opens a product's `View Product`
**THEN** the product detail page displays, at minimum: product name, category, price,
availability, condition and brand.

#### REQ-CAT-03 — Category navigation
**GIVEN** the home page
**THEN** a category sidebar is visible with top-level groups (`WOMEN`, `MEN`, `KIDS`)
**WHEN** a visitor expands a group and selects a sub-category
**THEN** the category listing page is displayed
**AND** its heading names the selected group and sub-category, e.g. `WOMEN - TOPS PRODUCTS`
**AND** every listed product belongs to that category.

#### REQ-CAT-04 — Brand navigation
**GIVEN** the All Products page
**THEN** a brands sidebar is visible
**WHEN** a visitor selects a brand
**THEN** the brand listing page is displayed with a heading naming that brand
**AND** at least one product is listed
**AND** selecting a different brand from the sidebar navigates to that brand's listing.

#### REQ-CAT-05 — Recommended items
**GIVEN** the home page scrolled to the bottom
**THEN** the section `RECOMMENDED ITEMS` is visible with at least one product
**AND** each recommended product offers `Add to cart`.

> Traces: TC 8, TC 18, TC 19, TC 22.

---

### 6.4 Product search — `SRH`

#### REQ-SRH-01 — Matching search returns results
**GIVEN** the All Products page
**WHEN** a visitor searches for a term present in the catalogue
**THEN** the heading `SEARCHED PRODUCTS` is displayed
**AND** at least one product is listed
**AND** every listed product's name contains the search term, case-insensitively.

#### REQ-SRH-02 — Non-matching search returns an empty result set
**GIVEN** the All Products page
**WHEN** a visitor searches for a term present in no product name
**THEN** the heading `SEARCHED PRODUCTS` is displayed
**AND** zero product cards are listed
**AND** no error page is shown.

#### REQ-SRH-03 — Search results are actionable
**GIVEN** a non-empty search result set
**THEN** each result offers `Add to cart` and `View Product` identically to the All Products page.

> Traces: TC 9, TC 20.

---

### 6.5 Shopping cart — `CRT`

#### REQ-CRT-01 — Add a product to the cart
**GIVEN** any product listing or product detail page
**WHEN** a visitor adds a product to the cart
**THEN** a modal offers `Continue Shopping` and `View Cart`
**AND** the cart contains a line item for that product.

#### REQ-CRT-02 — Cart line items are accurate
**GIVEN** a cart with one or more products
**WHEN** the cart page is opened
**THEN** each line item shows the product name, its unit price, its quantity and a total
**AND** each line item's total equals unit price × quantity.

#### REQ-CRT-03 — Multiple distinct products coexist
**GIVEN** an empty cart
**WHEN** two different products are added in sequence
**THEN** the cart contains exactly two line items, one per product, each with its own price
and quantity.

#### REQ-CRT-04 — Quantity chosen on the detail page is respected
**GIVEN** a product detail page
**WHEN** the visitor sets the quantity to *n* (*n* > 1) and adds to the cart
**THEN** the cart line item for that product shows quantity exactly *n*
**AND** its total equals unit price × *n*.

#### REQ-CRT-05 — Remove a product from the cart
**GIVEN** a cart containing a product
**WHEN** the visitor activates the removal control on that line item
**THEN** the line item is removed
**AND** the remaining line items are unchanged.

#### REQ-CRT-06 — Cart survives login
**GIVEN** a guest with products in the cart
**WHEN** they log in to an existing account
**THEN** the same products are still present in the cart with the same quantities.

> Traces: TC 12, TC 13, TC 17, TC 20, TC 22.

---

### 6.6 Checkout and orders — `CHK`

#### REQ-CHK-01 — Checkout requires authentication
**GIVEN** a guest with a non-empty cart
**WHEN** they proceed to checkout
**THEN** they are prompted to register or log in before the order can continue.

#### REQ-CHK-02 — Checkout shows address details and order review
**GIVEN** an authenticated user with a non-empty cart proceeding to checkout
**THEN** the checkout page displays a delivery address block, a billing address block and a
`Review Your Order` block listing every cart line item with its total.

#### REQ-CHK-03 — Addresses mirror registration data
**GIVEN** a user who registered with a given address
**WHEN** they reach the checkout page
**THEN** the delivery address and the billing address both reproduce, field for field, the
address submitted during registration — including title-prefixed name, company, address 1,
address 2, city, state, zipcode, country and mobile number.

#### REQ-CHK-04 — Order comment is accepted
**GIVEN** the checkout page
**WHEN** the user enters a comment and places the order
**THEN** the order proceeds to payment without error.

#### REQ-CHK-05 — Payment completes the order
**GIVEN** the payment page
**WHEN** the user submits name on card, card number, CVC and expiry month/year and confirms
**THEN** the order is placed
**AND** a confirmation is displayed — `Your order has been placed successfully!` /
`Congratulations! Your order has been confirmed!`.

#### REQ-CHK-06 — Invoice is downloadable
**GIVEN** a confirmed order
**WHEN** the user activates `Download Invoice`
**THEN** a file download is initiated
**AND** the downloaded file is non-empty.

#### REQ-CHK-07 — Registering during checkout resumes the order
**GIVEN** a guest who reached the login prompt from checkout with a non-empty cart
**WHEN** they complete registration from there
**THEN** their cart is intact
**AND** checkout can be resumed to completion.

> Traces: TC 14, TC 15, TC 16, TC 23, TC 24.

---

### 6.7 Product reviews — `REV`

#### REQ-REV-01 — Review form is present on product detail
**GIVEN** a product detail page
**THEN** a `Write Your Review` section is visible with name, email and review inputs and a submit control.

#### REQ-REV-02 — Review submission is acknowledged
**GIVEN** the review form
**WHEN** a visitor submits a name, an email and review text
**THEN** the success message `Thank you for your review.` is displayed.

#### REQ-REV-03 — Review does not require authentication
**GIVEN** a guest
**THEN** REQ-REV-02 holds without a session.

> Traces: TC 21.
> Constraint C1 applies: the review list is globally shared, so no test may assert on the
> presence, position or count of the submitted review afterwards.

---

### 6.8 Newsletter subscription — `SUB`

#### REQ-SUB-01 — Subscription block is present in the footer
**GIVEN** any page with the site footer — home page and cart page at minimum
**WHEN** the visitor scrolls to the footer
**THEN** the `SUBSCRIPTION` heading, an email input and a submit control are visible.

#### REQ-SUB-02 — Valid address is accepted
**GIVEN** the footer subscription block
**WHEN** a syntactically valid email address is submitted
**THEN** the message `You have been successfully subscribed!` is displayed.

#### REQ-SUB-03 — Invalid address is rejected before submission
**GIVEN** the footer subscription block
**WHEN** a value that is not a valid email address is submitted
**THEN** native constraint validation blocks submission
**AND** no success message is displayed.

> Traces: TC 10, TC 11.

---

### 6.9 Contact form — `CTC`

#### REQ-CTC-01 — Contact page is reachable
**GIVEN** any page
**WHEN** the visitor activates `Contact us`
**THEN** the contact page is displayed with the heading `GET IN TOUCH`.

#### REQ-CTC-02 — Submission with an attachment succeeds
**GIVEN** the contact form
**WHEN** the visitor supplies name, email, subject, message and a file, submits, and accepts
the browser confirmation dialog
**THEN** the message `Success! Your details have been submitted successfully.` is displayed.

#### REQ-CTC-03 — Return to home
**GIVEN** the contact success state
**WHEN** the visitor activates `Home`
**THEN** the home page is displayed.

> Traces: TC 6.

---

### 6.10 Site navigation and page behaviour — `NAV`

#### REQ-NAV-01 — Home page identity
**GIVEN** a visitor navigating to the site root
**THEN** the home page loads with the site header, the category sidebar and the slider text
`Full-Fledged practice website for Automation Engineers`.

#### REQ-NAV-02 — Test Cases page is reachable
**GIVEN** any page
**WHEN** the visitor activates `Test Cases`
**THEN** the URL is `/test_cases` and the test case list is displayed.

#### REQ-NAV-03 — Scroll-to-top control
**GIVEN** the home page scrolled to the footer, with `SUBSCRIPTION` visible
**WHEN** the visitor activates the scroll-up arrow control
**THEN** the page returns to the top and `Full-Fledged practice website for Automation Engineers` is visible.

#### REQ-NAV-04 — Manual scroll to top
**GIVEN** the same starting state as REQ-NAV-03
**WHEN** the visitor scrolls to the top without the arrow control
**THEN** the same end state as REQ-NAV-03 holds.

> Traces: TC 7, TC 25, TC 26.

---

### 6.11 Public REST API — `API`

The `responseCode` values below are the **body** field, per constraint C4.

#### REQ-API-01 — Products list
`GET /api/productsList` returns `responseCode: 200` and a `products` array. Each product
carries `id`, `name`, `price`, `brand` and a `category` object with `usertype.usertype` and
`category`.

#### REQ-API-02 — Products list rejects POST
`POST /api/productsList` returns `responseCode: 405` and `This request method is not supported.`

#### REQ-API-03 — Brands list
`GET /api/brandsList` returns `responseCode: 200` and a `brands` array of `{ id, brand }`.

#### REQ-API-04 — Brands list rejects PUT
`PUT /api/brandsList` returns `responseCode: 405` and `This request method is not supported.`

#### REQ-API-05 — Search product
`POST /api/searchProduct` with form field `search_product` returns `responseCode: 200` and a
`products` array whose entries match the term.

#### REQ-API-06 — Search product without the parameter
`POST /api/searchProduct` with no `search_product` field returns `responseCode: 400` and a
message naming the missing `search_product` parameter.

#### REQ-API-07 — Verify login, valid
`POST /api/verifyLogin` with a registered `email` + `password` returns `responseCode: 200` and `User exists!`

#### REQ-API-08 — Verify login, missing parameter
`POST /api/verifyLogin` without `email` returns `responseCode: 400` and a message naming the
missing email or password parameter.

#### REQ-API-09 — Verify login rejects DELETE
`DELETE /api/verifyLogin` returns `responseCode: 405` and `This request method is not supported.`

#### REQ-API-10 — Verify login, unknown user
`POST /api/verifyLogin` with credentials that match no account returns `responseCode: 404` and `User not found!`

#### REQ-API-11 — Create account
`POST /api/createAccount` with the full parameter set — `name, email, password, title,
birth_date, birth_month, birth_year, firstname, lastname, company, address1, address2,
country, zipcode, state, city, mobile_number` — returns `responseCode: 201` and `User created!`
**AND** the created account then satisfies REQ-API-07 and can log in through the UI.

#### REQ-API-12 — Delete account
`DELETE /api/deleteAccount` with `email` + `password` returns `responseCode: 200` and
`Account deleted!` **AND** the account subsequently satisfies REQ-API-10.

#### REQ-API-13 — Update account
`PUT /api/updateAccount` with the REQ-API-11 parameter set returns `responseCode: 200` and `User updated!`

#### REQ-API-14 — Get user detail by email
`GET /api/getUserDetailByEmail?email=<registered>` returns `responseCode: 200`, `User Detail`
and a `user` object reproducing the registration data.

> Traces: `/api_list` API 1–14. API 11 and API 12 are additionally load-bearing for
> constraint C2 — they are the seeding and cleanup mechanism for UI tests.

---

## 7. Cross-cutting requirements

#### REQ-X-01 — Deterministic session state
Every scenario declares whether it begins as a guest or as an authenticated user, and
establishes that state itself. No scenario may depend on state left behind by another.

#### REQ-X-02 — Self-cleanup
Every scenario that creates an account, or mutates any server-side state that persists,
reverses that mutation before it ends, using API 12 for accounts. Cleanup runs even when the
scenario's assertions fail.

#### REQ-X-03 — Unique identities
Every registration uses a per-run unique email so that concurrent runs and CI reruns cannot
collide (constraint C1).

#### REQ-X-04 — Overlay tolerance
Interstitial ads and consent dialogs are neutralised centrally, once, for all scenarios
(constraint C3). No scenario contains its own ad-dismissal logic.

---

## 8. Traceability — vendor test case → requirement

| TC | Title | Requirements |
|----|-------|--------------|
| 1 | Register User | REQ-ACC-01, 04, 05, 06, 07 |
| 2 | Login with correct email and password | REQ-AUT-01, 02; REQ-ACC-07 |
| 3 | Login with incorrect email and password | REQ-AUT-01, 03 |
| 4 | Logout User | REQ-AUT-02, 04 |
| 5 | Register with existing email | REQ-ACC-02 |
| 6 | Contact Us Form | REQ-CTC-01, 02, 03 |
| 7 | Verify Test Cases page | REQ-NAV-02 |
| 8 | All Products and product detail page | REQ-CAT-01, 02 |
| 9 | Search Product | REQ-SRH-01 |
| 10 | Subscription on home page | REQ-SUB-01, 02 |
| 11 | Subscription on cart page | REQ-SUB-01, 02 |
| 12 | Add Products in Cart | REQ-CRT-01, 02, 03 |
| 13 | Verify Product quantity in Cart | REQ-CRT-04 |
| 14 | Place Order: Register while Checkout | REQ-CHK-01, 07, 02, 04, 05; REQ-ACC-04, 05, 07 |
| 15 | Place Order: Register before Checkout | REQ-ACC-04, 05; REQ-CHK-02, 04, 05; REQ-ACC-07 |
| 16 | Place Order: Login before Checkout | REQ-AUT-02; REQ-CHK-02, 04, 05 |
| 17 | Remove Products From Cart | REQ-CRT-05 |
| 18 | View Category Products | REQ-CAT-03 |
| 19 | View & Cart Brand Products | REQ-CAT-04 |
| 20 | Search Products and Verify Cart After Login | REQ-SRH-01, 03; REQ-CRT-06 |
| 21 | Add review on product | REQ-REV-01, 02, 03 |
| 22 | Add to cart from Recommended items | REQ-CAT-05; REQ-CRT-01 |
| 23 | Verify address details in checkout page | REQ-CHK-03 |
| 24 | Download Invoice after purchase order | REQ-CHK-05, 06 |
| 25 | Scroll Up using Arrow button | REQ-NAV-01, 03 |
| 26 | Scroll Up without Arrow button | REQ-NAV-01, 04 |

**Requirements with no vendor test case** — added by us because the vendor catalogue is
positive-path-heavy. These are deliberate additions, not transcription:

| Requirement | Rationale |
|-------------|-----------|
| REQ-ACC-03 | Malformed email at intake; the catalogue has no negative registration case. |
| REQ-AUT-03 (non-disclosure clause) | Anti-enumeration control. |
| REQ-SRH-02 | Empty result set; the catalogue only covers matching searches. |
| REQ-SUB-03 | Invalid subscription address. |
| REQ-API-02, 03, 04, 07, 08, 09, 10, 13, 14 | Published in `/api_list` but absent from the UI test catalogue. |
| REQ-X-01 … REQ-X-04 | Test-integrity requirements imposed by constraints C1–C3. |

---

## 9. Assumptions and open questions

### 9.1 Assumptions

1. The vendor's published test-case catalogue reflects intended behaviour and is current.
2. String literals quoted here are the site's actual copy; where the catalogue's casing
   differs from the rendered DOM (e.g. `ACCOUNT CREATED!` vs `Account Created!`), the
   rendered DOM wins and assertions are case-insensitive on headings.
3. The site remains free and publicly reachable without an API key.

### 9.2 Open questions

| # | Question | Impact if wrong |
|---|----------|-----------------|
| Q1 | Is `responseCode: 3` on some hosts an intended value or a regression? `/api_list` documents `400`. | REQ-API-06 / REQ-API-08 assertions. Tracked in §10. |
| Q2 | Is cart persistence (REQ-CRT-06) session-scoped or account-scoped? TC 20 only proves it survives a login within one session. | Scope of REQ-CRT-06; we assert only the TC-20 case. |
| Q3 | Does the site enforce any password policy at registration? None is documented. | No password-policy requirement is claimed. |

### 9.3 Deferred

Payment-field validation, order history, address book editing, and the `/api/updateAccount`
side effects on the UI are deferred to a later change; they are documented here so their
absence is visible rather than silently uncovered.

### 9.4 Non-functional

No availability, latency or throughput target is published for this site, so none is claimed
as a requirement. If load testing is added later it must state its own target explicitly
rather than inferring one.

---

## 10. Known defects of the system under test

Recorded here so that a test asserting the documented contract may fail *by design* rather
than being weakened to match the bug.

| # | Observed | Documented behaviour | Handling |
|---|----------|---------------------|----------|
| **D1** | `POST /api/searchProduct` without `search_product` returns `responseCode: 3` on some deployments. | `/api_list` API 6 promises `400`. | Assert the message names the missing parameter; record the code divergence. Do not loosen the schema. |
| **D2** | Header link clicks (`Signup / Login`, `Cart`) are intermittently intercepted by Google vignette interstitials. | Header navigation should work. | Mitigated by direct navigation (C3); the interception itself is a site defect, not ours. |
| **D3** | `/api/createAccount` returns HTTP `200` while the body carries `201`. | Not stated; `/api_list` lists response code `201` without distinguishing HTTP from body. | Assert the body. Covered by C4. |

---

## 11. Change control

This document is amended through the OpenSpec flow, not edited ad hoc:

1. `/opsx:propose` — state why the requirement changes and draft the spec delta.
2. `/opsx:testplan` — every new or modified requirement gets ≥1 `TC-NN` before code.
3. `/opsx:apply` — tests first, red, then implementation.
4. `/opsx:verify` — coverage gate; an uncovered requirement blocks.
5. `/opsx:archive` — the delta folds into `openspec/specs/`, and the REQ ids here are updated
   in the same change.

A requirement id is never reused. Removing a requirement means marking it removed, not
deleting the id.
