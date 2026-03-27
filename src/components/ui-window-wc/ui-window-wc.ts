import { UIToolButton } from '../common/ui-tool-button-core'
import { applySimulateFocus, listenSimulateFocus } from '../common/simulate-focus'
import { HintWC } from '../ui-hint-wc/ui-hint-wc'
import { ScrollBoxWC } from '../ui-scrollbox-wc/ui-scrollbox-wc'
import type { IWindowChild, WindowState, WindowKind, UIPosition, UIWindowOptions, ScrollMode, TitleAlign } from '../common/types'
import type { WindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'
import cssText from './ui-window-wc.css?inline'

let windowCounter = 0

export class WindowWC extends HTMLElement implements IWindowChild {
  readonly windowId: string
  contentElement!: HTMLDivElement
  readonly titleBarElement: HTMLDivElement
  private _scrollBox: ScrollBoxWC | null = null
  private _bodyEl!: HTMLDivElement

  windowState: WindowState = 'normal'
  readonly isFloating: boolean = true
  readonly modal: boolean = false
  readonly topmost: boolean = false

  manager: WindowManagerWC | null = null

  private _tools: WindowWC[] = []
  private _overlord: WindowWC | null = null

  private _shadow: ShadowRoot
  private _title: string
  private _titleEl!: HTMLSpanElement
  private _buttonsEl!: HTMLDivElement
  private _leftSlot!: HTMLDivElement
  private _rightSlot!: HTMLDivElement
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
  private _titleHint: HintWC | null = null
  private _foldHint: HintWC | null = null
  private _minHint: HintWC | null = null
  private _maxHint: HintWC | null = null
  private _closeHint: HintWC | null = null
  private _showHints: boolean = true
  private _showShortcuts: boolean = true
  private _folded: boolean = false
  private _foldVisible: boolean = false
  private _foldRestoreHeight: number = 0

  constructor(options?: UIWindowOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)

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
    this._leftSlot = document.createElement('div')
    this._leftSlot.className = 'left-slot'

    if (o.leftElements) {
      for (const el of o.leftElements) this._leftSlot.appendChild(el)
    }

    if (o.icon) {
      const iconEl = document.createElement('div')
      iconEl.className = 'icon'
      if (typeof o.icon === 'string') iconEl.innerHTML = o.icon
      else iconEl.appendChild(o.icon)
      this._leftSlot.appendChild(iconEl)
    }

    this.titleBarElement.appendChild(this._leftSlot)

    // Title
    this._titleEl = document.createElement('span')
    this._titleEl.className = 'title'
    this._titleEl.textContent = this._title
    if (!this._showTitle) this.titleBarElement.style.display = 'none'
    if (this._titleAlign !== 'left') this._titleEl.style.textAlign = this._titleAlign
    this.titleBarElement.appendChild(this._titleEl)

    // Title hint
    this._titleHint = new HintWC()
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
    this._rightSlot = document.createElement('div')
    this._rightSlot.className = 'right-slot'
    if (o.rightElements) {
      for (const el of o.rightElements) this._rightSlot.appendChild(el)
    }
    this.titleBarElement.appendChild(this._rightSlot)

    // Buttons
    this._buttonsEl = document.createElement('div')
    this._buttonsEl.className = 'buttons'

    if (o.foldable !== false) {
      this._foldBtn = new UIToolButton({ icon: 'chevron-up', size: this._btnSize, className: 'fold-btn' })
      this._foldBtn.onClick(() => this._toggleFold())
      this._foldVisible = !!o.foldable
      if (!o.foldable) this._foldBtn.element.style.display = 'none'
      this._buttonsEl.appendChild(this._foldBtn.element)
    }

    const noMinMax = isTool || this.modal
    if (!noMinMax && o.minimizable !== false) {
      this._minBtn = new UIToolButton({ icon: 'window-minimize', size: this._btnSize, className: 'min-btn' })
      this._minBtn.onClick(() => this._requestMinimize())
      this._buttonsEl.appendChild(this._minBtn.element)
    }

    if (!noMinMax && o.maximizable !== false) {
      this._maxBtn = new UIToolButton({ icon: 'window-maximize', size: this._btnSize, className: 'max-btn' })
      this._maxBtn.onClick(() => this._requestMaximize())
      this._buttonsEl.appendChild(this._maxBtn.element)
    }

    if (o.closable !== false) {
      this._closeBtn = new UIToolButton({ icon: 'close', size: this._btnSize, className: 'close-btn' })
      this._closeBtn.onClick(() => this._requestClose())
      this._buttonsEl.appendChild(this._closeBtn.element)
    }

    this.titleBarElement.appendChild(this._buttonsEl)

    // Hints
    this._showHints = o.showHints !== false
    this._showShortcuts = o.showShortcuts !== false
    if (this._showHints) {
      const makeHint = (anchor: HTMLElement, text: string): HintWC => {
        const h = new HintWC()
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

    const scroll: ScrollMode | undefined = o.scroll
    if (scroll && scroll !== 'none') {
      this._scrollBox = document.createElement('scrollbox-wc') as unknown as ScrollBoxWC
      this._scrollBox.configure({
        scroll,
        scrollBarSize: o.scrollBarSize ?? 'small',
        borderWidth: 0,
        backgroundColor: 'inherit',
      })
      this._scrollBox.style.width = '100%'
      this._scrollBox.style.height = '100%'
      this._bodyEl.appendChild(this._scrollBox)
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._scrollBox.contentElement
    } else {
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._bodyEl
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
      this._scrollBox = document.createElement('scrollbox-wc') as unknown as ScrollBoxWC
      this._scrollBox.configure({ scroll: mode, scrollBarSize: scrollBarSize ?? 'small', borderWidth: 0, backgroundColor: 'inherit' })
      this._scrollBox.style.width = '100%'
      this._scrollBox.style.height = '100%'
      this._bodyEl.appendChild(this._scrollBox)
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._scrollBox.contentElement
    } else {
      this._bodyEl.style.overflow = 'hidden'
      ;(this as any).contentElement = this._bodyEl
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

  get tools(): readonly WindowWC[] { return this._tools }
  get overlord(): WindowWC | null { return this._overlord }
  get isTool(): boolean { return this._overlord !== null }

  addTool(win: WindowWC): boolean {
    if (win._overlord || win._tools.length > 0 || win === this || this._overlord || this._tools.includes(win)) return false
    this._tools.push(win)
    win._overlord = this
    ;(win as any)._kind = 'tool'
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

  removeTool(win: WindowWC): boolean {
    const idx = this._tools.indexOf(win)
    if (idx === -1) return false
    this._tools.splice(idx, 1)
    win._overlord = null
    const toolHandler = (win as any).__wm_tool_mousedown
    if (toolHandler) { win.removeEventListener('mousedown', toolHandler, true); delete (win as any).__wm_tool_mousedown }
    ;(win as any)._kind = 'normal'
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

  addLeftElement(el: HTMLElement): void { this._leftSlot.appendChild(el) }
  addRightElement(el: HTMLElement): void { this._rightSlot.appendChild(el) }

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
        const wc = el as WindowWC
        const isOurTool = this._tools.includes(wc)
        const hasSimFocus = wc.hasAttribute('data-simulate-focus')
        if (wc !== this && !isOurTool && !hasSimFocus) wc.titleBarElement.classList.remove('focused')
      })
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

  get scrollBox(): ScrollBoxWC | null { return this._scrollBox }

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

  private _getBodyFocusable(): HTMLElement[] {
    return Array.from(this._bodyEl.querySelectorAll('[data-focusable]')).filter(el => {
      if ((el as HTMLInputElement).disabled) return false
      if (el.hasAttribute('tabindex')) return true
      if (WindowWC._nativeFocusable.test(el.tagName)) return true
      if (el.shadowRoot?.delegatesFocus) return true
      return false
    }) as HTMLElement[]
  }

  private _getAllGroupFocusable(): HTMLElement[] {
    const els = [...this._getBodyFocusable()]
    for (const tool of this._tools) els.push(...tool._getBodyFocusable())
    return els
  }

  private _containsFocusable(el: HTMLElement): boolean {
    if (this._bodyEl.contains(el)) return true
    for (const tool of this._tools) { if (tool._bodyEl.contains(el)) return true }
    return false
  }

  private get _groupOwner(): WindowWC { return this._overlord ?? this }

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

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (!this.titleBarElement.classList.contains('focused')) return
      if (!this._containsFocusable(document.activeElement as HTMLElement) && document.activeElement !== this) return
      if (this._overlord) return

      const owner = this._groupOwner
      const els = owner._getAllGroupFocusable()
      if (els.length === 0) return
      e.preventDefault()
      const active = document.activeElement as HTMLElement
      let idx = -1
      for (let i = 0; i < els.length; i++) { if (els[i] === active || els[i].contains(active)) { idx = i; break } }
      const target = e.shiftKey
        ? els[idx <= 0 ? els.length - 1 : idx - 1]
        : els[(idx + 1) % els.length]
      target.focus({ preventScroll: true })
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

customElements.define('window-wc', WindowWC)
