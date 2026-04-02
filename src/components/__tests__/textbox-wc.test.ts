import { describe, it, expect, afterEach } from 'vitest'
import { UITextBoxWC } from '../ui-textbox-wc/ui-textbox-wc'

function flush(ms = 20): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

describe('textbox-wc', () => {
  let el: UITextBoxWC

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && !el.isDestroyed) el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('createElement works and has shadow root', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      document.body.appendChild(el)
      expect(el.shadowRoot).toBeTruthy()
    })

    it('new UITextBoxWC with options', () => {
      el = new UITextBoxWC({ label: 'Name', value: 'John' })
      document.body.appendChild(el)
      expect(el.label).toBe('Name')
      expect(el.value).toBe('John')
    })

    it('shadow DOM contains input element', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      expect(el.inputElement).toBeInstanceOf(HTMLInputElement)
    })

    it('default variant is outlined', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      expect(el.variant).toBe('outlined')
    })

    it('default size is medium', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      expect(el.size).toBe('medium')
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('value get/set', () => {
      el = new UITextBoxWC({ value: 'Initial' })
      document.body.appendChild(el)
      expect(el.value).toBe('Initial')
      el.value = 'Changed'
      expect(el.value).toBe('Changed')
      expect(el.inputElement.value).toBe('Changed')
    })

    it('label get/set', () => {
      el = new UITextBoxWC({ label: 'Email' })
      document.body.appendChild(el)
      expect(el.label).toBe('Email')
      el.label = 'Username'
      expect(el.label).toBe('Username')
    })

    it('placeholder get/set', () => {
      el = new UITextBoxWC({ placeholder: 'Type here' })
      document.body.appendChild(el)
      expect(el.placeholder).toBe('Type here')
    })

    it('variant get/set', () => {
      el = new UITextBoxWC({ variant: 'filled' })
      document.body.appendChild(el)
      expect(el.variant).toBe('filled')
      el.variant = 'standard'
      expect(el.variant).toBe('standard')
    })

    it('size get/set', () => {
      el = new UITextBoxWC({ size: 'small' })
      document.body.appendChild(el)
      expect(el.size).toBe('small')
      el.size = 'large'
      expect(el.size).toBe('large')
    })

    it('type get/set', () => {
      el = new UITextBoxWC({ type: 'password' })
      document.body.appendChild(el)
      expect(el.type).toBe('password')
      expect(el.inputElement.type).toBe('password')
    })

    it('disabled get/set', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      expect(el.disabled).toBe(false)
      el.disabled = true
      expect(el.disabled).toBe(true)
      expect(el.inputElement.disabled).toBe(true)
      expect(el.hasAttribute('disabled')).toBe(true)
    })

    it('readonly get/set', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.readonly = true
      expect(el.readonly).toBe(true)
      expect(el.inputElement.readOnly).toBe(true)
    })

    it('maxLength get/set', () => {
      el = new UITextBoxWC({ maxLength: 10 })
      document.body.appendChild(el)
      expect(el.maxLength).toBe(10)
    })

    it('maxLength truncates existing value', () => {
      el = new UITextBoxWC({ value: 'Hello World' })
      document.body.appendChild(el)
      el.maxLength = 5
      expect(el.value).toBe('Hello')
    })

    it('required get/set', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.required = true
      expect(el.required).toBe(true)
      expect(el.inputElement.required).toBe(true)
    })

    it('validation get/set', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.validation = 'error'
      expect(el.validation).toBe('error')
    })

    it('helperText get/set', () => {
      el = new UITextBoxWC({ helperText: 'Enter your email' })
      document.body.appendChild(el)
      expect(el.helperText).toBe('Enter your email')
      el.helperText = 'Required field'
      expect(el.helperText).toBe('Required field')
    })

    it('clearable get/set', () => {
      el = new UITextBoxWC({ clearable: true })
      document.body.appendChild(el)
      expect(el.clearable).toBe(true)
    })

    it('name get/set', () => {
      el = new UITextBoxWC({ name: 'email' })
      document.body.appendChild(el)
      expect(el.name).toBe('email')
      expect(el.inputElement.name).toBe('email')
    })
  })

  // ── Attributes ──

  describe('attributes', () => {
    it('variant attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('variant', 'filled')
      document.body.appendChild(el)
      expect(el.variant).toBe('filled')
    })

    it('label attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('label', 'Name')
      document.body.appendChild(el)
      expect(el.label).toBe('Name')
    })

    it('value attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('value', 'Test')
      document.body.appendChild(el)
      expect(el.value).toBe('Test')
    })

    it('disabled attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('disabled', '')
      document.body.appendChild(el)
      expect(el.disabled).toBe(true)
    })

    it('readonly attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('readonly', '')
      document.body.appendChild(el)
      expect(el.readonly).toBe(true)
    })

    it('clearable attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('clearable', '')
      document.body.appendChild(el)
      expect(el.clearable).toBe(true)
    })

    it('helper-text attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('helper-text', 'Help')
      document.body.appendChild(el)
      expect(el.helperText).toBe('Help')
    })

    it('width attribute sets host width', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('width', '300')
      document.body.appendChild(el)
      expect(el.style.width).toBe('300px')
    })

    it('size attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('size', 'large')
      document.body.appendChild(el)
      expect(el.size).toBe('large')
    })

    it('validation attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('validation', 'success')
      document.body.appendChild(el)
      expect(el.validation).toBe('success')
    })
  })

  // ── Variants visual classes ──

  describe('variants', () => {
    it('outlined adds outlined class', () => {
      el = new UITextBoxWC({ variant: 'outlined' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('outlined')).toBe(true)
    })

    it('filled adds filled class', () => {
      el = new UITextBoxWC({ variant: 'filled' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('filled')).toBe(true)
    })

    it('standard adds standard class', () => {
      el = new UITextBoxWC({ variant: 'standard' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('standard')).toBe(true)
    })

    it('fixed adds fixed class', () => {
      el = new UITextBoxWC({ variant: 'fixed' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('fixed')).toBe(true)
    })
  })

  // ── Floating label ──

  describe('floating label', () => {
    it('label element exists with text', () => {
      el = new UITextBoxWC({ label: 'Email' })
      document.body.appendChild(el)
      const label = el.shadowRoot!.querySelector('.floating-label')!
      expect(label.textContent).toBe('Email')
    })

    it('floated class added when value is not empty', () => {
      el = new UITextBoxWC({ label: 'Name', value: 'John' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('floated')).toBe(true)
    })

    it('floated class removed when value is empty', () => {
      el = new UITextBoxWC({ label: 'Name', value: '' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('floated')).toBe(false)
    })

    it('focused class added on focus', async () => {
      el = new UITextBoxWC({ label: 'Name' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('focused')).toBe(true)
    })

    it('focused class removed on blur', async () => {
      el = new UITextBoxWC({ label: 'Name' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.blur()
      await flush()
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('focused')).toBe(false)
    })
  })

  // ── Validation classes ──

  describe('validation', () => {
    it('success adds validation-success class', () => {
      el = new UITextBoxWC({ validation: 'success' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('validation-success')).toBe(true)
    })

    it('error adds validation-error class', () => {
      el = new UITextBoxWC({ validation: 'error' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('validation-error')).toBe(true)
    })

    it('none removes validation classes', () => {
      el = new UITextBoxWC({ validation: 'error' })
      document.body.appendChild(el)
      el.validation = 'none'
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('validation-error')).toBe(false)
      expect(container.classList.contains('validation-success')).toBe(false)
    })
  })

  // ── Events ──

  describe('events', () => {
    it('fires focus event', async () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      let fired = false
      el.addEventListener('focus', () => { fired = true })
      el.focus()
      await flush()
      expect(fired).toBe(true)
    })

    it('fires blur event', async () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.focus()
      await flush()
      let fired = false
      el.addEventListener('blur', () => { fired = true })
      el.blur()
      await flush()
      expect(fired).toBe(true)
    })

    it('fires input event on typing', async () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.focus()
      await flush()
      let detail: any = null
      el.addEventListener('input', (e) => { detail = (e as CustomEvent).detail })
      el.inputElement.value = 'Typed'
      el.inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()
      expect(detail).toBeTruthy()
      expect(detail.value).toBe('Typed')
      expect(el.value).toBe('Typed')
    })

    it('fires change event on blur if value changed', async () => {
      el = new UITextBoxWC({ value: 'Original' })
      document.body.appendChild(el)
      el.focus()
      await flush()

      let changeDetail: any = null
      el.addEventListener('change', (e) => { changeDetail = (e as CustomEvent).detail })

      el.inputElement.value = 'Modified'
      el.inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      el.blur()
      await flush()

      expect(changeDetail).toBeTruthy()
      expect(changeDetail.value).toBe('Modified')
    })

    it('does NOT fire change on blur if value unchanged', async () => {
      el = new UITextBoxWC({ value: 'Same' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      let fired = false
      el.addEventListener('change', () => { fired = true })
      el.blur()
      await flush()
      expect(fired).toBe(false)
    })
  })

  // ── Clear ──

  describe('clear', () => {
    it('clear() empties the value', () => {
      el = new UITextBoxWC({ value: 'Hello' })
      document.body.appendChild(el)
      el.clear()
      expect(el.value).toBe('')
      expect(el.inputElement.value).toBe('')
    })

    it('clear() fires clear event with previousValue', () => {
      el = new UITextBoxWC({ value: 'Hello' })
      document.body.appendChild(el)
      let detail: any = null
      el.addEventListener('clear', (e) => { detail = (e as CustomEvent).detail })
      el.clear()
      expect(detail).toBeTruthy()
      expect(detail.previousValue).toBe('Hello')
    })

    it('clear() fires input event', () => {
      el = new UITextBoxWC({ value: 'Hello' })
      document.body.appendChild(el)
      let inputFired = false
      el.addEventListener('input', () => { inputFired = true })
      el.clear()
      expect(inputFired).toBe(true)
    })

    it('clearable shows clear button when has value', () => {
      el = new UITextBoxWC({ value: 'Hello', clearable: true })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('clearable')).toBe(true)
      expect(container.classList.contains('has-value')).toBe(true)
    })
  })

  // ── Slots ──

  describe('slots', () => {
    it('start slot accepts elements', async () => {
      el = new UITextBoxWC({ label: 'Search' })
      const icon = document.createElement('span')
      icon.slot = 'start'
      icon.textContent = 'S'
      el.appendChild(icon)
      document.body.appendChild(el)
      await flush()
      const slot = el.shadowRoot!.querySelector('slot[name="start"]') as HTMLSlotElement
      const assigned = slot.assignedNodes()
      expect(assigned.length).toBe(1)
      expect(assigned[0]).toBe(icon)
    })

    it('end slot accepts elements', async () => {
      el = new UITextBoxWC({ label: 'Email' })
      const btn = document.createElement('button')
      btn.slot = 'end'
      btn.textContent = 'Go'
      el.appendChild(btn)
      document.body.appendChild(el)
      await flush()
      const slot = el.shadowRoot!.querySelector('slot[name="end"]') as HTMLSlotElement
      const assigned = slot.assignedNodes()
      expect(assigned.length).toBe(1)
      expect(assigned[0]).toBe(btn)
    })
  })

  // ── Focus / Methods ──

  describe('methods', () => {
    it('focus() focuses the input', async () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.focus()
      await flush()
      expect(el.shadowRoot!.activeElement).toBe(el.inputElement)
    })

    it('blur() blurs the input', async () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.blur()
      await flush()
      expect(el.shadowRoot!.activeElement).not.toBe(el.inputElement)
    })

    it('select() selects all text', async () => {
      el = new UITextBoxWC({ value: 'Hello' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.select()
      expect(el.inputElement.selectionStart).toBe(0)
      expect(el.inputElement.selectionEnd).toBe(5)
    })
  })

  // ── Multiline ──

  describe('multiline', () => {
    it('default multiline is false', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      expect(el.multiline).toBe(false)
    })

    it('multiline option creates textarea instead of input', () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)
      expect(el.inputElement).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('multiline false creates input element', () => {
      el = new UITextBoxWC({ multiline: false })
      document.body.appendChild(el)
      expect(el.inputElement).toBeInstanceOf(HTMLInputElement)
    })

    it('rows option sets textarea rows', () => {
      el = new UITextBoxWC({ multiline: true, rows: 5 })
      document.body.appendChild(el)
      expect(el.rows).toBe(5)
      expect((el.inputElement as HTMLTextAreaElement).rows).toBe(5)
    })

    it('default rows is 3', () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)
      expect(el.rows).toBe(3)
    })

    it('rows get/set', () => {
      el = new UITextBoxWC({ multiline: true, rows: 3 })
      document.body.appendChild(el)
      el.rows = 6
      expect(el.rows).toBe(6)
      expect((el.inputElement as HTMLTextAreaElement).rows).toBe(6)
    })

    it('multiline adds multiline class to container', () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('multiline')).toBe(true)
    })

    it('multiline attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('multiline', '')
      document.body.appendChild(el)
      expect(el.multiline).toBe(true)
      expect(el.inputElement).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('rows attribute reflects', () => {
      el = document.createElement('textbox-wc') as UITextBoxWC
      el.setAttribute('multiline', '')
      el.setAttribute('rows', '5')
      document.body.appendChild(el)
      expect(el.rows).toBe(5)
    })

    it('value works in multiline mode', () => {
      el = new UITextBoxWC({ multiline: true, value: 'Line 1\nLine 2' })
      document.body.appendChild(el)
      expect(el.value).toBe('Line 1\nLine 2')
      expect(el.inputElement.value).toBe('Line 1\nLine 2')
    })

    it('multiline preserves value when toggled at runtime', () => {
      el = new UITextBoxWC({ value: 'Hello' })
      document.body.appendChild(el)
      expect(el.inputElement).toBeInstanceOf(HTMLInputElement)

      el.multiline = true
      expect(el.inputElement).toBeInstanceOf(HTMLTextAreaElement)
      expect(el.value).toBe('Hello')
      expect(el.inputElement.value).toBe('Hello')

      el.multiline = false
      expect(el.inputElement).toBeInstanceOf(HTMLInputElement)
      expect(el.value).toBe('Hello')
      expect(el.inputElement.value).toBe('Hello')
    })

    it('multiline preserves disabled state on toggle', () => {
      el = new UITextBoxWC({ disabled: true })
      document.body.appendChild(el)
      el.multiline = true
      expect(el.inputElement.disabled).toBe(true)
    })

    it('multiline preserves readonly state on toggle', () => {
      el = new UITextBoxWC({ readonly: true })
      document.body.appendChild(el)
      el.multiline = true
      expect(el.inputElement.readOnly).toBe(true)
    })

    it('multiline preserves placeholder on toggle', () => {
      el = new UITextBoxWC({ placeholder: 'Enter text', variant: 'fixed' })
      document.body.appendChild(el)
      el.multiline = true
      expect(el.inputElement.placeholder).toBe('Enter text')
    })

    it('events work in multiline mode', async () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)

      let inputDetail: any = null
      el.addEventListener('input', (e) => { inputDetail = (e as CustomEvent).detail })

      el.inputElement.value = 'Typed'
      el.inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()

      expect(inputDetail).toBeTruthy()
      expect(inputDetail.value).toBe('Typed')
      expect(el.value).toBe('Typed')
    })

    it('focus/blur events work in multiline mode', async () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)

      let focusFired = false
      let blurFired = false
      el.addEventListener('focus', () => { focusFired = true })
      el.addEventListener('blur', () => { blurFired = true })

      el.focus()
      await flush()
      expect(focusFired).toBe(true)

      el.blur()
      await flush()
      expect(blurFired).toBe(true)
    })

    it('clear() works in multiline mode', () => {
      el = new UITextBoxWC({ multiline: true, value: 'Some text' })
      document.body.appendChild(el)
      let detail: any = null
      el.addEventListener('clear', (e) => { detail = (e as CustomEvent).detail })
      el.clear()
      expect(el.value).toBe('')
      expect(detail.previousValue).toBe('Some text')
    })

    it('clearable works in multiline mode', () => {
      el = new UITextBoxWC({ multiline: true, value: 'Text', clearable: true })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('clearable')).toBe(true)
      expect(container.classList.contains('has-value')).toBe(true)
    })

    it('validation works in multiline mode', () => {
      el = new UITextBoxWC({ multiline: true, validation: 'error' })
      document.body.appendChild(el)
      const container = el.shadowRoot!.querySelector('.textbox')!
      expect(container.classList.contains('validation-error')).toBe(true)
    })

    it('maxLength works in multiline mode', () => {
      el = new UITextBoxWC({ multiline: true, maxLength: 10, value: 'Hello World Long Text' })
      document.body.appendChild(el)
      expect(el.value).toBe('Hello Worl')
    })

    it('all variants work with multiline', () => {
      const variants = ['outlined', 'filled', 'standard', 'fixed'] as const
      for (const v of variants) {
        const tb = new UITextBoxWC({ multiline: true, variant: v })
        document.body.appendChild(tb)
        const container = tb.shadowRoot!.querySelector('.textbox')!
        expect(container.classList.contains(v)).toBe(true)
        expect(container.classList.contains('multiline')).toBe(true)
        expect(tb.inputElement).toBeInstanceOf(HTMLTextAreaElement)
        tb.destroy()
      }
      // prevent afterEach error on undefined el
      el = new UITextBoxWC()
    })

    it('events rebind after runtime multiline toggle', async () => {
      el = new UITextBoxWC({ value: 'A' })
      document.body.appendChild(el)

      el.multiline = true

      let inputDetail: any = null
      el.addEventListener('input', (e) => { inputDetail = (e as CustomEvent).detail })

      el.inputElement.value = 'New text'
      el.inputElement.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()

      expect(inputDetail).toBeTruthy()
      expect(inputDetail.value).toBe('New text')
    })

    it('textarea has overflow hidden (native scrollbar hidden)', () => {
      el = new UITextBoxWC({ multiline: true })
      document.body.appendChild(el)
      const textarea = el.inputElement as HTMLTextAreaElement
      const style = getComputedStyle(textarea)
      expect(style.overflow).toBe('hidden')
    })
  })

  // ── Destroy ──

  describe('destroy', () => {
    it('sets isDestroyed', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.destroy()
      expect(el.isDestroyed).toBe(true)
    })

    it('double destroy is safe', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })

    it('removes from DOM', () => {
      el = new UITextBoxWC()
      document.body.appendChild(el)
      el.destroy()
      expect(el.parentNode).toBeNull()
    })
  })
})
