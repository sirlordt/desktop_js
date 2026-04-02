# Design: textbox_component_wc

## Technical decisions

### Input nativo como nucleo

A diferencia de `UITextBoxExpWC` (canvas), este componente usa un **`<input>` nativo real** como nucleo. Esto garantiza:
- Compatibilidad total con frameworks (React, Vue, Svelte, Angular, Solid) — el input nativo maneja `value`, eventos, formularios, y two-way binding sin wrappers especiales.
- Accesibilidad (screen readers, autocomplete, IME, context menu) sin reimplementacion.
- Comportamiento predecible en todos los browsers.

### Shadow DOM con slots

Usa Shadow DOM para encapsulacion de estilos. Expone **3 named slots** para contenido custom:

- `slot="start"` — elementos a la izquierda del input (iconos, botones, prefijos)
- `slot="end"` — elementos a la derecha del input (iconos, botones, suffixes, clear button)
- `slot="helper"` — texto de ayuda debajo del input

Los slots se adaptan automaticamente al contenido via `flex` layout. Si un slot esta vacio, no ocupa espacio.

### Variantes visuales (inspiradas en Flowbite/Material)

4 variantes controladas por el atributo `variant`:

| Variant | Descripcion | Label behavior |
|---------|------------|----------------|
| `outlined` | Borde completo, label flota sobre el borde al focus/lleno | Floating label que "corta" el borde superior |
| `filled` | Fondo solido, borde inferior, label flota arriba | Floating label que sube dentro del fondo |
| `standard` | Solo linea inferior, minimal | Floating label que sube sobre la linea |
| `fixed` | Borde completo, label fija arriba (no flota) | Label siempre visible arriba, no animada |

### Animacion floating label — CSS puro

La animacion del floating label se implementa 100% en CSS:
- El `<label>` se posiciona absolute dentro del contenedor.
- Cuando el input esta vacio y sin focus, el label esta centrado verticalmente (actua como placeholder visual).
- Cuando el input tiene focus o tiene valor, el label se mueve arriba via `transform: translateY() scale()`.
- Transition suave con `transition: transform 150ms, font-size 150ms`.
- Se usa una clase `.has-value` (toggled via JS) y `:focus-within` para activar la transicion.

Para la variante `outlined`, el label "corta" el borde usando un `<fieldset>` + `<legend>` pattern (como Material Design), o alternativamente un `background-color` match en el label para cubrir el borde.

### Adaptacion a slots start/end

El input container usa `display: flex; align-items: center`:

```
┌──────────────────────────────────────────┐
│ [slot:start] [    input    ] [slot:end]  │
│              [floating label]            │
└──────────────────────────────────────────┘
  [slot:helper — texto debajo]
```

- Los slots `start` y `end` son `flex-shrink: 0` — nunca se comprimen.
- El input es `flex: 1` — ocupa todo el espacio restante.
- Los slots aceptan **cualquier elemento**: `<ui-button>`, `<svg>`, `<img>`, `<span>`, etc.
- Slot styling via `::slotted(*)` para alignment basico, pero el contenido mantiene su propio styling.

### Nombre: `<textbox-wc>`

Sigue la convencion del proyecto.

### Sin UIView

Componente lightweight — controla su propio sizing directamente.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  <textbox-wc>  (Shadow DOM host)                │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  .input-wrapper (flex container)          │  │
│  │                                           │  │
│  │  ┌─────┐ ┌─────────────────┐ ┌─────┐     │  │
│  │  │slot │ │  <input>        │ │slot │     │  │
│  │  │start│ │                 │ │ end │     │  │
│  │  └─────┘ └─────────────────┘ └─────┘     │  │
│  │                                           │  │
│  │  <label class="floating-label">           │  │
│  │    (positioned absolute, animates up)     │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  <div class="helper-text">                      │
│    <slot name="helper"></slot>                   │
│  </div>                                         │
└─────────────────────────────────────────────────┘
```

### Floating label states

```
UNFOCUSED + EMPTY:         FOCUSED or HAS VALUE:
┌──────────────────┐       ┌──────────────────┐
│                  │       │ Label (small)     │
│  Label (normal)  │  →    │ ┌──────────────┐ │
│  |               │       │ │ typed text|  │ │
│                  │       │ └──────────────┘ │
└──────────────────┘       └──────────────────┘
```

### Outlined variant — fieldset/legend technique

```html
<div class="input-wrapper outlined">
  <fieldset>
    <legend><span>Label text</span></legend>
  </fieldset>
  <slot name="start"></slot>
  <input />
  <slot name="end"></slot>
  <label>Label text</label>
</div>
```

La `<fieldset>` + `<legend>` crea el "notch" (corte) en el borde superior donde flota el label. El `<legend>` es invisible (`height: 0; overflow: hidden`) pero su ancho expande para crear la abertura. El `<label>` visible se posiciona absolute sobre el notch.

---

## Interfaces

```typescript
export type TextBoxVariant = 'outlined' | 'filled' | 'standard' | 'fixed'
export type TextBoxSize = 'small' | 'medium' | 'large'
export type TextBoxValidation = 'none' | 'success' | 'error'

