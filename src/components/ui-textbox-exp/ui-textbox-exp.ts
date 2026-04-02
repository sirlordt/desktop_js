import type { UITextBoxExpOptions } from '../common/types'
import cssText from './ui-textbox-exp.css?inline'

const TEXTBOX_ATTRS = [
  'value', 'placeholder', 'width', 'height',
  'font-family', 'font-size',
  'disabled', 'readonly', 'max-length',
] as const

export class UITextBoxExpWC extends HTMLElement {
  private _shadow: ShadowRoot
  private _canvas!: HTMLCanvasElement
  private _ctx!: CanvasRenderingContext2D
  private _textarea!: HTMLTextAreaElement
  private _container!: HTMLDivElement

  private _value: string = ''
  private _placeholder: string = ''
  private _width: number = 200
  private _height: number = 28
  private _fontFamily: string = ''
  private _fontSize: number = 14
  private _disabled: boolean = false
  private _readonly: boolean = false
  private _maxLength: number = -1

  private _scrollX: number = 0
  private _cursorVisible: boolean = true
  private _blinkTimer: ReturnType<typeof setInterval> | null = null
  private _focused: boolean = false
  private _dragging: boolean = false
  private _valueOnFocus: string = ''

  private _built: boolean = false
  private _configured: boolean = false
  private _destroyed: boolean = false
  private _pendingAttrs: Map<string, string | null> | null = null
  private _cleanups: Array<() => void> = []

  static get observedAttributes() {
    return [...TEXTBOX_ATTRS]
  }

