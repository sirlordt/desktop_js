---
description: Mandatory workflow for fixing bugs — test-first, verify failure, then fix
paths: ["*"]
---

# Bug Fix Workflow — Test First, Fix Second

## The Rule

**Every bug fix MUST follow this exact sequence. No exceptions.**

### 1. Analyze — Understand the root cause

- Read the relevant code. Trace the execution path.
- Identify the root cause, not just the symptom.
- Determine the correct fix (not a hack — see `encapsulation.md`).

### 2. Write the test BEFORE the fix

- Design one or more tests that reproduce the bug.
- The test must exercise the specific failing behavior.
- The test must use the component's public API, not internal implementation details.

### 3. Run the test — verify it FAILS

- Run the new test(s) and confirm they fail.
- If the test passes before the fix, the test is wrong — it's not testing the bug.
- Do not proceed to the fix until you have a red test.

### 4. Implement the fix

- Apply the correct solution through the proper abstraction layers.
- Follow the encapsulation rules — extend APIs if needed, never hack around them.

### 5. Run the test again — verify it PASSES

- Run the same test(s) and confirm they now pass.
- Also run the full test suite to verify no regressions.

## Why This Matters

A bug that was found without a test is a bug that will come back. The test is proof that:
- The bug existed (the test fails without the fix)
- The fix works (the test passes with the fix)
- The bug won't regress (the test runs on every future change)

Without this workflow, bugs slip through silently — like the `DimensionKind.Auto` issue where the Window Manager had no test coverage for fluid width, so the broken behavior went undetected.

## Summary

```
BUG FOUND → Analyze root cause → Write failing test → Verify test FAILS → Implement fix → Verify test PASSES → Run full suite
```

Never skip steps. Never write the fix first. The failing test is the proof that you understand the bug.
