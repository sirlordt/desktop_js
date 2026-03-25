import type { PopupState, UIPopupOptions } from '../common/types'
import { applySimulateFocus, dispatchSimulateFocus } from '../common/simulate-focus'
import { findBestPosition } from '../common/positioning'
import { UIWindow } from '../ui-window/ui-window'
import type { UIWindowManager } from '../ui-window-manager/ui-window-manager'
import './ui-popup.css'

type PopupEventName = 'show' | 'close' | 'detach' | 'attach'
type PopupHandler = (...args: any[]) => void

export class UIPopup {
  private _anchor: HTMLElement
  private _alignment: string
  private _margin: number
  private _detachable: boolean
  private _title: string
  private _state: PopupState = 'closed'
  private _destroyed = false
  private _children: HTMLElement[] = []
  private _listeners = new Map<PopupEventName, Set<PopupHandler>>()
  private _window: UIWindow
  private _width: number
  private _height: number

  private _closeOnClickOutside: boolean
  private _closeOnEscape: boolean
  private _clickOutsideHandler: ((e: MouseEvent) => void) | null = null
  private _escapeHandler: ((e: KeyboardEvent) => void) | null = null
  private _keyNavHandler: ((e: KeyboardEvent) => void) | null = null
  private _activeIndex = -1
  private _focusedBeforeOpen: HTMLElement | null = null

  // Detach
  private _windowManager: UIWindowManager | null = null
  private _overlord: UIWindow | null = null
  private _isToolAttached = false

  constructor(options: UIPopupOptions) {
    const o = options
    this._anchor = o.anchor
    this._alignment = o.alignment ?? 'BottomLeft'
    this._margin = o.margin ?? 4
    this._detachable = o.detachable ?? false
    this._title = o.title ?? ''
    this._width = typeof o.width === 'number' ? o.width : 200
    this._height = typeof o.height === 'number' ? o.height : 250
    this._closeOnClickOutside = o.closeOnClickOutside ?? true
    this._closeOnEscape = o.closeOnEscape ?? true

    const showBar = this._detachable
    this._window = new UIWindow({
      kind: 'tool',
      titleBarStyle: this._detachable ? 'tool' : 'normal',
      titleAlign: 'center',
      title: this._title,
      showTitle: showBar,
      movable: false,
      left: 0,
      top: 0,
      width: this._width,
      height: this._height,
      resizable: o.resizable ?? false,
      closable: true,
      minimizable: false,
      maximizable: false,
      foldable: false,
      minWidth: o.minWidth ?? 50,
      minHeight: o.minHeight ?? 30,
      scroll: o.scroll,
      scrollBarSize: 'small',
    })

    // Hide close button initially when detachable (show on detach)
    if (this._detachable) {
      this._window.closable = false
    }

    // Auto-close when a child requests it
    this._window.element.addEventListener('request-parent-close', () => {
      if (this._state === 'attached') {
        requestAnimationFrame(() => this.close())
      }
    })

    // Detach: drag on titlebar
    if (this._detachable) {
      this._bindDetachDrag()
    }
  }

  get element(): HTMLElement { return this._window.element }
  get window(): UIWindow { return this._window }
  get state(): PopupState { return this._state }
  get visible(): boolean { return this._state !== 'closed' }

  get anchor(): HTMLElement { return this._anchor }
  set anchor(el: HTMLElement) { this._anchor = el; if (this._state === 'attached') this._reposition() }

