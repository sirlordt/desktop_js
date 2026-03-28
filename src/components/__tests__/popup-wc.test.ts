import { describe, it, expect, afterEach, vi } from 'vitest'
import { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 10))
}

describe('UIPopupWC', () => {
  const cleanups: HTMLElement[] = []

  function createAnchor(): HTMLButtonElement {
    const anchor = document.createElement('button')
    anchor.textContent = 'Anchor'
    anchor.style.cssText = 'position:fixed;left:100px;top:100px;width:80px;height:30px;'
    document.body.appendChild(anchor)
    cleanups.push(anchor)
    return anchor
  }

  afterEach(async () => {
    document.querySelectorAll('popup-wc, window-wc').forEach(el => el.remove())
    for (const el of cleanups) {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    cleanups.length = 0
    await flush()
  })

  // ── Construction ──

  describe('Construction', () => {
    it('should create a UIPopupWC with new UIPopupWC()', () => {
      const popup = new UIPopupWC()
      cleanups.push(popup)
      expect(popup).toBeInstanceOf(UIPopupWC)
      expect(popup).toBeInstanceOf(HTMLElement)
    })

    it('should configure with options in constructor', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 200 })
      cleanups.push(popup)
      expect(popup.anchor).toBe(anchor)
      expect(popup.width).toBe(200)
    })
  })

  // ── Properties ──

  describe('Properties', () => {
    it('should get/set kind', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.kind).toBe('menu')
      popup.kind = 'container'
      expect(popup.kind).toBe('container')
    })

    it('should get/set alignment', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.alignment).toBe('BottomLeft')
      popup.alignment = 'TopRight'
      expect(popup.alignment).toBe('TopRight')
    })

    it('should get/set margin', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.margin).toBe(4)
      popup.margin = 10
      expect(popup.margin).toBe(10)
    })

    it('should get/set width and height', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      popup.width = 300
      popup.height = 400
      expect(popup.width).toBe(300)
      expect(popup.height).toBe(400)
    })

    it('should get/set minWidth and minHeight', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      popup.minWidth = 80
      popup.minHeight = 120
      expect(popup.minWidth).toBe(80)
      expect(popup.minHeight).toBe(120)
    })

    it('should get/set resizable', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.resizable).toBe(false)
      popup.resizable = true
      expect(popup.resizable).toBe(true)
    })

    it('should get/set detachable', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.detachable).toBe(false)
      popup.detachable = true
      expect(popup.detachable).toBe(true)
    })

    it('should get/set closeOnClickOutside', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.closeOnClickOutside).toBe(true)
      popup.closeOnClickOutside = false
      expect(popup.closeOnClickOutside).toBe(false)
    })

    it('should get/set closeOnEscape', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.closeOnEscape).toBe(true)
      popup.closeOnEscape = false
      expect(popup.closeOnEscape).toBe(false)
    })

    it('should get/set scrollMode', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.scrollMode).toBeUndefined()
      popup.scrollMode = 'both'
      expect(popup.scrollMode).toBe('both')
    })

    it('should get/set anchor', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.anchor).toBeNull()
      popup.anchor = anchor
      expect(popup.anchor).toBe(anchor)
    })

    it('should get/set title', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.title).toBe('')
      popup.title = 'My Popup'
      expect(popup.title).toBe('My Popup')
    })

    it('should get/set parentRef', () => {
      const div = document.createElement('div')
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.parentRef).toBeNull()
      popup.parentRef = div
      expect(popup.parentRef).toBe(div)
    })
  })

  // ── show/close/toggle ──

  describe('show/close/toggle', () => {
    it('should transition closed -> attached -> closed', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      expect(popup.state).toBe('closed')
      expect(popup.visible).toBe(false)

      popup.show()
      await flush()
      expect(popup.state).toBe('attached')
      expect(popup.visible).toBe(true)

      popup.close()
      await flush()
      expect(popup.state).toBe('closed')
      expect(popup.visible).toBe(false)
    })

    it('should toggle between closed and attached', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      popup.toggle()
      await flush()
      expect(popup.state).toBe('attached')

      popup.toggle()
      await flush()
      expect(popup.state).toBe('closed')
    })

    it('should not show if no anchor is set', async () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      popup.show()
      await flush()
      expect(popup.state).toBe('closed')
    })
  })

  // ── addChild / removePopupChild / clearChildren ──

  describe('addChild/removePopupChild/clearChildren', () => {
    it('should add a child element', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor }) as any
      cleanups.push(popup)

      const item = new UIMenuItemWC({ text: 'Item 1' })
      popup.addChild(item)
      expect(popup.window.contentElement.contains(item)).toBe(true)
    })

    it('should remove a child element', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor }) as any
      cleanups.push(popup)

      const item = new UIMenuItemWC({ text: 'Item 1' })
      popup.addChild(item)
      popup.removePopupChild(item)
      expect(popup.window.contentElement.contains(item)).toBe(false)
    })

    it('should clear all children', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor }) as any
      cleanups.push(popup)

      popup.addChild(new UIMenuItemWC({ text: 'A' }))
      popup.addChild(new UIMenuItemWC({ text: 'B' }))
      popup.clearChildren()
      expect(popup.window.contentElement.querySelectorAll('menuitem-wc').length).toBe(0)
    })
  })

  // ── Events ──

  describe('Events', () => {
    it('should fire popup-show CustomEvent on show', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)
      document.body.appendChild(popup)

      const handler = vi.fn()
      popup.addEventListener('popup-show', handler)

      popup.show()
      await flush()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
    })

    it('should fire popup-close CustomEvent on close', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)
      document.body.appendChild(popup)

      popup.show()
      await flush()

      const handler = vi.fn()
      popup.addEventListener('popup-close', handler)

      popup.close()
      await flush()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent)
    })

    it('should support on/off vanilla listeners', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      const showHandler = vi.fn()
      const closeHandler = vi.fn()
      popup.on('show', showHandler)
      popup.on('close', closeHandler)

      popup.show()
      await flush()
      expect(showHandler).toHaveBeenCalledTimes(1)

      popup.close()
      await flush()
      expect(closeHandler).toHaveBeenCalledTimes(1)

      // off should remove the listener
      popup.off('show', showHandler)
      popup.show()
      await flush()
      expect(showHandler).toHaveBeenCalledTimes(1) // still 1
      popup.close()
      await flush()
    })
  })

  // ── Close on Escape ──

  describe('Close on Escape', () => {
    it('should close when Escape is pressed and closeOnEscape=true', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150, closeOnEscape: true }) as any
      cleanups.push(popup)

      popup.show()
      await flush()
      expect(popup.state).toBe('attached')

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(popup.state).toBe('closed')
    })

    it('should NOT close on Escape when closeOnEscape=false', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150, closeOnEscape: false }) as any
      cleanups.push(popup)

      popup.show()
      await flush()
      expect(popup.state).toBe('attached')

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flush()
      expect(popup.state).toBe('attached')
      popup.close()
    })
  })

  // ── State ──

  describe('State', () => {
    it('should return "closed" initially', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.state).toBe('closed')
    })

    it('should return "attached" after show', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      popup.show()
      await flush()
      expect(popup.state).toBe('attached')
      popup.close()
    })

    it('should return "closed" after close', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      popup.show()
      await flush()
      popup.close()
      await flush()
      expect(popup.state).toBe('closed')
    })
  })

  // ── destroy() ──

  describe('destroy()', () => {
    it('should clean up and prevent further show', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      popup.show()
      await flush()
      expect(popup.state).toBe('attached')

      popup.destroy()
      await flush()
      expect(popup.state).toBe('closed')

      // Attempting to show after destroy should be a no-op
      popup.show()
      await flush()
      expect(popup.state).toBe('closed')
    })

    it('should clear all listeners on destroy', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)

      const handler = vi.fn()
      popup.on('show', handler)
      popup.destroy()

      // Listeners map is cleared
      popup.show()
      await flush()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  // ── Missing readonly getters ──

  describe('readonly getters', () => {
    it('element returns internal window or self', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)
      expect(popup.element).toBeInstanceOf(HTMLElement)
    })

    it('window returns UIWindowWC after configure', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)
      expect(popup.window).toBeTruthy()
    })

    it('state is closed by default', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.state).toBe('closed')
    })

    it('visible is false when closed', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.visible).toBe(false)
    })

    it('visible is true when shown', async () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor, width: 150 }) as any
      cleanups.push(popup)
      popup.show()
      await flush()
      expect(popup.visible).toBe(true)
      popup.close()
    })

    it('simulateFocus getter/setter', () => {
      const popup = new UIPopupWC() as any
      cleanups.push(popup)
      expect(popup.simulateFocus).toBe(false)
      popup.simulateFocus = true
      expect(popup.simulateFocus).toBe(true)
    })

    it('overlord setter', () => {
      const anchor = createAnchor()
      const popup = new UIPopupWC({ anchor }) as any
      cleanups.push(popup)
      const win = document.createElement('window-wc') as any
      document.body.appendChild(win)
      cleanups.push(win)
      popup.overlord = win
      // No throw = success
      expect(true).toBe(true)
    })
  })
})
