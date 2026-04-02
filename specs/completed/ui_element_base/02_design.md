# Design: ui_element_base (UIElementView)

## Technical decisions

- `UIElementView` extends `HTMLElement` and provides shared layout, sizing, hierarchy, and lifecycle logic.
- All `djs-*` components extend `UIElementView` instead of `HTMLElement` directly.
- The layout model is based on the Delphi/VCL `TControl` pattern: parent computes child rects based on `align`, and anchors control resize behavior.
- Dimensions use a `DimensionProp { kind: 'set' | 'dynamic', value: number }` model — `'set'` means the developer explicitly defined it, `'dynamic'` means it was computed by the layout engine. This prevents the layout engine from overwriting developer intent.
- The base class does NOT create Shadow DOM — that responsibility stays with each child component.
- All visual appearance is driven by CSS variables from the theme system. No hardcoded colors or theme strings.

---

## Types

```typescript
// src/components/base/types.ts

export type DimensionKind = 'set' | 'dynamic'

export interface DimensionProp {
  kind: DimensionKind
  value: number
}

export type Align = 'none' | 'left' | 'top' | 'right' | 'bottom' | 'center' | 'client'

export interface Anchors {
  toLeft: boolean
  toTop: boolean
  toRight: boolean
  toBottom: boolean
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export type UISize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'custom'

export type UIPosition = 'fluid' | 'relative' | 'absolute'
```

---

## Size presets

Each preset defines a default `height`. Width defaults to `auto` (content-driven). When `size="custom"`, `width` and `height` attributes are used directly.

| Size | Default height | Use case |
| :--- | :--- | :--- |
| `tiny` | 24px | Toolbar icons, compact UI |
| `small` | 28px | Secondary actions, inline controls |
| `medium` | 32px | Default for most controls |
| `large` | 40px | Primary actions, form inputs |
| `xlarge` | 48px | Hero CTAs, prominent actions |
| `custom` | from `height` attr | Developer-defined dimensions |

---

## Align / Docking system

The parent runs a layout pass (`_computeChildrenLayout`) that distributes available space among aligned children, in order:

| Align | Behavior |
| :--- | :--- |
| `none` | No docking. Uses `left`, `top`, `width`, `height` directly (or anchors). |
| `top` | Fills full width at the top of available area. Reduces available space from top. |
| `bottom` | Fills full width at the bottom of available area. Reduces available space from bottom. |
| `left` | Fills full height at the left of available area. Reduces available space from left. |
| `right` | Fills full height at the right of available area. Reduces available space from right. |
| `client` | Takes all remaining available space. |
| `center` | Centers within available space using its own `width`/`height`. |

Aligned children are processed in DOM order. A `top`-aligned child followed by a `client`-aligned child creates a classic header + content layout.

---

## Anchors system

When `align="none"`, anchors control how dimensions react when the parent resizes:

| Anchors | Effect |
| :--- | :--- |
| `toLeft + toRight` | Width stretches: `width = parentWidth - left - right` |
| `toTop + toBottom` | Height stretches: `height = parentHeight - top - bottom` |
| `!toLeft + toRight` | Left is dynamic: `left = parentWidth - right - width` (sticks to right edge) |
| `!toTop + toBottom` | Top is dynamic: `top = parentHeight - bottom - height` (sticks to bottom edge) |
| `toLeft` only (default) | Fixed position from left |
| `toTop` only (default) | Fixed position from top |

---

## Position modes

| Mode | CSS `position` | `left`/`top` from | Use case |
| :--- | :--- | :--- | :--- |
| `fluid` | `static` | Ignored (document flow) | Normal inline/block flow |
| `relative` | `relative` | Offset from flow position | Small adjustments |
| `absolute` | `absolute` | Coordinates within parent | Desktop-style free layout |

> When `align != 'none'`, the position is always `absolute` (the layout engine sets coordinates).

---

## UIElementView class

