import type { ScrollBarKind, ScrollBarSize, UIScrollBarOptions, TooltipColorRange, TooltipColorFn } from '../common/types'
import { UIToolButton } from '../common/ui-tool-button'
import type { ToolButtonIcon } from '../common/ui-tool-button'
import cssText from './ui-scrollbar-wc.css?inline'

const THUMB_MIN_SIZE = 20

type EventName = 'change' | 'dragstart' | 'dragend'
type EventHandler = (value: number) => void

// Inject tooltip CSS once globally (tooltip lives in document.body, outside shadow DOM)
let _tooltipCssInjected = false
function injectTooltipCss(): void {
  if (_tooltipCssInjected) return
  _tooltipCssInjected = true
  const style = document.createElement('style')
  style.textContent = `
.ui-scrollbar-wc-tooltip {
  position: fixed;
  padding: 2px 6px;
  font-size: 11px;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  border-radius: 3px;
  pointer-events: none;
  z-index: 9999;
}`
  document.head.appendChild(style)
}

export class ScrollBarWC extends HTMLElement {
  private _kind: ScrollBarKind = 'vertical'
  private _size: ScrollBarSize = 'small'

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

  // --- DOM (inside shadow) ---
  private _shadow: ShadowRoot
  private _startEl!: HTMLDivElement
  private _trackEl!: HTMLDivElement
  private _thumbEl!: HTMLDivElement
  private _endEl!: HTMLDivElement
  private _tooltipEl: HTMLDivElement | null = null

  // --- Tool buttons ---
  private _decToolBtn!: UIToolButton
  private _incToolBtn!: UIToolButton

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

  // --- Custom size ---
  private _customWidth: number = 0
  private _customHeight: number = 0

  // --- Connected ---
  private _connected: boolean = false
  private _initialized: boolean = false
  private _configured: boolean = false

  // --- Pending options (set before connectedCallback) ---
  _pendingOptions: UIScrollBarOptions | null = null
  private _pendingShowStartZone: boolean | undefined = undefined
  private _pendingShowEndZone: boolean | undefined = undefined

  static get observedAttributes(): string[] {
    return [
      'kind', 'size', 'min', 'max', 'value', 'step', 'page-step',
      'thumb-size', 'show-tooltip', 'hover', 'disabled', 'focusable',
      'wheel-factor', 'show-start-zone', 'show-end-zone',
      'custom-width', 'custom-height',
    ]
  }

