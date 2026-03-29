import cssText from './ui-menubar-wc.css?raw'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'
import { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'
import type { UIMenuBarOptions } from '../common/types'

export class UIMenuBarWC extends HTMLElement {
  private _shadow: ShadowRoot
  private _bar!: HTMLDivElement
  private _slot!: HTMLSlotElement
  private _disabled: boolean = false
  private _activeIndex: number = -1
  private _openPopup: UIPopupWC | null = null
  private _openItem: UIMenuItemWC | null = null
  private _barActive: boolean = false  // true when bar has keyboard focus
  private _cleanups: (() => void)[] = []
  private _itemCleanups: Map<UIMenuItemWC, (() => void)[]> = new Map()
  private _popupRegistry: Map<UIMenuItemWC, UIPopupWC> = new Map()
  // Overflow
  private _overflowItem!: UIMenuItemWC
  private _overflowPopup!: UIPopupWC
  private _resizeObserver: ResizeObserver | null = null
  private _overflowDebounce: number = 0

  constructor(options?: UIMenuBarOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)

    this._buildDOM()
    this._syncTheme()
    this._bindEvents()

    if (options) {
      if (options.disabled) this.disabled = options.disabled
      if (options.className) this.classList.add(...options.className.split(/\s+/))
    }
  }

  // ── DOM ──

  private _buildDOM(): void {
    this._bar = document.createElement('div')
    this._bar.classList.add('bar')

    this._slot = document.createElement('slot')
    this._bar.appendChild(this._slot)

    // Overflow ">>" trigger (inside shadow DOM, not slotted)
    this._overflowItem = new UIMenuItemWC({ text: '>>' })
    this._overflowItem.style.cssText = 'flex-shrink:0;width:auto !important;padding:0 10px;display:none;'
    this._overflowPopup = new UIPopupWC()
    this._overflowPopup.kind = 'menu'
    this._overflowPopup.width = 220
    this._bar.appendChild(this._overflowItem)
    // Register overflow as a regular bar item so it gets hover, click, keyboard
    this.setPopup(this._overflowItem, this._overflowPopup)
    this._bindItem(this._overflowItem)

    this._shadow.appendChild(this._bar)
  }

  // ── Theme ──

  private _syncTheme(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    this.classList.toggle('win95', theme.startsWith('win95'))
  }

  // ── Properties ──

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this.classList.toggle('disabled', value)
    if (value) {
      this._closeOpenPopup()
      this._clearHighlight()
    }
  }

  static get observedAttributes(): string[] { return ['disabled'] }
  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    if (name === 'disabled') this.disabled = val !== null
  }

  // ── Public Methods ──

  addItem(item: UIMenuItemWC, popup?: UIPopupWC): void {
    if (!this.contains(item)) this.appendChild(item)
    if (popup) this.setPopup(item, popup)
  }

  /** Associate a popup with a bar item (without using item.subMenu, which triggers sub-menu behavior) */
  setPopup(item: UIMenuItemWC, popup: UIPopupWC): void {
    popup.anchor = item
    popup.alignment = 'BottomLeft'
    popup.margin = 2
    popup.minHeight = 0
    popup.closeOnClickOutside = true
    popup.closeOnEscape = true
    this._popupRegistry.set(item, popup)
  }

  removeItem(item: UIMenuItemWC): void {
    if (this.contains(item)) {
      this._unbindItem(item)
      item.remove()
    }
  }

  /** All slotted menuitem-wc children (regardless of visibility) */
  private _getSlottedItems(): UIMenuItemWC[] {
    return this._slot
      ? (this._slot.assignedElements().filter(el => el.tagName === 'MENUITEM-WC') as UIMenuItemWC[])
      : []
  }

  /** Visible items for navigation (includes overflow trigger when active) */
  getItems(): UIMenuItemWC[] {
    const slotted = this._getSlottedItems()
    if (this._overflowItem && this._overflowItem.style.display !== 'none') {
      return [...slotted.filter(i => i.style.display !== 'none'), this._overflowItem]
    }
    return slotted
  }

  destroy(): void {
    this._closeOpenPopup()
    this._clearHighlight()
    for (const [, fns] of this._itemCleanups) fns.forEach(fn => fn())
    this._itemCleanups.clear()
    for (const fn of this._cleanups) fn()
    this._cleanups.length = 0
  }

  // ── Events ──

  private _bindEvents(): void {
    // Slot change — auto-detect items
    this._slot.addEventListener('slotchange', () => this._onSlotChange())

    // Theme observer
    const obs = new MutationObserver(() => this._syncTheme())
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    this._cleanups.push(() => obs.disconnect())

    // Keyboard — capture phase to intercept before popup
    const onKey = (e: KeyboardEvent) => this._handleKeyDown(e)
    document.addEventListener('keydown', onKey, true)
    this._cleanups.push(() => document.removeEventListener('keydown', onKey, true))

    // Overflow recalculation on resize
    this._resizeObserver = new ResizeObserver(() => {
      clearTimeout(this._overflowDebounce)
      this._overflowDebounce = window.setTimeout(() => this._recalcOverflow(), 50)
    })
    this._resizeObserver.observe(this)
    this._cleanups.push(() => { this._resizeObserver?.disconnect(); this._resizeObserver = null })

    // Click outside — deactivate bar
    const onDocClick = (e: MouseEvent) => {
      if (!this._barActive && !this._openPopup) return
      const path = e.composedPath()
      if (path.includes(this)) return
      // Check if click is inside one of our popups or any descendant sub-popup
      if (this._isClickInsidePopupTree(path)) return
      this._closeOpenPopup()
      this._clearHighlight()
      this._barActive = false
    }
    document.addEventListener('mousedown', onDocClick, true)
    this._cleanups.push(() => document.removeEventListener('mousedown', onDocClick, true))
  }

  private _onSlotChange(): void {
    const current = new Set(this._getSlottedItems())

    // Unbind removed slotted items (not the overflow item)
    for (const [item] of this._itemCleanups) {
      if (item === this._overflowItem) continue
      if (!current.has(item)) this._unbindItem(item)
    }

    // Bind new slotted items
    for (const item of current) {
      if (!this._itemCleanups.has(item)) this._bindItem(item)
    }

    // Recalculate overflow after items change
    requestAnimationFrame(() => this._recalcOverflow())
  }

  private _bindItem(item: UIMenuItemWC): void {
    const fns: (() => void)[] = []

    // Capture phase: intercept click before item's own handler
    const onClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (this._disabled) return
      // Deactivate all other menubars on the page
      document.querySelectorAll<UIMenuBarWC>('menubar-wc').forEach(other => {
        if (other !== this) { other._closeOpenPopup(); other._clearHighlight(); other._barActive = false }
      })
      if (this._openItem === item && this._openPopup?.visible) {
        this._closeOpenPopup()
      } else {
        this._openItemPopup(item)
      }
    }
    item.addEventListener('click', onClick, true)
    fns.push(() => item.removeEventListener('click', onClick, true))

    const onEnter = () => {
      if (this._disabled) return
      // Hover swap: if a popup is already open, switch to this item's popup
      if (this._openPopup?.visible && this._openItem !== item) {
        this._openItemPopup(item)
        return
      }
      // Always highlight on hover
      this._clearHighlight()
      item.highlighted = true
      const items = this.getItems()
      this._activeIndex = items.indexOf(item)
    }
    item.addEventListener('mouseenter', onEnter)
    fns.push(() => item.removeEventListener('mouseenter', onEnter))

    const onLeave = () => {
      // Clear highlight/active when mouse leaves and no popup is open for this item
      if (this._openItem !== item) {
        item.highlighted = false
        item.active = false
      }
    }
    item.addEventListener('mouseleave', onLeave)
    fns.push(() => item.removeEventListener('mouseleave', onLeave))

    this._itemCleanups.set(item, fns)
  }

  private _unbindItem(item: UIMenuItemWC): void {
    const fns = this._itemCleanups.get(item)
    if (fns) {
      fns.forEach(fn => fn())
      this._itemCleanups.delete(item)
    }
  }

  // ── Popup management ──

  private _getPopup(item: UIMenuItemWC): UIPopupWC | null {
    return this._popupRegistry.get(item) ?? (item.subMenu as UIPopupWC | null)
  }

  private _openItemPopup(item: UIMenuItemWC): void {
    if (this._disabled) return
    const popup = this._getPopup(item)
    if (!popup) return

    // Close any currently open popup
    this._closeOpenPopup()
    this._clearHighlight()

    // Mark active
    item.active = true
    this._openItem = item
    this._openPopup = popup
    this._barActive = true

    // Update highlight index
    const items = this.getItems()
    this._activeIndex = items.indexOf(item)

    // If item is hidden (overflow), anchor popup to the overflow trigger instead
    if (item.style.display === 'none') {
      popup.anchor = this._overflowItem
    }

    // Move focus to the active item so the popup's simulate-focus targets the right element
    const focusTarget = item.style.display === 'none' ? this._overflowItem : item
    focusTarget.focus({ preventScroll: true })

    // Open the popup
    popup.show()

    // Listen for popup close
    const onClose = () => {
      this._onPopupClosed(item)
      popup.removeEventListener('popup-close', onClose)
    }
    popup.addEventListener('popup-close', onClose)

    this.dispatchEvent(new CustomEvent('menubar-open', {
      bubbles: true, composed: true, detail: { item },
    }))
  }

  private _closeOpenPopup(): void {
    const prevItem = this._openItem
    const prevPopup = this._openPopup
    // Clear references BEFORE closing so _onPopupClosed doesn't re-highlight
    this._openPopup = null
    this._openItem = null
    if (prevItem) prevItem.active = false
    if (prevPopup && prevPopup.visible) prevPopup.close()
  }

  private _onPopupClosed(item: UIMenuItemWC): void {
    item.active = false
    if (this._openItem === item) {
      this._openPopup = null
      this._openItem = null
      // After popup closes, bar keeps keyboard focus for arrow navigation
      this._barActive = true
      this._popupJustClosed = true
      this._highlightIndex(this._activeIndex)
    }
    this.dispatchEvent(new CustomEvent('menubar-close', {
      bubbles: true, composed: true, detail: { item },
    }))
  }

  /** Check if an event path includes any popup window in our tree (including sub-popups) */
  private _isClickInsidePopupTree(path: EventTarget[]): boolean {
    for (const popup of this._popupRegistry.values()) {
      if (this._isPathInPopupChain(path, popup)) return true
    }
    // Also check the overflow popup
    if (this._overflowPopup && this._isPathInPopupChain(path, this._overflowPopup)) return true
    return false
  }

  private _isPathInPopupChain(path: EventTarget[], popup: UIPopupWC): boolean {
    const win = popup.window
    if (!win) return false
    if (path.includes(win as unknown as EventTarget)) return true
    // Check sub-popups: iterate menu items inside this popup to find their sub-menus
    const items = win.contentElement.querySelectorAll('menuitem-wc')
    for (const item of items) {
      const sub = (item as UIMenuItemWC).subMenu as UIPopupWC | null
      if (sub && this._isPathInPopupChain(path, sub)) return true
    }
    return false
  }

  // ── Overflow ──

  private _recalcOverflow(): void {
    const items = this._getSlottedItems()
    if (items.length === 0) return

    // Reset: show all items, hide overflow
    for (const item of items) item.style.display = ''
    this._overflowItem.style.display = 'none'

    const barWidth = this._bar.clientWidth
    if (barWidth === 0) return

    // Measure overflow trigger width (show briefly to measure)
    this._overflowItem.style.display = ''
    const overflowW = this._overflowItem.offsetWidth || 40
    this._overflowItem.style.display = 'none'

    // Check if all items fit
    let totalW = 0
    for (const item of items) totalW += item.offsetWidth
    if (totalW <= barWidth) return // all fit, no overflow needed

    // Find cutoff point (reserve space for ">>" trigger)
    const availW = barWidth - overflowW
    let cumW = 0
    let cutoffIndex = items.length
    for (let i = 0; i < items.length; i++) {
      cumW += items[i].offsetWidth
      if (cumW > availW) { cutoffIndex = i; break }
    }
    if (cutoffIndex >= items.length) return // all fit after all

    // Hide overflowed items
    const overflowed = items.slice(cutoffIndex)
    for (const item of overflowed) item.style.display = 'none'

    // Show ">>" trigger
    this._overflowItem.style.display = ''

    // Populate overflow popup with proxy items
    // Clear overflow popup children
    // Clear previous children manually
    if (this._overflowPopup.window) {
      const content = this._overflowPopup.window.contentElement
      while (content.firstChild) content.removeChild(content.firstChild)
    }

    for (const item of overflowed) {
      const popup = this._getPopup(item)
      const proxy = new UIMenuItemWC({ text: item.text })
      if (popup) {
        // Wire original popup as a sub-menu of the proxy item
        popup.anchor = proxy
        proxy.subMenu = popup
      } else {
        // No popup — proxy click opens original item's popup
        proxy.addEventListener('click', () => {
          this._overflowPopup.close()
          this._openItemPopup(item)
        })
      }
      this._overflowPopup.addChild(proxy)
    }
  }

  // ── Highlight ──

  private _highlightIndex(index: number): void {
    this._clearHighlight()
    const items = this.getItems()
    if (index < 0 || index >= items.length) return
    this._activeIndex = index
    items[index].highlighted = true
  }

  private _clearHighlight(): void {
    for (const item of this.getItems()) {
      item.highlighted = false
    }
    // Always clear overflow item even if hidden
    if (this._overflowItem) this._overflowItem.highlighted = false
  }

  // ── Keyboard ──

  private _popupJustClosed: boolean = false

  private _isEventMine(_e: KeyboardEvent): boolean {
    const active = document.activeElement as HTMLElement | null
    if (!active) return false
    if (this.contains(active)) return true
    if (this._shadowContains(active)) return true
    // Check if active element is inside any popup in our tree
    const fakePath = [active]
    return this._isClickInsidePopupTree(fakePath)
  }

  private _shadowContains(el: HTMLElement): boolean {
    // Check if element is inside our shadow DOM (e.g. overflow item)
    return this._shadow.contains(el)
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this._disabled) return

    // If a popup is open, handle boundary crossing
    if (this._openPopup?.visible) {
      if (!this._isEventMine(e)) return
      this._handleKeyWithPopupOpen(e)
      return
    }

    // After a popup closes, the same Escape keydown event reaches bar-level nav.
    // Skip only Escape in this case — arrow keys should work immediately.
    if (this._popupJustClosed) {
      this._popupJustClosed = false
      if (e.key === 'Escape') return
    }

    // Bar-level nav only when bar is active (after a popup was closed or item clicked)
    if (!this._barActive) return
    if (!this._isEventMine(e)) return

    const items = this.getItems()
    if (items.length === 0) return

    if (e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation()
      const next = this._activeIndex < items.length - 1 ? this._activeIndex + 1 : 0
      this._highlightIndex(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); e.stopPropagation()
      const prev = this._activeIndex > 0 ? this._activeIndex - 1 : items.length - 1
      this._highlightIndex(prev)
    } else if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation()
      if (this._activeIndex >= 0 && this._activeIndex < items.length) {
        this._openItemPopup(items[this._activeIndex])
      }
    } else if (e.key === 'Escape') {
      // Only deactivate bar if no popup just closed this frame
      // (popup Escape already consumed the key)
      if (this._activeIndex >= 0) {
        this._clearHighlight()
        this._activeIndex = -1
        this._barActive = false
      }
    }
  }

  private _handleKeyWithPopupOpen(e: KeyboardEvent): void {
    if (!this._openPopup) return

    // Only intercept at the popup root level (no active sub-menu chain)
    if (this._openPopup.hasActiveSubMenu) return

    const items = this.getItems()
    if (items.length === 0) return

    if (e.key === 'ArrowLeft') {
      // If the popup is a sub-menu root with no active sub, cross to previous bar item
      e.preventDefault(); e.stopPropagation()
      const prev = this._activeIndex > 0 ? this._activeIndex - 1 : items.length - 1
      this._openItemPopup(items[prev])
    } else if (e.key === 'ArrowRight') {
      // Only cross to next bar item if highlighted item has no sub-menu
      const highlighted = this._openPopup.highlightedItem
      if (highlighted && highlighted.hasSubMenu) return // let popup handle it
      e.preventDefault(); e.stopPropagation()
      const next = this._activeIndex < items.length - 1 ? this._activeIndex + 1 : 0
      this._openItemPopup(items[next])
    } else if (e.key === 'Escape') {
      // Let popup handle Escape first — it closes one level at a time
      // When the root popup closes, _onPopupClosed fires and we go to bar-level nav
      return
    }
  }
}

customElements.define('menubar-wc', UIMenuBarWC)
