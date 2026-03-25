import { UIView } from '../common/ui-view'
import { UIHint } from '../ui-hint/ui-hint'
import type { HintAlignment, UIHintOptions } from '../common/types'
import styles from './ui-button.css?raw'

/** Attributes handled by the layout core */
const CORE_ATTRS = [
  'size', 'position', 'left', 'top', 'width', 'height', 'right', 'bottom',
  'visible', 'disabled', 'name', 'opacity',
  'align',
  'anchors-left', 'anchors-top', 'anchors-right', 'anchors-bottom',
] as const

const BUTTON_ATTRS = [
  'variant', 'toggle', 'pressed',
  'icon-left', 'icon-right', 'icon-left-pressed', 'icon-right-pressed',
  'focusable', 'tabindex', 'truncate',
  'hint', 'hint-alignment', 'hint-arrow',
] as const

export class UIButton extends HTMLElement {
  static get observedAttributes() {
    return [...CORE_ATTRS, ...BUTTON_ATTRS]
  }

  /** Layout core — manages positioning, events, cleanup, theme */
  readonly core: UIView

  private _btn!: HTMLButtonElement
  private _iconLeftEl!: HTMLSpanElement
  private _iconRightEl!: HTMLSpanElement
  private _labelEl!: HTMLSpanElement
  private _hint: UIHint | null = null
  private _hintExternal: boolean = false

  constructor() {
    super()
    this.core = new UIView(this)

    const sr = this.attachShadow({ mode: 'open' })

    const sheet = document.createElement('style')
    sheet.textContent = styles
    sr.appendChild(sheet)

    const btn = document.createElement('button')
    btn.className = 'ui-btn'
    btn.setAttribute('part', 'button')

    const iconLeft = document.createElement('span')
    iconLeft.className = 'ui-btn__icon-left'
    iconLeft.setAttribute('part', 'icon-left')
    iconLeft.innerHTML = '<slot name="icon-left"></slot>'

    const label = document.createElement('span')
    label.className = 'ui-btn__label'
    label.setAttribute('part', 'label')
    label.innerHTML = '<slot></slot>'

    const iconRight = document.createElement('span')
    iconRight.className = 'ui-btn__icon-right'
    iconRight.setAttribute('part', 'icon-right')
    iconRight.innerHTML = '<slot name="icon-right"></slot>'

    btn.appendChild(iconLeft)
    btn.appendChild(label)
    btn.appendChild(iconRight)
    sr.appendChild(btn)

    this._btn = btn
    this._iconLeftEl = iconLeft
    this._iconRightEl = iconRight
    this._labelEl = label
  }

  connectedCallback() {
    this.core.connect()

    this.core.addListener(this._btn, 'click', this._handleClick)
    this._updateIcons()
    this._updateLabel()
    this._updateTabIndex()
    this._updateTruncate()

    // Re-check icon/label visibility when slots change
    const leftSlot = this._iconLeftEl.querySelector('slot')
    const rightSlot = this._iconRightEl.querySelector('slot')
    const labelSlot = this._labelEl.querySelector('slot')
    if (leftSlot) this.core.addListener(leftSlot as any, 'slotchange' as any, () => this._updateIcons())
    if (rightSlot) this.core.addListener(rightSlot as any, 'slotchange' as any, () => this._updateIcons())
    if (labelSlot) this.core.addListener(labelSlot as any, 'slotchange' as any, () => this._updateLabel())

    this._updateHint()
  }

  disconnectedCallback() {
    this.core.disconnect()
    this._destroyInternalHint()
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null) {
    this.core.applyAttribute(name, val)

    if (name === 'disabled') {
      this.core.viewDisabled = this.hasAttribute('disabled')
      this._btn.disabled = this.hasAttribute('disabled')
    }
    if (name.startsWith('icon')) {
      this._updateIcons()
    }
    if (name === 'focusable' || name === 'tabindex') {
      this._updateTabIndex()
    }
    if (name === 'truncate') {
      this._updateTruncate()
    }
    if (name === 'hint' || name === 'hint-alignment' || name === 'hint-arrow') {
      this._updateHint()
    }

    if (this.isConnected) {
      this.core.applyLayout()
    }
  }

  // ── Public API ──

  get variant(): string {
    return this.getAttribute('variant') || 'solid'
  }
  set variant(v: string) {
    this.setAttribute('variant', v)
  }

  get focusable(): boolean {
    return this.getAttribute('focusable') !== 'false'
  }
  set focusable(v: boolean) {
    this.setAttribute('focusable', String(v))
  }

  get isToggle(): boolean {
    return this.hasAttribute('toggle')
  }

  get pressed(): boolean {
    return this.hasAttribute('pressed')
  }
  set pressed(v: boolean) {
    if (v) {
      this.setAttribute('pressed', '')
    } else {
      this.removeAttribute('pressed')
    }
    this._updateIcons()
  }

  // ── Focus delegation ──

  override focus(options?: FocusOptions): void {
    this._btn.focus(options)
  }

  // ── Event emitter (framework-friendly) ──

  on(event: string, handler: Function): this {
    this.core.on(event, handler)
    return this
  }

  off(event: string, handler: Function): this {
    this.core.off(event, handler)
    return this
  }

  // ── Destroy ──

