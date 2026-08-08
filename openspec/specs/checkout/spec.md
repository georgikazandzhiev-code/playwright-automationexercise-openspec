# Checkout — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.6 (REQ-CHK-*), vendor test cases
> TC 14, 15, 16, 23, 24.
>
> Depends on `account-lifecycle` (the address shown at checkout is the one captured at
> registration) and on `shopping-cart` (the order review restates the cart).

## Purpose

Define how a shopper turns a cart into an order on automationexercise.com — the
authentication gate, the address and order review the shopper is asked to confirm, the
requirement that those addresses actually reproduce what was registered, payment, and the
invoice that evidences the completed order.

## Requirements

### Requirement: REQ-CHK-01 — Checkout requires authentication

A guest SHALL NOT be able to complete an order. Proceeding to checkout without a session
SHALL prompt for registration or login.

#### Scenario: Guest is prompted to register or log in

- **GIVEN** a guest whose cart is not empty
- **WHEN** they proceed to checkout
- **THEN** they are prompted to register or log in
- **AND** the order does not proceed to payment

### Requirement: REQ-CHK-02 — Checkout presents addresses and an order review

An authenticated shopper proceeding to checkout SHALL be shown the delivery address, the
billing address and a review of the order before any payment step.

#### Scenario: All three blocks are displayed

- **GIVEN** an authenticated user whose cart is not empty
- **WHEN** they proceed to checkout
- **THEN** a delivery address block is displayed
- **AND** a billing address block is displayed
- **AND** a `Review Your Order` block is displayed

#### Scenario: The review restates the cart

- **GIVEN** the checkout page for a cart with known line items
- **THEN** the order review lists every line item in the cart
- **AND** each shows the same total it showed in the cart

### Requirement: REQ-CHK-03 — Addresses reproduce the registration data

The delivery address and the billing address SHALL both reproduce, field for field, the
address submitted when the account was registered.

#### Scenario: Delivery address matches registration

- **GIVEN** a user who registered with a known address
- **WHEN** they reach the checkout page
- **THEN** the delivery address shows the registered title-prefixed first and last name, company, address line 1, address line 2, city, state, zipcode, country and mobile number

#### Scenario: Billing address matches registration

- **GIVEN** the same user at the same checkout page
- **THEN** the billing address shows the same registered values as the delivery address

### Requirement: REQ-CHK-04 — An order comment is accepted

The checkout page SHALL accept a free-text comment and SHALL carry the order forward to
payment with it.

#### Scenario: Comment does not block the order

- **GIVEN** the checkout page
- **WHEN** the user enters a comment and places the order
- **THEN** the payment page is displayed
- **AND** no error is shown

### Requirement: REQ-CHK-05 — Payment completes the order

Submitting card details and confirming SHALL place the order and SHALL confirm it visibly.

#### Scenario: Order is confirmed

- **GIVEN** the payment page
- **WHEN** the user submits name on card, card number, CVC, expiry month and expiry year, and confirms
- **THEN** the order is placed
- **AND** an order confirmation is displayed

### Requirement: REQ-CHK-06 — The invoice is downloadable and non-empty

A confirmed order SHALL offer an invoice download, and the downloaded file SHALL have
content.

#### Scenario: Invoice downloads with content

- **GIVEN** a confirmed order
- **WHEN** the user activates `Download Invoice`
- **THEN** a file download is initiated
- **AND** the downloaded file is not empty

### Requirement: REQ-CHK-07 — Registering during checkout resumes the order

A guest who registers from the checkout prompt SHALL find their cart intact afterwards and
SHALL be able to complete the same order.

#### Scenario: Cart survives registration mid-checkout

- **GIVEN** a guest who reached the login prompt from checkout with a non-empty cart
- **WHEN** they complete registration from there and continue
- **THEN** the cart still contains the same products with the same quantities

#### Scenario: The order can be completed after registering

- **GIVEN** the state above
- **WHEN** the user proceeds to checkout again and completes payment
- **THEN** the order is confirmed

## Constraints inherited from the environment

| Constraint | Effect on this capability |
|---|---|
| C2 no reset | Every checkout scenario registers its own account and deletes it in teardown via the API. Orders themselves cannot be cleaned up — they are an accepted residue of testing this site, noted so it is a known cost rather than a surprise. |
| C6 payment is not real | The site accepts any 16-digit number and any future expiry; there is no gateway. No payment-validation requirement is claimed beyond REQ-CHK-05, because the site enforces none. Card data is synthetic and generated per run. |
| C1 shared environment | REQ-CHK-03 is the reason the registration address is generated per run and captured in the test's own data: comparing checkout against a *recorded* registration payload is the only way to prove the site round-tripped it, rather than that both happen to show the same constant. |

## Deferred

Payment-field validation (rejecting a short card number, a past expiry, a non-numeric CVC)
is **not** claimed. The site does not appear to enforce it, and asserting that it does not
would enshrine the absence of a control. Recorded here rather than silently omitted; see
`docs/requirements.md` §9.3.
