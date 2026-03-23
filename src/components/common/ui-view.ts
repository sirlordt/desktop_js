import type { DimensionProp, Align, Anchors, Rect, UISize, UIPosition } from './types'

function dim(kind: 'set' | 'dynamic', value: number): DimensionProp {
  return { kind, value }
}

const SIZE_HEIGHTS: Record<string, number> = {
  tiny: 24,
  small: 28,
  medium: 32,
  large: 40,
  xlarge: 48,
}

/** Attributes handled by the base class */
export const UI_ATTRS = [
  'size', 'position', 'left', 'top', 'width', 'height', 'right', 'bottom',
  'visible', 'disabled', 'name', 'opacity',
  'align',
  'anchors-left', 'anchors-top', 'anchors-right', 'anchors-bottom',
] as const

export class UIView extends HTMLElement {

  // ── Dimensions (never lost by align changes) ──
  private _left: DimensionProp = dim('set', 0)
  private _top: DimensionProp = dim('set', 0)
  private _width: DimensionProp = dim('set', 100)
  private _height: DimensionProp = dim('set', 32)
  private _right: DimensionProp = dim('dynamic', 0)
  private _bottom: DimensionProp = dim('dynamic', 0)

  // ── Resolved rect from parent layout pass ──
  private _alignRect: Rect | null = null

  // ── Layout ──
  private _align: Align = 'none'
  private _anchors: Anchors = { toLeft: true, toTop: true, toRight: false, toBottom: false }
  private _position: UIPosition = 'fluid'
  private _size: UISize = 'medium'

  // ── Appearance ──
  private _visible: boolean = true
  private _disabled: boolean = false
  private _opacity: number = 1

  // ── Identity ──
  private _name: string = ''

  // ── Hierarchy ──
  private _uiParent: UIView | null = null
  private _uiChildren: UIView[] = []

  // ── Lifecycle ──
  private _destroyed: boolean = false
  protected _cleanups: Array<() => void> = []

  // ── Theme observer ──
  private _themeObserver: MutationObserver | null = null

  constructor() {
    super()
  }

  // =====================
  // Web Component lifecycle
  // =====================

  static get observedAttributes(): string[] {
    return [...UI_ATTRS]
  }

