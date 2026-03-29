import type { MenuItemSize, MenuItemTextAlign, UIMenuItemOptions, HintAlignment } from '../common/types'
import { applySimulateFocus } from '../common/simulate-focus-core'
import { UIHintWC } from '../ui-hint-wc/ui-hint-wc'
import type { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'
import cssText from './ui-menu-item-wc.css?inline'

const MENUITEM_ATTRS = [
  'text', 'shortcut', 'size', 'text-align', 'pushable', 'pushed',
  'disabled', 'request-parent-close', 'margin', 'icon-gap',
] as const

export class UIMenuItemWC extends HTMLElement {
  private _shadow: ShadowRoot
  private _leftEl!: HTMLDivElement
  private _centerEl!: HTMLDivElement
  private _textEl!: HTMLSpanElement
  private _shortcutEl: HTMLSpanElement | null = null
  private _rightEl!: HTMLDivElement

  // Slots for framework content projection
  private _leftSlot!: HTMLSlotElement
  private _rightSlot!: HTMLSlotElement
  private _centerSlot!: HTMLSlotElement

  private _text: string = ''
  private _shortcut: string | null = null
  private _size: MenuItemSize = 'medium'
  private _textAlign: MenuItemTextAlign = 'left'
  private _pushable: boolean = false
  private _pushed: boolean = false
  private _disabled: boolean = false
  private _requestParentClose: boolean = true

  private _leftElement: HTMLElement | null = null
  private _centerElement: HTMLElement | null = null
  private _pushedElement: HTMLElement | null = null

  private _clickHandlers: Set<() => void> = new Set()
  private _pushedChangeHandlers: Set<(pushed: boolean) => void> = new Set()
  private _cleanups: Array<() => void> = []
  private _destroyed = false
  private _autoDestroyTimer: ReturnType<typeof setTimeout> | null = null
  private _configured = false

  private _hint: UIHintWC | null = null
  private _resizeObserver: ResizeObserver | null = null

  // Sub-menu
  private _subMenu: UIPopupWC | null = null
  private _subMenuAlignment: HintAlignment = 'RightTop'
  private _subMenuArrow: HTMLElement | null = null
  private _subMenuOpenTimer: ReturnType<typeof setTimeout> | null = null
  private _subMenuCloseTimer: ReturnType<typeof setTimeout> | null = null
  private _hasCustomRight: boolean = false

  static get observedAttributes() {
    return [...MENUITEM_ATTRS]
  }

  constructor(options?: UIMenuItemOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)

    if (options) {
      this._applyOptions(options)
      this._configured = true
    }
    this._buildDOM()
    this._syncTheme()

    // Apply subMenu after DOM is built (needs _rightEl)
    if (options?.subMenu) this.subMenu = options.subMenu as UIPopupWC

    // Theme observer
    const obs = new MutationObserver(() => this._syncTheme())
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    this._cleanups.push(() => obs.disconnect())
  }

  private _applyOptions(o: UIMenuItemOptions): void {
    this._text = o.text
    this._shortcut = o.shortcut ?? null
    this._size = o.size ?? 'medium'
    this._textAlign = o.textAlign ?? 'left'
    this._pushable = o.pushable ?? false
    this._pushed = o.pushed ?? false
    this._disabled = o.disabled ?? false
    this._requestParentClose = o.requestParentClose ?? true

    if (o.margin != null) this.style.setProperty('--ui-menuitem-margin', `${o.margin}px`)
    if (o.iconGap != null) this.style.setProperty('--ui-menuitem-icon-gap', `${o.iconGap}px`)

    if (o.leftElement) this._leftElement = o.leftElement
    if (o.pushedElement) this._pushedElement = o.pushedElement
    if (this._pushable && !this._pushedElement) this._pushedElement = UIMenuItemWC._makeCheckIcon()
    if (o.subMenuAlignment) this._subMenuAlignment = o.subMenuAlignment
    // subMenu is deferred — applied after DOM is built (see constructor)
  }

  private _buildDOM(): void {
    // Apply host classes
    this.classList.add(this._size)
    if (this._disabled) this.classList.add('disabled')
    if (this._pushed) this.classList.add('pushed')
    if (this._pushable) this.setAttribute('data-pushable', '')
    this.setAttribute('data-focusable', '')
    this.tabIndex = -1

    // Left area
    this._leftEl = document.createElement('div')
    this._leftEl.className = 'left'
    this._leftSlot = document.createElement('slot')
    this._leftSlot.name = 'left'
    this._leftEl.appendChild(this._leftSlot)
    this._shadow.appendChild(this._leftEl)

    // Detect slotted left content from frameworks
    this._leftSlot.addEventListener('slotchange', () => {
      const assigned = this._leftSlot.assignedElements()
      if (assigned.length > 0 && !this._leftElement) {
        this.classList.add('has-left')
      } else if (assigned.length === 0 && !this._leftElement) {
        this.classList.remove('has-left')
      }
    })

    // Center area
    this._centerEl = document.createElement('div')
    this._centerEl.className = 'center'
    this._textEl = document.createElement('span')
    this._textEl.className = `text text--${this._textAlign}`
    this._textEl.textContent = this._text
    this._centerEl.appendChild(this._textEl)
    if (this._shortcut) {
      this._shortcutEl = document.createElement('span')
      this._shortcutEl.className = 'shortcut'
      this._shortcutEl.textContent = this._shortcut
      this._centerEl.appendChild(this._shortcutEl)
    }
    this._centerSlot = document.createElement('slot')
    this._centerSlot.name = 'center'
    this._centerEl.appendChild(this._centerSlot)
    this._shadow.appendChild(this._centerEl)

    // Right area
    this._rightEl = document.createElement('div')
    this._rightEl.className = 'right'
    this._rightSlot = document.createElement('slot')
    this._rightSlot.name = 'right'
    this._rightEl.appendChild(this._rightSlot)
    this._shadow.appendChild(this._rightEl)

    // Detect slotted right content from frameworks
    this._rightSlot.addEventListener('slotchange', () => {
      const assigned = this._rightSlot.assignedElements()
      if (assigned.length > 0) {
        this._rightEl.classList.add('has-content')
        this.classList.add('has-right')
      } else if (!this._rightEl.querySelector(':not(slot)')) {
        this._rightEl.classList.remove('has-content')
        this.classList.remove('has-right')
      }
    })

    this._updateLeftSlot()
    this._bindEvents()
    this._setupTruncationHint()
  }

  connectedCallback(): void {
    if (this._autoDestroyTimer !== null) { clearTimeout(this._autoDestroyTimer); this._autoDestroyTimer = null }

    // If not configured programmatically, read from attributes
    if (!this._configured) {
      this._readAttributes()
    }
  }

  disconnectedCallback(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
    if (!this._destroyed && this.hasAttribute('auto-destroy')) {
      this._autoDestroyTimer = setTimeout(() => { this._autoDestroyTimer = null; this.destroy() }, 0)
    }
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return
    switch (name) {
      case 'text': this.text = val ?? ''; break
      case 'shortcut': this.shortcut = val; break
      case 'size': this.size = (val as MenuItemSize) ?? 'medium'; break
      case 'text-align': this.textAlign = (val as MenuItemTextAlign) ?? 'left'; break
      case 'pushable': this.pushable = val !== null; break
      case 'pushed':
        if (this._pushable) {
          this._pushed = val !== null
          this.classList.toggle('pushed', this._pushed)
          this._updateLeftSlot()
        }
        break
      case 'disabled': this.disabled = val !== null; break
      case 'request-parent-close': this.requestParentClose = val !== null; break
      case 'margin': if (val) this.margin = parseFloat(val); break
      case 'icon-gap': if (val) this.iconGap = parseFloat(val); break
    }
  }

  private _readAttributes(): void {
    for (const name of MENUITEM_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) {
        this.attributeChangedCallback(name, null, val)
      }
    }
  }

  // ── Public API ──

  get text(): string { return this._text }
  set text(value: string) {
    this._text = value
    this._textEl.textContent = value
    if (this.getAttribute('text') !== value) this.setAttribute('text', value)
    this._checkTruncation()
  }

  get shortcut(): string | null { return this._shortcut }
  set shortcut(value: string | null) {
    this._shortcut = value
    if (value) {
      if (!this._shortcutEl) {
        this._shortcutEl = document.createElement('span')
        this._shortcutEl.className = 'shortcut'
        if (this._centerElement) this._centerEl.insertBefore(this._shortcutEl, this._centerElement)
        else this._centerEl.appendChild(this._shortcutEl)
      }
      this._shortcutEl.textContent = value
    } else if (this._shortcutEl) {
      this._shortcutEl.remove()
      this._shortcutEl = null
    }
  }

  get pushed(): boolean { return this._pushed }
  set pushed(value: boolean) {
    if (!this._pushable || this._pushed === value) return
    this._pushed = value
    this.classList.toggle('pushed', value)
    if (value) { if (!this.hasAttribute('pushed')) this.setAttribute('pushed', '') }
    else { if (this.hasAttribute('pushed')) this.removeAttribute('pushed') }
    this._updateLeftSlot()
    for (const h of this._pushedChangeHandlers) h(value)

    this.dispatchEvent(new CustomEvent('menuitem-pushed', {
      bubbles: true, composed: true, detail: { pushed: value },
    }))

    // Standard change event for framework two-way binding
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this.classList.toggle('disabled', value)
    if (value) { if (!this.hasAttribute('disabled')) this.setAttribute('disabled', '') }
    else { if (this.hasAttribute('disabled')) this.removeAttribute('disabled') }
  }

  set leftElement(el: HTMLElement | null) {
    this._leftElement = el
    this._updateLeftSlot()
  }

  set rightElement(el: HTMLElement | null) {
    // Clear non-slot children (preserve the <slot> for framework content and submenu arrow)
    const toRemove: Node[] = []
    for (let i = 0; i < this._rightEl.childNodes.length; i++) {
      const node = this._rightEl.childNodes[i]
      if (node instanceof HTMLSlotElement) continue
      if (node === this._subMenuArrow) continue
      toRemove.push(node)
    }
    for (const node of toRemove) this._rightEl.removeChild(node)

    this._hasCustomRight = !!el
    if (el) {
      this._rightEl.insertBefore(el, this._subMenuArrow)
      this._rightEl.classList.add('has-content')
      this.classList.add('has-right')
    } else if (!this._subMenuArrow) {
      this._rightEl.classList.remove('has-content')
      this.classList.remove('has-right')
    }
  }

  set centerElement(el: HTMLElement | null) {
    if (this._centerElement && this._centerElement.parentNode === this._centerEl) {
      this._centerEl.removeChild(this._centerElement)
    }
    this._centerElement = el
    if (el) this._centerEl.appendChild(el)
  }

  set pushedElement(el: HTMLElement | null) {
    this._pushedElement = el
    if (this._pushed) this._updateLeftSlot()
  }

  get requestParentClose(): boolean { return this._requestParentClose }
  set requestParentClose(value: boolean) { this._requestParentClose = value }

  set margin(value: number) { this.style.setProperty('--ui-menuitem-margin', `${value}px`) }
  set iconGap(value: number) { this.style.setProperty('--ui-menuitem-icon-gap', `${value}px`) }

  get pushable(): boolean { return this._pushable }
  set pushable(value: boolean) {
    this._pushable = value
    if (value) { if (!this.hasAttribute('pushable')) this.setAttribute('pushable', '') }
    else { if (this.hasAttribute('pushable')) this.removeAttribute('pushable') }
    if (!value && this._pushed) {
      this._pushed = false
      this.classList.remove('pushed')
      this._updateLeftSlot()
    }
  }

  get size(): MenuItemSize { return this._size }
  set size(value: MenuItemSize) {
    this.classList.remove(this._size)
    this._size = value
    this.classList.add(this._size)
    if (this.getAttribute('size') !== value) this.setAttribute('size', value)
    this._checkTruncation()
  }

  get textAlign(): MenuItemTextAlign { return this._textAlign }
  set textAlign(value: MenuItemTextAlign) {
    this._textEl.classList.remove(`text--${this._textAlign}`)
    this._textAlign = value
    this._textEl.classList.add(`text--${this._textAlign}`)
    if (this.getAttribute('text-align') !== value) this.setAttribute('text-align', value)
  }

  /** Minimum width needed to display text + shortcut without ellipsis */
  get naturalWidth(): number {
    const center = this._centerEl
    let w = center.scrollWidth // natural content width including padding
    if (this.classList.contains('has-left')) {
      const ls = getComputedStyle(this._leftEl)
      w += this._leftEl.offsetWidth + parseFloat(ls.marginLeft) + parseFloat(ls.marginRight)
    }
    if (this.classList.contains('has-right')) {
      const rs = getComputedStyle(this._rightEl)
      w += this._rightEl.offsetWidth + parseFloat(rs.marginRight)
    }
    return Math.ceil(w)
  }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this, v)
  }

  // ── Sub-menu API ──

  get subMenu(): UIPopupWC | null { return this._subMenu }
  set subMenu(popup: UIPopupWC | null) {
    // Detach previous
    if (this._subMenu) {
      (this._subMenu as any)._parentMenuItem = null
      this._removeSubMenuArrow()
    }

    this._subMenu = popup

    if (popup) {
      // Wire up the popup
      (popup as any)._parentMenuItem = this
      popup.anchor = this
      popup.alignment = this._subMenuAlignment
      popup.closeOnClickOutside = false
      popup.closeOnEscape = false
      // Don't close parent when sub-menu items request close — cascade handles this
      if (!this._hasCustomRight) this._showSubMenuArrow()
      this._bindSubMenuHover()
    }
  }

  get hasSubMenu(): boolean { return this._subMenu !== null }

  get subMenuAlignment(): HintAlignment { return this._subMenuAlignment }
  set subMenuAlignment(v: HintAlignment) {
    this._subMenuAlignment = v
    if (this._subMenu) this._subMenu.alignment = v
  }

  /** Open the sub-menu (called by parent popup keyboard nav) */
  openSubMenu(): void {
    if (!this._subMenu || this._disabled) return
    if (this._subMenu.visible) return

    // Close any sibling sub-menus in the same parent popup first
    const parentPopup = this._findOwnerPopup()
    if (parentPopup) {
      (parentPopup as any)._closeSiblingSubMenus()
    }

    // Auto-wire overlord: if the sub-menu is detachable and has no overlord,
    // inherit the parent popup's overlord (the real WM-managed window) so
    // detached tools register correctly with the WindowManager's z-order.
    // Fall back to the parent popup's own window for standalone (no-WM) cases.
    if (this._subMenu.detachable && !(this._subMenu as any)._overlord) {
      const parentOverlord = parentPopup ? (parentPopup as any)._overlord as any : null
      if (parentOverlord) {
        this._subMenu.overlord = parentOverlord
      } else if (parentPopup?.window) {
        this._subMenu.overlord = parentPopup.window
      }
    }

    // Inherit detachedScroll and parentRef from parent so all levels behave consistently
    if (parentPopup) {
      if (this._subMenu.detachedScroll !== (parentPopup as any)._detachedScroll) {
        this._subMenu.detachedScroll = (parentPopup as any)._detachedScroll
      }
      const parentRef = (parentPopup as any)._parentRef as HTMLElement | null
      if (parentRef && !(this._subMenu as any)._parentRef) {
        this._subMenu.parentRef = parentRef
      }
    }

    this._subMenu.show()
  }

  /** Walk up the DOM to find the UIPopupWC that owns this menu item */
  private _findOwnerPopup(): UIPopupWC | null {
    // The item lives inside a popup's window contentElement.
    // Walk up to find popup-wc, or search all popups.
    let el: HTMLElement | null = this.parentElement
    while (el) {
      if (el.tagName === 'POPUP-WC') return el as unknown as UIPopupWC
      el = el.parentElement
    }
    // Fallback: search all popups whose window contains this item
    for (const p of document.querySelectorAll('popup-wc')) {
      const popup = p as unknown as UIPopupWC
      if (popup.window && popup.window.contentElement?.contains(this)) return popup
    }
    return null
  }

  /** Close the sub-menu if it's in attached state */
  closeSubMenuIfAttached(): void {
    if (!this._subMenu) return
    if (this._subMenu.state === 'attached') this._subMenu.close()
  }

  private _showSubMenuArrow(): void {
    if (this._subMenuArrow) return
    this._subMenuArrow = UIMenuItemWC._makeSvg(['M6 3l5 5-5 5'], 12)
    this._subMenuArrow.classList.add('submenu-arrow')
    this._rightEl.appendChild(this._subMenuArrow)
    this._rightEl.classList.add('has-content')
    this.classList.add('has-right')
  }

  private _removeSubMenuArrow(): void {
    if (!this._subMenuArrow) return
    this._subMenuArrow.remove()
    this._subMenuArrow = null
    if (!this._hasCustomRight) {
      this._rightEl.classList.remove('has-content')
      this.classList.remove('has-right')
    }
  }

  private _bindSubMenuHover(): void {
    // Hover open (200ms delay) — mouse enters this item → open its sub-menu
    const onEnter = () => {
      if (!this._subMenu || this._disabled) return
      this._cancelSubMenuOpen()
      if (this._subMenu.visible) return
      this._subMenuOpenTimer = setTimeout(() => { this._subMenuOpenTimer = null; this.openSubMenu() }, 200)
    }
    const onLeave = () => {
      // Only cancel the pending open timer — do NOT close the sub-menu on leave.
      // Sub-menus close when a sibling item is hovered (handled by UIPopupWC mouseover),
      // or when the parent popup closes (handled by _closeAllChildSubMenus).
      this._cancelSubMenuOpen()
    }
    this.addEventListener('mouseenter', onEnter)
    this.addEventListener('mouseleave', onLeave)
    this._cleanups.push(
      () => this.removeEventListener('mouseenter', onEnter),
      () => this.removeEventListener('mouseleave', onLeave),
    )
  }

  private _cancelSubMenuOpen(): void {
    if (this._subMenuOpenTimer !== null) { clearTimeout(this._subMenuOpenTimer); this._subMenuOpenTimer = null }
  }

  private _cancelSubMenuClose(): void {
    if (this._subMenuCloseTimer !== null) { clearTimeout(this._subMenuCloseTimer); this._subMenuCloseTimer = null }
  }

  /** Check if any descendant sub-menu's window is being hovered */
  private _isDescendantSubMenuHovered(): boolean {
    if (!this._subMenu || !this._subMenu.window) return false
    const win = this._subMenu.window as HTMLElement
    if (win.matches(':hover')) return true
    // Check items inside this sub-menu for their own open sub-menus
    const items = this._subMenu.window!.contentElement?.querySelectorAll('menuitem-wc') ?? []
    for (const item of items) {
      const mi = item as any
      if (mi.hasSubMenu && mi.subMenu?.visible) {
        if (mi._isDescendantSubMenuHovered()) return true
      }
    }
    return false
  }

  onClick(handler: () => void): void { this._clickHandlers.add(handler) }
  offClick(handler: () => void): void { this._clickHandlers.delete(handler) }
  onPushedChange(handler: (pushed: boolean) => void): void { this._pushedChangeHandlers.add(handler) }
  offPushedChange(handler: (pushed: boolean) => void): void { this._pushedChangeHandlers.delete(handler) }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._cancelSubMenuOpen()
    this._cancelSubMenuClose()
    if (this._subMenu) (this._subMenu as any)._parentMenuItem = null
    this._subMenu = null
    for (const fn of this._cleanups) fn()
    this._cleanups.length = 0
    this._clickHandlers.clear()
    this._pushedChangeHandlers.clear()
    if (this._hint) { this._hint.destroy(); this._hint = null }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null }
    this.remove()
  }

  // ── Static helpers ──

  /** Remove all children except <slot> elements from a shadow DOM container */
  private static _clearNonSlotChildren(container: HTMLElement): void {
    const toRemove: Node[] = []
    for (let i = 0; i < container.childNodes.length; i++) {
      const node = container.childNodes[i]
      if (node instanceof HTMLSlotElement) continue
      toRemove.push(node)
    }
    for (const node of toRemove) container.removeChild(node)
  }

  private static _makeSvg(paths: string[], size = 14): HTMLElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', `${size}`)
    svg.setAttribute('height', `${size}`)
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    for (const d of paths) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', d)
      svg.appendChild(path)
    }
    return svg as unknown as HTMLElement
  }

  private static _makeCheckIcon(): HTMLElement {
    return UIMenuItemWC._makeSvg(['M3 8l3.5 3.5L13 5'], 14)
  }

  // ── Theme ──

  private _syncTheme(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    this.classList.toggle('win95', theme.startsWith('win95'))
  }

  // ── Private ──

  private _bindEvents(): void {
    const onClick = (e: MouseEvent) => {
      if (this._disabled) return
      e.preventDefault()

      // If item has a sub-menu, open it instead of emitting click/close
      if (this._subMenu) {
        if (this._subMenu.visible) return
        this.openSubMenu()
        return
      }

      if (this._pushable) this.pushed = !this._pushed
      for (const h of this._clickHandlers) h()

      this.dispatchEvent(new CustomEvent('menuitem-click', {
        bubbles: true, composed: true,
      }))

      if (this._requestParentClose) {
        this.dispatchEvent(new CustomEvent('request-parent-close', { bubbles: true, composed: true }))
      }
    }
    this.addEventListener('click', onClick)
    this._cleanups.push(() => this.removeEventListener('click', onClick))
  }

  private _animContainer: HTMLDivElement | null = null
  private _leftIconWrap: HTMLDivElement | null = null
  private _pushedIconWrap: HTMLDivElement | null = null

  private _updateLeftSlot(): void {
    const hasContent = this._pushable || (this._pushed && this._pushedElement) || this._leftElement
    this.classList.toggle('has-left', !!hasContent)

    if (this._pushable && this._leftElement && this._pushedElement) {
      if (!this._animContainer) {
        UIMenuItemWC._clearNonSlotChildren(this._leftEl)
        this._animContainer = document.createElement('div')
        this._animContainer.className = 'left-anim'

        this._leftIconWrap = document.createElement('div')
        this._leftIconWrap.className = 'left-icon'
        this._leftIconWrap.appendChild(this._leftElement)

        this._pushedIconWrap = document.createElement('div')
        this._pushedIconWrap.className = 'left-icon'
        this._pushedIconWrap.appendChild(this._pushedElement)

        this._animContainer.appendChild(this._leftIconWrap)
        this._animContainer.appendChild(this._pushedIconWrap)
        this._leftEl.appendChild(this._animContainer)
      }
      if (this._leftIconWrap && this._pushedIconWrap) {
        this._leftIconWrap.classList.toggle('left-icon--hidden', this._pushed)
        this._leftIconWrap.classList.toggle('left-icon--visible', !this._pushed)
        this._pushedIconWrap.classList.toggle('left-icon--hidden', !this._pushed)
        this._pushedIconWrap.classList.toggle('left-icon--visible', this._pushed)
      }
    } else {
      this._animContainer = null
      this._leftIconWrap = null
      this._pushedIconWrap = null
      UIMenuItemWC._clearNonSlotChildren(this._leftEl)
      if (this._pushed && this._pushedElement) {
        this._leftEl.appendChild(this._pushedElement)
      } else if (this._leftElement) {
        this._leftEl.appendChild(this._leftElement)
      }
    }
  }

  private _setupTruncationHint(): void {
    this._resizeObserver = new ResizeObserver(() => this._checkTruncation())
    this._resizeObserver.observe(this._textEl)
  }

  private _checkTruncation(): void {
    const truncated = this._textEl.scrollWidth > this._textEl.clientWidth
    if (truncated && !this._hint) {
      this._hint = new UIHintWC()
      this._hint.configure({
        anchor: this,
        content: this._text,
        alignment: 'BottomLeft',
        trigger: 'hover',
        showDelay: 600,
        arrow: true,
      })
    } else if (!truncated && this._hint) {
      this._hint.destroy()
      this._hint = null
    } else if (truncated && this._hint) {
      this._hint.content = this._text
    }
  }
}

customElements.define('menuitem-wc', UIMenuItemWC)

declare global {
  interface HTMLElementTagNameMap {
    'menuitem-wc': UIMenuItemWC
  }
}
