# Account lifecycle — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.1 (REQ-ACC-\*), which in turn is
> derived from the vendor test cases TC 1, 5, 14, 15, 23.
>
> Owned separately from `authentication` on purpose: this capability governs how an
> account comes into existence and how it is destroyed. `authentication` governs what a
> _pre-existing_ account can do. Registration is the only place the address is captured,
> which is why `checkout` depends on this capability and not on `authentication`.

## Purpose

Define how a visitor becomes a registered user of automationexercise.com and how that
account is removed again — the two-step intake-then-details registration, the duplicate
and malformed email rejections, the optional marketing opt-ins, and the deletion that
returns the shared environment to the state we found it in.

## Requirements

### Requirement: REQ-ACC-01 — Intake form starts registration

The site SHALL accept a name and an unused email address on the `New User Signup!` form
and SHALL respond with the account information form, carrying both values forward. The
email SHALL NOT be editable on the second step.

#### Scenario: Unused email advances to account information

- **GIVEN** a guest on the login page
- **WHEN** they submit a name and an email address that has no account
- **THEN** the account information form is displayed under the heading `ENTER ACCOUNT INFORMATION`
- **AND** the name and email fields are pre-filled with the submitted values
- **AND** the email field is read-only

### Requirement: REQ-ACC-02 — Duplicate email is rejected at intake

The site SHALL reject an intake submission whose email already has an account, and SHALL
say so without advancing to the account information form.

#### Scenario: Already registered email is refused

- **GIVEN** an account already exists for a known email address
- **WHEN** a guest submits the intake form with that email
- **THEN** the error `Email Address already exist!` is displayed
- **AND** the account information form is not shown
- **AND** the URL is still the login page

### Requirement: REQ-ACC-03 — Malformed email is rejected before submission

The intake email field SHALL be typed such that the browser's native constraint validation
blocks submission of a value that is not a valid email address.

#### Scenario: Invalid address blocks navigation

- **GIVEN** a guest on the login page
- **WHEN** they enter a value with no `@` and submit the intake form
- **THEN** the browser reports the field as invalid
- **AND** the page does not navigate away from the login page

### Requirement: REQ-ACC-04 — Full registration creates an account

The site SHALL create an account when the account information form is submitted with
title, password, date of birth, first name, last name, company, address, address 2,
country, state, city, zipcode and mobile number, and SHALL confirm it.

#### Scenario: Complete details create the account

- **GIVEN** a guest who has passed intake
- **WHEN** they submit the account information form with every field populated
- **THEN** the confirmation `ACCOUNT CREATED!` is displayed
- **AND** a `Continue` control is offered

### Requirement: REQ-ACC-05 — Continue establishes an authenticated session

Activating `Continue` on the confirmation page SHALL return the user to the storefront
with an authenticated session, indicated by the header.

#### Scenario: Continue lands logged in

- **GIVEN** the `ACCOUNT CREATED!` page
- **WHEN** the user activates `Continue`
- **THEN** the storefront is displayed
- **AND** the header shows `Logged in as <name>` with the name submitted at intake

### Requirement: REQ-ACC-06 — Marketing opt-ins are optional and honoured

The newsletter and partner-offer checkboxes SHALL be optional. Selecting either SHALL NOT
prevent account creation, and omitting both SHALL NOT prevent it either.

#### Scenario: Both opt-ins selected

- **GIVEN** the account information form
- **WHEN** the user selects `Sign up for our newsletter!` and `Receive special offers from our partners!` and submits
- **THEN** the account is created and `ACCOUNT CREATED!` is displayed

#### Scenario: Neither opt-in selected

- **GIVEN** the account information form
- **WHEN** the user leaves both checkboxes clear and submits
- **THEN** the account is created and `ACCOUNT CREATED!` is displayed

### Requirement: REQ-ACC-07 — Account deletion removes the account and the session

An authenticated user SHALL be able to delete their account. Deletion SHALL confirm
visibly, SHALL terminate the session, and SHALL invalidate the credentials.

#### Scenario: Delete confirms and logs out

- **GIVEN** an authenticated user
- **WHEN** they activate `Delete Account` and then `Continue`
- **THEN** `ACCOUNT DELETED!` is displayed before `Continue`
- **AND** afterwards the header shows `Signup / Login` rather than `Logged in as <name>`

#### Scenario: Deleted credentials no longer authenticate

- **GIVEN** an account that has been deleted
- **WHEN** its email and password are submitted to the login form
- **THEN** no session is created
- **AND** the error `Your email or password is incorrect!` is displayed

## Constraints inherited from the environment

| Constraint               | Effect on this capability                                                                                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1 shared environment    | Every registration uses a per-run unique email (REQ-X-03). Never a fixed address.                                                                                                                                                                                            |
| C2 no reset              | Every account created by a test is deleted in teardown via `DELETE /api/deleteAccount`, which runs even when the test failed (REQ-X-02). UI deletion is the _subject_ of REQ-ACC-07, not the cleanup mechanism — a failure before that step would otherwise leak an account. |
| C5 no email verification | Registration completes without confirming the address; no mailbox polling is required.                                                                                                                                                                                       |
