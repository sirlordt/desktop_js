# Design: popup_component

## Technical decisions

### Arquitectura: Clase JS pura con dos modos internos
UIPopup es una clase JS pura (como UIMenuItem, UIPanel). Internamente gestiona dos estados:
- **Modo popup (attached)**: contenedor flotante posicionado con anchor, similar a UIHint
- **Modo detached**: delega a UIWindow (kind=tool) subyugada al overlord via addTool

**Justificacion**: No hereda de UIWindow porque en modo popup no necesita titlebar, resize handles, z-ordering del WindowManager. Solo al desprender se crea un UIWindow real. Esto mantiene el popup ligero y evita la complejidad de UIWindow cuando no se necesita.

### Posicionamiento (modo popup)
Reutiliza la logica de posicionamiento de UIHint:
- Anchor element + alignment (BottomLeft, TopLeft, etc.)
- Auto-flip cuando no cabe en el viewport
- Margen configurable respecto al anchor

El popup se inserta en `document.body` como elemento `position: fixed` con `z-index` alto (igual que UIHint).

### Grip bar (detach handle)
Zona superior del popup, visible cuando `detachable: true`:
- Altura fija (~8px), cursor `grab`
- Al iniciar drag: se cancela el popup, se crea UIWindow tool con el mismo contenido
- La grip bar desaparece en modo detached (el titlebar de UIWindow la reemplaza)

### Ciclo de vida del detach

```
[popup cerrado] → show() → [popup attached visible]
                                 │
                         drag grip │
                                 ▼
                      [UIWindow tool creada]
                      (contenido movido al body de la window)
                      (addTool al overlord)
                                 │
                          close  │
                                 ▼
                      [UIWindow destruida]
                      (contenido regresa al popup element)
                      [popup cerrado - listo para reabrir como attached]
```

### Cierre automatico (modo popup)
- Click fuera del popup → close
- Evento `close` emitido por un child → close
- Tecla Escape → close
- El click-outside listener se registra en `document` con un frame de delay para evitar cerrar inmediatamente al abrir

### Scroll
Usa UIScrollBox cuando `scroll !== 'none'`. El ScrollBox envuelve el area de contenido.

### Arrange
- **vertical**: children se apilan con `flex-direction: column` (default, ideal para menus)
- **horizontal**: children en fila con `flex-direction: row`
- **none**: children en `position: relative` con `overflow: hidden` (clip). El usuario posiciona manualmente

### Resize
Cuando `resizable: true`, el popup muestra handles de resize en ambos modos:
- **Modo popup (attached)**: resize handles en los bordes (similar a UIWindow). Al redimensionar, el popup mantiene su anchor pero cambia width/height. El auto-flip se recalcula si el nuevo tamaño no cabe.
- **Modo detached**: UIWindow ya soporta resize nativamente, se hereda directo.

Por defecto `resizable: false`.

### Focus / Tab cycling
- **Modo popup (attached)**: ciclo cerrado de Tab entre children `[data-focusable]`. El popup maneja su propio keydown handler en document (capture phase), intercepta Tab/Shift+Tab en los limites (ultimo→primero, primero→ultimo). Identico al comportamiento de UIWindow.
- **Modo detached (tool)**: al hacer addTool al overlord, los children del popup (ahora en el body de la UIWindow tool) se integran automaticamente al ciclo de Tab del overlord + hermanas tools. El popup NO maneja Tab en este modo — lo delega a UIWindow/overlord.

### Interaccion por teclado (para uso como menu/listbox)
El popup emite eventos de navegacion que los children pueden escuchar:
- Arrow Up/Down en modo vertical → emite `navigate` con direccion
- Arrow Left/Right en modo horizontal → emite `navigate`
- Enter → emite `select` en el child activo
- Escape → close

El popup NO maneja la seleccion directamente — solo emite los eventos. El componente padre (menu, listbox) decide que hacer con ellos.

## Interfaces

```typescript
export const PopupArrange = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
  None: 'none',
} as const
export type PopupArrange = typeof PopupArrange[keyof typeof PopupArrange]

export interface UIPopupOptions {
  /** Elemento anchor para posicionamiento */
  anchor: HTMLElement

  /** Alineacion respecto al anchor (reutiliza HintAlignment) */
  alignment?: HintAlignment

  /** Margen respecto al anchor en px. Default: 4 */
  margin?: number

  /** Modo de scroll del contenido. Default: none */
  scroll?: ScrollMode

  /** Disposicion de los children. Default: vertical */
  arrange?: PopupArrange

  /** Ancho del popup. Default: auto (se adapta al contenido) */
  width?: number | 'auto'

  /** Alto del popup. Default: auto */
  height?: number | 'auto'

  /** Alto maximo antes de activar scroll. Default: 300 */
  maxHeight?: number

  /** Ancho maximo. Default: sin limite */
  maxWidth?: number

  /** Permite redimensionar el popup. Default: false */
  resizable?: boolean

  /** Permite desprender el popup como ventana tool. Default: false */
  detachable?: boolean

  /** Titulo de la ventana cuando esta detached */
  title?: string

  /** Referencia al WindowManager para modo detached */
  windowManager?: UIWindowManager | null

  /** Ventana overlord para addTool cuando se detacha */
  overlord?: UIWindow | null

  /** Cerrar al hacer click afuera. Default: true */
  closeOnClickOutside?: boolean

  /** Cerrar al presionar Escape. Default: true */
  closeOnEscape?: boolean

  /** Clase CSS adicional */
  className?: string
}
```

