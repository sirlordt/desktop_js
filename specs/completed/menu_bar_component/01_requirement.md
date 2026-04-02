# Feature: menu_bar_component

## Status
- [x] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
A menu bar component that displays menu items horizontally, allowing users to navigate between application sections and features. Each item opens a dropdown popup on click. The component must support keyboard navigation, dynamic overflow handling, and be adaptable to different screen sizes.

## Acceptance criteria
- [ ] The menu bar displays multiple UIMenuItems horizontally, each with a title
- [ ] Clicking a UIMenuItem opens a dropdown popup (UIPopupWC) associated with that item. Popups can be kind `menu` or kind `container`
- [ ] When the bar lacks horizontal space to display all items, a ">>" overflow item appears. Clicking it opens a popup with the remaining items. It recalculates dynamically on container resize. The ">>" item is navigable with keyboard like any other item
- [ ] The component must be adaptable to different screen sizes
- [ ] Keyboard navigation: ArrowLeft/ArrowRight moves focus between bar items, except when a popup is expanded (the popup owns keyboard control), except for popup kind `container` (which never takes keyboard control)
- [ ] When a popup kind `menu` is open and ArrowLeft/ArrowRight is pressed at the root level of the popup (no active sub-menu), it closes the current popup and opens the previous/next MenuBar item's popup. This is the standard desktop menu bar behavior (File → Edit → View with arrows)
- [ ] Hovering over another MenuBar item while a popup is open closes the current popup and opens the hovered item's popup
- [ ] The menu bar has a `disabled` property that disables the entire component and prevents all interaction
- [ ] Individual UIMenuItems can be disabled via their existing `disabled` property to prevent interaction
- [ ] Must have tests for keyboard and mouse usage
- [ ] Must have a demo showcasing keyboard and mouse usage

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
- `UIMenuItemWC` — individual menu items (already implemented, includes `disabled` support)
- `UIPopupWC` — dropdown popups for menu content (already implemented, supports kind `menu` and `container`)
- Theme system — menu bar must respect all themes (GTK4 Light/Dark, WIN95 Light/Dark)
