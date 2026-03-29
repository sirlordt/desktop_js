# Design: menu_bar_component

## Technical decisions

### Component: `UIMenuBarWC`

- Custom element tag: `<menubar-wc>`
- Extends `HTMLElement` directly (standalone, Shadow DOM like UIMenuItemWC)
- Does NOT extend UIPanelWC — the menu bar has no need for the layout engine's positioning/sizing. It's a simple flex container that flows naturally in the document
- Uses light DOM slotting for items — UIMenuItems are direct children projected via `<slot>`

### Framework compatibility (Vue, React, Angular, Svelte, Solid)

The component uses a **fully declarative API** — no imperative `addItem()` calls required. Consumers add `<menuitem-wc>` elements as children and set `item.subMenu = popup` on each. The MenuBar auto-detects its children via `slotchange` events and reads each item's existing `subMenu` property to find associated popups.

This works identically across all frameworks:

```html
<!-- Any framework / vanilla HTML -->
<menubar-wc>
  <menuitem-wc text="File"></menuitem-wc>
  <menuitem-wc text="Edit"></menuitem-wc>
  <menuitem-wc text="View"></menuitem-wc>
</menubar-wc>
```

```typescript
// Associate popups via existing UIMenuItemWC.subMenu property
fileItem.subMenu = filePopup
editItem.subMenu = editPopup
```

No refs, no lifecycle hooks, no imperative registration needed. This is the same pattern `UIWindowManagerWC` uses with `MutationObserver` for auto-detecting `<window-wc>` children.

### Child auto-detection

The MenuBar listens to `slotchange` on its internal `<slot>` to detect when items are added or removed. For each slotted `menuitem-wc` child:

1. Reads `item.subMenu` to find its associated popup (if any)
2. Binds click and hover handlers for popup open/close behavior
3. Unbinds handlers when the item is removed from the slot

This eliminates the need for an explicit registry or `addItem()`/`removeItem()` methods.

### Overflow handling

A `ResizeObserver` on the host recalculates which items fit on every resize:

1. Iterate items left-to-right, summing `offsetWidth`
2. When cumulative width exceeds available space, remaining items are hidden via `display: none`
3. A ">>" trigger item (built-in UIMenuItemWC) becomes visible, with a popup kind `menu` containing proxy items that mirror the hidden originals
4. Clicking a proxy opens the original item's popup
5. If all items fit, ">>" hides
6. Recalculation is debounced to avoid thrashing

### Keyboard navigation

**Bar-level (no popup open):**
- `ArrowRight`: highlight next item (wraps). ">>" is part of the cycle
- `ArrowLeft`: highlight previous item (wraps)
- `Enter` / `ArrowDown`: open highlighted item's popup
- `Escape`: remove highlight from bar

**With popup kind `menu` open:**
The popup owns keyboard control. The MenuBar intercepts at the boundary:
- `ArrowLeft` at popup root level (no `_activeSubMenu`): close current popup, open previous bar item's popup
- `ArrowRight` at popup root level when highlighted item has no sub-menu: close current popup, open next bar item's popup

Implementation: the MenuBar adds a capture-phase `keydown` listener on `document`. When a popup is open, it checks if the popup is at root level before intercepting. This avoids modifying UIPopupWC internals.

**With popup kind `container` open:**
The popup never takes keyboard control (already implemented). The bar keeps control — ArrowLeft/ArrowRight still navigate bar items normally.

### Mouse behavior

