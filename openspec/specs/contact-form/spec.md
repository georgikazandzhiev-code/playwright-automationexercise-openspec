# Contact form — capability spec

> **Baseline.** Derived from `docs/requirements.md` §6.9 (REQ-CTC-\*), vendor test case
> TC 6.

## Purpose

Define the contact page of automationexercise.com — its reachability from the header, the
submission flow including a file attachment and the browser confirmation dialog it raises,
and the route back to the storefront afterwards.

## Requirements

### Requirement: REQ-CTC-01 — The contact page is reachable

The site SHALL offer a contact page from the header of any page, identified by its
heading.

#### Scenario: Contact page opens

- **GIVEN** any page
- **WHEN** the visitor activates `Contact us`
- **THEN** the contact page is displayed
- **AND** the heading `GET IN TOUCH` is visible

### Requirement: REQ-CTC-02 — A complete submission with an attachment is accepted

The contact form SHALL accept a name, an email address, a subject, a message and a file
attachment. Submission SHALL raise a browser confirmation dialog, and accepting it SHALL
result in a visible success message.

#### Scenario: Submission with attachment succeeds

- **GIVEN** the contact page
- **WHEN** the visitor supplies name, email, subject, message and a file, and submits
- **AND** accepts the browser confirmation dialog
- **THEN** the message `Success! Your details have been submitted successfully.` is displayed

### Requirement: REQ-CTC-03 — The visitor can return to the storefront

The contact success state SHALL offer a route back to the home page.

#### Scenario: Home returns to the storefront

- **GIVEN** the contact success state
- **WHEN** the visitor activates `Home`
- **THEN** the home page is displayed

## Constraints inherited from the environment

| Constraint            | Effect on this capability                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1 shared environment | Message contents are not readable back. The success message is the only observable.                                                                                            |
| —                     | The attachment is a small fixture file committed to the repo, not a file generated at runtime and not a file from the developer's machine — so the test is reproducible in CI. |

## Note on the dialog

REQ-CTC-02's confirmation dialog is a native browser `confirm()`. A dialog handler must be
registered **before** the submit action, not after — registering it afterwards is a race
that passes locally and fails under load. This is a known trap on this form and is called
out here so the test plan derives a case for it rather than discovering it as a flake.

## Not claimed

That the message reaches anyone, or that the attachment is stored. No observable exists.
