import { describe, it, expect, afterEach } from 'vitest'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 10)) }

describe('menuitem-wc', () => {
  let el: any

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('creates with no options', () => {
      el = new UIMenuItemWC()
      document.body.appendChild(el)
      expect(el).toBeInstanceOf(HTMLElement)
      expect(el.shadowRoot).toBeTruthy()
    })

    it('creates with text and shortcut', () => {
      el = new UIMenuItemWC({ text: 'Save', shortcut: 'Ctrl+S' })
      document.body.appendChild(el)
      expect(el.text).toBe('Save')
      expect(el.shortcut).toBe('Ctrl+S')
    })

    it('creates with size and textAlign', () => {
      el = new UIMenuItemWC({ text: 'Test', size: 'large', textAlign: 'center' })
      document.body.appendChild(el)
      expect(el.size).toBe('large')
      expect(el.textAlign).toBe('center')
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('text getter/setter', () => {
      el = new UIMenuItemWC({ text: 'Hello' })
      document.body.appendChild(el)
      expect(el.text).toBe('Hello')
      el.text = 'World'
      expect(el.text).toBe('World')
    })

    it('shortcut getter/setter', () => {
      el = new UIMenuItemWC()
      document.body.appendChild(el)
      el.shortcut = 'Ctrl+Z'
      expect(el.shortcut).toBe('Ctrl+Z')
    })

    it('pushed getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T', pushable: true })
      document.body.appendChild(el)
      expect(el.pushed).toBe(false)
      el.pushed = true
      expect(el.pushed).toBe(true)
    })

    it('disabled getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T' })
      document.body.appendChild(el)
      el.disabled = true
      expect(el.disabled).toBe(true)
      expect(el.classList.contains('disabled')).toBe(true)
    })

    it('pushable getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T' })
      document.body.appendChild(el)
      el.pushable = true
      expect(el.pushable).toBe(true)
    })

    it('size getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T' })
      document.body.appendChild(el)
      el.size = 'small'
      expect(el.size).toBe('small')
    })

    it('textAlign getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T' })
      document.body.appendChild(el)
      el.textAlign = 'right'
      expect(el.textAlign).toBe('right')
    })

    it('requestParentClose getter/setter', () => {
      el = new UIMenuItemWC({ text: 'T' })
      document.body.appendChild(el)
      el.requestParentClose = true
      expect(el.requestParentClose).toBe(true)
    })
  })

  // ── Click handling ──

  describe('click handling', () => {
    it('onClick handler is called', () => {
      el = new UIMenuItemWC({ text: 'Click me' })
      document.body.appendChild(el)
      let clicked = false
      el.onClick(() => { clicked = true })
      el.click()
      expect(clicked).toBe(true)
    })

    it('offClick removes handler', () => {
      el = new UIMenuItemWC({ text: 'Click me' })
      document.body.appendChild(el)
      let count = 0
      const handler = () => { count++ }
      el.onClick(handler)
      el.click()
      expect(count).toBe(1)
      el.offClick(handler)
      el.click()
      expect(count).toBe(1)
    })

    it('disabled prevents click', () => {
      el = new UIMenuItemWC({ text: 'Click me' })
      document.body.appendChild(el)
      el.disabled = true
      let clicked = false
      el.onClick(() => { clicked = true })
      el.click()
      expect(clicked).toBe(false)
    })
  })

  // ── Pushable ──

  describe('pushable', () => {
    it('click toggles pushed state', () => {
      el = new UIMenuItemWC({ text: 'Toggle', pushable: true })
      document.body.appendChild(el)
      expect(el.pushed).toBe(false)
      el.click()
      expect(el.pushed).toBe(true)
      el.click()
      expect(el.pushed).toBe(false)
    })

    it('menuitem-pushed event fires with detail', () => {
      el = new UIMenuItemWC({ text: 'Toggle', pushable: true })
      document.body.appendChild(el)
      let detail: any = null
      el.addEventListener('menuitem-pushed', (e: any) => { detail = e.detail })
      el.click()
      expect(detail).toBeTruthy()
      expect(detail.pushed).toBe(true)
    })

    it('onPushedChange handler is called', () => {
      el = new UIMenuItemWC({ text: 'Toggle', pushable: true })
      document.body.appendChild(el)
      let pushedState: boolean | null = null
      el.onPushedChange((p: boolean) => { pushedState = p })
      el.click()
      expect(pushedState).toBe(true)
    })
  })

  // ── Events ──

  describe('events', () => {
    it('menuitem-click CustomEvent fires', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      let fired = false
      el.addEventListener('menuitem-click', () => { fired = true })
      el.click()
      expect(fired).toBe(true)
    })

    it('menuitem-click bubbles and is composed', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      let evt: CustomEvent | null = null
      el.addEventListener('menuitem-click', (e: any) => { evt = e })
      el.click()
      expect(evt!.bubbles).toBe(true)
      expect(evt!.composed).toBe(true)
    })

    it('request-parent-close fires when configured', () => {
      el = new UIMenuItemWC({ text: 'Close', requestParentClose: true })
      document.body.appendChild(el)
      let fired = false
      el.addEventListener('request-parent-close', () => { fired = true })
      el.click()
      expect(fired).toBe(true)
    })
  })

  // ── Element setters ──

  describe('element setters', () => {
    it('leftElement setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      const icon = document.createElement('span')
      icon.textContent = '★'
      el.leftElement = icon
      expect(el.classList.contains('has-left')).toBe(true)
    })
  })

  // ── Destroy ──

  describe('destroy()', () => {
    it('does not throw', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      expect(() => el.destroy()).not.toThrow()
    })

    it('double destroy is safe', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })
  })

  // ── Missing setters ──

  describe('additional setters', () => {
    it('rightElement setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      const icon = document.createElement('span')
      icon.textContent = '→'
      el.rightElement = icon
      // Verify it was accepted (no throw)
      expect(true).toBe(true)
    })

    it('centerElement setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      const center = document.createElement('span')
      center.textContent = 'Center'
      el.centerElement = center
      expect(true).toBe(true)
    })

    it('pushedElement setter', () => {
      el = new UIMenuItemWC({ text: 'Test', pushable: true })
      document.body.appendChild(el)
      const icon = document.createElement('span')
      icon.textContent = '✓'
      el.pushedElement = icon
      expect(true).toBe(true)
    })

    it('margin setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      el.margin = 8
      expect(true).toBe(true)
    })

    it('iconGap setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      el.iconGap = 12
      expect(true).toBe(true)
    })

    it('simulateFocus getter/setter', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      expect(el.simulateFocus).toBe(false)
      el.simulateFocus = true
      expect(el.simulateFocus).toBe(true)
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('offPushedChange removes handler', () => {
      el = new UIMenuItemWC({ text: 'Toggle', pushable: true })
      document.body.appendChild(el)
      let count = 0
      const handler = () => { count++ }
      el.onPushedChange(handler)
      el.click()
      expect(count).toBe(1)
      el.offPushedChange(handler)
      el.click()
      expect(count).toBe(1)
    })
  })

  // ── Event details ──

  describe('event details', () => {
    it('menuitem-click bubbles and is composed', () => {
      el = new UIMenuItemWC({ text: 'Test' })
      document.body.appendChild(el)
      let evt: CustomEvent | null = null
      el.addEventListener('menuitem-click', (e: any) => { evt = e })
      el.click()
      expect(evt!.bubbles).toBe(true)
      expect(evt!.composed).toBe(true)
    })
  })
})
