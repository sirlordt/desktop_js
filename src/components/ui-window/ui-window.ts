import { UIToolButton } from '../common/ui-tool-button'
import { applySimulateFocus, listenSimulateFocus } from '../common/simulate-focus'
import { UIHint } from '../ui-hint/ui-hint'
import { UIScrollBox } from '../ui-scrollbox/ui-scrollbox'
import type { IWindowChild, WindowState, WindowKind, UIPosition, UIWindowOptions, ScrollMode, TitleAlign } from '../common/types'
import type { UIWindowManager } from '../ui-window-manager/ui-window-manager'
import './ui-window.css'

let windowCounter = 0

export class UIWindow implements IWindowChild {
  readonly windowId: string
  readonly element: HTMLDivElement
  readonly contentElement: HTMLDivElement
  readonly titleBarElement: HTMLDivElement
  private _scrollBox: UIScrollBox | null = null
  private _bodyEl: HTMLDivElement

  windowState: WindowState = 'normal'
  readonly isFloating: boolean = true
  readonly modal: boolean = false
  readonly topmost: boolean = false

  manager: UIWindowManager | null = null

  /** Tool windows attached to this window */
  private _tools: UIWindow[] = []
  /** The overlord window if this is a tool */
  private _overlord: UIWindow | null = null

  private _title: string
  private _titleEl: HTMLSpanElement
  private _buttonsEl: HTMLDivElement
  private _leftSlot: HTMLDivElement
  private _rightSlot: HTMLDivElement
  private _kind: WindowKind
  private _positioning: UIPosition
  private _resizable: boolean
  private _movable: boolean
  private _showTitle: boolean
  private _titleAlign: TitleAlign
  private _minWidth: number
  private _minHeight: number
  private _maxWidth: number
  private _maxHeight: number
  private _titleBarHeight: number
  private _cleanups: Array<() => void> = []
  private _destroyed: boolean = false
  private _resizeHandles: HTMLDivElement[] = []
  private _allowMoveOffParent: boolean

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
  private _btnSize: number
  private _titleHint: UIHint | null = null
  private _foldHint: UIHint | null = null
  private _minHint: UIHint | null = null
  private _maxHint: UIHint | null = null
  private _closeHint: UIHint | null = null
  private _showHints: boolean = true
  private _showShortcuts: boolean = true
  private _folded: boolean = false
  private _foldVisible: boolean = false
  private _foldRestoreHeight: number = 0

