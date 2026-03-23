# Design: button_component

## Technical decisions

- The button is implemented as a **vanilla Web Component** (`<ds-button>`) using `customElements.define`. This makes it framework-agnostic and easy to wrap in Vue, React, or Angular.
- Uses **Shadow DOM** for style encapsulation — the component ships its own CSS that reads theme variables from the host document. No styles leak in or out.
- All visual appearance is driven by **CSS custom properties** from the theme system (`scheme_color_theme_colors`). The component does not hardcode any colors, fonts, or border radii.
- The component allows **CSS overrides** via custom properties on the element itself (e.g., `<ds-button style="--button-bg-color: pink">`). When overridden, theme consistency is the developer's responsibility.
- **Toggle mode** is built into the component as an opt-in attribute. When enabled, the button emits a `toggle` event with the current pressed state.
- **No dependencies** — pure TypeScript + CSS.

---

## Interfaces

```typescript
// ── Attributes (reflected as HTML attributes) ──

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant'

interface DsButtonAttributes {
  /** Visual style variant */
  variant: ButtonVariant       // default: 'solid'

  /** Size preset */
  size: ButtonSize             // default: 'medium'

  /** Disabled state */
  disabled: boolean            // default: false

  /** Toggle mode — button stays pressed on click */
  toggle: boolean              // default: false

  /** Current pressed state (only meaningful when toggle=true) */
  pressed: boolean             // default: false

  /** Icon name/SVG for the left slot */
  'icon-left': string | null   // default: null

  /** Icon name/SVG for the right slot */
  'icon-right': string | null  // default: null

  /** Icon to show on left when pressed (toggle mode) */
  'icon-left-pressed': string | null   // default: null

  /** Icon to show on right when pressed (toggle mode) */
  'icon-right-pressed': string | null  // default: null
}

// ── Events ──

interface DsButtonEvents {
  /** Fired on click. For toggle buttons, includes pressed state. */
  'ds-click': CustomEvent<{ pressed: boolean }>
}

// ── Slots ──
// <slot>              — Button label (text content)
// <slot name="icon-left">  — Left icon (overrides icon-left attribute)
// <slot name="icon-right"> — Right icon (overrides icon-right attribute)
```

### Usage examples

```html
<!-- Basic solid button -->
<ds-button>Save</ds-button>

<!-- Outline, small, with left icon -->
<ds-button variant="outline" size="small" icon-left="search">Search</ds-button>

<!-- Destructive with right icon -->
<ds-button variant="destructive" icon-right="trash">Delete</ds-button>

<!-- Ghost button, disabled -->
<ds-button variant="ghost" disabled>Cancel</ds-button>

<!-- Toggle button with icon swap -->
<ds-button toggle icon-left="play" icon-left-pressed="pause">Play</ds-button>

<!-- Custom override -->
<ds-button style="--button-bg-color: #ff6600; --button-fg-color: #fff;">Custom</ds-button>

<!-- Framework slot usage -->
<ds-button>
  <svg slot="icon-left">...</svg>
  Submit
</ds-button>
```

---

## Component internal structure

### Shadow DOM template

```html
<button class="ds-btn" part="button">
  <span class="ds-btn__icon-left" part="icon-left">
    <slot name="icon-left"><!-- fallback from icon-left attr --></slot>
  </span>
  <span class="ds-btn__label" part="label">
    <slot></slot>
  </span>
  <span class="ds-btn__icon-right" part="icon-right">
    <slot name="icon-right"><!-- fallback from icon-right attr --></slot>
  </span>
</button>
```

- Uses `part` attributes for external CSS targeting via `::part()`.
- Icon slots are hidden when no icon is provided.

---

## Styling

### Size matrix

| Size | Padding | Font Size | Border Radius var |
| :--- | :--- | :--- | :--- |
| `tiny` | 4px 8px | `--font-size-xs` | `--btn-border-radius-tiny` |
| `small` | 6px 12px | `--font-size-sm` | `--btn-border-radius-small` |
| `medium` | 8px 16px | `--font-size-md` | `--btn-border-radius-medium` |
| `large` | 10px 20px | `--font-size-lg` | `--btn-border-radius-large` |
| `giant` | 12px 24px | `--font-size-xl` | `--btn-border-radius-giant` |

### Variant styles

