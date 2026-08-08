# Product search — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.4 (REQ-SRH-*), vendor test cases
> TC 9, 20.
>
> Scope boundary: the *UI* search box. The `POST /api/searchProduct` contract belongs to
> `public-api` (REQ-API-05, REQ-API-06). They are separate capabilities because the site
> is free to change one without the other, and has: the API returns a JSON error code the
> UI never surfaces.

## Purpose

Define how a shopper finds a product by name on automationexercise.com — what a matching
search returns, what a search with no matches returns (an empty list, not an error), and
the requirement that search results remain fully actionable.

## Requirements

### Requirement: REQ-SRH-01 — Matching search returns only matching products

A search for a term present in the catalogue SHALL return a labelled result set, and every
product in it SHALL match the term.

#### Scenario: Matching term returns results

- **GIVEN** the All Products page
- **WHEN** the visitor searches for a term present in at least one product name
- **THEN** the heading `SEARCHED PRODUCTS` is displayed
- **AND** at least one product is listed

#### Scenario: Every result matches the term

- **GIVEN** a non-empty result set for a search term
- **THEN** every listed product's name contains that term, compared case-insensitively

### Requirement: REQ-SRH-02 — Non-matching search returns an empty result set, not an error

A search for a term present in no product SHALL return the result page with zero products.
It SHALL NOT return an error page, and SHALL NOT fall back to the unfiltered catalogue.

#### Scenario: Nonsense term returns zero products

- **GIVEN** the All Products page
- **WHEN** the visitor searches for a term present in no product name
- **THEN** the heading `SEARCHED PRODUCTS` is displayed
- **AND** exactly zero product cards are listed
- **AND** no error page is displayed

### Requirement: REQ-SRH-03 — Search results are as actionable as the catalogue

A product shown in a search result SHALL offer the same actions it offers on the All
Products page, so a shopper can act on a search without navigating away.

#### Scenario: Results offer add-to-cart and view

- **GIVEN** a non-empty search result set
- **THEN** each listed product offers `Add to cart`
- **AND** each listed product offers `View Product`

## Constraints inherited from the environment

| Constraint | Effect on this capability |
|---|---|
| C1 shared environment | The search term for REQ-SRH-01 must be a broad one whose disappearance from the catalogue would itself be notable (e.g. a garment word), never a specific product name. The no-match term is a deliberately impossible string so that no future product can accidentally match it. |
| — | REQ-SRH-01's per-result assertion is what distinguishes a real search from a broken one that returns the full catalogue. Asserting only "at least one result" would pass against that bug. |
