import type { MenuItemSize, MenuItemTextAlign, UIMenuItemOptions } from '../common/types'
import { applySimulateFocus } from '../common/simulate-focus'
import { UIHint } from '../ui-hint/ui-hint'
import './ui-menu-item.css'

export class UIMenuItem {
  private _el: HTMLDivElement
  private _leftEl: HTMLDivElement
  private _centerEl: HTMLDivElement
  private _textEl: HTMLSpanElement
  private _shortcutEl: HTMLSpanElement | null = null
  private _rightEl: HTMLDivElement

  private _text: string
  private _shortcut: string | null
  private _size: MenuItemSize
  private _textAlign: MenuItemTextAlign
  private _pushable: boolean
  private _pushed: boolean
  private _disabled: boolean
  private _requestParentClose: boolean

  private _leftElement: HTMLElement | null = null
  private _centerElement: HTMLElement | null = null
  private _pushedElement: HTMLElement | null = null

  private _clickHandlers: Set<() => void> = new Set()
  private _pushedChangeHandlers: Set<(pushed: boolean) => void> = new Set()
  private _cleanups: Array<() => void> = []
  private _destroyed = false

  private _hint: UIHint | null = null
  private _resizeObserver: ResizeObserver | null = null

  constructor(options: UIMenuItemOptions) {
    const o = options
    this._text = o.text
    this._shortcut = o.shortcut ?? null
    this._size = o.size ?? 'medium'
    this._textAlign = o.textAlign ?? 'left'
    this._pushable = o.pushable ?? false
    this._pushed = o.pushed ?? false
    this._disabled = o.disabled ?? false
    this._requestParentClose = o.requestParentClose ?? true

    // Build DOM
    this._el = document.createElement('div')
    this._el.className = `ui-menuitem ui-menuitem--${this._size}`
    if (o.className) this._el.classList.add(...o.className.split(/\s+/))
    if (this._disabled) this._el.classList.add('ui-menuitem--disabled')
    if (this._pushed) this._el.classList.add('ui-menuitem--pushed')
    if (this._pushable) this._el.setAttribute('data-pushable', '')
    if (o.margin != null) this._el.style.setProperty('--ui-menuitem-margin', `${o.margin}px`)
    if (o.iconGap != null) this._el.style.setProperty('--ui-menuitem-icon-gap', `${o.iconGap}px`)

    // Left slot
    this._leftEl = document.createElement('div')
    this._leftEl.className = 'ui-menuitem__left'
    this._el.appendChild(this._leftEl)

    // Center slot
    this._centerEl = document.createElement('div')
    this._centerEl.className = 'ui-menuitem__center'
    this._textEl = document.createElement('span')
    this._textEl.className = `ui-menuitem__text ui-menuitem__text--${this._textAlign}`
    this._textEl.textContent = this._text
    this._centerEl.appendChild(this._textEl)
    if (this._shortcut) {
      this._shortcutEl = document.createElement('span')
      this._shortcutEl.className = 'ui-menuitem__shortcut'
      this._shortcutEl.textContent = this._shortcut
      this._centerEl.appendChild(this._shortcutEl)
    }
    this._el.appendChild(this._centerEl)

    // Right slot
    this._rightEl = document.createElement('div')
    this._rightEl.className = 'ui-menuitem__right'
    this._el.appendChild(this._rightEl)

    // Set initial elements
    if (o.leftElement) this._leftElement = o.leftElement
    if (o.pushedElement) this._pushedElement = o.pushedElement

    // Default pushed icon for pushable items
    if (this._pushable) {
      if (!this._pushedElement) this._pushedElement = UIMenuItem._makeCheckIcon()
    }
    if (o.rightElement) this.rightElement = o.rightElement
    if (o.centerElement) this.centerElement = o.centerElement

    // Always update left slot to set has-left class
    this._updateLeftSlot()

    this._bindEvents()
    this._setupTruncationHint()
  }

  // ── Public API ──

