## ADDED Requirements

### Requirement: REQ-AUT-05 — The session persists across navigation

An established session SHALL survive navigation between pages of the site. The header
SHALL continue to indicate the session on every page until the user logs out or deletes
the account.

This is relied on by `shopping-cart` REQ-CRT-06 and by every `checkout` requirement, which
authenticate once and then navigate. Stating it here makes that dependency explicit rather
than assumed.

#### Scenario: Session indicator survives navigation

- **GIVEN** a user who has just logged in
- **WHEN** they navigate to the products listing and then to the cart page
- **THEN** the header shows `Logged in as <registered name>` on each of those pages
- **AND** the header does not show `Signup / Login`

#### Scenario: Session survives a full page reload

- **GIVEN** a user who has just logged in
- **WHEN** the page is reloaded
- **THEN** the header still shows `Logged in as <registered name>`

### Requirement: REQ-AUT-06 — Empty credentials are refused before submission

The login form's email field SHALL be typed and required such that the browser's native
constraint validation blocks submission when the credentials are empty. The form SHALL NOT
navigate and SHALL NOT create a session.

This mirrors `account-lifecycle` REQ-ACC-03 and `subscription` REQ-SUB-03, which already
claim native validation on their email fields. Authentication claimed nothing equivalent.

#### Scenario: Empty form does not submit

- **GIVEN** a guest on the login page with both login fields empty
- **WHEN** they activate the login control
- **THEN** the browser reports the email field as invalid
- **AND** the page does not navigate away from the login page
- **AND** no session is created — the header still shows `Signup / Login`

#### Scenario: Empty password with a valid email does not submit

- **GIVEN** a guest who has entered a syntactically valid email and left the password empty
- **WHEN** they activate the login control
- **THEN** the form does not submit
- **AND** no session is created

## MODIFIED Requirements

### Requirement: REQ-AUT-02 — Valid credentials establish a session

The site SHALL authenticate an email and password matching an existing account and SHALL
indicate the session in the header. The indicator SHALL name **the account's registered
name** — not merely some name — so that the assertion distinguishes a correct session from
a session established as the wrong user.

#### Scenario: Known credentials log in

- **GIVEN** an account that exists
- **WHEN** its email and password are submitted to the login form
- **THEN** the storefront is displayed
- **AND** the header shows `Logged in as <name>`

#### Scenario: The indicator names the registered user

- **GIVEN** an account registered with a specific, per-run unique name
- **WHEN** that account logs in
- **THEN** the header text is exactly `Logged in as <that registered name>`
- **AND** it does not merely match the prefix `Logged in as`