### API publica

```typescript
export class UIPopup {
  constructor(options: UIPopupOptions)

  /** Elemento DOM raiz (el popup container) */
  get element(): HTMLDivElement

  /** Estado actual: 'closed' | 'attached' | 'detached' */
  get state(): PopupState

  /** Muestra el popup anclado al anchor */
  show(): void

  /** Cierra el popup (o la ventana si esta detached) */
  close(): void

  /** Alterna show/close */
  toggle(): void

  /** Visible o no */
  get visible(): boolean

  /** Agrega un child al area de contenido */
  addChild(el: HTMLElement): void

  /** Remueve un child */
  removeChild(el: HTMLElement): void

  /** Remueve todos los children */
  clearChildren(): void

  /** Anchor element */
  get anchor(): HTMLElement
  set anchor(el: HTMLElement)

  /** Detachable */
  get detachable(): boolean
  set detachable(value: boolean)

  /** Title (para modo detached) */
  get title(): string
  set title(value: string)

  /** Scroll mode */
  get scroll(): ScrollMode
  set scroll(value: ScrollMode)

  /** Arrange mode */
  get arrange(): PopupArrange
  set arrange(value: PopupArrange)

  /** Reposiciona el popup respecto al anchor */
  reposition(): void

  /** Eventos */
  on(event: 'show' | 'close' | 'detach' | 'attach' | 'navigate' | 'select', handler: Function): void
  off(event: string, handler: Function): void

  /** Limpieza */
  destroy(): void
}
```

### Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `show` | — | Popup se muestra (modo attached) |
| `close` | — | Popup se cierra (cualquier modo) |
| `detach` | — | Popup se desprende y crea ventana tool |
| `attach` | — | Ventana tool se cierra, popup vuelve a modo attached |
| `navigate` | `{ direction: 'up' \| 'down' \| 'left' \| 'right' }` | Tecla de navegacion presionada |
| `select` | `{ index: number }` | Enter presionado en child activo |

## Estructura DOM

### Modo popup (attached)
```html
<div class="ui-popup ui-popup--vertical" style="position: fixed; z-index: 9998;">
  <div class="ui-popup__grip"></div>          <!-- visible si detachable -->
  <div class="ui-popup__content">
    <!-- children directos o UIScrollBox wrapper -->
  </div>
</div>
```

### Modo detached
```html
<!-- El popup element se oculta (display: none) -->
<!-- Se crea un UIWindow kind=tool -->
<div class="ui-window ui-window--tool">
  <div class="ui-window__titlebar">...</div>
  <div class="ui-window__body">
    <!-- children movidos aqui desde el popup -->
  </div>
</div>
```

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/types.ts` | modify | Agregar PopupArrange, PopupState, UIPopupOptions |
| `src/components/ui-popup/ui-popup.ts` | create | Clase UIPopup |
| `src/components/ui-popup/ui-popup.css` | create | Estilos base + temas GTK4/WIN95 |
| `src/demos/popups.ts` | create | Demo page con variantes |
| `src/main.ts` | modify | Registrar ruta demo |

## Discarded alternatives

### Heredar de UIWindow
Descartado porque UIWindow requiere WindowManager, tiene resize handles, minimize/maximize, focus trap, y mucha logica que no aplica en modo popup. El popup necesita ser un contenedor ligero que OPCIONALMENTE escale a UIWindow solo cuando se detacha.

### Heredar de UIHint
Descartado porque UIHint esta diseñado para mostrar texto/contenido pasivo. No tiene soporte para scroll, arrange, interaccion por teclado, ni detach. Seria mas refactoring que beneficio. Mejor reutilizar solo la logica de posicionamiento (importar las funciones de calculo).

### Hacer el popup un UIPanel flotante
Descartado porque UIPanel usa UIView con layout engine de coordenadas absolutas. El popup necesita flexbox para arrange vertical/horizontal y position: fixed para flotar. Son modelos incompatibles.
