import type { HintAlignment, HintTrigger, HintAnimation, UIHintOptions } from '../common/types'
import styles from './ui-hint.css?raw'

type HintEventName = 'show' | 'hide' | 'positionchange'
type HintEventHandler = () => void

// Opposite side mapping for auto-flip
const OPPOSITE_SIDE: Record<string, string> = {
  Bottom: 'Top', Top: 'Bottom', Right: 'Left', Left: 'Right',
}

// Cascade order: opposite → perpendicular1 → perpendicular2
const FLIP_CASCADE: Record<string, string[]> = {
  Bottom: ['Top', 'Right', 'Left'],
  Top: ['Bottom', 'Right', 'Left'],
  Right: ['Left', 'Bottom', 'Top'],
  Left: ['Right', 'Bottom', 'Top'],
}

// Map secondary alignment to a valid one for the target side
const SECONDARY_MAP: Record<string, Record<string, string>> = {
  Bottom: { Left: 'Left', Center: 'Center', Right: 'Right', Top: 'Left', Bottom: 'Left' },
  Top: { Left: 'Left', Center: 'Center', Right: 'Right', Top: 'Left', Bottom: 'Left' },
  Right: { Top: 'Top', Center: 'Center', Bottom: 'Bottom', Left: 'Top', Right: 'Top' },
  Left: { Top: 'Top', Center: 'Center', Bottom: 'Bottom', Left: 'Top', Right: 'Top' },
}

function parseSide(alignment: HintAlignment): { side: string; secondary: string } {
  if (alignment === 'MouseCursor') return { side: 'MouseCursor', secondary: '' }
  for (const side of ['Bottom', 'Top', 'Right', 'Left']) {
    if (alignment.startsWith(side)) {
      return { side, secondary: alignment.slice(side.length) }
    }
  }
  return { side: 'Bottom', secondary: 'Center' }
}

function buildAlignment(side: string, secondary: string): HintAlignment {
  return `${side}${secondary}` as HintAlignment
}

interface Pos { left: number; top: number }

function calcPosition(
  anchorRect: DOMRect, hW: number, hH: number,
  side: string, secondary: string, margin: number,
): Pos {
  const a = anchorRect
  let left = 0
  let top = 0

  switch (side) {
    case 'Bottom':
      top = a.bottom + margin
      if (secondary === 'Left') left = a.left
      else if (secondary === 'Center') left = a.left + a.width / 2 - hW / 2
      else left = a.right - hW
      break
    case 'Top':
      top = a.top - hH - margin
      if (secondary === 'Left') left = a.left
      else if (secondary === 'Center') left = a.left + a.width / 2 - hW / 2
      else left = a.right - hW
      break
    case 'Right':
      left = a.right + margin
      if (secondary === 'Top') top = a.top
      else if (secondary === 'Center') top = a.top + a.height / 2 - hH / 2
      else top = a.bottom - hH
      break
    case 'Left':
      left = a.left - hW - margin
      if (secondary === 'Top') top = a.top
      else if (secondary === 'Center') top = a.top + a.height / 2 - hH / 2
      else top = a.bottom - hH
      break
  }

  return { left, top }
}

function fitsInViewport(left: number, top: number, w: number, h: number): boolean {
  return left >= 0 && top >= 0
    && left + w <= window.innerWidth
    && top + h <= window.innerHeight
}

// Inject styles once
let stylesInjected = false
function injectStyles() {
  if (stylesInjected) return
  stylesInjected = true
  const sheet = document.createElement('style')
  sheet.textContent = styles
  document.head.appendChild(sheet)
}

export class UIHint {
  // --- Config ---
  private _alignment: HintAlignment
  private _margin: number
  private _triggers: HintTrigger[]
  private _showDelay: number
  private _hideDelay: number
  private _animation: HintAnimation
  private _animationDuration: number
  private _arrow: boolean
  private _arrowSize: number
  private _borderRadius: number
  private _borderColor: string
  private _borderWidth: number
  private _disabled: boolean = false
  private _name: string = ''
  private _marginMouseCursorX: number
  private _marginMouseCursorY: number

  // --- Content ---
  private _content: HTMLElement | string | null = null

  // --- State ---
  private _visible: boolean = false
  private _currentAlignment: HintAlignment
  private _destroyed: boolean = false
  private _anchor: HTMLElement

  // --- DOM ---
  private _el: HTMLDivElement
  private _arrowEl: HTMLDivElement
  private _arrowFillEl: HTMLDivElement
  private _contentEl: HTMLDivElement

  // --- Timers ---
  private _showTimer: number = 0
  private _hideTimer: number = 0
  private _animTimer: number = 0

