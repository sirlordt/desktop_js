import { UIToolButton } from '../common/ui-tool-button-core'
import { applySimulateFocus, listenSimulateFocus } from '../common/simulate-focus-core'
import { UIHintWC } from '../ui-hint-wc/ui-hint-wc'
import { UIScrollBoxWC } from '../ui-scrollbox-wc/ui-scrollbox-wc'
import type { IWindowChild, WindowState, WindowKind, UIPosition, UIWindowOptions, ScrollMode, TitleAlign, ScrollBarSize } from '../common/types'
import type { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'
import cssText from './ui-window-wc.css?inline'

let windowCounter = 0

const WINDOW_ATTRS = [
  'title', 'window-id', 'kind', 'positioning', 'left', 'top', 'width', 'height',
  'min-width', 'min-height', 'max-width', 'max-height', 'resizable', 'movable',
  'closable', 'minimizable', 'maximizable', 'foldable', 'modal', 'topmost',
  'show-title', 'title-align', 'scroll', 'scrollbar-size', 'z-index',
  'show-hints', 'show-shortcuts', 'allow-move-off-parent', 'titlebar-style',
  'titlebar-height', 'auto-unfold',
] as const

export class UIWindowWC extends HTMLElement implements IWindowChild {
  windowId: string = ''
  contentElement!: HTMLDivElement
  titleBarElement!: HTMLDivElement
  private _scrollBox: UIScrollBoxWC | null = null
  private _bodyEl!: HTMLDivElement

  windowState: WindowState = 'normal'
  isFloating: boolean = true
  modal: boolean = false
  topmost: boolean = false

  manager: UIWindowManagerWC | null = null

  private _tools: UIWindowWC[] = []
  private _overlord: UIWindowWC | null = null

  private _shadow: ShadowRoot
  private _title: string = 'Window'
  private _titleEl!: HTMLSpanElement
  private _buttonsEl!: HTMLDivElement
  private _leftSlotEl!: HTMLDivElement
  private _rightSlotEl!: HTMLDivElement
  private _kind: WindowKind = 'normal'
  private _positioning: UIPosition = 'absolute'
  private _resizable: boolean = true
  private _movable: boolean = true
  private _showTitle: boolean = true
  private _titleAlign: TitleAlign = 'left'
  private _minWidth: number = 150
  private _minHeight: number = 80
  private _maxWidth: number = Infinity
  private _maxHeight: number = Infinity
  private _titleBarHeight: number = 28
  private _titleBarStyle: string = 'normal'
  private _cleanups: Array<() => void> = []
  private _destroyed: boolean = false
  private _autoDestroyTimer: ReturnType<typeof setTimeout> | null = null
  private _resizeHandles: HTMLDivElement[] = []
  private _allowMoveOffParent: boolean = true
  private _closable: boolean = true
  private _minimizable: boolean = true
  private _maximizable: boolean = true
  private _foldableOption: boolean = false

  // Build state
  private _built: boolean = false
  private _configured: boolean = false
  private _pendingAttrs: Map<string, string | null> | null = null

  // Content slot for framework children
  private _contentSlot: HTMLSlotElement | null = null

  // Scroll config (stored for deferred build)
  private _scrollMode: ScrollMode | undefined = undefined
  private _scrollBarSize: ScrollBarSize = 'small'

  // Drag state
  private _dragging: boolean = false
  private _dragStartX: number = 0
  private _dragStartY: number = 0
  private _dragStartLeft: number = 0
  private _dragStartTop: number = 0

  // Buttons
  private _foldBtn: UIToolButton | null = null
  private _closeBtn: UIToolButton | null = null
  private _minBtn: UIToolButton | null = null
  private _maxBtn: UIToolButton | null = null
  private _btnSize: number = 20
  private _titleHint: UIHintWC | null = null
  private _foldHint: UIHintWC | null = null
  private _minHint: UIHintWC | null = null
  private _maxHint: UIHintWC | null = null
  private _closeHint: UIHintWC | null = null
  private _showHints: boolean = true
  private _showShortcuts: boolean = true
  private _folded: boolean = false
  private _foldVisible: boolean = false
  private _foldRestoreHeight: number = 0

  static get observedAttributes() {
    return [...WINDOW_ATTRS]
  }

  constructor(options?: UIWindowOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)

    if (options) this.configure(options)
  }

  /**
   * Configure programmatically. Can be called before or after connecting.
   * Eagerly builds the shadow DOM so internal elements are available immediately.
   */
  configure(options: UIWindowOptions): void {
    const o = options
    this._kind = o.kind ?? this._kind
    this._titleBarStyle = o.titleBarStyle ?? (this._kind === 'tool' ? 'tool' : 'normal')
    this.windowId = o.id ?? this.windowId
    this._title = o.title ?? this._title
    this._resizable = o.resizable ?? this._resizable
    this._movable = o.movable ?? this._movable
    this.autoUnfold = o.autoUnfold ?? this.autoUnfold
    this.modal = o.modal ?? this.modal
    this.topmost = o.topmost ?? this.topmost
    this._showTitle = o.showTitle ?? this._showTitle
    this._titleAlign = o.titleAlign ?? this._titleAlign
    this._minWidth = o.minWidth ?? this._minWidth
    this._minHeight = o.minHeight ?? this._minHeight
    this._maxWidth = o.maxWidth ?? this._maxWidth
    this._maxHeight = o.maxHeight ?? this._maxHeight
    this._titleBarHeight = o.titleBarHeight ?? (this._titleBarStyle === 'mini-drag' ? 14 : this._titleBarStyle === 'tool' ? 21 : 28)
    this._btnSize = Math.max(16, this._titleBarHeight - 8)
    this._allowMoveOffParent = o.allowMoveOffParent ?? this._allowMoveOffParent
    this._positioning = o.positioning ?? this._positioning
    this._showHints = o.showHints !== false
    this._showShortcuts = o.showShortcuts !== false
    this._closable = o.closable !== false
    this._minimizable = o.minimizable !== false
    this._maximizable = o.maximizable !== false
    this._foldableOption = !!o.foldable
    this._scrollMode = o.scroll
    this._scrollBarSize = o.scrollBarSize ?? this._scrollBarSize

    // Store options for elements that need them during build
    this._buildOptions = o

    this._configured = true
    this._ensureBuilt()
  }

  /** Options stored temporarily for _ensureBuilt() to reference */
  private _buildOptions: UIWindowOptions | null = null

  connectedCallback(): void {
    if (this._autoDestroyTimer !== null) { clearTimeout(this._autoDestroyTimer); this._autoDestroyTimer = null }

    this._ensureBuilt()
    if (!this._configured) this._readAttributes()

    // Replay any attribute changes that arrived before DOM was built
    if (this._pendingAttrs) {
      for (const [name, val] of this._pendingAttrs) {
        this._applyAttribute(name, val)
      }
      this._pendingAttrs = null
    }
  }

  disconnectedCallback(): void {
    if (!this._destroyed && this.hasAttribute('auto-destroy')) {
      this._autoDestroyTimer = setTimeout(() => { this._autoDestroyTimer = null; this.destroy() }, 0)
    }
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return
    if (!this._built) {
      if (!this._pendingAttrs) this._pendingAttrs = new Map()
      this._pendingAttrs.set(name, val)
      return
    }
    this._applyAttribute(name, val)
  }

  private _applyAttribute(name: string, val: string | null): void {
    switch (name) {
      case 'title': this.title = val ?? 'Window'; break
      case 'window-id': this.windowId = val ?? ''; break
      case 'kind': this._kind = (val as WindowKind) ?? 'normal'; break
      case 'positioning': this.positioning = (val as UIPosition) ?? 'absolute'; break
      case 'left': this.left = val !== null ? parseFloat(val) : 50; break
      case 'top': this.top = val !== null ? parseFloat(val) : 50; break
      case 'width': this.width = val !== null ? parseFloat(val) : 300; break
      case 'height': this.height = val !== null ? parseFloat(val) : 200; break
      case 'min-width': this.minWidth = val !== null ? parseFloat(val) : 150; break
      case 'min-height': this.minHeight = val !== null ? parseFloat(val) : 80; break
      case 'max-width': this.maxWidth = val !== null ? parseFloat(val) : Infinity; break
      case 'max-height': this.maxHeight = val !== null ? parseFloat(val) : Infinity; break
      case 'resizable': this.resizable = val !== null; break
      case 'movable': this.movable = val !== null; break
      case 'closable': this.closable = val !== null; break
      case 'minimizable': this.minimizable = val !== null; break
      case 'maximizable': this.maximizable = val !== null; break
      case 'foldable': this.foldable = val !== null; break
      case 'modal': this.modal = val !== null; break
      case 'topmost': this.topmost = val !== null; break
      case 'show-title': this.showTitle = val !== null; break
      case 'title-align': this.titleAlign = (val as TitleAlign) ?? 'left'; break
      case 'z-index': if (val !== null) this.zIndex = parseInt(val); break
      case 'show-hints': this.showHints = val !== null; break
      case 'show-shortcuts': this.showShortcuts = val !== null; break
      case 'allow-move-off-parent': this.allowMoveOffParent = val !== null; break
      case 'auto-unfold': this.autoUnfold = val !== null; break
      case 'titlebar-style':
        this._titleBarStyle = val ?? 'normal'
        break
      case 'titlebar-height':
        if (val !== null) {
          this._titleBarHeight = parseFloat(val)
          if (this._built) this.titleBarElement.style.height = `${this._titleBarHeight}px`
        }
        break
      case 'scroll':
        this._scrollMode = val as ScrollMode ?? undefined
        break
      case 'scrollbar-size':
        this._scrollBarSize = (val as ScrollBarSize) ?? 'small'
        break
    }
  }

  private _readAttributes(): void {
    for (const name of WINDOW_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) {
        this._applyAttribute(name, val)
      }
    }
  }

  /** Build internal DOM exactly once */
  private _ensureBuilt(): void {
    if (this._built) return
    this._built = true

    if (!this.windowId) this.windowId = `window-${++windowCounter}`

    const o = this._buildOptions ?? {}
    const isTool = this._kind === 'tool'
    const tbStyle = this._titleBarStyle
    const isMiniDrag = tbStyle === 'mini-drag'

    // Host element styling
    this.tabIndex = -1
    this.style.position = this._positioning
    this.style.left = `${o.left ?? 50}px`
    this.style.top = `${o.top ?? 50}px`
    this.style.width = `${o.width ?? 300}px`
    this.style.height = `${o.height ?? 200}px`
    if (o.zIndex != null) this.style.zIndex = `${o.zIndex}`
    if (isTool) this.classList.add('tool')
    if (isMiniDrag) this.classList.add('mini-drag')
    if (tbStyle === 'tool') this.classList.add('tb-tool')

    // Theme class
    this._syncTheme()

    // Titlebar
    this.titleBarElement = document.createElement('div')
    this.titleBarElement.className = 'titlebar'
    this.titleBarElement.style.height = `${this._titleBarHeight}px`

    // Left slot
    this._leftSlotEl = document.createElement('div')
    this._leftSlotEl.className = 'left-slot'

    if (o.leftElements) {
      for (const el of o.leftElements) this._leftSlotEl.appendChild(el)
    }

    if (o.icon) {
      const iconEl = document.createElement('div')
      iconEl.className = 'icon'
      if (typeof o.icon === 'string') iconEl.innerHTML = o.icon
      else iconEl.appendChild(o.icon)
      this._leftSlotEl.appendChild(iconEl)
    }

    this.titleBarElement.appendChild(this._leftSlotEl)

    // Title
    this._titleEl = document.createElement('span')
    this._titleEl.className = 'title'
    this._titleEl.textContent = this._title
    if (!this._showTitle) this.titleBarElement.style.display = 'none'
    if (this._titleAlign !== 'left') this._titleEl.style.textAlign = this._titleAlign
    this.titleBarElement.appendChild(this._titleEl)

    // Title hint
    this._titleHint = new UIHintWC()
    this._titleHint.configure({ anchor: this._titleEl, content: this._title, trigger: 'programmatic', arrow: true })
    this._titleEl.addEventListener('mouseenter', () => {
      if (!this._titleHint || !this._showHints) return
      const truncated = this._titleEl.scrollWidth > this._titleEl.clientWidth
      if (truncated) this._titleHint!.show()
    })
    this._titleEl.addEventListener('mouseleave', () => {
      if (this._titleHint) this._titleHint.hideImmediate()
    })

    // Right slot
    this._rightSlotEl = document.createElement('div')
    this._rightSlotEl.className = 'right-slot'
    if (o.rightElements) {
      for (const el of o.rightElements) this._rightSlotEl.appendChild(el)
    }
    this.titleBarElement.appendChild(this._rightSlotEl)

    // Buttons
    this._buttonsEl = document.createElement('div')
    this._buttonsEl.className = 'buttons'

    // Fold button (always created, visibility controlled)
    this._foldBtn = new UIToolButton({ icon: 'chevron-up', size: this._btnSize, className: 'fold-btn' })
    this._foldBtn.onClick(() => this._toggleFold())
    this._foldVisible = this._foldableOption
    if (!this._foldableOption) this._foldBtn.element.style.display = 'none'
    this._buttonsEl.appendChild(this._foldBtn.element)

    const noMinMax = isTool || this.modal
    if (!noMinMax && this._minimizable) {
      this._minBtn = new UIToolButton({ icon: 'window-minimize', size: this._btnSize, className: 'min-btn' })
      this._minBtn.onClick(() => this._requestMinimize())
      this._buttonsEl.appendChild(this._minBtn.element)
    }

    if (!noMinMax && this._maximizable) {
      this._maxBtn = new UIToolButton({ icon: 'window-maximize', size: this._btnSize, className: 'max-btn' })
      this._maxBtn.onClick(() => this._requestMaximize())
      this._buttonsEl.appendChild(this._maxBtn.element)
    }

    if (this._closable) {
      this._closeBtn = new UIToolButton({ icon: 'close', size: this._btnSize, className: 'close-btn' })
      this._closeBtn.onClick(() => this._requestClose())
      this._buttonsEl.appendChild(this._closeBtn.element)
    }

    this.titleBarElement.appendChild(this._buttonsEl)

    // Hints
    if (this._showHints) {
      const makeHint = (anchor: HTMLElement, text: string): UIHintWC => {
        const h = new UIHintWC()
        h.configure({ anchor, content: text, trigger: 'hover', showDelay: 400, hideDelay: 100, arrow: true })
        return h
      }
      if (this._foldBtn) this._foldHint = makeHint(this._foldBtn.element, 'Fold')
      if (this._minBtn) this._minHint = makeHint(this._minBtn.element, this._hintText('Minimize', 'F7'))
      if (this._maxBtn) this._maxHint = makeHint(this._maxBtn.element, this._hintText('Maximize', 'F8'))
      if (this._closeBtn) this._closeHint = makeHint(this._closeBtn.element, this._hintText('Close', 'F9'))
    }

    // Body
    this._bodyEl = document.createElement('div')
    this._bodyEl.className = 'body'

    // Content slot for framework children
    this._contentSlot = document.createElement('slot')

    const scroll = this._scrollMode
    if (scroll && scroll !== 'none') {
      this._scrollBox = document.createElement('scrollbox-wc') as unknown as UIScrollBoxWC
      this._scrollBox.configure({
        scroll,
        scrollBarSize: this._scrollBarSize,
        borderWidth: 0,
        backgroundColor: 'inherit',
      })
      this._scrollBox.style.width = '100%'
      this._scrollBox.style.height = '100%'
      // Place window-wc's slot as light DOM child of scrollbox
      // so framework children flow through both shadow boundaries
      this._scrollBox.appendChild(this._contentSlot)
      this._bodyEl.appendChild(this._scrollBox)
      this._bodyEl.style.overflow = 'hidden'
      this.contentElement = this._scrollBox.contentElement
    } else {
      this._bodyEl.style.overflow = 'hidden'
      this._bodyEl.appendChild(this._contentSlot)
      this.contentElement = this._bodyEl
    }

    this._shadow.appendChild(this.titleBarElement)
    this._shadow.appendChild(this._bodyEl)

    // Resize handles
    if (this._resizable) this._createResizeHandles()

    // Drag
    this._bindDrag()

    // Focus trap
    this._bindFocusTrap()

    // Simulate focus listener
    this._cleanups.push(listenSimulateFocus(this, (active) => {
      this.simulateFocus = active
    }))

    // Theme observer
    const themeObs = new MutationObserver(() => this._syncTheme())
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    this._cleanups.push(() => themeObs.disconnect())

    // Release build options reference
    this._buildOptions = null
  }

  // ── Properties ──

  get element(): HTMLElement { return this }

  get title(): string { return this._title }
  set title(v: string) {
    this._title = v
    this._titleEl.textContent = v
    if (this._titleHint) this._titleHint.content = v
  }

  get kind(): WindowKind { return this._kind }
  set kind(v: WindowKind) { this._kind = v }

  get zIndex(): number { return parseInt(this.style.zIndex) || 0 }
  set zIndex(v: number) { this.style.zIndex = `${v}` }

  get positioning(): UIPosition { return this._positioning }
  set positioning(v: UIPosition) { this._positioning = v; this.style.position = v }

  get allowMoveOffParent(): boolean { return this._allowMoveOffParent }
  set allowMoveOffParent(v: boolean) { this._allowMoveOffParent = v }

  get movable(): boolean { return this._movable }
  set movable(v: boolean) { this._movable = v }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this, v)
    if (v) {
      this.titleBarElement.classList.add('focused')
    } else {
      const isFocusedByManager = this.manager && (this.manager as any)._focused === this
      if (!isFocusedByManager) this.titleBarElement.classList.remove('focused')
    }
    const isFocused = this.manager && (this.manager as any)._focused === this
    for (const tool of this._tools) {
      if (!v && isFocused) {
        tool._simulateFocus = false
        applySimulateFocus(tool, false)
        tool.titleBarElement.classList.add('focused')
      } else {
        tool.simulateFocus = v
      }
    }
  }

  get resizable(): boolean { return this._resizable }
  set resizable(v: boolean) { this._resizable = v; for (const h of this._resizeHandles) h.style.display = v ? '' : 'none' }

  get closable(): boolean { return !!this._closeBtn }
  set closable(v: boolean) {
    if (this._closeBtn) this._closeBtn.element.style.display = v ? '' : 'none'
    if (this._closeHint) this._closeHint.hideImmediate()
  }

  get minimizable(): boolean { return !!this._minBtn }
  set minimizable(v: boolean) { if (this._minBtn) this._minBtn.element.style.display = v ? '' : 'none' }

  get maximizable(): boolean { return !!this._maxBtn }
  set maximizable(v: boolean) { if (this._maxBtn) this._maxBtn.element.style.display = v ? '' : 'none' }

  get showTitle(): boolean { return this._showTitle }
  set showTitle(v: boolean) { this._showTitle = v; this.titleBarElement.style.display = v ? '' : 'none' }

  get showHints(): boolean { return this._showHints }
  set showHints(v: boolean) {
    this._showHints = v
    if (this._foldHint) this._foldHint.disabled = !v
    if (this._minHint) this._minHint.disabled = !v
    if (this._maxHint) this._maxHint.disabled = !v
    if (this._closeHint) this._closeHint.disabled = !v
  }

  get showShortcuts(): boolean { return this._showShortcuts }
  set showShortcuts(v: boolean) { this._showShortcuts = v; this._updateHintTexts() }

  get titleAlign(): TitleAlign { return this._titleAlign }
  set titleAlign(v: TitleAlign) { this._titleAlign = v; this._titleEl.style.textAlign = v }

  get left(): number { return parseInt(this.style.left) || 0 }
  set left(v: number) { this.style.left = `${v}px` }

  get top(): number { return parseInt(this.style.top) || 0 }
  set top(v: number) { this.style.top = `${v}px` }

  get width(): number { return parseInt(this.style.width) || 0 }
  set width(v: number) {
    this.style.width = `${Math.min(this._maxWidth, Math.max(this._minWidth, v))}px`
    this._refreshScrollBox()
  }

  get height(): number { return parseInt(this.style.height) || 0 }
  set height(v: number) {
    this.style.height = `${Math.min(this._maxHeight, Math.max(this._minHeight, v))}px`
    this._refreshScrollBox()
  }

  private _refreshScrollBox(): void {
    if (!this._scrollBox) return
    const content = this._scrollBox.contentElement
    this._scrollBox.contentWidth = content.scrollWidth
    this._scrollBox.contentHeight = content.scrollHeight
    this._scrollBox.refresh()
  }

  get minWidth(): number { return this._minWidth }
  set minWidth(v: number) { this._minWidth = v }
  get minHeight(): number { return this._minHeight }
  set minHeight(v: number) { this._minHeight = v }
  get maxWidth(): number { return this._maxWidth }
  set maxWidth(v: number) { this._maxWidth = v }
  get maxHeight(): number { return this._maxHeight }
  set maxHeight(v: number) { this._maxHeight = v }

  setScroll(mode: ScrollMode, scrollBarSize?: 'tiny' | 'small' | 'medium' | 'large'): void {
    const prevFocused = document.activeElement as HTMLElement | null
    const hadFocusInBody = prevFocused && this._bodyEl.contains(prevFocused)

    const children: Node[] = []
    const source = this.contentElement
    while (source.firstChild) children.push(source.removeChild(source.firstChild))

    if (this._scrollBox) { this._scrollBox.destroy(); this._scrollBox = null }
    this._bodyEl.innerHTML = ''

    if (mode !== 'none') {
      this._scrollBox = document.createElement('scrollbox-wc') as unknown as UIScrollBoxWC
      this._scrollBox.configure({ scroll: mode, scrollBarSize: scrollBarSize ?? 'small', borderWidth: 0, backgroundColor: 'inherit' })
      this._scrollBox.style.width = '100%'
      this._scrollBox.style.height = '100%'
      this._bodyEl.appendChild(this._scrollBox)
      this._bodyEl.style.overflow = 'hidden'
      this.contentElement = this._scrollBox.contentElement
    } else {
      this._bodyEl.style.overflow = 'hidden'
      this.contentElement = this._bodyEl
    }

    for (const child of children) this.contentElement.appendChild(child)

    if (hadFocusInBody && prevFocused && this._bodyEl.contains(prevFocused)) {
      prevFocused.focus({ preventScroll: true })
    }

    if (this._scrollBox) {
      requestAnimationFrame(() => {
        if (!this._scrollBox) return
        const content = this._scrollBox.contentElement
        this._scrollBox.contentWidth = content.scrollWidth
        this._scrollBox.contentHeight = content.scrollHeight
        this._scrollBox.refresh()
        if (hadFocusInBody && prevFocused && this.contentElement.contains(prevFocused)) {
          this._scrollBox.scrollChildIntoView(prevFocused)
        }
      })
    }
  }

  // ── Tool windows ──

  get tools(): readonly UIWindowWC[] { return this._tools }
  get overlord(): UIWindowWC | null { return this._overlord }
  get isTool(): boolean { return this._overlord !== null }

  addTool(win: UIWindowWC): boolean {
    if (win._overlord || win._tools.length > 0 || win === this || this._overlord || this._tools.includes(win)) return false
    this._tools.push(win)
    win._overlord = this
    win._kind = 'tool'
    win.classList.add('tool')
    if (win._minBtn) win._minBtn.element.style.display = 'none'
    if (win._maxBtn) win._maxBtn.element.style.display = 'none'
    win.titleBarElement.style.height = '21px'
    if (this.manager) (this.manager as any)._removeFromZOrder(win)
    if (this.titleBarElement.classList.contains('focused')) win.titleBarElement.classList.add('focused')
    if (this.manager) {
      const handler = () => this.manager!.bringToFront(win)
      win.addEventListener('mousedown', handler, true)
      ;(win as any).__wm_tool_mousedown = handler
    }
    if (this.manager) (this.manager as any)._reassignZIndexes()
    return true
  }

  removeTool(win: UIWindowWC): boolean {
    const idx = this._tools.indexOf(win)
    if (idx === -1) return false
    this._tools.splice(idx, 1)
    win._overlord = null
    const toolHandler = (win as any).__wm_tool_mousedown
    if (toolHandler) { win.removeEventListener('mousedown', toolHandler, true); delete (win as any).__wm_tool_mousedown }
    win._kind = 'normal'
    win.classList.remove('tool')
    if (win._minBtn) win._minBtn.element.style.display = ''
    if (win._maxBtn) win._maxBtn.element.style.display = ''
    win.titleBarElement.style.height = ''
    if (this.manager) {
      (this.manager as any)._zOrderFor(win).push(win)
      ;(this.manager as any)._reassignZIndexes()
    }
    return true
  }

  addLeftElement(el: HTMLElement): void { this._leftSlotEl.appendChild(el) }
  addRightElement(el: HTMLElement): void { this._rightSlotEl.appendChild(el) }

  get folded(): boolean { return this._folded }
  get foldable(): boolean { return this._foldVisible }
  set foldable(v: boolean) {
    this._foldVisible = v
    if (this._foldBtn) this._foldBtn.element.style.display = v ? '' : 'none'
    if (!v && this._folded) this._unfold()
  }

  autoUnfold: boolean = false

  fold(): void { this._fold() }
  unfold(): void { this._unfold() }

  private _toggleFold(): void {
    if (this.windowState !== 'normal') return
    if (this._folded) this._unfold()
    else this._fold()
  }

  private _fold(): void {
    if (this._folded || this.windowState !== 'normal') return
    if (!this._emitWindowEvent('before-fold', { folding: true })) return
    if (this.manager) {
      const detail = { child: this as IWindowChild, folding: true, cancelled: false }
      this.manager.core.emit('before-fold', detail)
      if (detail.cancelled) return
    }
    this._folded = true
    this._foldRestoreHeight = this.height
    this.classList.add('wm-anim')
    void this.offsetHeight
    this._bodyEl.classList.add('body--hidden')
    this._setResizeHandlesVisible(false)
    this.style.height = `${this._titleBarHeight}px`
    const cleanup = () => this.classList.remove('wm-anim')
    const onEnd = (e: Event) => { if (e.target === this) { cleanup(); this.removeEventListener('transitionend', onEnd) } }
    this.addEventListener('transitionend', onEnd)
    setTimeout(cleanup, 250)
    if (this._foldBtn) this._foldBtn.icon = 'chevron-down'
    this._updateHintTexts()
    this._emitWindowEvent('fold', { folded: true })
    if (this.manager) this.manager.core.emit('window-fold', { child: this, folded: true })
  }

  private _unfold(): void {
    if (!this._folded) return
    if (!this._emitWindowEvent('before-fold', { folding: false })) return
    if (this.manager) {
      const detail = { child: this as IWindowChild, folding: false, cancelled: false }
      this.manager.core.emit('before-fold', detail)
      if (detail.cancelled) return
    }
    this._folded = false
    this._bodyEl.classList.remove('body--hidden')
    this._setResizeHandlesVisible(this._resizable)
    this.classList.add('wm-anim')
    void this.offsetHeight
    this.style.height = `${this._foldRestoreHeight}px`
    const cleanup = () => this.classList.remove('wm-anim')
    const onEnd = (e: Event) => { if (e.target === this) { cleanup(); this.removeEventListener('transitionend', onEnd) } }
    this.addEventListener('transitionend', onEnd)
    setTimeout(cleanup, 250)
    if (this._foldBtn) this._foldBtn.icon = 'chevron-up'
    this._updateHintTexts()
    this._emitWindowEvent('fold', { folded: false })
    if (this.manager) this.manager.core.emit('window-fold', { child: this, folded: false })
  }

  flash(count: number = 3): void {
    if (this._destroyed) return
    this.classList.add('ui-window--flash')
    setTimeout(() => this.classList.remove('ui-window--flash'), count * 300)
  }

  // ── IWindowChild ──

  onFocused(): void {
    this.titleBarElement.classList.add('focused')
    const parent = this.parentElement
    if (parent) {
      parent.querySelectorAll('window-wc').forEach(el => {
        const wc = el as UIWindowWC
        const isOurTool = this._tools.includes(wc)
        const hasSimFocus = wc.hasAttribute('data-simulate-focus')
        if (wc !== this && !isOurTool && !hasSimFocus) wc.titleBarElement.classList.remove('focused')
      })

      // Without a WindowManager, manage z-index manually: push all sibling
      // windows to base z-index, then bring this window and its tools on top.
      if (!this.manager) {
        let maxZ = 0
        parent.querySelectorAll('window-wc').forEach(el => {
          const z = parseInt((el as HTMLElement).style.zIndex) || 0
          if (z > maxZ) maxZ = z
        })
        const topZ = maxZ + 1
        this.style.zIndex = `${topZ}`
        this._tools.forEach((t, i) => { (t as HTMLElement).style.zIndex = `${topZ + 1 + i}` })
      }
    }
    if (this._lastFocusedEl && this._containsFocusable(this._lastFocusedEl)) {
      this._lastFocusedEl.focus({ preventScroll: true })
    } else {
      const els = this._getAllGroupFocusable()
      if (els.length > 0) els[0].focus({ preventScroll: true })
    }
    if (!this._hasActiveHScroll()) this._bodyEl.scrollLeft = 0
    if (!this._hasActiveVScroll()) this._bodyEl.scrollTop = 0
    for (const tool of this._tools) tool.titleBarElement.classList.add('focused')
  }

  onBlurred(): void {
    if (!this._simulateFocus) this.titleBarElement.classList.remove('focused')
    for (const tool of this._tools) tool.titleBarElement.classList.remove('focused')
  }

  private _minimizedFocusEl: HTMLElement | null = null

  onMinimized(): void {
    this._minimizedFocusEl = this._lastFocusedEl
    this.titleBarElement.classList.remove('focused')
    this._bodyEl.classList.add('body--hidden')
    this._setResizeHandlesVisible(false)
    if (this._foldBtn) this._foldBtn.element.style.display = 'none'
    if (this._minBtn) this._minBtn.icon = 'window-restore'
    if (this._maxBtn) this._maxBtn.icon = 'window-maximize'
    this._updateHintTexts('minimized')
    for (const tool of this._tools) tool.visible = false
  }

  onRestored(): void {
    if (this._folded && !this.autoUnfold) {
      this._bodyEl.classList.add('body--hidden')
      this._setResizeHandlesVisible(false)
      this.style.height = `${this._titleBarHeight}px`
    } else {
      if (this._folded) this._unfold()
      this._bodyEl.classList.remove('body--hidden')
      this._setResizeHandlesVisible(this._resizable)
    }
    if (this._foldBtn && this.foldable) this._foldBtn.element.style.display = ''
    if (this._maxBtn) this._maxBtn.icon = 'window-maximize'
    if (this._minBtn) this._minBtn.icon = 'window-minimize'
    this._updateHintTexts('normal')
    for (const tool of this._tools) tool.visible = true
    if (this.manager) (this.manager as any)._reassignZIndexes()
    const restoreEl = this._minimizedFocusEl
    this._minimizedFocusEl = null
    if (restoreEl && this._containsFocusable(restoreEl)) restoreEl.focus({ preventScroll: true })
  }

  onMaximized(): void {
    this._bodyEl.classList.remove('body--hidden')
    this._setResizeHandlesVisible(false)
    if (this._foldBtn) this._foldBtn.element.style.display = 'none'
    if (this._maxBtn) this._maxBtn.icon = 'window-restore'
    if (this._minBtn) this._minBtn.icon = 'window-minimize'
    this._updateHintTexts('maximized')
  }

  onClosed(): void {
    for (const tool of [...this._tools]) { if (this.manager) this.manager.closeChild(tool) }
    if (this._overlord) this._overlord.removeTool(this)
  }

  private _hintText(label: string, shortcut: string): string {
    return this._showShortcuts ? `${label} (${shortcut})` : label
  }

  private _updateHintTexts(state?: WindowState): void {
    const s = state ?? this.windowState
    if (this._foldHint) this._foldHint.content = this._folded ? 'Unfold' : 'Fold'
    if (this._minHint) this._minHint.content = this._hintText(s === 'minimized' ? 'Restore' : 'Minimize', 'F7')
    if (this._maxHint) this._maxHint.content = this._hintText(s === 'maximized' ? 'Restore' : 'Maximize', 'F8')
    if (this._closeHint) this._closeHint.content = this._hintText('Close', 'F9')
  }

  get visible(): boolean { return this.style.display !== 'none' }
  set visible(v: boolean) { this.style.display = v ? '' : 'none' }

  get scrollBox(): UIScrollBoxWC | null { return this._scrollBox }

  get titleBarStyle(): string { return this._titleBarStyle }
  set titleBarStyle(v: string) {
    this._titleBarStyle = v
    if (this._built) this.titleBarElement.className = `ui-window__titlebar ${v}`
  }

  get titleBarHeight(): number { return this._titleBarHeight }
  set titleBarHeight(v: number) {
    this._titleBarHeight = v
    if (this._built) this.titleBarElement.style.height = `${v}px`
  }

  // ── Manager requests ──

  private _requestClose(): void {
    if (!this._emitWindowEvent('before-close')) return
    if (this.manager) { if (!this.manager.closeChild(this)) return }
    else this.onClosed()
    this._emitWindowEvent('close')
  }

  private _requestMinimize(): void {
    if (this._kind === 'tool' || this.modal) return
    if (this.windowState === 'minimized') {
      if (!this._emitWindowEvent('before-restore')) return
      if (this.manager) { if (!this.manager.restoreChild(this)) return }
      else { this.windowState = 'normal'; this.onRestored?.() }
      this._emitWindowEvent('restore')
    } else {
      if (!this._emitWindowEvent('before-minimize')) return
      if (this.manager) { if (!this.manager.minimizeChild(this)) return }
      else { this.windowState = 'minimized'; this.onMinimized?.() }
      this._emitWindowEvent('minimize')
    }
  }

  private _requestMaximize(): void {
    if (this._kind === 'tool' || this.modal) return
    if (this.windowState === 'maximized') {
      if (!this._emitWindowEvent('before-restore')) return
      if (this.manager) { if (!this.manager.restoreMaximized(this)) return }
      else { this.windowState = 'normal'; this.onRestored?.() }
      this._emitWindowEvent('restore')
    } else {
      if (!this._emitWindowEvent('before-maximize')) return
      if (this.manager) { if (!this.manager.maximizeChild(this)) return }
      else { this.windowState = 'maximized'; (this as any).onMaximized?.() }
      this._emitWindowEvent('maximize')
    }
  }

  // ── Events ──

  private _emitWindowEvent(name: string, detail?: Record<string, any>): boolean {
    return this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, cancelable: true, detail: detail ?? {} }))
  }

  // ── Theme ──

  private _syncTheme(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    this.classList.remove('win95', 'win95-dark')
    if (theme === 'win95-dark') {
      this.classList.add('win95', 'win95-dark')
    } else if (theme.startsWith('win95')) {
      this.classList.add('win95')
    }
  }

  // ── Drag ──

  private _bindDrag(): void {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.buttons')) return
      if ((e.target as HTMLElement).closest('.right-slot')) return
      if (!this._movable) return
      if (this.windowState === 'maximized' || this.windowState === 'minimized') return
      e.preventDefault()
      const startLeft = this.left, startTop = this.top
      if (!this._emitWindowEvent('start-drag', { left: startLeft, top: startTop, width: this.width, height: this.height })) return
      this._dragging = true
      this._dragStartX = e.clientX; this._dragStartY = e.clientY
      this._dragStartLeft = startLeft; this._dragStartTop = startTop
      if (this.manager) this.manager.bringToFront(this)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this._dragging) return
      const mgrEl = this._getManagerElement()
      if (mgrEl) {
        const r = mgrEl.getBoundingClientRect()
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      }
      const newLeft = this._dragStartLeft + (e.clientX - this._dragStartX)
      const newTop = this._dragStartTop + (e.clientY - this._dragStartY)
      if (!this._emitWindowEvent('dragging', { left: newLeft, top: newTop, width: this.width, height: this.height })) { this._dragging = false; return }
      if (this.manager && !this._allowMoveOffParent) {
        const mgrW = this.manager.element.clientWidth, mgrH = this.manager.element.clientHeight
        this.left = Math.max(0, Math.min(newLeft, mgrW - this.width))
        this.top = Math.max(0, Math.min(newTop, mgrH - this.height))
      } else { this.left = newLeft; this.top = newTop }
      if (this.manager) this.manager.notifyDrag(this, this.left, this.top)
    }

    const onMouseUp = () => {
      if (!this._dragging) return
      this._dragging = false
      if (!this._emitWindowEvent('end-drag', { left: this.left, top: this.top, width: this.width, height: this.height })) {
        this.left = this._dragStartLeft; this.top = this._dragStartTop
      }
    }

    this.titleBarElement.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    this._cleanups.push(
      () => this.titleBarElement.removeEventListener('mousedown', onMouseDown),
      () => document.removeEventListener('mousemove', onMouseMove),
      () => document.removeEventListener('mouseup', onMouseUp),
    )
  }

  // ── Resize ──

  private _getManagerElement(): HTMLElement | null {
    if (this.manager) return this.manager.element
    if (this._overlord?.manager) return this._overlord.manager.element
    return null
  }

  private _setResizeHandlesVisible(v: boolean): void {
    for (const h of this._resizeHandles) h.style.display = v ? '' : 'none'
  }

  private _createResizeHandles(): void {
    const makeHandle = (cls: string, onDrag: (dx: number, dy: number, sw: number, sh: number, sl: number, st: number) => void) => {
      const handle = document.createElement('div')
      handle.className = cls
      this._shadow.appendChild(handle)
      this._resizeHandles.push(handle)

      let startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0
      let resizing = false

      const onMouseDown = (e: MouseEvent) => {
        if (this.windowState !== 'normal') return
        e.preventDefault(); e.stopPropagation()
        if (!this._emitWindowEvent('start-resize', { left: this.left, top: this.top, width: this.width, height: this.height })) return
        resizing = true
        startX = e.clientX; startY = e.clientY; startW = this.width; startH = this.height; startL = this.left; startT = this.top
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!resizing) return
        const mgrEl = this._getManagerElement()
        if (mgrEl) {
          const r = mgrEl.getBoundingClientRect()
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
        }
        onDrag(e.clientX - startX, e.clientY - startY, startW, startH, startL, startT)
        if (this.manager && !this._allowMoveOffParent) {
          const mgrW = this.manager.element.clientWidth, mgrH = this.manager.element.clientHeight
          if (this.left < 0) { this.width += this.left; this.left = 0 }
          if (this.top < 0) { this.height += this.top; this.top = 0 }
          if (this.left + this.width > mgrW) this.width = mgrW - this.left
          if (this.top + this.height > mgrH) this.height = mgrH - this.top
        }
        if (!this._emitWindowEvent('resizing', { left: this.left, top: this.top, width: this.width, height: this.height })) { resizing = false; return }
        if (this.manager) this.manager.notifyResize(this, this.width, this.height)
      }

      const onMouseUp = () => {
        if (!resizing) return
        resizing = false
        if (!this._emitWindowEvent('end-resize', { left: this.left, top: this.top, width: this.width, height: this.height })) {
          this.left = startL; this.top = startT; this.width = startW; this.height = startH
        }
      }

      handle.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      this._cleanups.push(
        () => handle.removeEventListener('mousedown', onMouseDown),
        () => document.removeEventListener('mousemove', onMouseMove),
        () => document.removeEventListener('mouseup', onMouseUp),
      )
    }

    const clampW = (v: number) => Math.min(this._maxWidth, Math.max(this._minWidth, v))
    const clampH = (v: number) => Math.min(this._maxHeight, Math.max(this._minHeight, v))

    makeHandle('resize-e', (dx, _dy, sw) => { this.width = sw + dx })
    makeHandle('resize-w', (dx, _dy, sw, _sh, sl) => { const nw = clampW(sw - dx); this.left = sl + (sw - nw); this.width = nw })
    makeHandle('resize-s', (_dx, dy, _sw, sh) => { this.height = sh + dy })
    makeHandle('resize-n', (_dx, dy, _sw, sh, _sl, st) => { const nh = clampH(sh - dy); this.top = st + (sh - nh); this.height = nh })
    makeHandle('resize-se', (dx, dy, sw, sh) => { this.width = sw + dx; this.height = sh + dy })
    makeHandle('resize-sw', (dx, dy, sw, sh, sl) => { const nw = clampW(sw - dx); this.left = sl + (sw - nw); this.width = nw; this.height = sh + dy })
    makeHandle('resize-ne', (dx, dy, sw, sh, _sl, st) => { this.width = sw + dx; const nh = clampH(sh - dy); this.top = st + (sh - nh); this.height = nh })
    makeHandle('resize-nw', (dx, dy, sw, sh, sl, st) => { const nw = clampW(sw - dx); this.left = sl + (sw - nw); this.width = nw; const nh = clampH(sh - dy); this.top = st + (sh - nh); this.height = nh })
  }

  // ── Scroll helpers ──

  private _hasActiveHScroll(): boolean {
    if (!this._scrollBox) return false
    const sb = this._scrollBox.hScrollBottom ?? this._scrollBox.hScrollTop
    return sb !== null && sb.style.display !== 'none'
  }

  private _hasActiveVScroll(): boolean {
    if (!this._scrollBox) return false
    const sb = this._scrollBox.vScrollRight ?? this._scrollBox.vScrollLeft
    return sb !== null && sb.style.display !== 'none'
  }

  // ── Focus cycle ──

  private _lastFocusedEl: HTMLElement | null = null

  resetLastFocused(): void { this._lastFocusedEl = null }

  private static _nativeFocusable = /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/

  /** Traverse shadow roots to find the actually focused element */
  private static _deepActiveElement(): HTMLElement | null {
    let el = document.activeElement as HTMLElement | null
    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement as HTMLElement
    }
    return el
  }

  private _getBodyFocusable(): HTMLElement[] {
    return Array.from(this._bodyEl.querySelectorAll('[data-focusable]')).filter(el => {
      if ((el as HTMLInputElement).disabled) return false
      if (el.hasAttribute('tabindex')) return true
      if (UIWindowWC._nativeFocusable.test(el.tagName)) return true
      if (el.shadowRoot?.delegatesFocus) return true
      return false
    }) as HTMLElement[]
  }

  private _getAllGroupFocusable(): HTMLElement[] {
    const els = [...this._getBodyFocusable()]
    for (const tool of this._tools) els.push(...tool._getBodyFocusable())
    return els
  }

  /** Check if an element (or its shadow host chain) is inside this window's body or its tools */
  private _containsFocusable(el: HTMLElement): boolean {
    // Walk up the host chain to find a [data-focusable] element inside our body
    let current: HTMLElement | null = el
    while (current) {
      if (this._bodyEl.contains(current)) return true
      for (const tool of this._tools) { if (tool._bodyEl.contains(current)) return true }
      // Traverse up through shadow host
      const root = current.getRootNode() as ShadowRoot | Document
      if (root instanceof ShadowRoot) {
        current = root.host as HTMLElement
      } else {
        break
      }
    }
    return false
  }

  /** Find which [data-focusable] element contains the deep active element */
  private _findActiveIndex(els: HTMLElement[]): number {
    const deep = UIWindowWC._deepActiveElement()
    if (!deep) return -1
    // Walk up from deep active element to find a match in els
    let current: HTMLElement | null = deep
    while (current) {
      for (let i = 0; i < els.length; i++) {
        if (els[i] === current || els[i].contains(current)) return i
      }
      const root = current.getRootNode() as ShadowRoot | Document
      if (root instanceof ShadowRoot) {
        current = root.host as HTMLElement
      } else {
        break
      }
    }
    return -1
  }

  private get _groupOwner(): UIWindowWC { return this._overlord ?? this }

  /** Walk up from el (crossing shadow boundaries) to find a tool window, then bring it to front */
  private _bringContainingToolToFront(el: HTMLElement): void {
    let node: HTMLElement | null = el
    while (node) {
      if (node.tagName === 'WINDOW-WC') {
        const win = node as UIWindowWC
        if (!win.isTool) return
        if (this.manager) {
          this.manager.bringToFront(win)
        } else if (win._overlord) {
          // Standalone: reorder _tools and refresh z-indexes only (no focus steal)
          const tools = win._overlord._tools
          const idx = tools.indexOf(win)
          if (idx !== -1 && idx !== tools.length - 1) {
            tools.splice(idx, 1); tools.push(win)
          }
          const parent = (win._overlord as HTMLElement).parentElement
          if (parent) {
            let maxZ = 0
            parent.querySelectorAll('window-wc').forEach(e => {
              const z = parseInt((e as HTMLElement).style.zIndex) || 0
              if (z > maxZ) maxZ = z
            })
            const topZ = maxZ + 1
            ;(win._overlord as HTMLElement).style.zIndex = `${topZ}`
            tools.forEach((t, i) => { (t as HTMLElement).style.zIndex = `${topZ + 1 + i}` })
          }
        }
        return
      }
      const parent = node.parentElement
      if (parent) { node = parent }
      else {
        const root = node.getRootNode()
        node = root instanceof ShadowRoot ? root.host as HTMLElement : null
      }
    }
  }

  private _bindFocusTrap(): void {
    this._bodyEl.addEventListener('focusin', (e: Event) => {
      const target = e.target as HTMLElement
      if (target && target !== this._bodyEl) {
        this._lastFocusedEl = target
        if (this._overlord) this._overlord._lastFocusedEl = target
        if (this._scrollBox) this._scrollBox.scrollChildIntoView(target)
      }
    })

    this._bodyEl.addEventListener('mousedown', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-focusable]') as HTMLElement | null
      if (target) target.focus()
      else e.preventDefault()
    })

    // Standalone focus: when no WindowManager, handle focus on mousedown.
    // If this is a tool window, move it to front of siblings then focus the overlord.
    this.addEventListener('mousedown', () => {
      if (this.manager) return
      const owner = this._overlord ?? this
      if (this._overlord) {
        const tools = this._overlord._tools
        const idx = tools.indexOf(this)
        if (idx !== -1 && idx !== tools.length - 1) {
          tools.splice(idx, 1); tools.push(this)
        }
      }
      owner.onFocused()
    }, true)

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!this.titleBarElement.classList.contains('focused')) return

      // Check if focus is within this window (traverse shadow roots)
      const deepActive = UIWindowWC._deepActiveElement()
      if (deepActive && !this._containsFocusable(deepActive) && deepActive !== this) return

      if (this._overlord) return

      const owner = this._groupOwner
      const els = owner._getAllGroupFocusable()
      if (els.length === 0) return
      e.preventDefault()

      const idx = owner._findActiveIndex(els)
      const target = e.shiftKey
        ? els[idx <= 0 ? els.length - 1 : idx - 1]
        : els[(idx + 1) % els.length]
      target.focus({ preventScroll: true })

      // If the focused target is inside a tool window, bring it to front
      this._bringContainingToolToFront(target)
    }

    document.addEventListener('keydown', handler, true)
    this._cleanups.push(() => document.removeEventListener('keydown', handler, true))
  }

  // ── Destroy ──

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._scrollBox?.destroy()
    this._titleHint?.destroy()
    this._foldHint?.destroy()
    this._minHint?.destroy()
    this._maxHint?.destroy()
    this._closeHint?.destroy()
    this._foldBtn?.destroy()
    this._closeBtn?.destroy()
    this._minBtn?.destroy()
    this._maxBtn?.destroy()
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    if (this.parentNode) this.parentNode.removeChild(this)
  }

  get isDestroyed(): boolean { return this._destroyed }
}

customElements.define('window-wc', UIWindowWC)
