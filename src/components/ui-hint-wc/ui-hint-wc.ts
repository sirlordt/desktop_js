import type { HintAlignment, HintTrigger, HintAnimation, UIHintOptions } from '../common/types'
import { parseSide, buildAlignment, calcPosition, fitsInViewport, FLIP_CASCADE, SECONDARY_MAP, type Pos } from '../common/positioning'

type HintEventName = 'show' | 'hide' | 'positionchange'
type HintEventHandler = () => void

/** Apply base hint styles inline — zero CSS leak */
function applyHintBaseStyles(el: HTMLDivElement): void {
  el.style.position = 'fixed'
  el.style.zIndex = '99999'
  el.style.maxWidth = '360px'
  el.style.pointerEvents = 'auto'
  el.style.background = 'var(--tooltip-bg-color)'
  el.style.color = 'var(--tooltip-fg-color)'
  el.style.borderColor = 'var(--tooltip-border-color)'
  el.style.fontFamily = 'var(--font-sans)'
  el.style.fontSize = 'var(--font-size-sm)'
  el.style.lineHeight = 'var(--line-height-normal)'
  el.style.boxShadow = '0 2px 8px var(--shadow-color)'
  el.style.display = 'none'
}

/** Apply win95 overrides inline */
function applyWin95Styles(el: HTMLDivElement): void {
  el.style.borderRadius = 'var(--tooltip-border-radius, 0px)'
  el.style.boxShadow = 'none'
  el.style.border = '1px solid var(--tooltip-border-color)'
}

function applyContentStyles(el: HTMLDivElement): void {
  el.style.padding = '6px 10px'
}

function applyArrowBaseStyles(el: HTMLDivElement): void {
  el.style.position = 'absolute'
  el.style.width = '0'
  el.style.height = '0'
}

export class UIHintWC extends HTMLElement {
  // --- Config ---
  private _alignment: HintAlignment = 'BottomCenter'
  private _margin: number = 2
  private _triggers: HintTrigger[] = ['hover']
  private _showDelay: number = 300
  private _hideDelay: number = 200
  private _animation: HintAnimation = 'fade'
  private _animationDuration: number = 150
  private _arrow: boolean = false
  private _arrowSize: number = 6
  private _borderRadius: number = 4
  private _borderColor: string = ''
  private _borderWidth: number = 1
  private _disabled: boolean = false
  private _name: string = ''
  private _marginMouseCursorX: number = 16
  private _marginMouseCursorY: number = 20

  // --- Content ---
  private _content: HTMLElement | string | null = null

  // --- State ---
  private _visible: boolean = false
  private _currentAlignment: HintAlignment = 'BottomCenter'
  private _destroyed: boolean = false
  private _autoDestroyTimer: ReturnType<typeof setTimeout> | null = null
  private _anchor: HTMLElement | null = null

  // --- DOM (popup in document.body) ---
  private _el!: HTMLDivElement
  private _arrowEl!: HTMLDivElement
  private _arrowFillEl!: HTMLDivElement
  private _contentEl!: HTMLDivElement

  // --- Timers ---
  private _showTimer: number = 0
  private _hideTimer: number = 0
  private _animTimer: number = 0

  // --- Mouse tracking ---
  private _lastMouseX: number = 0
  private _lastMouseY: number = 0

  // --- Event emitter ---
  private _listeners: Map<HintEventName, Set<HintEventHandler>> = new Map()

  // --- Cleanup registry ---
  private _cleanups: Array<() => void> = []

  // --- Theme observer ---
  private _themeObserver: MutationObserver | null = null

  // --- Lifecycle ---
  private _initialized: boolean = false

  constructor() {
    super()
  }

  /**
   * Configure the hint programmatically.
   * Must provide an anchor element (required).
   */
  configure(options: UIHintOptions): void {
    const o = options
    this._anchor = o.anchor
    this._alignment = o.alignment ?? this._alignment
    this._currentAlignment = this._alignment
    this._margin = o.margin ?? this._margin
    this._showDelay = o.showDelay ?? this._showDelay
    this._hideDelay = o.hideDelay ?? this._hideDelay
    this._animation = o.animation ?? this._animation
    this._animationDuration = o.animationDuration ?? this._animationDuration
    this._arrow = o.arrow ?? this._arrow
    this._arrowSize = o.arrowSize ?? this._arrowSize
    this._borderRadius = o.borderRadius ?? this._borderRadius
    this._borderWidth = o.borderWidth ?? this._borderWidth
    this._borderColor = o.borderColor ?? this._borderColor
    this._disabled = o.disabled ?? this._disabled
    this._marginMouseCursorX = o.marginMouseCursorX ?? this._marginMouseCursorX
    this._marginMouseCursorY = o.marginMouseCursorY ?? this._marginMouseCursorY

    if (o.name) this._name = o.name

    if (o.trigger) {
      this._triggers = Array.isArray(o.trigger) ? o.trigger : [o.trigger]
    }

    if (o.content !== undefined) {
      this._content = o.content
    }

    this._ensureInitialized()

    // Apply content if set
    if (this._content !== null) {
      this.content = this._content
    }

    this._applyStyles()
  }

