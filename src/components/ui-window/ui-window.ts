import { UIToolButton } from '../common/ui-tool-button'
import type { IWindowChild, WindowChildState, UIWindowOptions } from '../common/types'
import type { UIWindowManager } from '../ui-window-manager/ui-window-manager'
import './ui-window.css'

let windowCounter = 0

export class UIWindow implements IWindowChild {
  readonly windowId: string
  readonly element: HTMLDivElement
  readonly contentElement: HTMLDivElement
  readonly titleBarElement: HTMLDivElement

  windowState: WindowChildState = 'normal'
  readonly isFloating: boolean = true

  manager: UIWindowManager | null = null

  private _title: string
  private _titleEl: HTMLSpanElement
  private _buttonsEl: HTMLDivElement
  private _resizable: boolean
  private _minWidth: number
  private _minHeight: number
  private _titleBarHeight: number
  private _cleanups: Array<() => void> = []
  private _destroyed: boolean = false

  // Drag state
  private _dragging: boolean = false
  private _dragStartX: number = 0
  private _dragStartY: number = 0
  private _dragStartLeft: number = 0
  private _dragStartTop: number = 0

  // Buttons
  private _closeBtn: UIToolButton | null = null
  private _minBtn: UIToolButton | null = null
  private _maxBtn: UIToolButton | null = null

  constructor(options?: UIWindowOptions) {
    const o = options ?? {}
    this.windowId = o.id ?? `window-${++windowCounter}`
    this._title = o.title ?? 'Window'
    this._resizable = o.resizable ?? true
    this._minWidth = o.minWidth ?? 150
    this._minHeight = o.minHeight ?? 80
    this._titleBarHeight = o.titleBarHeight ?? 28

    // Root element
    this.element = document.createElement('div')
    this.element.className = 'ui-window'
    this.element.style.position = 'absolute'
    this.element.style.left = `${o.left ?? 50}px`
    this.element.style.top = `${o.top ?? 50}px`
    this.element.style.width = `${o.width ?? 300}px`
    this.element.style.height = `${o.height ?? 200}px`

    // Titlebar
    this.titleBarElement = document.createElement('div')
    this.titleBarElement.className = 'ui-window__titlebar'
    this.titleBarElement.style.height = `${this._titleBarHeight}px`

    // Icon slot
    if (o.icon) {
      const iconEl = document.createElement('div')
      iconEl.className = 'ui-window__icon'
      if (typeof o.icon === 'string') {
        iconEl.innerHTML = o.icon
      } else {
        iconEl.appendChild(o.icon)
      }
      this.titleBarElement.appendChild(iconEl)
    }

    // Title text
    this._titleEl = document.createElement('span')
    this._titleEl.className = 'ui-window__title'
    this._titleEl.textContent = this._title
    this.titleBarElement.appendChild(this._titleEl)

    // Buttons container
    this._buttonsEl = document.createElement('div')
    this._buttonsEl.className = 'ui-window__buttons'

    const btnSize = Math.max(16, this._titleBarHeight - 8)

    if (o.minimizable !== false) {
      this._minBtn = new UIToolButton({ icon: 'minus', size: btnSize, className: 'ui-window__min-btn' })
      this._minBtn.onClick(() => this._requestMinimize())
      this._buttonsEl.appendChild(this._minBtn.element)
    }

    if (o.maximizable !== false) {
      this._maxBtn = new UIToolButton({ icon: 'plus', size: btnSize, className: 'ui-window__max-btn' })
      this._maxBtn.onClick(() => this._requestMaximize())
      this._buttonsEl.appendChild(this._maxBtn.element)
    }

    if (o.closable !== false) {
      this._closeBtn = new UIToolButton({ icon: 'close', size: btnSize, className: 'ui-window__close-btn' })
      this._closeBtn.onClick(() => this._requestClose())
      this._buttonsEl.appendChild(this._closeBtn.element)
    }

    this.titleBarElement.appendChild(this._buttonsEl)

    // Body / content
    this.contentElement = document.createElement('div')
    this.contentElement.className = 'ui-window__body'

    this.element.appendChild(this.titleBarElement)
    this.element.appendChild(this.contentElement)

    // Resize handles
    if (this._resizable) {
      this._createResizeHandles()
    }

    // Drag
    this._bindDrag()
  }

  // ── Properties ──

  get title(): string { return this._title }
  set title(v: string) {
    this._title = v
    this._titleEl.textContent = v
  }

  get left(): number { return parseInt(this.element.style.left) || 0 }
  set left(v: number) { this.element.style.left = `${v}px` }

