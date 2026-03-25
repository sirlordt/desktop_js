import './ui-tool-button.css'

export type ToolButtonIcon =
  | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'
  | 'chevron-up' | 'chevron-down' | 'chevron-left' | 'chevron-right'
  | 'close' | 'plus' | 'minus'
  | 'dots-h' | 'dots-v'
  | 'window-minimize' | 'window-maximize' | 'window-restore'

export interface UIToolButtonOptions {
  icon?: ToolButtonIcon
  content?: HTMLElement | string
  size?: number
  repeat?: boolean
  repeatDelay?: number
  repeatInterval?: number
  disabled?: boolean
  className?: string
}

export class UIToolButton {
  private _icon: ToolButtonIcon | null
  private _content: HTMLElement | string | null
  private _size: number
  private _disabled: boolean
  private _repeat: boolean
  private _repeatDelay: number
  private _repeatInterval: number
  private _destroyed: boolean = false

  private _el: HTMLDivElement
  private _iconEl: HTMLDivElement

  private _clickHandlers: Set<() => void> = new Set()
  private _cleanups: Array<() => void> = []

  // Repeat state
  private _repeatTimer: number = 0
  private _repeatIntervalTimer: number = 0

  constructor(options: UIToolButtonOptions) {
    const o = options
    this._icon = o.icon ?? null
    this._content = o.content ?? null
    this._size = o.size ?? 20
    this._disabled = o.disabled ?? false
    this._repeat = o.repeat ?? false
    this._repeatDelay = o.repeatDelay ?? 400
    this._repeatInterval = o.repeatInterval ?? 50

    this._el = document.createElement('div')
    this._el.className = 'ui-toolbtn'
    if (o.className) this._el.classList.add(...o.className.split(/\s+/))

    this._iconEl = document.createElement('div')
    this._iconEl.className = 'ui-toolbtn__icon'
    this._el.appendChild(this._iconEl)

    this._el.tabIndex = 0
    this._applySize()
    this._renderIcon()

    if (this._disabled) this._el.classList.add('disabled')

    this._bindEvents()
  }

  // ── Public API ──

  get element(): HTMLDivElement { return this._el }
  get iconElement(): HTMLDivElement { return this._iconEl }

  get icon(): ToolButtonIcon | null { return this._icon }
  set icon(v: ToolButtonIcon | null) {
    this._icon = v
    this._content = null
    this._renderIcon()
  }

  get content(): HTMLElement | string | null { return this._content }
  set content(v: HTMLElement | string | null) {
    this._content = v
    if (v !== null) this._icon = null
    this._renderIcon()
  }

  get size(): number { return this._size }
  set size(v: number) {
    this._size = v
    this._applySize()
    this._renderIcon()
  }

  get disabled(): boolean { return this._disabled }
  set disabled(v: boolean) {
    this._disabled = v
    this._el.classList.toggle('disabled', v)
  }

  onClick(handler: () => void): () => void {
    this._clickHandlers.add(handler)
    return () => { this._clickHandlers.delete(handler) }
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._stopRepeat()
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    this._clickHandlers.clear()
    if (this._el.parentNode) this._el.parentNode.removeChild(this._el)
  }

  get isDestroyed(): boolean { return this._destroyed }

  // ── Internal ──

  private _applySize(): void {
    this._el.style.width = `${this._size}px`
    this._el.style.height = `${this._size}px`
  }

  private _renderIcon(): void {
    this._iconEl.innerHTML = ''

    if (this._content !== null) {
      if (typeof this._content === 'string') {
        this._iconEl.innerHTML = this._content
      } else {
        this._iconEl.appendChild(this._content)
      }
      return
    }

    if (this._icon) {
      const el = this._buildBuiltinIcon(this._icon)
      if (el) this._iconEl.appendChild(el as Node)
    }
  }

  private _buildBuiltinIcon(icon: ToolButtonIcon): Element | null {
    // Arrow icons use CSS triangle technique
    const arrowMatch = icon.match(/^arrow-(up|down|left|right)$/)
    if (arrowMatch) {
      return this._buildTriangle(arrowMatch[1] as 'up' | 'down' | 'left' | 'right')
    }

    // Chevron icons use SVG
    const chevronMatch = icon.match(/^chevron-(up|down|left|right)$/)
    if (chevronMatch) {
      return this._buildChevron(chevronMatch[1] as 'up' | 'down' | 'left' | 'right')
    }

    // Other icons use SVG
    switch (icon) {
      case 'close': return this._buildSvgIcon('M3,3 L13,13 M13,3 L3,13')
      case 'plus': return this._buildSvgIcon('M8,3 L8,13 M3,8 L13,8')
      case 'minus': return this._buildSvgIcon('M3,8 L13,8')
      case 'dots-h': return this._buildDots('horizontal')
      case 'dots-v': return this._buildDots('vertical')
      case 'window-minimize': return this._buildSvgIcon('M4,12 L12,12')
      case 'window-maximize': return this._buildWindowMaximize()
      case 'window-restore': return this._buildWindowRestore()
      default: return null
    }
  }