  destroy(): void {
    this._destroyInternalHint()
    this.core.destroy()
  }

  get isDestroyed(): boolean { return this.core.isDestroyed }

  // ── Private ──

  private _handleClick = () => {
    if (this.hasAttribute('disabled')) return

    if (this.focusable) {
      this._btn.focus()
    }

    if (this.isToggle) {
      this.pressed = !this.pressed
    }

    this.core.emit('ui-click', { pressed: this.pressed })
  }

  private _updateIcons() {
    const isPressed = this.pressed

    const leftAttr = isPressed
      ? (this.getAttribute('icon-left-pressed') || this.getAttribute('icon-left'))
      : this.getAttribute('icon-left')

    const rightAttr = isPressed
      ? (this.getAttribute('icon-right-pressed') || this.getAttribute('icon-right'))
      : this.getAttribute('icon-right')

    const leftSlot = this._iconLeftEl.querySelector('slot') as HTMLSlotElement
    const rightSlot = this._iconRightEl.querySelector('slot') as HTMLSlotElement

    const leftHasSlotted = leftSlot && leftSlot.assignedNodes().length > 0
    const rightHasSlotted = rightSlot && rightSlot.assignedNodes().length > 0

    if (!leftHasSlotted) {
      const existing = this._iconLeftEl.querySelector('.icon-fallback')
      if (leftAttr) {
        if (existing) {
          existing.textContent = leftAttr
        } else {
          const span = document.createElement('span')
          span.className = 'icon-fallback'
          span.textContent = leftAttr
          this._iconLeftEl.appendChild(span)
        }
      } else {
        existing?.remove()
      }
    }

    if (!rightHasSlotted) {
      const existing = this._iconRightEl.querySelector('.icon-fallback')
      if (rightAttr) {
        if (existing) {
          existing.textContent = rightAttr
        } else {
          const span = document.createElement('span')
          span.className = 'icon-fallback'
          span.textContent = rightAttr
          this._iconRightEl.appendChild(span)
        }
      } else {
        existing?.remove()
      }
    }

    const leftVisible = leftHasSlotted || !!leftAttr
    const rightVisible = rightHasSlotted || !!rightAttr
    this._iconLeftEl.classList.toggle('hidden', !leftVisible)
    this._iconRightEl.classList.toggle('hidden', !rightVisible)

    this._updateLabel()
  }

  private _updateLabel() {
    const slot = this._labelEl.querySelector('slot') as HTMLSlotElement
    const nodes = slot?.assignedNodes() || []
    const hasText = nodes.some(n => n.textContent?.trim())
    this._labelEl.classList.toggle('hidden', !hasText)

    const leftVisible = !this._iconLeftEl.classList.contains('hidden')
    const rightVisible = !this._iconRightEl.classList.contains('hidden')
    const iconOnly = !hasText && (leftVisible || rightVisible)
    this.toggleAttribute('data-icon-only', iconOnly)
  }

  private _updateTruncate() {
    const val = this.getAttribute('truncate')
    if (val === null) {
      this.style.removeProperty('--ui-btn-max-width')
    } else if (val === '' || val === 'true') {
      this.style.setProperty('--ui-btn-max-width', '100%')
    } else {
      const num = parseFloat(val)
      this.style.setProperty('--ui-btn-max-width', isNaN(num) ? val : `${num}px`)
    }
  }

  private _updateTabIndex() {
    if (this.getAttribute('focusable') === 'false') {
      this._btn.setAttribute('tabindex', '-1')
    } else if (this.hasAttribute('tabindex')) {
      this._btn.setAttribute('tabindex', this.getAttribute('tabindex')!)
    } else {
      this._btn.setAttribute('tabindex', '0')
    }
  }

  // ── Hint integration ──

  get uiHint(): UIHint | null { return this._hint }

  set uiHint(hint: UIHint | null) {
    this._destroyInternalHint()
    if (hint) {
      this._hint = hint
      this._hintExternal = true
    } else {
      this._hintExternal = false
      this._updateHint()
    }
  }

  setHint(options: Partial<Omit<UIHintOptions, 'anchor'>>): UIHint {
    this._destroyInternalHint()
    this._hintExternal = false
    const hint = new UIHint({
      anchor: this,
      trigger: 'hover',
      showDelay: 300,
      hideDelay: 150,
      ...options,
    })
    this._hint = hint
    return hint
  }

  private _updateHint() {
    if (this._hintExternal || !this.isConnected) return

    const text = this.getAttribute('hint')
    if (!text) {
      this._destroyInternalHint()
      return
    }

    const alignment = (this.getAttribute('hint-alignment') as HintAlignment) || 'BottomCenter'
    const arrow = this.hasAttribute('hint-arrow')

    if (this._hint && !this._hintExternal) {
      this._hint.content = text
      this._hint.alignment = alignment
      this._hint.arrow = arrow
    } else {
      this._hint = new UIHint({
        anchor: this,
        content: text,
        alignment,
        arrow,
        trigger: 'hover',
        showDelay: 300,
        hideDelay: 150,
      })
    }
  }

  private _destroyInternalHint() {
    if (this._hint && !this._hintExternal) {
      this._hint.destroy()
    }
    this._hint = null
  }
}

customElements.define('ui-button', UIButton)
