# Feature: ui_element_base (UIElementView)

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
A base class `UIElementView` that all `djs-*` components inherit from. This class provides a common layout engine inspired by the Delphi/VCL `TControl` model — with dimensions (left, top, width, height, right, bottom), anchors, align/docking, parent-child hierarchy, and a layout pass where the parent computes each child's rect.

This replaces the previous `View` class from the DeskJS project, but now backed by the CSS variable theme system instead of hardcoded theme strings.

## Acceptance criteria
- [ ] All `djs-*` components extend `UIElementView` instead of `HTMLElement` directly.
- [ ] The base class provides `left`, `top`, `width`, `height`, `right`, `bottom` as dimension properties with `kind: 'set' | 'dynamic'` semantics.
- [ ] The base class provides a `size` attribute with presets: `tiny`, `small`, `medium`, `large`, `xlarge`, `custom`. When not `custom`, the preset defines default height. When `custom`, `width` and `height` attributes are used directly.
- [ ] The base class provides an `align` property with values: `none`, `left`, `top`, `right`, `bottom`, `center`, `client`. The parent runs a layout pass to compute aligned children's rects.
- [ ] The base class provides `anchors` (`toLeft`, `toTop`, `toRight`, `toBottom`) for resize behavior. When both `toLeft` and `toRight` are true, width stretches with parent.
- [ ] The base class provides a `position` attribute (`fluid`, `relative`, `absolute`) that determines how `left`/`top` are applied.
- [ ] The base class manages parent-child hierarchy with `parent`, `children`, `addChild`, `removeChild`.
- [ ] The base class provides `destroy()` with automatic cleanup of event listeners and child destruction.
- [ ] The base class provides `visible`, `disabled`, `name`, `opacity` properties.
- [ ] The base class provides a `render()` / `update()` method that applies layout to the DOM element.
- [ ] Existing `djs-button` component must be refactored to extend `UIElementView` without breaking current functionality.
- [ ] Pure TypeScript, no external dependencies.
- [ ] Demo page showing components with different size presets, positioning modes, align/docking, and anchors.

## Constraints
- Must not break existing `djs-button` API or demos.
- The base class does NOT create Shadow DOM — child components handle their own Shadow DOM.

## Dependencies
- `scheme_color_theme_colors` — Consumes theme CSS variables for size presets.
- `button_component` — First component to be refactored to use this base class.
