import type { ScrollBarKind, ScrollBarSize, UIScrollBarOptions, TooltipColorRange, TooltipColorFn } from '../common/types'
import { applySimulateFocus } from '../common/simulate-focus'
import { UIToolButton } from '../common/ui-tool-button'
import type { ToolButtonIcon } from '../common/ui-tool-button'
import './ui-scrollbar.css'

const THUMB_MIN_SIZE = 20

type EventName = 'change' | 'dragstart' | 'dragend'
type EventHandler = (value: number) => void

export class UIScrollBar {
  private _kind: ScrollBarKind
  private _size: ScrollBarSize

  // --- Value ---
  private _min: number = 0
  private _max: number = 100
  private _value: number = 0
  step: number = 1
  pageStep: number = 10

  // --- Thumb ---
  thumbSize: number | string | null = null
  showTooltip: boolean = false
  tooltipColors: TooltipColorRange[] = []
  onTooltipColor: TooltipColorFn | null = null

  // --- Behavior ---
  captureParentEvents: boolean = false
  wheelFactor: number = 1
  private _hover: boolean = false
  private _disabled: boolean = false
  private _destroyed: boolean = false

  // --- DOM ---
  private _el: HTMLDivElement
  private _startEl: HTMLDivElement
  private _trackEl: HTMLDivElement
  private _thumbEl: HTMLDivElement
  private _endEl: HTMLDivElement
  private _tooltipEl: HTMLDivElement | null = null

  // --- Tool buttons ---
  private _decToolBtn: UIToolButton
  private _incToolBtn: UIToolButton

  // --- Event emitter ---
  private _listeners: Map<EventName, Set<EventHandler>> = new Map()

  // --- Cleanup registry ---
  private _cleanups: Array<() => void> = []

  // --- Drag state ---
  private _dragging: boolean = false
  private _dragStartPos: number = 0
  private _dragStartValue: number = 0

  // --- Theme sync ---
  private _themeObserver: MutationObserver | null = null

  constructor(options?: UIScrollBarOptions) {
    const o = options ?? {}
    this._kind = o.kind ?? 'vertical'
    this._size = o.size ?? 'small'
    this._min = o.min ?? 0
    this._max = o.max ?? 100
    this._value = o.value ?? 0
    this.step = o.step ?? 1
    this.pageStep = o.pageStep ?? 10
    this.thumbSize = o.thumbSize ?? null
    this.showTooltip = o.showTooltip ?? false
    this.tooltipColors = o.tooltipColors ?? []
    this.onTooltipColor = o.onTooltipColor ?? null
    this.captureParentEvents = o.captureParentEvents ?? false
    this.wheelFactor = o.wheelFactor ?? 1
    this._customWidth = o.customWidth ?? 0
    this._customHeight = o.customHeight ?? 0

    const btnSize = this._btnSize()
    const isH = this._kind === 'horizontal'

    // Build DOM
    this._el = this._div('ui-scrollbar')
    this._startEl = this._div('ui-scrollbar__start')
    this._trackEl = this._div('ui-scrollbar__track')
    this._thumbEl = this._div('ui-scrollbar__thumb')
    this._endEl = this._div('ui-scrollbar__end')

    // Create tool buttons for dec/inc
    this._decToolBtn = new UIToolButton({
      icon: (isH ? 'arrow-left' : 'arrow-up') as ToolButtonIcon,
      size: btnSize,
      repeat: true,
      repeatDelay: 400,
      repeatInterval: 50,
      className: 'ui-scrollbar__btn ui-scrollbar__btn-dec',
    })
    this._decToolBtn.onClick(() => this.decrease())

    this._incToolBtn = new UIToolButton({
      icon: (isH ? 'arrow-right' : 'arrow-down') as ToolButtonIcon,
      size: btnSize,
      repeat: true,
      repeatDelay: 400,
      repeatInterval: 50,
      className: 'ui-scrollbar__btn ui-scrollbar__btn-inc',
    })
    this._incToolBtn.onClick(() => this.increase())

    // Cross-axis must fill the scrollbar, not be square
    this._fixToolBtnCrossAxis()

    // Scrollbar buttons should not be in Tab order
    this._decToolBtn.element.tabIndex = -1
    this._incToolBtn.element.tabIndex = -1

    this._startEl.appendChild(this._decToolBtn.element)
    this._trackEl.appendChild(this._thumbEl)
    this._endEl.appendChild(this._incToolBtn.element)
    this._el.appendChild(this._startEl)
    this._el.appendChild(this._trackEl)
    this._el.appendChild(this._endEl)

    this._el.tabIndex = (o.focusable ?? false) ? 0 : -1
    this._applyClasses()
    this._bindEvents()
    this._observeTheme()

    // Show/hide zones
    if (o.showStartZone === false) this._startEl.style.display = 'none'
    if (o.showEndZone === false) this._endEl.style.display = 'none'

    // Hover mode
    this._hover = o.hover ?? false
    if (this._hover) {
      this._el.classList.add('hover-mode')
      this._bindHoverMode()
    }

    // Disabled
    if (o.disabled) this.disabled = true
  }

