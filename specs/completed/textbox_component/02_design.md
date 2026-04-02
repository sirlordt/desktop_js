# Design: textbox_component

## Technical decisions

### Canvas + hidden input (Flutter technique)

El componente usa una arquitectura de dos capas:

1. **`<canvas>`** — Renderiza todo lo visual: texto, cursor parpadeante, seleccion, placeholder. Esto da control pixel-perfect sobre el rendering y permite efectos custom sin limitaciones del DOM.

2. **`<textarea>` oculta (`opacity: 0`)** — Posicionada exactamente sobre el canvas, recibe toda la interaccion nativa del browser: focus, keyboard input, IME (input methods para chino/japones/coreano), menu contextual (copiar/pegar/cortar), autocomplete, y drag-and-drop de texto.

**Por que esta tecnica:**
- Flutter la usa porque un canvas no puede recibir texto del sistema operativo directamente. El textarea invisible actua como "receptor" nativo.
- Los menus contextuales (right-click → Copy/Paste) y los shortcuts del sistema (Ctrl+C, Ctrl+V) funcionan sin reimplementarlos.
- IME composition (caracteres parciales en idiomas asiaticos) funciona nativamente.
- Se mantiene accessibilidad: screen readers ven el textarea real.

**Flujo de datos:**
```
Usuario escribe → textarea captura el input → JS lee el valor → canvas re-renderiza
Usuario selecciona con mouse en canvas → JS calcula la posicion del caracter → actualiza selectionStart/End del textarea → canvas pinta la seleccion
```

### Shadow DOM

Usa Shadow DOM para encapsulacion de estilos. El canvas y el textarea viven dentro del shadow root.

### Sin UIView

Este es un componente lightweight como `UIHintWC` — no necesita el layout engine (`UIView`). Su tamanio es controlado directamente via atributos/opciones `width` y `height`.

### Registro como `<textbox-exp-wc>`

Siguiendo la convencion del proyecto: `<componente-wc>`.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  <textbox-exp-wc>  (Shadow DOM host)    │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  <canvas>                         │  │
│  │  - Renders: text, cursor,         │  │
│  │    selection highlight,           │  │
│  │    placeholder, border, bg        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  <textarea> (opacity: 0)          │  │
│  │  - Positioned over the canvas     │  │
│  │  - Receives: focus, key input,    │  │
│  │    IME, context menu, clipboard   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Canvas render pipeline

Cada re-render del canvas sigue este orden:

1. **Clear** — limpiar todo el canvas
2. **Background** — rellenar con `--input-bg-color`
3. **Selection highlight** — si hay seleccion, pintar rectangulos azules detras del texto
4. **Text** — renderizar el texto con `ctx.fillText()`, respetando scroll horizontal
5. **Cursor** — si tiene focus y no hay seleccion, pintar la linea del cursor (blink toggle)
6. **Placeholder** — si no hay texto y no tiene focus, pintar placeholder en gris
7. **Border** — pintar borde del textbox con `--input-border-color` o `--focus-ring-color` si focused

### Scroll horizontal

Cuando el texto excede el ancho visible, se implementa scroll horizontal:
- Se mantiene un `_scrollX` offset.
- El cursor siempre se mantiene visible — si el cursor sale del area visible, `_scrollX` se ajusta.
- El canvas renderiza con `ctx.translate(-_scrollX, 0)` + clipping.

### Cursor blink

- Un `setInterval` alterna `_cursorVisible` cada 530ms (standard blink rate).
- Se resetea a visible en cada input/movimiento de cursor.
- Se detiene cuando el componente pierde focus.

### Seleccion con mouse

- `mousedown` en canvas → calcular posicion del caracter via `ctx.measureText()`, setear `selectionStart`.
- `mousemove` (con boton presionado) → calcular posicion, setear `selectionEnd`.
- `mouseup` → finalizar seleccion.
- Sincronizar `textarea.selectionStart`/`selectionEnd` con los valores calculados.
- `dblclick` → seleccionar palabra completa.

### Sincronizacion canvas ↔ textarea

| Evento del textarea | Accion en canvas |
|---|---|
| `input` | Leer `textarea.value`, re-render texto |
| `selectionchange` | Leer `selectionStart/End`, re-render cursor/seleccion |
| `focus` | Iniciar cursor blink, pintar borde focus |
| `blur` | Detener blink, quitar borde focus |
| `compositionstart/update/end` | Renderizar texto de composicion IME con subrayado |

