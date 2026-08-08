# Authentication — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.2 (REQ-AUT-*), vendor test cases
> TC 2, 3, 4.
>
> Scope boundary: this capability covers what a **pre-existing** account can do. Creating
> and destroying accounts belongs to `account-lifecycle`.

## Purpose

Define how an existing account establishes and ends a session on automationexercise.com —
the login form, the header session indicator that every other capability depends on, the
rejection of bad credentials, and the requirement that the rejection message does not
reveal whether the email exists.

## Requirements

### Requirement: REQ-AUT-01 — Login page presents both entry points

The login page SHALL present the returning-user form and the new-user intake form
together, so a visitor can choose without navigating again.

#### Scenario: Both sections are visible

- **GIVEN** a guest
- **WHEN** they open `Signup / Login`
- **THEN** the section `Login to your account` is visible
- **AND** the section `New User Signup!` is visible

### Requirement: REQ-AUT-02 — Valid credentials establish a session

The site SHALL authenticate an email and password matching an existing account and SHALL
indicate the session in the header.

#### Scenario: Known credentials log in

- **GIVEN** an account that exists
- **WHEN** its email and password are submitted to the login form
- **THEN** the storefront is displayed
- **AND** the header shows `Logged in as <name>`

### Requirement: REQ-AUT-03 — Invalid credentials are rejected without disclosure

The site SHALL refuse credentials that do not match an account, SHALL create no session,
and SHALL return an identical message whether the email is unknown or the password is
wrong.

#### Scenario: Unknown email is refused

- **GIVEN** the login form
- **WHEN** an email address with no account is submitted with any password
- **THEN** no session is created
- **AND** the error `Your email or password is incorrect!` is displayed

#### Scenario: Wrong password is refused

- **GIVEN** an account that exists
- **WHEN** its email is submitted with a password that is not its own
- **THEN** no session is created
- **AND** the error `Your email or password is incorrect!` is displayed

#### Scenario: The two rejections are indistinguishable

- **GIVEN** the two scenarios above executed in the same session
- **THEN** the displayed error text is byte-identical between them
- **AND** neither response reveals whether the email address is registered

### Requirement: REQ-AUT-04 — Logout terminates the session

An authenticated user SHALL be able to end the session, after which the header reverts to
the logged-out state.

#### Scenario: Logout returns to the login page

- **GIVEN** an authenticated user
- **WHEN** they activate `Logout`
- **THEN** the login page is displayed
- **AND** the header shows `Signup / Login`
- **AND** the header no longer shows `Logged in as <name>`

## Notes

REQ-AUT-03's non-disclosure clause is **ours**, not the vendor's — the published test
cases do not mention it. It is a standard account-enumeration control (OWASP
Identification and Authentication Failures). If the site were to differentiate the two
messages, that is a finding to record in `docs/requirements.md` §10, not an assertion to
relax.

## Constraints inherited from the environment

| Constraint | Effect on this capability |
|---|---|
| C1 shared environment | A test that needs "an account that exists" seeds it via `POST /api/createAccount`; it does not reuse a shared credential from `.env`, which any other run may delete. |
| C2 no reset | The seeded account is deleted in teardown. |
| C3 ad interstitials | Header `Signup / Login` clicks are intercepted intermittently; direct navigation to `/login` is the sanctioned workaround (site defect D2). |