  constructor(options?: UIWindowOptions) {
    const o = options ?? {}
    this._kind = o.kind ?? 'normal'
    const isTool = this._kind === 'tool'
    const tbStyle = o.titleBarStyle ?? (isTool ? 'tool' : 'normal')
    const isMiniDrag = tbStyle === 'mini-drag'
    this.windowId = o.id ?? `window-${++windowCounter}`
    this._title = o.title ?? 'Window'
    this._resizable = o.resizable ?? true
    this._movable = o.movable ?? true
    this.autoUnfold = o.autoUnfold ?? false
    ;(this as any).modal = o.modal ?? false
    ;(this as any).topmost = o.topmost ?? false
    this._showTitle = o.showTitle ?? true
    this._titleAlign = o.titleAlign ?? 'left'
    this._minWidth = o.minWidth ?? 150
    this._minHeight = o.minHeight ?? 80
    this._maxWidth = o.maxWidth ?? Infinity
    this._maxHeight = o.maxHeight ?? Infinity
    this._titleBarHeight = o.titleBarHeight ?? (isMiniDrag ? 14 : tbStyle === 'tool' ? 21 : 28)
    this._btnSize = Math.max(16, this._titleBarHeight - 8)

    this._allowMoveOffParent = o.allowMoveOffParent ?? true
    this._positioning = o.positioning ?? 'absolute'

    // Root element
    this.element = document.createElement('div')
    this.element.className = 'ui-window'
    this.element.dataset.uiWindow = ''
    this.element.tabIndex = -1
    this.element.style.outline = 'none'
    this.element.style.position = this._positioning
    this.element.style.left = `${o.left ?? 50}px`
    this.element.style.top = `${o.top ?? 50}px`
    this.element.style.width = `${o.width ?? 300}px`
    this.element.style.height = `${o.height ?? 200}px`
    if (o.zIndex != null) this.element.style.zIndex = `${o.zIndex}`
    if (isTool) this.element.classList.add('ui-window--tool')
    if (isMiniDrag) this.element.classList.add('ui-window--mini-drag')
    if (tbStyle === 'tool') this.element.classList.add('ui-window--tb-tool')

    // Titlebar
    this.titleBarElement = document.createElement('div')
    this.titleBarElement.className = 'ui-window__titlebar'
    this.titleBarElement.style.height = `${this._titleBarHeight}px`

    // Left slot (custom elements + icon)
    this._leftSlot = document.createElement('div')
    this._leftSlot.className = 'ui-window__left-slot'

    if (o.leftElements) {
      for (const el of o.leftElements) this._leftSlot.appendChild(el)
    }

    // Icon
    if (o.icon) {
      const iconEl = document.createElement('div')
      iconEl.className = 'ui-window__icon'
      if (typeof o.icon === 'string') {
        iconEl.innerHTML = o.icon
      } else {
        iconEl.appendChild(o.icon)
      }
      this._leftSlot.appendChild(iconEl)
    }

    this.titleBarElement.appendChild(this._leftSlot)

    // Title text
    this._titleEl = document.createElement('span')
    this._titleEl.className = 'ui-window__title'
    this._titleEl.textContent = this._title
    if (!this._showTitle) this.titleBarElement.style.display = 'none'
    if (this._titleAlign !== 'left') this._titleEl.style.textAlign = this._titleAlign
    this.titleBarElement.appendChild(this._titleEl)

    // Title hint — shows full title when truncated (ellipsis)
    this._titleHint = new UIHint({
      anchor: this._titleEl,
      content: this._title,
      trigger: 'programmatic',
      arrow: true,
    })
    this._titleEl.addEventListener('mouseenter', () => {
      if (!this._titleHint || !this._showHints) return
      const truncated = this._titleEl.scrollWidth > this._titleEl.clientWidth
      if (truncated) this._titleHint.show()
    })
    this._titleEl.addEventListener('mouseleave', () => {
      if (this._titleHint) this._titleHint.hideImmediate()
    })

    // Right slot (custom elements before standard buttons)
    this._rightSlot = document.createElement('div')
    this._rightSlot.className = 'ui-window__right-slot'

    if (o.rightElements) {
      for (const el of o.rightElements) this._rightSlot.appendChild(el)
    }

    this.titleBarElement.appendChild(this._rightSlot)

    // Standard buttons container
    this._buttonsEl = document.createElement('div')
    this._buttonsEl.className = 'ui-window__buttons'

    if (o.foldable !== false) {
      this._foldBtn = new UIToolButton({ icon: 'chevron-up', size: this._btnSize, className: 'ui-window__fold-btn' })
      this._foldBtn.onClick(() => this._toggleFold())
      // Hidden by default — show via foldable setter
      this._foldVisible = !!o.foldable
      if (!o.foldable) this._foldBtn.element.style.display = 'none'
      this._buttonsEl.appendChild(this._foldBtn.element)
    }

    const noMinMax = isTool || this.modal
    if (!noMinMax && o.minimizable !== false) {
      this._minBtn = new UIToolButton({ icon: 'window-minimize', size: this._btnSize, className: 'ui-window__min-btn' })
      this._minBtn.onClick(() => this._requestMinimize())
      this._buttonsEl.appendChild(this._minBtn.element)
    }

    if (!noMinMax && o.maximizable !== false) {
      this._maxBtn = new UIToolButton({ icon: 'window-maximize', size: this._btnSize, className: 'ui-window__max-btn' })
      this._maxBtn.onClick(() => this._requestMaximize())
      this._buttonsEl.appendChild(this._maxBtn.element)
    }

    if (o.closable !== false) {
      this._closeBtn = new UIToolButton({ icon: 'close', size: this._btnSize, className: 'ui-window__close-btn' })
      this._closeBtn.onClick(() => this._requestClose())
      this._buttonsEl.appendChild(this._closeBtn.element)
    }

    this.titleBarElement.appendChild(this._buttonsEl)

    // Hints for standard buttons
    this._showHints = o.showHints !== false
    this._showShortcuts = o.showShortcuts !== false
    if (this._showHints) {
      const hintOpts = { trigger: 'hover' as const, showDelay: 400, hideDelay: 100, arrow: true }
      if (this._foldBtn) {
        this._foldHint = new UIHint({ anchor: this._foldBtn.element, content: 'Fold', ...hintOpts })
      }
      if (this._minBtn) {
        this._minHint = new UIHint({ anchor: this._minBtn.element, content: this._hintText('Minimize', 'F7'), ...hintOpts })
      }
      if (this._maxBtn) {
        this._maxHint = new UIHint({ anchor: this._maxBtn.element, content: this._hintText('Maximize', 'F8'), ...hintOpts })
      }
      if (this._closeBtn) {
        this._closeHint = new UIHint({ anchor: this._closeBtn.element, content: this._hintText('Close', 'F9'), ...hintOpts })
      }
    }

    // Body
    this._bodyEl = document.createElement('div')
    this._bodyEl.className = 'ui-window__body'

    const scroll: ScrollMode | undefined = o.scroll
    if (scroll && scroll !== 'none') {
      // Use UIScrollBox for scrollable content
      this._scrollBox = new UIScrollBox({
        scroll,
        scrollBarSize: o.scrollBarSize ?? 'small',
        borderWidth: 0,
        backgroundColor: 'inherit',
      })
      this._scrollBox.element.style.width = '100%'
      this._scrollBox.element.style.height = '100%'
      this._bodyEl.appendChild(this._scrollBox.element)
      this._bodyEl.style.overflow = 'hidden'
      this.contentElement = this._scrollBox.contentElement
    } else {
      // No scroll — overflow hidden, no native scrollbars
      this._bodyEl.style.overflow = 'hidden'
      this.contentElement = this._bodyEl
    }

    this.element.appendChild(this.titleBarElement)
    this.element.appendChild(this._bodyEl)

    // Resize handles (all 8)
    if (this._resizable) {
      this._createResizeHandles()
    }

    // Drag
    this._bindDrag()

    // Focus trap — Tab cycles only within this window
    this._bindFocusTrap()

    // Listen for simulate-focus bubbling events
    this._cleanups.push(listenSimulateFocus(this.element, (active) => {
      this.simulateFocus = active
    }))
  }

