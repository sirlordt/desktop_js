import { describe, it, expect, afterEach } from 'vitest'
import '../ui-button-wc/ui-button-wc'

describe('UIButtonWC (ui-button)', () => {
  const cleanups: HTMLElement[] = []

  afterEach(async () => {
    for (const el of cleanups) {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    cleanups.length = 0
    document.querySelectorAll('ui-button').forEach(el => el.remove())
    await new Promise(r => setTimeout(r, 10))
  })

  // ── Construction ──

  describe('Construction', () => {
    it('should create via document.createElement', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      expect(btn).toBeInstanceOf(HTMLElement)
      expect(btn.tagName.toLowerCase()).toBe('ui-button')
    })

    it('should have a shadowRoot with delegatesFocus', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      expect(btn.shadowRoot).not.toBeNull()
      expect(btn.shadowRoot!.delegatesFocus).toBe(true)
    })
  })

  // ── Attributes ──

  describe('Attributes', () => {
    it('should set variant attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      btn.setAttribute('variant', 'outline')
      expect(btn.getAttribute('variant')).toBe('outline')
      expect(btn.variant).toBe('outline')
    })

    it('should set toggle attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      btn.setAttribute('toggle', '')
      expect(btn.hasAttribute('toggle')).toBe(true)
      expect(btn.isToggle).toBe(true)
    })

    it('should set pressed attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      btn.pressed = true
      expect(btn.hasAttribute('pressed')).toBe(true)
      expect(btn.pressed).toBe(true)
      btn.pressed = false
      expect(btn.hasAttribute('pressed')).toBe(false)
    })

    it('should set disabled attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      document.body.appendChild(btn)
      btn.setAttribute('disabled', '')
      expect(btn.hasAttribute('disabled')).toBe(true)
      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      expect(innerBtn.disabled).toBe(true)
    })

    it('should set focusable attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      expect(btn.focusable).toBe(true)
      btn.setAttribute('focusable', 'false')
      expect(btn.focusable).toBe(false)
    })

    it('should set size attribute', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      btn.setAttribute('size', 'small')
      expect(btn.getAttribute('size')).toBe('small')
    })
  })

  // ── Text content ──

  describe('Text content', () => {
    it('should render label text via textContent', async () => {
      const btn = document.createElement('ui-button') as any
      btn.textContent = 'Click Me'
      document.body.appendChild(btn)
      cleanups.push(btn)

      // Wait for slot to populate
      await new Promise(r => setTimeout(r, 10))

      const labelSlot = btn.shadowRoot!.querySelector('.ui-btn__label slot') as HTMLSlotElement
      expect(labelSlot).not.toBeNull()
      const nodes = labelSlot.assignedNodes()
      const text = Array.from(nodes).map(n => n.textContent).join('')
      expect(text).toBe('Click Me')
    })
  })

  // ── Toggle mode ──

  describe('Toggle mode', () => {
    it('should toggle pressed on click when toggle attribute is set', async () => {
      const btn = document.createElement('ui-button') as any
      btn.setAttribute('toggle', '')
      btn.textContent = 'Toggle'
      document.body.appendChild(btn)
      cleanups.push(btn)

      await new Promise(r => setTimeout(r, 10))

      expect(btn.pressed).toBe(false)

      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      innerBtn.click()
      expect(btn.pressed).toBe(true)

      innerBtn.click()
      expect(btn.pressed).toBe(false)
    })

    it('should fire ui-click event with detail.pressed for toggle', async () => {
      const btn = document.createElement('ui-button') as any
      btn.setAttribute('toggle', '')
      btn.textContent = 'Toggle'
      document.body.appendChild(btn)
      cleanups.push(btn)

      await new Promise(r => setTimeout(r, 10))

      let detail: any = null
      btn.addEventListener('ui-click', (e: CustomEvent) => { detail = e.detail })

      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      innerBtn.click()

      expect(detail).not.toBeNull()
      expect(detail.pressed).toBe(true)
    })
  })

  // ── Click event ──

  describe('Click event', () => {
    it('should fire ui-click CustomEvent on click', async () => {
      const btn = document.createElement('ui-button') as any
      btn.textContent = 'Click'
      document.body.appendChild(btn)
      cleanups.push(btn)

      await new Promise(r => setTimeout(r, 10))

      let fired = false
      btn.addEventListener('ui-click', () => { fired = true })

      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      innerBtn.click()

      expect(fired).toBe(true)
    })
  })

  // ── Disabled ──

  describe('Disabled', () => {
    it('should not fire ui-click when disabled', async () => {
      const btn = document.createElement('ui-button') as any
      btn.textContent = 'No Click'
      btn.setAttribute('disabled', '')
      document.body.appendChild(btn)
      cleanups.push(btn)

      await new Promise(r => setTimeout(r, 10))

      let fired = false
      btn.addEventListener('ui-click', () => { fired = true })

      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      innerBtn.click()

      expect(fired).toBe(false)
    })
  })

  // ── Slots ──

  describe('Slots', () => {
    it('should have icon-left and icon-right named slots', () => {
      const btn = document.createElement('ui-button') as any
      cleanups.push(btn)
      document.body.appendChild(btn)

      const leftSlot = btn.shadowRoot!.querySelector('slot[name="icon-left"]')
      const rightSlot = btn.shadowRoot!.querySelector('slot[name="icon-right"]')
      expect(leftSlot).not.toBeNull()
      expect(rightSlot).not.toBeNull()
    })
  })

  // ── Focus ──

  describe('Focus', () => {
    it('should support focus() via delegatesFocus', async () => {
      const btn = document.createElement('ui-button') as any
      btn.textContent = 'Focus Me'
      document.body.appendChild(btn)
      cleanups.push(btn)

      await new Promise(r => setTimeout(r, 10))

      btn.focus()

      // The inner button should receive focus due to delegatesFocus
      const innerBtn = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      expect(btn.shadowRoot!.activeElement).toBe(innerBtn)
    })
  })

  // ── Missing properties ──

  describe('additional properties', () => {
    it('simulateFocus getter/setter', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      btn.simulateFocus = true
      expect(btn.simulateFocus).toBe(true)
      btn.simulateFocus = false
      expect(btn.simulateFocus).toBe(false)
    })

    it('isDestroyed', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      expect(btn.isDestroyed).toBe(false)
      btn.destroy()
      expect(btn.isDestroyed).toBe(true)
    })

    it('core is accessible', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      expect(btn.core).toBeTruthy()
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('destroy does not throw', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      expect(() => btn.destroy()).not.toThrow()
    })

    it('double destroy is safe', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      btn.destroy()
      expect(() => btn.destroy()).not.toThrow()
    })

    it('on/off event listeners', () => {
      const btn = document.createElement('ui-button') as any; document.body.appendChild(btn); cleanups.push(btn)
      let count = 0
      const handler = () => { count++ }
      btn.on('ui-click', handler)
      // Click the inner button in shadow DOM
      const inner = btn.shadowRoot!.querySelector('button') as HTMLButtonElement
      inner.click()
      expect(count).toBe(1)
      btn.off('ui-click', handler)
      inner.click()
      expect(count).toBe(1)
    })
  })
})
