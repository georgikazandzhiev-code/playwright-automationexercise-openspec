---
name: 'OPSX: Verify'
description: 'Coverage gate — verify the applied change covers its test plan (Experimental)'
allowed-tools: Bash(openspec:*), Bash(npm:*), Read, Grep, Glob
category: 'Workflow'
tags: ['workflow', 'testing', 'quality', 'experimental']
---

Verify an applied change against its test plan — the **coverage gate**. Runs
after `/opsx:apply` and before `/opsx:sync` / `/opsx:archive`.

This command **reads and reports; it does not fix**. It never edits specs, tasks,
tests, or product code. If it finds a gap, it reports it and stops — closing the
gap is a separate, deliberate act.

**Input**: Optionally specify a change name (e.g. `/opsx:verify add-auth`). If
omitted, infer it from conversation context. If vague or ambiguous you MUST
prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` and ask the user to select one

   Always announce: "Using change: <name>" and how to override
   (e.g. `/opsx:verify <other>`).

2. **Resolve paths**

   ```bash
   openspec status --change "<name>" --json
   ```

   Use `artifactPaths` for every artifact path — the delta specs come from
   `artifactPaths.specs.existingOutputPaths`, never from inference.

3. **Read the four sources, from disk**
   - every spec delta (requirements + their `Scenario:` blocks)
   - `test-plan.md` (its status, its cases, its coverage matrix)
   - `tasks.md` (test tasks, implementation tasks, their `TC-NN` references)
   - the test files in the repo (grep for `TC-` to find which ids are realized
     in actual test names)

   Do not trust the test plan's own coverage matrix as evidence — recompute the
   mapping from the deltas and the tasks. A matrix that claims coverage is the
   claim under test, not the proof.

4. **Run the checks**

   **A. Test plan exists and is approved** — `test-plan.md` present, Status
   `Approved`. Missing or unapproved → **blocking**.

   **B. Requirement coverage** — every requirement in the deltas maps to ≥1 `TC`
   in the test plan. Uncovered requirement → **blocking**.

   **C. Scenario coverage** — every `Scenario:` in the deltas maps to ≥1 `TC`.
   Uncovered scenario → **blocking**.

   **D. Case implementation** — every `TC-NN` maps to ≥1 task in `tasks.md`.
   Unimplemented case → **blocking**.

   **E. Task traceability** — every implementation task references ≥1 `TC-NN`.
   Untraceable task → **blocking**, unless the task is enabling scaffolding
   explicitly labelled as such.

   **F. Cases realized in code** — every `TC-NN` appears in at least one test
   name in the repo. A case that exists on paper but in no test → **blocking**.

   **G. Suite and lint** — run and report the real output:

   ```bash
   npm test
   npm run lint
   ```

   Any failure → **blocking**. Report the actual output; never summarize a
   failing run as passing.

   **H. Honesty checks** — non-blocking findings worth surfacing:
   - a case whose assertion is weaker than the requirement it claims to cover
     (the test plan should say so in its assumptions — verify it does)
   - a deferred non-functional area that the plan records as deferred (good) vs
     one silently absent (report it)
   - `test.skip`, `it.skip`, `if`/`else`, or `try/catch` inside a test body
   - an assertion loosened or a schema widened to make a test pass

5. **Report**

   State the verdict first, then the evidence. Every blocking finding names the
   file and what is missing. Never say "all good" while any check is unrun.

**Output — gate passed**

```markdown
## Verify: <change-name> — PASS

| Check                               | Result                                    |
| ----------------------------------- | ----------------------------------------- |
| A. Test plan approved               | ✅                                        |
| B. Requirement coverage             | ✅ N/N requirements                       |
| C. Scenario coverage                | ✅ M/M scenarios                          |
| D. Every TC has a task              | ✅ K/K cases                              |
| E. Every impl task traces to a TC   | ✅ (X scaffolding tasks exempt, labelled) |
| F. Every TC realized in a test name | ✅ K/K found in tests/                    |
| G. Suite + lint                     | ✅ <actual counts>                        |

### Documented limits (not gaps)

- <what the plan records as deferred or partially asserted, and where>

Ready for `/opsx:sync` or `/opsx:archive`.
```

**Output — gate failed**

```markdown
## Verify: <change-name> — BLOCKED

### Blocking findings

1. **<check>** — <what is missing, with file path>
   → <the specific thing that must exist>

### Passing checks

- <list>

Not ready to sync or archive. Close the findings above, then re-run `/opsx:verify`.
```

**Guardrails**

- Report, don't fix — never edit specs, tasks, tests, or product code from here
- Recompute coverage from the deltas and tasks; the plan's own matrix is a claim, not proof
- Run the suite and the linter; report their real output including failures
- A blocking finding blocks — do not soften it to "minor" to reach a pass
- Never mark a check ✅ that you did not actually run
- A documented limit is reported as a limit, not as coverage
- Scaffolding tasks are exempt from `(covers ...)` only when labelled as such
- If the schema has no `test-plan` artifact, say the project is not on the
  test-first fork and stop
