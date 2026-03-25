import { UIPanel } from '../ui-panel/ui-panel'
import type { UIWindow } from '../ui-window/ui-window'
import type { IWindowChild, WindowChildInfo, UIWindowManagerOptions, WindowCycleShortcut, WindowState } from '../common/types'

const Z_BASE = 10
const Z_STEP = 10
const ANIM_DURATION = 200

export class UIWindowManager extends UIPanel {
  private _windows: IWindowChild[] = []
  private _zOrder: IWindowChild[] = []
  private _zOrderTopmost: IWindowChild[] = []
  private _focused: IWindowChild | null = null
  private _animating: Set<IWindowChild> = new Set()
  private _modalStack: { child: IWindowChild; backdrop: HTMLDivElement }[] = []

  // Minimize grid
  private _minimizeSlots: (IWindowChild | null)[] = []
  minimizeSlotWidth: number = 160
  minimizeSlotHeight: number = 28

  // Keyboard shortcuts
  private _cycleNext: WindowCycleShortcut
  private _cyclePrev: WindowCycleShortcut

  /** Enable/disable animations (default: true) */
  animated: boolean = true
  private _batchOp: boolean = false

  constructor(options?: UIWindowManagerOptions) {
    super({
      width: options?.width,
      height: options?.height,
      bg: options?.bg ?? 'var(--window-bg-color)',
      borderColor: options?.borderColor,
      className: options?.className,
      position: 'relative',
    })

    this.element.style.overflow = 'hidden'
    this.element.tabIndex = -1
    this.element.style.outline = 'none'

    this._cycleNext = options?.cycleNextShortcut ?? { key: 'F6', altKey: true }
    this._cyclePrev = options?.cyclePrevShortcut ?? { key: 'F6', altKey: true, shiftKey: true }
    this._bindKeyboard()
  }

  // ── Keyboard shortcuts ──

  /** Change the shortcut for cycling to the next window */
  set cycleNextShortcut(v: WindowCycleShortcut) { this._cycleNext = v }
  get cycleNextShortcut(): WindowCycleShortcut { return this._cycleNext }

