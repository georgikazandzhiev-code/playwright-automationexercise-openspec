# Site navigation — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.10 (REQ-NAV-\*), vendor test cases
> TC 7, 25, 26.

## Purpose

Define the structural behaviour every other capability stands on — that the home page
loads and identifies itself, that the static pages in the header are reachable, and that
the long-page scroll affordances work both with and without the scroll-to-top control.

## Requirements

### Requirement: REQ-NAV-01 — The home page loads and identifies itself

Navigating to the site root SHALL load the storefront home page, recognisable by its
header, its category sidebar and its slider text.

#### Scenario: Home page is identifiable

- **GIVEN** a visitor navigating to the site root
- **THEN** the site header is visible
- **AND** the category sidebar is visible
- **AND** the text `Full-Fledged practice website for Automation Engineers` is visible

### Requirement: REQ-NAV-02 — The Test Cases page is reachable

The header SHALL offer the test cases page, and activating it SHALL navigate there.

#### Scenario: Test Cases opens its own page

- **GIVEN** any page
- **WHEN** the visitor activates `Test Cases`
- **THEN** the URL path is `/test_cases`
- **AND** the test case list is displayed

### Requirement: REQ-NAV-03 — The scroll-to-top control returns to the top

A visitor at the foot of a long page SHALL be able to return to the top using the
scroll-up control.

#### Scenario: Arrow control scrolls to top

- **GIVEN** the home page scrolled to the footer, with `SUBSCRIPTION` visible
- **WHEN** the visitor activates the scroll-up control
- **THEN** the text `Full-Fledged practice website for Automation Engineers` is visible in the viewport

### Requirement: REQ-NAV-04 — Manual scrolling reaches the same state

Scrolling to the top without the control SHALL produce the same end state as REQ-NAV-03,
so the control is a convenience and not the only route.

#### Scenario: Manual scroll reaches the top

- **GIVEN** the home page scrolled to the footer, with `SUBSCRIPTION` visible
- **WHEN** the visitor scrolls to the top of the page without using the control
- **THEN** the text `Full-Fledged practice website for Automation Engineers` is visible in the viewport

## Constraints inherited from the environment

| Constraint          | Effect on this capability                                                                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C3 ad interstitials | REQ-NAV-03 and REQ-NAV-04 both scroll to the footer, which is exactly where vignette interstitials appear on this site. Overlay resolution must run before the scroll assertion, or the "text is visible" check measures the ad, not the page. |
| —                   | Viewport visibility, not scroll offset, is the assertion. A pixel-offset assertion would encode the current page height and break on any content change.                                                                                       |
