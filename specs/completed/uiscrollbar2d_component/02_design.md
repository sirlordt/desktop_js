# Design: UIScrollbar2D Component

## Technical decisions

### Konva as rendering engine
The component renders entirely on a `<canvas>` element via Konva.js. This means:
- No Shadow DOM or internal HTML elements — everything is drawn shapes on a Konva Stage/Layer.
- The component itself is still a Web Component (`HTMLElement`) that hosts the Konva Stage internally.
- Styling is done through Konva shape properties (fill, stroke, etc.), not CSS.

### Architecture: Web Component shell + Konva internals
The component follows the existing project pattern of being a custom element, but diverges internally:
- **Outer layer:** Extends `HTMLElement` (autonomous custom element). On `connectedCallback`, the element sets `display: block`, `overflow: hidden`, and `tabindex="0"`. This ensures proper clipping of the Konva canvas and keyboard focus support.
  - Registration: `customElements.define('scrollbar2d-wc', UIScrollbar2DWC)`
  - Usage: `<scrollbar2d-wc></scrollbar2d-wc>`
- **Inner layer:** A `Konva.Stage` attached to the element, with a single `Konva.Layer` containing all scrollbar shapes.
- No integration with `UIView`/`UIPanelWC` layout engine — this is a standalone canvas component.

### Scrollbar anatomy (per axis)
Each scrollbar (horizontal/vertical) consists of 4 Konva shapes:
1. **Back button** (`Konva.Group` with `Rect` + arrow `Path`) — decrements scroll position
2. **Forward button** (`Konva.Group` with `Rect` + arrow `Path`) — increments scroll position
3. **Track** (`Konva.Rect`) — the rail between buttons, clickable for page-step jumps
4. **Thumb** (`Konva.Rect`) — draggable indicator of current scroll position

Layout for vertical scrollbar:
```
[Back ▲] [====Track====] [Forward ▼]
              [Thumb]
```

Layout for horizontal scrollbar:
```
[Back ◄] [====Track====] [Forward ►]
              [Thumb]
```

### Thumb size calculation
The thumb size is proportional to the visible area relative to the total content:
```
thumbSize = (visibleSize / contentSize) * trackLength
```
Clamped to a minimum of 20px so it remains grabbable.

### Testing strategy (hybrid)
Since Konva renders to canvas (no DOM nodes to query), a hybrid approach is used:

1. **Unit tests on `ScrollbarModel`** — pure math and state logic (clamping, thumb size calculation, step increments, value-to-position mapping). No Konva dependency, fast and deterministic.

2. **Scene graph tests on Konva nodes** — Konva maintains an in-memory node tree with real positions and sizes. Tests assert spatial relationships to catch visual correctness issues:
   - Thumb is within track bounds
   - Buttons are at the correct extremes (start/end of scrollbar)
   - Thumb size is proportional to visibleSize/contentSize
   - Thumb position updates correctly after value changes
   - No overlapping between buttons, track, and thumb
   - Events on nodes (fire `mousedown`/`mousemove`) produce correct value changes

3. **Demo as manual smoke test** — the `demo2d` page serves as human-verifiable visual validation.

### Theme support
Colors are defined in a theme object passed via options. A default light theme is provided. The component does not observe `data-theme` on `<html>` since it doesn't use CSS — theme changes require calling `configure()` with new colors.

## Interfaces

```typescript
export const ScrollBar2DKind = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
  Both: 'both',
} as const
export type ScrollBar2DKind = typeof ScrollBar2DKind[keyof typeof ScrollBar2DKind]

export interface ScrollBar2DTheme {
  trackFill: string
  trackStroke: string
  thumbFill: string
  thumbHoverFill: string
  thumbDragFill: string
  buttonFill: string
  buttonHoverFill: string
  buttonArrowStroke: string
  cornerFill: string           // dead zone where H and V meet
}

export interface ScrollBar2DOptions {
  kind?: ScrollBar2DKind        // default: 'both'
  width?: number                // canvas width in px
  height?: number               // canvas height in px
  barSize?: number              // scrollbar thickness in px (default: 16)

  // Vertical axis
  vMin?: number                 // default: 0
  vMax?: number                 // default: 100
  vValue?: number               // default: 0
  vVisibleSize?: number         // visible portion (drives thumb size)
  vStep?: number                // button click increment (default: 1)
  vPageStep?: number            // track click increment (default: 10)

  // Horizontal axis
  hMin?: number
  hMax?: number
  hValue?: number
  hVisibleSize?: number
  hStep?: number
  hPageStep?: number

  theme?: Partial<ScrollBar2DTheme>
}

// Event detail emitted on scroll changes
export interface ScrollBar2DChangeDetail {
  axis: 'horizontal' | 'vertical'
  value: number
  previousValue: number
}
```

### Public API

```typescript
class UIScrollbar2DWC extends HTMLElement {
  configure(options?: ScrollBar2DOptions): void
  destroy(): void

  // Per-axis value getters/setters
  get vValue(): number
  set vValue(v: number)
  get hValue(): number
  set hValue(v: number)

  // Update content/visible dimensions (recalculates thumb sizes)
  setVerticalRange(min: number, max: number, visibleSize: number): void
  setHorizontalRange(min: number, max: number, visibleSize: number): void
}
```

### Events
- `sb2d-change` — `CustomEvent<ScrollBar2DChangeDetail>` — fired on every value change (drag, click, keyboard).

### Internal model (testable independently)

```typescript
class ScrollbarModel {
  min: number
  max: number
  value: number
  visibleSize: number
  step: number
  pageStep: number
  trackLength: number           // set by layout

  get thumbSize(): number       // computed
  get thumbPosition(): number   // computed
  
  setValue(v: number): number    // clamps & returns final value
  stepForward(): number
  stepBackward(): number
  pageForward(): number
  pageBackward(): number
  setFromThumbPosition(pos: number): number  // drag handler
}
```

## File structure

| File | Action | Description |
|------|--------|-------------|
| `package.json` | modify | Add `konva` as a dependency |
| `src/components/common/types.ts` | modify | Add `ScrollBar2DKind`, `ScrollBar2DTheme`, `ScrollBar2DOptions`, `ScrollBar2DChangeDetail` |
| `src/components/ui-scrollbar2d-wc/ui-scrollbar2d-wc.ts` | create | Main Web Component with Konva rendering |
| `src/components/ui-scrollbar2d-wc/scrollbar-model.ts` | create | Pure model class (state + math, no Konva dependency) |
| `src/components/__tests__/scrollbar2d-model.test.ts` | create | Unit tests for ScrollbarModel |
| `src/components/__tests__/scrollbar2d-wc.test.ts` | create | Integration tests via Konva scene graph |
| `src/demos/scrollbar2d-wc.ts` | create | Demo page with interactive scrollbar |
| `src/main.ts` | modify | Register `scrollbar2dWCDemo` in `registerDemos()` |

## Discarded alternatives

### 1. Extend UIScrollBarWC with canvas rendering
Rejected because the existing `UIScrollBarWC` is deeply tied to DOM elements, Shadow DOM, and CSS styling. Retrofitting Konva into it would require rewriting most of the component while keeping a confusing inheritance chain.

### 2. Render directly with Canvas 2D API (no Konva)
Would work but requires manual hit-testing, event delegation, and scene management that Konva provides out of the box. The requirement explicitly asks for Konva.

### 3. Use UIView layout engine for positioning the scrollbar
The layout engine operates on DOM elements. Since Konva shapes are not DOM elements, integrating with UIView would require an adapter layer with no clear benefit. The scrollbar manages its own internal layout within the canvas.
