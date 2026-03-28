# Design: menu_item_component

## Technical decisions

### Arquitectura: Clase pura JS (como UIToolButton, UIPanel)
UIMenuItem es una clase JS pura que crea un `<div>` internamente. No es un web component. Usa composicion con UIView para layout engine y theme sync cuando se necesite integracion con el sistema de layout.

**Justificacion**: El menu item vive dentro de otros componentes (menu bar, context menu, dropdown). Necesita ser ligero, estilizable desde el padre, y no requiere Shadow DOM. Sigue el patron de UIToolButton y UIPanel.

### Layout: 3 zonas con CSS flexbox

```
┌──────────────────────────────────────────────┐
│ [left-slot] │    center-slot     │ [right-slot] │
│  (fijo)     │  (flex: 1, texto)  │  (opcional)  │
└──────────────────────────────────────────────┘
```

- **left-slot**: ancho fijo, siempre presente, centrado vertical y horizontal. Contiene un solo elemento que puede cambiar segun estado (ej: check icon cuando pushed).
- **center-slot**: `flex: 1`, texto con `text-overflow: ellipsis`. Puede contener un label + opcionalmente un elemento extra (boton, edit). Alineacion configurable (left/center/right).
- **right-slot**: ancho fijo, solo visible si tiene contenido. Un solo elemento, centrado.

### Tamaños

| Size   | Height | Left/Right slot width | Font size |
|--------|--------|-----------------------|-----------|
| small  | 24px   | 24px                  | --font-size-sm |
| medium | 32px   | 32px                  | --font-size-md |
| large  | 40px   | 40px                  | --font-size-md |

### Hint automatico por truncado
Se usa `ResizeObserver` + comparacion `scrollWidth > clientWidth` para detectar truncado del texto central. Cuando esta truncado, se muestra UIHint con el texto completo. Cuando deja de truncarse, se remueve.

### Estado pushed (toggle)
Cuando `pushable: true`, cada click alterna el estado `pushed`. En el slot izquierdo, el contenido cambia segun el estado:
- **pushed = false**: muestra `leftElement` (o vacio si no hay)
- **pushed = true**: muestra `pushedElement` (ej: icono check) o aplica clase `.ui-menuitem--pushed`

El pushed state se emite via evento `pushed-change` con el nuevo valor.

### Hover y Click
- Hover: toda la fila hace highlight (cambio de background)
- Click: NO hay efecto down/active. Solo emite `click` y alterna `pushed` si aplica
- El hover se aplica con `:hover` CSS, sin efecto `:active`

### Temas
- **GTK4 Light/Dark**: hover con background sutil, border-radius, pushed icon con accent color
- **WIN95 Light/Dark**: hover con highlight azul (#000080) y texto blanco, sin border-radius, pushed icon monocromo

## Interfaces

```typescript
export const MenuItemSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const
export type MenuItemSize = typeof MenuItemSize[keyof typeof MenuItemSize]

export const MenuItemTextAlign = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const
export type MenuItemTextAlign = typeof MenuItemTextAlign[keyof typeof MenuItemTextAlign]

export interface UIMenuItemOptions {
  /** Texto principal del menu item */
  text: string

  /** Tamaño: small (24px), medium (32px), large (40px). Default: medium */
  size?: MenuItemSize

  /** Alineacion del texto central. Default: left */
  textAlign?: MenuItemTextAlign

  /** Elemento para el slot izquierdo (siempre visible) */
  leftElement?: HTMLElement | null

  /** Elemento para el slot derecho (visible solo si se provee) */
  rightElement?: HTMLElement | null

  /** Elemento extra en la zona central (ademas del label) */
  centerElement?: HTMLElement | null

  /** Habilita toggle state con click. Default: false */
  pushable?: boolean

  /** Elemento que reemplaza leftElement cuando pushed=true */
  pushedElement?: HTMLElement | null

  /** Estado pushed inicial. Default: false */
  pushed?: boolean

  /** Deshabilitado. Default: false */
  disabled?: boolean

  /** Clase CSS adicional */
  className?: string
}
```

### API publica

```typescript
export class UIMenuItem {
  constructor(options: UIMenuItemOptions)

  /** Elemento DOM raiz */
  get element(): HTMLDivElement

  /** Texto del menu item */
  get text(): string
  set text(value: string)

  /** Estado pushed (solo si pushable=true) */
  get pushed(): boolean
  set pushed(value: boolean)

  /** Habilitado/deshabilitado */
  get disabled(): boolean
  set disabled(value: boolean)

  /** Reemplazar elemento del slot izquierdo */
  set leftElement(el: HTMLElement | null)

  /** Reemplazar elemento del slot derecho */
  set rightElement(el: HTMLElement | null)

  /** Reemplazar elemento extra del centro */
  set centerElement(el: HTMLElement | null)

  /** Registrar handler de click */
  onClick(handler: () => void): void

  /** Registrar handler de cambio de pushed */
  onPushedChange(handler: (pushed: boolean) => void): void

  /** Limpieza */
  destroy(): void
}
```

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/types.ts` | modify | Agregar MenuItemSize, MenuItemTextAlign |
| `src/components/ui-menu-item/ui-menu-item.ts` | create | Clase UIMenuItem |
| `src/components/ui-menu-item/ui-menu-item.css` | create | Estilos base + temas GTK4/WIN95 |
| `src/demos/menu-items.ts` | create | Demo page con variantes |
| `src/main.ts` | modify | Registrar ruta demo |

## Estructura DOM

```html
<div class="ui-menuitem ui-menuitem--medium">
  <div class="ui-menuitem__left">
    <!-- leftElement o pushedElement -->
  </div>
  <div class="ui-menuitem__center">
    <span class="ui-menuitem__text">Menu text</span>
    <!-- centerElement opcional -->
  </div>
  <div class="ui-menuitem__right">
    <!-- rightElement (div oculto si no hay contenido) -->
  </div>
</div>
```

## Discarded alternatives

### Web Component con Shadow DOM
Descartado porque el menu item vive dentro de otros componentes que necesitan controlarlo visualmente. Shadow DOM impediria que el padre aplique estilos (ej: highlight color del context menu). Ademas seria inconsistente con UIToolButton y UIPanel que usan el mismo patron de clase pura.

### Extender HTMLElement directamente
Descartado porque no necesita ser un custom element registrado. Los padres (menu bar, context menu) lo instancian programaticamente y controlan su ciclo de vida. No se usa en markup HTML directo.

### Usar UIView como base
Se evaluo usar UIView para layout engine, pero el menu item tiene un layout flexbox simple que no necesita el sistema de coordenadas absolutas de UIView. UIView se usara solo si el menu item necesita integrarse con el sistema de docking/anchors de un padre que use UIView.