```typescript
export class UIElementView extends HTMLElement {
  // ── Dimensions (DimensionProp with set/dynamic) ──
  left, top, width, height, right, bottom

  // ── Layout ──
  align: Align                    // default: 'none'
  anchors: Anchors                // default: { toLeft: true, toTop: true, toRight: false, toBottom: false }
  position: UIPosition            // default: 'fluid'
  size: UISize                    // default: 'medium'

  // ── Appearance ──
  visible: boolean                // default: true
  disabled: boolean               // cascades to children
  opacity: number                 // default: 1

  // ── Identity ──
  name: string

  // ── Hierarchy ──
  parent: UIElementView | null
  children: ReadonlyArray<UIElementView>
  addChild(child): void
  removeChild(child): void

  // ── Lifecycle ──
  destroy(): void
  isDestroyed: boolean

  // ── Event cleanup ──
  protected _on(el, event, handler, options?): void  // auto-cleanup on destroy

  // ── Layout engine ──
  private _computeChildrenLayout(): void  // parent distributes rects to aligned children
  protected _applyLayout(): void          // applies computed rect to DOM styles

  // ── Render ──
  render(): HTMLElement
  update(): void
}
```

### observedAttributes (base)

```
size, position, left, top, width, height, visible, disabled, name, opacity
```

Child classes merge their own:
```typescript
static get observedAttributes() {
  return [...UIElementView.UI_ATTRS, ...BUTTON_ATTRS]
}
```

---

## How child components use it

```typescript
// djs-button.ts
import { UIElementView } from '../base/ui-element-view'

export class DjsButton extends UIElementView {
  static get observedAttributes() {
    return [...UIElementView.UI_ATTRS, ...BUTTON_ATTRS]
  }

  constructor() {
    super()
    // Create Shadow DOM, button element, etc.
  }

  connectedCallback() {
    super.connectedCallback()  // handles layout setup
    // Button-specific setup
  }

  attributeChangedCallback(name, old, val) {
    super.attributeChangedCallback(name, old, val)  // handles layout attrs
    // Button-specific attr handling
  }
}
```

---

## Usage examples

```html
<!-- Basic button (fluid, medium) -->
<djs-button>Save</djs-button>

<!-- Size presets -->
<djs-button size="tiny">Tiny</djs-button>
<djs-button size="xlarge">Extra Large</djs-button>

<!-- Custom dimensions -->
<djs-button size="custom" width="200" height="40">Custom</djs-button>

<!-- Absolute positioning (desktop-style window layout) -->
<djs-button position="absolute" left="100" top="50">OK</djs-button>
<djs-button position="absolute" left="200" top="50">Cancel</djs-button>

<!-- Docking (inside a container) -->
<djs-panel>
  <djs-toolbar align="top" height="40">...</djs-toolbar>
  <djs-statusbar align="bottom" height="24">...</djs-statusbar>
  <djs-content align="client">...</djs-content>
</djs-panel>

<!-- Anchors (resize behavior) -->
<djs-button position="absolute" left="10" top="10" width="200"
            anchors-right="true">
  Stretches when parent grows
</djs-button>

<!-- Sticks to bottom-right corner -->
<djs-button position="absolute" width="80" height="32" right="10" bottom="10"
            anchors-left="false" anchors-top="false"
            anchors-right="true" anchors-bottom="true">
  OK
</djs-button>
```

---

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/base/types.ts` | create | Shared types (DimensionProp, Align, Anchors, Rect, etc.) |
| `src/components/base/ui-element-view.ts` | create | Base class with layout engine |
| `src/components/base/ui-element-view.css` | create | Base host styles (positioning, sizing) |
| `src/components/djs-button/djs-button.ts` | modify | Extend `UIElementView` instead of `HTMLElement` |
| `src/components/djs-button/djs-button.css` | modify | Adapt internal sizing to fill host |
| `src/demos/layout.ts` | create | Demo page showing align, anchors, positioning |
| `src/demos/buttons.ts` | modify | Add size preset and positioning examples |
| `src/main.ts` | modify | Register layout demo |

---

## Discarded alternatives

- **CSS-only layout (no JS layout pass):** Discarded because the docking/align system requires parent-driven rect computation. CSS alone can't replicate the VCL align model where children are processed in order and each one reduces available space.
- **Separate `<djs-box>` wrapper:** Discarded because inline attributes on each component are more natural for desktop-style UI authoring.
- **Using only CSS `position` without anchors:** Discarded because anchors provide resize-aware behavior (stretch, stick-to-edge) that CSS position alone doesn't handle declaratively.
- **Previous DeskJS `View` class as-is:** The layout engine logic is reused, but the theme system (`theme: string`, `scheme: string`) is replaced by CSS variables. No hardcoded colors in the base class.
