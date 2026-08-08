# Product catalog — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.3 (REQ-CAT-\*), vendor test cases
> TC 8, 18, 19, 22.

## Purpose

Define how automationexercise.com presents its merchandise for browsing — the full
listing, the per-product detail descriptor, and the two filtered views a shopper navigates
by (category and brand) — plus the recommended-items strip that is a second entry point
into the cart.

## Requirements

### Requirement: REQ-CAT-01 — All Products page lists the catalogue

The site SHALL provide a page listing every purchasable product, each rendered as a card
carrying enough information to decide whether to open it.

#### Scenario: Listing renders product cards

- **GIVEN** any visitor
- **WHEN** they open `Products`
- **THEN** the heading `ALL PRODUCTS` is visible
- **AND** at least one product card is rendered
- **AND** each rendered card exposes a product name, a price and a `View Product` affordance

### Requirement: REQ-CAT-02 — Product detail exposes the full descriptor

Opening a product SHALL display its complete descriptor, so a shopper can judge it without
returning to the listing.

#### Scenario: Detail page shows every documented attribute

- **GIVEN** the All Products page
- **WHEN** the visitor opens the `View Product` control of a listed product
- **THEN** the product detail page is displayed
- **AND** it shows the product name, its category, its price, its availability, its condition and its brand

### Requirement: REQ-CAT-03 — Category navigation filters the catalogue

The site SHALL offer a category sidebar with expandable top-level groups, and selecting a
sub-category SHALL display a listing restricted to it.

#### Scenario: Category sidebar is present

- **GIVEN** the home page
- **THEN** a category sidebar is visible
- **AND** it offers the top-level groups `WOMEN`, `MEN` and `KIDS`

#### Scenario: Sub-category shows its own listing

- **GIVEN** the category sidebar with a group expanded
- **WHEN** the visitor selects a sub-category within it
- **THEN** the category listing page is displayed
- **AND** its heading names the selected group and sub-category, in the form `<GROUP> - <SUBCATEGORY> PRODUCTS`
- **AND** at least one product is listed

#### Scenario: Switching group from the listing

- **GIVEN** a category listing page for one group
- **WHEN** the visitor selects a sub-category of a different group from the sidebar
- **THEN** the listing for that other group's sub-category is displayed
- **AND** its heading names the newly selected group and sub-category

### Requirement: REQ-CAT-04 — Brand navigation filters the catalogue

The All Products page SHALL offer a brands sidebar, and selecting a brand SHALL display a
listing restricted to that brand.

#### Scenario: Brand sidebar is present

- **GIVEN** the All Products page
- **THEN** a brands sidebar is visible with at least one brand

#### Scenario: Brand listing is displayed

- **GIVEN** the brands sidebar
- **WHEN** the visitor selects a brand
- **THEN** a listing page whose heading names that brand is displayed
- **AND** at least one product is listed

#### Scenario: Switching brand from the listing

- **GIVEN** a brand listing page
- **WHEN** the visitor selects a different brand from the sidebar
- **THEN** the listing for that other brand is displayed with its own heading

### Requirement: REQ-CAT-05 — Recommended items offer a direct add to cart

The home page SHALL carry a recommended-items section at the foot of the page, each entry
of which can be added to the cart without opening its detail page.

#### Scenario: Recommended section is present

- **GIVEN** the home page scrolled to the bottom
- **THEN** the section `RECOMMENDED ITEMS` is visible
- **AND** it contains at least one product
- **AND** each product offers `Add to cart`

## Constraints inherited from the environment

| Constraint            | Effect on this capability                                                                                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1 shared environment | No scenario asserts a product count, a fixed product id, or the presence of one named product. Assertions are on _shape_ — "at least one card, and each card has a name and a price" — because the catalogue is mutable by the vendor at any time. |
| C3 ad interstitials   | Category and brand sidebar links sit low in the page where vignette interstitials commonly appear; overlay resolution runs after each navigation.                                                                                                  |