  get element(): HTMLDivElement { return this._el }

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
        this._shortcutEl.className = 'ui-menuitem__shortcut'
        // Insert before centerElement if present, otherwise append
        if (this._centerElement) {
          this._centerEl.insertBefore(this._shortcutEl, this._centerElement)
        } else {
          this._centerEl.appendChild(this._shortcutEl)
        }
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
    this._el.classList.toggle('ui-menuitem--pushed', value)
    this._updateLeftSlot()
    for (const h of this._pushedChangeHandlers) h(value)
  }

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this._el.classList.toggle('ui-menuitem--disabled', value)
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
      this._el.classList.add('has-right')
    } else {
      this._rightEl.classList.remove('has-content')
      this._el.classList.remove('has-right')
    }
  }

  set centerElement(el: HTMLElement | null) {
    // Remove old center element (not the text)
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

  set margin(value: number) {
    this._el.style.setProperty('--ui-menuitem-margin', `${value}px`)
  }

  set iconGap(value: number) {
    this._el.style.setProperty('--ui-menuitem-icon-gap', `${value}px`)
  }

  get pushable(): boolean { return this._pushable }
  set pushable(value: boolean) {
    this._pushable = value
    if (!value && this._pushed) {
      this._pushed = false
      this._el.classList.remove('ui-menuitem--pushed')
      this._updateLeftSlot()
    }
  }

  get size(): MenuItemSize { return this._size }
  set size(value: MenuItemSize) {
    this._el.classList.remove(`ui-menuitem--${this._size}`)
    this._size = value
    this._el.classList.add(`ui-menuitem--${this._size}`)
    this._checkTruncation()
  }

  get textAlign(): MenuItemTextAlign { return this._textAlign }
  set textAlign(value: MenuItemTextAlign) {
    this._textEl.classList.remove(`ui-menuitem__text--${this._textAlign}`)
    this._textAlign = value
    this._textEl.classList.add(`ui-menuitem__text--${this._textAlign}`)
  }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this._el, v)
  }

  onClick(handler: () => void): void {
    this._clickHandlers.add(handler)
  }

  offClick(handler: () => void): void {
    this._clickHandlers.delete(handler)
  }

  onPushedChange(handler: (pushed: boolean) => void): void {
    this._pushedChangeHandlers.add(handler)
  }

  offPushedChange(handler: (pushed: boolean) => void): void {
    this._pushedChangeHandlers.delete(handler)
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    for (const fn of this._cleanups) fn()
    this._cleanups.length = 0
    this._clickHandlers.clear()
    this._pushedChangeHandlers.clear()
    if (this._hint) { this._hint.destroy(); this._hint = null }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null }
    this._el.remove()
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
    return UIMenuItem._makeSvg(['M3 8l3.5 3.5L13 5'], 14)
  }

  // ── Private ──

  private _bindEvents(): void {
    const onClick = (e: MouseEvent) => {
      if (this._disabled) return
      e.preventDefault()
      if (this._pushable) {
        this.pushed = !this._pushed
      }
      for (const h of this._clickHandlers) h()
      if (this._requestParentClose) {
        this._el.dispatchEvent(new CustomEvent('request-parent-close', { bubbles: true }))
      }
    }
    this._el.addEventListener('click', onClick)
    this._cleanups.push(() => this._el.removeEventListener('click', onClick))
  }

  private _animContainer: HTMLDivElement | null = null
  private _leftIconWrap: HTMLDivElement | null = null
  private _pushedIconWrap: HTMLDivElement | null = null

  private _updateLeftSlot(): void {
    const hasContent = this._pushable || (this._pushed && this._pushedElement) || this._leftElement
    this._el.classList.toggle('has-left', !!hasContent)

    if (this._pushable && this._leftElement && this._pushedElement) {
      // Animated crossfade mode
      if (!this._animContainer) {
        this._leftEl.innerHTML = ''
        this._animContainer = document.createElement('div')
        this._animContainer.className = 'ui-menuitem__left-anim'

        this._leftIconWrap = document.createElement('div')
        this._leftIconWrap.className = 'ui-menuitem__left-icon'
        this._leftIconWrap.appendChild(this._leftElement)

        this._pushedIconWrap = document.createElement('div')
        this._pushedIconWrap.className = 'ui-menuitem__left-icon'
        this._pushedIconWrap.appendChild(this._pushedElement)

        this._animContainer.appendChild(this._leftIconWrap)
        this._animContainer.appendChild(this._pushedIconWrap)
        this._leftEl.appendChild(this._animContainer)
      }
      // Toggle visibility
      if (this._leftIconWrap && this._pushedIconWrap) {
        this._leftIconWrap.classList.toggle('ui-menuitem__left-icon--hidden', this._pushed)
        this._leftIconWrap.classList.toggle('ui-menuitem__left-icon--visible', !this._pushed)
        this._pushedIconWrap.classList.toggle('ui-menuitem__left-icon--hidden', !this._pushed)
        this._pushedIconWrap.classList.toggle('ui-menuitem__left-icon--visible', this._pushed)
      }
    } else {
      // Simple swap mode (no animation)
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
      this._hint = new UIHint({
        anchor: this._el,
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
