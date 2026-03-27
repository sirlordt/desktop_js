import type { MenuItemSize, MenuItemTextAlign, UIMenuItemOptions } from '../common/types'
import { applySimulateFocus } from '../common/simulate-focus-core'
import { HintWC } from '../ui-hint-wc/ui-hint-wc'
import cssText from './ui-menu-item-wc.css?inline'

export class MenuItemWC extends HTMLElement {
  private _shadow: ShadowRoot
  private _leftEl!: HTMLDivElement
  private _centerEl!: HTMLDivElement
  private _textEl!: HTMLSpanElement
  private _shortcutEl: HTMLSpanElement | null = null
  private _rightEl!: HTMLDivElement

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

  private _hint: HintWC | null = null
  private _resizeObserver: ResizeObserver | null = null

  constructor(options?: UIMenuItemOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)

    if (options) this._applyOptions(options)
    this._buildDOM()
    this._syncTheme()

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
    if (this._pushable && !this._pushedElement) this._pushedElement = MenuItemWC._makeCheckIcon()
  }

  private _buildDOM(): void {
    // Apply host classes
    this.classList.add(this._size)
    if (this._disabled) this.classList.add('disabled')
    if (this._pushed) this.classList.add('pushed')
    if (this._pushable) this.setAttribute('data-pushable', '')
    this.setAttribute('data-focusable', '')
    this.tabIndex = -1

    // Left slot
    this._leftEl = document.createElement('div')
    this._leftEl.className = 'left'
    this._shadow.appendChild(this._leftEl)

    // Center slot
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
    this._shadow.appendChild(this._centerEl)

    // Right slot
    this._rightEl = document.createElement('div')
    this._rightEl.className = 'right'
    this._shadow.appendChild(this._rightEl)

    this._updateLeftSlot()
    this._bindEvents()
    this._setupTruncationHint()
  }

  connectedCallback(): void {
    // Apply right/center elements that were set via options
    // (they need to be in DOM for proper rendering)
  }

  // ── Public API ──

  get text(): string { return this._text }
  set text(value: string) {
    this._text = value
    this._textEl.textContent = value
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
    this._updateLeftSlot()
    for (const h of this._pushedChangeHandlers) h(value)

    this.dispatchEvent(new CustomEvent('menuitem-pushed', {
      bubbles: true, composed: true, detail: { pushed: value },
    }))
  }

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this.classList.toggle('disabled', value)
  }

  set leftElement(el: HTMLElement | null) {
    this._leftElement = el
    this._updateLeftSlot()
  }

  set rightElement(el: HTMLElement | null) {
    this._rightEl.innerHTML = ''
    if (el) {
      this._rightEl.appendChild(el)
      this._rightEl.classList.add('has-content')
      this.classList.add('has-right')
    } else {
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
    this._checkTruncation()
  }

  get textAlign(): MenuItemTextAlign { return this._textAlign }
  set textAlign(value: MenuItemTextAlign) {
    this._textEl.classList.remove(`text--${this._textAlign}`)
    this._textAlign = value
    this._textEl.classList.add(`text--${this._textAlign}`)
  }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this, v)
  }

  onClick(handler: () => void): void { this._clickHandlers.add(handler) }
  offClick(handler: () => void): void { this._clickHandlers.delete(handler) }
  onPushedChange(handler: (pushed: boolean) => void): void { this._pushedChangeHandlers.add(handler) }
  offPushedChange(handler: (pushed: boolean) => void): void { this._pushedChangeHandlers.delete(handler) }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    for (const fn of this._cleanups) fn()
    this._cleanups.length = 0
    this._clickHandlers.clear()
    this._pushedChangeHandlers.clear()
    if (this._hint) { this._hint.destroy(); this._hint = null }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null }
    this.remove()
  }

  // ── Static helpers ──

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
    return MenuItemWC._makeSvg(['M3 8l3.5 3.5L13 5'], 14)
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
        this._leftEl.innerHTML = ''
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
      this._leftEl.innerHTML = ''
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
      this._hint = new HintWC()
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

customElements.define('menuitem-wc', MenuItemWC)
