import type { UITextBoxWCOptions, TextBoxVariant, TextBoxSize, TextBoxValidation } from '../common/types'
import { UIHintWC } from '../ui-hint-wc/ui-hint-wc'
import { UIScrollBarWC } from '../ui-scrollbar-wc/ui-scrollbar-wc'
import cssText from './ui-textbox-wc.css?inline'

const TEXTBOX_WC_ATTRS = [
  'variant', 'size', 'label', 'placeholder', 'value', 'type',
  'disabled', 'readonly', 'max-length', 'pattern', 'required',
  'validation', 'helper-text', 'helper-icon', 'clearable', 'hint', 'width', 'name',
  'autocomplete', 'multiline', 'rows',
] as const

export class UITextBoxWC extends HTMLElement {
  private _shadow: ShadowRoot
  private _input!: HTMLInputElement | HTMLTextAreaElement
  private _labelEl!: HTMLLabelElement
  private _notchLabel!: HTMLSpanElement
  private _textboxEl!: HTMLDivElement
  private _wrapperEl!: HTMLDivElement
  private _helperEl!: HTMLDivElement
  private _helperTextEl!: HTMLSpanElement
  private _clearBtn!: HTMLButtonElement
  private _fieldset!: HTMLFieldSetElement

  private _variant: TextBoxVariant = 'outlined'
  private _size: TextBoxSize = 'medium'
  private _label: string = ''
  private _placeholder: string = ''
  private _value: string = ''
  private _type: string = 'text'
  private _disabled: boolean = false
  private _readonly: boolean = false
  private _maxLength: number = -1
  private _pattern: string = ''
  private _required: boolean = false
  private _validation: TextBoxValidation = 'none'
  private _helperText: string = ''
  private _clearable: boolean = false
  private _helperIcon: string = ''
  private _hintValue: string | UIHintWC | null = null
  private _hintWC: UIHintWC | null = null
  private _hintOwned: boolean = false  // true if we created the hint (we destroy it)
  private _name: string = ''
  private _helperIconEl!: HTMLSpanElement
  private _autocomplete: string = ''
  private _multiline: boolean = false
  private _rows: number = 3
  private _inputArea!: HTMLDivElement
  private _scrollbar: UIScrollBarWC | null = null
  private _scrollCleanups: Array<() => void> = []

  private _built: boolean = false
  private _configured: boolean = false
  private _destroyed: boolean = false
  private _pendingAttrs: Map<string, string | null> | null = null
  private _cleanups: Array<() => void> = []
  private _valueOnFocus: string = ''

  static get observedAttributes() {
    return [...TEXTBOX_WC_ATTRS]
  }

  constructor(options?: UITextBoxWCOptions) {
    super()
    this._shadow = this.attachShadow({ mode: 'open', delegatesFocus: true })
    const style = document.createElement('style')
    style.textContent = cssText
    this._shadow.appendChild(style)
    if (options) this.configure(options)
  }

  configure(options: UITextBoxWCOptions): void {
    const o = options
    // Handle multiline first — it determines element type before value/maxLength are applied
    if (o.multiline !== undefined && o.multiline !== this._multiline) {
      this._multiline = o.multiline
      if (this._built) this._rebuildInputElement()
    } else if (o.multiline !== undefined) {
      this._multiline = o.multiline
    }
    if (o.variant !== undefined) this._variant = o.variant
    if (o.size !== undefined) this._size = o.size
    if (o.label !== undefined) this._label = o.label
    if (o.placeholder !== undefined) this._placeholder = o.placeholder
    if (o.maxLength !== undefined) this._maxLength = o.maxLength
    if (o.value !== undefined) this._value = this._maxLength >= 0 ? o.value.substring(0, this._maxLength) : o.value
    if (o.type !== undefined) this._type = o.type
    if (o.disabled !== undefined) this._disabled = o.disabled
    if (o.readonly !== undefined) this._readonly = o.readonly
    if (o.pattern !== undefined) this._pattern = o.pattern
    if (o.required !== undefined) this._required = o.required
    if (o.validation !== undefined) this._validation = o.validation
    if (o.helperText !== undefined) this._helperText = o.helperText
    if (o.clearable !== undefined) this._clearable = o.clearable
    if (o.helperIcon !== undefined) this._helperIcon = o.helperIcon
    if (o.hint !== undefined) this._setHint(o.hint)
    if (o.name !== undefined) this._name = o.name
    if (o.autocomplete !== undefined) this._autocomplete = o.autocomplete
    if (o.rows !== undefined) this._rows = o.rows
    if (o.width !== undefined) {
      this.style.width = typeof o.width === 'number' ? `${o.width}px` : o.width
    }
    this._configured = true
    this._ensureBuilt()
    this._syncAll()
  }