  // ── Properties ──

  get title(): string { return this._title }
  set title(v: string) {
    this._title = v
    this._titleEl.textContent = v
    if (this._titleHint) this._titleHint.content = v
  }

  get kind(): WindowKind { return this._kind }

  get zIndex(): number { return parseInt(this.element.style.zIndex) || 0 }
  set zIndex(v: number) { this.element.style.zIndex = `${v}` }

  get positioning(): UIPosition { return this._positioning }
  set positioning(v: UIPosition) {
    this._positioning = v
    this.element.style.position = v
  }

  get allowMoveOffParent(): boolean { return this._allowMoveOffParent }
  set allowMoveOffParent(v: boolean) { this._allowMoveOffParent = v }

  get movable(): boolean { return this._movable }
  set movable(v: boolean) { this._movable = v }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this.element, v)
    if (v) {
      this.titleBarElement.classList.add('focused')
    } else {
      // Only remove focused if this window doesn't actually have real focus
      const isFocusedByManager = this.manager && (this.manager as any)._focused === this
      if (!isFocusedByManager) {
        this.titleBarElement.classList.remove('focused')
      }
    }
    // Propagate simulate-focus to all tool windows
    // But if overlord has real focus, keep tools focused
    const isFocused = this.manager && (this.manager as any)._focused === this
    for (const tool of this._tools) {
      if (!v && isFocused) {
        tool._simulateFocus = false
        applySimulateFocus(tool.element, false)
        // Keep titlebar focused since overlord has real focus
        tool.titleBarElement.classList.add('focused')
      } else {
        tool.simulateFocus = v
      }
    }
  }

  get resizable(): boolean { return this._resizable }
  set resizable(v: boolean) {
    this._resizable = v
    for (const h of this._resizeHandles) h.style.display = v ? '' : 'none'
  }

  get closable(): boolean { return !!this._closeBtn }
  set closable(v: boolean) {
    if (this._closeBtn) this._closeBtn.element.style.display = v ? '' : 'none'
    if (this._closeHint) this._closeHint.hideImmediate()
  }

  get minimizable(): boolean { return !!this._minBtn }
  set minimizable(v: boolean) {
    if (this._minBtn) this._minBtn.element.style.display = v ? '' : 'none'
  }

  get maximizable(): boolean { return !!this._maxBtn }
  set maximizable(v: boolean) {
    if (this._maxBtn) this._maxBtn.element.style.display = v ? '' : 'none'
  }

  get showTitle(): boolean { return this._showTitle }
  set showTitle(v: boolean) {
    this._showTitle = v
    this.titleBarElement.style.display = v ? '' : 'none'
  }

  get showHints(): boolean { return this._showHints }
  set showHints(v: boolean) {
    this._showHints = v
    if (this._foldHint) this._foldHint.disabled = !v
    if (this._minHint) this._minHint.disabled = !v
    if (this._maxHint) this._maxHint.disabled = !v
    if (this._closeHint) this._closeHint.disabled = !v
  }

  get showShortcuts(): boolean { return this._showShortcuts }
  set showShortcuts(v: boolean) {
    this._showShortcuts = v
    this._updateHintTexts()
  }

  get titleAlign(): TitleAlign { return this._titleAlign }
  set titleAlign(v: TitleAlign) {
    this._titleAlign = v
    this._titleEl.style.textAlign = v
  }

  get left(): number { return parseInt(this.element.style.left) || 0 }
  set left(v: number) { this.element.style.left = `${v}px` }

  get top(): number { return parseInt(this.element.style.top) || 0 }
  set top(v: number) { this.element.style.top = `${v}px` }

  get width(): number { return parseInt(this.element.style.width) || 0 }
  set width(v: number) {
    this.element.style.width = `${Math.min(this._maxWidth, Math.max(this._minWidth, v))}px`
    this._refreshScrollBox()
  }

  get height(): number { return parseInt(this.element.style.height) || 0 }
  set height(v: number) {
    this.element.style.height = `${Math.min(this._maxHeight, Math.max(this._minHeight, v))}px`
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

  /** Change scroll mode dynamically. Rebuilds the body content area. */
  setScroll(mode: ScrollMode, scrollBarSize?: 'tiny' | 'small' | 'medium' | 'large'): void {
    // Remember which element had focus (will be lost during DOM rebuild)
    const prevFocused = document.activeElement as HTMLElement | null
    const hadFocusInBody = prevFocused && this._bodyEl.contains(prevFocused)

    // Save current body children
    const children: Node[] = []
    const source = this.contentElement
    while (source.firstChild) {
      children.push(source.removeChild(source.firstChild))
    }

    // Destroy existing scrollbox
    if (this._scrollBox) {
      this._scrollBox.destroy()
      this._scrollBox = null
    }

    // Clear body
    this._bodyEl.innerHTML = ''

    if (mode !== 'none') {
      this._scrollBox = new UIScrollBox({
        scroll: mode,
        scrollBarSize: scrollBarSize ?? 'small',
        borderWidth: 0,
        backgroundColor: 'inherit',
      })
      this._scrollBox.element.style.width = '100%'
      this._scrollBox.element.style.height = '100%'
      this._bodyEl.appendChild(this._scrollBox.element)
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._scrollBox.contentElement
    } else {
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._bodyEl
    }

    // Restore children
    for (const child of children) {
      this.contentElement.appendChild(child)
    }

    // Restore focus that was lost during DOM rebuild
    if (hadFocusInBody && prevFocused && this._bodyEl.contains(prevFocused)) {
      prevFocused.focus({ preventScroll: true })
    }

    // Auto-detect content size for scrollbox and make focused element visible
    if (this._scrollBox) {
      requestAnimationFrame(() => {
        if (!this._scrollBox) return
        const content = this._scrollBox.contentElement
        this._scrollBox.contentWidth = content.scrollWidth
        this._scrollBox.contentHeight = content.scrollHeight
        this._scrollBox.refresh()
        // Make the previously focused element visible
        if (hadFocusInBody && prevFocused && this.contentElement.contains(prevFocused)) {
          this._scrollBox.scrollIntoView(prevFocused)
        }
      })
    }
  }

  // ── Tool windows ──

  get tools(): readonly UIWindow[] { return this._tools }
  get overlord(): UIWindow | null { return this._overlord }
  get isTool(): boolean { return this._overlord !== null }

  /** Attach a window as a tool of this window */
  addTool(win: UIWindow): boolean {
    // Reject if: already a tool, already has tools, is self, already in our list
    if (win._overlord) return false
    if (win._tools.length > 0) return false
    if (win === this) return false
    if (this._overlord) return false // we are a tool ourselves
    if (this._tools.includes(win)) return false

    this._tools.push(win)
    win._overlord = this
    // Force kind to tool
    ;(win as any)._kind = 'tool'
    win.element.classList.add('ui-window--tool')
    // Remove min/max buttons if they exist
    if (win._minBtn) { win._minBtn.element.style.display = 'none' }
    if (win._maxBtn) { win._maxBtn.element.style.display = 'none' }
    // Adjust titlebar height for tool
    win.titleBarElement.style.height = '21px'
    // Remove tool from z-order lists (it's positioned via overlord now)
    if (this.manager) {
      (this.manager as any)._removeFromZOrder(win)
    }
    // If overlord has focus, give tool the focused titlebar too
    if (this.titleBarElement.classList.contains('focused')) {
      win.titleBarElement.classList.add('focused')
    }
    // Register mousedown to bring overlord to front when tool is clicked
    if (this.manager) {
      const handler = () => this.manager!.bringToFront(win)
      win.element.addEventListener('mousedown', handler, true)
      ;(win as any).__wm_tool_mousedown = handler
    }
    // Reassign z-indexes
    if (this.manager) {
      (this.manager as any)._reassignZIndexes()
    }

    return true
  }

  /** Detach a tool window */
  removeTool(win: UIWindow): boolean {
    const idx = this._tools.indexOf(win)
    if (idx === -1) return false

    this._tools.splice(idx, 1)
    win._overlord = null
    // Remove tool mousedown handler
    const toolHandler = (win as any).__wm_tool_mousedown
    if (toolHandler) {
      win.element.removeEventListener('mousedown', toolHandler, true)
      delete (win as any).__wm_tool_mousedown
    }
    // Restore kind to normal
    ;(win as any)._kind = 'normal'
    win.element.classList.remove('ui-window--tool')
    // Restore min/max buttons
    if (win._minBtn) { win._minBtn.element.style.display = '' }
    if (win._maxBtn) { win._maxBtn.element.style.display = '' }
    // Restore titlebar height
    win.titleBarElement.style.height = ''
    // Re-add to z-order list
    if (this.manager) {
      (this.manager as any)._zOrderFor(win).push(win)
      ;(this.manager as any)._reassignZIndexes()
    }

    return true
  }

  // ── Custom elements ──

  addLeftElement(el: HTMLElement): void {
    this._leftSlot.appendChild(el)
  }

  addRightElement(el: HTMLElement): void {
    this._rightSlot.appendChild(el)
  }

  get folded(): boolean { return this._folded }

  get foldable(): boolean { return this._foldVisible }
  set foldable(v: boolean) {
    this._foldVisible = v
    if (this._foldBtn) this._foldBtn.element.style.display = v ? '' : 'none'
    if (!v && this._folded) this._unfold()
  }

  autoUnfold: boolean = false

  /** Programmatic fold */
  fold(): void { this._fold() }

  /** Programmatic unfold */
  unfold(): void { this._unfold() }

  private _toggleFold(): void {
    if (this.windowState !== 'normal') return
    if (this._folded) {
      this._unfold()
    } else {
      this._fold()
    }
  }

  private _fold(): void {
    if (this._folded || this.windowState !== 'normal') return
    // 1. UIWindow before-fold (cancelable)
    if (!this._emitWindowEvent('before-fold', { folding: true })) return
    // 2. Manager before-fold (cancelable)
    if (this.manager) {
      const detail = { child: this as IWindowChild, folding: true, cancelled: false }
      this.manager.core.emit('before-fold', detail)
      if (detail.cancelled) return
    }
    // 3. Action
    this._folded = true
    this._foldRestoreHeight = this.height
    this.element.classList.add('wm-anim')
    void this.element.offsetHeight
    this._bodyEl.classList.add('ui-window__body--hidden')
    this._setResizeHandlesVisible(false)
    this.element.style.height = `${this._titleBarHeight}px`
    const cleanup = () => { this.element.classList.remove('wm-anim') }
    const onEnd = (e: Event) => { if (e.target === this.element) { cleanup(); this.element.removeEventListener('transitionend', onEnd) } }
    this.element.addEventListener('transitionend', onEnd)
    setTimeout(cleanup, 250)
    if (this._foldBtn) this._foldBtn.icon = 'chevron-down'
    this._updateHintTexts()
    // 4. UIWindow notification
    this._emitWindowEvent('fold', { folded: true })
    // 5. Manager notification
    if (this.manager) this.manager.core.emit('window-fold', { child: this, folded: true })
  }

  private _unfold(): void {
    if (!this._folded) return
    // 1. UIWindow before-fold (cancelable)
    if (!this._emitWindowEvent('before-fold', { folding: false })) return
    // 2. Manager before-fold (cancelable)
    if (this.manager) {
      const detail = { child: this as IWindowChild, folding: false, cancelled: false }
      this.manager.core.emit('before-fold', detail)
      if (detail.cancelled) return
    }
    // 3. Action
    this._folded = false
    this._bodyEl.classList.remove('ui-window__body--hidden')
    this._setResizeHandlesVisible(this._resizable)
    this.element.classList.add('wm-anim')
    void this.element.offsetHeight
    this.element.style.height = `${this._foldRestoreHeight}px`
    const cleanup = () => { this.element.classList.remove('wm-anim') }
    const onEnd = (e: Event) => { if (e.target === this.element) { cleanup(); this.element.removeEventListener('transitionend', onEnd) } }
    this.element.addEventListener('transitionend', onEnd)
    setTimeout(cleanup, 250)
    if (this._foldBtn) this._foldBtn.icon = 'chevron-up'
    this._updateHintTexts()
    // 4. UIWindow notification
    this._emitWindowEvent('fold', { folded: false })
    // 5. Manager notification
    if (this.manager) this.manager.core.emit('window-fold', { child: this, folded: false })
  }

  /** Flash the titlebar and shake the window to attract attention without stealing focus */
  flash(count: number = 3): void {
    if (this._destroyed) return
    this.element.classList.add('ui-window--flash')
    const duration = count * 300
    setTimeout(() => {
      this.element.classList.remove('ui-window--flash')
    }, duration)
  }

  // ── IWindowChild implementation ──

  onFocused(): void {
    this.titleBarElement.classList.add('focused')
    const parent = this.element.parentElement
    if (parent) {
      parent.querySelectorAll('.ui-window__titlebar.focused').forEach(el => {
        const isOurTool = this._tools.some(t => t.titleBarElement === el)
        const winEl = el.closest('.ui-window')
        const hasSimFocus = winEl ? winEl.hasAttribute('data-simulate-focus') : false
        if (el !== this.titleBarElement && !isOurTool && !hasSimFocus) el.classList.remove('focused')
      })
    }
    // Restore last focused element, or fall back to first focusable
    if (this._lastFocusedEl && this._containsFocusable(this._lastFocusedEl)) {
      this._lastFocusedEl.focus({ preventScroll: true })
    } else {
      const els = this._getAllGroupFocusable()
      if (els.length > 0) els[0].focus({ preventScroll: true })
    }
    if (!this._hasActiveHScroll()) this._bodyEl.scrollLeft = 0
    if (!this._hasActiveVScroll()) this._bodyEl.scrollTop = 0
    // Focus all tools' titlebars too
    for (const tool of this._tools) {
      tool.titleBarElement.classList.add('focused')
    }
  }

  onBlurred(): void {
    // Don't remove focused if simulateFocus is active
    if (!this._simulateFocus) this.titleBarElement.classList.remove('focused')
    // Blur all tools' titlebars too
    for (const tool of this._tools) {
      tool.titleBarElement.classList.remove('focused')
    }
  }

  private _minimizedFocusEl: HTMLElement | null = null

  onMinimized(): void {
    // Save focused element before hiding body
    this._minimizedFocusEl = this._lastFocusedEl
    this.titleBarElement.classList.remove('focused')
    this._bodyEl.classList.add('ui-window__body--hidden')
    this._setResizeHandlesVisible(false)
    if (this._foldBtn) this._foldBtn.element.style.display = 'none'
    if (this._minBtn) this._minBtn.icon = 'window-restore'
    if (this._maxBtn) this._maxBtn.icon = 'window-maximize'
    this._updateHintTexts('minimized')
    // Hide all tool windows
    for (const tool of this._tools) tool.visible = false
  }

  onRestored(): void {
    // If folded, restore to folded state (body hidden, titlebar height)
    if (this._folded && !this.autoUnfold) {
      this._bodyEl.classList.add('ui-window__body--hidden')
      this._setResizeHandlesVisible(false)
      this.element.style.height = `${this._titleBarHeight}px`
    } else {
      if (this._folded) this._unfold()
      this._bodyEl.classList.remove('ui-window__body--hidden')
      this._setResizeHandlesVisible(this._resizable)
    }
    if (this._foldBtn && this.foldable) this._foldBtn.element.style.display = ''
    if (this._maxBtn) this._maxBtn.icon = 'window-maximize'
    if (this._minBtn) this._minBtn.icon = 'window-minimize'
    this._updateHintTexts('normal')
    // Show all tool windows and reassign z-indexes
    for (const tool of this._tools) tool.visible = true
    if (this.manager) {
      ;(this.manager as any)._reassignZIndexes()
    }
    // Restore focus to element that had focus before minimize
    const restoreEl = this._minimizedFocusEl
    this._minimizedFocusEl = null
    if (restoreEl && this._containsFocusable(restoreEl)) {
      restoreEl.focus({ preventScroll: true })
    }
  }

  onMaximized(): void {
    this._bodyEl.classList.remove('ui-window__body--hidden')
    this._setResizeHandlesVisible(false)
    if (this._foldBtn) this._foldBtn.element.style.display = 'none'
    if (this._maxBtn) this._maxBtn.icon = 'window-restore'
    if (this._minBtn) this._minBtn.icon = 'window-minimize'
    this._updateHintTexts('maximized')
  }

  onClosed(): void {
    // Close all tool windows
    for (const tool of [...this._tools]) {
      if (this.manager) this.manager.closeChild(tool)
    }
    // Detach from overlord if we are a tool
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

  get visible(): boolean { return this.element.style.display !== 'none' }
  set visible(v: boolean) { this.element.style.display = v ? '' : 'none' }

  // ── Manager requests ──

  private _requestClose(): void {
    // 1. UIWindow before-close (cancelable)
    if (!this._emitWindowEvent('before-close')) return
    // 2. Manager before-close (cancelable) + action
    if (this.manager) {
      if (!this.manager.closeChild(this)) return
    } else {
      this.onClosed()
    }
    // 3. UIWindow notification
    this._emitWindowEvent('close')
  }

  private _requestMinimize(): void {
    if (this._kind === 'tool' || this.modal) return
    if (this.windowState === 'minimized') {
      // Restore
      if (!this._emitWindowEvent('before-restore')) return
      if (this.manager) {
        if (!this.manager.restoreChild(this)) return
      } else {
        this.windowState = 'normal'
        this.onRestored?.()
      }
      this._emitWindowEvent('restore')
    } else {
      // Minimize
      if (!this._emitWindowEvent('before-minimize')) return
      if (this.manager) {
        if (!this.manager.minimizeChild(this)) return
      } else {
        this.windowState = 'minimized'
        this.onMinimized?.()
      }
      this._emitWindowEvent('minimize')
    }
  }

  private _requestMaximize(): void {
    if (this._kind === 'tool' || this.modal) return
    if (this.windowState === 'maximized') {
      // Restore
      if (!this._emitWindowEvent('before-restore')) return
      if (this.manager) {
        if (!this.manager.restoreMaximized(this)) return
      } else {
        this.windowState = 'normal'
        this.onRestored?.()
      }
      this._emitWindowEvent('restore')
    } else {
      // Maximize
      if (!this._emitWindowEvent('before-maximize')) return
      if (this.manager) {
        if (!this.manager.maximizeChild(this)) return
      } else {
        this.windowState = 'maximized'
        if ('onMaximized' in this && typeof (this as any).onMaximized === 'function') {
          ;(this as any).onMaximized()
        }
      }
      this._emitWindowEvent('maximize')
    }
  }

  // ── Drag ──

  private _emitWindowEvent(name: string, detail?: Record<string, any>): boolean {
    const event = new CustomEvent(name, { bubbles: true, cancelable: true, detail: detail ?? {} })
    return this.element.dispatchEvent(event) // returns false if cancelled
  }

  private _bindDrag(): void {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.ui-window__buttons')) return
      if ((e.target as HTMLElement).closest('.ui-window__right-slot')) return
      if (!this._movable) return
      if (this.windowState === 'maximized' || this.windowState === 'minimized') return

      e.preventDefault()

      const startLeft = this.left
      const startTop = this.top

      // Emit start-drag (cancelable)
      if (!this._emitWindowEvent('start-drag', { left: startLeft, top: startTop, width: this.width, height: this.height })) return

      this._dragging = true
      this._dragStartX = e.clientX
      this._dragStartY = e.clientY
      this._dragStartLeft = startLeft
      this._dragStartTop = startTop

      if (this.manager) this.manager.bringToFront(this)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this._dragging) return

      // Stop dragging if cursor leaves manager bounds
      const mgrEl = this._getManagerElement()
      if (mgrEl) {
        const mgrRect = mgrEl.getBoundingClientRect()
        if (e.clientX < mgrRect.left || e.clientX > mgrRect.right ||
            e.clientY < mgrRect.top || e.clientY > mgrRect.bottom) return
      }

      const dx = e.clientX - this._dragStartX
      const dy = e.clientY - this._dragStartY
      const newLeft = this._dragStartLeft + dx
      const newTop = this._dragStartTop + dy

      // Emit dragging (cancelable — cancel stops further movement)
      if (!this._emitWindowEvent('dragging', { left: newLeft, top: newTop, width: this.width, height: this.height })) {
        this._dragging = false
        return
      }

      // Clamp to manager bounds (unless allowMoveOffParent)
      if (this.manager && !this._allowMoveOffParent) {
        const mgrW = this.manager.element.clientWidth
        const mgrH = this.manager.element.clientHeight
        this.left = Math.max(0, Math.min(newLeft, mgrW - this.width))
        this.top = Math.max(0, Math.min(newTop, mgrH - this.height))
      } else {
        this.left = newLeft
        this.top = newTop
      }
      if (this.manager) this.manager.notifyDrag(this, this.left, this.top)
    }

    const onMouseUp = () => {
      if (!this._dragging) return
      this._dragging = false

      // Emit end-drag (cancelable — cancel reverts to start position)
      if (!this._emitWindowEvent('end-drag', { left: this.left, top: this.top, width: this.width, height: this.height })) {
        this.left = this._dragStartLeft
        this.top = this._dragStartTop
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

  // ── Resize (all 8 handles) ──

  /** Resolve the manager element: own manager, or overlord's manager */
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
      this.element.appendChild(handle)
      this._resizeHandles.push(handle)

      let startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0
      let resizing = false

      const onMouseDown = (e: MouseEvent) => {
        if (this.windowState !== 'normal') return
        e.preventDefault()
        e.stopPropagation()

        // Emit start-resize (cancelable)
        if (!this._emitWindowEvent('start-resize', { left: this.left, top: this.top, width: this.width, height: this.height })) return

        resizing = true
        startX = e.clientX; startY = e.clientY
        startW = this.width; startH = this.height
        startL = this.left; startT = this.top
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!resizing) return

        // Stop resizing if cursor leaves manager bounds
        const mgrEl = this._getManagerElement()
        if (mgrEl) {
          const mgrRect = mgrEl.getBoundingClientRect()
          if (e.clientX < mgrRect.left || e.clientX > mgrRect.right ||
              e.clientY < mgrRect.top || e.clientY > mgrRect.bottom) return
        }

        onDrag(e.clientX - startX, e.clientY - startY, startW, startH, startL, startT)

        // Clamp to manager bounds during resize (unless allowMoveOffParent)
        if (this.manager && !this._allowMoveOffParent) {
          const mgrW = this.manager.element.clientWidth
          const mgrH = this.manager.element.clientHeight
          if (this.left < 0) { this.width += this.left; this.left = 0 }
          if (this.top < 0) { this.height += this.top; this.top = 0 }
          if (this.left + this.width > mgrW) this.width = mgrW - this.left
          if (this.top + this.height > mgrH) this.height = mgrH - this.top
        }

        // Emit resizing (cancelable — cancel stops further resizing)
        if (!this._emitWindowEvent('resizing', { left: this.left, top: this.top, width: this.width, height: this.height })) {
          resizing = false
          return
        }

        if (this.manager) this.manager.notifyResize(this, this.width, this.height)
      }

      const onMouseUp = () => {
        if (!resizing) return
        resizing = false

        // Emit end-resize (cancelable — cancel reverts to start size)
        if (!this._emitWindowEvent('end-resize', { left: this.left, top: this.top, width: this.width, height: this.height })) {
          this.left = startL
          this.top = startT
          this.width = startW
          this.height = startH
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

    // East
    makeHandle('ui-window__resize-e', (dx, _dy, sw) => { this.width = sw + dx })
    // West
    makeHandle('ui-window__resize-w', (dx, _dy, sw, _sh, sl) => {
      const newW = clampW(sw - dx)
      this.left = sl + (sw - newW)
      this.width = newW
    })
    // South
    makeHandle('ui-window__resize-s', (_dx, dy, _sw, sh) => { this.height = sh + dy })
    // North
    makeHandle('ui-window__resize-n', (_dx, dy, _sw, sh, _sl, st) => {
      const newH = clampH(sh - dy)
      this.top = st + (sh - newH)
      this.height = newH
    })
    // Southeast
    makeHandle('ui-window__resize-se', (dx, dy, sw, sh) => { this.width = sw + dx; this.height = sh + dy })
    // Southwest
    makeHandle('ui-window__resize-sw', (dx, dy, sw, sh, sl) => {
      const newW = clampW(sw - dx)
      this.left = sl + (sw - newW)
      this.width = newW
      this.height = sh + dy
    })
    // Northeast
    makeHandle('ui-window__resize-ne', (dx, dy, sw, sh, _sl, st) => {
      this.width = sw + dx
      const newH = clampH(sh - dy)
      this.top = st + (sh - newH)
      this.height = newH
    })
    // Northwest
    makeHandle('ui-window__resize-nw', (dx, dy, sw, sh, sl, st) => {
      const newW = clampW(sw - dx)
      this.left = sl + (sw - newW)
      this.width = newW
      const newH = clampH(sh - dy)
      this.top = st + (sh - newH)
      this.height = newH
    })
  }

  // ── Scroll helpers ──

  private _hasActiveHScroll(): boolean {
    if (!this._scrollBox) return false
    const sb = this._scrollBox.hScrollBottom ?? this._scrollBox.hScrollTop
    return sb !== null && sb.element.style.display !== 'none'
  }

  private _hasActiveVScroll(): boolean {
    if (!this._scrollBox) return false
    const sb = this._scrollBox.vScrollRight ?? this._scrollBox.vScrollLeft
    return sb !== null && sb.element.style.display !== 'none'
  }

  // ── Focus cycle ──
  // Tab/Shift+Tab cycles through [data-focusable] children in the body.
  // The window just calls .focus() — each child handles its own visual focus.
  // Titlebar buttons are NOT part of the cycle.

  private _lastFocusedEl: HTMLElement | null = null

  /** Reset last focused element so next focus cycle starts from the first child */
  resetLastFocused(): void {
    this._lastFocusedEl = null
  }

  private static _nativeFocusable = /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/

  private _getBodyFocusable(): HTMLElement[] {
    return Array.from(this._bodyEl.querySelectorAll('[data-focusable]')).filter(el => {
      if ((el as HTMLInputElement).disabled) return false
      // Element must be programmatically focusable
      if (el.hasAttribute('tabindex')) return true
      if (UIWindow._nativeFocusable.test(el.tagName)) return true
      // Custom elements with delegatesFocus shadow roots
      if (el.shadowRoot?.delegatesFocus) return true
      return false
    }) as HTMLElement[]
  }

  /** Get all focusable elements from this window + its tools (for overlord) */
  private _getAllGroupFocusable(): HTMLElement[] {
    const els = [...this._getBodyFocusable()]
    for (const tool of this._tools) {
      els.push(...tool._getBodyFocusable())
    }
    return els
  }

  /** Check if an element is inside this window or any of its tools */
  private _containsFocusable(el: HTMLElement): boolean {
    if (this._bodyEl.contains(el)) return true
    for (const tool of this._tools) {
      if (tool._bodyEl.contains(el)) return true
    }
    return false
  }

  /** Get the overlord window (self if not a tool) for group operations */
  private get _groupOwner(): UIWindow {
    return this._overlord ?? this
  }

  private _bindFocusTrap(): void {
    // Track which element last had focus inside the body (or tools)
    this._bodyEl.addEventListener('focusin', (e: Event) => {
      const target = e.target as HTMLElement
      if (target && target !== this._bodyEl) {
        this._lastFocusedEl = target
        // Also track in overlord if we are a tool
        if (this._overlord) this._overlord._lastFocusedEl = target
        // Scroll focused element into view
        if (this._scrollBox) this._scrollBox.scrollIntoView(target)
      }
    })

    // Click on body: focus the target if [data-focusable], otherwise prevent focus loss
    this._bodyEl.addEventListener('mousedown', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-focusable]') as HTMLElement | null
      if (target) {
        target.focus()
      } else {
        // Clicking empty body area — prevent browser from moving focus away
        e.preventDefault()
      }
    })

    // Tab/Shift+Tab cycle within body focusable elements (including tools)
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!this.titleBarElement.classList.contains('focused')) return
      // Only handle Tab if real DOM focus is within this window or its tools
      if (!this._containsFocusable(document.activeElement as HTMLElement) && document.activeElement !== this.element) return
      // Only the group owner (overlord) handles Tab for the entire group
      if (this._overlord) return

      // Use group owner's full focusable list (overlord + tools)
      const owner = this._groupOwner
      const els = owner._getAllGroupFocusable()
      if (els.length === 0) return

      e.preventDefault()

      // Find current focused index
      const active = document.activeElement as HTMLElement
      let idx = -1
      for (let i = 0; i < els.length; i++) {
        if (els[i] === active || els[i].contains(active)) { idx = i; break }
      }

      let target: HTMLElement
      if (e.shiftKey) {
        const prev = idx <= 0 ? els.length - 1 : idx - 1
        target = els[prev]
      } else {
        const next = (idx + 1) % els.length
        target = els[next]
      }
      target.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', handler, true)
    this._cleanups.push(() => document.removeEventListener('keydown', handler, true))
  }

  // ── Destroy ──

  /** The UIScrollBox instance if scroll is enabled, null otherwise */
  get scrollBox(): UIScrollBox | null { return this._scrollBox }

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
    if (this.element.parentNode) this.element.parentNode.removeChild(this.element)
  }

  get isDestroyed(): boolean { return this._destroyed }
}
