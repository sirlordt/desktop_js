---
description: Encapsulation rules — NEVER bypass component APIs with direct style/DOM manipulation
paths: ["*"]
---

# Encapsulation Over Hacks

## The Rule

**NEVER bypass a component's public API by directly manipulating its internal DOM, styles, or private properties. If the API doesn't support what you need, EXTEND THE API.**

This applies to:
- Setting `component.style.width = '100%'` when the layout engine controls `style.width`
- Accessing `component._privateField` or internal DOM nodes
- Using `setTimeout` or `requestAnimationFrame` to race against internal lifecycle methods
- Overriding `style` properties that will be overwritten by `applyLayout()`

## Why This Matters

The layout engine (`UIView.applyLayout()`) owns `style.width`, `style.height`, `style.position`, and other layout properties. Any direct manipulation of these styles WILL be overwritten on the next layout pass (triggered by connect, attribute change, visibility toggle, or explicit `update()` call). Hacks that "work" initially will break silently when the component re-renders.

## Case Study: Window Manager Fluid Width

**The Problem:** The `UIWindowManagerWC` needed to fill its parent's width instead of using a fixed pixel value. The demo was using `new UIWindowManagerWC({ width: 900, height: 600 })`.

**The Wrong Solution (DO NOT DO THIS):**
```typescript
// BAD: Breaking encapsulation — directly setting style that applyLayout() owns
const wm = new UIWindowManagerWC({ height: 600 })
wm.style.width = '100%'  // This gets overwritten by applyLayout()!
```

This fails because:
1. `applyLayout()` runs after `connectedCallback` and overwrites `style.width` with a px value
2. `parseInt('100%')` returns `100`, making `managerWidth` return 100px instead of the real width
3. The fix requires more hacks: changing `managerWidth` getter to detect `%`, changing `position` to `'fluid'` then manually restoring `position: relative`... each hack creates more hacks

**The Correct Solution:**
```typescript
// GOOD: Using the component's public API — just don't pass width
const wm = new UIWindowManagerWC({ height: 600 })
// Width defaults to 'auto' internally, element flows to parent width naturally
```

This required extending the architecture:
1. Added `'auto'` to `DimensionKind` — a first-class concept in the layout engine
2. Updated `applyLayout()` to respect `kind === 'auto'` — clears `style.width` instead of forcing px
3. Updated `UIWindowManagerWC.configureManager()` — defaults to `width: 'auto'` when not specified
4. Updated `PanelWCOptions` and `UIWindowManagerOptions` — accept `'auto'` as a valid value

The component's abstraction handles everything. The consumer just says what they want.

## How To Solve These Problems Correctly

1. **Read the component's Options interface first.** If a property exists, use it. If it doesn't, add it to the interface and implement it properly through the component chain.

2. **Never set `style.*` on a component that has a layout engine.** The layout engine owns those properties. Use the component's API (`configure()`, attributes, or programmatic setters).

3. **If `applyLayout()` overwrites your change, the fix is in `applyLayout()`, not in racing it.** Add proper support for your use case in the layout engine.

4. **Follow the chain:** `Options interface → configure() → UIView core → applyLayout() → DOM`. Every new capability should flow through this entire chain.

5. **If the interface lacks a property, event, or method you need — create it.** Adding a proper API surface is always the right answer. Reaching into internals is always the wrong one.

## SOLID Principles In This Codebase

- **Single Responsibility:** `UIPosition` controls CSS positioning. `DimensionKind` controls sizing. Don't overload one to do both.
- **Open/Closed:** Extend `DimensionKind` with new values (like `'auto'`) rather than adding special-case `if` statements scattered across consumers.
- **Liskov Substitution:** A `UIWindowManagerWC` is a `UIPanelWC`. Any option that works on a panel should work on the WM.
- **Interface Segregation:** Consumers interact through `Options` interfaces, not internal implementation details.
- **Dependency Inversion:** The demo depends on the `UIWindowManagerOptions` abstraction, not on `HTMLElement.style`.
