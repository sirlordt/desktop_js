import type { PopupState, PopupKind, UIPopupOptions, ScrollMode } from '../common/types'
import { applySimulateFocus, dispatchSimulateFocus } from '../common/simulate-focus-core'
import { findBestPosition } from '../common/positioning'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'

type PopupEventName = 'show' | 'close' | 'detach' | 'attach'
type PopupHandler = (...args: any[]) => void

const POPUP_ATTRS = [
  'kind', 'alignment', 'margin', 'width', 'height', 'min-width', 'min-height',
  'max-width', 'max-height', 'resizable', 'detachable', 'title',
  'close-on-click-outside', 'close-on-escape', 'anchor-selector',
  'open', 'scroll',
] as const

export class UIPopupWC extends HTMLElement {
  private _anchor: HTMLElement | null = null
  private _kind: PopupKind = 'menu'
  private _alignment: string = 'BottomLeft'
  private _margin: number = 4
  private _detachable: boolean = false
  private _title: string = ''
  private _state: PopupState = 'closed'
  private _destroyed = false
  private _autoDestroyTimer: ReturnType<typeof setTimeout> | null = null
  private _children: HTMLElement[] = []
  private _listeners = new Map<PopupEventName, Set<PopupHandler>>()
  private _window: UIWindowWC | null = null
  private _width: number = 200
  private _height: number = 250
  private _resizable: boolean = false
  private _scrollMode: ScrollMode | undefined = undefined
  private _minWidth: number = 150
  private _minHeight: number = 100

  private _closeOnClickOutside: boolean = true
  private _closeOnEscape: boolean = true
  private _clickOutsideHandler: ((e: MouseEvent) => void) | null = null
  private _escapeHandler: ((e: KeyboardEvent) => void) | null = null
  private _keyNavHandler: ((e: KeyboardEvent) => void) | null = null
  private _scrollHandler: (() => void) | null = null
  private _anchorFocusHandler: (() => void) | null = null
  private _anchorBlurHandler: (() => void) | null = null
  private _activeIndex = -1
  private _focusedBeforeOpen: HTMLElement | null = null

  private _overlord: UIWindowWC | null = null
  private _parentRef: HTMLElement | null = null

  private _configured = false

  static get observedAttributes() {
    return [...POPUP_ATTRS]
  }

