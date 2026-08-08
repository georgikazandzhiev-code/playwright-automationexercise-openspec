# Test Plan — [CHANGE_ID]

**Change:** [openspec/changes/<change-id>]
**Proposal:** [link to proposal.md] · **Spec deltas:** [list specs/<domain>/spec.md]
**Author (agent):** /opsx:testplan · **Status:** Draft — awaiting approval
**Traceability:** every requirement in the spec deltas is covered by ≥1 test case (see § Coverage Matrix).

> Requirements-level test cases only — **no test code**. Code is applied later by `/opsx:apply` and the automation skills. This document is the contract the applied code must satisfy.

## 1. Scope & objectives

- **In scope:** [what this change's tests verify — the requirements/scenarios in the deltas]
- **Out of scope:** [explicitly excluded]
- **Test levels used:** [Unit / Contract / Integration / E2E — which apply and why]

## 2. Requirements under test

> Ids are the requirement headings from the change's spec deltas.

| Requirement | Summary | Source delta |
|-------------|---------|--------------|
| REQ-[name] | [requirement text] | specs/[domain]/spec.md |
| … | … | … |

## 3. Test cases

> ID `TC-NN`. Category `[Unit] / [Contract] / [Integration] / [E2E]`. Priority `P1` (critical path / security / data-loss), `P2` (core regression), `P3` (edge). Every delta `Scenario:` maps to ≥1 case.

| ID | Title | Category | Priority | Covers | Given / When / Then (intent) | Expected result |
|----|-------|----------|----------|--------|------------------------------|-----------------|
| TC-01 | [happy path] | [Contract] | P1 | REQ-[name] | GIVEN … WHEN … THEN … | [observable outcome] |
| TC-02 | [negative / validation] | [Contract] | P2 | REQ-[name] | GIVEN … WHEN invalid … THEN … | [error shape / status] |
| … | … | … | … | … | … | … |

## 4. Non-functional candidates

| Area | Applies? | Case(s) / notes |
|------|----------|-----------------|
| Security | [Yes/No] | [TC-IDs or "None identified"] |
| Performance / load | [Yes/No] | [candidate + rough threshold, or "None identified"] |
| Accessibility | [Yes/No] | [notes or "N/A"] |

## 5. Coverage matrix (requirement → test cases)

> Hard rule: **no empty right-hand cell.** A requirement with no test case means § 3 is incomplete.

| Requirement | Covered by | Planned task(s) |
|-------------|-----------|-----------------|
| REQ-[name] | TC-01, TC-02 | *(filled by the tasks step)* |

## 6. Assumptions & open questions

- [Assumptions the cases depend on]
- [Open questions — resolve before `/opsx:apply` if they affect a P1 case]

---

**Approval:** on review, change Status to `Approved`. The `tasks` step, `/opsx:apply`, `/opsx:verify`, and `/opsx:archive` treat this file as the coverage source of truth.