  get top(): number { return parseInt(this.element.style.top) || 0 }
  set top(v: number) { this.element.style.top = `${v}px` }

  get width(): number { return parseInt(this.element.style.width) || 0 }
  set width(v: number) { this.element.style.width = `${Math.max(this._minWidth, v)}px` }

  get height(): number { return parseInt(this.element.style.height) || 0 }
  set height(v: number) { this.element.style.height = `${Math.max(this._minHeight, v)}px` }

  // ── IWindowChild implementation ──

  onFocused(): void {
    this.titleBarElement.classList.add('focused')
    // Remove focused from siblings
    const parent = this.element.parentElement
    if (parent) {
      parent.querySelectorAll('.ui-window__titlebar.focused').forEach(el => {
        if (el !== this.titleBarElement) el.classList.remove('focused')
      })
    }
  }

  onMinimized(): void {
    this.titleBarElement.classList.remove('focused')
  }

  onRestored(): void {}

  onClosed(): void {}

  setZIndex(z: number): void {
    this.element.style.zIndex = String(z)
  }

  setVisible(v: boolean): void {
    this.element.style.display = v ? '' : 'none'
  }

  // ── Manager requests ──

  private _requestClose(): void {
    if (this.manager) {
      this.manager.closeChild(this)
    }
  }

  private _requestMinimize(): void {
    if (this.manager) {
      this.manager.minimizeChild(this)
    }
  }

  private _requestMaximize(): void {
    if (!this.manager) return
    if (this.windowState === 'maximized') {
      this.manager.restoreMaximized(this)
    } else {
      this.manager.maximizeChild(this)
    }
  }

  // ── Drag ──

  private _bindDrag(): void {
    const onMouseDown = (e: MouseEvent) => {
      // Only drag from titlebar, not from buttons
      if ((e.target as HTMLElement).closest('.ui-window__buttons')) return
      if (this.windowState === 'maximized') return

      e.preventDefault()
      this._dragging = true
      this._dragStartX = e.clientX
      this._dragStartY = e.clientY
      this._dragStartLeft = this.left
      this._dragStartTop = this.top

      if (this.manager) this.manager.bringToFront(this)
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!this._dragging) return
      const dx = e.clientX - this._dragStartX
      const dy = e.clientY - this._dragStartY
      this.left = this._dragStartLeft + dx
      this.top = this._dragStartTop + dy
      if (this.manager) this.manager.notifyDrag(this, this.left, this.top)
    }

    const onMouseUp = () => {
      this._dragging = false
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

  private _createResizeHandles(): void {
    const makeHandle = (cls: string, onDrag: (dx: number, dy: number, startW: number, startH: number, startL: number, startT: number) => void) => {
      const handle = document.createElement('div')
      handle.className = cls
      this.element.appendChild(handle)

      let startX = 0, startY = 0, startW = 0, startH = 0, startL = 0, startT = 0
      let resizing = false

      const onMouseDown = (e: MouseEvent) => {
        if (this.windowState === 'maximized') return
        e.preventDefault()
        e.stopPropagation()
        resizing = true
        startX = e.clientX
        startY = e.clientY
        startW = this.width
        startH = this.height
        startL = this.left
        startT = this.top
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!resizing) return
        onDrag(e.clientX - startX, e.clientY - startY, startW, startH, startL, startT)
        if (this.manager) this.manager.notifyResize(this, this.width, this.height)
      }

      const onMouseUp = () => { resizing = false }

      handle.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)

      this._cleanups.push(
        () => handle.removeEventListener('mousedown', onMouseDown),
        () => document.removeEventListener('mousemove', onMouseMove),
        () => document.removeEventListener('mouseup', onMouseUp),
      )
    }

    // East (right edge)
    makeHandle('ui-window__resize-e', (dx, _dy, sw) => {
      this.width = sw + dx
    })

    // South (bottom edge)
    makeHandle('ui-window__resize-s', (_dx, dy, _sw, sh) => {
      this.height = sh + dy
    })

    // Southeast (corner)
    makeHandle('ui-window__resize-se', (dx, dy, sw, sh) => {
      this.width = sw + dx
      this.height = sh + dy
    })
  }

  // ── Destroy ──

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._closeBtn?.destroy()
    this._minBtn?.destroy()
    this._maxBtn?.destroy()
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    if (this.element.parentNode) this.element.parentNode.removeChild(this.element)
  }

  get isDestroyed(): boolean { return this._destroyed }
}