export interface UITextBoxWCOptions {
  /** Visual variant */
  variant?: TextBoxVariant          // default: 'outlined'
  /** Size preset */
  size?: TextBoxSize                // default: 'medium'
  /** Label text (floating or fixed depending on variant) */
  label?: string
  /** Placeholder text (shown when label is floating and input is focused+empty) */
  placeholder?: string
  /** Initial value */
  value?: string
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  /** Disabled state */
  disabled?: boolean
  /** Read-only state */
  readonly?: boolean
  /** Maximum character count */
  maxLength?: number
  /** Pattern for validation (HTML5 pattern attribute) */
  pattern?: string
  /** Required field */
  required?: boolean
  /** Validation state */
  validation?: TextBoxValidation
  /** Helper text below the input */
  helperText?: string
  /** Show clear button when input has value */
  clearable?: boolean
  /** Width in pixels or CSS value */
  width?: number | string
  /** Name attribute for form submission */
  name?: string
  /** Autocomplete attribute */
  autocomplete?: string
}
```

### Attributes (reflected as HTML attributes)

```typescript
const TEXTBOX_WC_ATTRS = [
  'variant', 'size', 'label', 'placeholder', 'value', 'type',
  'disabled', 'readonly', 'max-length', 'pattern', 'required',
  'validation', 'helper-text', 'clearable', 'width', 'name',
  'autocomplete',
] as const
```

### Public API

```typescript
export class UITextBoxWC extends HTMLElement {
  // ── Properties ──
  value: string
  label: string
  placeholder: string
  variant: TextBoxVariant
  size: TextBoxSize
  type: string
  disabled: boolean
  readonly: boolean
  maxLength: number
  required: boolean
  validation: TextBoxValidation
  helperText: string
  clearable: boolean
  name: string

  // ── Read-only ──
  readonly inputElement: HTMLInputElement   // direct access to inner input
  readonly isDestroyed: boolean

  // ── Methods ──
  configure(options: UITextBoxWCOptions): void
  focus(): void
  blur(): void
  select(): void           // select all text
  clear(): void            // clear value + fire events
  destroy(): void

  // ── Events (CustomEvent) ──
  // 'input'     — every keystroke, detail: { value: string }
  // 'change'    — on blur if value changed, detail: { value: string }
  // 'focus'     — focused
  // 'blur'      — blurred
  // 'clear'     — clear button clicked, detail: { previousValue: string }
  // 'keydown'   — key pressed, detail: native KeyboardEvent
}
```

### Usage examples

```typescript
// Programmatic — outlined with left icon
const tb = new UITextBoxWC({
  variant: 'outlined',
  label: 'Search',
  clearable: true,
  width: 300,
})
const icon = document.createElement('span')
icon.textContent = '🔍'
icon.slot = 'start'
tb.appendChild(icon)
container.appendChild(tb)
```

```html
<!-- Declarative — filled with button on right -->
<textbox-wc variant="filled" label="Email" type="email" clearable>
  <svg slot="start" width="16" height="16">...</svg>
  <ui-button slot="end" size="tiny" variant="ghost">Send</ui-button>
</textbox-wc>

<!-- Outlined with validation -->
<textbox-wc variant="outlined" label="Username" required validation="error"
            helper-text="Username is already taken">
</textbox-wc>

<!-- Fixed label with start/end content -->
<textbox-wc variant="fixed" label="Price" type="number">
  <span slot="start" style="padding:0 4px;color:var(--view-fg-color);">$</span>
  <span slot="end" style="padding:0 4px;color:var(--view-fg-color);">.00</span>
</textbox-wc>

<!-- Standard minimal -->
<textbox-wc variant="standard" label="Name"></textbox-wc>
```

---

## Shadow DOM template

```html
<style>/* imported from ui-textbox-wc.css */</style>

<div class="textbox" part="container">
  <!-- For outlined variant: fieldset creates the notch -->
  <fieldset class="outline-border">
    <legend><span class="notch-label"></span></legend>
  </fieldset>

  <div class="input-wrapper">
    <slot name="start"></slot>
    <div class="input-area">
      <input part="input" />
      <label class="floating-label" part="label"></label>
    </div>
    <slot name="end"></slot>
  </div>

  <div class="helper" part="helper">
    <slot name="helper"><span class="helper-text"></span></slot>
  </div>
