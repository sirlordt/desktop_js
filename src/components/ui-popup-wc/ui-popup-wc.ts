import type { PopupState, PopupKind, UIPopupOptions } from '../common/types'
import { applySimulateFocus, dispatchSimulateFocus } from '../common/simulate-focus-core'
import { findBestPosition } from '../common/positioning'
import { WindowWC } from '../ui-window-wc/ui-window-wc'

type PopupEventName = 'show' | 'close' | 'detach' | 'attach'
type PopupHandler = (...args: any[]) => void

export class PopupWC {
  private _anchor: HTMLElement
  private _kind: PopupKind
  private _alignment: string
  private _margin: number
  private _detachable: boolean
  private _title: string
  private _state: PopupState = 'closed'
  private _destroyed = false
  private _children: HTMLElement[] = []
  private _listeners = new Map<PopupEventName, Set<PopupHandler>>()
  private _window: WindowWC
  private _width: number
  private _height: number

  private _closeOnClickOutside: boolean
  private _closeOnEscape: boolean
  private _clickOutsideHandler: ((e: MouseEvent) => void) | null = null
  private _escapeHandler: ((e: KeyboardEvent) => void) | null = null
  private _keyNavHandler: ((e: KeyboardEvent) => void) | null = null
  private _scrollHandler: (() => void) | null = null
  private _anchorFocusHandler: (() => void) | null = null
  private _anchorBlurHandler: (() => void) | null = null
  private _activeIndex = -1
  private _focusedBeforeOpen: HTMLElement | null = null

  private _overlord: WindowWC | null = null
  private _parentRef: HTMLElement | null

  constructor(options: UIPopupOptions) {
    const o = options
    this._anchor = o.anchor
    this._kind = o.kind ?? 'menu'
    this._alignment = o.alignment ?? 'BottomLeft'
    this._margin = o.margin ?? 4
    this._detachable = o.detachable ?? false
    this._title = o.title ?? ''
    this._width = typeof o.width === 'number' ? o.width : 200
    this._height = typeof o.height === 'number' ? o.height : 250
    this._closeOnClickOutside = o.closeOnClickOutside ?? true
    this._closeOnEscape = o.closeOnEscape ?? true
    this._parentRef = o.parentRef ?? null

    const showBar = this._detachable
    this._window = new WindowWC({
      kind: 'tool',
      titleBarStyle: this._detachable ? 'tool' : 'normal',
      titleAlign: 'center',
      title: this._title,
      showTitle: showBar,
      movable: this._detachable,
      positioning: 'fixed',
      zIndex: 99999,
      left: 0, top: 0,
      width: this._width, height: this._height,
      resizable: o.resizable ?? false,
      closable: true,
      minimizable: false, maximizable: false, foldable: false,
      showShortcuts: false,
      minWidth: o.minWidth ?? 50,
      minHeight: o.minHeight ?? 100,
      scroll: o.scroll ?? ((o.resizable && (o.kind ?? 'menu') === 'menu') ? 'both' : undefined),
      scrollBarSize: 'small',
    })

    if (this._detachable) this._window.closable = false

    // Auto-close on request-parent-close from MenuItemWC
    this._window.addEventListener('request-parent-close', () => {
      if (this._state === 'attached') requestAnimationFrame(() => this.close())
    })

    // Mouse highlight for menu kind
    if (this._kind === 'menu') {
      this._window.contentElement.addEventListener('mousedown', (e: MouseEvent) => { e.preventDefault() })
      this._window.contentElement.addEventListener('mouseover', (e: MouseEvent) => {
        if (this._state === 'closed') return
        const target = (e.target as HTMLElement).closest('menuitem-wc:not(.disabled)') as HTMLElement | null
        if (!target) return
        const items = this._getMenuItems()
        const idx = items.indexOf(target)
        if (idx !== -1 && idx !== this._activeIndex) {
          this._activeIndex = idx
          this._highlightMenuItem(items)
        }
      })
      this._window.contentElement.addEventListener('mouseleave', () => {
        if (this._state === 'closed') return
        this._activeIndex = -1
        this._clearHighlight()
      })
    }

    if (this._detachable) {
      this._window.addEventListener('end-drag', () => {
        if (this._state === 'attached') {
          this._detach()
          this._window.closable = true
        }
      })
    }
  }