  /** Traverse shadow roots to find the actually focused element */
  private static _deepActiveElement(): HTMLElement | null {
    let el = document.activeElement as HTMLElement | null
    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement as HTMLElement
    }
    return el
  }

  /** Check if target (or any of its shadow hosts) is inside container */
  private static _containsDeep(container: HTMLElement, target: HTMLElement): boolean {
    let current: HTMLElement | null = target
    while (current) {
      if (container.contains(current)) return true
      const root = current.getRootNode() as ShadowRoot | Document
      if (root instanceof ShadowRoot) {
        current = root.host as HTMLElement
      } else {
        break
      }
    }
    return false
  }

  constructor(options?: UIPopupOptions) {
    super()
    // The popup-wc element itself is invisible — it acts as a controller.
    // The visual popup is a UIWindowWC that portals to body/window-manager.
    this.style.display = 'none'

    if (options) this.configure(options)
  }

  /**
   * Configure the popup programmatically.
   * Creates the internal UIWindowWC and sets up event handlers.
   */
  configure(options: UIPopupOptions): void {
    const o = options
    this._anchor = o.anchor ?? this._anchor
    this._kind = o.kind ?? this._kind
    this._alignment = o.alignment ?? this._alignment
    this._margin = o.margin ?? this._margin
    this._detachable = o.detachable ?? this._detachable
    this._title = o.title ?? this._title
    this._width = typeof o.width === 'number' ? o.width : this._width
    this._height = typeof o.height === 'number' ? o.height : this._height
    this._closeOnClickOutside = o.closeOnClickOutside ?? this._closeOnClickOutside
    this._closeOnEscape = o.closeOnEscape ?? this._closeOnEscape
    this._parentRef = o.parentRef ?? this._parentRef
    this._resizable = o.resizable ?? this._resizable
    this._scrollMode = o.scroll ?? this._scrollMode
    this._minWidth = o.minWidth ?? this._minWidth
    this._minHeight = o.minHeight ?? this._minHeight

    this._configured = true
    this._ensureWindow()
  }

  connectedCallback(): void {
    if (this._autoDestroyTimer !== null) { clearTimeout(this._autoDestroyTimer); this._autoDestroyTimer = null }

    if (!this._configured) {
      this._readAttributes()
    }
  }

  disconnectedCallback(): void {
    if (!this._destroyed && this.hasAttribute('auto-destroy')) {
      this._autoDestroyTimer = setTimeout(() => { this._autoDestroyTimer = null; this.destroy() }, 0)
    }
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return
    switch (name) {
      case 'kind': this._kind = (val as PopupKind) ?? 'menu'; break
      case 'alignment': this._alignment = val ?? 'BottomLeft'; break
      case 'margin': this._margin = val !== null ? parseFloat(val) : 4; break
      case 'width': this._width = val !== null ? parseFloat(val) : 200; break
      case 'height': this._height = val !== null ? parseFloat(val) : 250; break
      case 'min-width': this._minWidth = val !== null ? parseFloat(val) : 150; break
      case 'min-height': this._minHeight = val !== null ? parseFloat(val) : 100; break
      case 'resizable': this._resizable = val !== null; break
      case 'detachable': this._detachable = val !== null; break
      case 'title': this._title = val ?? ''; if (this._window) this._window.title = val ?? ''; break
      case 'close-on-click-outside': this._closeOnClickOutside = val !== null; break
      case 'close-on-escape': this._closeOnEscape = val !== null; break
      case 'scroll': this._scrollMode = (val as ScrollMode) ?? undefined; break
      case 'anchor-selector':
        if (val) {
          const resolved = document.querySelector(val) as HTMLElement | null
          if (resolved) this._anchor = resolved
        }
        break
      case 'open':
        if (val !== null) this.show()
        else this.close()
        break
    }
  }

  private _readAttributes(): void {
    for (const name of POPUP_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) {
        this.attributeChangedCallback(name, null, val)
      }
    }
  }

  /**
   * Move light DOM children from <popup-wc> into the internal UIWindowWC's content.
   * Called once at show() — NOT via MutationObserver — so frameworks don't race.
   */
  private _mirrorChildrenToWindow(): void {
    if (!this._window) return
    const content = this._window.contentElement
    while (this.firstChild) {
      content.appendChild(this.firstChild)
    }
  }

  /**
   * Return children from the UIWindowWC back to <popup-wc> so that
   * frameworks (React, Vue, etc.) find them where they were rendered.
   */
  private _returnChildrenFromWindow(): void {
    if (!this._window) return
    const content = this._window.contentElement
    // Only return children that are NOT from the imperative addChild() API
    const imperativeSet = new Set(this._children)
    const toReturn: Node[] = []
    for (let i = 0; i < content.childNodes.length; i++) {
      const node = content.childNodes[i]
      if (!imperativeSet.has(node as HTMLElement)) {
        toReturn.push(node)
      }
    }
    for (const node of toReturn) {
      this.appendChild(node)
    }
  }

  /** Create the internal UIWindowWC if it doesn't exist yet */
  private _ensureWindow(): void {
    if (this._window) return

    const showBar = this._detachable
    this._window = new UIWindowWC({
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
      resizable: this._resizable,
      closable: true,
      minimizable: false, maximizable: false, foldable: false,
      showShortcuts: false,
      minWidth: this._minWidth,
      minHeight: this._minHeight,
      scroll: this._scrollMode ?? ((this._resizable && this._kind === 'menu') ? 'vertical' : undefined),
      scrollBarSize: 'small',
    })

    // While attached the popup manages its own z-index and focus; prevent
    // the WM's MutationObserver from adding a mousedown-focus handler.
    this._window.isFloating = false

    if (this._detachable) this._window.closable = false

    // Auto-close on request-parent-close from UIMenuItemWC
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
          this._window!.closable = true
        }
      })
    }

    // Move any existing imperative children into the window
    for (const ch of this._children) {
      this._window.contentElement.appendChild(ch)
    }
  }

  // ── Public API ──

  get element(): HTMLElement { return (this._window as HTMLElement) ?? (this as HTMLElement) }
  get window(): UIWindowWC | null { return this._window }
  get state(): PopupState { return this._state }
  get visible(): boolean { return this._state !== 'closed' }
  get kind(): PopupKind { return this._kind }

  get anchor(): HTMLElement | null { return this._anchor }
  set anchor(el: HTMLElement | null) { this._anchor = el; if (this._state === 'attached') this._reposition() }

  get title(): string { return this._title }
  set title(value: string) { this._title = value; if (this._window) this._window.title = value }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    if (this._window) applySimulateFocus(this._window, v)
  }

  set overlord(win: UIWindowWC | null) { this._overlord = win }
  get parentRef(): HTMLElement | null { return this._parentRef }
  set parentRef(el: HTMLElement | null) { this._parentRef = el }

  set kind(v: PopupKind) {
    this._kind = v
    if (this.getAttribute('kind') !== v) this.setAttribute('kind', v)
  }

  get alignment(): string { return this._alignment }
  set alignment(v: string) {
    this._alignment = v
    if (this.getAttribute('alignment') !== v) this.setAttribute('alignment', v)
    if (this._state === 'attached') this._reposition()
  }

  get margin(): number { return this._margin }
  set margin(v: number) { this._margin = v; if (this._state === 'attached') this._reposition() }

  get width(): number { return this._width }
  set width(v: number) { this._width = v; if (this._window) this._window.width = v }

  get height(): number { return this._height }
  set height(v: number) { this._height = v; if (this._window) this._window.height = v }

  get minWidth(): number { return this._minWidth }
  set minWidth(v: number) { this._minWidth = v; if (this._window) this._window.minWidth = v }

  get minHeight(): number { return this._minHeight }
  set minHeight(v: number) { this._minHeight = v; if (this._window) this._window.minHeight = v }

  get resizable(): boolean { return this._resizable }
  set resizable(v: boolean) { this._resizable = v; if (this._window) this._window.resizable = v }

  get detachable(): boolean { return this._detachable }
  set detachable(v: boolean) { this._detachable = v }

  get closeOnClickOutside(): boolean { return this._closeOnClickOutside }
  set closeOnClickOutside(v: boolean) { this._closeOnClickOutside = v }

  get closeOnEscape(): boolean { return this._closeOnEscape }
  set closeOnEscape(v: boolean) { this._closeOnEscape = v }

  get scrollMode(): ScrollMode | undefined { return this._scrollMode }
  set scrollMode(v: ScrollMode | undefined) { this._scrollMode = v }

  show(): void {
    if (this._state !== 'closed' || this._destroyed) return
    if (!this._anchor) return

    // Auto-append to DOM if not connected (backward compat for imperative usage)
    if (!this.isConnected) document.body.appendChild(this as unknown as Node)

    this._ensureWindow()
    this._mirrorChildrenToWindow()
    const win = this._window!
    const el = win as HTMLElement
    el.classList.remove('wm-anim', 'wm-anim-close', 'wm-anim-open-start')
    el.style.opacity = ''; el.style.pointerEvents = ''
    const parent = this._resolveParent()
    if (!el.parentNode) parent.appendChild(el)
    // Use absolute positioning when inside a positioned container (WM/Window)
    // so overflow:hidden clips the popup and coords are container-relative.
    if (parent !== document.body) el.style.position = 'absolute'
    this._state = 'attached'

    win.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1

    if (this._kind === 'menu') this._setChildrenFocusable(false)

    // Auto-size menu popups to fit their widest item
    if (this._kind === 'menu') {
      this._autoSizeMenuWidth(win)
    }

    const anchorRect = this._anchor.getBoundingClientRect()
    const anchorW = Math.ceil(anchorRect.width)
    if (anchorW > 0) {
      if (anchorW > win.minWidth) win.minWidth = anchorW
      if (anchorW > win.width) win.width = anchorW
    }

    // Position above all managed windows
    const wm = this._findWindowManager()
    const topZ = wm ? wm.maxZIndex : this._getAnchorZIndex()
    el.style.zIndex = `${topZ + 2}`

    this._reposition()

    // Simulate focus on whoever had focus before (traverse shadow roots)
    this._focusedBeforeOpen = UIPopupWC._deepActiveElement()
    if (this._focusedBeforeOpen) dispatchSimulateFocus(this._focusedBeforeOpen, true)

    if (this._kind === 'menu') {
      // Menu mode: anchor keeps real focus, popup uses document-level keyboard nav
      if (win.onFocused) win.onFocused()
    } else {
      // Container mode: move real focus to popup for Tab cycling
      el.focus({ preventScroll: true })
      if (win.onFocused) win.onFocused()
    }

    if (this._closeOnClickOutside) {
      requestAnimationFrame(() => {
        this._clickOutsideHandler = (e: MouseEvent) => {
          if (this._state !== 'attached') return
          const path = e.composedPath()
          if (path.includes(el) || path.includes(this._anchor!)) return
          this.close()
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
      const path = e.composedPath()
      if (path.includes(win as HTMLElement)) return
      this.close()
    }) as () => void
    document.addEventListener('scroll', this._scrollHandler, { capture: true, passive: true })

    if (this._kind === 'menu') this._bindMenuNav()
    else this._bindContainerNav()

    requestAnimationFrame(() => {
      if (win.scrollBox) {
        const content = win.scrollBox.contentElement
        win.scrollBox.contentWidth = content.scrollWidth
        win.scrollBox.contentHeight = content.scrollHeight
        win.scrollBox.refresh()
      }
    })

    this._emit('show')
  }

  close(): void {
    if (this._state === 'detached') { this._returnFromDetached(); return }
    if (this._state === 'closed') return
    if (!this._window) return
    this._removeListeners()

    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) this._focusedBeforeOpen.focus({ preventScroll: true })
      dispatchSimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    this._returnChildrenFromWindow()
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
    this._ensureWindow()
    this._window!.contentElement.appendChild(el)
  }

  removePopupChild(el: HTMLElement): void {
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
      if (e.key === 'Tab') {
        if (this._focusedBeforeOpen) {
          dispatchSimulateFocus(this._focusedBeforeOpen, false)
          this._focusedBeforeOpen = null
        }
        this.close()
        return
      }
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this._activeIndex = (this._activeIndex + 1) % items.length; this._highlightMenuItem(items) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1; this._highlightMenuItem(items) }
      else if (e.key === 'Enter' && this._activeIndex >= 0) { e.preventDefault(); e.stopPropagation(); items[this._activeIndex].click() }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  private _bindDetachedMenuNav(): void {
    if (!this._window) return
    const win = this._window
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'detached') return
      const active = UIPopupWC._deepActiveElement()
      if (!active) return
      if (!UIPopupWC._containsDeep(win, active) && !this._anchor || !UIPopupWC._containsDeep(this._anchor!, active)) return
      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this._activeIndex = (this._activeIndex + 1) % items.length; this._highlightMenuItem(items); this._bringToolToFront() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1; this._highlightMenuItem(items); this._bringToolToFront() }
      else if (e.key === 'Enter' && this._activeIndex >= 0) { e.preventDefault(); e.stopPropagation(); items[this._activeIndex].click() }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  private _bindAnchorFocusTracking(): void {
    if (!this._anchor || !this._window) return
    this._anchorBlurHandler = () => { if (this._state !== 'detached') return; this._activeIndex = -1; this._clearHighlight() }
    this._anchorFocusHandler = () => {
      if (this._state !== 'detached') return
      this._activeIndex = -1; this._clearHighlight()
      if (this._window?.scrollBox) this._window.scrollBox.scrollContentTo(0, 0)
      this._bringToolToFront()
    }
    this._anchor.addEventListener('blur', this._anchorBlurHandler)
    this._anchor.addEventListener('focus', this._anchorFocusHandler)
  }

  /** Bring the detached tool window to the front of its sibling tools */
  private _bringToolToFront(): void {
    if (!this._window || !this._overlord) return
    if (this._overlord.manager) {
      this._overlord.manager.bringToFront(this._window as any)
    } else {
      // Standalone: reorder _tools and refresh z-indexes only (no focus change)
      const tools = (this._overlord as any)._tools as UIWindowWC[]
      const idx = tools.indexOf(this._window)
      if (idx !== -1 && idx !== tools.length - 1) {
        tools.splice(idx, 1); tools.push(this._window)
      }
      // Reassign z-indexes without calling onFocused (which restores _lastFocusedEl)
      const parent = (this._overlord as HTMLElement).parentElement
      if (parent) {
        let maxZ = 0
        parent.querySelectorAll('window-wc').forEach(el => {
          const z = parseInt((el as HTMLElement).style.zIndex) || 0
          if (z > maxZ) maxZ = z
        })
        const topZ = maxZ + 1
        ;(this._overlord as HTMLElement).style.zIndex = `${topZ}`
        tools.forEach((t: any, i: number) => { (t as HTMLElement).style.zIndex = `${topZ + 1 + i}` })
      }
    }
  }

  // ── Container nav ──

  private _bindContainerNav(): void {
    if (!this._window) return
    this._setChildrenFocusable(true)
    const first = this._window.contentElement.querySelector<HTMLElement>('[data-focusable]')
    if (first) first.focus({ preventScroll: true })
  }

  // ── Parent resolution ──

  private _resolveParent(): HTMLElement {
    if (this._parentRef) return this._parentRef
    if (!this._anchor) return document.body
    // Walk up from the anchor (crossing shadow boundaries) to find
    // a UIWindowManagerWC. Only a WM provides the positioned container
    // needed for absolute popup placement. Without a WM, fall back
    // to document.body with fixed positioning.
    let el: HTMLElement | null = this._anchor
    while (el) {
      if (el.tagName === 'WINDOW-MANAGER-WC') return el
      const parent: HTMLElement | null = el.parentElement
      if (parent) {
        el = parent
      } else {
        const root = el.getRootNode() as ShadowRoot | Document
        if (root instanceof ShadowRoot) {
          el = root.host as HTMLElement
        } else {
          break
        }
      }
    }
    return document.body
  }

  /** Walk up from anchor (crossing shadow boundaries) to find a UIWindowManagerWC */
  private _findWindowManager(): UIWindowManagerWC | null {
    if (!this._anchor) return null
    let el: HTMLElement | null = this._anchor
    while (el) {
      if (el instanceof UIWindowManagerWC) return el
      const parent: HTMLElement | null = el.parentElement
      if (parent) {
        el = parent
      } else {
        const root = el.getRootNode() as ShadowRoot | Document
        if (root instanceof ShadowRoot) {
          el = root.host as HTMLElement
        } else {
          break
        }
      }
    }
    return null
  }

  // ── Positioning ──

  private _getAnchorZIndex(): number {
    if (!this._anchor) return 99999
    let el: HTMLElement | null = this._anchor
    while (el) {
      const z = parseInt(el.style.zIndex) || parseInt(getComputedStyle(el).zIndex)
      if (!isNaN(z) && z > 0) return z
      const parent: HTMLElement | null = el.parentElement
      if (parent) {
        el = parent
      } else {
        const root = el.getRootNode() as ShadowRoot | Document
        if (root instanceof ShadowRoot) {
          el = root.host as HTMLElement
        } else {
          break
        }
      }
    }
    return 99999
  }

  private _setChildrenFocusable(enabled: boolean): void {
    if (!this._window) return
    this._window.contentElement.querySelectorAll('[data-focusable]').forEach(el => {
      if (enabled) (el as HTMLElement).tabIndex = -1
      else (el as HTMLElement).removeAttribute('tabindex')
    })
  }

  private _reposition(): void {
    if (!this._anchor || !this._window) return
    const anchorRect = this._anchor.getBoundingClientRect()
    const el = this._window as HTMLElement
    const w = el.offsetWidth || this._width
    const h = el.offsetHeight || this._height
    const { pos } = findBestPosition(anchorRect, w, h, this._alignment as any, this._margin)
    // findBestPosition returns viewport coords. When the popup is position:absolute
    // inside a container (e.g. UIWindowManagerWC), convert to container-relative.
    if (el.style.position === 'absolute' && el.offsetParent) {
      const r = el.offsetParent.getBoundingClientRect()
      pos.left -= r.left
      pos.top -= r.top
    }
    el.style.left = `${Math.round(pos.left)}px`
    el.style.top = `${Math.round(pos.top)}px`
  }

  // ── Detach ──

  private _detach(): void {
    if (!this._overlord || !this._window) return
    this._removeListeners()
    this._state = 'detached'

    this._window.showTitle = true
    this._window.closable = true

    const el = this._window as HTMLElement
    const wasFixed = el.style.position === 'fixed'
    const fixedLeft = parseFloat(el.style.left) || 0
    const fixedTop = parseFloat(el.style.top) || 0

    this._window.positioning = 'absolute'
    this._window.isFloating = true   // restore so WM manages it as a tool
    el.style.zIndex = ''

    this._overlord.addTool(this._window)

    // Without a WM, addTool doesn't move the element — append it next
    // to the overlord so absolute positioning is relative to the same parent.
    if (!this._overlord.manager) {
      const target = (this._overlord as HTMLElement).parentElement
      if (target) {
        if (el.parentNode !== target) target.appendChild(el)
        // Ensure parent is a positioning context for absolute children
        if (getComputedStyle(target).position === 'static') target.style.position = 'relative'
      }
    }

    // Convert viewport coords to offsetParent-relative after the element
    // has been placed in its final parent.
    if (wasFixed && el.offsetParent) {
      const r = el.offsetParent.getBoundingClientRect()
      el.style.left = `${fixedLeft - r.left}px`
      el.style.top = `${fixedTop - r.top}px`
    }

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
      this._bringToolToFront()
    }

    this._emit('detach')
  }

  private _returnFromDetached(): void {
    if (!this._window) return
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
    if (this._anchorBlurHandler && this._anchor) { this._anchor.removeEventListener('blur', this._anchorBlurHandler); this._anchorBlurHandler = null }
    if (this._anchorFocusHandler && this._anchor) { this._anchor.removeEventListener('focus', this._anchorFocusHandler); this._anchorFocusHandler = null }
  }

  // ── Menu helpers ──

  /** Measure all menu items and set the popup width to fit the widest one */
  private _autoSizeMenuWidth(win: UIWindowWC): void {
    const items = win.contentElement.querySelectorAll<HTMLElement>('menuitem-wc')
    let maxW = 0
    for (const item of items) {
      const nw = (item as any).naturalWidth
      if (typeof nw === 'number' && nw > maxW) maxW = nw
    }
    // Account for scrollbar width (vertical scrollbar takes ~14px for small)
    const sbExtra = win.scrollBox ? 14 : 0
    const needed = maxW + sbExtra
    if (needed > this._minWidth) {
      win.width = needed
      win.minWidth = needed
    }
  }

  private _getMenuItems(): HTMLElement[] {
    if (!this._window) return []
    return Array.from(this._window.contentElement.querySelectorAll<HTMLElement>('menuitem-wc:not(.disabled)'))
  }

  private _highlightMenuItem(items: HTMLElement[]): void {
    this._clearHighlight()
    if (this._activeIndex >= 0 && this._activeIndex < items.length) {
      const item = items[this._activeIndex]
      item.classList.add('highlight')
      if (this._window?.scrollBox) this._window.scrollBox.scrollChildIntoView(item)
    }
  }

  private _clearHighlight(): void {
    if (!this._window) return
    this._window.contentElement.querySelectorAll('menuitem-wc.highlight').forEach(el => {
      el.classList.remove('highlight')
    })
  }

  private _emit(event: PopupEventName, ...args: any[]): void {
    // Vanilla JS listeners (backward compat)
    const handlers = this._listeners.get(event)
    if (handlers) for (const h of handlers) h(...args)

    // CustomEvent for framework integration
    this.dispatchEvent(new CustomEvent(`popup-${event}`, {
      bubbles: true, composed: true,
      detail: { state: this._state },
    }))
  }
}

customElements.define('popup-wc', UIPopupWC)

declare global {
  interface HTMLElementTagNameMap {
    'popup-wc': UIPopupWC
  }
}