  // --- Mouse tracking (for MouseCursor) ---
  private _lastMouseX: number = 0
  private _lastMouseY: number = 0

  // --- Event emitter ---
  private _listeners: Map<HintEventName, Set<HintEventHandler>> = new Map()

  // --- Cleanup registry ---
  private _cleanups: Array<() => void> = []

  // --- Theme observer ---
  private _themeObserver: MutationObserver | null = null

  constructor(options: UIHintOptions) {
    injectStyles()

    const o = options
    this._anchor = o.anchor
    this._alignment = o.alignment ?? 'BottomCenter'
    this._currentAlignment = this._alignment
    this._margin = o.margin ?? 2
    this._showDelay = o.showDelay ?? 300
    this._hideDelay = o.hideDelay ?? 200
    this._animation = o.animation ?? 'fade'
    this._animationDuration = o.animationDuration ?? 150
    this._arrow = o.arrow ?? false
    this._arrowSize = o.arrowSize ?? 6
    this._borderRadius = o.borderRadius ?? 4
    this._borderWidth = o.borderWidth ?? 1
    this._borderColor = o.borderColor ?? ''
    this._disabled = o.disabled ?? false
    this._marginMouseCursorX = o.marginMouseCursorX ?? 16
    this._marginMouseCursorY = o.marginMouseCursorY ?? 20

    // Parse triggers
    if (o.trigger) {
      this._triggers = Array.isArray(o.trigger) ? o.trigger : [o.trigger]
    } else {
      this._triggers = ['hover']
    }

    // Build DOM
    this._el = document.createElement('div')
    this._el.className = 'ui-hint'
    this._el.style.position = 'fixed'
    this._el.style.zIndex = '99999'
    this._el.style.display = 'none'

    this._arrowEl = document.createElement('div')
    this._arrowEl.className = 'ui-hint__arrow'

    this._arrowFillEl = document.createElement('div')
    this._arrowFillEl.className = 'ui-hint__arrow-fill'

    this._contentEl = document.createElement('div')
    this._contentEl.className = 'ui-hint__content'

    this._el.appendChild(this._arrowEl)
    this._el.appendChild(this._arrowFillEl)
    this._el.appendChild(this._contentEl)

    // Apply name/id
    if (o.name) {
      this._name = o.name
      this._el.id = o.name
    }

    this._applyClasses()
    this._applyStyles()

    // Set content
    if (o.content !== undefined) {
      this.content = o.content
    }

    // Append to body
    document.body.appendChild(this._el)

    // Bind triggers
    this._bindTriggers()

    // Watch theme changes
    this._themeObserver = new MutationObserver(() => this._applyClasses())
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
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
    this._listeners.get(event)?.forEach(fn => fn())
  }

  // =====================
  // Public API
  // =====================

