import { UIPanel } from '../ui-panel/ui-panel'
import type { IWindowChild, WindowChildInfo, UIWindowManagerOptions } from '../common/types'

const Z_BASE = 10
const Z_STEP = 10

export class UIWindowManager extends UIPanel {
  private _windows: IWindowChild[] = []
  private _zOrder: IWindowChild[] = []  // sorted by z-index ascending (last = front)
  private _focused: IWindowChild | null = null

  constructor(options?: UIWindowManagerOptions) {
    super({
      width: options?.width,
      height: options?.height,
      bg: options?.bg ?? 'var(--window-bg-color)',
      borderColor: options?.borderColor,
      className: options?.className,
      position: 'relative',
    })

    // Click on manager background should not interfere
    this.element.style.overflow = 'hidden'
  }

  // ── Child management ──

  addWindow(child: IWindowChild): void {
    if (this._windows.includes(child)) return
    this._windows.push(child)
    this.element.appendChild(child.element)

    // Ensure floating children are absolutely positioned
    if (child.isFloating) {
      child.element.style.position = 'absolute'
      this._zOrder.push(child)
      this._reassignZIndexes()

      // Click on child brings to front
      const handler = () => {
        if (child.windowState !== 'minimized') {
          this.bringToFront(child)
        }
      }
      child.element.addEventListener('mousedown', handler, true)
      ;(child as any).__wm_mousedown = handler
    }

    // Set manager reference if available
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

    // Remove click handler
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
    child.windowState = 'minimized'
    child.setVisible(false)
    child.onMinimized?.()
    this.core.emit('window-minimize', { child })

    if (this._focused === child) {
      this._focused = null
      // Focus next visible floating child
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
    child.windowState = 'normal'
    child.setVisible(true)
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

    // Save restore rect
    ;(child as any).__restoreRect = {
      left: parseInt(child.element.style.left) || 0,
      top: parseInt(child.element.style.top) || 0,
      width: parseInt(child.element.style.width) || 0,
      height: parseInt(child.element.style.height) || 0,
    }

    // Fill manager area
    child.element.style.left = '0px'
    child.element.style.top = '0px'
    child.element.style.width = `${this.element.clientWidth}px`
    child.element.style.height = `${this.element.clientHeight}px`
    child.windowState = 'maximized'
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
      if (child.windowState !== 'minimized') {
        this.minimizeChild(child)
      }
    }
  }

  restoreAll(): void {
    for (const child of [...this._zOrder]) {
      if (child.windowState === 'minimized') {
        this.restoreChild(child)
      }
    }
  }

  closeAll(): void {
    for (const child of [...this._windows]) {
      this.closeChild(child)
    }
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

  getFocused(): IWindowChild | null {
    return this._focused
  }

  // ── Drag notification (called by children) ──

  notifyDrag(child: IWindowChild, left: number, top: number): void {
    this.core.emit('window-drag', { child, left, top })
  }

  notifyResize(child: IWindowChild, width: number, height: number): void {
    this.core.emit('window-resize', { child, width, height })
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
