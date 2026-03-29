import type { PopupState, PopupKind, UIPopupOptions, ScrollMode, DetachedScrollBehavior } from '../common/types'
import { applySimulateFocus } from '../common/simulate-focus-core'
import { findBestPosition } from '../common/positioning'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'
import type { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'

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
  private _maxHeight: number = 0

  private _closeOnClickOutside: boolean = true
  private _closeOnEscape: boolean = true
  private _detachedScroll: DetachedScrollBehavior = 'fixed'
  private _detachedScrollHandler: (() => void) | null = null
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

  /** Set automatically by UIMenuItemWC.subMenu setter */
  _parentMenuItem: UIMenuItemWC | null = null
  /** Tracks which sub-menu popup is currently receiving keyboard navigation */
  private _activeSubMenu: UIPopupWC | null = null

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
  /** Walk the _activeSubMenu chain to find the deepest popup receiving navigation */
  private static _findDeepestActive(root: UIPopupWC): { deepest: UIPopupWC; parent: UIPopupWC } {
    let parent: UIPopupWC = root
    let current: UIPopupWC = root._activeSubMenu!
    while (current._activeSubMenu) {
      parent = current
      current = current._activeSubMenu
    }
    return { deepest: current, parent }
  }

  /** Walk up from a menu item to find the UIPopupWC whose window contains it */
  private static _findOwnerPopup(item: HTMLElement): UIPopupWC | null {
    // The item lives inside a UIWindowWC's contentElement. The UIPopupWC owns that window.
    // Walk up to find window-wc, then find the popup-wc that references it.
    let el: HTMLElement | null = item.parentElement
    while (el) {
      if (el.tagName === 'POPUP-WC') return el as unknown as UIPopupWC
      // The item is inside the popup's window contentElement (light DOM).
      // The popup-wc element is in the DOM but the window is portaled.
      // So we check all popup-wc elements to find the one whose window contains the item.
      el = el.parentElement
    }
    // Fallback: search all popup-wc elements
    for (const p of document.querySelectorAll('popup-wc')) {
      const popup = p as unknown as UIPopupWC
      if (popup.window && popup.window.contentElement?.contains(item)) return popup
    }
    return null
  }

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
    this._maxHeight = o.maxHeight ?? this._maxHeight
    this._detachedScroll = o.detachedScroll ?? this._detachedScroll

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
      if (this._state === 'closed') return
      // Walk the entire ancestor chain collecting attached popups to close.
      // Detached popups are skipped (they stay open) but the walk continues
      // through them so intermediate attached levels are also closed.
      requestAnimationFrame(() => {
        const chain: UIPopupWC[] = []
        let current: UIPopupWC = this
        while (current._state === 'attached' || current._state === 'detached') {
          if (current._state === 'attached') chain.push(current)
          const parentItem: UIMenuItemWC | null = current._parentMenuItem
          if (!parentItem || !parentItem.requestParentClose) break
          const owner = UIPopupWC._findOwnerPopup(parentItem)
          if (!owner) break
          current = owner
        }
        for (const p of chain) p.close()
      })
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
          // Close sibling sub-menu when hovering a different item
          if (this._activeIndex >= 0) {
            const prev = items[this._activeIndex] as any
            if (prev?.hasSubMenu) prev.closeSubMenuIfAttached()
          }
          this._activeSubMenu = null
          this._activeIndex = idx
          this._highlightMenuItem(items)
        }
      })
      this._window.contentElement.addEventListener('mouseleave', () => {
        if (this._state === 'closed') return
        // Don't clear highlight if the highlighted item has an open sub-menu
        // (mouse is traveling from parent item to sub-menu popup)
        if (this._activeIndex >= 0) {
          const items = this._getMenuItems()
          const active = items[this._activeIndex] as any
          if (active?.hasSubMenu && active.subMenu?.visible) return
        }
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

  get maxHeight(): number { return this._maxHeight }
  set maxHeight(v: number) { this._maxHeight = v }

  get detachable(): boolean { return this._detachable }
  set detachable(v: boolean) { this._detachable = v }

  get closeOnClickOutside(): boolean { return this._closeOnClickOutside }
  set closeOnClickOutside(v: boolean) { this._closeOnClickOutside = v }

  get closeOnEscape(): boolean { return this._closeOnEscape }
  set closeOnEscape(v: boolean) { this._closeOnEscape = v }

  get scrollMode(): ScrollMode | undefined { return this._scrollMode }
  set scrollMode(v: ScrollMode | undefined) { this._scrollMode = v }

  get detachedScroll(): DetachedScrollBehavior { return this._detachedScroll }
  set detachedScroll(v: DetachedScrollBehavior) { this._detachedScroll = v }

  /** Whether this popup is being used as a sub-menu (has a parent menu item) */
  get isSubMenu(): boolean { return this._parentMenuItem !== null }

  /** Close only if in attached state (used for cascade close) */
  closeIfAttached(): void {
    if (this._state === 'attached') this.close()
  }

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
    if (parent !== document.body) win.positioning = 'absolute'
    this._state = 'attached'

    win.resetLastFocused()
    this._clearHighlight()
    this._activeIndex = -1

    if (this._kind === 'menu') this._setChildrenFocusable(false)

    // Auto-size menu popups to fit their content
    if (this._kind === 'menu') {
      this._autoSizeMenuWidth(win)
      this._autoSizeMenuHeight(win)
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

    if (this._parentMenuItem) {
      // Sub-menu: skip focus management entirely — the root popup owns it.
      // Just visually mark this window's titlebar as focused.
      win.simulateFocus = true
    } else if (this._kind === 'menu') {
      // Root menu: anchor keeps real focus, popup uses document-level keyboard nav
      this._focusedBeforeOpen = UIPopupWC._deepActiveElement()
      if (this._focusedBeforeOpen) applySimulateFocus(this._focusedBeforeOpen, true)
      // Mark titlebar as focused without calling onFocused() — that would
      // strip 'focused' from sibling windows in the same container.
      win.titleBarElement.classList.add('focused')
      win.simulateFocus = true
    } else if (this._kind === 'container' && this._parentMenuItem) {
      // Container sub-menu: do NOT steal focus — already handled above
    } else {
      // Container mode (standalone): move real focus to popup for Tab cycling
      this._focusedBeforeOpen = UIPopupWC._deepActiveElement()
      if (this._focusedBeforeOpen) applySimulateFocus(this._focusedBeforeOpen, true)
      el.focus({ preventScroll: true })
      win.titleBarElement.classList.add('focused')
    }

    if (this._closeOnClickOutside) {
      requestAnimationFrame(() => {
        this._clickOutsideHandler = (e: MouseEvent) => {
          if (this._state !== 'attached') return
          const path = e.composedPath()
          if (path.includes(el) || path.includes(this._anchor!)) return
          // Don't close if click is inside a descendant sub-menu's window
          if (this._isClickInsideDescendantSubMenu(path)) return
          this.close()
        }
        document.addEventListener('mousedown', this._clickOutsideHandler, true)
      })
    }

    // Menu-kind popups handle Escape in _bindMenuNav / _bindDetachedMenuNav
    // so they can close one level at a time. Non-menu popups use the generic handler.
    if (this._closeOnEscape && this._kind !== 'menu') {
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
      // Don't close if scroll is inside a descendant sub-menu's window
      if (this._isClickInsideDescendantSubMenu(path)) return
      // Don't close on page-level scroll if popup is position:fixed (it doesn't move)
      if (win.positioning === 'fixed') {
        const scrollTarget = path[0]
        if (scrollTarget === document || scrollTarget === document.documentElement || scrollTarget === document.body) return
      }
      this.close()
    }) as () => void
    document.addEventListener('scroll', this._scrollHandler, { capture: true, passive: true })

    // Sub-menu popups don't bind their own keyboard handler — the parent popup
    // handles all keyboard delegation via _activeSubMenu chain.
    if (this._kind === 'menu' && !this._parentMenuItem) this._bindMenuNav()
    else if (this._kind !== 'menu') this._bindContainerNav()
    // else: menu sub-menu — no keyboard binding needed (parent handles it)

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

    // Close any open child sub-menus first
    this._closeAllChildSubMenus()
    this._activeSubMenu = null

    this._removeListeners()

    if (this._focusedBeforeOpen) {
      if (this._focusedBeforeOpen.isConnected) this._focusedBeforeOpen.focus({ preventScroll: true })
      // Remove simulate-focus directly without dispatching a bubbling event,
      // which would propagate up to the parent window and strip its focused state.
      applySimulateFocus(this._focusedBeforeOpen, false)
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

      // Walk the chain and clean up any closed references
      { let c: UIPopupWC = this
        while (c._activeSubMenu) {
          if (c._activeSubMenu._state === 'closed') { c._activeSubMenu = null; break }
          c = c._activeSubMenu
        }
      }
      // If a sub-menu chain is actively receiving navigation, delegate to the deepest level
      if (this._activeSubMenu) {
        // Walk the chain to find deepest active sub-menu and its parent
        const { deepest, parent } = UIPopupWC._findDeepestActive(this)

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation()
          deepest._navigateUpDown(e.key === 'ArrowDown' ? 1 : -1)
          if (deepest._state === 'detached') deepest._bringToolToFront()
          return
        }
        if (e.key === 'ArrowRight') {
          // Check if the deepest sub-menu's highlighted item also has a sub-menu
          const subItem = deepest._getHighlightedItem()
          if (subItem && (subItem as any).hasSubMenu) {
            e.preventDefault(); e.stopPropagation()
            deepest._openSubMenuOfHighlighted()
            return
          }
          return
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault(); e.stopPropagation()
          // Go up one level: clear deepest and return to its parent
          deepest._clearHighlight()
          deepest._activeIndex = -1
          // Close attached sub-menu if it was opened by ArrowRight
          const deepestParentItem = deepest._parentMenuItem
          if (deepestParentItem && deepest._state === 'attached') {
            deepestParentItem.closeSubMenuIfAttached()
          }
          parent._activeSubMenu = null
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation()
          const subItem = deepest._getHighlightedItem()
          if (subItem) {
            if ((subItem as any).hasSubMenu) {
              deepest._openSubMenuOfHighlighted()
            } else {
              subItem.click()
            }
          }
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault(); e.stopPropagation()
          deepest._clearHighlight()
          deepest._activeIndex = -1
          if (deepest._parentMenuItem && deepest._state === 'attached') {
            deepest._parentMenuItem.closeSubMenuIfAttached()
          }
          parent._activeSubMenu = null
          return
        }
      }

      if (e.key === 'Tab') {
        if (this._focusedBeforeOpen) {
          applySimulateFocus(this._focusedBeforeOpen, false)
          this._focusedBeforeOpen = null
        }
        this.close()
        return
      }
      if (e.key === 'Escape' && this._closeOnEscape) {
        e.preventDefault(); e.stopPropagation()
        this.close()
        return
      }
      const items = this._getMenuItems()
      if (items.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopPropagation()
        // Close any open sibling sub-menu when moving highlight
        this._closeSiblingSubMenus()
        this._activeIndex = (this._activeIndex + 1) % items.length
        this._highlightMenuItem(items)
      }
      else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation()
        this._closeSiblingSubMenus()
        this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1
        this._highlightMenuItem(items)
      }
      else if (e.key === 'ArrowRight' && this._activeIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        this._openSubMenuOfHighlighted()
      }
      else if (e.key === 'ArrowLeft') {
        // If this is a sub-menu in attached state, close and return to parent
        if (this._parentMenuItem && this._state === 'attached') {
          e.preventDefault(); e.stopPropagation()
          this.close()
        }
      }
      else if (e.key === 'Enter' && this._activeIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        const item = items[this._activeIndex]
        if ((item as any).hasSubMenu) {
          this._openSubMenuOfHighlighted()
        } else {
          item.click()
        }
      }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  /** Navigate up/down within this popup's items (called when this popup is receiving delegated nav) */
  _navigateUpDown(direction: 1 | -1): void {
    const items = this._getMenuItems()
    if (items.length === 0) return
    if (direction === 1) {
      this._activeIndex = (this._activeIndex + 1) % items.length
    } else {
      this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1
    }
    this._highlightMenuItem(items)
  }

  /** Get the currently highlighted menu item element */
  _getHighlightedItem(): HTMLElement | null {
    if (this._activeIndex < 0) return null
    const items = this._getMenuItems()
    return items[this._activeIndex] ?? null
  }

  /** Open the sub-menu of the currently highlighted item */
  private _openSubMenuOfHighlighted(): void {
    const items = this._getMenuItems()
    if (this._activeIndex < 0 || this._activeIndex >= items.length) return
    const item = items[this._activeIndex] as any
    if (!item.hasSubMenu) return

    const subPopup = item.subMenu as UIPopupWC
    if (subPopup.state === 'detached') {
      // Sub-menu is detached — redirect navigation to it without opening
      this._activeSubMenu = subPopup
      subPopup._activeIndex = -1
      subPopup._navigateUpDown(1) // highlight first item
      subPopup._bringToolToFront()
    } else {
      // Open the sub-menu
      item.openSubMenu()
      // Redirect navigation to the newly opened sub-menu
      this._activeSubMenu = subPopup
      subPopup._activeIndex = -1
      subPopup._navigateUpDown(1) // highlight first item
    }
  }

  /** Close any open sibling sub-menus (only one sub-menu open per level) */
  /** Close all open sub-menus of items in this popup (recursive) */
  private _closeAllChildSubMenus(): void {
    if (!this._window) return
    const items = this._getMenuItems()
    for (const item of items) {
      const mi = item as any
      if (mi.hasSubMenu && mi.subMenu?.visible) {
        const subPopup = mi.subMenu as UIPopupWC
        subPopup._closeAllChildSubMenus()
        if (subPopup._state === 'attached') subPopup.close()
      }
    }
  }

  /** Check if a click event path includes any descendant sub-menu's window */
  private _isClickInsideDescendantSubMenu(path: EventTarget[]): boolean {
    if (!this._window) return false
    const items = this._getMenuItems()
    for (const item of items) {
      const mi = item as any
      if (!mi.hasSubMenu || !mi.subMenu?.visible) continue
      const subPopup = mi.subMenu as UIPopupWC
      const subWin = subPopup.window as HTMLElement | null
      if (subWin && path.includes(subWin)) return true
      // Recurse into deeper levels
      if (subPopup._isClickInsideDescendantSubMenu(path)) return true
    }
    return false
  }

  private _closeSiblingSubMenus(): void {
    if (this._activeSubMenu) {
      this._activeSubMenu._clearHighlight()
      this._activeSubMenu._activeIndex = -1
      this._activeSubMenu = null
    }
    // Close any attached sub-menus from menu items
    const items = this._getMenuItems()
    for (const item of items) {
      if ((item as any).hasSubMenu) {
        (item as any).closeSubMenuIfAttached()
      }
    }
  }

  private _bindDetachedMenuNav(): void {
    if (!this._window) return
    const win = this._window
    this._keyNavHandler = (e: KeyboardEvent) => {
      if (this._state !== 'detached') return
      const active = UIPopupWC._deepActiveElement()
      if (!active) return
      if (!UIPopupWC._containsDeep(win, active) && !this._anchor || !UIPopupWC._containsDeep(this._anchor!, active)) return

      // Delegate to active sub-menu chain (same logic as attached mode)
      // Walk the chain and clean up any closed references (e.g. sub-menu closed
      // by request-parent-close while an intermediate level is still detached)
      { let c: UIPopupWC = this
        while (c._activeSubMenu) {
          if (c._activeSubMenu._state === 'closed') { c._activeSubMenu = null; break }
          c = c._activeSubMenu
        }
      }
      if (this._activeSubMenu) {
        const { deepest, parent } = UIPopupWC._findDeepestActive(this)

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation()
          deepest._navigateUpDown(e.key === 'ArrowDown' ? 1 : -1)
          if (deepest._state === 'detached') deepest._bringToolToFront()
          return
        }
        if (e.key === 'ArrowRight') {
          const subItem = deepest._getHighlightedItem()
          if (subItem && (subItem as any).hasSubMenu) {
            e.preventDefault(); e.stopPropagation()
            deepest._openSubMenuOfHighlighted()
          }
          return
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault(); e.stopPropagation()
          deepest._clearHighlight()
          deepest._activeIndex = -1
          const deepestParentItem = deepest._parentMenuItem
          if (deepestParentItem && deepest._state === 'attached') {
            deepestParentItem.closeSubMenuIfAttached()
          }
          parent._activeSubMenu = null
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation()
          const subItem = deepest._getHighlightedItem()
          if (subItem) {
            if ((subItem as any).hasSubMenu) deepest._openSubMenuOfHighlighted()
            else subItem.click()
          }
          return
        }
        if (e.key === 'Escape') {
          e.preventDefault(); e.stopPropagation()
          deepest._clearHighlight()
          deepest._activeIndex = -1
          if (deepest._parentMenuItem && deepest._state === 'attached') {
            deepest._parentMenuItem.closeSubMenuIfAttached()
          }
          parent._activeSubMenu = null
          return
        }
      }

      const items = this._getMenuItems()
      if (items.length === 0) return
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this._closeSiblingSubMenus(); this._activeIndex = (this._activeIndex + 1) % items.length; this._highlightMenuItem(items); this._bringToolToFront() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this._closeSiblingSubMenus(); this._activeIndex = this._activeIndex <= 0 ? items.length - 1 : this._activeIndex - 1; this._highlightMenuItem(items); this._bringToolToFront() }
      else if (e.key === 'ArrowRight' && this._activeIndex >= 0) { e.preventDefault(); e.stopPropagation(); this._openSubMenuOfHighlighted() }
      else if (e.key === 'Enter' && this._activeIndex >= 0) {
        e.preventDefault(); e.stopPropagation()
        const item = items[this._activeIndex] as any
        if (item.hasSubMenu) this._openSubMenuOfHighlighted()
        else item.click()
      }
    }
    document.addEventListener('keydown', this._keyNavHandler, true)
  }

  /** Walk this popup and all descendant detached sub-menus, calling fn on each */
  private _forEachDetachedDescendant(fn: (p: UIPopupWC) => void): void {
    fn(this)
    const items = this._getMenuItems()
    for (const item of items) {
      const mi = item as any
      if (mi.hasSubMenu && mi.subMenu?.state === 'detached') {
        (mi.subMenu as UIPopupWC)._forEachDetachedDescendant(fn)
      }
    }
  }

  private _bindAnchorFocusTracking(): void {
    if (!this._anchor || !this._window) return
    this._anchorBlurHandler = () => {
      if (this._state !== 'detached') return
      this._forEachDetachedDescendant(p => {
        p._activeIndex = -1; p._clearHighlight()
      })
      this._activeSubMenu = null
    }
    this._anchorFocusHandler = () => {
      if (this._state !== 'detached') return
      this._forEachDetachedDescendant(p => {
        p._activeIndex = -1; p._clearHighlight()
        if (p._window?.scrollBox) p._window.scrollBox.scrollContentTo(0, 0)
        p._bringToolToFront()
      })
      this._activeSubMenu = null
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
    if (this._window.positioning === 'absolute' && el.offsetParent) {
      const r = el.offsetParent.getBoundingClientRect()
      pos.left -= r.left
      pos.top -= r.top
      // Clamp so popup never escapes above or left of its container
      if (pos.top < 0) pos.top = 0
      if (pos.left < 0) pos.left = 0
    }
    el.style.left = `${Math.round(pos.left)}px`
    el.style.top = `${Math.round(pos.top)}px`
  }

  // ── Detach ──

  private _detach(): void {
    if (!this._window) return
    this._removeListeners()
    this._state = 'detached'

    this._window.showTitle = true
    this._window.closable = true
    // Clear simulate-focus: the window is now a real tool, not an attached popup.
    // It should participate in normal focus management (standalone mousedown handler).
    this._window.simulateFocus = false

    const el = this._window as HTMLElement

    if (this._overlord) {
      // Detach with overlord: become a tool window relative to the overlord
      const wasFixed = this._window.positioning === 'fixed'
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

    }
    // else: standalone detach — keep position:fixed, stay in current parent

    this._window.onClosed = () => this._returnFromDetached()

    // Clear simulate-focus BEFORE restoring overlord focus, so that
    // overlord.onFocused() can re-add 'focused' to tools that simulateFocus=false stripped.
    if (this._focusedBeforeOpen) {
      applySimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    }

    if (this._overlord) {
      if (this._overlord.manager) this._overlord.manager.bringToFront(this._overlord)
      if (this._overlord.onFocused) this._overlord.onFocused()
    }

    if (this._kind === 'menu') {
      this._activeIndex = -1; this._clearHighlight()
      // Re-focus anchor so detached keyboard nav continues to work
      // (dragging the title bar moves focus to the window element)
      if (this._anchor) this._anchor.focus({ preventScroll: true })
      this._bindDetachedMenuNav(); this._bindAnchorFocusTracking()
    } else {
      this._setChildrenFocusable(true)
      this._window.resetLastFocused()
      const first = this._window.contentElement.querySelector('[data-focusable]') as HTMLElement | null
      if (first) first.focus({ preventScroll: true })
      this._bringToolToFront()
    }

    // Bind scroll-follow for detached popups with 'follow' behavior.
    // Only the root detached popup binds the listener; it repositions
    // itself and all descendant detached popups on each scroll frame.
    if (this._detachedScroll === 'follow' && !this._parentMenuItem) {
      this._bindDetachedScrollFollow()
    }

    this._emit('detach')
  }

  /** Shift a detached popup's window position by a delta.
   *  Only applies to position:fixed popups — absolute-positioned popups
   *  already follow scroll naturally via their offset parent. */
  private _shiftDetachedPosition(dx: number, dy: number): void {
    if (!this._window || this._state !== 'detached') return
    if (this._window.positioning !== 'fixed') return
    const el = this._window as HTMLElement
    const curLeft = parseFloat(el.style.left) || 0
    const curTop = parseFloat(el.style.top) || 0
    el.style.left = `${Math.round(curLeft + dx)}px`
    el.style.top = `${Math.round(curTop + dy)}px`
  }

  /** Bind a page scroll listener that shifts all detached popups by the scroll delta */
  private _bindDetachedScrollFollow(): void {
    if (this._detachedScrollHandler) return
    let lastScrollX = window.scrollX
    let lastScrollY = window.scrollY
    this._detachedScrollHandler = () => {
      if (this._state !== 'detached') return
      const dx = lastScrollX - window.scrollX
      const dy = lastScrollY - window.scrollY
      lastScrollX = window.scrollX
      lastScrollY = window.scrollY
      if (dx === 0 && dy === 0) return
      this._forEachDetachedDescendant(p => p._shiftDetachedPosition(dx, dy))
    }
    document.addEventListener('scroll', this._detachedScrollHandler, { capture: true, passive: true } as any)
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
      applySimulateFocus(this._focusedBeforeOpen, false)
      this._focusedBeforeOpen = null
    } else if (this._anchor?.isConnected) {
      // _focusedBeforeOpen was cleared during detach — restore focus to anchor
      this._anchor.focus({ preventScroll: true })
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
    if (this._detachedScrollHandler) { document.removeEventListener('scroll', this._detachedScrollHandler, true); this._detachedScrollHandler = null }
  }

  // ── Menu helpers ──

  /** Measure all menu items and set the popup width to fit the widest one */
  /** Measure all menu items and set popup height to fit them, capped by maxHeight and viewport */
  private _autoSizeMenuHeight(win: UIWindowWC): void {
    const items = win.contentElement.querySelectorAll<HTMLElement>('menuitem-wc')
    if (items.length === 0) return

    // Measure total content height needed
    let totalH = 0
    for (const item of items) totalH += item.offsetHeight || 28
    const titleBarH = win.showTitle ? win.titleBarHeight : 0
    const needed = totalH + titleBarH

    // Determine max available height from viewport (or container)
    const anchorRect = this._anchor?.getBoundingClientRect()
    const viewH = window.innerHeight
    const maxViewH = anchorRect
      ? Math.max(viewH - anchorRect.bottom, anchorRect.top) - this._margin
      : viewH - 20

    // Cap: content needed → maxHeight → viewport available
    let h = needed
    if (this._maxHeight && h > this._maxHeight) h = this._maxHeight
    if (h > maxViewH) h = maxViewH
    if (h < this._minHeight) h = this._minHeight

    win.height = h
  }

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
