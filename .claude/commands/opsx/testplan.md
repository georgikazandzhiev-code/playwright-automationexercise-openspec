---
name: 'OPSX: Testplan'
description: "Generate the change's test plan and test cases — before any product code (Experimental)"
allowed-tools: Bash(openspec:*), Read, Write, Edit, Grep, Glob
category: 'Workflow'
tags: ['workflow', 'artifacts', 'testing', 'experimental']
---

Generate the change's **test plan** — an enumerated, prioritized, traceable list
of the test cases the change must satisfy.

Runs **after `/opsx:propose`** (proposal + spec deltas exist) and **before
`/opsx:apply`** (code). Produces `test-plan.md` and **no product code**; it edits
no source files.

**Input**: Optionally specify a change name (e.g. `/opsx:testplan add-auth`). If
omitted, infer it from conversation context. If vague or ambiguous you MUST
prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and ask the user to select one

   Always announce: "Using change: <name>" and how to override
   (e.g. `/opsx:testplan <other>`).

2. **Resolve context and paths**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse `schemaName`, `planningHome`, `changeRoot`, and `artifactPaths`. Use
   these resolved paths — never assume repo-local ones.

   If the schema has no `test-plan` artifact, say so and stop: the project is on
   the stock `spec-driven` schema and needs the test-first fork registered in
   `openspec/config.yaml`.

3. **Get artifact instructions**

   ```bash
   openspec instructions test-plan --change "<name>" --json
   ```

   This returns `context`, `rules`, `template`, `instruction`, `dependencies`,
   and `resolvedOutputPath`. Treat `context` and `rules` as constraints on you —
   do NOT copy them into the file. Use `template` as the output structure.

4. **Gate checks — stop early if unmet**
   - `proposal.md` and at least one spec delta must exist. If missing, tell the
     user to run `/opsx:propose` first and stop.
   - No unresolved open question that would make a requirement ambiguous.
     Surface it and stop — an ambiguous requirement produces false coverage.
   - `design.md` is optional; read it when present for richer cases.

5. **Load the sources of truth**

   Re-read from disk, not from conversation memory: `proposal.md`, every spec
   delta under `artifactPaths.specs.existingOutputPaths` (the ADDED / MODIFIED
   requirements and their `Scenario:` blocks), `design.md` if present, and
   `openspec/AGENTS.md`.

6. **Derive the test cases**
   1. **Requirements under test** — one row per requirement in the deltas, using
      its heading as the id (e.g. `REQ-reset-request`).
   2. **Test cases** — go beyond the happy-path scenarios already in the delta:
      negative paths, boundaries, error handling, concurrency, and — where the
      change touches them — security and performance. Each case gets:
      - a stable id `TC-NN`;
      - a category `[Unit] / [Contract] / [Integration] / [E2E]`;
      - a priority `P1` (critical path / security / data-loss — never lower for
        these), `P2` (core regression), `P3` (edge);
      - the requirement(s) it **covers**;
      - a Given/When/Then intent and the expected observable result — **no test
        code**.
   3. **Coverage matrix** — map every requirement to its covering `TC` ids.
      Every `Scenario:` in the deltas maps to ≥1 case. A requirement with zero
      cases is a hard failure: add cases until no right-hand cell is empty.
   4. **Non-functional candidates** — security / performance / accessibility.
      "None identified" only when genuinely absent. A deferred area (e.g. rate
      limiting owned by another capability) is recorded as deferred with its
      reason — never silently dropped.
   5. **Assumptions & open questions** — including any case that asserts a
      requirement only partially. A documented limit is honest; a limit hidden
      behind a green check is not.

7. **Self-check before writing**
   - Every requirement and every delta `Scenario:` appears in the coverage
     matrix with ≥1 `TC`.
   - Every `TC` has an id, category, priority, and ≥1 covered requirement.
   - No product code, no invented UI details.
   - P1 on every security / data-loss / critical-path case.

8. **Write and report**

   Write to `resolvedOutputPath` with Status `Draft — awaiting approval`. Report:
   - the path;
   - counts by category and by priority;
   - any requirement that needed extra cases to reach coverage;
   - anything recorded as deferred or partially asserted.

   Then ask the user to review and approve, and note what approval unlocks:
   `/opsx:apply` writes these tests first and confirms they fail before
   implementing, and `/opsx:verify` enforces the coverage gate.

**Output**

```markdown
## Test Plan Created: <change-name>

**Path:** <resolvedOutputPath>
**Status:** Draft — awaiting approval

**Cases:** N total — X Contract, Y Integration, Z E2E · A × P1, B × P2, C × P3
**Coverage:** N requirements, M scenarios — all covered

### Needed extra cases beyond the delta scenarios

- REQ-<name>: TC-NN (<why>)

### Deferred / partially asserted

- <area>: <what is not covered and why>

Review and set Status to `Approved`, then run `/opsx:apply`.
```

**Guardrails**

- Requirements-level only — never write test code or product code here
- Never leave a requirement or a delta `Scenario:` uncovered; add cases instead
- Never mark a partially-asserted case as fully covered — record the limit
- P1 on security / data-loss / critical-path cases, no exceptions
- Re-read the deltas from disk; the user may have edited them since you last saw them
- Do not copy `context` or `rules` into the artifact
- Leave Status at `Draft — awaiting approval`; only a human approves
- Use `resolvedOutputPath` from the CLI, don't assume a file name
