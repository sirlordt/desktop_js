import { UIPanelWC } from '../ui-panel-wc/ui-panel-wc'
import type { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import type { IWindowChild, WindowChildInfo, UIWindowManagerOptions, WindowCycleShortcut, WindowState } from '../common/types'

const Z_BASE = 10
const Z_STEP = 10
const ANIM_DURATION = 200

/**
 * <window-manager-wc> — Web Component window manager.
 * Extends UIPanelWC and manages UIWindowWC instances with z-ordering,
 * focus management, minimize grid, maximize, modal backdrops, and animations.
 */
export class UIWindowManagerWC extends UIPanelWC {
  private _windows: IWindowChild[] = []
  private _zOrder: IWindowChild[] = []
  private _zOrderTopmost: IWindowChild[] = []
  private _focused: IWindowChild | null = null
  private _animating: Set<IWindowChild> = new Set()
  private _modalStack: { child: IWindowChild; backdrop: HTMLDivElement }[] = []

  private _minimizeSlots: (IWindowChild | null)[] = []
  minimizeSlotWidth: number = 160
  minimizeSlotHeight: number = 28

  private _cycleNext: WindowCycleShortcut = { key: 'F6', altKey: true }
  private _cyclePrev: WindowCycleShortcut = { key: 'F6', altKey: true, shiftKey: true }

  animated: boolean = true
  /** When true, disables the MutationObserver that auto-detects <window-wc>
   *  children. Use this in framework environments (React, Vue, etc.) where
   *  the framework controls DOM mutations — call addWindow()/removeWindow()
   *  explicitly instead. */
  manualChildManagement: boolean = false
  private _batchOp: boolean = false
  private _managerInitialized: boolean = false
  private _childObserver: MutationObserver | null = null
  private _focusOutHandler: ((e: MouseEvent) => void) | null = null

  static get observedAttributes(): string[] {
    return [...UIPanelWC.observedAttributes, 'animated', 'minimize-slot-width', 'minimize-slot-height', 'manual-child-management']
  }

  constructor(options?: UIWindowManagerOptions) {
    super()
    if (options) this.configureManager(options)
  }

  /**
   * Configure the window manager programmatically.
   */
  configureManager(options: UIWindowManagerOptions): void {
    this.configure({
      width: options.width,
      height: options.height,
      bg: options.bg ?? 'var(--window-bg-color)',
      borderColor: options.borderColor,
      position: 'relative',
    })

    this.style.position = 'relative'
    this.style.overflow = 'hidden'
    if (options.width) this.style.width = `${options.width}px`
    if (options.height) this.style.height = `${options.height}px`
    this.tabIndex = -1
    this.style.outline = 'none'
    if (options.className) this.classList.add(...options.className.split(/\s+/))

    if (options.cycleNextShortcut) this._cycleNext = options.cycleNextShortcut
    if (options.cyclePrevShortcut) this._cyclePrev = options.cyclePrevShortcut
    if (options.manualChildManagement != null) this.manualChildManagement = options.manualChildManagement

    this._ensureManagerInit()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._ensureManagerInit()

    // Set basic styles if not configured
    if (this.style.position !== 'relative') {
      this.style.position = 'relative'
      this.style.overflow = 'hidden'
      this.tabIndex = -1
      this.style.outline = 'none'
    }

    // Blur focused window when a mousedown occurs outside the WM
    if (!this._focusOutHandler) {
      this._focusOutHandler = ((e: MouseEvent) => {
        if (!this._focused) return
        const path = e.composedPath()
        if (path.includes(this)) return
        this._focused.onBlurred?.()
        this._focused = null
      }) as any
      document.addEventListener('mousedown', this._focusOutHandler as any, true)
    }

    // Auto-detect existing <window-wc> children (skip in manual mode)
    if (!this.manualChildManagement) {
      for (const child of Array.from(this.children)) {
        if (child.tagName === 'WINDOW-WC' && !this._windows.includes(child as unknown as IWindowChild)) {
          this.addWindow(child as unknown as IWindowChild)
        }
      }
    }

    // Observe future child additions/removals (skip in manual mode)
    if (!this.manualChildManagement && !this._childObserver) {
      this._childObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (node instanceof HTMLElement && node.tagName === 'WINDOW-WC' &&
                !this._windows.includes(node as unknown as IWindowChild)) {
              this.addWindow(node as unknown as IWindowChild)
            }
          }
          for (const node of Array.from(m.removedNodes)) {
            if (node instanceof HTMLElement && node.tagName === 'WINDOW-WC') {
              this.removeWindow(node as unknown as IWindowChild)
            }
          }
        }
      })
      this._childObserver.observe(this, { childList: true })
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this._childObserver) {
      this._childObserver.disconnect()
      this._childObserver = null
    }
    if (this._focusOutHandler) {
      document.removeEventListener('mousedown', this._focusOutHandler as any, true)
      this._focusOutHandler = null
    }
  }

  override attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    switch (name) {
      case 'animated': this.animated = val !== null; return
      case 'minimize-slot-width': this.minimizeSlotWidth = val !== null ? parseFloat(val) : 160; return
      case 'minimize-slot-height': this.minimizeSlotHeight = val !== null ? parseFloat(val) : 28; return
      case 'manual-child-management':
        this.manualChildManagement = val !== null
        if (this.manualChildManagement && this._childObserver) {
          this._childObserver.disconnect()
          this._childObserver = null
        }
        return
    }
    super.attributeChangedCallback(name, _old, val)
  }

  private _ensureManagerInit(): void {
    if (this._managerInitialized) return
    this._managerInitialized = true
    this._bindKeyboard()
  }

  /** Dual-dispatch: core.emit + CustomEvent for framework integration */
  private _emitCE(name: string, detail?: any): void {
    this.core.emit(name, detail)
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }))
  }

  // ── Size ──

  get element(): HTMLElement { return this }

  get managerWidth(): number { return parseInt(this.style.width) || this.clientWidth }
  set managerWidth(v: number) { this.style.width = `${v}px`; this.panelWidth = v }

  get managerHeight(): number { return parseInt(this.style.height) || this.clientHeight }
  set managerHeight(v: number) { this.style.height = `${v}px`; this.panelHeight = v }

  // ── Keyboard shortcuts ──

  set cycleNextShortcut(v: WindowCycleShortcut) { this._cycleNext = v }
  get cycleNextShortcut(): WindowCycleShortcut { return this._cycleNext }
  set cyclePrevShortcut(v: WindowCycleShortcut) { this._cyclePrev = v }
  get cyclePrevShortcut(): WindowCycleShortcut { return this._cyclePrev }

  private _matchShortcut(e: KeyboardEvent, s: WindowCycleShortcut): boolean {
    if (e.key !== s.key && e.key.toLowerCase() !== s.key.toLowerCase()) return false
    if (!!s.ctrlKey !== e.ctrlKey) return false
    if (!!s.altKey !== e.altKey) return false
    if (!!s.shiftKey !== e.shiftKey) return false
    if (!!s.metaKey !== e.metaKey) return false
    return true
  }

  private _bindKeyboard(): void {
    const handler = (e: KeyboardEvent) => {
      if (this._matchShortcut(e, this._cycleNext)) { e.preventDefault(); this.focusNext() }
      else if (this._matchShortcut(e, this._cyclePrev)) { e.preventDefault(); this.focusPrevious() }
      else if (this._focused) {
        if (e.key === 'F7' && this._focused.kind !== 'tool' && !this._focused.modal) {
          e.preventDefault()
          if (this._focused.windowState === 'minimized') this.restoreChild(this._focused)
          else this.minimizeChild(this._focused)
        } else if (e.key === 'F8' && this._focused.kind !== 'tool' && !this._focused.modal) {
          e.preventDefault()
          if (this._focused.windowState === 'maximized') this.restoreMaximized(this._focused)
          else this.maximizeChild(this._focused)
        } else if (e.key === 'F9') {
          e.preventDefault(); this.closeChild(this._focused)
        }
      }
    }
    document.addEventListener('keydown', handler, true)
    this.core.cleanups.push(() => document.removeEventListener('keydown', handler, true))
  }

  private get _cycleOrder(): IWindowChild[] {
    const isNotTool = (c: IWindowChild) => !('isTool' in c && (c as UIWindowWC).isTool)
    const normal = this._windows.filter(c => !c.topmost && isNotTool(c))
    const topmost = this._windows.filter(c => c.topmost && isNotTool(c))
    return [...normal, ...topmost]
  }

  focusNext(): void {
    const all = this._cycleOrder
    if (all.length < 2) return
    if (this._focused?.windowState === 'maximized') return
    const idx = this._focused ? all.indexOf(this._focused) : -1
    this._setFocus(all[(idx + 1) % all.length])
  }

  focusPrevious(): void {
    const all = this._cycleOrder
    if (all.length < 2) return
    if (this._focused?.windowState === 'maximized') return
    const idx = this._focused ? all.indexOf(this._focused) : 0
    this._setFocus(all[(idx - 1 + all.length) % all.length])
  }

  private _setFocus(child: IWindowChild): void {
    if (this._focused !== child) {
      const prev = this._focused
      this._focused = child
      if (prev?.onBlurred) prev.onBlurred()
      const zList = this._zOrderFor(child)
      const idx = zList.indexOf(child)
      if (idx !== -1) { zList.splice(idx, 1); zList.push(child); this._reassignZIndexes() }
      child.onFocused?.()
      this._emitCE('window-focus', { child })
    }
  }

  // ── Child management ──

  addWindow(child: IWindowChild): void {
    if (this._windows.includes(child)) return
    this._windows.push(child)
    if (child.element.parentNode !== this) this.appendChild(child.element)

    if (child.isFloating) {
      const mgrW = this.clientWidth, mgrH = this.clientHeight
      const cl = parseInt(child.element.style.left) || 0
      const ct = parseInt(child.element.style.top) || 0
      const cw = parseInt(child.element.style.width) || 0
      const ch = parseInt(child.element.style.height) || 0
      if (mgrW > 0 && mgrH > 0) {
        child.element.style.left = `${Math.max(0, Math.min(cl, mgrW - cw))}px`
        child.element.style.top = `${Math.max(0, Math.min(ct, mgrH - ch))}px`
      }
    }

    if (child.isFloating) {
      child.element.style.position = 'absolute'
      this._zOrderFor(child).push(child)
      this._reassignZIndexes()

      const handler = () => {
        if (child.windowState === 'minimized') this.restoreChild(child)
        else this.bringToFront(child)
      }
      child.element.addEventListener('mousedown', handler, true)
      ;(child as any).__wm_mousedown = handler
    }

    if ('manager' in child) (child as any).manager = this

    if (child.modal) this._pushModal(child)

    if (this.animated) {
      const el = child.element
      el.classList.add('wm-anim-open-start')
      void el.offsetHeight
      el.classList.add('wm-anim')
      el.classList.remove('wm-anim-open-start')
      const onEnd = () => { el.classList.remove('wm-anim'); el.removeEventListener('transitionend', onEnd) }
      el.addEventListener('transitionend', onEnd)
      setTimeout(onEnd, ANIM_DURATION + 50)
    }
  }

  removeWindow(child: IWindowChild): void {
    const idx = this._windows.indexOf(child)
    if (idx === -1) return
    this._windows.splice(idx, 1)

    const zList = this._zOrderFor(child)
    const zIdx = zList.indexOf(child)
    if (zIdx !== -1) zList.splice(zIdx, 1)

    if (this._focused === child) this._focused = null

    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    const handler = (child as any).__wm_mousedown
    if (handler) { child.element.removeEventListener('mousedown', handler, true); delete (child as any).__wm_mousedown }

    if (child.element.parentNode === this) this.removeChild(child.element)

    if ('manager' in child) (child as any).manager = null
    if (child.modal) this._popModal(child)

    this._reassignZIndexes()
  }

  // ── Z-ordering ──

  bringToFront(child: IWindowChild): void {
    if (!child.isFloating) return
    if (this._modalChild && child !== this._modalChild) return

    const asWin = child as UIWindowWC
    if ('overlord' in asWin && asWin.overlord) {
      const overlord = asWin.overlord
      const toolIdx = overlord.tools.indexOf(asWin)
      if (toolIdx !== -1) { (overlord as any)._tools.splice(toolIdx, 1); (overlord as any)._tools.push(asWin) }
      this.bringToFront(overlord)
      return
    }

    const zList = this._zOrderFor(child)
    const idx = zList.indexOf(child)
    if (idx === -1) return

    zList.splice(idx, 1)
    zList.push(child)
    this._reassignZIndexes()

    if (this._focused !== child) {
      const prev = this._focused
      this._focused = child
      if (prev?.onBlurred) prev.onBlurred()
      child.onFocused?.()
      this._emitCE('window-focus', { child })
    }
  }

  sendToBack(child: IWindowChild): void {
    if (!child.isFloating) return
    const zList = this._zOrderFor(child)
    const idx = zList.indexOf(child)
    if (idx === -1) return
    zList.splice(idx, 1)
    zList.unshift(child)
    this._reassignZIndexes()
  }

  // ── State operations ──

  private _emitBefore(event: string, child: IWindowChild): boolean {
    const detail = { child, cancelled: false }
    this.core.emit(event, detail)
    const ce = new CustomEvent(event, { bubbles: true, composed: true, cancelable: true, detail })
    this.dispatchEvent(ce)
    return detail.cancelled || ce.defaultPrevented
  }

  minimizeChild(child: IWindowChild): boolean {
    if (child.windowState === 'minimized') return false
    const asWin = child as UIWindowWC
    if ('isTool' in asWin && asWin.isTool) return false
    if (this._emitBefore('before-minimize', child)) return false

    if (child.windowState === 'normal') {
      ;(child as any).__restoreRect = {
        left: parseInt(child.element.style.left) || 0,
        top: parseInt(child.element.style.top) || 0,
        width: parseInt(child.element.style.width) || 0,
        height: parseInt(child.element.style.height) || 0,
      }
    }

    child.windowState = 'minimized'
    child.onMinimized?.()

    const slot = this._allocateMinimizeSlot(child)
    const pos = this._slotPosition(slot)
    this._animateTransition(child, () => {
      child.element.style.left = `${pos.left}px`
      child.element.style.top = `${pos.top}px`
      child.element.style.width = `${this.minimizeSlotWidth}px`
      child.element.style.height = `${this.minimizeSlotHeight}px`
    })

    this._emitCE('window-minimize', { child })

    if (this._focused === child && !this._batchOp) {
      this._focused = null
      const all = this._cycleOrder
      for (let i = all.length - 1; i >= 0; i--) {
        const c = all[i]
        if (c !== child && c.windowState !== 'minimized') { this.bringToFront(c); return true }
      }
      for (let i = 0; i < this._minimizeSlots.length; i++) {
        const c = this._minimizeSlots[i]
        if (c && c !== child) { this.bringToFront(c); return true }
      }
    }
    return true
  }

  restoreChild(child: IWindowChild): boolean {
    if (child.windowState === 'normal') return false
    const asWin = child as UIWindowWC
    if ('isTool' in asWin && asWin.isTool) return false
    if (this._emitBefore('before-restore', child)) return false

    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    child.windowState = 'normal'
    child.onRestored?.()

    const rect = (child as any).__restoreRect
    if (rect) {
      this._animateTransition(child, () => {
        child.element.style.left = `${rect.left}px`
        child.element.style.top = `${rect.top}px`
        child.element.style.width = `${rect.width}px`
        child.element.style.height = `${rect.height}px`
      })
    }

    this.bringToFront(child)
    this._emitCE('window-restore', { child })
    return true
  }

  closeChild(child: IWindowChild): boolean {
    if (this._emitBefore('before-close', child)) return false
    child.onClosed?.()
    this._emitCE('window-close', { child })

    if (this.animated && !this._animating.has(child)) {
      const el = child.element
      el.classList.add('wm-anim', 'wm-anim-close')
      const finish = () => this.removeWindow(child)
      const onEnd = (e: TransitionEvent) => { if (e.target !== el) return; el.removeEventListener('transitionend', onEnd); clearTimeout(fb); finish() }
      el.addEventListener('transitionend', onEnd)
      const fb = window.setTimeout(finish, ANIM_DURATION + 50)
    } else {
      this.removeWindow(child)
    }
    return true
  }

  maximizeChild(child: IWindowChild): boolean {
    if (child.windowState === 'maximized') return false
    const asWin = child as UIWindowWC
    if ('isTool' in asWin && asWin.isTool) return false
    if (this._emitBefore('before-maximize', child)) return false

    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    if (child.windowState !== 'minimized') {
      ;(child as any).__restoreRect = {
        left: parseInt(child.element.style.left) || 0,
        top: parseInt(child.element.style.top) || 0,
        width: parseInt(child.element.style.width) || 0,
        height: parseInt(child.element.style.height) || 0,
      }
    }

    if (child.windowState === 'minimized') child.onRestored?.()

    child.windowState = 'maximized'
    if ('onMaximized' in child && typeof (child as any).onMaximized === 'function') (child as any).onMaximized()

    const w = this.clientWidth, h = this.clientHeight
    this._animateTransition(child, () => {
      child.element.style.left = '0px'; child.element.style.top = '0px'
      child.element.style.width = `${w}px`; child.element.style.height = `${h}px`
    })

    this.bringToFront(child)
    this._emitCE('window-maximize', { child })
    return true
  }

  restoreMaximized(child: IWindowChild): boolean {
    if (child.windowState !== 'maximized') return false
    if (this._emitBefore('before-restore', child)) return false

    child.windowState = 'normal'
    child.onRestored?.()

    const rect = (child as any).__restoreRect
    if (rect) {
      this._animateTransition(child, () => {
        child.element.style.left = `${rect.left}px`; child.element.style.top = `${rect.top}px`
        child.element.style.width = `${rect.width}px`; child.element.style.height = `${rect.height}px`
      })
    }
    this._emitCE('window-restore', { child })
    return true
  }

  // ── Batch ──

  minimizeAll(): void {
    const focused = this._focused
    this._batchOp = true
    for (const child of [...this._zOrder, ...this._zOrderTopmost]) {
      if (child.windowState !== 'minimized') this.minimizeChild(child)
    }
    this._batchOp = false
    if (focused) { this._focused = focused; focused.onFocused?.() }
  }

  restoreAll(): void {
    const focused = this._focused
    this._batchOp = true
    for (const child of [...this._zOrder, ...this._zOrderTopmost]) {
      if (child.windowState === 'minimized') this.restoreChild(child)
    }
    this._batchOp = false
    if (focused) { this._focused = focused; focused.onFocused?.() }
  }

  closeAll(): void {
    for (const child of [...this._windows]) this.closeChild(child)
  }

  // ── Queries ──

  getChildState(child: IWindowChild): WindowChildInfo | null {
    if (!this._windows.includes(child)) return null
    return {
      id: child.windowId, state: child.windowState,
      zIndex: parseInt(child.element.style.zIndex) || 0,
      left: parseInt(child.element.style.left) || 0, top: parseInt(child.element.style.top) || 0,
      width: parseInt(child.element.style.width) || 0, height: parseInt(child.element.style.height) || 0,
    }
  }

  getAllStates(): WindowChildInfo[] { return this._windows.map(c => this.getChildState(c)!).filter(Boolean) }
  getMinimized(): IWindowChild[] { return this._windows.filter(c => c.windowState === 'minimized') }
  getFloating(): IWindowChild[] { return this._windows.filter(c => c.isFloating) }
  getFocused(): IWindowChild | null { return this._focused }
  getById(id: string): IWindowChild | null { return this._windows.find(c => c.windowId === id) ?? null }
  getByTitle(title: string): IWindowChild | null { return this._windows.find(c => c.title === title) ?? null }
  getAllByTitle(title: string): IWindowChild[] { return this._windows.filter(c => c.title === title) }
  searchByTitle(query: string): IWindowChild[] { const q = query.toLowerCase(); return this._windows.filter(c => c.title?.toLowerCase().includes(q)) }
  getMaximizedExcluding(exclude: IWindowChild): IWindowChild | null { return this._windows.find(c => c !== exclude && c.windowState === 'maximized') ?? null }
  findWindows(predicate: (child: IWindowChild) => boolean): IWindowChild[] { return this._windows.filter(predicate) }
  findWindow(predicate: (child: IWindowChild) => boolean): IWindowChild | null { return this._windows.find(predicate) ?? null }
  hasState(state: WindowState): boolean { return this._windows.some(c => c.windowState === state) }
  getAll(): IWindowChild[] { return [...this._windows] }

  activateWindow(child: IWindowChild): void {
    const maximized = this.getMaximizedExcluding(child)
    if (maximized) this.restoreMaximized(maximized)
    if (child.windowState === 'minimized') this.restoreChild(child)
    else this.bringToFront(child)
  }

  setTopmost(child: IWindowChild, topmost: boolean): void {
    const move = (c: IWindowChild) => {
      const cur = c.topmost ?? false
      if (cur === topmost) return
      const oldList = cur ? this._zOrderTopmost : this._zOrder
      const idx = oldList.indexOf(c)
      if (idx !== -1) oldList.splice(idx, 1)
      ;(c as any).topmost = topmost
      const newList = topmost ? this._zOrderTopmost : this._zOrder
      newList.push(c)
    }
    move(child)
    const asWin = child as UIWindowWC
    if ('tools' in asWin) { for (const tool of asWin.tools) move(tool) }
    this._reassignZIndexes()
  }

  notifyDrag(child: IWindowChild, left: number, top: number): void { this._emitCE('window-drag', { child, left, top }) }
  notifyResize(child: IWindowChild, width: number, height: number): void { this._emitCE('window-resize', { child, width, height }) }

  // ── Minimize grid ──

  private _allocateMinimizeSlot(child: IWindowChild): number {
    for (let i = 0; i < this._minimizeSlots.length; i++) {
      if (this._minimizeSlots[i] === null) { this._minimizeSlots[i] = child; return i }
    }
    this._minimizeSlots.push(child)
    return this._minimizeSlots.length - 1
  }

  private _slotPosition(slotIndex: number): { left: number; top: number } {
    const mgrW = this.clientWidth
    const cols = Math.max(1, Math.floor(mgrW / this.minimizeSlotWidth))
    const col = slotIndex % cols
    const row = Math.floor(slotIndex / cols)
    const mgrH = this.clientHeight
    return { left: col * this.minimizeSlotWidth, top: mgrH - (row + 1) * this.minimizeSlotHeight }
  }

  // ── Animation ──

  private _animateTransition(child: IWindowChild, apply: () => void, done?: () => void): void {
    if (!this.animated || this._animating.has(child)) { apply(); done?.(); return }
    this._animating.add(child)
    const el = child.element
    el.classList.add('wm-anim')
    void el.offsetHeight
    apply()
    const cleanup = () => { el.classList.remove('wm-anim'); this._animating.delete(child); done?.() }
    const onEnd = (e: TransitionEvent) => { if (e.target !== el) return; el.removeEventListener('transitionend', onEnd); clearTimeout(fb); cleanup() }
    el.addEventListener('transitionend', onEnd)
    const fb = window.setTimeout(cleanup, ANIM_DURATION + 50)
  }

  // ── Modal ──

  private get _modalChild(): IWindowChild | null {
    return this._modalStack.length > 0 ? this._modalStack[this._modalStack.length - 1].child : null
  }

  private _pushModal(child: IWindowChild): void {
    const backdrop = document.createElement('div')
    backdrop.className = 'ui-wm-backdrop'
    const zBase = 9990 + this._modalStack.length * 10
    Object.assign(backdrop.style, { position: 'absolute', inset: '0', backgroundColor: 'rgba(0, 0, 0, 0.3)', zIndex: String(zBase) })
    this.appendChild(backdrop)
    child.zIndex = zBase + 1
    this._modalStack.push({ child, backdrop })
  }

  private _popModal(child: IWindowChild): void {
    const idx = this._modalStack.findIndex(m => m.child === child)
    if (idx === -1) return
    this._modalStack[idx].backdrop.remove()
    this._modalStack.splice(idx, 1)
  }

  // ── Internal ──

  _removeFromZOrder(child: IWindowChild): void {
    let idx = this._zOrder.indexOf(child)
    if (idx !== -1) this._zOrder.splice(idx, 1)
    idx = this._zOrderTopmost.indexOf(child)
    if (idx !== -1) this._zOrderTopmost.splice(idx, 1)
  }

  _zOrderFor(child: IWindowChild): IWindowChild[] {
    return child.topmost ? this._zOrderTopmost : this._zOrder
  }

  /** Highest z-index currently assigned to any managed window or tool */
  get maxZIndex(): number {
    let max = 0
    for (const child of [...this._zOrder, ...this._zOrderTopmost]) {
      const z = child.zIndex
      if (z > max) max = z
      const asWin = child as UIWindowWC
      if ('tools' in asWin) {
        for (const tool of asWin.tools) {
          if (tool.zIndex > max) max = tool.zIndex
        }
      }
    }
    return max
  }

  _reassignZIndexes(): void {
    const assignList = (list: IWindowChild[], base: number) => {
      let z = base
      for (const child of list) {
        if (child.modal) continue
        const asWin = child as UIWindowWC
        if ('isTool' in asWin && asWin.isTool) continue
        child.zIndex = z; z += Z_STEP
        if ('tools' in asWin) { for (const tool of asWin.tools) { tool.zIndex = z; z += Z_STEP } }
      }
      return z
    }
    const nextZ = assignList(this._zOrder, Z_BASE)
    assignList(this._zOrderTopmost, nextZ + 100)
  }

  override destroy(): void {
    this.closeAll()
    super.destroy()
  }
}

customElements.define('window-manager-wc', UIWindowManagerWC)

declare global {
  interface HTMLElementTagNameMap {
    'window-manager-wc': UIWindowManagerWC
  }
}
