import { ScrollBarWC } from '../ui-scrollbar-wc/ui-scrollbar-wc'
import type {
  ScrollMode,
  VerticalScrollPosition,
  HorizontalScrollPosition,
  ScrollBarSize,
  ScrollBoxScrollBarConfig,
  UIScrollBoxOptions,
} from '../common/types'
import cssText from './ui-scrollbox-wc.css?inline'

type ScrollEventHandler = (x: number, y: number) => void

const SCROLLBOX_ATTRS = [
  'scroll', 'vertical-scroll', 'horizontal-scroll', 'scrollbar-size',
  'scrollbar-hover', 'scrollbar-tooltip', 'scroll-step', 'wheel-factor',
  'content-width', 'content-height', 'border-width', 'border-color',
  'border-style', 'background-color', 'opacity', 'disabled',
] as const

export class ScrollBoxWC extends HTMLElement {
  // --- Config ---
  private _scroll: ScrollMode = 'both'
  private _verticalScroll: VerticalScrollPosition = 'right'
  private _horizontalScroll: HorizontalScrollPosition = 'bottom'
  private _sbSize: ScrollBarSize = 'small'
  private _sbHover: boolean = false
  private _sbTooltip: boolean = false
  private _sbConfigs: {
    hTop?: ScrollBoxScrollBarConfig
    hBottom?: ScrollBoxScrollBarConfig
    vLeft?: ScrollBoxScrollBarConfig
    vRight?: ScrollBoxScrollBarConfig
  } = {}

  // --- Wheel / step ---
  wheelFactor: number = 1
  altWheelHorizontal: boolean = true
  private _scrollStep: number = 20

  // --- Scroll state ---
  private _scrollX: number = 0
  private _scrollY: number = 0
  private _contentWidth: number = 0
  private _contentHeight: number = 0

  // --- ScrollBars (ScrollBarWC) ---
  private _hScrollTop: ScrollBarWC | null = null
  private _hScrollBottom: ScrollBarWC | null = null
  private _vScrollLeft: ScrollBarWC | null = null
  private _vScrollRight: ScrollBarWC | null = null

  // --- DOM (inside shadow) ---
  private _shadow: ShadowRoot
  private _topRow!: HTMLDivElement
  private _middleRow!: HTMLDivElement
  private _bottomRow!: HTMLDivElement
  private _contentClip!: HTMLDivElement
  private _contentEl!: HTMLDivElement
  private _cornerTL: HTMLDivElement | null = null
  private _cornerTR: HTMLDivElement | null = null
  private _cornerBL: HTMLDivElement | null = null
  private _cornerBR: HTMLDivElement | null = null

  // --- Events ---
  private _scrollListeners: Set<ScrollEventHandler> = new Set()
  private _cleanups: Array<() => void> = []
  private _destroyed: boolean = false

  // --- Lifecycle ---
  private _initialized: boolean = false
  private _configured: boolean = false
  private _pendingAttrs: Map<string, string | null> | null = null

  // --- Content slot for framework children ---
  private _contentSlot: HTMLSlotElement | null = null

  static get observedAttributes() {
    return [...SCROLLBOX_ATTRS]
  }

  // --- Pending styling (set via configure before connect) ---
  private _pendingBorderWidth: number = 1
  private _pendingBorderColor: string = 'var(--border-color)'
  private _pendingBorderStyle: string = 'solid'
  private _pendingBackgroundColor: string = 'var(--view-bg-color)'
  private _pendingOpacity: number = 1
  private _pendingDisabled: boolean = false

