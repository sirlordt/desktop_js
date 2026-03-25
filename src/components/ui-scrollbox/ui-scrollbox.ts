import { UIScrollBar } from '../ui-scrollbar/ui-scrollbar'
import { applySimulateFocus } from '../common/simulate-focus'
import type {
  ScrollMode,
  VerticalScrollPosition,
  HorizontalScrollPosition,
  ScrollBarSize,
  ScrollBoxScrollBarConfig,
  UIScrollBoxOptions,
} from '../common/types'
import './ui-scrollbox.css'

type ScrollEventHandler = (x: number, y: number) => void

export class UIScrollBox {
  // --- Config ---
  private _scroll: ScrollMode
  private _verticalScroll: VerticalScrollPosition
  private _horizontalScroll: HorizontalScrollPosition
  private _sbSize: ScrollBarSize
  private _sbHover: boolean
  private _sbTooltip: boolean
  private _sbConfigs: {
    hTop?: ScrollBoxScrollBarConfig
    hBottom?: ScrollBoxScrollBarConfig
    vLeft?: ScrollBoxScrollBarConfig
    vRight?: ScrollBoxScrollBarConfig
  }

  // --- Wheel / step ---
  wheelFactor: number = 1
  altWheelHorizontal: boolean = true
  private _scrollStep: number = 20

  // --- Scroll state ---
  private _scrollX: number = 0
  private _scrollY: number = 0
  private _contentWidth: number = 0
  private _contentHeight: number = 0

  // --- ScrollBars ---
  private _hScrollTop: UIScrollBar | null = null
  private _hScrollBottom: UIScrollBar | null = null
  private _vScrollLeft: UIScrollBar | null = null
  private _vScrollRight: UIScrollBar | null = null

  // --- DOM ---
  private _el: HTMLDivElement
  private _topRow: HTMLDivElement
  private _middleRow: HTMLDivElement
  private _bottomRow: HTMLDivElement
  private _contentClip: HTMLDivElement
  private _contentEl: HTMLDivElement
  private _cornerTL: HTMLDivElement | null = null
  private _cornerTR: HTMLDivElement | null = null
  private _cornerBL: HTMLDivElement | null = null
  private _cornerBR: HTMLDivElement | null = null

  // --- Events ---
  private _scrollListeners: Set<ScrollEventHandler> = new Set()
  private _cleanups: Array<() => void> = []
  private _destroyed: boolean = false

  constructor(options?: UIScrollBoxOptions) {
    const o = options ?? {}
    this._scroll = o.scroll ?? 'both'
    this._verticalScroll = o.verticalScroll ?? 'right'
    this._horizontalScroll = o.horizontalScroll ?? 'bottom'
    this._sbSize = o.scrollBarSize ?? 'small'
    this._sbHover = o.scrollBarHover ?? false
    this._sbTooltip = o.scrollBarTooltip ?? false
    this._sbConfigs = {
      hTop: o.hScrollTopConfig,
      hBottom: o.hScrollBottomConfig,
      vLeft: o.vScrollLeftConfig,
      vRight: o.vScrollRightConfig,
    }
    this._scrollStep = o.scrollStep ?? 20
    this.wheelFactor = o.wheelFactor ?? 1
    this.altWheelHorizontal = o.altWheelHorizontal ?? true
    this._contentWidth = o.contentWidth ?? 0
    this._contentHeight = o.contentHeight ?? 0

    // Build DOM
    this._el = this._div('ui-scrollbox')
    this._topRow = this._div('ui-scrollbox__top-row')
    this._middleRow = this._div('ui-scrollbox__middle-row')
    this._bottomRow = this._div('ui-scrollbox__bottom-row')
    this._contentClip = this._div('ui-scrollbox__content-clip')
    this._contentEl = this._div('ui-scrollbox__content')

    this._contentClip.appendChild(this._contentEl)
    this._el.appendChild(this._topRow)
    this._el.appendChild(this._middleRow)
    this._el.appendChild(this._bottomRow)

    // Styling
    const bw = o.borderWidth ?? 1
    const bc = o.borderColor ?? 'var(--border-color)'
    const bs = o.borderStyle ?? 'solid'
    this._el.style.border = bw > 0 ? `${bw}px ${bs} ${bc}` : 'none'
    this._el.style.backgroundColor = o.backgroundColor ?? 'var(--view-bg-color)'
    this._el.style.overflow = 'hidden'
    if (o.opacity !== undefined && o.opacity < 1) this._el.style.opacity = String(o.opacity)

    this._buildLayout()
    this._bindEvents()

    if (o.disabled) this.disabled = true
  }

  // =====================
  // Public API
  // =====================

  get element(): HTMLDivElement { return this._el }
  get contentElement(): HTMLDivElement { return this._contentEl }

  get hScrollTop(): UIScrollBar | null { return this._hScrollTop }
  get hScrollBottom(): UIScrollBar | null { return this._hScrollBottom }
  get vScrollLeft(): UIScrollBar | null { return this._vScrollLeft }
  get vScrollRight(): UIScrollBar | null { return this._vScrollRight }

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

  get disabled(): boolean { return this._el.classList.contains('disabled') }
  set disabled(v: boolean) { this._el.classList.toggle('disabled', v) }

  scrollTo(x: number, y: number): void {
    this.scrollX = x
    this.scrollY = y
  }

