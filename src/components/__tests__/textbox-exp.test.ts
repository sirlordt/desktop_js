import { describe, it, expect, afterEach } from 'vitest'
import { UITextBoxExpWC } from '../ui-textbox-exp/ui-textbox-exp'

function flush(ms = 20): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

describe('textbox-exp-wc', () => {
  let el: UITextBoxExpWC

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && !el.isDestroyed) el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('createElement works and has shadow root', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      document.body.appendChild(el)
      expect(el.shadowRoot).toBeTruthy()
    })

    it('new UITextBoxExpWC with options', () => {
      el = new UITextBoxExpWC({ value: 'Hello', width: 250, height: 30 })
      document.body.appendChild(el)
      expect(el.value).toBe('Hello')
    })

    it('shadow DOM contains canvas and textarea', () => {
      el = new UITextBoxExpWC({ width: 200, height: 28 })
      document.body.appendChild(el)
      const canvas = el.shadowRoot!.querySelector('canvas')
      const textarea = el.shadowRoot!.querySelector('textarea')
      expect(canvas).toBeTruthy()
      expect(textarea).toBeTruthy()
    })

    it('textarea is hidden (opacity 0)', () => {
      el = new UITextBoxExpWC({ width: 200, height: 28 })
      document.body.appendChild(el)
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      const style = getComputedStyle(textarea)
      expect(style.opacity).toBe('0')
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('value get/set', () => {
      el = new UITextBoxExpWC({ value: 'Initial' })
      document.body.appendChild(el)
      expect(el.value).toBe('Initial')
      el.value = 'Changed'
      expect(el.value).toBe('Changed')
    })

    it('value syncs to hidden textarea', () => {
      el = new UITextBoxExpWC({ value: 'Sync' })
      document.body.appendChild(el)
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('Sync')
      el.value = 'Updated'
      expect(textarea.value).toBe('Updated')
    })

    it('placeholder get/set', () => {
      el = new UITextBoxExpWC({ placeholder: 'Type here...' })
      document.body.appendChild(el)
      expect(el.placeholder).toBe('Type here...')
      el.placeholder = 'New placeholder'
      expect(el.placeholder).toBe('New placeholder')
    })

    it('disabled get/set', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      expect(el.disabled).toBe(false)
      el.disabled = true
      expect(el.disabled).toBe(true)
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.disabled).toBe(true)
    })

    it('disabled reflects as host attribute', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.disabled = true
      expect(el.hasAttribute('disabled')).toBe(true)
      el.disabled = false
      expect(el.hasAttribute('disabled')).toBe(false)
    })

    it('readonly get/set', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      expect(el.readonly).toBe(false)
      el.readonly = true
      expect(el.readonly).toBe(true)
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.readOnly).toBe(true)
    })

    it('maxLength get/set', () => {
      el = new UITextBoxExpWC({ maxLength: 5 })
      document.body.appendChild(el)
      expect(el.maxLength).toBe(5)
    })

    it('maxLength truncates value on set', () => {
      el = new UITextBoxExpWC({ value: 'Hello World', maxLength: 5 })
      document.body.appendChild(el)
      expect(el.value).toBe('Hello')
    })

    it('maxLength truncates when reduced', () => {
      el = new UITextBoxExpWC({ value: 'Hello World' })
      document.body.appendChild(el)
      el.maxLength = 3
      expect(el.value).toBe('Hel')
    })
  })

  // ── Attributes ──

  describe('attributes', () => {
    it('value attribute reflects', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('value', 'From Attr')
      document.body.appendChild(el)
      expect(el.value).toBe('From Attr')
    })

    it('placeholder attribute reflects', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('placeholder', 'Hint')
      document.body.appendChild(el)
      expect(el.placeholder).toBe('Hint')
    })

    it('disabled attribute reflects', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('disabled', '')
      document.body.appendChild(el)
      expect(el.disabled).toBe(true)
    })

    it('readonly attribute reflects', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('readonly', '')
      document.body.appendChild(el)
      expect(el.readonly).toBe(true)
    })

    it('max-length attribute reflects', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('max-length', '10')
      document.body.appendChild(el)
      expect(el.maxLength).toBe(10)
    })

    it('width/height attributes size the element', () => {
      el = document.createElement('textbox-exp-wc') as UITextBoxExpWC
      el.setAttribute('width', '300')
      el.setAttribute('height', '36')
      document.body.appendChild(el)
      expect(el.style.width).toBe('300px')
      expect(el.style.height).toBe('36px')
    })
  })

  // ── Selection ──

  describe('selection', () => {
    it('selectionStart/End reflect textarea state', () => {
      el = new UITextBoxExpWC({ value: 'Hello' })
      document.body.appendChild(el)
      // Browser places cursor at end of textarea value by default
      expect(el.selectionStart).toBe(el.value.length)
      expect(el.selectionEnd).toBe(el.value.length)
    })

    it('selectAll selects entire value', async () => {
      el = new UITextBoxExpWC({ value: 'Hello' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.selectAll()
      expect(el.selectionStart).toBe(0)
      expect(el.selectionEnd).toBe(5)
    })

    it('selectedText returns selected portion', async () => {
      el = new UITextBoxExpWC({ value: 'Hello World' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.selectionStart = 6
      el.selectionEnd = 11
      expect(el.selectedText).toBe('World')
    })
  })

  // ── Focus ──

  describe('focus', () => {
    it('focus() focuses the hidden textarea', async () => {
      el = new UITextBoxExpWC({ value: 'Test' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      expect(el.shadowRoot!.activeElement).toBe(textarea)
    })

    it('blur() blurs the hidden textarea', async () => {
      el = new UITextBoxExpWC({ value: 'Test' })
      document.body.appendChild(el)
      el.focus()
      await flush()
      el.blur()
      await flush()
      expect(el.shadowRoot!.activeElement).not.toBe(el.shadowRoot!.querySelector('textarea'))
    })
  })

  // ── Events ──

  describe('events', () => {
    it('fires focus event', async () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      let fired = false
      el.addEventListener('focus', () => { fired = true })
      el.focus()
      await flush()
      expect(fired).toBe(true)
    })

    it('fires blur event', async () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.focus()
      await flush()
      let fired = false
      el.addEventListener('blur', () => { fired = true })
      el.blur()
      await flush()
      expect(fired).toBe(true)
    })

    it('fires input event when textarea receives input', async () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.focus()
      await flush()

      let detail: any = null
      el.addEventListener('input', (e) => { detail = (e as CustomEvent).detail })

      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Typed'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()

      expect(detail).toBeTruthy()
      expect(detail.value).toBe('Typed')
      expect(el.value).toBe('Typed')
    })

    it('fires change event on blur if value changed', async () => {
      el = new UITextBoxExpWC({ value: 'Original' })
      document.body.appendChild(el)
      el.focus()
      await flush()

      let changeDetail: any = null
      el.addEventListener('change', (e) => { changeDetail = (e as CustomEvent).detail })

      // Simulate typing
      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Modified'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))

      el.blur()
      await flush()

      expect(changeDetail).toBeTruthy()
      expect(changeDetail.value).toBe('Modified')
    })

    it('does NOT fire change event on blur if value unchanged', async () => {
      el = new UITextBoxExpWC({ value: 'Same' })
      document.body.appendChild(el)
      el.focus()
      await flush()

      let changeFired = false
      el.addEventListener('change', () => { changeFired = true })

      el.blur()
      await flush()

      expect(changeFired).toBe(false)
    })
  })

  // ── MaxLength enforcement via input ──

  describe('maxLength enforcement', () => {
    it('input event respects maxLength', async () => {
      el = new UITextBoxExpWC({ maxLength: 3 })
      document.body.appendChild(el)
      el.focus()
      await flush()

      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'ABCDE'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()

      expect(el.value).toBe('ABC')
    })
  })

  // ── Canvas rendering ──

  describe('canvas rendering', () => {
    it('canvas has correct pixel dimensions (HiDPI)', () => {
      el = new UITextBoxExpWC({ width: 200, height: 28 })
      document.body.appendChild(el)
      const canvas = el.shadowRoot!.querySelector('canvas') as HTMLCanvasElement
      const dpr = window.devicePixelRatio || 1
      expect(canvas.width).toBe(200 * dpr)
      expect(canvas.height).toBe(28 * dpr)
      expect(canvas.style.width).toBe('200px')
      expect(canvas.style.height).toBe('28px')
    })
  })

  // ── Destroy ──

  describe('destroy', () => {
    it('sets isDestroyed', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.destroy()
      expect(el.isDestroyed).toBe(true)
    })

    it('double destroy is safe', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })

    it('removes element from DOM', () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      expect(el.parentNode).toBe(document.body)
      el.destroy()
      expect(el.parentNode).toBeNull()
    })
  })

  // ── Single-line enforcement ──

  describe('single-line', () => {
    it('strips newlines from input', async () => {
      el = new UITextBoxExpWC()
      document.body.appendChild(el)
      el.focus()
      await flush()

      const textarea = el.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Line1\nLine2'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      await flush()

      expect(el.value).toBe('Line1Line2')
    })
  })
})
