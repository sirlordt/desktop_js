# Design: Window Component (UIWindow + UIWindowManager improvements)

## Summary

Enhancements to the existing UIWindow and UIWindowManager to cover the full window_component requirements. This is not a rewrite — it builds on the existing implementation.

## Changes to UIWindow

### 1. Resize from all 8 edges/corners

Current: only E, S, SE handles.

New: N, S, E, W, NE, NW, SE, SW — 8 resize handles around the window.

```
NW ── N ── NE
│            │
W            E
│            │
SW ── S ── SE
```

- N/W/NW resize must adjust `left`/`top` in addition to `width`/`height` (the window grows toward top-left)
- Handles are 4px invisible `<div>`s positioned on edges, 12px on corners
- Cursor: `n-resize`, `s-resize`, `e-resize`, `w-resize`, `ne-resize`, `nw-resize`, `se-resize`, `sw-resize`
- Disabled when `resizable === false` or `windowState === 'maximized'`

### 2. Disable drag/resize via properties

New properties in `UIWindowOptions` and on the class:

```typescript
movable?: boolean    // default: true — set false to prevent dragging
resizable?: boolean  // already exists — set false to prevent resize
```

When `movable === false`, mousedown on titlebar does NOT start drag.
When `windowState === 'minimized'`, drag is also disabled.

### 3. Title visibility and alignment

```typescript
showTitle?: boolean            // default: true — false hides the title text
titleAlign?: 'left' | 'center' | 'right'  // default: 'left'
```

- `showTitle: false` → `display: none` on the title `<span>`, titlebar still shows buttons
- `titleAlign` → CSS `text-align` on the title element. For center, the title gets `flex: 1; text-align: center;`. For right, `text-align: right`.

### 4. Custom buttons in titlebar

```typescript
leftElements?: HTMLElement[]     // inserted at the LEFT of the titlebar (before icon/title)
rightElements?: HTMLElement[]    // inserted at the RIGHT, BEFORE the standard buttons (min/max/close)
```

DOM order in titlebar:
```
[leftElements...] [icon] [title] [rightElements...] [min] [max] [close]
```

Also expose methods for dynamic insertion:
```typescript
addLeftElement(el: HTMLElement): void
addRightElement(el: HTMLElement): void
```

### 5. WIN95 close button separation

In WIN95 theme, the close button has a small margin-left separating it from minimize/maximize. Done via CSS:

```css
[data-theme^="win95"] .ui-window__close-btn {
  margin-left: 4px;
}
```

### 6. Maximize button icon toggle

When `windowState === 'maximized'`, the maximize button icon changes from `plus` to a "restore" icon (overlapping squares). When restored, it changes back to `plus`.

Implemented by swapping the UIToolButton icon on state change.

## Changes to UIWindowManager

### 7. Minimize grid at the bottom

When a window is minimized, instead of `display: none`, the manager places it in a **grid at the bottom** of the manager area.

Grid behavior:
- Fixed cell size: **160px wide × 28px tall** (shows only the titlebar)
- Grid fills left-to-right, then wraps to the next row upward
- Each cell is a fixed slot. When a window is restored, its slot becomes **empty/reserved** for the next minimize
- Grid starts at bottom-left corner of the manager

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              Normal windows area                │
│                                                 │
│                                                 │
├──────────┬──────────┬──────────┬────────────────┤
│ Win 1    │ [empty]  │ Win 3    │                │
│ (min)    │          │ (min)    │                │
└──────────┴──────────┴──────────┴────────────────┘
```

Implementation:
- Manager maintains `_minimizeSlots: (IWindowChild | null)[]`
- On minimize: find first null slot (or append new one), assign window to slot, position it
- On restore: set slot to null (reserved empty space)
- Minimized windows show only their titlebar (height = titleBarHeight)
- Minimized windows have `movable: false` (no drag)
- Minimized windows can be closed, restored, or maximized from their titlebar buttons

### 8. Minimized window appearance

When minimized:
- Window is resized to **160×28px** (grid cell size) and positioned in the grid
- Only the titlebar is visible (body hidden)
- `windowState = 'minimized'`
- Resize handles hidden
- Drag disabled
- Close/restore/maximize buttons still functional

When restored:
- Window returns to its previous position and size (saved before minimize)
- Body becomes visible again
- All normal functionality restored

## Updated interfaces

```typescript
interface UIWindowOptions {
  // ... existing options ...
  movable?: boolean                    // default: true
  showTitle?: boolean                  // default: true
  titleAlign?: 'left' | 'center' | 'right'  // default: 'left'
  leftElements?: HTMLElement[]         // custom elements at titlebar left
  rightElements?: HTMLElement[]        // custom elements before standard buttons
}

class UIWindow {
  // ... existing API ...

  // New properties
  movable: boolean
  showTitle: boolean
  titleAlign: 'left' | 'center' | 'right'

  // New methods
  addLeftElement(el: HTMLElement): void
  addRightElement(el: HTMLElement): void
}

// UIWindowManager additions
class UIWindowManager {
  // ... existing API ...

  // Minimize grid config
  minimizeSlotWidth: number    // default: 160
  minimizeSlotHeight: number   // default: 28
}
```

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/types.ts` | modify | Add movable, showTitle, titleAlign, leftElements, rightElements to UIWindowOptions |
| `src/components/ui-window/ui-window.ts` | modify | Add all 8 resize handles, movable property, title visibility/alignment, custom elements, maximize icon toggle |
| `src/components/ui-window/ui-window.css` | modify | Add all 8 cursor resize handles, WIN95 close separation, title alignment, minimize appearance |
| `src/components/ui-window-manager/ui-window-manager.ts` | modify | Add minimize grid logic (slots, positioning, restore rect) |
| `src/demos/windows.ts` | modify | Expand demo with new features |

## Discarded alternatives

- **Taskbar for minimized windows**: Discarded per requirement — minimized windows go to a grid at the bottom, not a taskbar. The spec says "no existe un taskbar registrado".
- **Minimize to icon only**: Discarded — minimized windows show their titlebar (160×28) so they can be interacted with (close/restore/maximize).
- **Dynamic grid cell size**: Discarded in favor of fixed 160×28 for simplicity. Can be overridden via `minimizeSlotWidth`/`minimizeSlotHeight` on the manager.
- **Reuse empty slots immediately**: Discarded — empty slots stay reserved so the grid doesn't jump when windows are restored. New minimizes use the first null slot or append.
