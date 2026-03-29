# Feature: menu_item_sub_menus_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
Add a property to `UIMenuItemWC` that allows attaching a `UIPopupWC` as a sub-menu. This enables building nested menu hierarchies where any menu item can open a child popup menu.

## Acceptance criteria

### Core behavior
- [ ] A new property on `UIMenuItemWC` accepts a `UIPopupWC` instance as a sub-menu.
- [ ] The property can be changed at runtime (swap, add, or remove sub-menus dynamically).
- [ ] The sub-menu renders at the same level as the parent menu item, positioned relative to the item and respecting available screen space.
- [ ] The sub-menu behaves like a normal menu: opens/closes on click, closes when clicking outside or when a child option is selected.
- [ ] Multiple nesting levels are supported — a sub-menu item can itself have a sub-menu, recursively.

### Visual indicator
- [ ] When the parent popup is in attached state (`kind = menu`), menu items with sub-menus display a right arrow indicator.

### Detachable sub-menus
- [ ] Sub-menus can be detachable — they can be dragged to a separate position while maintaining the relationship with the parent menu item.

### Cascade close
- [ ] When a leaf item is clicked, all ancestor menus close in cascade up to the root.
- [ ] Cascade close stops at any ancestor level that is in detached state — detached menus remain open.

### Keyboard navigation
- [ ] **Arrow Down**: Move highlight to the next item in the current menu.
- [ ] **Arrow Up**: Move highlight to the previous item in the current menu.
- [ ] **Arrow Right**: Open the sub-menu of the currently highlighted item (only when the current menu is in attached state, not detached).
- [ ] **Arrow Left**: Close the current sub-menu and return focus to the parent menu (only when the current sub-menu is in attached state).
- [ ] **Enter**: Activate the highlighted item (or open its sub-menu if it has one).
- [ ] **Escape**: Close the current menu level.

### Framework compatibility
- [ ] Must be as framework-friendly as possible (Vue, React, Angular, Svelte, Solid).

### Testing & demos
- [ ] Extensive tests covering: single-level sub-menus, multi-level nesting, detachable sub-menus, cascade close behavior, keyboard navigation across levels.
- [ ] Demos added to `src/demos/popups-wc.ts` showing `UIMenuItemWC` and `UIPopupWC` (`kind = menu`) working together with sub-menus.

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
- `UIMenuItemWC` (completed)
- `UIPopupWC` (completed)