  // =====================
  // Event emitter
  // =====================

  on(event: EventName, handler: EventHandler): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(handler)
    return this
  }

  off(event: EventName, handler: EventHandler): this {
    this._listeners.get(event)?.delete(handler)
    return this
  }

  private _emit(event: EventName, value: number): void {
    this._listeners.get(event)?.forEach(fn => fn(value))
  }

  // =====================
  // Destroy / cleanup
  // =====================

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    cancelAnimationFrame(this._animatingThumb)

    this._decToolBtn.destroy()
    this._incToolBtn.destroy()

    for (const cleanup of this._cleanups) {
      cleanup()
    }
    this._cleanups.length = 0

    if (this._themeObserver) {
      this._themeObserver.disconnect()
      this._themeObserver = null
    }

    if (this._tooltipEl && this._tooltipEl.parentNode) {
      this._tooltipEl.parentNode.removeChild(this._tooltipEl)
      this._tooltipEl = null
    }

    if (this._el.parentNode) {
      this._el.parentNode.removeChild(this._el)
    }

    this._listeners.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this._el.classList.toggle('disabled', value)
    this._decToolBtn.disabled = value
    this._incToolBtn.disabled = value
  }

  // =====================
  // Public API
  // =====================

  get element(): HTMLDivElement { return this._el }
  get trackElement(): HTMLDivElement { return this._trackEl }
  get thumbElement(): HTMLDivElement { return this._thumbEl }
  get startElement(): HTMLDivElement { return this._startEl }
  get endElement(): HTMLDivElement { return this._endEl }
  get decButtonElement(): HTMLElement { return this._decToolBtn.element }
  get incButtonElement(): HTMLElement { return this._incToolBtn.element }

  setVar(name: string, value: string): void {
    this._el.style.setProperty(name, value)
  }

  insertBeforeDecBtn(el: HTMLElement): void {
    this._startEl.insertBefore(el, this._decToolBtn.element)
  }

  insertAfterIncBtn(el: HTMLElement): void {
    this._endEl.appendChild(el)
  }

  get kind(): ScrollBarKind { return this._kind }
  set kind(v: ScrollBarKind) {
    this._kind = v
    this._updateToolBtnIcons()
    this._applyClasses()
  }

  get size(): ScrollBarSize { return this._size }
  set size(v: ScrollBarSize) {
    this._size = v
    this._updateToolBtnIcons()
    this._applyClasses()
  }

  get min(): number { return this._min }
  set min(v: number) { this._min = v; this._updateThumb() }

  get max(): number { return this._max }
  set max(v: number) { this._max = v; this._updateThumb() }

  get value(): number { return this._value }
  set value(v: number) {
    const clamped = Math.max(this._min, Math.min(this._max, v))
    if (clamped !== this._value) {
      this._value = clamped
      this._updateThumb()
      this._emit('change', this._value)
    }
  }

  set showStartZone(v: boolean) { this._startEl.style.display = v ? '' : 'none' }
  set showEndZone(v: boolean) { this._endEl.style.display = v ? '' : 'none' }

  increase(amount?: number): void { if (!this._disabled) this.value = this._value + (amount ?? this.step) }
  decrease(amount?: number): void { if (!this._disabled) this.value = this._value - (amount ?? this.step) }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this._el, v)
  }

  refresh(): void { this._updateThumb() }

  // =====================
  // Theme sync
  // =====================

  private _getThemeName(): string {
    return document.documentElement.getAttribute('data-theme') || 'gtk4-light'
  }

  private _observeTheme(): void {
    this._themeObserver = new MutationObserver(() => this._applyClasses())
    this._themeObserver.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    })
  }

  // =====================
  // Tool button helpers
  // =====================

  private _customWidth: number = 0
  private _customHeight: number = 0

  private _btnSize(): number {
    switch (this._size) {
      case 'tiny': return 10
      case 'small': return 14
      case 'medium': return 20
      case 'large': return 28
      case 'xlarge': return 36
      case 'custom': return this._kind === 'horizontal' ? this._customHeight || 20 : this._customWidth || 20
    }
  }

  /** Cross-axis of buttons must fill the scrollbar, not be square */
  private _fixToolBtnCrossAxis(): void {
    const isH = this._kind === 'horizontal'
    for (const btn of [this._decToolBtn, this._incToolBtn]) {
      if (isH) {
        btn.element.style.height = '100%'
      } else {
        btn.element.style.width = '100%'
      }
    }
  }

  private _updateToolBtnIcons(): void {
    const isH = this._kind === 'horizontal'
    const sz = this._btnSize()
    this._decToolBtn.icon = (isH ? 'arrow-left' : 'arrow-up') as ToolButtonIcon
    this._decToolBtn.size = sz
    this._incToolBtn.icon = (isH ? 'arrow-right' : 'arrow-down') as ToolButtonIcon
    this._incToolBtn.size = sz
    this._fixToolBtnCrossAxis()
  }

  // =====================
  // Internal
  // =====================

  private _div(className: string): HTMLDivElement {
    const el = document.createElement('div')
    el.className = className
    return el
  }

  private _applyClasses(): void {
    const theme = this._getThemeName()
    this._el.className = `ui-scrollbar ${this._kind} ${this._size} ${theme}`
    if (this._hover) this._el.classList.add('hover-mode')
    if (this._disabled) this._el.classList.add('disabled')

    // Custom size: apply explicit dimensions
    if (this._size === 'custom') {
      if (this._kind === 'horizontal') {
        if (this._customHeight) this._el.style.height = `${this._customHeight}px`
      } else {
        if (this._customWidth) this._el.style.width = `${this._customWidth}px`
      }
    }
  }

  private _on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this._cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  private _animatingThumb: number = 0

  private _animateThumb(): void {
    const start = performance.now()
    const duration = 160
    const tick = () => {
      if (this._destroyed) return
      this._updateThumb()
      if (performance.now() - start < duration) {
        this._animatingThumb = requestAnimationFrame(tick)
      }
    }
    cancelAnimationFrame(this._animatingThumb)
    this._animatingThumb = requestAnimationFrame(tick)
  }

  private _updateThumb(): void {
    const range = this._max - this._min
    if (range <= 0) return

    const isH = this._kind === 'horizontal'
    const trackSize = isH ? this._trackEl.clientWidth : this._trackEl.clientHeight
    if (trackSize <= 0) return

    const usable = trackSize

    let thumbSize: number
    if (this.thumbSize !== null) {
      thumbSize = this._resolveThumbSize(usable)
    } else {
      thumbSize = Math.max(THUMB_MIN_SIZE, usable * (this.pageStep / (range + this.pageStep)))
    }
    thumbSize = Math.min(thumbSize, usable)

    const ratio = (this._value - this._min) / range
    const thumbPos = ratio * (usable - thumbSize)

    if (isH) {
      this._thumbEl.style.left = `${Math.round(thumbPos)}px`
      this._thumbEl.style.width = `${Math.round(thumbSize)}px`
    } else {
      this._thumbEl.style.top = `${Math.round(thumbPos)}px`
      this._thumbEl.style.height = `${Math.round(thumbSize)}px`
    }
  }

  private _resolveThumbSize(usable: number): number {
    if (this.thumbSize === null) return THUMB_MIN_SIZE
    if (typeof this.thumbSize === 'number') return this.thumbSize
    if (this.thumbSize.endsWith('%')) {
      const pct = parseFloat(this.thumbSize) / 100
      return Math.max(THUMB_MIN_SIZE, usable * pct)
    }
    return parseFloat(this.thumbSize) || THUMB_MIN_SIZE
  }

  private _getThumbSize(trackSize: number): number {
    const usable = trackSize
    if (this.thumbSize !== null) return Math.min(this._resolveThumbSize(usable), usable)
    const range = this._max - this._min
    return Math.min(usable, Math.max(THUMB_MIN_SIZE, usable * (this.pageStep / (range + this.pageStep))))
  }

  // =====================
  // Hover mode
  // =====================

  private _bindHoverMode(): void {
    this._on(this._el, 'mouseenter', () => {
      this._el.classList.add('hover-active')
      this._animateThumb()
    })
    this._on(this._el, 'mouseleave', () => {
      if (!this._dragging) {
        this._el.classList.remove('hover-active')
        this._animateThumb()
      }
    })
  }

  // =====================
  // Events
  // =====================

  private _bindEvents(): void {
    const decEl = this._decToolBtn.element
    const incEl = this._incToolBtn.element

    // Keyboard
    this._on(this._el, 'keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault(); this.decrease(); break
        case 'ArrowRight': case 'ArrowDown':
          e.preventDefault(); this.increase(); break
        case 'PageUp':
          e.preventDefault(); this.decrease(this.pageStep); break
        case 'PageDown':
          e.preventDefault(); this.increase(this.pageStep); break
        case 'Home':
          e.preventDefault(); this.value = this._min; break
        case 'End':
          e.preventDefault(); this.value = this._max; break
      }
      this._refreshTooltip()
    })

    // Wheel
    this._on(this._el, 'wheel', (e) => {
      e.preventDefault()
      const amount = this.step * this.wheelFactor
      if (e.deltaY > 0) this.increase(amount)
      else if (e.deltaY < 0) this.decrease(amount)
      this._refreshTooltip()
    }, { passive: false } as AddEventListenerOptions)

    // Buttons — hover tooltip (click is handled by UIToolButton repeat)
    for (const btn of [decEl, incEl]) {
      this._on(btn, 'mouseenter', (e) => {
        if (this.showTooltip) this._showTooltipAt(e.clientX, e.clientY)
      })
      this._on(btn, 'mousemove', (e) => {
        if (this.showTooltip) this._showTooltipAt(e.clientX, e.clientY)
      })
      this._on(btn, 'mouseleave', () => {
        if (this.showTooltip) this._hideTooltip()
      })
    }

    // Track click
    this._on(this._trackEl, 'mousedown', (e) => {
      if (e.target !== this._trackEl) return
      const isH = this._kind === 'horizontal'
      const rect = this._trackEl.getBoundingClientRect()
      const click = isH ? (e.clientX - rect.left) : (e.clientY - rect.top)
      const trackSize = isH ? rect.width : rect.height
      const thumbSize = this._getThumbSize(trackSize)
      const range = this._max - this._min
      const thumbPos = ((this._value - this._min) / range) * (trackSize - thumbSize)
      if (click < thumbPos) this.decrease(this.pageStep)
      else if (click > thumbPos + thumbSize) this.increase(this.pageStep)
    })

    // Thumb drag
    this._on(this._thumbEl, 'mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this._dragging = true
      this._dragStartPos = this._kind === 'horizontal' ? e.clientX : e.clientY
      this._dragStartValue = this._value
      this._thumbEl.classList.add('dragging')
      this._emit('dragstart', this._value)

      const onMove = (me: MouseEvent) => {
        if (!this._dragging) return
        const isH = this._kind === 'horizontal'
        const trackRect = this._trackEl.getBoundingClientRect()
        const trackSize = isH ? trackRect.width : trackRect.height
        const thumbSize = this._getThumbSize(trackSize)
        const delta = (isH ? me.clientX : me.clientY) - this._dragStartPos
        const range = this._max - this._min
        const valueDelta = (delta / (trackSize - thumbSize)) * range
        this.value = this._dragStartValue + valueDelta
        if (this.showTooltip) this._showTooltipAt(me.clientX, me.clientY)
      }

      const onUp = (me: MouseEvent) => {
        this._dragging = false
        this._thumbEl.classList.remove('dragging')
        this._hideTooltip()
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        this._emit('dragend', this._value)

        if (this._hover) {
          const rect = this._el.getBoundingClientRect()
          const inside = me.clientX >= rect.left && me.clientX <= rect.right
                      && me.clientY >= rect.top && me.clientY <= rect.bottom
          if (!inside) {
            this._el.classList.remove('hover-active')
            this._animateThumb()
          }
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)

      this._cleanups.push(
        () => document.removeEventListener('mousemove', onMove),
        () => document.removeEventListener('mouseup', onUp),
      )
    })

    // Tooltip on thumb hover
    this._on(this._thumbEl, 'mouseenter', (e) => {
      if (this.showTooltip && !this._dragging) this._showTooltipAt(e.clientX, e.clientY)
    })
    this._on(this._thumbEl, 'mousemove', (e) => {
      if (this.showTooltip && !this._dragging) this._showTooltipAt(e.clientX, e.clientY)
    })
    this._on(this._thumbEl, 'mouseleave', () => {
      if (!this._dragging) this._hideTooltip()
    })
  }

  // =====================
  // Tooltip
  // =====================

  private _showTooltipAt(x: number, y: number): void {
    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div')
      this._tooltipEl.className = 'ui-scrollbar-tooltip'
      document.body.appendChild(this._tooltipEl)
    }
    this._tooltipEl.style.display = ''
    this._renderTooltipContent()

    const tipW = this._tooltipEl.offsetWidth
    const tipH = this._tooltipEl.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = x + 12
    let top = y - tipH - 4

    if (left + tipW > vw) left = x - tipW - 4
    if (top < 0) top = y + 16

    left = Math.max(4, Math.min(left, vw - tipW - 4))
    top = Math.max(4, Math.min(top, vh - tipH - 4))

    this._tooltipEl.style.left = `${left}px`
    this._tooltipEl.style.top = `${top}px`
  }

  private _resolveTooltipStyle(): { bg?: string; color?: string; bold?: boolean } | null {
    if (this.onTooltipColor) {
      const result = this.onTooltipColor(this._value, this._min, this._max)
      if (result) return result
    }
    for (const r of this.tooltipColors) {
      if (this._value >= r.from && this._value <= r.to) {
        return { bg: r.bg, color: r.color, bold: r.bold }
      }
    }
    return null
  }

  private _renderTooltipContent(): void {
    if (!this._tooltipEl) return
    const v = Math.round(this._value)
    const range = this._min === 0
      ? ` / ${this._max}`
      : ` / ${this._min}..${this._max}`

    const style = this._resolveTooltipStyle()

    let valueStyle = ''
    if (style?.color) valueStyle += `color:${style.color};`
    if (style?.bold) valueStyle += 'font-weight:bold;'

    this._tooltipEl.innerHTML = valueStyle
      ? `<span style="${valueStyle}">${v}</span>${range}`
      : `${v}${range}`

    this._tooltipEl.style.backgroundColor = style?.bg || ''
  }

  private _refreshTooltip(): void {
    if (this.showTooltip && this._tooltipEl && this._tooltipEl.style.display !== 'none') {
      this._renderTooltipContent()
    }
  }

  private _hideTooltip(): void {
    if (this._tooltipEl) this._tooltipEl.style.display = 'none'
  }
}