  connectedCallback() {
    this._applyLayout()
    this._syncThemeClass()

    this._themeObserver = new MutationObserver(() => this._syncThemeClass())
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  disconnectedCallback() {
    this._themeObserver?.disconnect()
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null) {
    switch (name) {
      case 'left':
        if (val !== null) { this._left = dim('set', parseFloat(val) || 0) }
        break
      case 'top':
        if (val !== null) { this._top = dim('set', parseFloat(val) || 0) }
        break
      case 'width':
        if (val !== null) { this._width = dim('set', this._parseDimension(val)) }
        break
      case 'height':
        if (val !== null) { this._height = dim('set', parseFloat(val) || 0) }
        break
      case 'right':
        if (val !== null) { this._right = dim('set', parseFloat(val) || 0) }
        break
      case 'bottom':
        if (val !== null) { this._bottom = dim('set', parseFloat(val) || 0) }
        break
      case 'size':
        this._size = (val as UISize) || 'medium'
        this._applySizePreset()
        break
      case 'position':
        this._position = (val as UIPosition) || 'fluid'
        break
      case 'align':
        this._align = (val as Align) || 'none'
        break
      case 'visible':
        this._visible = val !== 'false'
        break
      case 'disabled':
        this._disabled = this.hasAttribute('disabled')
        this._cascadeDisabled()
        break
      case 'name':
        this._name = val || ''
        break
      case 'opacity':
        this._opacity = val !== null ? parseFloat(val) : 1
        break
      case 'anchors-left':
        this._anchors.toLeft = val !== 'false'
        break
      case 'anchors-top':
        this._anchors.toTop = val !== 'false'
        break
      case 'anchors-right':
        this._anchors.toRight = val === 'true'
        break
      case 'anchors-bottom':
        this._anchors.toBottom = val === 'true'
        break
    }

    if (this.isConnected) {
      this._applyLayout()
    }
  }

  // =====================
  // Identity
  // =====================

  get viewName(): string { return this._name }
  set viewName(v: string) {
    this._name = v
    this.setAttribute('name', v)
  }

  // =====================
  // Dimensions
  // =====================

  get viewLeft(): DimensionProp {
    if (this._alignRect && this._align !== 'none') {
      return dim('dynamic', this._alignRect.left)
    }
    if (this._align === 'none' && !this._anchors.toLeft && this._anchors.toRight) {
      return dim('dynamic', this._parentWidth - this._right.value - this.viewWidth.value)
    }
    return this._left
  }
  set viewLeft(v: number) {
    this._left = dim('set', v)
    this.setAttribute('left', String(v))
  }

  get viewTop(): DimensionProp {
    if (this._alignRect && this._align !== 'none') {
      return dim('dynamic', this._alignRect.top)
    }
    if (this._align === 'none' && !this._anchors.toTop && this._anchors.toBottom) {
      return dim('dynamic', this._parentHeight - this._bottom.value - this.viewHeight.value)
    }
    return this._top
  }
  set viewTop(v: number) {
    this._top = dim('set', v)
    this.setAttribute('top', String(v))
  }

  get viewWidth(): DimensionProp {
    if (this._alignRect && this._align !== 'none') {
      const keepSet = this._align === 'left' || this._align === 'right' || this._align === 'center'
      return dim(keepSet ? 'set' : 'dynamic', this._alignRect.width)
    }
    if (this._align === 'none' && this._anchors.toLeft && this._anchors.toRight) {
      return dim('dynamic', this._parentWidth - this._left.value - this._right.value)
    }
    return this._width
  }
  set viewWidth(v: number) {
    this._width = dim('set', v)
    this.setAttribute('width', String(v))
  }

  get viewHeight(): DimensionProp {
    if (this._alignRect && this._align !== 'none') {
      const keepSet = this._align === 'top' || this._align === 'bottom' || this._align === 'center'
      return dim(keepSet ? 'set' : 'dynamic', this._alignRect.height)
    }
    if (this._align === 'none' && this._anchors.toTop && this._anchors.toBottom) {
      return dim('dynamic', this._parentHeight - this._top.value - this._bottom.value)
    }
    return this._height
  }
  set viewHeight(v: number) {
    this._height = dim('set', v)
    this.setAttribute('height', String(v))
  }

  get viewRight(): DimensionProp {
    if (this._align !== 'none') {
      return dim('dynamic', this._parentWidth - (this.viewLeft.value + this.viewWidth.value))
    }
    if (this._right.kind === 'dynamic' || !this._anchors.toRight) {
      return dim('dynamic', this._parentWidth - (this._left.value + this.viewWidth.value))
    }
    return this._right
  }
  set viewRight(v: number) {
    this._right = dim('set', v)
    this.setAttribute('right', String(v))
  }

  get viewBottom(): DimensionProp {
    if (this._align !== 'none') {
      return dim('dynamic', this._parentHeight - (this.viewTop.value + this.viewHeight.value))
    }
    if (this._bottom.kind === 'dynamic' || !this._anchors.toBottom) {
      return dim('dynamic', this._parentHeight - (this._top.value + this.viewHeight.value))
    }
    return this._bottom
  }
  set viewBottom(v: number) {
    this._bottom = dim('set', v)
    this.setAttribute('bottom', String(v))
  }

  // =====================
  // Align
  // =====================

  get viewAlign(): Align { return this._align }
  set viewAlign(v: Align) {
    this._align = v
    this.setAttribute('align', v)
  }

  // =====================
  // Anchors
  // =====================

  get anchors(): Anchors { return { ...this._anchors } }
  set anchors(v: Anchors) {
    this._anchors = { ...v }
    if (v.toRight) this.setAttribute('anchors-right', 'true')
    if (v.toBottom) this.setAttribute('anchors-bottom', 'true')
    if (!v.toLeft) this.setAttribute('anchors-left', 'false')
    if (!v.toTop) this.setAttribute('anchors-top', 'false')
  }

  // =====================
  // Position
  // =====================

  get viewPosition(): UIPosition { return this._position }
  set viewPosition(v: UIPosition) {
    this._position = v
    this.setAttribute('position', v)
  }

  // =====================
  // Size
  // =====================

  get viewSize(): UISize { return this._size }
  set viewSize(v: UISize) {
    this._size = v
    this.setAttribute('size', v)
  }

  // =====================
  // Appearance
  // =====================

  get viewVisible(): boolean { return this._visible }
  set viewVisible(v: boolean) {
    this._visible = v
    if (v) this.removeAttribute('hidden')
    else this.setAttribute('hidden', '')
    this._applyLayout()
  }

  get viewDisabled(): boolean { return this._disabled }
  set viewDisabled(v: boolean) {
    this._disabled = v
    if (v) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
    this._cascadeDisabled()
    this._applyLayout()
  }

  get viewOpacity(): number { return this._opacity }
  set viewOpacity(v: number) {
    this._opacity = v
    this.setAttribute('opacity', String(v))
  }

  // =====================
  // Hierarchy
  // =====================

  get uiParent(): UIView | null { return this._uiParent }
  set uiParent(newParent: UIView | null) {
    if (this._uiParent === newParent) return

    if (this._uiParent) {
      this._uiParent._removeUIChild(this)
    }

    this._uiParent = newParent

    if (newParent) {
      newParent._addUIChild(this)
    }
  }

  get uiChildren(): ReadonlyArray<UIView> {
    return this._uiChildren
  }

  addUIChild(child: UIView): void {
    child.uiParent = this
  }

  removeUIChild(child: UIView): void {
    child.uiParent = null
  }

  private _addUIChild(child: UIView): void {
    if (!this._uiChildren.includes(child)) {
      this._uiChildren.push(child)
    }
  }

  private _removeUIChild(child: UIView): void {
    const idx = this._uiChildren.indexOf(child)
    if (idx !== -1) {
      this._uiChildren.splice(idx, 1)
    }
  }

  // =====================
  // Destroy / cleanup
  // =====================

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    for (const child of [...this._uiChildren]) {
      child.destroy()
    }

    for (const cleanup of this._cleanups) {
      cleanup()
    }
    this._cleanups.length = 0

    if (this._uiParent) {
      this._uiParent._removeUIChild(this)
    }

    this._themeObserver?.disconnect()

    if (this.parentElement) {
      this.parentElement.removeChild(this)
    }

    this._uiParent = null
    this._uiChildren.length = 0
    this._eventHandlers.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  /** Register a DOM event listener with automatic cleanup on destroy */
  protected _on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this._cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  // =====================
  // Event emitter (framework-friendly)
  // =====================

  private _eventHandlers: Map<string, Set<Function>> = new Map()

  /** Subscribe to a component event. Returns `this` for chaining. */
  on(event: string, handler: Function): this {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, new Set())
    }
    this._eventHandlers.get(event)!.add(handler)
    return this
  }

  /** Unsubscribe from a component event. Returns `this` for chaining. */
  off(event: string, handler: Function): this {
    this._eventHandlers.get(event)?.delete(handler)
    return this
  }

  /** Emit a component event to all registered handlers + dispatch CustomEvent */
  protected _emit(event: string, detail?: any): void {
    // Call registered handlers (framework-friendly API)
    const handlers = this._eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(detail)
      }
    }

    // Also dispatch a CustomEvent on the element (web component standard)
    this.dispatchEvent(new CustomEvent(event, {
      bubbles: true,
      composed: true,
      detail,
    }))
  }

  // =====================
  // Parent dimensions helper
  // =====================

  private get _parentWidth(): number {
    if (this._uiParent) return this._uiParent.viewWidth.value
    if (this.parentElement) return this.parentElement.clientWidth
    return 0
  }

  private get _parentHeight(): number {
    if (this._uiParent) return this._uiParent.viewHeight.value
    if (this.parentElement) return this.parentElement.clientHeight
    return 0
  }

  // =====================
  // Size presets
  // =====================

  private _applySizePreset(): void {
    if (this._size !== 'custom' && SIZE_HEIGHTS[this._size]) {
      this._height = dim('set', SIZE_HEIGHTS[this._size])
    }
  }

  // =====================
  // Layout pass
  // =====================

  /** Parent computes rects for aligned children */
  protected _computeChildrenLayout(): void {
    const pw = this.viewWidth.value
    const ph = this.viewHeight.value

    let availLeft = 0
    let availTop = 0
    let availRight = pw
    let availBottom = ph

    for (const child of this._uiChildren) {
      if (child._align === 'none') {
        child._alignRect = null
        continue
      }

      const availWidth = availRight - availLeft
      const availHeight = availBottom - availTop

      switch (child._align) {
        case 'top':
          child._alignRect = {
            left: availLeft,
            top: availTop,
            width: availWidth,
            height: child._height.value,
          }
          availTop += child._height.value
          break

        case 'bottom':
          child._alignRect = {
            left: availLeft,
            top: availBottom - child._height.value,
            width: availWidth,
            height: child._height.value,
          }
          availBottom -= child._height.value
          break

        case 'left':
          child._alignRect = {
            left: availLeft,
            top: availTop,
            width: child._width.value,
            height: availHeight,
          }
          availLeft += child._width.value
          break

        case 'right':
          child._alignRect = {
            left: availRight - child._width.value,
            top: availTop,
            width: child._width.value,
            height: availHeight,
          }
          availRight -= child._width.value
          break

        case 'client':
          child._alignRect = {
            left: availLeft,
            top: availTop,
            width: availRight - availLeft,
            height: availBottom - availTop,
          }
          break

        case 'center':
          child._alignRect = {
            left: availLeft + (availWidth - child._width.value) / 2,
            top: availTop + (availHeight - child._height.value) / 2,
            width: child._width.value,
            height: child._height.value,
          }
          break
      }
    }
  }

  // =====================
  // Apply layout to DOM
  // =====================

  protected _applyLayout(): void {
    // Compute children layout first
    this._computeChildrenLayout()

    // Position
    if (this._align !== 'none') {
      this.style.position = 'absolute'
    } else {
      switch (this._position) {
        case 'fluid':
          this.style.position = ''
          break
        case 'relative':
          this.style.position = 'relative'
          break
        case 'absolute':
          this.style.position = 'absolute'
          break
      }
    }

    // Coordinates
    const needsCoords = this._position !== 'fluid' || this._align !== 'none'
    if (needsCoords) {
      this.style.left = `${this.viewLeft.value}px`
      this.style.top = `${this.viewTop.value}px`
    } else {
      this.style.left = ''
      this.style.top = ''
    }

    // Dimensions
    const widthAttr = this.getAttribute('width')
    const heightAttr = this.getAttribute('height')

    if (this._size === 'custom') {
      // Custom: use raw attribute values (supports px, %, etc.)
      this.style.width = widthAttr ? this._toCssValue(widthAttr) : ''
      this.style.height = heightAttr ? this._toCssValue(heightAttr) : ''
    } else if (this._align !== 'none' || this._position === 'absolute') {
      // Positioned/aligned: use computed pixel values
      this.style.width = `${this.viewWidth.value}px`
      this.style.height = `${this.viewHeight.value}px`
    } else if (this._position === 'fluid') {
      // Fluid: height from preset, width auto unless specified
      this.style.width = widthAttr ? this._toCssValue(widthAttr) : ''
      this.style.height = `${this.viewHeight.value}px`
    } else {
      // Relative: use computed values
      this.style.width = widthAttr ? this._toCssValue(widthAttr) : `${this.viewWidth.value}px`
      this.style.height = `${this.viewHeight.value}px`
    }

    // Visibility
    this.style.display = this._visible ? '' : 'none'

    // Opacity
    if (this._disabled) {
      this.style.opacity = String(Math.min(this._opacity, 0.5))
      this.style.pointerEvents = 'none'
    } else {
      this.style.opacity = this._opacity < 1 ? String(this._opacity) : ''
      this.style.pointerEvents = ''
    }

    // Box sizing
    this.style.boxSizing = 'border-box'

    // Apply children layout
    for (const child of this._uiChildren) {
      child._applyLayout()
    }
  }

  // =====================
  // Disabled cascade
  // =====================

  private _cascadeDisabled(): void {
    for (const child of this._uiChildren) {
      if (this._disabled) {
        child.setAttribute('disabled', '')
      }
      child._cascadeDisabled()
    }
  }

  // =====================
  // Theme sync
  // =====================

  protected _syncThemeClass(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    if (theme.startsWith('win95')) {
      this.classList.add('win95')
    } else {
      this.classList.remove('win95')
    }
  }

  // =====================
  // Helpers
  // =====================

  private _parseDimension(val: string): number {
    const num = parseFloat(val)
    return isNaN(num) ? 100 : num
  }

  private _isNumeric(val: string): boolean {
    return !isNaN(parseFloat(val)) && isFinite(Number(val))
  }

  /** Convert attribute value to CSS: numbers become px, strings pass through */
  private _toCssValue(val: string): string {
    return this._isNumeric(val) ? `${val}px` : val
  }

  // =====================
  // Update
  // =====================

  update(): void {
    this._applyLayout()
  }
}