  constructor() {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    // Apply styles
    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)
  }

  /**
   * Configure the scrollbar programmatically (alternative to attributes).
   * Can be called before or after connecting to the DOM.
   * Eagerly builds the shadow DOM so internal elements are available immediately.
   */
  configure(options?: UIScrollBarOptions): void {
    const o = options ?? {}
    this._kind = o.kind ?? this._kind
    this._size = o.size ?? this._size
    this._min = o.min ?? this._min
    this._max = o.max ?? this._max
    this._value = o.value ?? this._value
    this.step = o.step ?? this.step
    this.pageStep = o.pageStep ?? this.pageStep
    this.thumbSize = o.thumbSize ?? this.thumbSize
    this.showTooltip = o.showTooltip ?? this.showTooltip
    this.tooltipColors = o.tooltipColors ?? this.tooltipColors
    this.onTooltipColor = o.onTooltipColor ?? this.onTooltipColor
    this.captureParentEvents = o.captureParentEvents ?? this.captureParentEvents
    this.wheelFactor = o.wheelFactor ?? this.wheelFactor
    this._customWidth = o.customWidth ?? this._customWidth
    this._customHeight = o.customHeight ?? this._customHeight
    this._hover = o.hover ?? this._hover
    if (o.disabled !== undefined) this._disabled = o.disabled
    if (o.focusable !== undefined) this.tabIndex = o.focusable ? 0 : -1
    this._configured = true

    // Eagerly initialize shadow DOM so elements like _startEl are available
    this._ensureInitialized()

    if (o.showStartZone === false) this._startEl.style.display = 'none'
    if (o.showEndZone === false) this._endEl.style.display = 'none'

    this._applyClasses()
    if (this._disabled) this.disabled = true
  }

  connectedCallback(): void {
    this._connected = true

    injectTooltipCss()

    // If no configure() was called, read from HTML attributes
    if (!this._configured) {
      this._readAttributes()
    }

    // Build shadow DOM if not already done by configure()
    this._ensureInitialized()
    this._applyClasses()
  }

  /** Build internal DOM exactly once */
  private _ensureInitialized(): void {
    if (this._initialized) return
    this._initialized = true

    this._buildDOM()
    this._bindEvents()
    this._observeTheme()

    if (this._hover) {
      this.classList.add('hover-mode')
      this._bindHoverMode()
    }

    if (this._disabled) {
      this.classList.add('disabled')
      this._decToolBtn.disabled = true
      this._incToolBtn.disabled = true
    }
  }

  disconnectedCallback(): void {
    // Don't destroy on disconnect — element may be re-attached (e.g. moved in DOM).
    // Users must call destroy() explicitly if permanent removal is intended.
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    if (!this._connected) return

    switch (name) {
      case 'kind': this.kind = (val as ScrollBarKind) ?? 'vertical'; break
      case 'size': this.size = (val as ScrollBarSize) ?? 'small'; break
      case 'min': this.min = Number(val ?? 0); break
      case 'max': this.max = Number(val ?? 100); break
      case 'value': this.value = Number(val ?? 0); break
      case 'step': this.step = Number(val ?? 1); break
      case 'page-step': this.pageStep = Number(val ?? 10); break
      case 'thumb-size':
        if (val === null) this.thumbSize = null
        else if (/^\d+$/.test(val)) this.thumbSize = Number(val)
        else this.thumbSize = val
        this._updateThumb()
        break
      case 'show-tooltip': this.showTooltip = val !== null; break
      case 'hover':
        this._hover = val !== null
        if (this._hover) {
          this.classList.add('hover-mode')
          this._bindHoverMode()
        } else {
          this.classList.remove('hover-mode', 'hover-active')
        }
        break
      case 'disabled': this.disabled = val !== null; break
      case 'focusable': this.tabIndex = val !== null ? 0 : -1; break
      case 'wheel-factor': this.wheelFactor = Number(val ?? 1); break
      case 'show-start-zone':
        this._startEl.style.display = val === 'false' ? 'none' : ''
        break
      case 'show-end-zone':
        this._endEl.style.display = val === 'false' ? 'none' : ''
        break
      case 'custom-width':
        this._customWidth = Number(val ?? 0)
        this._applyClasses()
        break
      case 'custom-height':
        this._customHeight = Number(val ?? 0)
        this._applyClasses()
        break
    }
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
    // Vanilla JS listeners
    this._listeners.get(event)?.forEach(fn => fn(value))

    // CustomEvent for framework integration
    this.dispatchEvent(new CustomEvent(`sb-${event}`, {
      detail: { value },
      bubbles: true,
      composed: true,
    }))
  }

  // =====================
  // Destroy / cleanup
  // =====================

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    cancelAnimationFrame(this._animatingThumb)

    this._decToolBtn?.destroy()
    this._incToolBtn?.destroy()

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

    this._listeners.clear()
    this._connected = false
  }

  get isDestroyed(): boolean { return this._destroyed }

  get disabled(): boolean { return this._disabled }
  set disabled(value: boolean) {
    this._disabled = value
    this.classList.toggle('disabled', value)
    if (this._decToolBtn) this._decToolBtn.disabled = value
    if (this._incToolBtn) this._incToolBtn.disabled = value
  }

  // =====================
  // Public API
  // =====================

  get trackElement(): HTMLDivElement { return this._trackEl }
  get thumbElement(): HTMLDivElement { return this._thumbEl }
  get startElement(): HTMLDivElement { return this._startEl }
  get endElement(): HTMLDivElement { return this._endEl }
  get decButtonElement(): HTMLElement { return this._decToolBtn.element }
  get incButtonElement(): HTMLElement { return this._incToolBtn.element }

  setVar(name: string, value: string): void {
    this.style.setProperty(name, value)
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

  refresh(): void { this._updateThumb() }

  // =====================
  // Read attributes
  // =====================

  private _readAttributes(): void {
    const attr = (name: string) => this.getAttribute(name)
    if (attr('kind')) this._kind = attr('kind') as ScrollBarKind
    if (attr('size')) this._size = attr('size') as ScrollBarSize
    if (attr('min') !== null) this._min = Number(attr('min'))
    if (attr('max') !== null) this._max = Number(attr('max'))
    if (attr('value') !== null) this._value = Number(attr('value'))
    if (attr('step') !== null) this.step = Number(attr('step'))
    if (attr('page-step') !== null) this.pageStep = Number(attr('page-step'))
    if (attr('thumb-size') !== null) {
      const ts = attr('thumb-size')!
      this.thumbSize = /^\d+$/.test(ts) ? Number(ts) : ts
    }
    if (this.hasAttribute('show-tooltip')) this.showTooltip = true
    if (this.hasAttribute('hover')) this._hover = true
    if (this.hasAttribute('disabled')) this._disabled = true
    if (attr('wheel-factor') !== null) this.wheelFactor = Number(attr('wheel-factor'))
    if (attr('custom-width') !== null) this._customWidth = Number(attr('custom-width'))
    if (attr('custom-height') !== null) this._customHeight = Number(attr('custom-height'))

    this.tabIndex = this.hasAttribute('focusable') ? 0 : -1
  }

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
  // Build DOM
  // =====================

  private _buildDOM(): void {
    const btnSize = this._btnSize()
    const isH = this._kind === 'horizontal'

    this._startEl = this._div('ui-scrollbar__start')
    this._trackEl = this._div('ui-scrollbar__track')
    this._thumbEl = this._div('ui-scrollbar__thumb')
    this._endEl = this._div('ui-scrollbar__end')

    // Create tool buttons
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

    this._fixToolBtnCrossAxis()

    this._decToolBtn.element.tabIndex = -1
    this._incToolBtn.element.tabIndex = -1

    this._startEl.appendChild(this._decToolBtn.element)
    this._trackEl.appendChild(this._thumbEl)
    this._endEl.appendChild(this._incToolBtn.element)
    this._shadow.appendChild(this._startEl)
    this._shadow.appendChild(this._trackEl)
    this._shadow.appendChild(this._endEl)

    // Show/hide zones from attributes or pending options
    if (this._pendingShowStartZone === false || this.getAttribute('show-start-zone') === 'false') {
      this._startEl.style.display = 'none'
    }
    if (this._pendingShowEndZone === false || this.getAttribute('show-end-zone') === 'false') {
      this._endEl.style.display = 'none'
    }
    this._pendingShowStartZone = undefined
    this._pendingShowEndZone = undefined
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
    // Classes go on the host element (for :host(.xxx) selectors)
    this.className = `${this._kind} ${this._size} ${theme}`
    if (this._hover) this.classList.add('hover-mode')
    if (this._disabled) this.classList.add('disabled')

    // Custom size: apply explicit dimensions
    if (this._size === 'custom') {
      if (this._kind === 'horizontal') {
        if (this._customHeight) this.style.height = `${this._customHeight}px`
      } else {
        if (this._customWidth) this.style.width = `${this._customWidth}px`
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
    if (!this._trackEl) return
    const range = this._max - this._min
    if (range <= 0) return

    const isH = this._kind === 'horizontal'
    const trackSize = isH ? this._trackEl.clientWidth : this._trackEl.clientHeight
    if (trackSize <= 0) return

    const usable = trackSize

    let thumbSz: number
    if (this.thumbSize !== null) {
      thumbSz = this._resolveThumbSize(usable)
    } else {
      thumbSz = Math.max(THUMB_MIN_SIZE, usable * (this.pageStep / (range + this.pageStep)))
    }
    thumbSz = Math.min(thumbSz, usable)

    const ratio = (this._value - this._min) / range
    const thumbPos = ratio * (usable - thumbSz)

    if (isH) {
      this._thumbEl.style.left = `${Math.round(thumbPos)}px`
      this._thumbEl.style.width = `${Math.round(thumbSz)}px`
    } else {
      this._thumbEl.style.top = `${Math.round(thumbPos)}px`
      this._thumbEl.style.height = `${Math.round(thumbSz)}px`
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
    this._on(this as unknown as HTMLElement, 'mouseenter', () => {
      this.classList.add('hover-active')
      this._animateThumb()
    })
    this._on(this as unknown as HTMLElement, 'mouseleave', () => {
      if (!this._dragging) {
        this.classList.remove('hover-active')
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
    this._on(this as unknown as HTMLElement, 'keydown', (e) => {
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
    this._on(this as unknown as HTMLElement, 'wheel', (e) => {
      e.preventDefault()
      const amount = this.step * this.wheelFactor
      if (e.deltaY > 0) this.increase(amount)
      else if (e.deltaY < 0) this.decrease(amount)
      this._refreshTooltip()
    }, { passive: false } as AddEventListenerOptions)

    // Buttons — hover tooltip
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
      const thumbSz = this._getThumbSize(trackSize)
      const range = this._max - this._min
      const thumbPos = ((this._value - this._min) / range) * (trackSize - thumbSz)
      if (click < thumbPos) this.decrease(this.pageStep)
      else if (click > thumbPos + thumbSz) this.increase(this.pageStep)
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
        const thumbSz = this._getThumbSize(trackSize)
        const delta = (isH ? me.clientX : me.clientY) - this._dragStartPos
        const range = this._max - this._min
        const valueDelta = (delta / (trackSize - thumbSz)) * range
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
          const rect = this.getBoundingClientRect()
          const inside = me.clientX >= rect.left && me.clientX <= rect.right
                      && me.clientY >= rect.top && me.clientY <= rect.bottom
          if (!inside) {
            this.classList.remove('hover-active')
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
  // Tooltip (lives in document.body, outside shadow DOM)
  // =====================

  private _showTooltipAt(x: number, y: number): void {
    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div')
      this._tooltipEl.className = 'ui-scrollbar-wc-tooltip'
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

// Register the custom element
customElements.define('scrollbar-wc', ScrollBarWC)
