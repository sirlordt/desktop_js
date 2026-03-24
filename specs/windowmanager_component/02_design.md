# Design: WindowManager Component

## Technical decisions

### Two components: UIWindowManager + IUIWindow

The system is split into two parts:

1. **UIWindowManager** — The container that manages children. It handles z-ordering, minimize/restore state, close operations, and drag notifications. It is **agnostic** about what its children are — any element that implements the `IWindowChild` interface can be managed.

2. **IUIWindow** — A concrete window implementation for testing and general use. Has a titlebar with title, close/minimize/maximize buttons, resizable body, and drag support. This is a consumer of UIWindowManager, not a dependency.

### Message-based communication (child → parent)

Children don't manipulate themselves. They request actions from their parent manager:

```
Child calls:        → Manager handles:
bringToFront()      → reorders z-index of all children
requestClose()      → removes child, emits 'window-close' event
requestMinimize()   → hides child, emits 'window-minimize' event
requestRestore()    → shows child, emits 'window-restore' event
```

This pattern is critical because the manager owns the z-ordering state. If children moved themselves, z-indexes would go out of sync.

### Z-ordering via CSS z-index

Each managed child gets a `z-index` value. When a child is brought to front, the manager reassigns z-indexes to all children in order. Children with `align !== 'none'` (docked panels) are excluded from z-reordering — they stay in their layout position.

### UIWindowManager extends UIPanel

UIWindowManager is a UIPanel (standalone `<div>`, uses UIView core) with added window management logic. It inherits:
- Layout engine (align, anchors, dimensions) for docked children
- Hierarchy management (parent/children)
- Theme sync, cleanup, event emitter

### IUIWindow uses UIPanel + UIToolButton

IUIWindow is built with:
- UIPanel for the root container and titlebar
- UIToolButton for close, minimize, maximize buttons (with theme-appropriate icons)
- Plain DOM for the content area
- Drag via mousedown on titlebar → mousemove on document

### Standalone components (no Shadow DOM)

Both UIWindowManager and IUIWindow are plain DOM — no web components, no Shadow DOM. This allows the window manager to directly control z-index and styles on its children.

## Architecture

```
UIWindowManager (extends UIPanel)
├── Manages z-ordering of children
├── Tracks minimize/restore state per child
├── Emits: 'window-focus', 'window-close', 'window-minimize',
│          'window-restore', 'window-drag'
├── Methods: bringToFront(), closeChild(), minimizeChild(),
│            restoreChild(), minimizeAll(), restoreAll(), closeAll(),
│            getState(), getMinimized()
│
├── [Docked children] — align=top/bottom/left/right (not z-reordered)
│   └── e.g. taskbar, toolbar
│
└── [Floating children] — align=none (z-reordered on click)
    └── e.g. IUIWindow instances

IUIWindow (standalone class)
├── UIPanel (root, position: absolute, draggable)
│   ├── UIPanel (titlebar, align: top, height: ~28px)
│   │   ├── <span> title text
│   │   ├── UIToolButton (minimize)
│   │   ├── UIToolButton (maximize/restore)
│   │   └── UIToolButton (close)
│   └── UIPanel (body, align: client)
│       └── contentElement (user content goes here)
├── Drag: mousedown on titlebar → updates left/top
├── Resize: mousedown on edges/corners → updates width/height (optional)
└── Communicates with manager via IWindowChild interface
```

## Interfaces

```typescript
// ── Window child state ──

type WindowChildState = 'normal' | 'minimized' | 'maximized'

interface WindowChildInfo {
  id: string
  state: WindowChildState
  zIndex: number
  left: number
  top: number
  width: number
  height: number
}

// ── Interface that any managed child must satisfy ──

interface IWindowChild {
  /** Unique identifier */
  readonly windowId: string
  /** The DOM element */
  readonly element: HTMLElement
  /** Current state */
  readonly windowState: WindowChildState
  /** Whether this child participates in z-ordering (true for floating windows) */
  readonly isFloating: boolean
  /** Called by the manager when this child is brought to front */
  onFocused?(): void
  /** Called by the manager when this child is minimized */
  onMinimized?(): void
  /** Called by the manager when this child is restored */
  onRestored?(): void
  /** Called by the manager when this child is about to be closed */
  onClosed?(): void
  /** Set the z-index (called by manager during reorder) */
  setZIndex(z: number): void
  /** Set visibility (called by manager for minimize/restore) */
  setVisible(v: boolean): void
}

// ── Window Manager options ──

interface UIWindowManagerOptions {
  width?: number
  height?: number
  bg?: string
  borderColor?: string
  className?: string
}

// ── Window Manager ──

class UIWindowManager extends UIPanel {
  constructor(options?: UIWindowManagerOptions)

  // --- Child management ---
  addWindow(child: IWindowChild): void
  removeWindow(child: IWindowChild): void

  // --- Z-ordering ---
  bringToFront(child: IWindowChild): void
  sendToBack(child: IWindowChild): void

  // --- State operations ---
  minimizeChild(child: IWindowChild): void
  restoreChild(child: IWindowChild): void
  closeChild(child: IWindowChild): void
  maximizeChild(child: IWindowChild): void
  restoreMaximized(child: IWindowChild): void

  // --- Batch operations ---
  minimizeAll(): void
  restoreAll(): void
  closeAll(): void

  // --- State queries ---
  getChildState(child: IWindowChild): WindowChildInfo | null
  getAllStates(): WindowChildInfo[]
  getMinimized(): IWindowChild[]
  getFloating(): IWindowChild[]
  getFocused(): IWindowChild | null

  // --- Events ---
  // Inherited from UIPanel: on(event, handler), off(event, handler)
  // Events:
  //   'window-focus'    → { child: IWindowChild }
  //   'window-close'    → { child: IWindowChild }
  //   'window-minimize' → { child: IWindowChild }
  //   'window-restore'  → { child: IWindowChild }
  //   'window-drag'     → { child: IWindowChild, left: number, top: number }
  //   'window-resize'   → { child: IWindowChild, width: number, height: number }
}

// ── IUIWindow options ──

interface IUIWindowOptions {
  id?: string
  title?: string
  left?: number
  top?: number
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  closable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  titleBarHeight?: number
  icon?: HTMLElement | string   // custom icon in titlebar
}

// ── IUIWindow (concrete window) ──

class IUIWindow implements IWindowChild {
  constructor(options?: IUIWindowOptions)

  readonly windowId: string
  readonly element: HTMLElement
  readonly contentElement: HTMLElement   // where user puts content
  readonly titleBarElement: HTMLElement

  windowState: WindowChildState
  isFloating: boolean   // always true

  // --- Properties ---
  title: string
  left: number
  top: number
  width: number
  height: number

  // --- Manager communication ---
  manager: UIWindowManager | null   // set when added to a manager

  // --- IWindowChild callbacks ---
  onFocused(): void
  onMinimized(): void
  onRestored(): void
  onClosed(): void
  setZIndex(z: number): void
  setVisible(v: boolean): void

  destroy(): void
}
```

