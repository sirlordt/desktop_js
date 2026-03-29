---
description: Mandatory workflow for new features — design, test expected behavior, then implement
paths: ["*"]
---

# New Feature Workflow — Design, Test, Implement

## The Rule

**Every new feature MUST follow this exact sequence. No exceptions.**

This applies to ALL types of new work:
- New components
- New properties, events, or methods on existing components
- New behaviors or modes in the layout engine
- New utility functions or helpers
- New demos or demo sections
- Refactors that change observable behavior

### 1. Design — Define what changes and where

- Identify what needs to change and at which layer.
- Define the public contract: interfaces, options, attributes, events, methods.
- Follow the architecture chain: `Types → UIView → UIPanelWC → Specialized WC`.
- If the feature requires a new concept (like `DimensionKind.Auto`), design it as a first-class citizen in the appropriate layer — not as a special case in a consumer.

### 2. Align with the user

- Present the design: what changes, where, and why.
- Get confirmation before writing any code.

### 3. Write tests BEFORE the implementation

- Write tests that describe the expected behavior of the new feature.
- Tests must use the component's public API — the same interface a consumer would use.
- Cover the main scenario and edge cases.
- Each test should be specific: one behavior per test.

### 4. Run the tests — verify they FAIL

- Run the new tests and confirm they fail (the feature doesn't exist yet).
- If a test passes before implementation, it's not testing the new feature.
- Do not proceed to implementation until all new tests are red.

### 5. Implement the feature

- Follow the encapsulation rules (see `encapsulation.md`).
- Flow through the full chain: types, core engine, base component, specialized component.
- Do not add hacks, shortcuts, or direct style manipulation.

### 6. Run the tests — verify they PASS

- Run the new tests and confirm they all pass.
- Run the full test suite to verify no regressions.

### 7. Verify in the demo (if applicable)

- If there's a relevant demo, update it to showcase the new feature.
- The demo must use the public API only — it serves as documentation for consumers.

## Why This Matters

Tests written before implementation force you to think about the feature from the consumer's perspective. This produces:
- Clean, usable APIs (because you designed for the consumer first)
- Complete coverage (because the tests existed before the code)
- Clear contracts (because the tests document expected behavior)

Writing the implementation first leads to tests that verify the implementation rather than the behavior — tests that pass even when the feature is broken.

## Summary

```
FEATURE REQUEST → Design → Align with user → Write failing tests → Verify FAILS → Implement → Verify PASSES → Full suite → Update demo
```

Never skip steps. The tests define what "done" means before you start building.