| Evento en canvas | Accion en textarea |
|---|---|
| `mousedown` | Calcular posicion, setear `selectionStart` |
| `mousemove` (drag) | Calcular posicion, setear `selectionEnd` |
| `dblclick` | Calcular limites de palabra, setear seleccion |

---

## Interfaces

```typescript
export interface UITextBoxExpOptions {
  /** Initial text value */
  value?: string
  /** Placeholder text shown when empty and unfocused */
  placeholder?: string
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Font family */
  fontFamily?: string
  /** Font size in pixels */
  fontSize?: number
  /** Disabled state — no interaction */
  disabled?: boolean
  /** Read-only state — selectable but not editable */
  readonly?: boolean
  /** Maximum character count */
  maxLength?: number
  /** CSS class to add to host */
  className?: string
}
```

### Attributes (reflected as HTML attributes)

```typescript
const TEXTBOX_ATTRS = [
  'value', 'placeholder', 'width', 'height',
  'font-family', 'font-size',
  'disabled', 'readonly', 'max-length',
] as const
```

### Public API

```typescript
export class UITextBoxExpWC extends HTMLElement {
  // ── Properties ──
  value: string              // get/set the text content
  placeholder: string        // get/set placeholder
  disabled: boolean          // get/set disabled state
  readonly: boolean          // get/set readonly state
  maxLength: number          // get/set max characters (-1 = unlimited)

  selectionStart: number     // get/set cursor start position
  selectionEnd: number       // get/set cursor end position
  selectedText: string       // get selected text (readonly)

  // ── Methods ──
  configure(options: UITextBoxExpOptions): void
  focus(): void              // focus the textbox
  blur(): void               // blur the textbox
  selectAll(): void          // select all text
  destroy(): void            // cleanup

  // ── Events (CustomEvent) ──
  // 'input'     — fired on every text change, detail: { value: string }
  // 'change'    — fired on blur if value changed since focus, detail: { value: string }
  // 'focus'     — fired when focused
  // 'blur'      — fired when blurred
  // 'select'    — fired when selection changes, detail: { start: number, end: number }
}
```

### Usage examples

```typescript
// Programmatic
const textbox = new UITextBoxExpWC({
  value: 'Hello',
  placeholder: 'Type here...',
  width: 250,
  height: 28,
  fontSize: 14,
})
container.appendChild(textbox)

textbox.addEventListener('input', (e) => {
  console.log('Value:', (e as CustomEvent).detail.value)
})
```

```html
<!-- Declarative -->
<textbox-exp-wc
  placeholder="Enter your name"
  width="200"
  height="28"
  font-size="14"
></textbox-exp-wc>
```

---

## Component internal structure

### Shadow DOM template

```html
<style>/* imported from ui-textbox-exp.css */</style>
<div class="container">
  <canvas class="render-canvas"></canvas>
  <textarea class="hidden-input"></textarea>
</div>
```

### CSS (shadow)

```css
:host {
  display: inline-block;
  position: relative;
  box-sizing: border-box;
}

.container {
  position: relative;
  width: 100%;
  height: 100%;
}

.render-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.hidden-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  font: inherit;
  cursor: text;
  /* Ensure it receives all native events */
  pointer-events: auto;
}

:host([disabled]) .hidden-input {
  pointer-events: none;
  cursor: default;
}
```

---

## Canvas rendering details

### Theme integration

El canvas lee CSS custom properties del host element para los colores:

| Variable | Usage |
|---|---|
| `--input-bg-color` | Canvas background fill |
| `--input-border-color` | Border when unfocused |
| `--focus-ring-color` | Border when focused |
| `--view-fg-color` | Text color |
| `--input-placeholder-color` **(new)** | Placeholder text color. Fallback: `--view-fg-color` at 50% opacity |
| `--selection-bg-color` **(new)** | Selection highlight. Fallback: `rgba(53, 132, 228, 0.3)` |
| `--font-family` | Font family |
| `--font-size-sm` | Default font size |

Los colores se leen via `getComputedStyle(this)` al inicio del render y se cachean hasta el proximo render.

### Measuring text positions

Para convertir coordenadas de mouse a posicion de caracter:

```typescript
_charPositionFromX(x: number): number {
  const text = this._value
  let pos = 0
  for (let i = 0; i <= text.length; i++) {
    const w = ctx.measureText(text.substring(0, i)).width
    if (w + padding - scrollX >= x) return i
    pos = i
  }
  return pos
}
```

Para obtener la coordenada X de una posicion de caracter:

```typescript
_xFromCharPosition(pos: number): number {
  return ctx.measureText(this._value.substring(0, pos)).width + padding - scrollX
}
```

### HiDPI / Retina support

El canvas debe usar `devicePixelRatio` para rendering nitido:

```typescript
const dpr = window.devicePixelRatio || 1
canvas.width = width * dpr
canvas.height = height * dpr
canvas.style.width = `${width}px`
canvas.style.height = `${height}px`
ctx.scale(dpr, dpr)
```

---

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui-textbox-exp/ui-textbox-exp.ts` | create | Web Component class |
| `src/components/ui-textbox-exp/ui-textbox-exp.css` | create | Shadow DOM styles |
| `src/components/common/types.ts` | modify | Add `UITextBoxExpOptions` interface |
| `src/demos/textbox-exp.ts` | create | Demo page (`DemoRoute` con `render` + `setup`) |
| `src/main.ts` | modify | Import `textboxExpDemo` y agregar a `registerDemos([...])` |
| `src/style.css` | modify | Add `--input-placeholder-color`, `--selection-bg-color` to theme variables |
| `src/components/__tests__/textbox-exp.test.ts` | create | Unit tests |

---

## Demo page spec

La demo sigue el patron `DemoRoute` del proyecto (`src/header.ts`):

```typescript
export const textboxExpDemo: DemoRoute = {
  id: 'textbox-exp',       // hash route: #textbox-exp
  label: 'TextBox Exp',    // navigation tab label
  render: () => `...`,     // returns HTML string with containers
  setup: () => { ... },    // creates UITextBoxExpWC instances programmatically
}
```

Registrada en `src/main.ts` via `registerDemos([..., textboxExpDemo])`.

### Layout de la demo (`#textbox-exp`)

Toolbar con botones de accion + area principal con los textboxes:

```html
<div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
  <!-- Toolbar -->
  <div style="padding:8px 16px;display:flex;gap:6px;align-items:center;flex-shrink:0;">
    <ui-button id="tbx-clear-log" size="small" variant="outline">Clear Log</ui-button>
    <ui-button id="tbx-select-all" size="small" variant="outline">Select All (first)</ui-button>
    <ui-button id="tbx-set-value" size="small" variant="outline">Set Value</ui-button>
    <ui-button id="tbx-toggle-disabled" size="small" variant="warning">Toggle Disabled</ui-button>
  </div>
  <!-- Content -->
  <div id="tbx-container" style="flex:1;padding:16px;overflow:auto;display:flex;flex-direction:column;gap:24px;">
    <div id="tbx-demos"></div>
    <div id="tbx-log" style="..."></div>
  </div>
</div>
```

### Secciones de la demo

En `setup()`, se crean programaticamente los siguientes textboxes:

1. **Basic** — `new UITextBoxExpWC({ placeholder: 'Type here...', width: 250, height: 28 })`
2. **Pre-filled** — `new UITextBoxExpWC({ value: 'Hello World', width: 250, height: 28 })`
3. **Disabled** — `new UITextBoxExpWC({ value: 'Cannot edit', disabled: true, width: 250, height: 28 })`
4. **Read-only** — `new UITextBoxExpWC({ value: 'Select me', readonly: true, width: 250, height: 28 })`
5. **Max length (10)** — `new UITextBoxExpWC({ placeholder: 'Max 10 chars', maxLength: 10, width: 250, height: 28 })`
6. **Large** — `new UITextBoxExpWC({ placeholder: 'Bigger box', width: 400, height: 36, fontSize: 18 })`
7. **Event log** — panel que muestra en tiempo real los eventos `input`, `change`, `focus`, `blur`, `select` de todos los textboxes

---

## Discarded alternatives

- **Usar `<input type="text">` estilizado:** Descartado porque el requisito pide explicitamente canvas rendering para experimentar con la tecnica de Flutter. Un input nativo no permite control pixel-perfect del cursor ni de la seleccion.
- **Usar un `<div contenteditable>`:** Descartado porque contenteditable tiene comportamientos inconsistentes entre browsers y es dificil de controlar. El textarea oculto es mas predecible.
- **Canvas sin textarea oculto:** Descartado porque se perderia toda la integracion nativa: menus contextuales, IME, clipboard, autocorrect, accesibilidad.
- **WebGL en vez de Canvas 2D:** Overkill para un textbox. Canvas 2D es suficiente y mas simple.
- **Multiline desde el inicio:** Descartado para mantener el scope experimental pequeno. Se puede extender a multiline en una iteracion futura si la tecnica funciona bien.
