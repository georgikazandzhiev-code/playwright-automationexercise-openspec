# Product reviews — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.7 (REQ-REV-*), vendor test case
> TC 21.

## Purpose

Define how a visitor leaves a review on a product page of automationexercise.com — the
form's presence on every product detail page, the acknowledgement that confirms
submission, and the fact that no session is required to review.

## Requirements

### Requirement: REQ-REV-01 — The review form is present on product detail

Every product detail page SHALL carry a review form with name, email and review-text
inputs and a submit control.

#### Scenario: Review form is visible

- **GIVEN** a product detail page
- **THEN** the section `Write Your Review` is visible
- **AND** it offers a name input, an email input, a review text area and a submit control

### Requirement: REQ-REV-02 — Submission is acknowledged

Submitting a complete review SHALL be acknowledged on the page.

#### Scenario: Complete review is acknowledged

- **GIVEN** the review form on a product detail page
- **WHEN** the visitor submits a name, an email address and review text
- **THEN** the message `Thank you for your review.` is displayed

### Requirement: REQ-REV-03 — Reviewing does not require a session

A guest SHALL be able to submit a review. The form SHALL NOT redirect to login and SHALL
NOT reject the submission for lack of a session.

#### Scenario: Guest can review

- **GIVEN** a visitor with no session
- **WHEN** they submit a complete review on a product detail page
- **THEN** the message `Thank you for your review.` is displayed
- **AND** they are not redirected to the login page

## Constraints inherited from the environment

| Constraint | Effect on this capability |
|---|---|
| C1 shared environment | The review list is global and mutated by the whole internet. **No scenario asserts that the submitted review appears, where it appears, or how many reviews exist.** The acknowledgement message is the only observable this capability may assert on. |
| C1 shared environment | Reviews cannot be deleted through any public interface, so this capability leaves a residue on the site. That is an accepted, documented cost of testing it — the review name and text are generated per run and identifiable as test data. |

## Not claimed

That a submitted review is persisted, moderated, or ever displayed. The acknowledgement
proves the form was accepted, nothing more. Asserting persistence would require reading a
shared, concurrently-mutated list — a test that would be flaky by construction. Recorded
so the limit is visible rather than mistaken for coverage.