## Z-ordering algorithm

```
When bringToFront(child) is called:
1. Get all floating children (isFloating === true)
2. Remove the target child from the list
3. Push it to the end (highest z)
4. Reassign z-indexes: base=10, step=10 → 10, 20, 30...
5. Apply setZIndex() to each child
6. Call child.onFocused() on the newly focused child
7. Emit 'window-focus' event
```

Docked children (align !== none) keep z-index=0 and are not affected.

## Minimize/restore behavior

```
Minimize:
1. Set child.windowState = 'minimized'
2. child.setVisible(false) → display: none
3. Emit 'window-minimize' event
4. Bring next visible floating child to front

Restore:
1. Set child.windowState = 'normal'
2. child.setVisible(true) → display: ''
3. bringToFront(child)
4. Emit 'window-restore' event
```

## Maximize behavior

```
Maximize:
1. Save current left, top, width, height as _restoreRect
2. Set child position to fill the manager's available area (after docked children)
3. Set child.windowState = 'maximized'
4. bringToFront(child)

Restore from maximized:
1. Restore left, top, width, height from _restoreRect
2. Set child.windowState = 'normal'
```

## Drag behavior (IUIWindow)

```
mousedown on titlebar:
1. Record dragStartX/Y = e.clientX/Y
2. Record startLeft/Top = current left/top
3. Tell manager: bringToFront(this)

mousemove on document:
1. deltaX = e.clientX - dragStartX
2. deltaY = e.clientY - dragStartY
3. newLeft = startLeft + deltaX
4. newTop = startTop + deltaY
5. Clamp to manager bounds (optional)
6. Apply left/top to element
7. Notify manager: emit 'window-drag'

mouseup on document:
1. Stop drag
```

## IUIWindow titlebar structure

```
┌──────────────────────────────────────────────┐
│ [icon] Title Text              [_] [□] [×]   │
├──────────────────────────────────────────────┤
│                                              │
│              Content Area                    │
│                                              │
└──────────────────────────────────────────────┘
```

- Title bar is a UIPanel with `align: top`, fixed height (~28px)
- Buttons are UIToolButton instances (close=`close`, minimize=`minus`, maximize=`plus`/`close`)
- Buttons positioned right-aligned via flex
- Content area is a UIPanel with `align: client`
- Entire window has `position: absolute` for free positioning within manager

## Theming

- IUIWindow inherits colors from CSS variables: `--window-bg-color`, `--headerbar-bg-color`, `--headerbar-fg-color`, `--border-color`
- WIN95 theme: 3D bevel on window border and titlebar, specific titlebar blue (#000080 light, #000050 dark)
- GTK4 theme: rounded corners, subtle shadow, CSD-style titlebar
- UIToolButton icons inherit `currentColor` so they follow the theme

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/components/common/types.ts` | modify | Add WindowChildState, WindowChildInfo, IWindowChild, UIWindowManagerOptions, IUIWindowOptions |
| `src/components/ui-window-manager/ui-window-manager.ts` | create | UIWindowManager class |
| `src/components/ui-window/ui-window.ts` | create | IUIWindow class |
| `src/components/ui-window/ui-window.css` | create | Window styles (titlebar, buttons, body, themes) |
| `src/demos/windows.ts` | create | WindowManager + IUIWindow demo |
| `src/main.ts` | modify | Register windows demo |

## Discarded alternatives

- **UIWindowManager as web component**: Discarded because it needs direct z-index control over children's DOM elements. Shadow DOM would block this.
- **Children manage their own z-index**: Discarded because z-indexes need to be coordinated across all children. Only the parent knows the full ordering.
- **Using CSS `order` instead of z-index**: Discarded because `order` affects flex layout, not stacking order. We need `z-index` on `position: absolute` children.
- **Single monolithic Window class**: Discarded in favor of IWindowChild interface. This allows any component (not just IUIWindow) to be managed — e.g. a floating toolbar, a dialog, a panel.
- **Drag via HTML5 drag-and-drop API**: Discarded because it shows a ghost image and doesn't allow real-time positioning. Using mousedown/mousemove gives pixel-perfect control.
