## ADDED Requirements

### Requirement: REQ-SEC-01 — All traffic is carried over HTTPS

The site SHALL NOT serve content over plain HTTP. A request to the `http://` origin SHALL
be answered with a permanent redirect to the equivalent `https://` URL.

Maps to OWASP A02 (Cryptographic Failures) and A05 (Security Misconfiguration). Every other
requirement here assumes the channel is confidential; this one states it.

#### Scenario: Plain HTTP is permanently redirected

- **WHEN** the home page is requested over `http://`
- **THEN** the response status is `301`
- **AND** the `location` header names the same page on `https://`

### Requirement: REQ-SEC-02 — Baseline protective response headers are served

Every HTML response SHALL carry the three headers that constrain how a browser may treat
it: `x-frame-options: DENY` (no framing), `x-content-type-options: nosniff` (no MIME
sniffing) and a `referrer-policy` (no cross-origin URL leakage).

Maps to OWASP A05. The same headers SHALL be present on `/api/*` responses, because those
responses are served as `text/html` by this site and a browser navigating to one would
treat it as a document.

#### Scenario: The storefront serves the protective headers

- **WHEN** the home page is requested
- **THEN** `x-frame-options` is `DENY`
- **AND** `x-content-type-options` is `nosniff`
- **AND** `referrer-policy` is present

#### Scenario: The API serves the protective headers

- **WHEN** `GET /api/productsList` is requested
- **THEN** `x-frame-options` is `DENY`
- **AND** `x-content-type-options` is `nosniff`

### Requirement: REQ-SEC-03 — A content-security and transport-security policy is declared

Every HTML response SHALL carry a `content-security-policy` header constraining the origins
from which scripts may load, and a `strict-transport-security` header instructing the
browser to refuse plain HTTP for the domain.

Maps to OWASP A05 and A02. Without CSP, a single injected script tag anywhere on the site
executes with full origin privileges; without HSTS, REQ-SEC-01's redirect is bypassable on
the first request of a session.

#### Scenario: A content-security policy is declared

- **WHEN** the home page is requested
- **THEN** a `content-security-policy` header is present

#### Scenario: Transport security is declared

- **WHEN** the home page is requested over HTTPS
- **THEN** a `strict-transport-security` header is present

### Requirement: REQ-SEC-04 — The server does not disclose its framework and version

Responses SHALL NOT identify the application server or framework, nor its version. A
version string tells an attacker which published vulnerabilities to try before trying
anything else.

Maps to OWASP A05.

#### Scenario: No technology banner is returned

- **WHEN** any page or API endpoint is requested
- **THEN** the response carries no `x-powered-by` header

### Requirement: REQ-SEC-05 — The session cookie is not reachable from script and is same-site

The cookie carrying the authenticated session SHALL be set `HttpOnly`, so that script on
the page cannot read it, and SHALL declare a `SameSite` policy, so that it is not attached
to cross-site requests.

Maps to OWASP A07 (Identification and Authentication Failures) and A01 (cross-site request
forgery is listed under Broken Access Control in the 2021 list).

#### Scenario: The session cookie is HttpOnly and same-site constrained

- **GIVEN** a seeded account that has logged in through the login form
- **WHEN** the browser context's cookies are read
- **THEN** the session cookie is marked `HttpOnly`
- **AND** its `SameSite` attribute is not `None`

### Requirement: REQ-SEC-06 — Every cookie is restricted to secure transport

Every cookie the site sets SHALL carry the `Secure` attribute, so that it is never
transmitted over plain HTTP even if a user is induced to make one such request.

Maps to OWASP A02. REQ-SEC-01 redirects HTTP to HTTPS, but the redirect happens _after_ the
browser has already attached a non-`Secure` cookie to the plaintext request.

#### Scenario: Session and CSRF cookies are Secure

- **GIVEN** a seeded account that has logged in through the login form
- **WHEN** the browser context's cookies are read
- **THEN** every cookie set by the site's own domain carries `Secure`

### Requirement: REQ-SEC-07 — Logging out invalidates the session on the server

Ending a session SHALL invalidate it server-side, not merely clear it from the browser. A
session identifier captured before logout SHALL NOT authenticate a request made after it.

Maps to OWASP A07. `authentication` REQ-AUT-04 asserts only that the header reverts, which
a purely client-side logout would also satisfy.

#### Scenario: A replayed session identifier is not honoured after logout

- **GIVEN** a seeded account that has logged in, and its session identifier captured
- **WHEN** the user logs out
- **AND** the captured identifier is presented on a fresh request to the home page
- **THEN** the response does not indicate a session — it shows `Signup / Login`
- **AND** it does not show `Logged in as`

### Requirement: REQ-SEC-08 — No cross-origin access is granted to the API

The API SHALL NOT return `Access-Control-Allow-Origin` for an arbitrary requesting origin.
Reflecting the caller's `Origin` would let any page on the internet read authenticated API
responses from a visitor's browser.

Maps to OWASP A05 and API8 (Security Misconfiguration).

#### Scenario: A foreign origin is not granted access

- **WHEN** `GET /api/productsList` is requested with an `Origin` header naming an unrelated
  site
- **THEN** the response carries no `access-control-allow-origin` header naming that origin

### Requirement: REQ-SEC-09 — Injection payloads in search are handled as data, not code

