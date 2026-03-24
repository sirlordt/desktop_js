import type { DimensionProp, Align, Anchors, UISize, UIPosition } from './types'
import { UIViewCore } from './ui-view-core'

/** Attributes handled by the base class */
export const UI_ATTRS = [
  'size', 'position', 'left', 'top', 'width', 'height', 'right', 'bottom',
  'visible', 'disabled', 'name', 'opacity',
  'align',
  'anchors-left', 'anchors-top', 'anchors-right', 'anchors-bottom',
] as const

/**
 * UIView — Web Component base class for UI components.
 * Delegates layout, events, cleanup, and theme to UIViewCore.
 */
export class UIView extends HTMLElement {

  /** The core engine managing this element's layout, events, and lifecycle */
  protected _core: UIViewCore

  /** Proxy to core cleanups for subclass compatibility */
  protected get _cleanups(): Array<() => void> { return this._core.cleanups }

  constructor() {
    super()
    this._core = new UIViewCore(this)
  }

  // =====================
  // Web Component lifecycle
  // =====================

  static get observedAttributes(): string[] {
    return [...UI_ATTRS]
  }

  connectedCallback() {
    this._core.connect()
  }

  disconnectedCallback() {
    this._core.disconnect()
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null) {
    this._core.applyAttribute(name, val)

    if (name === 'disabled') {
      this._core.viewDisabled = this.hasAttribute('disabled')
    }

    if (this.isConnected) {
      this._core.applyLayout()
    }
  }

  // =====================
  // Identity
  // =====================

  get viewName(): string { return this._core.viewName }
  set viewName(v: string) {
    this._core.viewName = v
    this.setAttribute('name', v)
  }

  // =====================
  // Dimensions
  // =====================

  get viewLeft(): DimensionProp { return this._core.viewLeft }
  set viewLeft(v: number) {
    this._core.viewLeft = v
    this.setAttribute('left', String(v))
  }

  get viewTop(): DimensionProp { return this._core.viewTop }
  set viewTop(v: number) {
    this._core.viewTop = v
    this.setAttribute('top', String(v))
  }

  get viewWidth(): DimensionProp { return this._core.viewWidth }
  set viewWidth(v: number) {
    this._core.viewWidth = v
    this.setAttribute('width', String(v))
  }

  get viewHeight(): DimensionProp { return this._core.viewHeight }
  set viewHeight(v: number) {
    this._core.viewHeight = v
    this.setAttribute('height', String(v))
  }

  get viewRight(): DimensionProp { return this._core.viewRight }
  set viewRight(v: number) {
    this._core.viewRight = v
    this.setAttribute('right', String(v))
  }

  get viewBottom(): DimensionProp { return this._core.viewBottom }
  set viewBottom(v: number) {
    this._core.viewBottom = v
    this.setAttribute('bottom', String(v))
  }

  // =====================
  // Align
  // =====================

  get viewAlign(): Align { return this._core.viewAlign }
  set viewAlign(v: Align) {
    this._core.viewAlign = v
    this.setAttribute('align', v)
  }

  // =====================
  // Anchors
  // =====================

  get anchors(): Anchors { return this._core.anchors }
  set anchors(v: Anchors) {
    this._core.anchors = v
    if (v.toRight) this.setAttribute('anchors-right', 'true')
    if (v.toBottom) this.setAttribute('anchors-bottom', 'true')
    if (!v.toLeft) this.setAttribute('anchors-left', 'false')
    if (!v.toTop) this.setAttribute('anchors-top', 'false')
  }

  // =====================
  // Position
  // =====================

  get viewPosition(): UIPosition { return this._core.viewPosition }
  set viewPosition(v: UIPosition) {
    this._core.viewPosition = v
    this.setAttribute('position', v)
  }

  // =====================
  // Size
  // =====================

  get viewSize(): UISize { return this._core.viewSize }
  set viewSize(v: UISize) {
    this._core.viewSize = v
    this.setAttribute('size', v)
  }

  // =====================
  // Appearance
  // =====================

  get viewVisible(): boolean { return this._core.viewVisible }
  set viewVisible(v: boolean) {
    this._core.viewVisible = v
    if (v) this.removeAttribute('hidden')
    else this.setAttribute('hidden', '')
  }

  get viewDisabled(): boolean { return this._core.viewDisabled }
  set viewDisabled(v: boolean) {
    this._core.viewDisabled = v
    if (v) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
  }

  get viewOpacity(): number { return this._core.viewOpacity }
  set viewOpacity(v: number) {
    this._core.viewOpacity = v
    this.setAttribute('opacity', String(v))
  }

  // =====================
  // Hierarchy
  // =====================

  get uiParent(): UIView | null {
    const p = this._core.parent
    return p ? (p.el as UIView) : null
  }

  get uiChildren(): ReadonlyArray<UIViewCore> {
    return this._core.children
  }

  addUIChild(child: UIView): void {
    child._core.parent = this._core
  }

  removeUIChild(child: UIView): void {
    child._core.parent = null
  }

  // =====================
  // Destroy / cleanup
  // =====================

  destroy(): void {
    this._core.destroy()
  }

  get isDestroyed(): boolean { return this._core.isDestroyed }

  /** Register a DOM event listener with automatic cleanup on destroy */
  protected _on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    this._core.addListener(el, event, handler, options)
  }

  // =====================
  // Event emitter (framework-friendly)
  // =====================

  on(event: string, handler: Function): this {
    this._core.on(event, handler)
    return this
  }

  off(event: string, handler: Function): this {
    this._core.off(event, handler)
    return this
  }

  protected _emit(event: string, detail?: any): void {
    this._core.emit(event, detail)
  }

  // =====================
  // Theme sync
  // =====================

  protected _syncThemeClass(): void {
    this._core.syncThemeClass()
  }

  // =====================
  // Update
  // =====================

  update(): void {
    this._core.update()
  }
}