</div>
```

---

## Sizing

| Size | Height | Font Size | Label floated size | Padding |
|------|--------|-----------|-------------------|---------|
| `small` | 36px | 13px | 11px | 8px 10px |
| `medium` | 42px | 14px | 12px | 10px 12px |
| `large` | 50px | 16px | 12px | 12px 14px |

---

## Theme integration

### CSS custom properties (existing + new)

Existentes:
- `--input-bg-color`, `--input-fg-color`, `--input-border-color`
- `--input-focus-border-color`, `--input-placeholder-color`

Nuevas (a agregar en themes):

| Variable | Purpose |
|----------|---------|
| `--input-label-color` | Label text color (unfocused) |
| `--input-label-focus-color` | Label text color (focused) |
| `--input-filled-bg-color` | Background for filled variant |
| `--input-success-color` | Border/label for validation=success |
| `--input-error-color` | Border/label for validation=error |
| `--input-disabled-opacity` | Opacity when disabled (0.5) |
| `--input-border-radius` | Border radius (theme-specific) |
| `--input-transition` | Transition timing |

### WIN95-specific

- `--input-border-radius: 0` (no rounded corners)
- `--input-transition: none` (instant, no animations)
- 3D inset border effect using `--btn-3d-dark` / `--btn-3d-light` vars
- Floating label still works but without animation in win95

### GTK4-specific

- `--input-border-radius: 6px`
- `--input-transition: all 150ms ease`
- Smooth label float animation

---

## Variant CSS details

### Outlined
```css
.textbox.outlined .outline-border {
  position: absolute; inset: 0;
  border: 1px solid var(--input-border-color);
  border-radius: var(--input-border-radius);
  pointer-events: none;
}
.textbox.outlined.focused .outline-border {
  border-color: var(--input-focus-border-color);
  border-width: 2px;
}
.textbox.outlined .outline-border legend {
  height: 0; overflow: hidden;
  padding: 0; margin-left: 8px;
  /* width is animated to match label width */
}
.textbox.outlined.floated .outline-border legend {
  padding: 0 4px;
  max-width: 100%; /* opens the notch */
}
```

### Filled
```css
.textbox.filled {
  background: var(--input-filled-bg-color);
  border-radius: var(--input-border-radius) var(--input-border-radius) 0 0;
  border-bottom: 1px solid var(--input-border-color);
}
.textbox.filled.focused {
  border-bottom: 2px solid var(--input-focus-border-color);
}
```

### Standard
```css
.textbox.standard {
  background: transparent;
  border-bottom: 1px solid var(--input-border-color);
}
.textbox.standard.focused {
  border-bottom: 2px solid var(--input-focus-border-color);
}
```

### Fixed
```css
.textbox.fixed .floating-label {
  position: static;
  transform: none;
  margin-bottom: 4px;
  font-size: 13px;
}
```

---

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui-textbox-wc/ui-textbox-wc.ts` | create | Web Component class |
| `src/components/ui-textbox-wc/ui-textbox-wc.css` | create | Shadow DOM styles (variants, sizes, states, themes) |
| `src/components/common/types.ts` | modify | Add `TextBoxVariant`, `TextBoxSize`, `TextBoxValidation`, `UITextBoxWCOptions` |
| `src/themes/gtk4-light.css` | modify | Add `--input-label-*`, `--input-filled-bg-*`, etc. |
| `src/themes/gtk4-dark.css` | modify | Idem |
| `src/themes/win95-light.css` | modify | Idem (sin border-radius, sin transition) |
| `src/themes/win95-dark.css` | modify | Idem |
| `src/demos/textbox-wc.ts` | create | Demo page con DemoRoute |
| `src/main.ts` | modify | Registrar `textboxWCDemo` |
| `src/components/__tests__/textbox-wc.test.ts` | create | Tests extensivos |

---

## Demo page spec

DemoRoute: `{ id: 'textbox-wc', label: 'TextBox WC', render, setup }`

### Secciones en `setup()`:

1. **Variants showcase** — Las 4 variantes lado a lado (outlined, filled, standard, fixed)
2. **Sizes** — small, medium, large en variante outlined
3. **With icons** — textbox con icono a la izquierda, boton a la derecha
4. **Clearable** — textbox con boton clear
5. **Validation states** — success, error con helper text
6. **Disabled / Readonly** — ambos estados
7. **Password con toggle** — type=password con boton ojo en slot end
8. **Inside UIWindowWC** — textbox dentro de una ventana del window manager, demostrando integracion
9. **Form demo** — multiples textboxes simulando un formulario (nombre, email, password, etc.)
10. **Event log** — panel lateral mostrando eventos en tiempo real

---

## Discarded alternatives

- **Canvas-based rendering:** Ya implementado como `UITextBoxExpWC`. Este componente usa input nativo para maxima compatibilidad con frameworks y formularios.
- **Usar `<input>` directo con CSS global:** Descartado porque no encapsula estilos y rompe con el patron del proyecto (Shadow DOM).
- **`contenteditable` div:** Descartado por inconsistencias cross-browser y dificultad de control.
- **Implementar notch con `clip-path`:** Descartado en favor de `fieldset/legend` que es la tecnica probada de Material Design y funciona sin calculo JS del ancho del label.
- **Un solo componente combinando canvas y input nativo:** Descartado para mantener separacion clara. El experimental (canvas) y el de produccion (input nativo) tienen propositos distintos.