Search terms SHALL be treated as opaque data. A term containing script markup, SQL
metacharacters or a SQL clause SHALL return a well-formed empty result and SHALL NOT
return database rows, a database error, or a stack trace.

Maps to OWASP A03 (Injection) and API8. The reject-or-neutralise branch — the server side.
REQ-SEC-10 covers the render side.

#### Scenario: Script markup as a search term returns no data and no error

- **WHEN** `POST /api/searchProduct` is called with `search_product` set to a payload
  containing script markup
- **THEN** the body `responseCode` is 200
- **AND** `products` is an empty array
- **AND** the body carries no error or diagnostic text

#### Scenario: SQL metacharacters as a search term return no data and no error

- **WHEN** `POST /api/searchProduct` is called with `search_product` set to a SQL tautology
  or a `UNION SELECT` clause
- **THEN** the body `responseCode` is 200
- **AND** `products` is an empty array — the tautology does not return the catalogue
- **AND** the body carries no database error text

### Requirement: REQ-SEC-10 — A search term is never rendered as executable markup

Where the site renders a user-supplied search term back to the page, it SHALL render it as
inert text. Submitting script markup through the search field SHALL NOT cause a script to
execute in the page.

Maps to OWASP A03. This is the branch a server-side-only injection test cannot reach: a
payload that is stored or echoed safely at the API can still execute once rendered.

#### Scenario: Script markup submitted through the search field does not execute

- **GIVEN** a guest on the products page
- **WHEN** a search term containing script markup is submitted through the search field
- **THEN** the results page renders with its `Searched Products` heading
- **AND** no dialog is raised by the page
- **AND** no product result is shown for the payload

### Requirement: REQ-SEC-11 — No account endpoint returns credentials

No API response SHALL contain a password, password hash, token, or any other credential
field, for any account, under any parameter.

Maps to OWASP API3 (Broken Object Property Level Authorization) and A02. This is asserted
structurally: the response schema is strict, so a credential field appearing in a future
deployment fails the contract rather than passing unnoticed.

#### Scenario: The user-detail response carries no credential field

- **GIVEN** a seeded account
- **WHEN** `GET /api/getUserDetailByEmail` is called with that account's email
- **THEN** the body `responseCode` is 200
- **AND** the `user` object validates against the strict user-detail schema
- **AND** that schema admits no `password`, hash or token field

### Requirement: REQ-SEC-12 — Personal data is served only to an authorised caller

An endpoint returning a person's name, date of birth, employer or postal address SHALL
require the caller to prove they are that person, or are entitled to the record. An
unauthenticated caller who knows only an email address SHALL NOT receive the account's
personal details.

Maps to OWASP A01 (Broken Access Control) and API1 (Broken Object Level Authorization) —
the highest-weight category on both lists.

#### Scenario: An unauthenticated caller does not receive an account's personal details

- **GIVEN** a seeded account whose registration included a date of birth, an employer and a
  postal address
- **WHEN** `GET /api/getUserDetailByEmail` is called with that email and no credential
- **THEN** the request is refused
- **AND** the response does not contain the account's address, date of birth or employer

### Requirement: REQ-SEC-13 — The API does not disclose whether an email is registered

The API SHALL NOT let an unauthenticated caller distinguish a registered email from an
unregistered one. Responses to both SHALL be indistinguishable in status and in content.

Maps to OWASP A07 and API1. `authentication` REQ-AUT-03 already imposes exactly this
control on the login form; an API that answers the same question directly makes that
control ineffective.

#### Scenario: Registered and unregistered emails produce indistinguishable answers

- **GIVEN** a seeded account and an email address that is not registered
- **WHEN** `GET /api/getUserDetailByEmail` is called with each in turn
- **THEN** the two responses carry the same `responseCode`
- **AND** neither response reveals which of the two emails exists

### Requirement: REQ-SEC-14 — Checkout and payment require an authenticated session

The address-review and payment steps SHALL be reachable only by an authenticated user who
has a cart. A guest navigating directly to those paths SHALL NOT be served the address
block or the card-entry form.

Maps to OWASP A01 (forced browsing) and A04 (Insecure Design — a flow whose steps can be
skipped). `checkout` REQ-CHK-02 states that checkout follows login; nothing states that the
site enforces it.

#### Scenario: A guest is not served the checkout address step

- **GIVEN** a caller with no session
- **WHEN** `/checkout` is requested
- **THEN** the address-details block and the `Place Order` control are not served

#### Scenario: A guest is not served the payment step

- **GIVEN** a caller with no session
- **WHEN** `/payment` is requested
- **THEN** the card-entry form and the `Pay and Confirm Order` control are not served

### Requirement: REQ-SEC-15 — Account deletion requires a session and is not a GET

Account deletion SHALL require an authenticated session, and SHALL NOT be triggerable by a
`GET` navigation. A caller with no session SHALL NOT be served the deletion confirmation
page.

Maps to OWASP A01 and A04. A state-changing `GET` is reachable from any third-party page —
an image tag pointing at it fires with the visitor's cookies attached — which is the
classic cross-site request forgery shape, and `SameSite=Lax` (REQ-SEC-05) does not stop a
top-level navigation.

#### Scenario: A guest is not served the account-deleted confirmation

- **GIVEN** a caller with no session
- **WHEN** `/delete_account` is requested
- **THEN** the `Account Deleted!` confirmation is not served
