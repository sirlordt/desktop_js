import type { PopupState, PopupKind, UIPopupOptions } from '../common/types'
import { applySimulateFocus, dispatchSimulateFocus } from '../common/simulate-focus'
import { findBestPosition } from '../common/positioning'
import { UIWindow } from '../ui-window/ui-window'
import { UIWindowManager } from '../ui-window-manager/ui-window-manager'
import './ui-popup.css'

type PopupEventName = 'show' | 'close' | 'detach' | 'attach'
type PopupHandler = (...args: any[]) => void

export class UIPopup {
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
  private _window: UIWindow
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

  // Detach
  private _overlord: UIWindow | null = null

  // Parent element where popup is appended
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
    this._window = new UIWindow({
      kind: 'tool',
      titleBarStyle: this._detachable ? 'tool' : 'normal',
      titleAlign: 'center',
      title: this._title,
      showTitle: showBar,
      movable: this._detachable,
      positioning: 'fixed',
      zIndex: 99999,
      left: 0,
      top: 0,
      width: this._width,
      height: this._height,
      resizable: o.resizable ?? false,
      closable: true,
      minimizable: false,
      maximizable: false,
      foldable: false,
      showShortcuts: false,
      minWidth: o.minWidth ?? 50,
      minHeight: o.minHeight ?? 100,
      scroll: o.scroll ?? ((o.resizable && (o.kind ?? 'menu') === 'menu') ? 'both' : undefined),
      scrollBarSize: 'small',
    })

    // Hide close button initially when detachable
    if (this._detachable) {
      this._window.closable = false
    }

    // Auto-close when a child requests it
    this._window.element.addEventListener('request-parent-close', () => {
      if (this._state === 'attached') {
        requestAnimationFrame(() => this.close())
      }
    })

