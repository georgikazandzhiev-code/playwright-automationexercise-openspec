# Newsletter subscription — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.8 (REQ-SUB-\*), vendor test cases
> TC 10, 11.

## Purpose

Define the footer newsletter block on automationexercise.com — that it is present on every
page carrying the footer, that a valid address is accepted with a visible confirmation,
and that an invalid address is refused before it reaches the server.

## Requirements

### Requirement: REQ-SUB-01 — The subscription block is present in the footer

Every page carrying the site footer SHALL present the subscription block, with a heading,
an email input and a submit control.

#### Scenario: Present on the home page

- **GIVEN** the home page
- **WHEN** the visitor scrolls to the footer
- **THEN** the heading `SUBSCRIPTION` is visible
- **AND** an email input and a submit control are visible

#### Scenario: Present on the cart page

- **GIVEN** the cart page
- **WHEN** the visitor scrolls to the footer
- **THEN** the heading `SUBSCRIPTION` is visible
- **AND** an email input and a submit control are visible

### Requirement: REQ-SUB-02 — A valid address is accepted

Submitting a syntactically valid email address SHALL be confirmed on the page.

#### Scenario: Valid address is confirmed

- **GIVEN** the footer subscription block
- **WHEN** the visitor submits a syntactically valid email address
- **THEN** the message `You have been successfully subscribed!` is displayed

### Requirement: REQ-SUB-03 — An invalid address is refused before submission

The subscription email field SHALL be typed such that native constraint validation blocks
submission of a value that is not a valid email address.

#### Scenario: Invalid address is blocked

- **GIVEN** the footer subscription block
- **WHEN** the visitor submits a value with no `@`
- **THEN** the browser reports the field as invalid
- **AND** no success message is displayed

## Constraints inherited from the environment

| Constraint               | Effect on this capability                                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1 shared environment    | The subscriber list is not readable and not clearable. As with reviews, the confirmation message is the only observable. A per-run unique address is used so the residue is identifiable. |
| C5 no email verification | No mail is sent that we can verify, so REQ-SUB-02 claims acceptance, not delivery.                                                                                                        |

## Not claimed

That the address is stored, that mail is ever sent, or that a duplicate subscription is
handled any particular way. The site exposes no way to observe any of it.
