import { UIPanel } from '../ui-panel/ui-panel'
import type { IWindowChild, WindowChildInfo, UIWindowManagerOptions } from '../common/types'

const Z_BASE = 10
const Z_STEP = 10

export class UIWindowManager extends UIPanel {
  private _windows: IWindowChild[] = []
  private _zOrder: IWindowChild[] = []
  private _focused: IWindowChild | null = null

  // Minimize grid
  private _minimizeSlots: (IWindowChild | null)[] = []
  minimizeSlotWidth: number = 160
  minimizeSlotHeight: number = 28

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
    this._bindKeyboard()
  }

  // ── Keyboard window cycling ──

  private _bindKeyboard(): void {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Tab or Ctrl+Shift+Tab to cycle windows
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          this.focusPrevious()
        } else {
          this.focusNext()
        }
      }
    }
    this.element.addEventListener('keydown', handler)
    this.core.cleanups.push(() => this.element.removeEventListener('keydown', handler))
  }

  /** Focus the next visible floating window in z-order */
  focusNext(): void {
    const visible = this._zOrder.filter(c => c.windowState !== 'minimized')
    if (visible.length < 2) return
    const currentIdx = this._focused ? visible.indexOf(this._focused) : -1
    const nextIdx = (currentIdx + 1) % visible.length
    this.bringToFront(visible[nextIdx])
  }

  /** Focus the previous visible floating window in z-order */
  focusPrevious(): void {
    const visible = this._zOrder.filter(c => c.windowState !== 'minimized')
    if (visible.length < 2) return
    const currentIdx = this._focused ? visible.indexOf(this._focused) : 0
    const prevIdx = (currentIdx - 1 + visible.length) % visible.length
    this.bringToFront(visible[prevIdx])
  }

  // ── Child management ──

  addWindow(child: IWindowChild): void {
    if (this._windows.includes(child)) return
    this._windows.push(child)
    this.element.appendChild(child.element)

    if (child.isFloating) {
      child.element.style.position = 'absolute'
      this._zOrder.push(child)
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
  }

  removeWindow(child: IWindowChild): void {
    const idx = this._windows.indexOf(child)
    if (idx === -1) return

    this._windows.splice(idx, 1)

    const zIdx = this._zOrder.indexOf(child)
    if (zIdx !== -1) this._zOrder.splice(zIdx, 1)

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

    this._reassignZIndexes()
  }

  // ── Z-ordering ──

  bringToFront(child: IWindowChild): void {
    if (!child.isFloating) return
    const idx = this._zOrder.indexOf(child)
    if (idx === -1) return

    this._zOrder.splice(idx, 1)
    this._zOrder.push(child)
    this._reassignZIndexes()

    if (this._focused !== child) {
      this._focused = child
      child.onFocused?.()
      this.core.emit('window-focus', { child })
    }
  }

  sendToBack(child: IWindowChild): void {
    if (!child.isFloating) return
    const idx = this._zOrder.indexOf(child)
    if (idx === -1) return

    this._zOrder.splice(idx, 1)
    this._zOrder.unshift(child)
    this._reassignZIndexes()
  }

  // ── State operations ──

  minimizeChild(child: IWindowChild): void {
    if (child.windowState === 'minimized') return

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

    // Place in minimize grid
    const slot = this._allocateMinimizeSlot(child)
    const pos = this._slotPosition(slot)
    child.element.style.left = `${pos.left}px`
    child.element.style.top = `${pos.top}px`
    child.element.style.width = `${this.minimizeSlotWidth}px`
    child.element.style.height = `${this.minimizeSlotHeight}px`

    this.core.emit('window-minimize', { child })

    if (this._focused === child) {
      this._focused = null
      for (let i = this._zOrder.length - 1; i >= 0; i--) {
        const c = this._zOrder[i]
        if (c !== child && c.windowState !== 'minimized') {
          this.bringToFront(c)
          break
        }
      }
    }
  }

  restoreChild(child: IWindowChild): void {
    if (child.windowState === 'normal') return

    // Free minimize slot
    const slotIdx = this._minimizeSlots.indexOf(child)
    if (slotIdx !== -1) this._minimizeSlots[slotIdx] = null

    // Restore rect
    const rect = (child as any).__restoreRect
    if (rect) {
      child.element.style.left = `${rect.left}px`
      child.element.style.top = `${rect.top}px`
      child.element.style.width = `${rect.width}px`
      child.element.style.height = `${rect.height}px`
    }

    child.windowState = 'normal'
    child.onRestored?.()
    this.bringToFront(child)
    this.core.emit('window-restore', { child })
  }

  closeChild(child: IWindowChild): void {
    child.onClosed?.()
    this.core.emit('window-close', { child })
    this.removeWindow(child)
  }

  maximizeChild(child: IWindowChild): void {
    if (child.windowState === 'maximized') return

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

    child.element.style.left = '0px'
    child.element.style.top = '0px'
    child.element.style.width = `${this.element.clientWidth}px`
    child.element.style.height = `${this.element.clientHeight}px`
    child.windowState = 'maximized'

    // Notify window of maximize (for icon toggle, handle hiding)
    if ('onMaximized' in child && typeof (child as any).onMaximized === 'function') {
      ;(child as any).onMaximized()
    }

    this.bringToFront(child)
    this.core.emit('window-maximize', { child })
  }

  restoreMaximized(child: IWindowChild): void {
    if (child.windowState !== 'maximized') return
    const rect = (child as any).__restoreRect
    if (rect) {
      child.element.style.left = `${rect.left}px`
      child.element.style.top = `${rect.top}px`
      child.element.style.width = `${rect.width}px`
      child.element.style.height = `${rect.height}px`
    }
    child.windowState = 'normal'
    child.onRestored?.()
    this.core.emit('window-restore', { child })
  }

  // ── Batch operations ──

  minimizeAll(): void {
    for (const child of [...this._zOrder]) {
      if (child.windowState !== 'minimized') this.minimizeChild(child)
    }
  }

  restoreAll(): void {
    for (const child of [...this._zOrder]) {
      if (child.windowState === 'minimized') this.restoreChild(child)
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

  // ── Internal ──

  private _reassignZIndexes(): void {
    for (let i = 0; i < this._zOrder.length; i++) {
      this._zOrder[i].setZIndex(Z_BASE + i * Z_STEP)
    }
  }

  override destroy(): void {
    this.closeAll()
    super.destroy()
  }
}