| Variant | Background | Color | Border | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `solid` | `--accent-bg-color` | `--accent-fg-color` | `--btn-border-width` `--btn-border-style` `--accent-bg-color` | Primary action |
| `outline` | `transparent` | `--accent-bg-color` | `--btn-border-width` solid `--accent-bg-color` | Secondary action. Fills on hover |
| `ghost` | `transparent` | `--button-fg-color` | none | Tertiary / toolbar. BG appears on hover |
| `destructive` | `--error-bg-color` | `--error-fg-color` | `--btn-border-width` `--btn-border-style` `--error-bg-color` | Dangerous action. WIN95: neutral bg + colored text |

### State behavior

| State | Visual change |
| :--- | :--- |
| `:hover` | Shift to `--accent-hover-color` (solid), fill bg (outline), subtle bg (ghost) |
| `:active` | Shift to `--accent-active-color`, scale `0.98` for GTK4, `inset` border for WIN95 |
| `:focus-visible` | Focus ring: `--focus-ring-width` solid `--focus-ring-color`, offset `--focus-ring-offset` |
| `:disabled` | `--button-disabled-bg-color`, `--button-disabled-fg-color`, `opacity: 0.6`, `cursor: not-allowed` |
| `[pressed]` | Same as `:active` visual but persistent. Toggle icon swap if configured |

### WIN95-specific behavior

- `border-style: outset` in default, `inset` on `:active` and `[pressed]` — classic 3D push effect.
- `border-radius: 0` on all sizes.
- `transition: none` — instant feedback like the original.
- Destructive variant uses neutral bg (`--button-bg-color`) with colored text (`--error-fg-color`).

### GTK4-specific behavior

- Smooth `border-radius` per size.
- `transition: all 150ms ease-in-out` on all state changes.
- Subtle `scale(0.98)` on `:active` for press feedback.

---

## Button-specific theme variables

These variables are added to each theme file alongside the existing theme variables:

```css
/* GTK4 themes */
[data-theme="gtk4-light"],
[data-theme="gtk4-dark"] {
  --btn-border-radius-tiny: 4px;
  --btn-border-radius-small: 5px;
  --btn-border-radius-medium: 6px;
  --btn-border-radius-large: 8px;
  --btn-border-radius-giant: 10px;
  --btn-border-width: 1px;
  --btn-border-style: solid;
  --btn-focus-ring-width: 2px;
  --btn-focus-ring-offset: 2px;
  --btn-transition: all 150ms ease-in-out;
}

/* WIN95 themes */
[data-theme="win95-light"],
[data-theme="win95-dark"] {
  --btn-border-radius-tiny: 0px;
  --btn-border-radius-small: 0px;
  --btn-border-radius-medium: 0px;
  --btn-border-radius-large: 0px;
  --btn-border-radius-giant: 0px;
  --btn-border-width: 2px;
  --btn-border-style: outset;
  --btn-focus-ring-width: 1px;
  --btn-focus-ring-offset: -4px;
  --btn-transition: none;
}
```

---

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/ds-button.ts` | create | Web Component class + Shadow DOM template |
| `src/components/ds-button.css` | create | Component styles (imported into Shadow DOM) |
| `src/themes/gtk4-light.css` | modify | Add `--btn-*` variables |
| `src/themes/gtk4-dark.css` | modify | Add `--btn-*` variables |
| `src/themes/win95-light.css` | modify | Add `--btn-*` variables |
| `src/themes/win95-dark.css` | modify | Add `--btn-*` variables |
| `src/demos/buttons.ts` | create | Demo page showing all variants, sizes, states, toggle |
| `src/main.ts` | modify | Register buttons demo in the router |

---

## Demo page spec

The buttons demo page (`#buttons`) should display:

1. **Variants grid** — All 4 variants (solid, outline, ghost, destructive) in medium size
2. **Sizes grid** — All 5 sizes in solid variant
3. **States showcase** — Default, hover (simulated), focus, active, disabled for each variant
4. **Icons** — Buttons with left icon, right icon, both icons
5. **Toggle buttons** — Toggle on/off with icon swap
6. **Theme comparison** — All of the above visible while switching themes via the header selector

---

## Discarded alternatives

- **CSS-only component (no JS):** Discarded because toggle mode, icon swapping, and custom events require JavaScript logic.
- **Lit / Stencil:** Discarded to keep zero dependencies per requirement. Vanilla `customElements` is sufficient for this scope.
- **Class-based API (new DsButton()):** Discarded in favor of declarative HTML attributes, which are more natural for framework integration and HTML authoring.
- **Global styles instead of Shadow DOM:** Discarded because the requirement asks for style encapsulation and framework-friendliness. Shadow DOM ensures the button works identically regardless of the host application's CSS.