  connectedCallback(): void {
    if (this._autoDestroyTimer !== null) { clearTimeout(this._autoDestroyTimer); this._autoDestroyTimer = null }
    // Host element is invisible — it's a controller, not a visual element
    this.style.display = 'none'
  }

  disconnectedCallback(): void {
    // Hints always auto-destroy since they are lightweight and not re-parented.
    // The deferred timeout still allows framework re-parenting (React).
    if (!this._destroyed) {
      this._autoDestroyTimer = setTimeout(() => { this._autoDestroyTimer = null; this.destroy() }, 0)
    }
  }

  // =====================
  // Event emitter
  // =====================

  on(event: HintEventName, handler: HintEventHandler): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(handler)
    return this
  }

  off(event: HintEventName, handler: HintEventHandler): this {
    this._listeners.get(event)?.delete(handler)
    return this
  }

  private _emit(event: HintEventName): void {
    // Vanilla JS listeners
    this._listeners.get(event)?.forEach(fn => fn())

    // CustomEvent for frameworks
    this.dispatchEvent(new CustomEvent(`hint-${event}`, {
      bubbles: true,
      composed: true,
    }))
  }

  // =====================
  // Public API
  // =====================

  get popupElement(): HTMLDivElement { return this._el }
  get visible(): boolean { return this._visible }
  get currentAlignment(): HintAlignment { return this._currentAlignment }

  get alignment(): HintAlignment { return this._alignment }
  set alignment(v: HintAlignment) { this._alignment = v; if (this._visible) this.reposition() }

  get margin(): number { return this._margin }
  set margin(v: number) { this._margin = v; if (this._visible) this.reposition() }

  get arrow(): boolean { return this._arrow }
  set arrow(v: boolean) { this._arrow = v; this._updateArrow(); if (this._visible) this.reposition() }

  get arrowSize(): number { return this._arrowSize }
  set arrowSize(v: number) { this._arrowSize = v; this._updateArrow(); if (this._visible) this.reposition() }

  get borderRadius(): number { return this._borderRadius }
  set borderRadius(v: number) { this._borderRadius = v; this._applyStyles() }

  get borderColor(): string { return this._borderColor }
  set borderColor(v: string) { this._borderColor = v; this._applyStyles() }

  get borderWidth(): number { return this._borderWidth }
  set borderWidth(v: number) { this._borderWidth = v; this._applyStyles() }

  get disabled(): boolean { return this._disabled }
  set disabled(v: boolean) {
    this._disabled = v
    if (this._el) {
      if (v) {
        this.hideImmediate()
      }
    }
  }

  get name(): string { return this._name }
  set name(v: string) { this._name = v; if (this._el) this._el.id = v }

  get content(): HTMLElement | string | null { return this._content }
  set content(v: HTMLElement | string | null) {
    this._content = v
    if (!this._contentEl) return
    this._contentEl.innerHTML = ''
    if (v === null) return
    if (typeof v === 'string') {
      this._contentEl.innerHTML = v
    } else {
      this._contentEl.appendChild(v)
    }
  }

  get showDelay(): number { return this._showDelay }
  set showDelay(v: number) { this._showDelay = v }

  get hideDelay(): number { return this._hideDelay }
  set hideDelay(v: number) { this._hideDelay = v }

  get animation(): HintAnimation { return this._animation }
  set animation(v: HintAnimation) { this._animation = v }

  get animationDuration(): number { return this._animationDuration }
  set animationDuration(v: number) { this._animationDuration = v }

  get anchor(): HTMLElement | null { return this._anchor }
  set anchor(v: HTMLElement | null) { this._anchor = v }

  get trigger(): HintTrigger[] { return this._triggers }
  set trigger(v: HintTrigger | HintTrigger[]) { this._triggers = Array.isArray(v) ? v : [v] }

  get marginMouseCursorX(): number { return this._marginMouseCursorX }
  set marginMouseCursorX(v: number) { this._marginMouseCursorX = v }

  get marginMouseCursorY(): number { return this._marginMouseCursorY }
  set marginMouseCursorY(v: number) { this._marginMouseCursorY = v }

  show(): void {
    if (this._disabled || this._destroyed) return
    this._clearTimers()
    if (this._showDelay > 0) {
      this._showTimer = window.setTimeout(() => this.showImmediate(), this._showDelay)
    } else {
      this.showImmediate()
    }
  }

  hide(): void {
    this._clearTimers()
    if (this._hideDelay > 0) {
      this._hideTimer = window.setTimeout(() => this.hideImmediate(), this._hideDelay)
    } else {
      this.hideImmediate()
    }
  }

  showImmediate(): void {
    if (this._disabled || this._destroyed || !this._el) return
    this._clearTimers()

    this._el.style.display = ''
    this._el.style.visibility = 'hidden'
    this._el.style.opacity = '0'

    this.reposition()

    this._el.style.visibility = ''

    if (this._animation === 'fade') {
      this._el.style.transition = `opacity ${this._animationDuration}ms ease`
      void this._el.offsetHeight
      this._el.style.opacity = '1'
    } else {
      this._el.style.transition = ''
      this._el.style.opacity = '1'
    }

    this._visible = true
    this._emit('show')
  }

  hideImmediate(): void {
    if (!this._el) return
    if (!this._visible && this._el.style.display === 'none') return
    this._clearTimers()

    if (this._animation === 'fade' && this._visible) {
      this._el.style.transition = `opacity ${this._animationDuration}ms ease`
      this._el.style.opacity = '0'
      this._animTimer = window.setTimeout(() => {
        this._el.style.display = 'none'
        this._el.style.transition = ''
      }, this._animationDuration)
    } else {
      this._el.style.display = 'none'
      this._el.style.opacity = '0'
      this._el.style.transition = ''
    }

    this._visible = false
    this._emit('hide')
  }

  toggle(): void {
    if (this._visible) this.hide()
    else this.show()
  }

  reposition(): void {
    if (this._destroyed || !this._el || !this._anchor) return

    const anchorRect = this._anchor.getBoundingClientRect()
    const hW = this._el.offsetWidth
    const hH = this._el.offsetHeight

    if (this._alignment === 'MouseCursor') {
      this._positionAtMouse(hW, hH)
      return
    }

    const { side, secondary } = parseSide(this._alignment)
    const effectiveMargin = this._margin + (this._arrow ? this._arrowSize : 0)

    let pos = calcPosition(anchorRect, hW, hH, side, secondary, effectiveMargin)
    if (fitsInViewport(pos.left, pos.top, hW, hH)) {
      this._applyPosition(pos, side)
      this._currentAlignment = this._alignment
      return
    }

    const secondaries = (side === 'Bottom' || side === 'Top')
      ? ['Left', 'Center', 'Right']
      : ['Top', 'Center', 'Bottom']

    for (const altSec of secondaries) {
      if (altSec === secondary) continue
      pos = calcPosition(anchorRect, hW, hH, side, altSec, effectiveMargin)
      if (fitsInViewport(pos.left, pos.top, hW, hH)) {
        this._applyPosition(pos, side)
        this._currentAlignment = buildAlignment(side, altSec)
        this._emit('positionchange')
        return
      }
    }

    const cascade = FLIP_CASCADE[side] ?? []
    for (const altSide of cascade) {
      const altSecondaries = (altSide === 'Bottom' || altSide === 'Top')
        ? ['Left', 'Center', 'Right']
        : ['Top', 'Center', 'Bottom']

      const mapped = SECONDARY_MAP[altSide]?.[secondary] ?? 'Center'
      const ordered = [mapped, ...altSecondaries.filter(s => s !== mapped)]

      for (const altSec of ordered) {
        pos = calcPosition(anchorRect, hW, hH, altSide, altSec, effectiveMargin)
        if (fitsInViewport(pos.left, pos.top, hW, hH)) {
          this._applyPosition(pos, altSide)
          this._currentAlignment = buildAlignment(altSide, altSec)
          this._emit('positionchange')
          return
        }
      }
    }

    pos = {
      left: anchorRect.left + anchorRect.width / 2 - hW / 2,
      top: anchorRect.top + anchorRect.height / 2 - hH / 2,
    }
    pos.left = Math.max(0, Math.min(pos.left, window.innerWidth - hW))
    pos.top = Math.max(0, Math.min(pos.top, window.innerHeight - hH))
    this._applyPosition(pos, 'Bottom')
    this._currentAlignment = this._alignment
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    this._clearTimers()
    this._themeObserver?.disconnect()

    for (const cleanup of this._cleanups) {
      cleanup()
    }
    this._cleanups.length = 0

    if (this._el && this._el.parentNode) {
      this._el.parentNode.removeChild(this._el)
    }

    this._listeners.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  // =====================
  // Internal — Initialization
  // =====================

  private _ensureInitialized(): void {
    if (this._initialized) return
    this._initialized = true

    this._buildPopupDOM()
    this._applyStyles()
    this._bindTriggers()

    this._themeObserver = new MutationObserver(() => this._applyThemeStyles())
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  // =====================
  // Internal — DOM
  // =====================

  private _buildPopupDOM(): void {
    this._el = document.createElement('div')
    applyHintBaseStyles(this._el)

    this._arrowEl = document.createElement('div')
    applyArrowBaseStyles(this._arrowEl)

    this._arrowFillEl = document.createElement('div')
    applyArrowBaseStyles(this._arrowFillEl)

    this._contentEl = document.createElement('div')
    applyContentStyles(this._contentEl)

    this._el.appendChild(this._arrowEl)
    this._el.appendChild(this._arrowFillEl)
    this._el.appendChild(this._contentEl)

    if (this._name) this._el.id = this._name

    document.body.appendChild(this._el)
  }

  private _applyThemeStyles(): void {
    if (!this._el) return
    const theme = document.documentElement.getAttribute('data-theme') || ''
    const isWin95 = theme.startsWith('win95')

    // Reset to base
    this._el.style.boxShadow = '0 2px 8px var(--shadow-color)'
    this._el.style.border = ''

    if (isWin95) {
      applyWin95Styles(this._el)
    }

    this._applyStyles()
  }

  private _applyStyles(): void {
    if (!this._el) return

    if (this._borderColor) {
      this._el.style.borderColor = this._borderColor
    } else {
      this._el.style.borderColor = 'var(--tooltip-border-color)'
    }
    this._el.style.borderRadius = `${this._borderRadius}px`
    this._el.style.borderWidth = `${this._borderWidth}px`
    this._el.style.borderStyle = this._borderWidth > 0 ? 'solid' : 'none'

    this._updateArrow()
  }

  private _updateArrow(): void {
    if (!this._arrowEl) return
    const d = this._arrow ? '' : 'none'
    this._arrowEl.style.display = d
    this._arrowFillEl.style.display = d
  }

  private _applyPosition(pos: Pos, side: string): void {
    this._el.style.left = `${Math.round(pos.left)}px`
    this._el.style.top = `${Math.round(pos.top)}px`

    this._positionArrow(side, pos)
  }

  private _positionArrow(side: string, hintPos: Pos): void {
    if (!this._arrow || !this._anchor) return

    const as = this._arrowSize
    const bw = this._borderWidth || 1

    for (const el of [this._arrowEl, this._arrowFillEl]) {
      const s = el.style
      s.left = ''; s.right = ''
      s.top = ''; s.bottom = ''
      s.borderLeft = ''; s.borderRight = ''
      s.borderTop = ''; s.borderBottom = ''
      s.width = '0'; s.height = '0'
      s.position = 'absolute'
    }

    const t = 'transparent'
    const computed = getComputedStyle(this._el)
    const bgColor = computed.backgroundColor || computed.getPropertyValue('--tooltip-bg-color')
    const borderColor = this._borderColor || computed.borderColor || computed.getPropertyValue('--tooltip-border-color')

    const outerS = `${as}px`
    const innerSize = as - bw
    const innerS = `${innerSize}px`

    const anchorRect = this._anchor.getBoundingClientRect()
    const hW = this._el.offsetWidth
    const hH = this._el.offsetHeight
    const minPad = as + this._borderRadius

    const outer = this._arrowEl.style
    const inner = this._arrowFillEl.style

    switch (side) {
      case 'Bottom':
      case 'Top': {
        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        let arrowLeft = anchorCenterX - hintPos.left - as
        arrowLeft = Math.max(minPad, Math.min(arrowLeft, hW - minPad - as))

        if (side === 'Bottom') {
          outer.borderLeft = `${outerS} solid ${t}`
          outer.borderRight = `${outerS} solid ${t}`
          outer.borderBottom = `${outerS} solid ${borderColor}`
          outer.top = `${-as}px`

          inner.borderLeft = `${innerS} solid ${t}`
          inner.borderRight = `${innerS} solid ${t}`
          inner.borderBottom = `${innerS} solid ${bgColor}`
          inner.top = `${-innerSize}px`
        } else {
          outer.borderLeft = `${outerS} solid ${t}`
          outer.borderRight = `${outerS} solid ${t}`
          outer.borderTop = `${outerS} solid ${borderColor}`
          outer.bottom = `${-as}px`

          inner.borderLeft = `${innerS} solid ${t}`
          inner.borderRight = `${innerS} solid ${t}`
          inner.borderTop = `${innerS} solid ${bgColor}`
          inner.bottom = `${-innerSize}px`
        }
        outer.left = `${Math.round(arrowLeft)}px`
        inner.left = `${Math.round(arrowLeft + bw)}px`
        break
      }
      case 'Right':
      case 'Left': {
        const anchorCenterY = anchorRect.top + anchorRect.height / 2
        let arrowTop = anchorCenterY - hintPos.top - as
        arrowTop = Math.max(minPad, Math.min(arrowTop, hH - minPad - as))

        if (side === 'Right') {
          outer.borderTop = `${outerS} solid ${t}`
          outer.borderBottom = `${outerS} solid ${t}`
          outer.borderRight = `${outerS} solid ${borderColor}`
          outer.left = `${-as}px`

          inner.borderTop = `${innerS} solid ${t}`
          inner.borderBottom = `${innerS} solid ${t}`
          inner.borderRight = `${innerS} solid ${bgColor}`
          inner.left = `${-innerSize}px`
        } else {
          outer.borderTop = `${outerS} solid ${t}`
          outer.borderBottom = `${outerS} solid ${t}`
          outer.borderLeft = `${outerS} solid ${borderColor}`
          outer.right = `${-as}px`

          inner.borderTop = `${innerS} solid ${t}`
          inner.borderBottom = `${innerS} solid ${t}`
          inner.borderLeft = `${innerS} solid ${bgColor}`
          inner.right = `${-innerSize}px`
        }
        outer.top = `${Math.round(arrowTop)}px`
        inner.top = `${Math.round(arrowTop + bw)}px`
        break
      }
    }
  }

  private _positionAtMouse(hW: number, hH: number): void {
    const mx = this._marginMouseCursorX
    const my = this._marginMouseCursorY
    let left = this._lastMouseX + mx
    let top = this._lastMouseY + my

    if (left + hW > window.innerWidth) left = this._lastMouseX - hW - 4
    if (top + hH > window.innerHeight) top = this._lastMouseY - hH - 4
    left = Math.max(0, Math.min(left, window.innerWidth - hW))
    top = Math.max(0, Math.min(top, window.innerHeight - hH))

    this._el.style.left = `${Math.round(left)}px`
    this._el.style.top = `${Math.round(top)}px`

    this._arrowEl.style.display = 'none'
    this._arrowFillEl.style.display = 'none'
  }

  private _clearTimers(): void {
    if (this._showTimer) { clearTimeout(this._showTimer); this._showTimer = 0 }
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = 0 }
    if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = 0 }
  }

  private _addEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | Document | Window,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this._cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  private _bindTriggers(): void {
    if (!this._anchor) return

    for (const trigger of this._triggers) {
      switch (trigger) {
        case 'hover':
          this._bindHover()
          break
        case 'click':
          this._bindClick()
          break
        case 'programmatic':
          break
      }
    }

    // Hide on any scroll
    this._addEvent(document as unknown as HTMLElement, 'scroll', () => {
      if (this._visible) this.hideImmediate()
    }, { capture: true, passive: true } as AddEventListenerOptions)

    // Track mouse for MouseCursor mode
    if (this._alignment === 'MouseCursor') {
      this._addEvent(this._anchor, 'mousemove', (e: MouseEvent) => {
        this._lastMouseX = e.clientX
        this._lastMouseY = e.clientY
        if (this._visible) this.reposition()
      })
    }
  }

  private _bindHover(): void {
    if (!this._anchor) return
    this._addEvent(this._anchor, 'mouseenter', (e: MouseEvent) => {
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      this._clearTimers()
      this.show()
    })
    this._addEvent(this._anchor, 'mouseleave', () => {
      this.hide()
    })

    this._addEvent(this._el, 'mouseenter', () => {
      this._clearTimers()
    })
    this._addEvent(this._el, 'mouseleave', () => {
      this.hide()
    })
  }

  private _bindClick(): void {
    if (!this._anchor) return
    this._addEvent(this._anchor, 'click', (e: MouseEvent) => {
      e.stopPropagation()
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      this.toggle()
    })

    this._addEvent(document, 'click', (e: MouseEvent) => {
      if (!this._visible) return
      const target = e.target as Node
      if (this._el.contains(target) || this._anchor!.contains(target)) return
      this.hideImmediate()
    })
  }
}

customElements.define('hint-wc', UIHintWC)