  constructor() {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)
  }

  /**
   * Configure the scrollbox programmatically.
   * Eagerly builds shadow DOM so contentElement is available immediately.
   */
  configure(options?: UIScrollBoxOptions): void {
    const o = options ?? {}
    this._scroll = o.scroll ?? this._scroll
    this._verticalScroll = o.verticalScroll ?? this._verticalScroll
    this._horizontalScroll = o.horizontalScroll ?? this._horizontalScroll
    this._sbSize = o.scrollBarSize ?? this._sbSize
    this._sbHover = o.scrollBarHover ?? this._sbHover
    this._sbTooltip = o.scrollBarTooltip ?? this._sbTooltip
    this._sbConfigs = {
      hTop: o.hScrollTopConfig,
      hBottom: o.hScrollBottomConfig,
      vLeft: o.vScrollLeftConfig,
      vRight: o.vScrollRightConfig,
    }
    this._scrollStep = o.scrollStep ?? this._scrollStep
    this.wheelFactor = o.wheelFactor ?? this.wheelFactor
    this.altWheelHorizontal = o.altWheelHorizontal ?? this.altWheelHorizontal
    this._contentWidth = o.contentWidth ?? this._contentWidth
    this._contentHeight = o.contentHeight ?? this._contentHeight
    this._pendingBorderWidth = o.borderWidth ?? this._pendingBorderWidth
    this._pendingBorderColor = o.borderColor ?? this._pendingBorderColor
    this._pendingBorderStyle = o.borderStyle ?? this._pendingBorderStyle
    this._pendingBackgroundColor = o.backgroundColor ?? this._pendingBackgroundColor
    if (o.opacity !== undefined) this._pendingOpacity = o.opacity
    if (o.disabled !== undefined) this._pendingDisabled = o.disabled
    this._configured = true
    this._ensureInitialized()
  }

  connectedCallback(): void {
    if (!this._configured) {
      this._readAttributes()
    }
    this._ensureInitialized()

    // Replay any attribute changes that arrived before DOM was built
    if (this._pendingAttrs) {
      for (const [name, val] of this._pendingAttrs) {
        this._applyAttribute(name, val)
      }
      this._pendingAttrs = null
    }
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return
    if (!this._initialized) {
      // Queue for replay after init
      if (!this._pendingAttrs) this._pendingAttrs = new Map()
      this._pendingAttrs.set(name, val)
      return
    }
    this._applyAttribute(name, val)
  }

  private _applyAttribute(name: string, val: string | null): void {
    switch (name) {
      case 'scroll': this._scroll = (val as ScrollMode) ?? 'both'; break
      case 'vertical-scroll': this._verticalScroll = (val as VerticalScrollPosition) ?? 'right'; break
      case 'horizontal-scroll': this._horizontalScroll = (val as HorizontalScrollPosition) ?? 'bottom'; break
      case 'scrollbar-size': this._sbSize = (val as ScrollBarSize) ?? 'small'; break
      case 'scrollbar-hover': this._sbHover = val !== null; break
      case 'scrollbar-tooltip': this._sbTooltip = val !== null; break
      case 'scroll-step': this.scrollStep = Number(val ?? 20); break
      case 'wheel-factor': this.wheelFactor = Number(val ?? 1); break
      case 'content-width': this.contentWidth = Number(val ?? 0); break
      case 'content-height': this.contentHeight = Number(val ?? 0); break
      case 'border-width':
        this._pendingBorderWidth = val !== null ? parseFloat(val) : 1
        if (this._initialized) this._applyHostStyles()
        break
      case 'border-color':
        this._pendingBorderColor = val ?? 'var(--border-color)'
        if (this._initialized) this._applyHostStyles()
        break
      case 'border-style':
        this._pendingBorderStyle = val ?? 'solid'
        if (this._initialized) this._applyHostStyles()
        break
      case 'background-color':
        this._pendingBackgroundColor = val ?? 'var(--view-bg-color)'
        if (this._initialized) this._applyHostStyles()
        break
      case 'opacity':
        this._pendingOpacity = val !== null ? parseFloat(val) : 1
        if (this._initialized) this._applyHostStyles()
        break
      case 'disabled': this.disabled = val !== null; break
    }
  }

  private _readAttributes(): void {
    for (const name of SCROLLBOX_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) {
        this._applyAttribute(name, val)
      }
    }
  }

  private _ensureInitialized(): void {
    if (this._initialized) return
    this._initialized = true

    this._buildDOM()
    this._applyHostStyles()
    this._buildLayout()
    this._bindEvents()

    if (this._pendingDisabled) this.disabled = true
  }

  // =====================
  // Public API
  // =====================

  get contentElement(): HTMLDivElement { return this._contentEl }

  get hScrollTop(): ScrollBarWC | null { return this._hScrollTop }
  get hScrollBottom(): ScrollBarWC | null { return this._hScrollBottom }
  get vScrollLeft(): ScrollBarWC | null { return this._vScrollLeft }
  get vScrollRight(): ScrollBarWC | null { return this._vScrollRight }

  get cornerTopLeft(): HTMLDivElement | null { return this._cornerTL }
  get cornerTopRight(): HTMLDivElement | null { return this._cornerTR }
  get cornerBottomLeft(): HTMLDivElement | null { return this._cornerBL }
  get cornerBottomRight(): HTMLDivElement | null { return this._cornerBR }

  get scrollX(): number { return this._scrollX }
  set scrollX(v: number) {
    const max = Math.max(0, this._contentWidth - this._contentClip.clientWidth)
    this._scrollX = Math.max(0, Math.min(max, v))
    this._syncScrollBars()
    this._updateContentTransform()
    this._emitScroll()
  }

  get scrollY(): number { return this._scrollY }
  set scrollY(v: number) {
    const max = Math.max(0, this._contentHeight - this._contentClip.clientHeight)
    this._scrollY = Math.max(0, Math.min(max, v))
    this._syncScrollBars()
    this._updateContentTransform()
    this._emitScroll()
  }

  get contentWidth(): number { return this._contentWidth }
  set contentWidth(v: number) { this._contentWidth = v; this._updateScrollBarRanges() }

  get contentHeight(): number { return this._contentHeight }
  set contentHeight(v: number) { this._contentHeight = v; this._updateScrollBarRanges() }

  get scrollStep(): number { return this._scrollStep }
  set scrollStep(v: number) {
    this._scrollStep = v
    for (const sb of [this._hScrollTop, this._hScrollBottom, this._vScrollLeft, this._vScrollRight]) {
      if (sb) sb.step = v
    }
  }

  get disabled(): boolean { return this.classList.contains('disabled') }
  set disabled(v: boolean) { this.classList.toggle('disabled', v) }

  scrollContentTo(x: number, y: number): void {
    this.scrollX = x
    this.scrollY = y
  }

  scrollContentBy(dx: number, dy: number): void {
    if (this._scroll === 'none') return
    const canH = this._scroll === 'horizontal' || this._scroll === 'both'
    const canV = this._scroll === 'vertical' || this._scroll === 'both'
    if (canH && dx !== 0) this.scrollX = this._scrollX + dx
    if (canV && dy !== 0) this.scrollY = this._scrollY + dy
  }

  scrollChildIntoView(el: HTMLElement): void {
    if (!this._contentEl.contains(el)) return
    const clipRect = this._contentClip.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const canH = this._scroll === 'horizontal' || this._scroll === 'both'
    const canV = this._scroll === 'vertical' || this._scroll === 'both'

    if (canH) {
      if (elRect.left < clipRect.left) {
        this.scrollX = this._scrollX - (clipRect.left - elRect.left)
      } else if (elRect.right > clipRect.right) {
        this.scrollX = this._scrollX + (elRect.right - clipRect.right)
      }
    }

    if (canV) {
      if (elRect.top < clipRect.top) {
        this.scrollY = this._scrollY - (clipRect.top - elRect.top)
      } else if (elRect.bottom > clipRect.bottom) {
        this.scrollY = this._scrollY + (elRect.bottom - clipRect.bottom)
      }
    }
  }

  onScroll(handler: ScrollEventHandler): this {
    this._scrollListeners.add(handler)
    return this
  }

  offScroll(handler: ScrollEventHandler): this {
    this._scrollListeners.delete(handler)
    return this
  }

  refresh(): void {
    this._updateScrollBarRanges()
    this._refreshScrollBars()
    this._updateContentTransform()
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._hScrollTop?.destroy()
    this._hScrollBottom?.destroy()
    this._vScrollLeft?.destroy()
    this._vScrollRight?.destroy()
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    this._scrollListeners.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  // =====================
  // Internal DOM helpers
  // =====================

  private _div(className: string): HTMLDivElement {
    const el = document.createElement('div')
    el.className = className
    return el
  }

  private _makeCorner(sbSize: number): HTMLDivElement {
    const el = this._div('ui-scrollbox__corner')
    el.style.width = `${sbSize}px`
    el.style.height = `${sbSize}px`
    return el
  }

  private _on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this._cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  // =====================
  // Build DOM
  // =====================

  private _buildDOM(): void {
    this._topRow = this._div('ui-scrollbox__top-row')
    this._middleRow = this._div('ui-scrollbox__middle-row')
    this._bottomRow = this._div('ui-scrollbox__bottom-row')
    this._contentClip = this._div('ui-scrollbox__content-clip')
    this._contentEl = this._div('ui-scrollbox__content')

    // Default slot for framework content projection
    this._contentSlot = document.createElement('slot')
    this._contentEl.appendChild(this._contentSlot)

    // Auto-recalculate content dimensions when slotted children change
    this._contentSlot.addEventListener('slotchange', () => {
      requestAnimationFrame(() => {
        if (this._destroyed) return
        this._contentWidth = this._contentEl.scrollWidth
        this._contentHeight = this._contentEl.scrollHeight
        this._updateScrollBarRanges()
        this._refreshScrollBars()
      })
    })

    this._contentClip.appendChild(this._contentEl)
    this._shadow.appendChild(this._topRow)
    this._shadow.appendChild(this._middleRow)
    this._shadow.appendChild(this._bottomRow)
  }

  private _applyHostStyles(): void {
    const bw = this._pendingBorderWidth
    const bc = this._pendingBorderColor
    const bs = this._pendingBorderStyle
    this.style.border = bw > 0 ? `${bw}px ${bs} ${bc}` : 'none'
    this.style.backgroundColor = this._pendingBackgroundColor
    this.style.overflow = 'hidden'
    if (this._pendingOpacity < 1) this.style.opacity = String(this._pendingOpacity)
  }

  // =====================
  // Layout
  // =====================

  private _sbPixelSize(): number {
    switch (this._sbSize) {
      case 'tiny': return 10
      case 'small': return 14
      case 'medium': return 20
      case 'large': return 28
      case 'xlarge': return 36
      default: return 14
    }
  }

  private _createScrollBar(kind: 'horizontal' | 'vertical', config?: ScrollBoxScrollBarConfig): ScrollBarWC {
    const sb = document.createElement('scrollbar-wc') as ScrollBarWC
    sb.configure({
      kind,
      size: this._sbSize,
      hover: config?.hover ?? this._sbHover,
      showTooltip: config?.showTooltip ?? this._sbTooltip,
      showStartZone: config?.showStartZone,
      showEndZone: config?.showEndZone,
      min: 0,
      max: 0,
      value: 0,
    })
    sb.step = this._scrollStep
    sb.wheelFactor = this.wheelFactor
    return sb
  }

  private _buildLayout(): void {
    const showH = this._scroll === 'horizontal' || this._scroll === 'both'
    const showV = this._scroll === 'vertical' || this._scroll === 'both'
    const sbPx = this._sbPixelSize()

    const hasTop = showH && (this._horizontalScroll === 'top' || this._horizontalScroll === 'both')
    const hasBottom = showH && (this._horizontalScroll === 'bottom' || this._horizontalScroll === 'both')
    const hasLeft = showV && (this._verticalScroll === 'left' || this._verticalScroll === 'both')
    const hasRight = showV && (this._verticalScroll === 'right' || this._verticalScroll === 'both')

    // Clear
    this._topRow.innerHTML = ''
    this._middleRow.innerHTML = ''
    this._bottomRow.innerHTML = ''
    this._cornerTL = null
    this._cornerTR = null
    this._cornerBL = null
    this._cornerBR = null

    // --- Top row ---
    if (hasTop) {
      if (hasLeft) {
        this._cornerTL = this._makeCorner(sbPx)
        this._topRow.appendChild(this._cornerTL)
      }
      this._hScrollTop = this._createScrollBar('horizontal', this._sbConfigs.hTop)
      this._hScrollTop.style.flex = '1'
      this._topRow.appendChild(this._hScrollTop)
      if (hasRight) {
        this._cornerTR = this._makeCorner(sbPx)
        this._topRow.appendChild(this._cornerTR)
      }
    }
    this._topRow.style.display = hasTop ? 'flex' : 'none'

    // --- Middle row ---
    if (hasLeft) {
      this._vScrollLeft = this._createScrollBar('vertical', this._sbConfigs.vLeft)
      this._vScrollLeft.style.height = '100%'
      this._middleRow.appendChild(this._vScrollLeft)
    }

    this._middleRow.appendChild(this._contentClip)

    if (hasRight) {
      this._vScrollRight = this._createScrollBar('vertical', this._sbConfigs.vRight)
      this._vScrollRight.style.height = '100%'
      this._middleRow.appendChild(this._vScrollRight)
    }

    // --- Bottom row ---
    if (hasBottom) {
      if (hasLeft) {
        this._cornerBL = this._makeCorner(sbPx)
        this._bottomRow.appendChild(this._cornerBL)
      }
      this._hScrollBottom = this._createScrollBar('horizontal', this._sbConfigs.hBottom)
      this._hScrollBottom.style.flex = '1'
      this._bottomRow.appendChild(this._hScrollBottom)
      if (hasRight) {
        this._cornerBR = this._makeCorner(sbPx)
        this._bottomRow.appendChild(this._cornerBR)
      }
    }
    this._bottomRow.style.display = hasBottom ? 'flex' : 'none'

    // --- Bind scrollbar change events ---
    const bindH = (sb: ScrollBarWC) => {
      sb.on('change', (v: number) => {
        this._scrollX = v
        this._syncScrollBars(sb)
        this._updateContentTransform()
        this._emitScroll()
      })
    }
    const bindV = (sb: ScrollBarWC) => {
      sb.on('change', (v: number) => {
        this._scrollY = v
        this._syncScrollBars(sb)
        this._updateContentTransform()
        this._emitScroll()
      })
    }

    if (this._hScrollTop) bindH(this._hScrollTop)
    if (this._hScrollBottom) bindH(this._hScrollBottom)
    if (this._vScrollLeft) bindV(this._vScrollLeft)
    if (this._vScrollRight) bindV(this._vScrollRight)

    // Prevent wheel on scrollbars from propagating to ScrollBox
    for (const sb of [this._hScrollTop, this._hScrollBottom, this._vScrollLeft, this._vScrollRight]) {
      if (sb) {
        this._on(sb as unknown as HTMLElement, 'wheel', (e) => { e.stopPropagation() })
      }
    }
  }

  // =====================
  // Scroll logic
  // =====================

  private _updateContentTransform(): void {
    this._contentEl.style.transform = `translate(${-this._scrollX}px, ${-this._scrollY}px)`
  }

  private _syncScrollBars(source?: ScrollBarWC): void {
    if (this._hScrollTop && this._hScrollTop !== source) this._hScrollTop.value = this._scrollX
    if (this._hScrollBottom && this._hScrollBottom !== source) this._hScrollBottom.value = this._scrollX
    if (this._vScrollLeft && this._vScrollLeft !== source) this._vScrollLeft.value = this._scrollY
    if (this._vScrollRight && this._vScrollRight !== source) this._vScrollRight.value = this._scrollY
  }

  private _updateScrollBarRanges(): void {
    const visW = this._contentClip.clientWidth
    const visH = this._contentClip.clientHeight
    const maxX = Math.max(0, this._contentWidth - visW)
    const maxY = Math.max(0, this._contentHeight - visH)
    const needH = maxX > 0
    const needV = maxY > 0

    for (const sb of [this._hScrollTop, this._hScrollBottom]) {
      if (sb) {
        sb.max = maxX
        sb.pageStep = visW
        sb.value = this._scrollX
        sb.style.display = needH ? '' : 'none'
      }
    }
    for (const sb of [this._vScrollLeft, this._vScrollRight]) {
      if (sb) {
        sb.max = maxY
        sb.pageStep = visH
        sb.value = this._scrollY
        sb.style.display = needV ? '' : 'none'
      }
    }

    this._updateCornerVisibility(needH, needV)

    const hasTop = this._hScrollTop !== null
    const hasBottom = this._hScrollBottom !== null
    if (hasTop) this._topRow.style.display = needH ? 'flex' : 'none'
    if (hasBottom) this._bottomRow.style.display = needH ? 'flex' : 'none'
  }

  private _updateCornerVisibility(needH: boolean, needV: boolean): void {
    const show = needH && needV
    if (this._cornerTL) this._cornerTL.style.display = show ? '' : 'none'
    if (this._cornerTR) this._cornerTR.style.display = show ? '' : 'none'
    if (this._cornerBL) this._cornerBL.style.display = show ? '' : 'none'
    if (this._cornerBR) this._cornerBR.style.display = show ? '' : 'none'
  }

  private _refreshScrollBars(): void {
    this._hScrollTop?.refresh()
    this._hScrollBottom?.refresh()
    this._vScrollLeft?.refresh()
    this._vScrollRight?.refresh()
  }

  private _emitScroll(): void {
    // Vanilla JS listeners
    for (const fn of this._scrollListeners) fn(this._scrollX, this._scrollY)

    // CustomEvent for frameworks
    this.dispatchEvent(new CustomEvent('scrollbox-scroll', {
      detail: { x: this._scrollX, y: this._scrollY },
      bubbles: true,
      composed: true,
    }))
  }

  // =====================
  // Events
  // =====================

  private _bindEvents(): void {
    // Wheel
    this._on(this as unknown as HTMLElement, 'wheel', (e) => {
      if (this._scroll === 'none') return
      e.preventDefault()
      const amount = this._scrollStep * this.wheelFactor
      const dx = e.deltaX !== 0 ? Math.sign(e.deltaX) * amount : 0
      const dy = e.deltaY !== 0 ? Math.sign(e.deltaY) * amount : 0

      const visW = this._contentClip.clientWidth
      const visH = this._contentClip.clientHeight
      const needH = this._contentWidth > visW
      const needV = this._contentHeight > visH
      const canH = (this._scroll === 'horizontal' || this._scroll === 'both') && needH
      const canV = (this._scroll === 'vertical' || this._scroll === 'both') && needV

      if (this.altWheelHorizontal && e.altKey && canH && e.deltaX === 0) {
        this.scrollContentBy(dy, 0)
        return
      }

      if (canH && !canV && e.deltaX === 0) {
        this.scrollContentBy(dy, 0)
        return
      }

      this.scrollContentBy(dx, dy)
    }, { passive: false } as AddEventListenerOptions)

    // Keyboard
    const canH = this._scroll === 'horizontal' || this._scroll === 'both'
    const canV = this._scroll === 'vertical' || this._scroll === 'both'
    this._on(this as unknown as HTMLElement, 'keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':    if (canV) { e.preventDefault(); this.scrollContentBy(0, -20) } break
        case 'ArrowDown':  if (canV) { e.preventDefault(); this.scrollContentBy(0, 20) } break
        case 'ArrowLeft':  if (canH) { e.preventDefault(); this.scrollContentBy(-20, 0) } break
        case 'ArrowRight': if (canH) { e.preventDefault(); this.scrollContentBy(20, 0) } break
        case 'PageUp':     if (canV) { e.preventDefault(); this.scrollContentBy(0, -this._contentClip.clientHeight) } break
        case 'PageDown':   if (canV) { e.preventDefault(); this.scrollContentBy(0, this._contentClip.clientHeight) } break
        case 'Home':       if (canV) { e.preventDefault(); this.scrollContentTo(this._scrollX, 0) } break
        case 'End':        if (canV) { e.preventDefault(); this.scrollContentTo(this._scrollX, this._contentHeight) } break
      }
    })

    this.tabIndex = -1
    this.style.outline = 'none'
  }
}

customElements.define('scrollbox-wc', ScrollBoxWC)
