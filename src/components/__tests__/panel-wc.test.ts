import { describe, it, expect, afterEach } from 'vitest'
import '../ui-panel-wc/ui-panel-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 10)) }

describe('panel-wc', () => {
  let el: any

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && !el.isDestroyed) el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('creates element (light DOM, no shadowRoot)', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      expect(el).toBeInstanceOf(HTMLElement)
      expect(el.shadowRoot).toBeNull()
    })

    it('has core UIView', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      expect(el.core).toBeTruthy()
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('panelName', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.panelName = 'sidebar'
      expect(el.panelName).toBe('sidebar')
    })

    it('backgroundColor / borderColor / borderWidth', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.backgroundColor = '#f00'
      el.borderColor = '#0f0'
      el.borderWidth = 2
      expect(el.backgroundColor).toBe('#f00')
      expect(el.borderColor).toBe('#0f0')
      expect(el.borderWidth).toBe(2)
    })

    it('panelVisible', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.panelVisible = false
      expect(el.panelVisible).toBe(false)
    })

    it('panelDisabled', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.panelDisabled = true
      expect(el.panelDisabled).toBe(true)
    })

    it('panelOpacity', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.panelOpacity = 0.5
      expect(el.panelOpacity).toBe(0.5)
    })
  })

  // ── Attributes ──

  describe('attributes', () => {
    it('name attribute reflects', () => {
      el = document.createElement('panel-wc')
      el.setAttribute('name', 'main')
      document.body.appendChild(el)
      expect(el.panelName).toBe('main')
    })

    it('bg attribute reflects to backgroundColor', () => {
      el = document.createElement('panel-wc')
      el.setAttribute('bg', '#ccc')
      document.body.appendChild(el)
      expect(el.backgroundColor).toBe('#ccc')
    })

    it('border-color attribute reflects', () => {
      el = document.createElement('panel-wc')
      el.setAttribute('border-color', 'red')
      document.body.appendChild(el)
      expect(el.borderColor).toBe('red')
    })

    it('border-width attribute reflects', () => {
      el = document.createElement('panel-wc')
      el.setAttribute('border-width', '3')
      document.body.appendChild(el)
      expect(el.borderWidth).toBe(3)
    })
  })

  // ── Nesting ──

  describe('nesting', () => {
    it('child panel registers with parent', () => {
      el = document.createElement('panel-wc')
      el.style.cssText = 'width:400px;height:300px;display:block;position:relative;'
      document.body.appendChild(el)

      const child = document.createElement('panel-wc') as any
      el.appendChild(child)
      expect(child.parentPanel).toBe(el)
      expect(el.childPanels).toContain(child)

      child.destroy()
    })
  })

  // ── Destroy ──

  describe('destroy()', () => {
    it('sets isDestroyed to true', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(el.isDestroyed).toBe(true)
    })

    it('double destroy is safe', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })
  })

  // ── Auto-destroy ──

  describe('auto-destroy', () => {
    it('does not destroy without attribute', async () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      document.body.removeChild(el)
      await flush()
      expect(el.isDestroyed).toBe(false)
    })

    it('destroys with auto-destroy attribute', async () => {
      el = document.createElement('panel-wc')
      el.setAttribute('auto-destroy', '')
      document.body.appendChild(el)
      document.body.removeChild(el)
      await flush()
      expect(el.isDestroyed).toBe(true)
    })
  })

  // ── Missing layout properties ──

  describe('layout properties', () => {
    it('left / top', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.left = 50
      el.top = 100
      expect(el.left).toBe(50)
      expect(el.top).toBe(100)
    })

    it('panelWidth / panelHeight', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.panelWidth = 300
      el.panelHeight = 200
      expect(el.panelWidth).toBe(300)
      expect(el.panelHeight).toBe(200)
    })

    it('position', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.position = 'absolute'
      expect(el.position).toBe('absolute')
    })

    it('align', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      el.align = 'client'
      expect(el.align).toBe('client')
    })

    it('core is accessible', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      expect(el.core).toBeTruthy()
      expect(typeof el.core.applyLayout).toBe('function')
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('update does not throw', () => {
      el = document.createElement('panel-wc')
      document.body.appendChild(el)
      expect(() => el.update()).not.toThrow()
    })
  })
})
