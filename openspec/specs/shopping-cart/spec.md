# Shopping cart — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.5 (REQ-CRT-\*), vendor test cases
> TC 12, 13, 17, 20, 22.

## Purpose

Define what automationexercise.com's cart holds and how it arithmetic — that a line item
reproduces the product's price and the chosen quantity, that its total is the product of
the two, that distinct products do not merge, that removal is precise, and that logging in
does not discard what a guest already collected.

## Requirements

### Requirement: REQ-CRT-01 — Adding a product places it in the cart

Adding a product from any listing, search result, recommended strip or detail page SHALL
place it in the cart and SHALL offer the shopper the choice to continue or to review.

#### Scenario: Add offers continue or view

- **GIVEN** any page offering `Add to cart` for a product
- **WHEN** the visitor adds that product
- **THEN** a modal is displayed offering `Continue Shopping` and `View Cart`

#### Scenario: The added product is in the cart

- **GIVEN** a product that has just been added
- **WHEN** the cart page is opened
- **THEN** a line item for that product is present

### Requirement: REQ-CRT-02 — Line items are arithmetically consistent

Each cart line item SHALL show the product's name, its unit price, its quantity and a
total, and the total SHALL equal the unit price multiplied by the quantity.

#### Scenario: Line item shows the four values

- **GIVEN** a cart containing at least one product
- **THEN** each line item shows a product name, a unit price, a quantity and a total

#### Scenario: Total equals price times quantity

- **GIVEN** a cart line item with a known unit price and quantity
- **THEN** its displayed total equals unit price × quantity

### Requirement: REQ-CRT-03 — Distinct products remain distinct

Adding two different products SHALL produce two line items. They SHALL NOT be merged, and
neither SHALL overwrite the other.

#### Scenario: Two products yield two line items

- **GIVEN** an empty cart
- **WHEN** two different products are added in sequence
- **THEN** the cart contains exactly two line items
- **AND** each names one of the two added products
- **AND** each carries its own unit price and quantity

### Requirement: REQ-CRT-04 — Quantity chosen on the detail page is respected

A quantity chosen on the product detail page before adding SHALL be the quantity in the
cart. It SHALL NOT be reset to one.

#### Scenario: Quantity of four is carried through

- **GIVEN** a product detail page
- **WHEN** the visitor sets the quantity to 4 and adds the product to the cart
- **THEN** the cart line item for that product shows quantity 4
- **AND** its total equals its unit price × 4

### Requirement: REQ-CRT-05 — Removal affects only the targeted line item

Removing a line item SHALL remove that item and SHALL leave every other line item
untouched.

#### Scenario: Removed product disappears

- **GIVEN** a cart containing a product
- **WHEN** the visitor activates the removal control on that line item
- **THEN** that line item is no longer present

#### Scenario: Other line items survive removal

- **GIVEN** a cart containing two products
- **WHEN** one line item is removed
- **THEN** exactly one line item remains
- **AND** it is the one that was not removed, with its quantity and total unchanged

### Requirement: REQ-CRT-06 — The cart survives login

Products collected as a guest SHALL still be in the cart after that visitor logs in to an
existing account, with the same quantities.

#### Scenario: Guest cart persists through login

- **GIVEN** a guest whose cart contains one or more products
- **WHEN** they log in to an existing account
- **AND** they return to the cart page
- **THEN** the same products are present
- **AND** each has the quantity it had before login

## Constraints inherited from the environment

| Constraint            | Effect on this capability                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1 shared environment | Prices change without notice. No scenario hardcodes a price; each reads the unit price from the page and asserts the _relationship_ to the total. This is what makes REQ-CRT-02 meaningful rather than decorative. |
| C1 shared environment | The two products in REQ-CRT-03 are selected positionally (first and second listed), never by id.                                                                                                                   |
| C2 no reset           | REQ-CRT-06 requires an account. It is seeded via `POST /api/createAccount` and deleted in teardown.                                                                                                                |

## Open question

REQ-CRT-06 asserts only that the cart survives a login **within one browser session** —
that is what vendor TC 20 proves. Whether the cart is bound to the account and would
survive a new session is untested and unclaimed (see `docs/requirements.md` Q2). Recorded
rather than silently assumed.
