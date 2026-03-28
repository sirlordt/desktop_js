# Design: menu_item_sub_menus_component

## Technical decisions

### Approach: property on UIMenuItemWC + extended keyboard nav in UIPopupWC

The sub-menu feature is split across two existing components:

1. **UIMenuItemWC** gets a `subMenu` property that accepts a `UIPopupWC` instance.
2. **UIPopupWC** extends its keyboard navigation to support Arrow Right (open sub-menu) and Arrow Left (close sub-menu and return to parent).

**Justification**: Sub-menus are a collaboration between menu items and popups. The menu item owns the "what" (which popup to show), and the popup owns the "how" (keyboard navigation, positioning, close behavior). This avoids creating a new component and leverages existing battle-tested code.

### Sub-menu property on UIMenuItemWC

```
menuItem.subMenu = popupInstance   // attach
menuItem.subMenu = null            // detach
```

When `subMenu` is set:
- A right-arrow chevron indicator is rendered in the **right slot** (only if no custom `rightElement` is set).
- The popup's `anchor` is set to the menu item element.
- The popup's `alignment` defaults to `RightTop` (opens to the right of the item).
- The `closeOnClickOutside` is set to `false` on the sub-menu (the parent popup manages outside clicks).
- The `closeOnEscape` is set to `false` on the sub-menu (keyboard handling is centralized in the parent popup).

When `subMenu` is set to `null`:
- The arrow indicator is removed.
- The popup is NOT destroyed (the caller owns the popup lifecycle).

The property is changeable at runtime — swapping sub-menus dynamically re-wires anchor and indicator.

### Opening behavior

Sub-menus open via three triggers:

1. **Hover** (only when parent popup is attached): Mouse enters the menu item → start a **200ms open delay**. If the mouse leaves before the delay, cancel. If the mouse enters the sub-menu popup, the sub-menu stays open.
2. **Arrow Right** key (only when parent popup is attached): Immediately opens the sub-menu and moves highlight to its first item.
3. **Click**: Opens the sub-menu immediately (both attached and detached states).

When a different menu item in the same parent popup is hovered/highlighted, any open sibling sub-menu closes first (only one sub-menu open per level).

### Closing behavior

Sub-menus close via:

1. **Mouse leaves** item + sub-menu area: A **300ms close delay** allows the mouse to travel from the item to the sub-menu. If the mouse re-enters either, the close is cancelled.
2. **Arrow Left** key (only when sub-menu is attached): Closes the sub-menu and returns highlight to the parent item.
3. **Escape** key: Closes the current level (existing behavior).
4. **Cascade close**: When a leaf item is selected, `request-parent-close` bubbles up and closes each attached level.

### Cascade close mechanism

The existing `request-parent-close` CustomEvent already bubbles with `composed: true`. The cascade flow:

```
User clicks leaf item in level N
  → leaf emits 'request-parent-close' (bubbles up)
  → level N popup receives it → if attached → close()
  → level N-1 menu item's sub-menu just closed
  → level N-1 popup receives 'request-parent-close' → if attached → close()
  → ... continues up ...
  → stops at any level that is DETACHED (detached popups don't auto-close on child selection)
```

Implementation: UIPopupWC's existing `request-parent-close` listener calls `close()`. For cascade to stop at detached levels, the listener checks `this._state === 'attached'` before closing. Detached popups ignore `request-parent-close` from children.

### Keyboard navigation across levels

The keyboard handling is extended in **UIPopupWC's `_bindMenuNav`**:

| Key | Current state | Action |
|-----|---------------|--------|
| Arrow Down | Any | Move highlight to next item (existing) |
| Arrow Up | Any | Move highlight to previous item (existing) |
| Arrow Right | Highlighted item has subMenu, sub-menu is closed, popup is attached | Open sub-menu, redirect arrow key navigation to it, highlight its first item |
| Arrow Right | Highlighted item has subMenu, sub-menu is detached (already open as tool window) | Redirect arrow key navigation to the detached sub-menu, highlight its first item (real focus stays on the original anchor — navigation is simulated via highlight, same as all menu popups) |
| Arrow Right | No subMenu | No-op |
| Arrow Left | Popup is a sub-menu and attached | Close this popup, return arrow key navigation to parent popup, re-highlight parent item |
| Arrow Left | Popup is a sub-menu and detached, currently being navigated | Stop navigating the detached sub-menu (clear its highlight), return arrow key navigation to parent popup (detached sub-menu stays open) |
| Arrow Left | Root popup or detached without parent | No-op |
| Enter | Highlighted item has subMenu | Open sub-menu (same as Arrow Right) |
| Enter | Highlighted item is leaf | Activate item (existing) |
| Escape | Any | Close current level (existing) |

To know whether a popup is a sub-menu, UIPopupWC gets an internal `_parentMenuItem: UIMenuItemWC | null` reference, set automatically when `menuItem.subMenu = popup`.

### Positioning

Sub-menus use `alignment: 'RightTop'` by default — they open to the right of the parent item, aligned to the item's top edge.

The existing `findBestPosition()` FLIP algorithm handles edge cases:
- If there's no room on the right → flips to `LeftTop`.
- If there's no room below → adjusts vertically.

When the parent popup is inside a `UIWindowManagerWC`, the sub-menu is positioned within the same container (absolute positioning).

### Detachable sub-menus

When a sub-menu is detachable:
- The sub-menu can be dragged out into a tool window (existing detach behavior).
- Once detached, the sub-menu is already visible as a floating tool — Arrow Right does NOT re-open it, but instead **redirects arrow key navigation** to the detached sub-menu, highlighting its items with Up/Down. Real keyboard focus remains on the original anchor element at all times (consistent with how all menu popups work — they simulate focus via highlight, never steal real focus).
- Arrow Left **returns arrow key navigation** to the parent menu and clears the highlight in the detached sub-menu, without closing it.
- Cascade close stops at this level — detached sub-menus remain open when a leaf item is selected elsewhere.
- The sub-menu can be closed independently via its window close button.

### Arrow indicator