  get title(): string { return this._title }
  set title(value: string) {
    this._title = value
    this._window.title = value
  }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this._window.element, v)
  }

  /** Set WindowManager and overlord for detach support */
  setDetachContext(wm: UIWindowManager, overlord: UIWindow): void {
    this._windowManager = wm
    this._overlord = overlord
  }

  show(): void {
    if (this._state !== 'closed' || this._destroyed) return
    const el = this._window.element
    // Clean any leftover animation classes
    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.zIndex = '99999'
    el.style.opacity = ''
    el.style.pointerEvents = ''
    if (!el.parentNode) document.body.appendChild(el)
    this._state = 'attached'

    this._reposition()

    // Bubble simulate-focus from whoever has focus right now
    this._focusedBeforeOpen = document.activeElement as HTMLElement | null
    if (this._focusedBeforeOpen) {
      dispatchSimulateFocus(this._focusedBeforeOpen, true)
    }

    // Take focus and show as focused
    el.focus({ preventScroll: true })
    if (this._window.onFocused) this._window.onFocused()

    // Click outside
    if (this._closeOnClickOutside) {
      requestAnimationFrame(() => {
        this._clickOutsideHandler = (e: MouseEvent) => {
          if (this._state !== 'attached') return
          const target = e.target as Node
          if (!el.contains(target) && !this._anchor.contains(target)) {
            this.close()
          }
        }
        document.addEventListener('mousedown', this._clickOutsideHandler, true)
      })
    }

    // Escape
    if (this._closeOnEscape) {
      this._escapeHandler = (e: KeyboardEvent) => {
        if (this._state !== 'attached') return
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          this.close()
        }
      }
      document.addEventListener('keydown', this._escapeHandler, true)
    }

    // Keyboard navigation (without stealing focus)
    this._activeIndex = -1
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'attached') return
      const items = this._getNavigableItems()
      if (items.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        this._activeIndex = (this._activeIndex + 1) % items.length
        this._highlightItem(items)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1
        this._highlightItem(items)
      } else if (e.key === 'Enter' && this._activeIndex >= 0) {
        e.preventDefault()
        e.stopPropagation()
        items[this._activeIndex].click()
      }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)

    this._emit('show')
  }

  close(): void {
    if (this._state === 'detached') {
      this._closeDetached()
      return
    }
    if (this._state === 'closed') return
    this._removeListeners()

    // Restore focus, then deactivate simulate-focus
    if (this._focusedBeforeOpen) {
      // Restore real focus first
      if (this._focusedBeforeOpen.isConnected) {
        this._focusedBeforeOpen.focus({ preventScroll: true })
      }
      // Tell WindowManager to re-focus the parent window
      if (this._overlord && this._windowManager) {
        this._windowManager.bringToFront(this._overlord)
      }
      // Deactivate simulate-focus (won't remove focused if window has real focus now)
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    const el = this._window.element
    if (el.parentNode) el.parentNode.removeChild(el)
    this._state = 'closed'
    this._emit('close')
  }

  toggle(): void {
    if (this._state === 'closed') this.show()
    else this.close()
  }

  addChild(el: HTMLElement): void {
    this._children.push(el)
    this._window.contentElement.appendChild(el)
  }

  removeChild(el: HTMLElement): void {
    const idx = this._children.indexOf(el)
    if (idx >= 0) this._children.splice(idx, 1)
    if (el.parentNode) el.parentNode.removeChild(el)
  }

  clearChildren(): void {
    for (const ch of this._children) {
      if (ch.parentNode) ch.parentNode.removeChild(ch)
    }
    this._children.length = 0
  }

  on(event: PopupEventName, handler: PopupHandler): void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event)!.add(handler)
  }

  off(event: PopupEventName, handler: PopupHandler): void {
    this._listeners.get(event)?.delete(handler)
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this.close()
    this._removeListeners()
    this._listeners.clear()
    this._children.length = 0
  }

  // ── Private: Positioning ──

  private _reposition(): void {
    const anchorRect = this._anchor.getBoundingClientRect()
    const el = this._window.element
    const w = el.offsetWidth || this._width
    const h = el.offsetHeight || this._height
    const { pos } = findBestPosition(anchorRect, w, h, this._alignment as any, this._margin)
    el.style.left = `${Math.round(pos.left + window.scrollX)}px`
    el.style.top = `${Math.round(pos.top + window.scrollY)}px`
  }

  // ── Private: Detach ──

  private _bindDetachDrag(): void {
    const titlebar = this._window.titleBarElement
    let startX = 0, startY = 0
    let dragging = false
    const THRESHOLD = 5

    const onMouseDown = (e: MouseEvent) => {
      if (this._state !== 'attached') return
      e.preventDefault()
      startX = e.clientX
      startY = e.clientY
      dragging = false
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (!dragging && Math.sqrt(dx * dx + dy * dy) > THRESHOLD) {
        dragging = true
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        this._detach()
        // Show close button only after mouse is released
        const onDetachUp = () => {
          document.removeEventListener('mouseup', onDetachUp)
          this._window.closable = true
        }
        document.addEventListener('mouseup', onDetachUp)
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    titlebar.addEventListener('mousedown', onMouseDown)
  }

  private _detach(): void {
    if (!this._windowManager || !this._overlord) return

    const el = this._window.element
    const rect = el.getBoundingClientRect()
    const mgrRect = this._windowManager.element.getBoundingClientRect()

    // Remove from body (attached mode)
    this._removeListeners()
    if (el.parentNode) el.parentNode.removeChild(el)
    this._state = 'detached'

    // Reconfigure for detached mode
    this._window.showTitle = true
    this._window.movable = true
    // closable = true set on mouseup to avoid breaking drag

    // Position relative to manager
    el.style.left = `${Math.round(rect.left - mgrRect.left)}px`
    el.style.top = `${Math.round(rect.top - mgrRect.top)}px`
    el.style.width = `${Math.round(rect.width)}px`
    el.style.height = `${Math.round(rect.height)}px`

    // Add to manager as tool
    this._windowManager.addWindow(this._window)
    this._overlord.addTool(this._window)
    this._isToolAttached = true

    this._window.onClosed = () => this._returnFromDetached()

    if (this._window.onFocused) this._window.onFocused()

    this._emit('detach')
  }

  private _closeDetached(): void {
    if (this._state !== 'detached') return
    this._returnFromDetached()
  }

  private _returnFromDetached(): void {
    const el = this._window.element

    // Remove from manager immediately (skip animation)
    if (this._isToolAttached && this._windowManager) {
      // Remove animation classes
      el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
      el.style.opacity = ''
      el.style.pointerEvents = ''
      el.style.transform = ''
      // Remove from overlord tools
      if (this._overlord) this._overlord.removeTool(this._window)
      // Remove from manager windows list
      this._windowManager.removeWindow(this._window)
    }
    this._isToolAttached = false

    // Reconfigure back to popup mode
    this._window.showTitle = this._detachable
    this._window.movable = false
    this._window.closable = false

    // Restore size
    el.style.width = `${this._width}px`
    el.style.height = `${this._height}px`
    el.style.zIndex = ''

    this._state = 'closed'
    this._window.onClosed = () => {}

    this._emit('attach')
    this._emit('close')
  }

  // ── Private: Listeners ──

  private _removeListeners(): void {
    if (this._clickOutsideHandler) {
      document.removeEventListener('mousedown', this._clickOutsideHandler, true)
      this._clickOutsideHandler = null
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler, true)
      this._escapeHandler = null
    }
    if (this._keyNavHandler) {
      document.removeEventListener('keydown', this._keyNavHandler, true)
      this._keyNavHandler = null
    }
    // Clear highlight
    this._clearHighlight()
    this._activeIndex = -1
  }

  private _getNavigableItems(): HTMLElement[] {
    return Array.from(this._window.contentElement.querySelectorAll<HTMLElement>('.ui-menuitem:not(.ui-menuitem--disabled)'))
  }

  private _highlightItem(items: HTMLElement[]): void {
    this._clearHighlight()
    if (this._activeIndex >= 0 && this._activeIndex < items.length) {
      items[this._activeIndex].classList.add('ui-menuitem--highlight')
    }
  }

  private _clearHighlight(): void {
    const prev = this._window.contentElement.querySelector('.ui-menuitem--highlight')
    if (prev) prev.classList.remove('ui-menuitem--highlight')
  }

  private _emit(event: PopupEventName, ...args: any[]): void {
    const handlers = this._listeners.get(event)
    if (handlers) for (const h of handlers) h(...args)
  }
}
