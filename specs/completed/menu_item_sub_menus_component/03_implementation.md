# Implementation: menu_item_sub_menus_component

## Status
`done`

## Modified files

| File | Status | Notes |
|------|--------|-------|
| `src/components/common/types.ts` | done | Added `subMenu` and `subMenuAlignment` to `UIMenuItemOptions` |
| `src/components/ui-menu-item-wc/ui-menu-item-wc.ts` | done | Added `subMenu` property, arrow indicator, hover/click open logic, cleanup |
| `src/components/ui-menu-item-wc/ui-menu-item-wc.css` | done | Added `.submenu-arrow` styles |
| `src/components/ui-popup-wc/ui-popup-wc.ts` | done | Added `_parentMenuItem`, `isSubMenu`, `closeIfAttached()`, extended `_bindMenuNav` for Arrow Right/Left, cascade close propagation, container sub-menu focus suppression |
| `src/components/__tests__/submenu.test.ts` | done | 27 tests covering all sub-menu behavior |
| `src/demos/popups-wc.ts` | done | Added sub-menu demo with 3-level nesting |

## Implementation notes

- **Cascade close**: The `request-parent-close` event only reaches the immediate popup's window (since sub-menu windows are portaled to body/WM). Cascade is achieved by having the popup re-emit `request-parent-close` on the `_parentMenuItem` after closing, which bubbles up to the next parent popup.
- **Hover binding**: The hover open/close timers are bound once when `subMenu` is set. The sub-menu's internal UIWindowWC also gets mouseenter/mouseleave listeners to keep the sub-menu open while the mouse travels from item to popup.
- **Arrow indicator**: Uses the existing `_makeSvg` helper with a chevron-right path. Placed in the right slot alongside any custom `rightElement`.
- **`subMenu` type in types.ts**: Declared as `HTMLElement | null` (not `UIPopupWC`) to avoid circular import in the types file. The runtime setter casts appropriately.
- **Container sub-menu focus suppression**: Added a third branch in `show()` that checks `this._kind === 'container' && this._parentMenuItem` to skip focus stealing.

## Changelog

| Date | Change |
|------|--------|
| 2026-03-28 | Initial implementation — all 27 tests passing, 414 total tests |