  // ── Public API ──

  get element(): HTMLElement { return this._window }
  get window(): WindowWC { return this._window }
  get state(): PopupState { return this._state }
  get visible(): boolean { return this._state !== 'closed' }
  get kind(): PopupKind { return this._kind }

  get anchor(): HTMLElement { return this._anchor }
  set anchor(el: HTMLElement) { this._anchor = el; if (this._state === 'attached') this._reposition() }

  get title(): string { return this._title }
  set title(value: string) { this._title = value; this._window.title = value }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this._window, v)
  }

  set overlord(win: WindowWC | null) { this._overlord = win }
  get parentRef(): HTMLElement | null { return this._parentRef }
  set parentRef(el: HTMLElement | null) { this._parentRef = el }

  show(): void {
    if (this._state !== 'closed' || this._destroyed) return
    const el = this._window as HTMLElement
    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.opacity = ''; el.style.pointerEvents = ''
    if (!el.parentNode) this._resolveParent().appendChild(el)
    this._state = 'attached'

    this._window.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1

    if (this._kind === 'menu') this._setChildrenFocusable(false)

    const anchorRect = this._anchor.getBoundingClientRect()
    const anchorW = Math.ceil(anchorRect.width)
    if (anchorW > 0) {
      if (anchorW > this._window.minWidth) this._window.minWidth = anchorW
      if (anchorW > this._window.width) this._window.width = anchorW
    }

    const anchorZ = this._getAnchorZIndex()
    el.style.zIndex = `${anchorZ + 1}`

    this._reposition()

    this._focusedBeforeOpen = document.activeElement as HTMLElement | null
    if (this._focusedBeforeOpen) dispatchSimulateFocus(this._focusedBeforeOpen, true)

    if (this._kind === 'menu') {
      // Menu mode: keep focus on anchor, popup uses document-level keyboard nav
      if (this._window.onFocused) this._window.onFocused()
    } else {
      // Container mode: move focus to popup for Tab cycling
      el.focus({ preventScroll: true })
      if (this._window.onFocused) this._window.onFocused()
    }

    if (this._closeOnClickOutside) {
      requestAnimationFrame(() => {
        this._clickOutsideHandler = (e: MouseEvent) => {
          if (this._state !== 'attached') return
          const target = e.target as Node
          if (!el.contains(target) && !this._anchor.contains(target)) this.close()
        }
        document.addEventListener('mousedown', this._clickOutsideHandler, true)
      })
    }

    if (this._closeOnEscape) {
      this._escapeHandler = (e: KeyboardEvent) => {
        if (this._state !== 'attached') return
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close() }
      }
      document.addEventListener('keydown', this._escapeHandler, true)
    }

    this._scrollHandler = ((e: Event) => {
      if (this._state !== 'attached') return
      const target = e.target as Node | null
      if (target && (this._window as HTMLElement).contains(target)) return
      this.close()
    }) as () => void
    document.addEventListener('scroll', this._scrollHandler, { capture: true, passive: true })

    if (this._kind === 'menu') this._bindMenuNav()
    else this._bindContainerNav()

    requestAnimationFrame(() => {
      if (this._window.scrollBox) {
        const content = this._window.scrollBox.contentElement
        this._window.scrollBox.contentWidth = content.scrollWidth
        this._window.scrollBox.contentHeight = content.scrollHeight
        this._window.scrollBox.refresh()
      }
    })

    this._emit('show')
  }

  close(): void {
    if (this._state === 'detached') { this._returnFromDetached(); return }
    if (this._state === 'closed') return
    this._removeListeners()

    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) this._focusedBeforeOpen.focus({ preventScroll: true })
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    const el = this._window as HTMLElement
    if (el.parentNode) el.parentNode.removeChild(el)
    this._state = 'closed'
    this._window.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1
    if (this._window.scrollBox) this._window.scrollBox.scrollContentTo(0, 0)
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
    for (const ch of this._children) { if (ch.parentNode) ch.parentNode.removeChild(ch) }
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

  // ── Menu nav ──

  private _bindMenuNav(): void {
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'attached') return
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this._activeIndex = (this._activeIndex + 1) % items.length; this._highlightMenuItem(items) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1; this._highlightMenuItem(items) }
      else if (e.key === 'Enter' && this._activeIndex >= 0) { e.preventDefault(); e.stopPropagation(); items[this._activeIndex].click() }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  private _bindDetachedMenuNav(): void {
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'detached') return
      const active = document.activeElement as Node | null
      if (!active) return
      if (!(this._window as HTMLElement).contains(active) && !this._anchor.contains(active)) return
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this._activeIndex = (this._activeIndex + 1) % items.length; this._highlightMenuItem(items) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1; this._highlightMenuItem(items) }
      else if (e.key === 'Enter' && this._activeIndex >= 0) { e.preventDefault(); e.stopPropagation(); items[this._activeIndex].click() }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  private _bindAnchorFocusTracking(): void {
    this._anchorBlurHandler = () => { if (this._state !== 'detached') return; this._activeIndex = -1; this._clearHighlight() }
    this._anchorFocusHandler = () => {
      if (this._state !== 'detached') return
      this._activeIndex = -1; this._clearHighlight()
      if (this._window.scrollBox) this._window.scrollBox.scrollContentTo(0, 0)
    }
    this._anchor.addEventListener('blur', this._anchorBlurHandler)
    this._anchor.addEventListener('focus', this._anchorFocusHandler)
  }

  // ── Container nav ──

  private _bindContainerNav(): void {
    this._setChildrenFocusable(true)
    const first = this._window.contentElement.querySelector<HTMLElement>('[data-focusable]')
    if (first) first.focus({ preventScroll: true })
  }

  // ── Parent resolution ──

  private _resolveParent(): HTMLElement {
    if (this._parentRef) return this._parentRef
    let el: HTMLElement | null = this._anchor
    while (el) {
      if (el.tagName === 'WINDOW-MANAGER-WC') return el
      if (el.tagName === 'WINDOW-WC') return el
      el = el.parentElement
    }
    return this._anchor.parentElement ?? document.body
  }

  // ── Positioning ──

  private _getAnchorZIndex(): number {
    let el: HTMLElement | null = this._anchor
    while (el) {
      const z = parseInt(el.style.zIndex) || parseInt(getComputedStyle(el).zIndex)
      if (!isNaN(z) && z > 0) return z
      el = el.parentElement
    }
    return 99999
  }

  private _setChildrenFocusable(enabled: boolean): void {
    this._window.contentElement.querySelectorAll('[data-focusable]').forEach(el => {
      if (enabled) (el as HTMLElement).tabIndex = -1
      else (el as HTMLElement).removeAttribute('tabindex')
    })
  }

  private _reposition(): void {
    const anchorRect = this._anchor.getBoundingClientRect()
    const el = this._window as HTMLElement
    const w = el.offsetWidth || this._width
    const h = el.offsetHeight || this._height
    const { pos } = findBestPosition(anchorRect, w, h, this._alignment as any, this._margin)
    el.style.left = `${Math.round(pos.left)}px`
    el.style.top = `${Math.round(pos.top)}px`
  }

  // ── Detach ──

  private _detach(): void {
    if (!this._overlord) return
    this._removeListeners()
    this._state = 'detached'

    this._window.showTitle = true
    this._window.closable = true

    const el = this._window as HTMLElement
    const parentEl = this._overlord.manager?.element
    if (parentEl) {
      const parentRect = parentEl.getBoundingClientRect()
      const curLeft = parseFloat(el.style.left) || 0
      const curTop = parseFloat(el.style.top) || 0
      el.style.left = `${curLeft - parentRect.left}px`
      el.style.top = `${curTop - parentRect.top}px`
    }
    this._window.positioning = 'absolute'

    this._overlord.addTool(this._window)

    this._window.onClosed = () => this._returnFromDetached()

    if (this._focusedBeforeOpen) {
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    if (this._overlord.manager) this._overlord.manager.bringToFront(this._overlord)
    if (this._overlord.onFocused) this._overlord.onFocused()

    if (this._kind === 'menu') {
      this._activeIndex = -1; this._clearHighlight()
      this._bindDetachedMenuNav(); this._bindAnchorFocusTracking()
    } else {
      this._setChildrenFocusable(true)
      this._window.resetLastFocused()
      const first = this._window.contentElement.querySelector('[data-focusable]') as HTMLElement | null
      if (first) first.focus({ preventScroll: true })
    }

    this._emit('detach')
  }

  private _returnFromDetached(): void {
    const el = this._window as HTMLElement
    this._removeListeners()
    if (this._overlord) this._overlord.removeTool(this._window)

    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.opacity = ''; el.style.pointerEvents = ''; el.style.transform = ''
    if (el.parentNode) el.parentNode.removeChild(el)

    this._window.positioning = 'fixed'
    this._window.showTitle = this._detachable
    this._window.movable = this._detachable
    this._window.closable = false

    if (this._kind === 'container') this._setChildrenFocusable(false)

    el.style.width = `${this._width}px`; el.style.height = `${this._height}px`

    this._state = 'closed'
    this._window.onClosed = () => {}
    this._clearHighlight(); this._activeIndex = -1

    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) this._focusedBeforeOpen.focus({ preventScroll: true })
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    this._emit('attach'); this._emit('close')
  }

  // ── Listeners ──

  private _removeListeners(): void {
    if (this._clickOutsideHandler) { document.removeEventListener('mousedown', this._clickOutsideHandler, true); this._clickOutsideHandler = null }
    if (this._escapeHandler) { document.removeEventListener('keydown', this._escapeHandler, true); this._escapeHandler = null }
    if (this._keyNavHandler) { document.removeEventListener('keydown', this._keyNavHandler, true); this._keyNavHandler = null }
    if (this._scrollHandler) { document.removeEventListener('scroll', this._scrollHandler, true); this._scrollHandler = null }
    if (this._anchorBlurHandler) { this._anchor.removeEventListener('blur', this._anchorBlurHandler); this._anchorBlurHandler = null }
    if (this._anchorFocusHandler) { this._anchor.removeEventListener('focus', this._anchorFocusHandler); this._anchorFocusHandler = null }
  }

  // ── Menu helpers ──

  private _getMenuItems(): HTMLElement[] {
    return Array.from(this._window.contentElement.querySelectorAll<HTMLElement>('menuitem-wc:not(.disabled)'))
  }

  private _highlightMenuItem(items: HTMLElement[]): void {
    this._clearHighlight()
    if (this._activeIndex >= 0 && this._activeIndex < items.length) {
      const item = items[this._activeIndex]
      item.classList.add('highlight')
      if (this._window.scrollBox) this._window.scrollBox.scrollChildIntoView(item)
    }
  }

  private _clearHighlight(): void {
    this._window.contentElement.querySelectorAll('menuitem-wc.highlight').forEach(el => {
      el.classList.remove('highlight')
    })
  }

  private _emit(event: PopupEventName, ...args: any[]): void {
    const handlers = this._listeners.get(event)
    if (handlers) for (const h of handlers) h(...args)
  }
}