    // Mouse highlight: unify with keyboard _activeIndex
    if (this._kind === 'menu') {
      // Prevent menu item clicks from stealing focus
      this._window.contentElement.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault()
      })
      this._window.contentElement.addEventListener('mouseover', (e: MouseEvent) => {
        if (this._state === 'closed') return
        const target = (e.target as HTMLElement).closest('.ui-menuitem:not(.ui-menuitem--disabled)') as HTMLElement | null
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

    // Detach: when drag ends in attached mode, convert to tool of overlord
    if (this._detachable) {
      this._window.element.addEventListener('end-drag', () => {
        if (this._state === 'attached') {
          this._detach()
          this._window.closable = true
        }
      })
    }
  }

  // ── Public API ──

  get element(): HTMLElement { return this._window.element }
  get window(): UIWindow { return this._window }
  get state(): PopupState { return this._state }
  get visible(): boolean { return this._state !== 'closed' }
  get kind(): PopupKind { return this._kind }

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

  /** Set overlord window for detach (popup becomes tool of this window) */
  set overlord(win: UIWindow | null) { this._overlord = win }

  get parentRef(): HTMLElement | null { return this._parentRef }
  set parentRef(el: HTMLElement | null) { this._parentRef = el }

  show(): void {
    if (this._state !== 'closed' || this._destroyed) return
    const el = this._window.element
    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.opacity = ''
    el.style.pointerEvents = ''
    if (!el.parentNode) this._resolveParent().appendChild(el)
    this._state = 'attached'

    // Reset state
    this._window.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1

    // Menu mode: remove tabIndex from items so they never get real focus
    if (this._kind === 'menu') {
      this._setChildrenFocusable(false)
    }

    // Ensure popup is at least as wide as its anchor
    const anchorRect = this._anchor.getBoundingClientRect()
    const anchorW = Math.ceil(anchorRect.width)
    if (anchorW > 0) {
      if (anchorW > this._window.minWidth) this._window.minWidth = anchorW
      if (anchorW > this._window.width) this._window.width = anchorW
    }

    // Position above anchor's stacking context
    // Position above all managed windows
    const wm = this._findWindowManager()
    const topZ = wm ? wm.maxZIndex : this._getAnchorZIndex()
    el.style.zIndex = `${topZ + 2}`

    this._reposition()

    // Simulate focus on whoever had focus before
    this._focusedBeforeOpen = document.activeElement as HTMLElement | null
    if (this._focusedBeforeOpen) {
      dispatchSimulateFocus(this._focusedBeforeOpen, true)
    }

    if (this._kind === 'menu') {
      // Menu mode: anchor keeps real focus, popup uses document-level keyboard nav
      if (this._window.onFocused) this._window.onFocused()
      // Tab closes popup without restoring focus (handled in _bindMenuNav)
    } else {
      // Container mode: move real focus to popup for Tab cycling
      el.focus({ preventScroll: true })
      if (this._window.onFocused) this._window.onFocused()
    }

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

    // Hide on any scroll outside the popup (same pattern as UIHint)
    this._scrollHandler = ((e: Event) => {
      if (this._state !== 'attached') return
      const target = e.target as Node | null
      if (target && this._window.element.contains(target)) return
      this.close()
    }) as () => void
    document.addEventListener('scroll', this._scrollHandler, { capture: true, passive: true })

    // Kind-specific keyboard navigation
    if (this._kind === 'menu') {
      this._bindMenuNav()
    } else {
      this._bindContainerNav()
    }

    // Recalculate scrollbox after layout
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
    if (this._state === 'detached') {
      this._returnFromDetached()
      return
    }
    if (this._state === 'closed') return
    this._removeListeners()

    // Restore focus
    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) {
        this._focusedBeforeOpen.focus({ preventScroll: true })
      }
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    const el = this._window.element
    if (el.parentNode) el.parentNode.removeChild(el)
    this._state = 'closed'
    this._window.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1
    // Reset scroll position
    if (this._window.scrollBox) {
      this._window.scrollBox.scrollTo(0, 0)
    }
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

  // ── Private: Menu kind navigation ──

  /** Arrow up/down to navigate, Enter to select. No real focus on items. */
  private _bindMenuNav(): void {
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'attached') return
      if (e.key === 'Tab') {
        // Close popup without restoring focus — let Tab move naturally
        if (this._focusedBeforeOpen) {
          dispatchSimulateFocus(this._focusedBeforeOpen, false)
          this._focusedBeforeOpen = null
        }
        this.close()
        return
      }
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation()
        this._activeIndex = (this._activeIndex + 1) % items.length
        this._highlightMenuItem(items)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation()
        this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1
        this._highlightMenuItem(items)
      } else if (e.key === 'Enter' && this._activeIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        items[this._activeIndex].click()
      }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  /** Bind arrow navigation for detached menu mode */
  private _bindDetachedMenuNav(): void {
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'detached') return
      // Only respond if focus is inside this tool window or on its anchor
      const active = document.activeElement as Node | null
      if (!active) return
      if (!this._window.element.contains(active) && !this._anchor.contains(active)) return
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation()
        this._activeIndex = (this._activeIndex + 1) % items.length
        this._highlightMenuItem(items)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation()
        this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1
        this._highlightMenuItem(items)
      } else if (e.key === 'Enter' && this._activeIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        items[this._activeIndex].click()
      }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  /** Track anchor focus/blur to show/hide highlight in detached menu mode */
  private _bindAnchorFocusTracking(): void {
    this._anchorBlurHandler = () => {
      if (this._state !== 'detached') return
      this._activeIndex = -1
      this._clearHighlight()
    }
    this._anchorFocusHandler = () => {
      if (this._state !== 'detached') return
      // Scroll to first item (visible) but don't highlight
      this._activeIndex = -1
      this._clearHighlight()
      if (this._window.scrollBox) {
        this._window.scrollBox.scrollTo(0, 0)
      }
    }
    this._anchor.addEventListener('blur', this._anchorBlurHandler)
    this._anchor.addEventListener('focus', this._anchorFocusHandler)
  }

  // ── Private: Container kind navigation ──

  /** Let UIWindow's built-in Tab handler cycle through [data-focusable] children. */
  private _bindContainerNav(): void {
    // Enable tab focus on children
    this._setChildrenFocusable(true)

    // Focus first child
    const first = this._window.contentElement.querySelector<HTMLElement>('[data-focusable]')
    if (first) first.focus({ preventScroll: true })
  }

  // ── Private: Parent resolution ──

  /** Resolve the parent element where the popup will be appended.
   *  1. Explicit parentRef if set
   *  2. Walk up from anchor to find a UIWindowManager (data-ui-wm)
   *  3. Walk up from anchor to find the deepest UIWindow (data-ui-window)
   *  4. Anchor's parentElement
   */
  private _resolveParent(): HTMLElement {
    if (this._parentRef) return this._parentRef

    let el: HTMLElement | null = this._anchor
    let deepestWindow: HTMLElement | null = null
    while (el) {
      if ('uiWm' in el.dataset) return el
      if ('uiWindow' in el.dataset) deepestWindow = el
      el = el.parentElement
    }
    if (deepestWindow) return deepestWindow

    return this._anchor.parentElement ?? document.body
  }

  /** Walk up from anchor to find a UIWindowManager */
  private _findWindowManager(): UIWindowManager | null {
    let el: HTMLElement | null = this._anchor
    while (el) {
      if ('uiWm' in el.dataset && el instanceof UIWindowManager) return el
      el = el.parentElement
    }
    return null
  }

  // ── Private: Positioning ──

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
    const items = this._window.contentElement.querySelectorAll('[data-focusable]')
    items.forEach(el => {
      if (enabled) {
        ;(el as HTMLElement).tabIndex = -1
      } else {
        ;(el as HTMLElement).removeAttribute('tabindex')
      }
    })
  }

  private _reposition(): void {
    const anchorRect = this._anchor.getBoundingClientRect()
    const el = this._window.element
    const w = el.offsetWidth || this._width
    const h = el.offsetHeight || this._height
    const { pos } = findBestPosition(anchorRect, w, h, this._alignment as any, this._margin)
    el.style.left = `${Math.round(pos.left)}px`
    el.style.top = `${Math.round(pos.top)}px`
  }

  // ── Private: Detach ──

  private _detach(): void {
    if (!this._overlord) return

    this._removeListeners()
    this._state = 'detached'

    // Reconfigure: show close
    this._window.showTitle = true
    this._window.closable = true

    // Switch to absolute positioning so the tool stays inside the WM
    // Convert viewport coords (fixed) to parent-relative coords (absolute)
    const el = this._window.element
    const parentEl = this._overlord.manager?.element
    if (parentEl) {
      const parentRect = parentEl.getBoundingClientRect()
      const curLeft = parseFloat(el.style.left) || 0
      const curTop = parseFloat(el.style.top) || 0
      el.style.left = `${curLeft - parentRect.left}px`
      el.style.top = `${curTop - parentRect.top}px`
    }
    this._window.positioning = 'absolute'

    // Become tool of overlord
    this._overlord.addTool(this._window)

    this._window.onClosed = () => this._returnFromDetached()

    // Deactivate simulate-focus — popup is now a real window
    if (this._focusedBeforeOpen) {
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    // Re-activate overlord focus so it (and its tools) get focused titlebars
    if (this._overlord.manager) {
      this._overlord.manager.bringToFront(this._overlord)
    }
    // Force onFocused in case overlord was already the focused window
    if (this._overlord.onFocused) this._overlord.onFocused()

    if (this._kind === 'menu') {
      // Menu mode: keep arrow navigation, no item selected by default
      this._activeIndex = -1
      this._clearHighlight()
      this._bindDetachedMenuNav()
      this._bindAnchorFocusTracking()
    } else {
      // Container mode: enable tab focus, let UIWindow handle Tab cycle
      this._setChildrenFocusable(true)
      this._window.resetLastFocused()
      const firstFocusable = this._window.contentElement.querySelector('[data-focusable]') as HTMLElement | null
      if (firstFocusable) (firstFocusable as any).focus({ preventScroll: true, focusVisible: true })
    }

    this._emit('detach')
  }

  private _returnFromDetached(): void {
    const el = this._window.element

    // Remove listeners (detached nav)
    this._removeListeners()

    // Remove from overlord tools
    if (this._overlord) this._overlord.removeTool(this._window)

    // Remove from DOM
    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.opacity = ''
    el.style.pointerEvents = ''
    el.style.transform = ''
    if (el.parentNode) el.parentNode.removeChild(el)

    // Reconfigure back to popup mode
    this._window.positioning = 'fixed'
    this._window.showTitle = this._detachable
    this._window.movable = this._detachable
    this._window.closable = false

    if (this._kind === 'container') {
      this._setChildrenFocusable(false)
    }

    // Restore size
    el.style.width = `${this._width}px`
    el.style.height = `${this._height}px`

    this._state = 'closed'
    this._window.onClosed = () => {}
    this._clearHighlight()
    this._activeIndex = -1

    // Restore focus and clean up simulate-focus
    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) {
        this._focusedBeforeOpen.focus({ preventScroll: true })
      }
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

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
    if (this._scrollHandler) {
      document.removeEventListener('scroll', this._scrollHandler, true)
      this._scrollHandler = null
    }
    if (this._anchorBlurHandler) {
      this._anchor.removeEventListener('blur', this._anchorBlurHandler)
      this._anchorBlurHandler = null
    }
    if (this._anchorFocusHandler) {
      this._anchor.removeEventListener('focus', this._anchorFocusHandler)
      this._anchorFocusHandler = null
    }
  }

  // ── Private: Menu helpers ──

  private _getMenuItems(): HTMLElement[] {
    return Array.from(this._window.contentElement.querySelectorAll<HTMLElement>('.ui-menuitem:not(.ui-menuitem--disabled)'))
  }

  private _highlightMenuItem(items: HTMLElement[]): void {
    this._clearHighlight()
    if (this._activeIndex >= 0 && this._activeIndex < items.length) {
      const item = items[this._activeIndex]
      item.classList.add('ui-menuitem--highlight')
      if (this._window.scrollBox) {
        this._window.scrollBox.scrollIntoView(item)
      }
    }
  }

  private _clearHighlight(): void {
    this._window.contentElement.querySelectorAll('.ui-menuitem--highlight').forEach(el => {
      el.classList.remove('ui-menuitem--highlight')
    })
  }

  private _emit(event: PopupEventName, ...args: any[]): void {
    const handlers = this._listeners.get(event)
    if (handlers) for (const h of handlers) h(...args)
  }
}