  scrollBy(dx: number, dy: number): void {
    if (this._scroll === 'none') return
    const canH = this._scroll === 'horizontal' || this._scroll === 'both'
    const canV = this._scroll === 'vertical' || this._scroll === 'both'
    if (canH && dx !== 0) this.scrollX = this._scrollX + dx
    if (canV && dy !== 0) this.scrollY = this._scrollY + dy
  }

  /** Scroll the minimum amount needed to make a child element fully visible */
  scrollIntoView(el: HTMLElement): void {
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

  /** Call after mounting or resizing to sync scrollbar ranges and thumb positions */
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
    if (this._el.parentNode) this._el.parentNode.removeChild(this._el)
  }

  get isDestroyed(): boolean { return this._destroyed }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this._el, v)
  }

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

  private _createScrollBar(kind: 'horizontal' | 'vertical', config?: ScrollBoxScrollBarConfig): UIScrollBar {
    const sb = new UIScrollBar({
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
      this._hScrollTop.element.style.flex = '1'
      this._topRow.appendChild(this._hScrollTop.element)
      if (hasRight) {
        this._cornerTR = this._makeCorner(sbPx)
        this._topRow.appendChild(this._cornerTR)
      }
    }
    this._topRow.style.display = hasTop ? 'flex' : 'none'

    // --- Middle row ---
    if (hasLeft) {
      this._vScrollLeft = this._createScrollBar('vertical', this._sbConfigs.vLeft)
      this._vScrollLeft.element.style.height = '100%'
      this._middleRow.appendChild(this._vScrollLeft.element)
    }

    this._middleRow.appendChild(this._contentClip)

    if (hasRight) {
      this._vScrollRight = this._createScrollBar('vertical', this._sbConfigs.vRight)
      this._vScrollRight.element.style.height = '100%'
      this._middleRow.appendChild(this._vScrollRight.element)
    }

    // --- Bottom row ---
    if (hasBottom) {
      if (hasLeft) {
        this._cornerBL = this._makeCorner(sbPx)
        this._bottomRow.appendChild(this._cornerBL)
      }
      this._hScrollBottom = this._createScrollBar('horizontal', this._sbConfigs.hBottom)
      this._hScrollBottom.element.style.flex = '1'
      this._bottomRow.appendChild(this._hScrollBottom.element)
      if (hasRight) {
        this._cornerBR = this._makeCorner(sbPx)
        this._bottomRow.appendChild(this._cornerBR)
      }
    }
    this._bottomRow.style.display = hasBottom ? 'flex' : 'none'

    // --- Bind scrollbar change events ---
    const bindH = (sb: UIScrollBar) => {
      sb.on('change', (v: number) => {
        this._scrollX = v
        this._syncScrollBars(sb)
        this._updateContentTransform()
        this._emitScroll()
      })
    }
    const bindV = (sb: UIScrollBar) => {
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
        this._on(sb.element, 'wheel', (e) => { e.stopPropagation() })
      }
    }
  }

  // =====================
  // Scroll logic
  // =====================

  private _updateContentTransform(): void {
    this._contentEl.style.transform = `translate(${-this._scrollX}px, ${-this._scrollY}px)`
  }

  private _syncScrollBars(source?: UIScrollBar): void {
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
        sb.element.style.display = needH ? '' : 'none'
      }
    }
    for (const sb of [this._vScrollLeft, this._vScrollRight]) {
      if (sb) {
        sb.max = maxY
        sb.pageStep = visH
        sb.value = this._scrollY
        sb.element.style.display = needV ? '' : 'none'
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
    for (const fn of this._scrollListeners) fn(this._scrollX, this._scrollY)
  }

  // =====================
  // Events
  // =====================

  private _bindEvents(): void {
    // Wheel
    this._on(this._el, 'wheel', (e) => {
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
        this.scrollBy(dy, 0)
        return
      }

      if (canH && !canV && e.deltaX === 0) {
        this.scrollBy(dy, 0)
        return
      }

      this.scrollBy(dx, dy)
    }, { passive: false } as AddEventListenerOptions)

    // Keyboard
    const canH = this._scroll === 'horizontal' || this._scroll === 'both'
    const canV = this._scroll === 'vertical' || this._scroll === 'both'
    this._on(this._el, 'keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':    if (canV) { e.preventDefault(); this.scrollBy(0, -20) } break
        case 'ArrowDown':  if (canV) { e.preventDefault(); this.scrollBy(0, 20) } break
        case 'ArrowLeft':  if (canH) { e.preventDefault(); this.scrollBy(-20, 0) } break
        case 'ArrowRight': if (canH) { e.preventDefault(); this.scrollBy(20, 0) } break
        case 'PageUp':     if (canV) { e.preventDefault(); this.scrollBy(0, -this._contentClip.clientHeight) } break
        case 'PageDown':   if (canV) { e.preventDefault(); this.scrollBy(0, this._contentClip.clientHeight) } break
        case 'Home':       if (canV) { e.preventDefault(); this.scrollTo(this._scrollX, 0) } break
        case 'End':        if (canV) { e.preventDefault(); this.scrollTo(this._scrollX, this._contentHeight) } break
      }
    })

    this._el.tabIndex = -1
    this._el.style.outline = 'none'
  }
}