  constructor(options?: UITextBoxExpOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)
    if (options) this.configure(options)
  }

  configure(options: UITextBoxExpOptions): void {
    const o = options
    if (o.maxLength !== undefined) this._maxLength = o.maxLength
    if (o.value !== undefined) {
      this._value = this._maxLength >= 0 ? o.value.substring(0, this._maxLength) : o.value
    }
    if (o.placeholder !== undefined) this._placeholder = o.placeholder
    if (o.width !== undefined) this._width = o.width
    if (o.height !== undefined) this._height = o.height
    if (o.fontFamily !== undefined) this._fontFamily = o.fontFamily
    if (o.fontSize !== undefined) this._fontSize = o.fontSize
    if (o.disabled !== undefined) this._disabled = o.disabled
    if (o.readonly !== undefined) this._readonly = o.readonly
    if (o.className) this.classList.add(...o.className.split(/\s+/))
    this._configured = true
    this._ensureBuilt()
  }

  connectedCallback(): void {
    this._ensureBuilt()
    if (!this._configured) this._readAttributes()
    if (this._pendingAttrs) {
      for (const [name, val] of this._pendingAttrs) this._applyAttribute(name, val)
      this._pendingAttrs = null
    }
  }

  disconnectedCallback(): void {
    this._stopBlink()
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return
    if (!this._built) {
      if (!this._pendingAttrs) this._pendingAttrs = new Map()
      this._pendingAttrs.set(name, val)
      return
    }
    this._applyAttribute(name, val)
  }

  private _applyAttribute(name: string, val: string | null): void {
    switch (name) {
      case 'value': this.value = val ?? ''; break
      case 'placeholder': this.placeholder = val ?? ''; break
      case 'width': if (val !== null) { this._width = parseFloat(val); this._resizeCanvas() }; break
      case 'height': if (val !== null) { this._height = parseFloat(val); this._resizeCanvas() }; break
      case 'font-family': this._fontFamily = val ?? ''; this._render(); break
      case 'font-size': if (val !== null) { this._fontSize = parseFloat(val); this._render() }; break
      case 'disabled': this.disabled = val !== null; break
      case 'readonly': this.readonly = val !== null; break
      case 'max-length': this._maxLength = val !== null ? parseInt(val) : -1; break
    }
  }

  private _readAttributes(): void {
    for (const name of TEXTBOX_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) this._applyAttribute(name, val)
    }
  }

  // ── Build ──

  private _ensureBuilt(): void {
    if (this._built) return
    this._built = true

    this._container = document.createElement('div')
    this._container.className = 'container'

    this._canvas = document.createElement('canvas')
    this._canvas.className = 'render-canvas'
    this._container.appendChild(this._canvas)
    this._ctx = this._canvas.getContext('2d')!

    this._textarea = document.createElement('textarea')
    this._textarea.className = 'hidden-input'
    this._textarea.value = this._value
    this._textarea.rows = 1
    this._textarea.setAttribute('autocomplete', 'off')
    this._textarea.setAttribute('autocorrect', 'off')
    this._textarea.setAttribute('autocapitalize', 'off')
    this._textarea.setAttribute('spellcheck', 'false')
    if (this._disabled) this._textarea.disabled = true
    if (this._readonly) this._textarea.readOnly = true
    this._container.appendChild(this._textarea)

    this._shadow.appendChild(this._container)

    this._resizeCanvas()
    this._bindEvents()
    this._render()
  }

  // ── Properties ──

  get value(): string { return this._value }
  set value(v: string) {
    if (this._maxLength >= 0) v = v.substring(0, this._maxLength)
    this._value = v
    if (this._built) {
      this._textarea.value = v
      this._render()
    }
  }

  get placeholder(): string { return this._placeholder }
  set placeholder(v: string) {
    this._placeholder = v
    if (this._built) this._render()
  }

  get disabled(): boolean { return this._disabled }
  set disabled(v: boolean) {
    this._disabled = v
    if (v) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
    if (this._built) {
      this._textarea.disabled = v
      this._render()
    }
  }

  get readonly(): boolean { return this._readonly }
  set readonly(v: boolean) {
    this._readonly = v
    if (this._built) {
      this._textarea.readOnly = v
      this._render()
    }
  }

  get maxLength(): number { return this._maxLength }
  set maxLength(v: number) {
    this._maxLength = v
    if (v >= 0 && this._value.length > v) {
      this.value = this._value.substring(0, v)
    }
  }

  get selectionStart(): number { return this._built ? this._textarea.selectionStart ?? 0 : 0 }
  set selectionStart(v: number) { if (this._built) this._textarea.selectionStart = v; this._render() }

  get selectionEnd(): number { return this._built ? this._textarea.selectionEnd ?? 0 : 0 }
  set selectionEnd(v: number) { if (this._built) this._textarea.selectionEnd = v; this._render() }

  get selectedText(): string {
    const s = this.selectionStart, e = this.selectionEnd
    return this._value.substring(Math.min(s, e), Math.max(s, e))
  }

  get isDestroyed(): boolean { return this._destroyed }

  selectAll(): void {
    if (!this._built) return
    this._textarea.select()
    this._render()
  }

  override focus(): void {
    if (this._built) this._textarea.focus()
  }

  override blur(): void {
    if (this._built) this._textarea.blur()
  }

  // ── Canvas ──

  private _resizeCanvas(): void {
    if (!this._built) return
    const dpr = window.devicePixelRatio || 1
    this._canvas.width = this._width * dpr
    this._canvas.height = this._height * dpr
    this._canvas.style.width = `${this._width}px`
    this._canvas.style.height = `${this._height}px`
    this.style.width = `${this._width}px`
    this.style.height = `${this._height}px`
    this._ctx.scale(dpr, dpr)
    this._render()
  }

  private _getFont(): string {
    const family = this._fontFamily || getComputedStyle(this).getPropertyValue('--font-family').trim() || 'sans-serif'
    return `${this._fontSize}px ${family}`
  }

  private _getCSSColor(prop: string, fallback: string): string {
    return getComputedStyle(this).getPropertyValue(prop).trim() || fallback
  }

  private _render(): void {
    if (!this._built || !this._ctx) return
    const ctx = this._ctx
    const w = this._width
    const h = this._height
    const dpr = window.devicePixelRatio || 1
    const padding = 6

    // Reset transform and clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Colors from theme
    const bgColor = this._getCSSColor('--input-bg-color', '#2d2d2d')
    const borderColor = this._focused
      ? this._getCSSColor('--focus-ring-color', '#3584e4')
      : this._getCSSColor('--input-border-color', '#555')
    const textColor = this._getCSSColor('--view-fg-color', '#ffffff')
    const placeholderColor = this._getCSSColor('--input-placeholder-color', '') || this._fadeColor(textColor, 0.5)
    const selectionColor = this._getCSSColor('--selection-bg-color', 'rgba(53, 132, 228, 0.3)')

    // Background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)

    // Font
    ctx.font = this._getFont()
    ctx.textBaseline = 'middle'
    const textY = h / 2

    // Ensure cursor visible (adjust scrollX)
    const cursorPos = this._focused ? (this._textarea.selectionEnd ?? 0) : 0
    const cursorX = ctx.measureText(this._value.substring(0, cursorPos)).width + padding
    const visibleW = w - padding * 2
    if (cursorX - this._scrollX > visibleW) {
      this._scrollX = cursorX - visibleW
    } else if (cursorX - this._scrollX < 0) {
      this._scrollX = cursorX - padding
    }
    if (this._scrollX < 0) this._scrollX = 0

    // Clip text area
    ctx.save()
    ctx.beginPath()
    ctx.rect(padding, 0, visibleW, h)
    ctx.clip()

    // Selection highlight
    if (this._focused) {
      const selStart = this._textarea.selectionStart ?? 0
      const selEnd = this._textarea.selectionEnd ?? 0
      if (selStart !== selEnd) {
        const s = Math.min(selStart, selEnd)
        const e = Math.max(selStart, selEnd)
        const x1 = ctx.measureText(this._value.substring(0, s)).width + padding - this._scrollX
        const x2 = ctx.measureText(this._value.substring(0, e)).width + padding - this._scrollX
        ctx.fillStyle = selectionColor
        ctx.fillRect(x1, 2, x2 - x1, h - 4)
      }
    }

    // Text or placeholder
    if (this._value) {
      ctx.fillStyle = this._disabled ? this._fadeColor(textColor, 0.5) : textColor
      ctx.fillText(this._value, padding - this._scrollX, textY)
    } else if (this._placeholder && !this._focused) {
      ctx.fillStyle = placeholderColor
      ctx.fillText(this._placeholder, padding - this._scrollX, textY)
    }

    ctx.restore()

    // Cursor
    if (this._focused && this._cursorVisible && this.selectionStart === this.selectionEnd) {
      const cx = cursorX - this._scrollX
      ctx.strokeStyle = textColor
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, 4)
      ctx.lineTo(cx, h - 4)
      ctx.stroke()
    }

    // Border
    ctx.strokeStyle = borderColor
    ctx.lineWidth = this._focused ? 2 : 1
    const offset = this._focused ? 1 : 0.5
    ctx.strokeRect(offset, offset, w - offset * 2, h - offset * 2)
  }

  private _fadeColor(color: string, alpha: number): string {
    // Simple approach: wrap in rgba if it's a hex or named color
    const el = document.createElement('canvas')
    const c = el.getContext('2d')!
    c.fillStyle = color
    // Parse the resolved color
    const resolved = c.fillStyle // browser normalizes to #rrggbb or rgba
    if (resolved.startsWith('#')) {
      const r = parseInt(resolved.slice(1, 3), 16)
      const g = parseInt(resolved.slice(3, 5), 16)
      const b = parseInt(resolved.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return color
  }

  // ── Blink ──

  private _startBlink(): void {
    this._stopBlink()
    this._cursorVisible = true
    this._blinkTimer = setInterval(() => {
      this._cursorVisible = !this._cursorVisible
      this._render()
    }, 530)
  }

  private _stopBlink(): void {
    if (this._blinkTimer !== null) {
      clearInterval(this._blinkTimer)
      this._blinkTimer = null
    }
    this._cursorVisible = false
  }

  private _resetBlink(): void {
    this._cursorVisible = true
    this._startBlink()
  }

  // ── Mouse → character position ──

  private _charPosFromX(clientX: number): number {
    const rect = this._canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const padding = 6
    const ctx = this._ctx
    const dpr = window.devicePixelRatio || 1
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = this._getFont()
    let pos = this._value.length
    for (let i = 0; i <= this._value.length; i++) {
      const charW = ctx.measureText(this._value.substring(0, i)).width
      const nextW = i < this._value.length ? ctx.measureText(this._value.substring(0, i + 1)).width : charW
      const mid = (charW + nextW) / 2 + padding - this._scrollX
      if (x < mid) { pos = i; break }
    }
    ctx.restore()
    return pos
  }

  private _wordBoundsAt(pos: number): [number, number] {
    const text = this._value
    const wordChars = /\w/
    let start = pos, end = pos
    while (start > 0 && wordChars.test(text[start - 1])) start--
    while (end < text.length && wordChars.test(text[end])) end++
    if (start === end) { // non-word char: select just the char
      if (pos < text.length) end = pos + 1
    }
    return [start, end]
  }

  // ── Events ──

  private _bindEvents(): void {
    // Input from textarea
    const onInput = () => {
      let val = this._textarea.value
      // Enforce single line
      val = val.replace(/\n/g, '')
      if (this._maxLength >= 0) val = val.substring(0, this._maxLength)
      this._value = val
      this._textarea.value = val
      this._resetBlink()
      this._render()
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: this._value } }))
    }
    this._textarea.addEventListener('input', onInput)
    this._cleanups.push(() => this._textarea.removeEventListener('input', onInput))

    // Focus — defer render so mousedown can set cursor position first
    const onFocus = () => {
      this._focused = true
      this._valueOnFocus = this._value
      this._startBlink()
      requestAnimationFrame(() => this._render())
      this.dispatchEvent(new CustomEvent('focus', { bubbles: true, composed: true }))
    }
    this._textarea.addEventListener('focus', onFocus)
    this._cleanups.push(() => this._textarea.removeEventListener('focus', onFocus))

    // Blur
    const onBlur = () => {
      this._focused = false
      this._stopBlink()
      this._render()
      this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }))
      if (this._value !== this._valueOnFocus) {
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this._value } }))
      }
    }
    this._textarea.addEventListener('blur', onBlur)
    this._cleanups.push(() => this._textarea.removeEventListener('blur', onBlur))

    // Selection change (keyup to track arrow/shift moves)
    const onKeyUp = () => {
      this._resetBlink()
      this._render()
      this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { start: this.selectionStart, end: this.selectionEnd } }))
    }
    this._textarea.addEventListener('keyup', onKeyUp)
    this._cleanups.push(() => this._textarea.removeEventListener('keyup', onKeyUp))

    // Prevent newlines (Enter) + re-render on arrow/selection keys
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') e.preventDefault()
      this._resetBlink()
      // Defer render so textarea has updated selectionStart/End
      requestAnimationFrame(() => this._render())
    }
    this._textarea.addEventListener('keydown', onKeyDown)
    this._cleanups.push(() => this._textarea.removeEventListener('keydown', onKeyDown))

    // Mouse on canvas → position cursor / selection
    const onMouseDown = (e: MouseEvent) => {
      if (this._disabled) return
      e.preventDefault()
      this._textarea.focus()
      // Set selection AFTER focus (browser may reset it during focus)
      const pos = this._charPosFromX(e.clientX)
      this._textarea.selectionStart = pos
      this._textarea.selectionEnd = pos
      this._dragging = true
      this._resetBlink()
      // Synchronous render with correct position — runs before onFocus RAF
      this._render()

      const onMouseMove = (e: MouseEvent) => {
        if (!this._dragging) return
        const pos = this._charPosFromX(e.clientX)
        this._textarea.selectionEnd = pos
        this._render()
      }
      const onMouseUp = () => {
        this._dragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        this.dispatchEvent(new CustomEvent('select', { bubbles: true, composed: true, detail: { start: this.selectionStart, end: this.selectionEnd } }))
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
    this._canvas.addEventListener('mousedown', onMouseDown)
    this._cleanups.push(() => this._canvas.removeEventListener('mousedown', onMouseDown))

    // Double-click → select word
    const onDblClick = (e: MouseEvent) => {
      if (this._disabled) return
      const pos = this._charPosFromX(e.clientX)
      const [start, end] = this._wordBoundsAt(pos)
      this._textarea.selectionStart = start
      this._textarea.selectionEnd = end
      this._render()
    }
    this._canvas.addEventListener('dblclick', onDblClick)
    this._cleanups.push(() => this._canvas.removeEventListener('dblclick', onDblClick))
  }

  // ── Destroy ──

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._stopBlink()
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    if (this.parentNode) this.parentNode.removeChild(this)
  }
}

customElements.define('textbox-exp-wc', UITextBoxExpWC)

declare global {
  interface HTMLElementTagNameMap {
    'textbox-exp-wc': UITextBoxExpWC
  }
}
