import type { DimensionProp, Align, Anchors, Rect, UISize, UIPosition } from './types'

function dim(kind: 'set' | 'dynamic' | 'auto', value: number): DimensionProp {
  return { kind, value }
}

const SIZE_HEIGHTS: Record<string, number> = {
  tiny: 24,
  small: 28,
  medium: 32,
  large: 40,
  xlarge: 48,
}

/**
 * UIView — reusable layout engine, event emitter, cleanup, and theme sync.
 * Works with any HTMLElement (div, custom element, etc.).
 * Does NOT require Shadow DOM or custom element registration.
 */
export class UIView {

  // ── The element this core manages ──
  readonly el: HTMLElement

  // ── Dimensions ──
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
  private _parent: UIView | null = null
  private _children: UIView[] = []

  // ── Lifecycle ──
  private _destroyed: boolean = false
  cleanups: Array<() => void> = []

  // ── Theme observer ──
  private _themeObserver: MutationObserver | null = null

  // ── Event emitter ──
  private _eventHandlers: Map<string, Set<Function>> = new Map()

  constructor(el: HTMLElement) {
    this.el = el
  }

  // =====================
  // Init / connect
  // =====================

  /** Call after the element is in the DOM (or immediately for standalone components) */
  connect(): void {
    this.applyLayout()
    this.syncThemeClass()
    this._themeObserver = new MutationObserver(() => this.syncThemeClass())
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  /** Call when the element is removed from the DOM */
  disconnect(): void {
    this._themeObserver?.disconnect()
    this._themeObserver = null
  }

  // =====================
  // Identity
  // =====================

  get viewName(): string { return this._name }
  set viewName(v: string) { this._name = v }

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
  set viewLeft(v: number) { this._left = dim('set', v) }

  get viewTop(): DimensionProp {
    if (this._alignRect && this._align !== 'none') {
      return dim('dynamic', this._alignRect.top)
    }
    if (this._align === 'none' && !this._anchors.toTop && this._anchors.toBottom) {
      return dim('dynamic', this._parentHeight - this._bottom.value - this.viewHeight.value)
    }
    return this._top
  }
  set viewTop(v: number) { this._top = dim('set', v) }

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
  set viewWidth(v: number) { this._width = dim('set', v) }
  setViewWidthAuto(): void { this._width = dim('auto', 0) }

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
  set viewHeight(v: number) { this._height = dim('set', v) }
  setViewHeightAuto(): void { this._height = dim('auto', 0) }

  get viewRight(): DimensionProp {
    if (this._align !== 'none') {
      return dim('dynamic', this._parentWidth - (this.viewLeft.value + this.viewWidth.value))
    }
    if (this._right.kind === 'dynamic' || !this._anchors.toRight) {
      return dim('dynamic', this._parentWidth - (this._left.value + this.viewWidth.value))
    }
    return this._right
  }
  set viewRight(v: number) { this._right = dim('set', v) }

  get viewBottom(): DimensionProp {
    if (this._align !== 'none') {
      return dim('dynamic', this._parentHeight - (this.viewTop.value + this.viewHeight.value))
    }
    if (this._bottom.kind === 'dynamic' || !this._anchors.toBottom) {
      return dim('dynamic', this._parentHeight - (this._top.value + this.viewHeight.value))
    }
    return this._bottom
  }
  set viewBottom(v: number) { this._bottom = dim('set', v) }

  // =====================
  // Align
  // =====================

  get viewAlign(): Align { return this._align }
  set viewAlign(v: Align) { this._align = v }

  // =====================
  // Anchors
  // =====================

  get anchors(): Anchors { return { ...this._anchors } }
  set anchors(v: Anchors) { this._anchors = { ...v } }

  // =====================
  // Position
  // =====================

  get viewPosition(): UIPosition { return this._position }
  set viewPosition(v: UIPosition) { this._position = v }

  // =====================
  // Size
  // =====================

  get viewSize(): UISize { return this._size }
  set viewSize(v: UISize) {
    this._size = v
    this._applySizePreset()
  }

  // =====================
  // Appearance
  // =====================

  get viewVisible(): boolean { return this._visible }
  set viewVisible(v: boolean) {
    this._visible = v
    this.applyLayout()
  }

  get viewDisabled(): boolean { return this._disabled }
  set viewDisabled(v: boolean) {
    this._disabled = v
    this._cascadeDisabled()
    this.applyLayout()
  }

  get viewOpacity(): number { return this._opacity }
  set viewOpacity(v: number) { this._opacity = v }

  // =====================
  // Hierarchy
  // =====================

  get parent(): UIView | null { return this._parent }
  set parent(newParent: UIView | null) {
    if (this._parent === newParent) return
    if (this._parent) {
      this._parent._removeChild(this)
    }
    this._parent = newParent
    if (newParent) {
      newParent._addChild(this)
    }
  }

  get children(): ReadonlyArray<UIView> { return this._children }

  addChild(child: UIView): void { child.parent = this }
  removeChild(child: UIView): void { child.parent = null }

  private _addChild(child: UIView): void {
    if (!this._children.includes(child)) this._children.push(child)
  }

  private _removeChild(child: UIView): void {
    const idx = this._children.indexOf(child)
    if (idx !== -1) this._children.splice(idx, 1)
  }

  // =====================
  // Destroy / cleanup
  // =====================

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    for (const child of [...this._children]) child.destroy()

    for (const cleanup of this.cleanups) cleanup()
    this.cleanups.length = 0

    if (this._parent) this._parent._removeChild(this)

    this._themeObserver?.disconnect()

    if (this.el.parentNode) this.el.parentNode.removeChild(this.el)

    this._parent = null
    this._children.length = 0
    this._eventHandlers.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  /** Register a DOM event listener with automatic cleanup on destroy */
  addListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this.cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  // =====================
  // Event emitter (framework-friendly)
  // =====================

  on(event: string, handler: Function): this {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, new Set())
    }
    this._eventHandlers.get(event)!.add(handler)
    return this
  }

  off(event: string, handler: Function): this {
    this._eventHandlers.get(event)?.delete(handler)
    return this
  }

  emit(event: string, detail?: any): void {
    const handlers = this._eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) handler(detail)
    }
    this.el.dispatchEvent(new CustomEvent(event, {
      bubbles: true,
      composed: true,
      detail,
    }))
  }

  // =====================
  // Parent dimensions helper
  // =====================

  private get _parentWidth(): number {
    if (this._parent) return this._parent.viewWidth.value
    if (this.el.parentElement) return this.el.parentElement.clientWidth
    return 0
  }

  private get _parentHeight(): number {
    if (this._parent) return this._parent.viewHeight.value
    if (this.el.parentElement) return this.el.parentElement.clientHeight
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

  computeChildrenLayout(): void {
    const pw = this.viewWidth.value
    const ph = this.viewHeight.value

    let availLeft = 0
    let availTop = 0
    let availRight = pw
    let availBottom = ph

    for (const child of this._children) {
      if (child._align === 'none') {
        child._alignRect = null
        continue
      }

      const availWidth = availRight - availLeft
      const availHeight = availBottom - availTop

      switch (child._align) {
        case 'top':
          child._alignRect = { left: availLeft, top: availTop, width: availWidth, height: child._height.value }
          availTop += child._height.value
          break
        case 'bottom':
          child._alignRect = { left: availLeft, top: availBottom - child._height.value, width: availWidth, height: child._height.value }
          availBottom -= child._height.value
          break
        case 'left':
          child._alignRect = { left: availLeft, top: availTop, width: child._width.value, height: availHeight }
          availLeft += child._width.value
          break
        case 'right':
          child._alignRect = { left: availRight - child._width.value, top: availTop, width: child._width.value, height: availHeight }
          availRight -= child._width.value
          break
        case 'client':
          child._alignRect = { left: availLeft, top: availTop, width: availRight - availLeft, height: availBottom - availTop }
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

  applyLayout(): void {
    this.computeChildrenLayout()

    // Position — children of a layout parent are always absolutely positioned
    const isLayoutChild = this._parent !== null
    if (isLayoutChild || this._align !== 'none') {
      this.el.style.position = 'absolute'
    } else {
      switch (this._position) {
        case 'fluid': this.el.style.position = ''; break
        case 'relative': this.el.style.position = 'relative'; break
        case 'absolute': this.el.style.position = 'absolute'; break
      }
    }

    // Coordinates
    const needsCoords = isLayoutChild || this._position !== 'fluid' || this._align !== 'none'
    if (needsCoords) {
      this.el.style.left = `${this.viewLeft.value}px`
      this.el.style.top = `${this.viewTop.value}px`
    } else {
      this.el.style.left = ''
      this.el.style.top = ''
    }

    // Dimensions — 'auto' kind means "don't touch, let CSS handle it"
    if (isLayoutChild || this._align !== 'none' || this._position === 'absolute') {
      this.el.style.width = this._width.kind === 'auto' ? '' : `${this.viewWidth.value}px`
      this.el.style.height = this._height.kind === 'auto' ? '' : `${this.viewHeight.value}px`
    } else if (this._size === 'custom') {
      if (this._width.kind === 'set') this.el.style.width = `${this._width.value}px`
      else if (this._width.kind === 'auto') this.el.style.width = ''
      if (this._height.kind === 'set') this.el.style.height = `${this._height.value}px`
      else if (this._height.kind === 'auto') this.el.style.height = ''
    } else if (this._position === 'fluid') {
      this.el.style.width = ''
      this.el.style.height = this._height.kind === 'auto' ? '' : `${this.viewHeight.value}px`
    } else {
      this.el.style.width = this._width.kind === 'auto' ? '' : `${this.viewWidth.value}px`
      this.el.style.height = this._height.kind === 'auto' ? '' : `${this.viewHeight.value}px`
    }

    // Visibility
    this.el.style.display = this._visible ? '' : 'none'

    // Opacity
    if (this._disabled) {
      this.el.style.opacity = String(Math.min(this._opacity, 0.5))
      this.el.style.pointerEvents = 'none'
    } else {
      this.el.style.opacity = this._opacity < 1 ? String(this._opacity) : ''
      this.el.style.pointerEvents = ''
    }

    this.el.style.boxSizing = 'border-box'

    // Parent of positioned children needs to be the positioning context
    if (this._children.length > 0) {
      if (!this.el.style.position || this.el.style.position === 'static') {
        this.el.style.position = 'relative'
      }
      this.el.style.overflow = 'hidden'
    }

    for (const child of this._children) child.applyLayout()
  }

  // =====================
  // Disabled cascade
  // =====================

  private _cascadeDisabled(): void {
    for (const child of this._children) {
      child._disabled = this._disabled
      child._cascadeDisabled()
    }
  }

  // =====================
  // Theme sync
  // =====================

  syncThemeClass(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    if (theme.startsWith('win95')) {
      this.el.classList.add('win95')
    } else {
      this.el.classList.remove('win95')
    }
  }

  getThemeName(): string {
    return document.documentElement.getAttribute('data-theme') || 'gtk4-light'
  }

  // =====================
  // Attribute parsing helper
  // =====================

  applyAttribute(name: string, val: string | null): void {
    switch (name) {
      case 'left': if (val !== null) this._left = dim('set', parseFloat(val) || 0); break
      case 'top': if (val !== null) this._top = dim('set', parseFloat(val) || 0); break
      case 'width': if (val !== null) this._width = val === 'auto' ? dim('auto', 0) : dim('set', parseFloat(val) || 100); break
      case 'height': if (val !== null) this._height = val === 'auto' ? dim('auto', 0) : dim('set', parseFloat(val) || 0); break
      case 'right': if (val !== null) this._right = dim('set', parseFloat(val) || 0); break
      case 'bottom': if (val !== null) this._bottom = dim('set', parseFloat(val) || 0); break
      case 'size': this._size = (val as UISize) || 'medium'; this._applySizePreset(); break
      case 'position': this._position = (val as UIPosition) || 'fluid'; break
      case 'align': this._align = (val as Align) || 'none'; break
      case 'visible': this._visible = val !== 'false'; break
      case 'name': this._name = val || ''; break
      case 'opacity': this._opacity = val !== null ? parseFloat(val) : 1; break
      case 'anchors-left': this._anchors.toLeft = val !== 'false'; break
      case 'anchors-top': this._anchors.toTop = val !== 'false'; break
      case 'anchors-right': this._anchors.toRight = val === 'true'; break
      case 'anchors-bottom': this._anchors.toBottom = val === 'true'; break
    }
  }

  // =====================
  // Update
  // =====================

  update(): void { this.applyLayout() }
}
