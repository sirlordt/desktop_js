---
description: Layout engine architecture — DimensionKind, UIPosition, applyLayout, and how sizing works
paths: ["*"]
---

# Layout Engine Architecture

## DimensionKind (types.ts)

Every dimension (width, height, left, top, right, bottom) in the layout engine is a `DimensionProp` with a `kind` and a `value`:

- **`'set'`** — explicit value in pixels, set by the developer
- **`'dynamic'`** — computed by the layout engine (anchors, alignment)
- **`'auto'`** — delegate to CSS; the layout engine does NOT touch `style.width`/`style.height`

## UIPosition vs Sizing

`UIPosition` (`'fluid' | 'relative' | 'absolute' | 'fixed'`) controls the CSS `position` property. It does NOT control sizing strategy. Sizing is controlled independently per-dimension via `DimensionKind`.

This separation is critical. A component can be `position: relative` (to act as a containing block for absolutely positioned children) while having `width: auto` (to flow naturally to its parent's width).

## UIView.applyLayout()

`applyLayout()` applies dimensions to the DOM. For each dimension, it checks `kind`:
- `'set'` or `'dynamic'` → sets `style.width = '${value}px'`
- `'auto'` → sets `style.width = ''` (clears it, lets CSS handle it)

This check is applied in ALL branches of the dimension logic (layout children, custom size, fluid position, relative position, absolute position).

## Adding New Dimension Behaviors

If you need a new sizing strategy, extend `DimensionKind` in `types.ts` and handle it in `applyLayout()`. Do NOT add special-case logic in individual components or consumers.

The chain for any new capability is always:
```
Options interface → configure() → UIView core → applyLayout() → DOM
```