  get element(): HTMLDivElement { return this._el }
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
    if (v) {
      this._el.classList.add('disabled')
      this.hideImmediate()
    } else {
      this._el.classList.remove('disabled')
    }
  }

  get name(): string { return this._name }
  set name(v: string) { this._name = v; this._el.id = v }

  get content(): HTMLElement | string | null { return this._content }
  set content(v: HTMLElement | string | null) {
    this._content = v
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
  set animation(v: HintAnimation) {
    this._animation = v
    this._el.setAttribute('data-animation', v)
  }

  get animationDuration(): number { return this._animationDuration }
  set animationDuration(v: number) {
    this._animationDuration = v
    this._el.style.setProperty('--ui-hint-duration', `${v}ms`)
  }

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
    if (this._disabled || this._destroyed) return
    this._clearTimers()

    // Show hidden to measure
    this._el.style.display = ''
    this._el.style.visibility = 'hidden'
    this._el.style.opacity = '0'

    this.reposition()

    this._el.style.visibility = ''

    if (this._animation === 'fade') {
      this._el.style.transition = `opacity ${this._animationDuration}ms ease`
      void this._el.offsetHeight // force reflow
      this._el.style.opacity = '1'
    } else {
      this._el.style.transition = ''
      this._el.style.opacity = '1'
    }

    this._visible = true
    this._emit('show')
  }

  hideImmediate(): void {
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
    if (this._destroyed) return

    const anchorRect = this._anchor.getBoundingClientRect()
    const hW = this._el.offsetWidth
    const hH = this._el.offsetHeight

    if (this._alignment === 'MouseCursor') {
      this._positionAtMouse(hW, hH)
      return
    }

    const { side, secondary } = parseSide(this._alignment)
    const effectiveMargin = this._margin + (this._arrow ? this._arrowSize : 0)

    // Try requested alignment first
    let pos = calcPosition(anchorRect, hW, hH, side, secondary, effectiveMargin)
    if (fitsInViewport(pos.left, pos.top, hW, hH)) {
      this._applyPosition(pos, side)
      this._currentAlignment = this._alignment
      return
    }

    // Try other secondary alignments on the SAME side
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

    // Flip to other sides
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

    // Last resort: center over anchor, clamp to viewport
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

    if (this._el.parentNode) {
      this._el.parentNode.removeChild(this._el)
    }

    this._listeners.clear()
  }

  get isDestroyed(): boolean { return this._destroyed }

  // =====================
  // Internal
  // =====================

  private _applyClasses(): void {
    const theme = document.documentElement.getAttribute('data-theme') || ''
    const isWin95 = theme.startsWith('win95')
    const cls = ['ui-hint']
    if (isWin95) cls.push('win95')
    if (this._disabled) cls.push('disabled')
    this._el.className = cls.join(' ')
    this._el.setAttribute('data-animation', this._animation)
  }

  private _applyStyles(): void {
    this._el.style.setProperty('--ui-hint-duration', `${this._animationDuration}ms`)

    if (this._borderColor) {
      this._el.style.borderColor = this._borderColor
    } else {
      this._el.style.borderColor = ''
    }
    this._el.style.borderRadius = `${this._borderRadius}px`
    this._el.style.borderWidth = `${this._borderWidth}px`
    this._el.style.borderStyle = this._borderWidth > 0 ? 'solid' : 'none'

    this._updateArrow()
  }

  private _updateArrow(): void {
    const d = this._arrow ? '' : 'none'
    this._arrowEl.style.display = d
    this._arrowFillEl.style.display = d
  }

  private _applyPosition(pos: Pos, side: string): void {
    this._el.style.left = `${Math.round(pos.left)}px`
    this._el.style.top = `${Math.round(pos.top)}px`

    const arrowSide = OPPOSITE_SIDE[side] ?? 'top'
    this._el.setAttribute('data-side', side.toLowerCase())
    this._arrowEl.setAttribute('data-side', arrowSide.toLowerCase())

    this._positionArrow(side, pos)
  }

  private _positionArrow(side: string, hintPos: Pos): void {
    if (!this._arrow) return

    const as = this._arrowSize
    const bw = this._borderWidth || 1

    // Reset both arrow elements
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

    // Outer triangle (border) is arrowSize, inner (fill) is arrowSize - borderWidth
    const outerS = `${as}px`
    const innerSize = as - bw
    const innerS = `${innerSize}px`

    // Calculate arrow offset to point at anchor center
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
          // Arrow points UP from top edge
          outer.borderLeft = `${outerS} solid ${t}`
          outer.borderRight = `${outerS} solid ${t}`
          outer.borderBottom = `${outerS} solid ${borderColor}`
          outer.top = `${-as}px`

          inner.borderLeft = `${innerS} solid ${t}`
          inner.borderRight = `${innerS} solid ${t}`
          inner.borderBottom = `${innerS} solid ${bgColor}`
          inner.top = `${-innerSize}px`
        } else {
          // Arrow points DOWN from bottom edge
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
          // Arrow points LEFT from left edge
          outer.borderTop = `${outerS} solid ${t}`
          outer.borderBottom = `${outerS} solid ${t}`
          outer.borderRight = `${outerS} solid ${borderColor}`
          outer.left = `${-as}px`

          inner.borderTop = `${innerS} solid ${t}`
          inner.borderBottom = `${innerS} solid ${t}`
          inner.borderRight = `${innerS} solid ${bgColor}`
          inner.left = `${-innerSize}px`
        } else {
          // Arrow points RIGHT from right edge
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
    this._el.setAttribute('data-side', 'bottom')

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
    this._addEvent(this._anchor, 'mouseenter', (e: MouseEvent) => {
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      this._clearTimers()
      this.show()
    })
    this._addEvent(this._anchor, 'mouseleave', () => {
      this.hide()
    })

    // Keep hint visible while hovering it
    this._addEvent(this._el, 'mouseenter', () => {
      this._clearTimers()
    })
    this._addEvent(this._el, 'mouseleave', () => {
      this.hide()
    })
  }

  private _bindClick(): void {
    this._addEvent(this._anchor, 'click', (e: MouseEvent) => {
      e.stopPropagation()
      this._lastMouseX = e.clientX
      this._lastMouseY = e.clientY
      this.toggle()
    })

    // Click outside to close
    this._addEvent(document, 'click', (e: MouseEvent) => {
      if (!this._visible) return
      const target = e.target as Node
      if (this._el.contains(target) || this._anchor.contains(target)) return
      this.hideImmediate()
    })
  }
}
