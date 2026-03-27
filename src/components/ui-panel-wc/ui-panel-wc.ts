import { UIView } from '../common/ui-view'
import { applySimulateFocus } from '../common/simulate-focus-core'
import type { Align, Anchors, UISize, UIPosition } from '../common/types'

export interface PanelWCOptions {
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
}

const PANEL_ATTRS = [
  'name', 'left', 'top', 'width', 'height', 'right', 'bottom',
  'align', 'position', 'size', 'visible', 'disabled', 'opacity',
  'anchors-left', 'anchors-top', 'anchors-right', 'anchors-bottom',
  'bg', 'border-color', 'border-width',
] as const

/**
 * <panel-wc> — Web Component layout container powered by UIView.
 *
 * Uses light DOM (no Shadow DOM) so child <panel-wc> elements inherit
 * the same positioning context. Children are laid out via the UIView
 * align/anchor system.
 *
 * Zero CSS — all styling is inline via UIView.
 */
export class PanelWC extends HTMLElement {
  readonly core: UIView

  private _bg: string = ''
  private _borderColor: string = ''
  private _borderWidth: number = 0
  private _initialized: boolean = false
  private _configured: boolean = false

  static get observedAttributes() {
    return [...PANEL_ATTRS]
  }

  constructor() {
    super()
    this.core = new UIView(this)
  }

  /**
   * Configure programmatically. Can be called before or after connecting.
   */
  configure(options?: PanelWCOptions): void {
    if (!options) return
    const o = options

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

    this._configured = true

    if (this._initialized) {
      this.core.applyLayout()
    }
  }

  connectedCallback(): void {
    // Register with parent PanelWC if nested (every time, not just first)
    this._registerWithParent()

    if (this._initialized) {
      // Re-connecting — just re-apply layout
      this.core.connect()
      return
    }
    this._initialized = true

    // If not configured programmatically, read from attributes
    if (!this._configured) {
      this._readAttributes()
    }

    this.core.connect()
    if (this.core.viewVisible) this.style.display = 'block'
  }

  disconnectedCallback(): void {
    this.core.disconnect()
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    // Map panel-specific attrs
    switch (name) {
      case 'bg':
        this.backgroundColor = val ?? ''
        return
      case 'border-color':
        this.borderColor = val ?? ''
        return
      case 'border-width':
        this.borderWidth = val !== null ? parseFloat(val) : 0
        return
    }

    // Delegate layout attrs to UIView
    this.core.applyAttribute(name, val)

    if (this._initialized && this.isConnected) {
      this.core.applyLayout()
    }
  }

  // =====================
  // Public API — Styling
  // =====================

  get backgroundColor(): string { return this._bg }
  set backgroundColor(v: string) {
    this._bg = v
    this.style.backgroundColor = v
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
      this.style.border = `${this._borderWidth}px solid ${this._borderColor}`
    } else {
      this.style.border = ''
    }
  }

  // =====================
  // Public API — Layout proxies
  // =====================

  get panelName(): string { return this.core.viewName }
  set panelName(v: string) { this.core.viewName = v }

  get left(): number { return this.core.viewLeft.value }
  set left(v: number) { this.core.viewLeft = v }

  get top(): number { return this.core.viewTop.value }
  set top(v: number) { this.core.viewTop = v }

  get panelWidth(): number { return this.core.viewWidth.value }
  set panelWidth(v: number) { this.core.viewWidth = v }

  get panelHeight(): number { return this.core.viewHeight.value }
  set panelHeight(v: number) { this.core.viewHeight = v }

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

  get panelVisible(): boolean { return this.core.viewVisible }
  set panelVisible(v: boolean) { this.core.viewVisible = v }

  get panelDisabled(): boolean { return this.core.viewDisabled }
  set panelDisabled(v: boolean) { this.core.viewDisabled = v }

  get panelOpacity(): number { return this.core.viewOpacity }
  set panelOpacity(v: number) { this.core.viewOpacity = v }

  // =====================
  // Hierarchy
  // =====================

  get parentPanel(): PanelWC | null {
    const p = this.parentElement
    if (p instanceof PanelWC) return p
    return null
  }

  get childPanels(): PanelWC[] {
    return Array.from(this.children).filter((c): c is PanelWC => c instanceof PanelWC)
  }

  // =====================
  // Lifecycle
  // =====================

  /** Update layout (call after resizing or changing properties) */
  update(): void {
    this.core.applyLayout()
    // Custom elements default to display:inline — UIView sets '' which falls back to inline.
    // Force block so width/height work.
    if (this.core.viewVisible && this.style.display !== 'none') {
      this.style.display = 'block'
    }
  }

  destroy(): void {
    this.core.destroy()
  }

  get isDestroyed(): boolean { return this.core.isDestroyed }

  // =====================
  // Events
  // =====================

  on(event: string, handler: Function): this {
    this.core.on(event, handler)
    return this
  }

  off(event: string, handler: Function): this {
    this.core.off(event, handler)
    return this
  }

  private _simulateFocus = false
  get simulateFocus(): boolean { return this._simulateFocus }
  set simulateFocus(v: boolean) {
    this._simulateFocus = v
    applySimulateFocus(this, v)
  }

  // =====================
  // Internal
  // =====================

  private _readAttributes(): void {
    for (const name of PANEL_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) {
        this.attributeChangedCallback(name, null, val)
      }
    }
  }

  /**
   * Auto-register with parent PanelWC's UIView hierarchy.
   * This enables the UIView align/anchor layout system to work
   * via DOM nesting instead of manual `parent = ...` assignment.
   */
  private _registerWithParent(): void {
    const parent = this.parentElement
    if (parent instanceof PanelWC) {
      this.core.parent = parent.core
    }
  }
}

customElements.define('panel-wc', PanelWC)
