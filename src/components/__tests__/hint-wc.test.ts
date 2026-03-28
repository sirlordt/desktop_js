import { describe, it, expect, afterEach } from 'vitest'
import { UIHintWC } from '../ui-hint-wc/ui-hint-wc'

function flush(): Promise<void> {
  return new Promise(r => setTimeout(r, 50))
}

describe('UIHintWC', () => {
  const cleanups: HTMLElement[] = []

  function createAnchor(): HTMLDivElement {
    const anchor = document.createElement('div')
    anchor.style.cssText = 'width:100px;height:30px;position:fixed;left:200px;top:200px;'
    document.body.appendChild(anchor)
    cleanups.push(anchor)
    return anchor
  }

  afterEach(async () => {
    document.querySelectorAll('hint-wc').forEach(el => el.remove())
    for (const el of cleanups) {
      if (el.parentNode) el.parentNode.removeChild(el)
    }
    cleanups.length = 0
    // Clean up any stray hint popup divs
    document.querySelectorAll('body > div[style*="position: fixed"][style*="z-index: 99999"]').forEach(el => el.remove())
    await flush()
  })

  // ── Construction ──

  describe('Construction', () => {
    it('should create a UIHintWC with new UIHintWC()', () => {
      const hint = new UIHintWC()
      cleanups.push(hint)
      expect(hint).toBeInstanceOf(UIHintWC)
      expect(hint).toBeInstanceOf(HTMLElement)
    })

    it('should configure via configure()', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({
        anchor,
        alignment: 'TopCenter',
        margin: 8,
        showDelay: 100,
        hideDelay: 50,
        content: 'Hello',
      })
      expect(hint.anchor).toBe(anchor)
      expect(hint.alignment).toBe('TopCenter')
      expect(hint.margin).toBe(8)
      expect(hint.showDelay).toBe(100)
      expect(hint.hideDelay).toBe(50)
    })
  })

  // ── Properties ──

  describe('Properties', () => {
    it('should get/set alignment', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      expect(hint.alignment).toBe('BottomCenter')
      hint.alignment = 'RightTop'
      expect(hint.alignment).toBe('RightTop')
    })

    it('should get/set margin', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      expect(hint.margin).toBe(2)
      hint.margin = 12
      expect(hint.margin).toBe(12)
    })

    it('should get/set arrow and arrowSize', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'test' })
      expect(hint.arrow).toBe(false)
      hint.arrow = true
      expect(hint.arrow).toBe(true)
      hint.arrowSize = 10
      expect(hint.arrowSize).toBe(10)
    })

    it('should get/set borderRadius, borderColor, borderWidth', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'test' })
      hint.borderRadius = 8
      expect(hint.borderRadius).toBe(8)
      hint.borderColor = '#ff0000'
      expect(hint.borderColor).toBe('#ff0000')
      hint.borderWidth = 2
      expect(hint.borderWidth).toBe(2)
    })

    it('should get/set disabled', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      expect(hint.disabled).toBe(false)
      hint.disabled = true
      expect(hint.disabled).toBe(true)
    })

    it('should get/set name', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'test', name: 'my-hint' })
      expect(hint.name).toBe('my-hint')
      hint.name = 'renamed'
      expect(hint.name).toBe('renamed')
    })

    it('should get/set content', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'initial' })
      expect(hint.content).toBe('initial')
      hint.content = 'updated'
      expect(hint.content).toBe('updated')
    })

    it('should get/set showDelay and hideDelay', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.showDelay = 500
      hint.hideDelay = 100
      expect(hint.showDelay).toBe(500)
      expect(hint.hideDelay).toBe(100)
    })

    it('should get/set animation and animationDuration', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.animation = 'none'
      expect(hint.animation).toBe('none')
      hint.animationDuration = 250
      expect(hint.animationDuration).toBe(250)
    })

    it('should get/set anchor', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      expect(hint.anchor).toBeNull()
      hint.anchor = anchor
      expect(hint.anchor).toBe(anchor)
    })

    it('should get/set trigger', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.trigger = 'click'
      expect(hint.trigger).toEqual(['click'])
      hint.trigger = ['hover', 'click']
      expect(hint.trigger).toEqual(['hover', 'click'])
    })

    it('should get/set marginMouseCursorX and marginMouseCursorY', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.marginMouseCursorX = 20
      hint.marginMouseCursorY = 25
      expect(hint.marginMouseCursorX).toBe(20)
      expect(hint.marginMouseCursorY).toBe(25)
    })
  })

  // ── show/hide ──

  describe('show/hide', () => {
    it('should make visible=true on showImmediate()', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip text', trigger: 'programmatic' })

      expect(hint.visible).toBe(false)
      hint.showImmediate()
      await flush()
      expect(hint.visible).toBe(true)
    })

    it('should make visible=false on hideImmediate()', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip text', trigger: 'programmatic' })

      hint.showImmediate()
      await flush()
      expect(hint.visible).toBe(true)

      hint.hideImmediate()
      await flush()
      expect(hint.visible).toBe(false)
    })
  })

  // ── Content ──

  describe('Content', () => {
    it('should render string content as HTML', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: '<b>Bold</b>', trigger: 'programmatic' })

      hint.showImmediate()
      await flush()

      const popup = hint.popupElement as HTMLElement
      expect(popup.querySelector('b')).not.toBeNull()
      expect(popup.querySelector('b')!.textContent).toBe('Bold')
      hint.hideImmediate()
    })

    it('should render HTMLElement content by appending', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, trigger: 'programmatic' })

      const span = document.createElement('span')
      span.textContent = 'Custom element'
      hint.content = span

      hint.showImmediate()
      await flush()

      const popup = hint.popupElement as HTMLElement
      expect(popup.querySelector('span')).not.toBeNull()
      expect(popup.querySelector('span')!.textContent).toBe('Custom element')
      hint.hideImmediate()
    })
  })

  // ── Disabled ──

  describe('Disabled', () => {
    it('should hide immediately when disabled is set to true', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip', trigger: 'programmatic' })

      hint.showImmediate()
      await flush()
      expect(hint.visible).toBe(true)

      hint.disabled = true
      await flush()
      expect(hint.visible).toBe(false)
    })

    it('should not show when disabled', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip', trigger: 'programmatic', disabled: true })

      hint.showImmediate()
      await flush()
      expect(hint.visible).toBe(false)
    })
  })

  // ── Auto-destroy ──

  describe('Auto-destroy', () => {
    it('should always destroy on disconnect (deferred)', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'test', trigger: 'programmatic' })
      document.body.appendChild(hint)
      document.body.removeChild(hint)
      await flush()
      expect(hint.isDestroyed).toBe(true)
    })

    it('should cancel destroy if re-attached before timeout', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'test', trigger: 'programmatic' })
      document.body.appendChild(hint)
      document.body.removeChild(hint)
      document.body.appendChild(hint) // re-attach immediately
      await flush()
      expect(hint.isDestroyed).toBe(false)
      hint.remove()
      await flush()
    })
  })

  // ── Events ──

  describe('Events', () => {
    it('should fire hint-show CustomEvent on showImmediate()', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip', trigger: 'programmatic' })
      document.body.appendChild(hint)

      let fired = false
      hint.addEventListener('hint-show', () => { fired = true })

      hint.showImmediate()
      await flush()
      expect(fired).toBe(true)
    })

    it('should fire hint-hide CustomEvent on hideImmediate()', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      hint.configure({ anchor, content: 'Tooltip', trigger: 'programmatic' })
      document.body.appendChild(hint)

      hint.showImmediate()
      await flush()

      let fired = false
      hint.addEventListener('hint-hide', () => { fired = true })

      hint.hideImmediate()
      await flush()
      expect(fired).toBe(true)
    })
  })

  // ── Missing readonly getters ──

  describe('readonly getters', () => {
    it('popupElement returns the popup div', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      hint.configure({ anchor, content: 'Test' })
      cleanups.push(hint)
      expect(hint.popupElement).toBeInstanceOf(HTMLDivElement)
    })

    it('visible is false by default', () => {
      const hint = new UIHintWC() as any
      cleanups.push(hint)
      const anchor = createAnchor()
      hint.configure({ anchor, content: 'Test' })
      expect(hint.visible).toBe(false)
    })

    it('currentAlignment returns alignment', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      hint.configure({ anchor, content: 'Test', alignment: 'TopCenter' })
      cleanups.push(hint)
      expect(hint.currentAlignment).toBeTruthy()
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('toggle shows/hides', async () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      hint.configure({ anchor, content: 'Test', showDelay: 0, hideDelay: 0 })
      cleanups.push(hint)
      hint.showImmediate()
      expect(hint.visible).toBe(true)
      hint.toggle()
      await flush()
      expect(hint.visible).toBe(false)
    })

    it('reposition does not throw', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      hint.configure({ anchor, content: 'Test' })
      cleanups.push(hint)
      hint.showImmediate()
      expect(() => hint.reposition()).not.toThrow()
      hint.hideImmediate()
    })

    it('on/off vanilla listeners', () => {
      const anchor = createAnchor()
      const hint = new UIHintWC() as any
      hint.configure({ anchor, content: 'Test' })
      cleanups.push(hint)
      let count = 0
      const handler = () => { count++ }
      hint.on('show', handler)
      hint.showImmediate()
      expect(count).toBe(1)
      hint.hideImmediate()
      hint.off('show', handler)
      hint.showImmediate()
      expect(count).toBe(1)
      hint.hideImmediate()
    })
  })
})
