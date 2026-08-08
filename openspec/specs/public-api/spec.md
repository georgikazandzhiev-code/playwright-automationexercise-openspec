# Public REST API — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.11 (REQ-API-\*), the vendor's
> published [API list](https://automationexercise.com/api_list) (API 1–14).
>
> This capability is load-bearing beyond its own tests: API 11 and API 12 are the seeding
> and cleanup mechanism that lets every UI capability satisfy REQ-X-01 and REQ-X-02
> without depending on shared credentials.

## Purpose

Define the contract of automationexercise.com's public REST API — the catalogue and brand
listings, product search, credential verification, and the account create / update /
delete / read endpoints — including the site's unusual convention of carrying its real
status in the response body rather than the HTTP status line.

## The `responseCode` convention

Most `/api/*` endpoints answer **HTTP 200** and place the real status in a `responseCode`
field inside the JSON body. The HTTP status line is therefore _not_ the contract.

Every requirement below states the **body** `responseCode`. A test that asserts
`expect(response.status()).toBe(400)` against this API is asserting the wrong thing and
will pass or fail for the wrong reason.

## Requirements

### Requirement: REQ-API-01 — Products list

`GET /api/productsList` SHALL return `responseCode` 200 and a `products` array. Each entry
SHALL carry `id`, `name`, `price`, `brand`, and a `category` object containing
`usertype.usertype` and `category`.

#### Scenario: Catalogue is returned with the documented shape

- **WHEN** `GET /api/productsList` is called
- **THEN** the body `responseCode` is 200
- **AND** `products` is a non-empty array
- **AND** every entry validates against the strict product schema, with no unexpected fields

### Requirement: REQ-API-02 — Products list rejects POST

`POST /api/productsList` SHALL be refused as an unsupported method.

#### Scenario: POST is refused

- **WHEN** `POST /api/productsList` is called
- **THEN** the body `responseCode` is 405
- **AND** the body message is `This request method is not supported.`

### Requirement: REQ-API-03 — Brands list

`GET /api/brandsList` SHALL return `responseCode` 200 and a `brands` array of entries
carrying `id` and `brand`.

#### Scenario: Brands are returned with the documented shape

- **WHEN** `GET /api/brandsList` is called
- **THEN** the body `responseCode` is 200
- **AND** `brands` is a non-empty array
- **AND** every entry validates against the strict brand schema

### Requirement: REQ-API-04 — Brands list rejects PUT

`PUT /api/brandsList` SHALL be refused as an unsupported method.

#### Scenario: PUT is refused

- **WHEN** `PUT /api/brandsList` is called
- **THEN** the body `responseCode` is 405
- **AND** the body message is `This request method is not supported.`

### Requirement: REQ-API-05 — Search product

`POST /api/searchProduct` with a `search_product` form field SHALL return `responseCode`
200 and a `products` array whose entries match the term.

#### Scenario: Matching term returns matching products

- **WHEN** `POST /api/searchProduct` is called with `search_product` set to a term present in the catalogue
- **THEN** the body `responseCode` is 200
- **AND** `products` is a non-empty array
- **AND** every entry's `name` contains the term, compared case-insensitively

### Requirement: REQ-API-06 — Search product without the parameter is a client error

`POST /api/searchProduct` with no `search_product` field SHALL be refused with a message
naming the missing parameter.

#### Scenario: Missing parameter is refused

- **WHEN** `POST /api/searchProduct` is called with no `search_product` field
- **THEN** the body message names the missing `search_product` parameter
- **AND** no `products` array is returned

#### Scenario: The documented response code

- **GIVEN** the same request
- **THEN** the body `responseCode` is 400 as documented in the vendor API list

### Requirement: REQ-API-07 — Verify login with valid credentials

`POST /api/verifyLogin` with a registered `email` and `password` SHALL confirm the account
exists.

#### Scenario: Registered credentials are confirmed

- **GIVEN** an account created via REQ-API-11
- **WHEN** `POST /api/verifyLogin` is called with its email and password
- **THEN** the body `responseCode` is 200
- **AND** the body message is `User exists!`

### Requirement: REQ-API-08 — Verify login with a missing parameter

`POST /api/verifyLogin` without the `email` field SHALL be refused with a message naming
the missing parameter.

#### Scenario: Missing email is refused

- **WHEN** `POST /api/verifyLogin` is called with only a `password`
- **THEN** the body `responseCode` is 400
- **AND** the body message names the missing email or password parameter

### Requirement: REQ-API-09 — Verify login rejects DELETE

`DELETE /api/verifyLogin` SHALL be refused as an unsupported method.

#### Scenario: DELETE is refused

- **WHEN** `DELETE /api/verifyLogin` is called
- **THEN** the body `responseCode` is 405
- **AND** the body message is `This request method is not supported.`

### Requirement: REQ-API-10 — Verify login with unknown credentials

`POST /api/verifyLogin` with credentials matching no account SHALL report that the user was
not found.

#### Scenario: Unknown credentials report not found

- **WHEN** `POST /api/verifyLogin` is called with an email that has no account
- **THEN** the body `responseCode` is 404
- **AND** the body message is `User not found!`

### Requirement: REQ-API-11 — Create account

`POST /api/createAccount` with `name`, `email`, `password`, `title`, `birth_date`,
`birth_month`, `birth_year`, `firstname`, `lastname`, `company`, `address1`, `address2`,
`country`, `zipcode`, `state`, `city` and `mobile_number` SHALL create the account.

#### Scenario: Full payload creates the account

- **WHEN** `POST /api/createAccount` is called with every documented parameter
- **THEN** the body `responseCode` is 201
- **AND** the body message is `User created!`

#### Scenario: The created account is usable

- **GIVEN** an account just created this way
- **THEN** `POST /api/verifyLogin` with its credentials satisfies REQ-API-07
- **AND** the same credentials authenticate through the UI login form (REQ-AUT-02)

### Requirement: REQ-API-12 — Delete account

`DELETE /api/deleteAccount` with `email` and `password` SHALL delete the account.

#### Scenario: Account is deleted

- **GIVEN** an account created via REQ-API-11
- **WHEN** `DELETE /api/deleteAccount` is called with its credentials
- **THEN** the body `responseCode` is 200
- **AND** the body message is `Account deleted!`

#### Scenario: The deleted account is gone

- **GIVEN** an account just deleted this way
- **WHEN** `POST /api/verifyLogin` is called with its credentials
- **THEN** the response satisfies REQ-API-10 — `responseCode` 404, `User not found!`

### Requirement: REQ-API-13 — Update account

`PUT /api/updateAccount` with the REQ-API-11 parameter set SHALL update the account.

#### Scenario: Account is updated

- **GIVEN** an account created via REQ-API-11
- **WHEN** `PUT /api/updateAccount` is called with the same email and changed profile values
- **THEN** the body `responseCode` is 200
- **AND** the body message is `User updated!`

### Requirement: REQ-API-14 — Get user detail by email

`GET /api/getUserDetailByEmail` with a registered `email` SHALL return that account's
detail.

#### Scenario: Detail is returned

- **GIVEN** an account created via REQ-API-11
- **WHEN** `GET /api/getUserDetailByEmail` is called with its email
- **THEN** the body `responseCode` is 200
- **AND** the body message is `User Detail`
- **AND** the returned `user` object reproduces the values the account was created with

## Constraints inherited from the environment

| Constraint               | Effect on this capability                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C4 status is in the body | Every assertion is on `responseCode`, never on the HTTP status.                                                                                                                                               |
| C1 shared environment    | Every account-touching scenario creates its own account with a per-run unique email. REQ-API-07, 12, 13 and 14 all seed via REQ-API-11 rather than sharing one fixture account, so they can run concurrently. |
| C2 no reset              | Every created account is deleted in teardown, including on failure.                                                                                                                                           |
| —                        | Schemas are `z.strictObject`: an unexpected field is a contract change and must fail. Loosening a schema to absorb a new field is forbidden — the field gets added to the schema deliberately, in a change.   |

## Known divergence from the vendor documentation

REQ-API-06's second scenario is expected to **fail on some deployments**, which return
`responseCode: 3` where the vendor API list documents `400`. That is site defect **D1**
in `docs/requirements.md` §10.

It is split into its own scenario deliberately, so that the message assertion (which
holds) and the code assertion (which may not) report separately. The code assertion is
kept asserting the _documented_ contract. It is not relaxed to match the bug — a green
suite that has quietly adopted the defect is worse than a red one that names it.