The right-arrow chevron is an inline SVG (same pattern as UIMenuItemWC's existing check icon for pushed state). It's rendered in the **right slot** inside the shadow DOM, only when:
- `subMenu` is not null
- No custom `rightElement` was set by the user

The arrow uses `currentColor` for theme compatibility.

### Sub-menu with kind = container

When a sub-menu popup has `kind = 'container'` (instead of the default `'menu'`):

- **Attached state**: The container sub-menu does NOT take real focus when opened. Normally, `kind = container` popups move focus into themselves for Tab cycling — but when used as a sub-menu, this is suppressed. The anchor retains focus, consistent with the menu navigation model.
- **Detached state**: Same override applies — the detached tool window does NOT steal focus on creation. The anchor keeps focus.
- **Why**: A container sub-menu is still part of a menu hierarchy. Stealing focus would break arrow key navigation in the parent menu and create an inconsistent UX where some sub-menus keep keyboard flow and others hijack it.
- **Scope**: This override ONLY applies when the popup `isSubMenu === true` AND `kind === 'container'`. A standalone `kind = container` popup (not used as a sub-menu) retains its normal focus-stealing behavior.

### Framework compatibility

- The `subMenu` property is a standard JS property (getter/setter), accessible from any framework.
- Frameworks can create popup instances and assign them: `<menuitem-wc .subMenu=${popup}>` (Lit), `:sub-menu="popup"` (Vue with ref), etc.
- The sub-menu popup can contain framework-rendered content via light DOM slots.
- HTML attribute `sub-menu-alignment` allows overriding the default alignment from markup.

## Interfaces

### Changes to UIMenuItemWC

```typescript
// New property
get subMenu(): UIPopupWC | null
set subMenu(popup: UIPopupWC | null)

// New read-only
get hasSubMenu(): boolean

// New attribute (optional override)
// <menuitem-wc sub-menu-alignment="LeftTop">
```

### Changes to UIPopupWC

```typescript
// Internal reference (set automatically by UIMenuItemWC.subMenu setter)
_parentMenuItem: UIMenuItemWC | null

// New read-only property
get isSubMenu(): boolean

// New method: close only if attached (for cascade)
closeIfAttached(): void
```

### Changes to UIMenuItemOptions

```typescript
export interface UIMenuItemOptions {
  // ... existing options ...

  /** Sub-menu popup to show when this item is activated */
  subMenu?: UIPopupWC | null

  /** Alignment override for the sub-menu. Default: 'RightTop' */
  subMenuAlignment?: HintAlignment
}
```

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui-menu-item-wc/ui-menu-item-wc.ts` | modify | Add `subMenu` property, arrow indicator, hover/click open logic |
| `src/components/ui-menu-item-wc/ui-menu-item-wc.css` | modify | Add styles for arrow indicator |
| `src/components/ui-popup-wc/ui-popup-wc.ts` | modify | Extend `_bindMenuNav` for Arrow Right/Left, add `_parentMenuItem` ref, add `closeIfAttached()` |
| `src/components/common/types.ts` | modify | Add `subMenu` and `subMenuAlignment` to `UIMenuItemOptions` |
| `src/components/__tests__/submenu.test.ts` | create | Comprehensive sub-menu tests |
| `src/demos/popups-wc.ts` | modify | Add sub-menu demo sections |

## DOM structure

### Menu item with sub-menu (arrow indicator)

```
<menuitem-wc>
  #shadow-root
    <div class="left"> ... </div>
    <div class="center"> ... </div>
    <div class="right">
      <slot name="right"></slot>
      <span class="submenu-arrow">▶</span>  <!-- SVG chevron-right -->
    </div>
</menuitem-wc>
```

### Nested menu hierarchy

```
<popup-wc>                          <!-- Level 0: root menu -->
  <menuitem-wc text="New">          <!-- has subMenu → shows arrow -->
    <!-- subMenu opens as: -->
    <popup-wc>                      <!-- Level 1: sub-menu -->
      <menuitem-wc text="File">
      <menuitem-wc text="Project">  <!-- has subMenu → shows arrow -->
        <popup-wc>                  <!-- Level 2: nested sub-menu -->
          <menuitem-wc text="React">
          <menuitem-wc text="Vue">
        </popup-wc>
      </menuitem-wc>
    </popup-wc>
  </menuitem-wc>
  <menuitem-wc text="Open...">
  <menuitem-wc text="Save">
</popup-wc>
```

## State diagram

```
                    ┌─────────────────────────┐
                    │    Sub-menu CLOSED       │
                    └─────────┬───────────────┘
                              │
              hover (200ms) / Arrow Right / Click
                              │
                    ┌─────────▼───────────────┐
                    │   Sub-menu ATTACHED      │
                    │  (positioned at RightTop │
                    │   of parent item)        │
                    └─────────┬───────────────┘
                              │
                    ┌─────────┼───────────────┐
                    │         │               │
              Arrow Left   drag grip    leaf click
              / Escape    (if detachable)  (cascade)
                    │         │               │
                    ▼         ▼               ▼
              [CLOSED]   [DETACHED]      [CLOSED]
                         (tool window,   (+ parent
                          independent)    closes too)
```

## Discarded alternatives

### New UISubMenuWC component
Discarded because sub-menus are just a UIPopupWC opened from a UIMenuItemWC — no new component is needed. Adding a separate component would duplicate popup logic and create an awkward API where users choose between UIPopupWC and UISubMenuWC for the same concept.

### Hover-only opening (no click)
Discarded because click-to-open is more accessible and works better on touch devices. Hover is kept as an additional convenience for mouse users but is not the sole trigger.

### Managing sub-menu state in UIPopupWC
Discarded because the menu item is the natural owner of "I have a sub-menu" state. The popup doesn't need to know about all its items' sub-menus — it only needs to handle keyboard events that delegate to the currently highlighted item's sub-menu.

### Recursive popup nesting via DOM children
Considered having sub-menu popups as DOM children of menu items (declarative nesting). Discarded because UIPopupWC portals its visual content to document.body/WM container, so DOM nesting would be misleading. The property-based approach (`menuItem.subMenu = popup`) is explicit and avoids DOM hierarchy confusion.