  connectedCallback(): void {
    this._ensureBuilt()
    if (!this._configured) this._readAttributes()
    if (this._pendingAttrs) {
      for (const [name, val] of this._pendingAttrs) this._applyAttribute(name, val)
      this._pendingAttrs = null
    }
    this._syncAll()
    // Scrollbar range needs layout — schedule after first paint
    if (this._multiline && this._scrollbar) {
      requestAnimationFrame(() => this._updateScrollbarRange())
    }
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
      case 'variant': this._variant = (val as TextBoxVariant) || 'outlined'; break
      case 'size': this._size = (val as TextBoxSize) || 'medium'; break
      case 'label': this._label = val ?? ''; break
      case 'placeholder': this._placeholder = val ?? ''; break
      case 'value': this.value = val ?? ''; return
      case 'type': this._type = val || 'text'; break
      case 'disabled': this._disabled = val !== null; break
      case 'readonly': this._readonly = val !== null; break
      case 'max-length': this._maxLength = val !== null ? parseInt(val) : -1; break
      case 'pattern': this._pattern = val ?? ''; break
      case 'required': this._required = val !== null; break
      case 'validation': this._validation = (val as TextBoxValidation) || 'none'; break
      case 'helper-text': this._helperText = val ?? ''; break
      case 'helper-icon': this._helperIcon = val ?? ''; break
      case 'clearable': this._clearable = val !== null; break
      case 'hint': this._setHint(val ?? ''); break
      case 'width':
        if (val !== null) this.style.width = /^\d+$/.test(val) ? `${val}px` : val
        break
      case 'name': this._name = val ?? ''; break
      case 'autocomplete': this._autocomplete = val ?? ''; break
      case 'multiline': {
        const want = val !== null
        if (want !== this._multiline) {
          this._multiline = want
          if (this._built) this._rebuildInputElement()
        }
        break
      }
      case 'rows': this._rows = val !== null ? parseInt(val) || 3 : 3; break
    }
    this._syncAll()
  }

  private _readAttributes(): void {
    for (const name of TEXTBOX_WC_ATTRS) {
      const val = this.getAttribute(name)
      if (val !== null) this._applyAttribute(name, val)
    }
  }

  // ── Build ──

  private _ensureBuilt(): void {
    if (this._built) return
    this._built = true

    this._textboxEl = document.createElement('div')
    this._textboxEl.className = 'textbox'
    this._textboxEl.setAttribute('part', 'container')

    // Fieldset for outlined notch
    this._fieldset = document.createElement('fieldset')
    this._fieldset.className = 'outline-border'
    const legend = document.createElement('legend')
    this._notchLabel = document.createElement('span')
    this._notchLabel.className = 'notch-label'
    legend.appendChild(this._notchLabel)
    this._fieldset.appendChild(legend)

    // Input wrapper
    this._wrapperEl = document.createElement('div')
    this._wrapperEl.className = 'input-wrapper'

    // Fieldset inside wrapper
    this._wrapperEl.appendChild(this._fieldset)

    // Start slot
    const slotStart = document.createElement('div')
    slotStart.className = 'slot-start'
    const startSlot = document.createElement('slot')
    startSlot.name = 'start'
    slotStart.appendChild(startSlot)
    this._wrapperEl.appendChild(slotStart)

    // Track start slot content for label alignment
    startSlot.addEventListener('slotchange', () => {
      const hasStart = startSlot.assignedNodes().length > 0
      this._textboxEl.classList.toggle('has-start', hasStart)
      if (hasStart) {
        requestAnimationFrame(() => {
          this._wrapperEl.style.setProperty('--_start-offset', `${slotStart.offsetWidth}px`)
        })
      } else {
        this._wrapperEl.style.removeProperty('--_start-offset')
      }
    })

    // Input area
    this._inputArea = document.createElement('div')
    this._inputArea.className = 'input-area'

    this._input = this._createInputElement()
    this._inputArea.appendChild(this._input)

    // Floating label — inside input-area so it aligns with input text
    this._labelEl = document.createElement('label')
    this._labelEl.className = 'floating-label'
    this._labelEl.setAttribute('part', 'label')
    this._inputArea.appendChild(this._labelEl)

    this._wrapperEl.appendChild(this._inputArea)

    // Clear button
    this._clearBtn = document.createElement('button')
    this._clearBtn.className = 'clear-btn'
    this._clearBtn.type = 'button'
    this._clearBtn.tabIndex = -1
    this._clearBtn.setAttribute('aria-label', 'Clear')
    this._clearBtn.textContent = '✕'
    this._wrapperEl.appendChild(this._clearBtn)

    // End slot
    const slotEnd = document.createElement('div')
    slotEnd.className = 'slot-end'
    const endSlot = document.createElement('slot')
    endSlot.name = 'end'
    slotEnd.appendChild(endSlot)
    this._wrapperEl.appendChild(slotEnd)

    this._textboxEl.appendChild(this._wrapperEl)

    // Helper
    this._helperEl = document.createElement('div')
    this._helperEl.className = 'helper'
    this._helperEl.setAttribute('part', 'helper')
    this._helperIconEl = document.createElement('span')
    this._helperIconEl.className = 'helper-icon'
    this._helperEl.appendChild(this._helperIconEl)
    this._helperTextEl = document.createElement('span')
    this._helperTextEl.className = 'helper-text'
    const helperSlot = document.createElement('slot')
    helperSlot.name = 'helper'
    helperSlot.appendChild(this._helperTextEl)
    this._helperEl.appendChild(helperSlot)
    this._textboxEl.appendChild(this._helperEl)

    this._shadow.appendChild(this._textboxEl)

    this._bindEvents()
    if (this._multiline) this._setupScrollbar()
  }

  private _createInputElement(): HTMLInputElement | HTMLTextAreaElement {
    if (this._multiline) {
      const ta = document.createElement('textarea')
      ta.setAttribute('part', 'input')
      ta.rows = this._rows
      return ta
    }
    const inp = document.createElement('input')
    inp.setAttribute('part', 'input')
    return inp
  }

  private _rebuildInputElement(): void {
    if (!this._built) return
    // Unbind old events
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0

    // Tear down scrollbar
    this._destroyScrollbar()

    // Save state
    const oldInput = this._input
    // Create new element
    this._input = this._createInputElement()
    // Replace in DOM
    oldInput.replaceWith(this._input)
    // Rebind events
    this._bindEvents()
    // Setup scrollbar if multiline
    if (this._multiline) this._setupScrollbar()
    // Sync state to new element
    this._syncAll()
  }

  private _setupScrollbar(): void {
    if (this._scrollbar) return
    const sb = document.createElement('scrollbar-wc') as UIScrollBarWC
    sb.configure({
      kind: 'vertical',
      size: 'tiny',
      hover: false,
      showStartZone: false,
      showEndZone: false,
      min: 0,
      max: 0,
      value: 0,
    })
    sb.style.cssText = 'flex-shrink:0;align-self:stretch;margin:4px 2px;'
    this._scrollbar = sb

    // Insert scrollbar after input-area, before clear-btn
    this._wrapperEl.insertBefore(sb, this._clearBtn)

    const ta = this._input as HTMLTextAreaElement

    // Scrollbar → textarea
    const onSbChange = (v: number) => { ta.scrollTop = v }
    sb.on('change', onSbChange)
    this._scrollCleanups.push(() => sb.off('change', onSbChange))

    // Textarea scroll → scrollbar (e.g. keyboard scroll, selection scroll)
    const onTaScroll = () => {
      if (sb.value !== ta.scrollTop) sb.value = ta.scrollTop
    }
    ta.addEventListener('scroll', onTaScroll)
    this._scrollCleanups.push(() => ta.removeEventListener('scroll', onTaScroll))

    // Capture wheel events — scroll textarea instead of document
    const onWheel = (e: WheelEvent) => {
      const maxScroll = ta.scrollHeight - ta.clientHeight
      if (maxScroll <= 0) return
      e.preventDefault()
      ta.scrollTop = Math.max(0, Math.min(maxScroll, ta.scrollTop + e.deltaY))
      sb.value = ta.scrollTop
    }
    this._wrapperEl.addEventListener('wheel', onWheel, { passive: false })
    this._scrollCleanups.push(() => this._wrapperEl.removeEventListener('wheel', onWheel))

    // Listen for input changes
    const onInput = () => requestAnimationFrame(() => this._updateScrollbarRange())
    ta.addEventListener('input', onInput)
    this._scrollCleanups.push(() => ta.removeEventListener('input', onInput))

    // ResizeObserver for layout changes
    const ro = new ResizeObserver(() => this._updateScrollbarRange())
    ro.observe(ta)
    this._scrollCleanups.push(() => ro.disconnect())
  }

  /** Recalculate scrollbar range from textarea dimensions. Called when connected, on input, on resize. */
  _updateScrollbarRange(): void {
    if (!this._scrollbar || !this._multiline) return
    const ta = this._input as HTMLTextAreaElement
    const sb = this._scrollbar
    const maxScroll = Math.max(0, ta.scrollHeight - ta.clientHeight)
    sb.max = maxScroll
    sb.pageStep = ta.clientHeight
    sb.style.display = maxScroll > 0 ? '' : 'none'
  }

  private _destroyScrollbar(): void {
    for (const cleanup of this._scrollCleanups) cleanup()
    this._scrollCleanups.length = 0
    if (this._scrollbar) {
      this._scrollbar.destroy()
      this._scrollbar = null
    }
  }

  // ── Sync DOM ──

  private _syncAll(): void {
    if (!this._built) return

    // Variant class
    this._textboxEl.className = 'textbox'
    this._textboxEl.classList.add(this._variant)
    if (this._multiline) this._textboxEl.classList.add('multiline')
    if (this._size !== 'medium') this.setAttribute('size', this._size)

    // Label
    this._labelEl.textContent = this._label
    this._notchLabel.textContent = this._label

    // Floating label visibility for fixed: label goes above, not floating
    if (this._variant === 'fixed') {
      this._textboxEl.insertBefore(this._labelEl, this._wrapperEl)
    } else {
      if (this._labelEl.parentElement !== this._inputArea) {
        this._inputArea.appendChild(this._labelEl)
      }
    }

    // Input — type only applies to <input>, rows only applies to <textarea>
    if (this._input instanceof HTMLInputElement) {
      this._input.type = this._type
    }
    if (this._input instanceof HTMLTextAreaElement) {
      this._input.rows = this._rows
    }
    this._input.disabled = this._disabled
    this._input.readOnly = this._readonly
    this._input.name = this._name
    if (this._disabled) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
    if (this._maxLength >= 0) this._input.maxLength = this._maxLength
    else this._input.removeAttribute('maxlength')
    if (this._input instanceof HTMLInputElement) {
      if (this._pattern) this._input.pattern = this._pattern
      else this._input.removeAttribute('pattern')
    }
    if (this._required) this._input.required = true
    else this._input.required = false
    if (this._autocomplete) this._input.setAttribute('autocomplete', this._autocomplete)

    // Placeholder: for floating variants, show placeholder only when focused
    // For fixed variant, always show placeholder
    if (this._variant === 'fixed' || !this._label) {
      this._input.placeholder = this._placeholder
    } else {
      this._input.placeholder = ''
    }

    // Value
    if (this._input.value !== this._value) {
      this._input.value = this._value
    }

    // Clearable
    if (this._clearable) this._textboxEl.classList.add('clearable')
    else this._textboxEl.classList.remove('clearable')

    // Has-value class
    this._updateHasValue()

    // Validation
    this._textboxEl.classList.remove('validation-success', 'validation-error')
    if (this._validation === 'success') this._textboxEl.classList.add('validation-success')
    else if (this._validation === 'error') this._textboxEl.classList.add('validation-error')

    // Helper icon + text
    let icon = this._helperIcon
    if (icon === 'auto') {
      if (this._validation === 'success') icon = '✓'
      else if (this._validation === 'error') icon = '⚠'
      else icon = ''
    }
    this._helperIconEl.textContent = icon
    this._helperTextEl.textContent = this._helperText
  }

  private _updateHasValue(): void {
    if (!this._built) return
    const hasValue = this._value.length > 0
    this._textboxEl.classList.toggle('has-value', hasValue)
    this._textboxEl.classList.toggle('floated', hasValue)
  }

  // ── Properties ──

  get value(): string { return this._value }
  set value(v: string) {
    if (this._maxLength >= 0) v = v.substring(0, this._maxLength)
    this._value = v
    if (this._built) {
      if (this._input.value !== v) this._input.value = v
      this._updateHasValue()
    }
  }

  get label(): string { return this._label }
  set label(v: string) {
    this._label = v
    if (this._built) {
      this._labelEl.textContent = v
      this._notchLabel.textContent = v
    }
  }

  get placeholder(): string { return this._placeholder }
  set placeholder(v: string) {
    this._placeholder = v
    if (this._built) this._syncAll()
  }

  get variant(): TextBoxVariant { return this._variant }
  set variant(v: TextBoxVariant) {
    this._variant = v
    if (this._built) this._syncAll()
  }

  get size(): TextBoxSize { return this._size }
  set size(v: TextBoxSize) {
    this._size = v
    if (this._built) this._syncAll()
  }

  get type(): string { return this._type }
  set type(v: string) {
    this._type = v
    if (this._built && this._input instanceof HTMLInputElement) this._input.type = v
  }

  get disabled(): boolean { return this._disabled }
  set disabled(v: boolean) {
    this._disabled = v
    if (v) this.setAttribute('disabled', '')
    else this.removeAttribute('disabled')
    if (this._built) this._input.disabled = v
  }

  get readonly(): boolean { return this._readonly }
  set readonly(v: boolean) {
    this._readonly = v
    if (this._built) this._input.readOnly = v
  }

  get maxLength(): number { return this._maxLength }
  set maxLength(v: number) {
    this._maxLength = v
    if (v >= 0 && this._value.length > v) this.value = this._value.substring(0, v)
    if (this._built) {
      if (v >= 0) this._input.maxLength = v
      else this._input.removeAttribute('maxlength')
    }
  }

  get required(): boolean { return this._required }
  set required(v: boolean) {
    this._required = v
    if (this._built) this._input.required = v
  }

  get validation(): TextBoxValidation { return this._validation }
  set validation(v: TextBoxValidation) {
    this._validation = v
    if (this._built) this._syncAll()
  }

  get helperText(): string { return this._helperText }
  set helperText(v: string) {
    this._helperText = v
    if (this._built) this._helperTextEl.textContent = v
  }

  get clearable(): boolean { return this._clearable }
  set clearable(v: boolean) {
    this._clearable = v
    if (this._built) this._syncAll()
  }

  get helperIcon(): string { return this._helperIcon }
  set helperIcon(v: string) {
    this._helperIcon = v
    if (this._built) this._syncAll()
  }

  /** Set hint: string creates a simple tooltip, UIHintWC uses a custom pre-configured hint */
  get hint(): string | UIHintWC | null { return this._hintValue }
  set hint(v: string | UIHintWC | null) { this._setHint(v ?? '') }

  private _setHint(value: string | HTMLElement): void {
    // Destroy previous owned hint
    if (this._hintOwned && this._hintWC) {
      this._hintWC.destroy()
    }
    this._hintWC = null
    this._hintOwned = false

    if (!value) {
      this._hintValue = null
      return
    }

    if (value instanceof UIHintWC) {
      // User-provided custom hint — just attach anchor
      this._hintWC = value
      this._hintValue = value
      this._hintOwned = false
      if (this._built) {
        value.configure({ anchor: this })
      }
    } else if (typeof value === 'string' && value.length > 0) {
      // Simple text hint — create one automatically
      this._hintValue = value
      this._hintOwned = true
      const h = new UIHintWC()
      this._hintWC = h
      this._configureHint(h, value)
    }
  }

  private _configureHint(h: UIHintWC, content: string): void {
    const doConfigure = () => {
      h.configure({
        anchor: this,
        content,
        alignment: 'BottomCenter',
        trigger: 'hover',
        arrow: true,
        showDelay: 300,
        hideDelay: 150,
      })
    }
    if (this.isConnected) {
      doConfigure()
    } else {
      // Wait until connected to DOM so anchor has layout
      const obs = new MutationObserver(() => {
        if (this.isConnected) {
          obs.disconnect()
          doConfigure()
        }
      })
      obs.observe(document.body, { childList: true, subtree: true })
      this._cleanups.push(() => obs.disconnect())
    }
  }

  get name(): string { return this._name }
  set name(v: string) {
    this._name = v
    if (this._built) this._input.name = v
  }

  get multiline(): boolean { return this._multiline }
  set multiline(v: boolean) {
    if (v === this._multiline) return
    this._multiline = v
    if (this._built) this._rebuildInputElement()
  }

  get rows(): number { return this._rows }
  set rows(v: number) {
    this._rows = v
    if (this._built && this._input instanceof HTMLTextAreaElement) {
      this._input.rows = v
    }
  }

  get inputElement(): HTMLInputElement | HTMLTextAreaElement { return this._input }
  get isDestroyed(): boolean { return this._destroyed }

  // ── Methods ──

  override focus(): void {
    if (this._built) this._input.focus()
  }

  override blur(): void {
    if (this._built) this._input.blur()
  }

  select(): void {
    if (this._built) this._input.select()
  }

  clear(): void {
    const prev = this._value
    this.value = ''
    if (this._built) {
      this._input.value = ''
      this._updateHasValue()
      this.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true, detail: { previousValue: prev } }))
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: '' } }))
    }
  }

  // ── Events ──

  private _bindEvents(): void {
    const onInput = () => {
      this._value = this._input.value
      this._updateHasValue()
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail: { value: this._value } }))
    }
    this._input.addEventListener('input', onInput)
    this._cleanups.push(() => this._input.removeEventListener('input', onInput))

    const onFocus = () => {
      this._valueOnFocus = this._value
      this._textboxEl.classList.add('focused')
      // For floating variants, show placeholder when focused and empty
      if (this._variant !== 'fixed' && this._label) {
        this._input.placeholder = this._placeholder
      }
      this.dispatchEvent(new CustomEvent('focus', { bubbles: true, composed: true }))
    }
    this._input.addEventListener('focus', onFocus)
    this._cleanups.push(() => this._input.removeEventListener('focus', onFocus))

    const onBlur = () => {
      this._textboxEl.classList.remove('focused')
      // Hide placeholder when not focused for floating variants
      if (this._variant !== 'fixed' && this._label) {
        this._input.placeholder = ''
      }
      this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }))
      if (this._value !== this._valueOnFocus) {
        this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: this._value } }))
      }
    }
    this._input.addEventListener('blur', onBlur)
    this._cleanups.push(() => this._input.removeEventListener('blur', onBlur))

    const onKeyDown = (e: Event) => {
      this.dispatchEvent(new CustomEvent('keydown', { bubbles: true, composed: true, detail: e as KeyboardEvent }))
    }
    this._input.addEventListener('keydown', onKeyDown)
    this._cleanups.push(() => this._input.removeEventListener('keydown', onKeyDown))

    const onClear = () => {
      this.clear()
      this._input.focus()
    }
    this._clearBtn.addEventListener('click', onClear)
    this._cleanups.push(() => this._clearBtn.removeEventListener('click', onClear))
  }

  // ── Destroy ──

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._destroyScrollbar()
    if (this._hintOwned && this._hintWC) this._hintWC.destroy()
    this._hintWC = null
    for (const cleanup of this._cleanups) cleanup()
    this._cleanups.length = 0
    if (this.parentNode) this.parentNode.removeChild(this)
  }
}

customElements.define('textbox-wc', UITextBoxWC)

declare global {
  interface HTMLElementTagNameMap {
    'textbox-wc': UITextBoxWC
  }
}
