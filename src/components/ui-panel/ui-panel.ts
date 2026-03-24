import { UIViewCore } from '../common/ui-view-core'
import type { Align, Anchors, UISize, UIPosition } from '../common/types'

export interface UIPanelOptions {
  parent?: UIPanel
  name?: string
  left?: number
  top?: number
  width?: number
  height?: number
  right?: number
  bottom?: number
  align?: Align
  anchors?: Anchors
  position?: UIPosition
  size?: UISize
  visible?: boolean
  disabled?: boolean
  opacity?: number
  bg?: string
  borderColor?: string
  borderWidth?: number
  className?: string
}

/**
 * UIPanel — lightweight layout container using UIViewCore.
 * Creates a plain <div>, no Shadow DOM, no custom element.
 * Ideal for building docking layouts (top/bottom/left/right/client/center).
 */
export class UIPanel {
  readonly core: UIViewCore
  private _bg: string = ''
  private _borderColor: string = ''
  private _borderWidth: number = 1

  constructor(options?: UIPanelOptions) {
    const el = document.createElement('div')
    this.core = new UIViewCore(el)

    if (options) {
      const o = options

      if (o.className) el.classList.add(...o.className.split(/\s+/))
      if (o.name !== undefined) this.core.viewName = o.name
      if (o.left !== undefined) this.core.viewLeft = o.left
      if (o.top !== undefined) this.core.viewTop = o.top
      if (o.width !== undefined) this.core.viewWidth = o.width
      if (o.height !== undefined) this.core.viewHeight = o.height
      if (o.right !== undefined) this.core.viewRight = o.right
      if (o.bottom !== undefined) this.core.viewBottom = o.bottom
      if (o.align !== undefined) this.core.viewAlign = o.align
      if (o.anchors !== undefined) this.core.anchors = o.anchors
      if (o.position !== undefined) this.core.viewPosition = o.position
      if (o.size !== undefined) this.core.viewSize = o.size
      if (o.visible !== undefined) this.core.viewVisible = o.visible
      if (o.disabled !== undefined) this.core.viewDisabled = o.disabled
      if (o.opacity !== undefined) this.core.viewOpacity = o.opacity
      if (o.bg !== undefined) this.backgroundColor = o.bg
      if (o.borderColor !== undefined) this.borderColor = o.borderColor
      if (o.borderWidth !== undefined) this.borderWidth = o.borderWidth

      if (o.parent) this.parent = o.parent
    }
  }

  // ── Element access ──

  get element(): HTMLDivElement { return this.core.el as HTMLDivElement }

  // ── Styling ──

  get backgroundColor(): string { return this._bg }
  set backgroundColor(v: string) {
    this._bg = v
    this.core.el.style.backgroundColor = v
  }

  get borderColor(): string { return this._borderColor }
  set borderColor(v: string) {
    this._borderColor = v
    this._applyBorder()
  }

  get borderWidth(): number { return this._borderWidth }
  set borderWidth(v: number) {
    this._borderWidth = v
    this._applyBorder()
  }

  private _applyBorder(): void {
    if (this._borderColor) {
      this.core.el.style.border = `${this._borderWidth}px solid ${this._borderColor}`
    } else {
      this.core.el.style.border = ''
    }
  }

  // ── Layout proxies ──

  get name(): string { return this.core.viewName }
  set name(v: string) { this.core.viewName = v }

  get left(): number { return this.core.viewLeft.value }
  set left(v: number) { this.core.viewLeft = v }

  get top(): number { return this.core.viewTop.value }
  set top(v: number) { this.core.viewTop = v }

  get width(): number { return this.core.viewWidth.value }
  set width(v: number) { this.core.viewWidth = v }

  get height(): number { return this.core.viewHeight.value }
  set height(v: number) { this.core.viewHeight = v }

  get right(): number { return this.core.viewRight.value }
  set right(v: number) { this.core.viewRight = v }

  get bottom(): number { return this.core.viewBottom.value }
  set bottom(v: number) { this.core.viewBottom = v }

  get align(): Align { return this.core.viewAlign }
  set align(v: Align) { this.core.viewAlign = v }

  get anchors(): Anchors { return this.core.anchors }
  set anchors(v: Anchors) { this.core.anchors = v }

  get position(): UIPosition { return this.core.viewPosition }
  set position(v: UIPosition) { this.core.viewPosition = v }

  get size(): UISize { return this.core.viewSize }
  set size(v: UISize) { this.core.viewSize = v }

  get visible(): boolean { return this.core.viewVisible }
  set visible(v: boolean) { this.core.viewVisible = v }

  get disabled(): boolean { return this.core.viewDisabled }
  set disabled(v: boolean) { this.core.viewDisabled = v }

  get opacity(): number { return this.core.viewOpacity }
  set opacity(v: number) { this.core.viewOpacity = v }

  // ── Hierarchy ──

  get parent(): UIPanel | null {
    const p = this.core.parent
    return p ? (p as any)._panel ?? null : null
  }
  set parent(v: UIPanel | null) {
    if (v) {
      this.core.parent = v.core
      v.element.appendChild(this.element)
    } else {
      if (this.element.parentNode) this.element.parentNode.removeChild(this.element)
      this.core.parent = null
    }
  }

  get children(): ReadonlyArray<UIViewCore> { return this.core.children }

  // ── Lifecycle ──

  /** Render the layout tree. Call on root after building the hierarchy. */
  render(): HTMLElement {
    // Store back-reference for parent lookup
    ;(this.core as any)._panel = this
    this.core.connect()
    this.core.applyLayout()
    return this.element
  }

  /** Update layout (call after resizing root or changing properties) */
  update(): void {
    this.core.applyLayout()
  }

  destroy(): void {
    this.core.destroy()
  }

  get isDestroyed(): boolean { return this.core.isDestroyed }

  // ── Events ──

  on(event: string, handler: Function): this {
    this.core.on(event, handler)
    return this
  }

  off(event: string, handler: Function): this {
    this.core.off(event, handler)
    return this
  }
}