- **Click** on item: toggle its popup (open if closed, close if open)
- **Hover** on another item while a popup is open: close current popup, open hovered item's popup
- **Click outside**: close open popup (handled by UIPopupWC's existing `closeOnClickOutside`)

### Disabled state

When `disabled = true`:
- Bar-level keyboard/mouse handlers are deactivated
- No popups can open
- Visual: `.disabled` class on host
- Individual items can be independently disabled via their own `disabled` property

### Theme support

Same `_syncTheme()` pattern as UIMenuItemWC:
- MutationObserver on `document.documentElement` for `data-theme` changes
- Toggles `.win95` class for WIN95 themes
- CSS custom properties for colors

## Interfaces

```typescript
export interface UIMenuBarOptions {
  disabled?: boolean
  className?: string
}
```

### Public API

```typescript
class UIMenuBarWC extends HTMLElement {
  constructor(options?: UIMenuBarOptions)

  // Properties
  get disabled(): boolean
  set disabled(value: boolean)

  // Methods
  addItem(item: UIMenuItemWC): void      // Programmatically add an item (appends to DOM)
  removeItem(item: UIMenuItemWC): void   // Programmatically remove an item
  getItems(): UIMenuItemWC[]             // Returns all managed menuitem-wc children
  destroy(): void                        // Clean up listeners, observers, DOM
}
```

**Two paths to the same result:**
- **Declarative (primary):** Add `<menuitem-wc>` children in HTML/template. The MenuBar auto-detects them via `slotchange`. Popups are discovered via each item's existing `subMenu` property.
- **Imperative (complementary):** Call `addItem(item)` / `removeItem(item)` for dynamic scenarios (adding items at runtime, reordering, framework-managed rendering). These simply append/remove the item from the DOM, triggering the same `slotchange` detection.

### Events (CustomEvent, bubbles + composed)

| Event            | Detail                   | When               |
|------------------|--------------------------|--------------------|
| `menubar-open`   | `{ item: UIMenuItemWC }` | A popup opens      |
| `menubar-close`  | `{ item: UIMenuItemWC }` | A popup closes     |

### HTML Attributes

| Attribute  | Maps to    |
|------------|------------|
| `disabled` | `disabled` |

## Shadow DOM structure

```
:host (menubar-wc)
  <style>...</style>
  <div class="bar">
    <slot></slot>                              ← slotted UIMenuItems (light DOM)
    <menuitem-wc class="overflow-trigger"      ← built-in ">>" item
                 text=">>">
  </div>
```

## CSS design

```css
:host {
  display: flex;
  align-items: center;
  height: var(--menubar-height, 28px);
  background-color: var(--headerbar-bg-color);
  user-select: none;
  overflow: hidden;
}

.bar {
  display: flex;
  flex: 1;
  align-items: center;
  overflow: hidden;
}

::slotted(menuitem-wc) {
  flex-shrink: 0;
}

:host(.disabled) {
  color: var(--disabled-fg-color, rgba(128, 128, 128, 0.55));
  pointer-events: none;
}

/* Active item (popup is open) */
::slotted(menuitem-wc.menubar-active) {
  background-color: var(--hover-bg-color);
}
```

Theme-specific overrides for GTK4 Light/Dark and WIN95 Light/Dark, following existing component patterns.

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/types.ts` | modify | Add `UIMenuBarOptions` interface |
| `src/components/ui-menubar-wc/ui-menubar-wc.ts` | create | Component class |
| `src/components/ui-menubar-wc/ui-menubar-wc.css` | create | Shadow DOM styles |
| `src/components/__tests__/menubar-wc.test.ts` | create | Tests |
| `src/demos/menubar-wc.ts` | create | Demo page |
| `src/main.ts` | modify | Register demo |

## Interaction flow

```
[File] [Edit] [View] [Help] [>>]

1. User clicks Edit         → popup Edit opens
2. User hovers View         → popup Edit closes, popup View opens
3. User presses ArrowLeft   → popup View closes, popup Edit opens
4. User presses ArrowDown   → navigates inside popup Edit
5. User presses ArrowLeft   → popup Edit closes, popup File opens
   at popup root level
6. User presses Escape      → popup File closes, focus returns to
                               File item in bar
```

## Discarded alternatives

### Extending UIPanelWC
Rejected because the MenuBar doesn't need the layout engine's absolute positioning or dimension management. It's a simple horizontal flex container. Using UIPanelWC would add complexity (DimensionKind, applyLayout) with no benefit, and would fight the layout engine for sizing control.

### Imperative-only API (no auto-detection)
Rejected as the sole approach because it forces framework users to use refs and lifecycle hooks. However, `addItem()`/`removeItem()` are kept as a complementary imperative API for dynamic scenarios. They simply manipulate the DOM, which triggers the same `slotchange` auto-detection — one mechanism, two entry points.

### Modifying UIPopupWC for arrow key boundary detection
Rejected because it would add MenuBar-specific logic inside UIPopupWC, violating single responsibility. Instead, the MenuBar intercepts keys from outside via a capture-phase document listener, keeping UIPopupWC unaware of the MenuBar's existence.

### Moving items to Shadow DOM instead of slotting
Rejected because slotting keeps items in light DOM, making them accessible to consumers for styling and querying. It also matches how UIWindowManagerWC manages its children (direct child elements).