  /** Change the shortcut for cycling to the previous window */
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
      if (this._matchShortcut(e, this._cycleNext)) {
        e.preventDefault()
        this.focusNext()
      } else if (this._matchShortcut(e, this._cyclePrev)) {
        e.preventDefault()
        this.focusPrevious()
      } else if (this._focused) {
        // Window action shortcuts
        if (e.key === 'F7' && this._focused.kind !== 'tool' && !this._focused.modal) {
          e.preventDefault()
          if (this._focused.windowState === 'minimized') {
            this.restoreChild(this._focused)
          } else {
            this.minimizeChild(this._focused)
          }
        } else if (e.key === 'F8' && this._focused.kind !== 'tool' && !this._focused.modal) {
          e.preventDefault()
          if (this._focused.windowState === 'maximized') {
            this.restoreMaximized(this._focused)
          } else {
            this.maximizeChild(this._focused)
          }
        } else if (e.key === 'F9') {
          e.preventDefault()
          this.closeChild(this._focused)
        }
      }
    }
    document.addEventListener('keydown', handler, true)
    this.core.cleanups.push(() => document.removeEventListener('keydown', handler, true))
  }

  /** Stable cycle order: normal windows first, then topmost. Excludes tools. */
  private get _cycleOrder(): IWindowChild[] {
    const isNotTool = (c: IWindowChild) => !('isTool' in c && (c as UIWindow).isTool)
    const normal = this._windows.filter(c => !c.topmost && isNotTool(c))
    const topmost = this._windows.filter(c => c.topmost && isNotTool(c))
    return [...normal, ...topmost]
  }

  /** Focus the next window in cycle order. Disabled when a window is maximized. */
  focusNext(): void {
    const all = this._cycleOrder
    if (all.length < 2) return
    if (this._focused?.windowState === 'maximized') return
    const currentIdx = this._focused ? all.indexOf(this._focused) : -1
    const nextIdx = (currentIdx + 1) % all.length
    this._setFocus(all[nextIdx])
  }

  /** Focus the previous window in cycle order. Disabled when a window is maximized. */
  focusPrevious(): void {
    const all = this._cycleOrder
    if (all.length < 2) return
    if (this._focused?.windowState === 'maximized') return
    const currentIdx = this._focused ? all.indexOf(this._focused) : 0
    const prevIdx = (currentIdx - 1 + all.length) % all.length
    this._setFocus(all[prevIdx])
  }

  /** Set focus on a child, reordering within its own z-order group */
  private _setFocus(child: IWindowChild): void {
    if (this._focused !== child) {
      const prev = this._focused
      this._focused = child
      if (prev?.onBlurred) prev.onBlurred()
      // Bring to front within its own group
      const zList = this._zOrderFor(child)
      const idx = zList.indexOf(child)
      if (idx !== -1) {
        zList.splice(idx, 1)
        zList.push(child)
        this._reassignZIndexes()
      }
      child.onFocused?.()
      this.core.emit('window-focus', { child })
    }
  }

  // ── Child management ──

  addWindow(child: IWindowChild): void {
    if (this._windows.includes(child)) return
    this._windows.push(child)
    this.element.appendChild(child.element)

    if (child.isFloating) {
      child.element.style.position = 'absolute'
      this._zOrderFor(child).push(child)
      this._reassignZIndexes()

      const handler = () => {
        if (child.windowState === 'minimized') {
          this.restoreChild(child)
        } else {
          this.bringToFront(child)
        }
      }
      child.element.addEventListener('mousedown', handler, true)
      ;(child as any).__wm_mousedown = handler
    }

    if ('manager' in child) {
      ;(child as any).manager = this
    }

    // Modal: show backdrop
    if (child.modal) {
      this._pushModal(child)
    }

    // Open animation
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

    // Free minimize slot
    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    const handler = (child as any).__wm_mousedown
    if (handler) {
      child.element.removeEventListener('mousedown', handler, true)
      delete (child as any).__wm_mousedown
    }

    if (child.element.parentNode === this.element) {
      this.element.removeChild(child.element)
    }

    if ('manager' in child) {
      ;(child as any).manager = null
    }

    // Modal: remove backdrop
    if (child.modal) {
      this._popModal(child)
    }

    this._reassignZIndexes()
  }

  // ── Z-ordering ──

  bringToFront(child: IWindowChild): void {
    if (!child.isFloating) return
    // If a modal is active, only the top modal can be interacted with
    if (this._modalChild && child !== this._modalChild) return

    // If this is a tool, bring its overlord to front and reorder this tool to top
    const asWin = child as UIWindow
    if ('overlord' in asWin && asWin.overlord) {
      const overlord = asWin.overlord
      // Move clicked tool to end of overlord's tools array (highest z)
      const toolIdx = overlord.tools.indexOf(asWin)
      if (toolIdx !== -1) {
        ;(overlord as any)._tools.splice(toolIdx, 1)
        ;(overlord as any)._tools.push(asWin)
      }
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
      this.core.emit('window-focus', { child })
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

  /** Emit a cancellable before-* event. Returns true if cancelled. */
  private _emitBefore(event: string, child: IWindowChild): boolean {
    const detail = { child, cancelled: false }
    this.core.emit(event, detail)
    return detail.cancelled
  }

  minimizeChild(child: IWindowChild): void {
    if (child.windowState === 'minimized') return
    // Tools cannot be minimized directly — they follow their overlord
    const asWin = child as UIWindow
    if ('isTool' in asWin && asWin.isTool) return
    if (this._emitBefore('before-minimize', child)) return

    // Save restore rect only from normal state — maximized already saved it
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

    // Place in minimize grid (animated)
    const slot = this._allocateMinimizeSlot(child)
    const pos = this._slotPosition(slot)
    this._animateTransition(child, () => {
      child.element.style.left = `${pos.left}px`
      child.element.style.top = `${pos.top}px`
      child.element.style.width = `${this.minimizeSlotWidth}px`
      child.element.style.height = `${this.minimizeSlotHeight}px`
    })

    this.core.emit('window-minimize', { child })

    if (this._focused === child && !this._batchOp) {
      this._focused = null
      const all = this._cycleOrder
      // Try to focus a non-minimized window first
      for (let i = all.length - 1; i >= 0; i--) {
        const c = all[i]
        if (c !== child && c.windowState !== 'minimized') {
          this.bringToFront(c)
          return
        }
      }
      // All minimized — focus the first one in the minimize grid
      for (let i = 0; i < this._minimizeSlots.length; i++) {
        const c = this._minimizeSlots[i]
        if (c && c !== child) {
          this.bringToFront(c)
          return
        }
      }
    }
  }

  restoreChild(child: IWindowChild): void {
    if (child.windowState === 'normal') return
    const asWin2 = child as UIWindow
    if ('isTool' in asWin2 && asWin2.isTool) return

    // Free minimize slot
    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    child.windowState = 'normal'
    child.onRestored?.()

    // Animate to restore rect
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
    this.core.emit('window-restore', { child })
  }

  closeChild(child: IWindowChild): void {
    if (this._emitBefore('before-close', child)) return
    child.onClosed?.()
    this.core.emit('window-close', { child })

    if (this.animated && !this._animating.has(child)) {
      const el = child.element
      el.classList.add('wm-anim', 'wm-anim-close')
      const finish = () => { this.removeWindow(child) }
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== el) return
        el.removeEventListener('transitionend', onEnd)
        clearTimeout(fallback)
        finish()
      }
      el.addEventListener('transitionend', onEnd)
      const fallback = window.setTimeout(finish, ANIM_DURATION + 50)
    } else {
      this.removeWindow(child)
    }
  }

  maximizeChild(child: IWindowChild): void {
    if (child.windowState === 'maximized') return
    const asWin3 = child as UIWindow
    if ('isTool' in asWin3 && asWin3.isTool) return
    if (this._emitBefore('before-maximize', child)) return

    // If minimized, free the slot first
    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    // Save restore rect (only if not already minimized — minimized already saved it)
    if (child.windowState !== 'minimized') {
      ;(child as any).__restoreRect = {
        left: parseInt(child.element.style.left) || 0,
        top: parseInt(child.element.style.top) || 0,
        width: parseInt(child.element.style.width) || 0,
        height: parseInt(child.element.style.height) || 0,
      }
    }

    // Restore body visibility if was minimized
    if (child.windowState === 'minimized') {
      child.onRestored?.()
    }

    child.windowState = 'maximized'

    // Notify window of maximize (for icon toggle, handle hiding)
    if ('onMaximized' in child && typeof (child as any).onMaximized === 'function') {
      ;(child as any).onMaximized()
    }

    const w = this.element.clientWidth
    const h = this.element.clientHeight
    this._animateTransition(child, () => {
      child.element.style.left = '0px'
      child.element.style.top = '0px'
      child.element.style.width = `${w}px`
      child.element.style.height = `${h}px`
    })

    this.bringToFront(child)
    this.core.emit('window-maximize', { child })
  }

  restoreMaximized(child: IWindowChild): void {
    if (child.windowState !== 'maximized') return
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
    this.core.emit('window-restore', { child })
  }

  // ── Batch operations ──

  minimizeAll(): void {
    const focused = this._focused
    this._batchOp = true
    for (const child of [...this._zOrder, ...this._zOrderTopmost]) {
      if (child.windowState !== 'minimized') this.minimizeChild(child)
    }
    this._batchOp = false
    if (focused) {
      this._focused = focused
      focused.onFocused?.()
    }
  }

  restoreAll(): void {
    const focused = this._focused
    this._batchOp = true
    for (const child of [...this._zOrder, ...this._zOrderTopmost]) {
      if (child.windowState === 'minimized') this.restoreChild(child)
    }
    this._batchOp = false
    if (focused) {
      this._focused = focused
      focused.onFocused?.()
    }
  }

  closeAll(): void {
    for (const child of [...this._windows]) this.closeChild(child)
  }

  // ── State queries ──

  getChildState(child: IWindowChild): WindowChildInfo | null {
    if (!this._windows.includes(child)) return null
    return {
      id: child.windowId,
      state: child.windowState,
      zIndex: parseInt(child.element.style.zIndex) || 0,
      left: parseInt(child.element.style.left) || 0,
      top: parseInt(child.element.style.top) || 0,
      width: parseInt(child.element.style.width) || 0,
      height: parseInt(child.element.style.height) || 0,
    }
  }

  getAllStates(): WindowChildInfo[] {
    return this._windows.map(c => this.getChildState(c)!).filter(Boolean)
  }

  getMinimized(): IWindowChild[] {
    return this._windows.filter(c => c.windowState === 'minimized')
  }

  getFloating(): IWindowChild[] {
    return this._windows.filter(c => c.isFloating)
  }

  getFocused(): IWindowChild | null { return this._focused }

  /** Find a window by its ID */
  getById(id: string): IWindowChild | null {
    return this._windows.find(c => c.windowId === id) ?? null
  }

  /** Find windows matching a predicate */
  findWindows(predicate: (child: IWindowChild) => boolean): IWindowChild[] {
    return this._windows.filter(predicate)
  }

  /** Find first window matching a predicate */
  findWindow(predicate: (child: IWindowChild) => boolean): IWindowChild | null {
    return this._windows.find(predicate) ?? null
  }

  /** Check if any window is in a given state */
  hasState(state: WindowState): boolean {
    return this._windows.some(c => c.windowState === state)
  }

  /** Get all managed windows */
  getAll(): IWindowChild[] {
    return [...this._windows]
  }

  /** Find first window by title */
  getByTitle(title: string): IWindowChild | null {
    return this._windows.find(c => c.title === title) ?? null
  }

  /** Find all windows by exact title */
  getAllByTitle(title: string): IWindowChild[] {
    return this._windows.filter(c => c.title === title)
  }

  /** Search windows by partial title (case-insensitive) */
  searchByTitle(query: string): IWindowChild[] {
    const q = query.toLowerCase()
    return this._windows.filter(c => c.title?.toLowerCase().includes(q))
  }

  /** Get the maximized window excluding a specific child, or null */
  getMaximizedExcluding(exclude: IWindowChild): IWindowChild | null {
    return this._windows.find(c => c !== exclude && c.windowState === 'maximized') ?? null
  }

  /** Activate a window: restore maximized others, restore if minimized, bring to front */
  activateWindow(child: IWindowChild): void {
    // Restore any other maximized window first
    const maximized = this.getMaximizedExcluding(child)
    if (maximized) this.restoreMaximized(maximized)

    // Restore if minimized
    if (child.windowState === 'minimized') {
      this.restoreChild(child)
    } else {
      this.bringToFront(child)
    }
  }

  /** Change a window's topmost state dynamically, including its tools */
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
    // Move tools along with overlord
    const asWin = child as UIWindow
    if ('tools' in asWin) {
      for (const tool of asWin.tools) move(tool)
    }
    this._reassignZIndexes()
  }

  // ── Drag/resize notification ──

  notifyDrag(child: IWindowChild, left: number, top: number): void {
    this.core.emit('window-drag', { child, left, top })
  }

  notifyResize(child: IWindowChild, width: number, height: number): void {
    this.core.emit('window-resize', { child, width, height })
  }

  // ── Minimize grid ──

  private _allocateMinimizeSlot(child: IWindowChild): number {
    // Find first empty slot
    for (let i = 0; i < this._minimizeSlots.length; i++) {
      if (this._minimizeSlots[i] === null) {
        this._minimizeSlots[i] = child
        return i
      }
    }
    // Append new slot
    this._minimizeSlots.push(child)
    return this._minimizeSlots.length - 1
  }

  private _slotPosition(slotIndex: number): { left: number; top: number } {
    const mgrW = this.element.clientWidth
    const cols = Math.max(1, Math.floor(mgrW / this.minimizeSlotWidth))
    const col = slotIndex % cols
    const row = Math.floor(slotIndex / cols)
    const mgrH = this.element.clientHeight

    return {
      left: col * this.minimizeSlotWidth,
      top: mgrH - (row + 1) * this.minimizeSlotHeight,
    }
  }

  // ── Animation helpers ──

  /** Enable CSS transition on child, run a callback to set target state, clean up after transition. */
  private _animateTransition(child: IWindowChild, apply: () => void, done?: () => void): void {
    if (!this.animated || this._animating.has(child)) {
      apply()
      done?.()
      return
    }
    this._animating.add(child)
    const el = child.element
    el.classList.add('wm-anim')

    // Force layout so current position is the "from" state
    void el.offsetHeight

    apply()

    const cleanup = () => {
      el.classList.remove('wm-anim')
      this._animating.delete(child)
      done?.()
    }

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el) return
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(fallback)
      cleanup()
    }
    el.addEventListener('transitionend', onEnd)
    // Fallback in case transitionend doesn't fire
    const fallback = window.setTimeout(cleanup, ANIM_DURATION + 50)
  }

  // ── Modal ──

  private get _modalChild(): IWindowChild | null {
    return this._modalStack.length > 0 ? this._modalStack[this._modalStack.length - 1].child : null
  }

  private _pushModal(child: IWindowChild): void {
    const backdrop = document.createElement('div')
    backdrop.className = 'ui-wm-backdrop'
    const zBase = 9990 + this._modalStack.length * 10
    Object.assign(backdrop.style, {
      position: 'absolute',
      inset: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: String(zBase),
    })
    this.element.appendChild(backdrop)
    child.setZIndex(zBase + 1)
    this._modalStack.push({ child, backdrop })
  }

  private _popModal(child: IWindowChild): void {
    const idx = this._modalStack.findIndex(m => m.child === child)
    if (idx === -1) return
    this._modalStack[idx].backdrop.remove()
    this._modalStack.splice(idx, 1)
  }

  // ── Internal ──

  /** Remove a child from both z-order lists */
  _removeFromZOrder(child: IWindowChild): void {
    let idx = this._zOrder.indexOf(child)
    if (idx !== -1) this._zOrder.splice(idx, 1)
    idx = this._zOrderTopmost.indexOf(child)
    if (idx !== -1) this._zOrderTopmost.splice(idx, 1)
  }

  /** Get the z-order list a child belongs to */
  private _zOrderFor(child: IWindowChild): IWindowChild[] {
    return child.topmost ? this._zOrderTopmost : this._zOrder
  }

  private _reassignZIndexes(): void {
    const assignList = (list: IWindowChild[], base: number) => {
      let z = base
      for (const child of list) {
        if (child.modal) continue
        // Skip tools — they are positioned after their overlord
        const asWin = child as UIWindow
        if ('isTool' in asWin && asWin.isTool) continue
        child.setZIndex(z)
        z += Z_STEP
        // Position tools just above overlord
        if ('tools' in asWin) {
          for (const tool of asWin.tools) {
            tool.setZIndex(z)
            z += Z_STEP
          }
        }
      }
      return z
    }
    // Normal windows
    const nextZ = assignList(this._zOrder, Z_BASE)
    // Topmost windows: start above all normal
    assignList(this._zOrderTopmost, nextZ + 100)
  }

  override destroy(): void {
    this.closeAll()
    super.destroy()
  }
}