  private _buildTriangle(direction: 'up' | 'down' | 'left' | 'right'): HTMLDivElement {
    const el = document.createElement('div')
    const px = Math.max(2, Math.round(this._size * 0.25))
    const s = `${px}px`
    const t = 'transparent'

    el.style.width = '0'
    el.style.height = '0'

    switch (direction) {
      case 'up':
        el.style.borderLeft = `${s} solid ${t}`
        el.style.borderRight = `${s} solid ${t}`
        el.style.borderBottom = `${s} solid currentColor`
        break
      case 'down':
        el.style.borderLeft = `${s} solid ${t}`
        el.style.borderRight = `${s} solid ${t}`
        el.style.borderTop = `${s} solid currentColor`
        break
      case 'left':
        el.style.borderTop = `${s} solid ${t}`
        el.style.borderBottom = `${s} solid ${t}`
        el.style.borderRight = `${s} solid currentColor`
        break
      case 'right':
        el.style.borderTop = `${s} solid ${t}`
        el.style.borderBottom = `${s} solid ${t}`
        el.style.borderLeft = `${s} solid currentColor`
        break
    }

    return el
  }

  private _buildChevron(direction: 'up' | 'down' | 'left' | 'right'): SVGSVGElement {
    const paths: Record<string, string> = {
      up: 'M3,10 L8,5 L13,10',
      down: 'M3,6 L8,11 L13,6',
      left: 'M10,3 L5,8 L10,13',
      right: 'M6,3 L11,8 L6,13',
    }
    return this._createSvg(paths[direction])
  }

  private _buildSvgIcon(pathData: string): SVGSVGElement {
    return this._createSvg(pathData)
  }

  private _buildWindowMaximize(): SVGSVGElement {
    const iconSize = Math.round(this._size * 0.6)
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', `${iconSize}`)
    svg.setAttribute('height', `${iconSize}`)
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '1.5')
    const rect = document.createElementNS(ns, 'rect')
    rect.setAttribute('x', '3'); rect.setAttribute('y', '3')
    rect.setAttribute('width', '10'); rect.setAttribute('height', '10')
    rect.setAttribute('rx', '1')
    svg.appendChild(rect)
    return svg
  }

  private _buildWindowRestore(): SVGSVGElement {
    const iconSize = Math.round(this._size * 0.6)
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', `${iconSize}`)
    svg.setAttribute('height', `${iconSize}`)
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '1.5')
    // Back square (offset top-right)
    const back = document.createElementNS(ns, 'rect')
    back.setAttribute('x', '5'); back.setAttribute('y', '2')
    back.setAttribute('width', '9'); back.setAttribute('height', '9')
    back.setAttribute('rx', '1')
    svg.appendChild(back)
    // Front square (offset bottom-left)
    const front = document.createElementNS(ns, 'rect')
    front.setAttribute('x', '2'); front.setAttribute('y', '5')
    front.setAttribute('width', '9'); front.setAttribute('height', '9')
    front.setAttribute('rx', '1')
    front.setAttribute('fill', 'var(--_wm-restore-bg, var(--headerbar-bg-color, #333))')
    front.setAttribute('stroke', 'currentColor')
    svg.appendChild(front)
    return svg
  }

  private _createSvg(pathData: string): SVGSVGElement {
    const iconSize = Math.round(this._size * 0.6)
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', `${iconSize}`)
    svg.setAttribute('height', `${iconSize}`)
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '2')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')

    // Support multiple path segments separated by ' M' (for close icon, plus, etc.)
    const segments = pathData.split(/(?= M)/)
    for (const seg of segments) {
      const path = document.createElementNS(ns, 'path')
      path.setAttribute('d', seg.trim())
      svg.appendChild(path)
    }

    return svg
  }

  private _buildDots(direction: 'horizontal' | 'vertical'): HTMLDivElement {
    const container = document.createElement('div')
    const dotSize = Math.max(2, Math.round(this._size * 0.12))
    const gap = Math.max(2, Math.round(this._size * 0.1))
    container.style.display = 'flex'
    container.style.gap = `${gap}px`
    container.style.flexDirection = direction === 'vertical' ? 'column' : 'row'

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div')
      dot.style.width = `${dotSize}px`
      dot.style.height = `${dotSize}px`
      dot.style.borderRadius = '50%'
      dot.style.backgroundColor = 'currentColor'
      container.appendChild(dot)
    }

    return container
  }

  private _fireClick(): void {
    if (this._disabled) return
    for (const handler of this._clickHandlers) handler()
  }

  private _stopRepeat(): void {
    if (this._repeatTimer) { clearTimeout(this._repeatTimer); this._repeatTimer = 0 }
    if (this._repeatIntervalTimer) { clearInterval(this._repeatIntervalTimer); this._repeatIntervalTimer = 0 }
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

  private _bindEvents(): void {
    if (this._repeat) {
      this._on(this._el, 'mousedown', (e) => {
        if (this._disabled) return
        e.preventDefault()
        this._fireClick()
        this._repeatTimer = window.setTimeout(() => {
          this._repeatIntervalTimer = window.setInterval(() => {
            this._fireClick()
          }, this._repeatInterval)
        }, this._repeatDelay)
      })

      const stopRepeat = () => this._stopRepeat()
      this._on(this._el, 'mouseup', stopRepeat)
      this._on(this._el, 'mouseleave', stopRepeat)
      this._on(document as unknown as HTMLElement, 'mouseup', stopRepeat)
    } else {
      this._on(this._el, 'click', (e) => {
        if (this._disabled) return
        e.preventDefault()
        this._fireClick()
      })
    }
  }
}
