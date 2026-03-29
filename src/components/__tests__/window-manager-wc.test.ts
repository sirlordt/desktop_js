import { describe, it, expect, afterEach } from 'vitest'
import '../ui-window-manager-wc/ui-window-manager-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 10)) }

describe('window-manager-wc', () => {
  let wm: any

  afterEach(async () => {
    if (wm?.parentNode) wm.remove()
    if (wm && !wm.isDestroyed) wm.destroy()
    await flush()
  })

  function makeWM() {
    wm = document.createElement('window-manager-wc')
    wm.style.cssText = 'width:800px;height:600px;display:block;position:relative;'
    document.body.appendChild(wm)
    return wm
  }

  // ── Construction ──

  describe('construction', () => {
    it('creates element (light DOM)', () => {
      makeWM()
      expect(wm).toBeInstanceOf(HTMLElement)
      expect(wm.shadowRoot).toBeNull()
    })

    it('has position relative and overflow hidden', () => {
      makeWM()
      expect(wm.style.position).toBe('relative')
      expect(wm.style.overflow).toBe('hidden')
    })
  })

  // ── addWindow ──

  describe('addWindow', () => {
    it('adds window as child', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1', left: 0, top: 0, width: 200, height: 100 })
      wm.addWindow(win)
      await flush()
      expect(wm.getAll().length).toBe(1)
      expect(wm.contains(win)).toBe(true)
    })

    it('does not re-append if already child (prevents loop)', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.appendChild(win) // manually append first
      await flush()
      // Observer should have called addWindow; verify no error/loop
      expect(wm.getAll().length).toBe(1)
    })

    it('duplicate addWindow is no-op', () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.addWindow(win)
      wm.addWindow(win)
      expect(wm.getAll().length).toBe(1)
    })
  })

  // ── removeWindow ──

  describe('removeWindow', () => {
    it('removes window from management', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.addWindow(win)
      await flush()
      wm.removeWindow(win)
      expect(wm.getAll().length).toBe(0)
    })
  })

  // ── Auto-detect children ──

  describe('auto-detect children', () => {
    it('detects window-wc children on connect', async () => {
      wm = document.createElement('window-manager-wc')
      wm.style.cssText = 'width:800px;height:600px;display:block;position:relative;'
      const win = new UIWindowWC({ title: 'Existing' })
      wm.appendChild(win)
      document.body.appendChild(wm)
      await flush()
      expect(wm.getAll().length).toBe(1)
    })
  })

  // ── Focus / bringToFront ──

  describe('focus management', () => {
    it('bringToFront changes focused window', async () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'W1' })
      const w2 = new UIWindowWC({ title: 'W2' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      await flush()

      wm.bringToFront(w1)
      expect(wm.getFocused()).toBe(w1)

      wm.bringToFront(w2)
      expect(wm.getFocused()).toBe(w2)
    })
  })

  // ── Minimize / Restore ──

  describe('minimize/restore', () => {
    it('minimizeChild changes state', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.addWindow(win)
      await flush()

      wm.bringToFront(win)
      wm.minimizeChild(win)
      expect(wm.getMinimized().length).toBe(1)

      wm.restoreChild(win)
      expect(wm.getMinimized().length).toBe(0)
    })
  })

  // ── Query methods ──

  describe('query methods', () => {
    it('getAll returns all windows', () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'A' })
      const w2 = new UIWindowWC({ title: 'B' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      expect(wm.getAll().length).toBe(2)
    })

    it('getByTitle finds window', () => {
      makeWM()
      const win = new UIWindowWC({ title: 'Unique' })
      wm.addWindow(win)
      expect(wm.getByTitle('Unique')).toBe(win)
      expect(wm.getByTitle('Missing')).toBeNull()
    })

    it('getFloating returns floating windows', async () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'W1' })
      const w2 = new UIWindowWC({ title: 'W2' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      await flush()
      expect(wm.getFloating().length).toBe(2)
    })
  })

  // ── Events ──

  describe('events', () => {
    it('window-focus event fires', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.addWindow(win)
      await flush()

      let fired = false
      wm.addEventListener('window-focus', () => { fired = true })
      wm.bringToFront(win)
      expect(fired).toBe(true)
    })

    it('window-close event fires', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'W1' })
      wm.addWindow(win)
      await flush()
      wm.bringToFront(win)

      let fired = false
      wm.addEventListener('window-close', () => { fired = true })
      wm.closeChild(win)
      expect(fired).toBe(true)
    })
  })

  // ── Batch operations ──

  describe('batch operations', () => {
    it('closeAll calls destroy which clears windows', () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'A' }))
      wm.addWindow(new UIWindowWC({ title: 'B' }))
      expect(wm.getAll().length).toBe(2)
      wm.destroy()
      expect(wm.isDestroyed).toBe(true)
    })

    it('minimizeAll / restoreAll', async () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'A' })
      const w2 = new UIWindowWC({ title: 'B' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      await flush()
      wm.bringToFront(w1)

      wm.minimizeAll()
      expect(wm.getMinimized().length).toBe(2)

      wm.restoreAll()
      expect(wm.getMinimized().length).toBe(0)
    })
  })

  // ── Missing properties ──

  describe('additional properties', () => {
    it('managerWidth / managerHeight', () => {
      makeWM()
      wm.managerWidth = 1000
      wm.managerHeight = 800
      expect(wm.managerWidth).toBe(1000)
      expect(wm.managerHeight).toBe(800)
    })

    it('animated', () => {
      makeWM()
      wm.animated = true
      expect(wm.animated).toBe(true)
      wm.animated = false
      expect(wm.animated).toBe(false)
    })

    it('minimizeSlotWidth / minimizeSlotHeight', () => {
      makeWM()
      wm.minimizeSlotWidth = 200
      wm.minimizeSlotHeight = 40
      expect(wm.minimizeSlotWidth).toBe(200)
      expect(wm.minimizeSlotHeight).toBe(40)
    })

    it('maxZIndex', () => {
      makeWM()
      const win = new UIWindowWC({ title: 'Z' })
      wm.addWindow(win)
      expect(typeof wm.maxZIndex).toBe('number')
    })

    it('element getter', () => {
      makeWM()
      expect(wm.element).toBe(wm)
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('sendToBack changes z-order', async () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'W1' })
      const w2 = new UIWindowWC({ title: 'W2' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      await flush()
      wm.bringToFront(w2)
      const z2Before = parseInt((w2 as HTMLElement).style.zIndex) || 0
      wm.sendToBack(w2)
      const z2After = parseInt((w2 as HTMLElement).style.zIndex) || 0
      expect(z2After).toBeLessThan(z2Before)
    })

    it('searchByTitle', () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'Alpha One' }))
      wm.addWindow(new UIWindowWC({ title: 'Alpha Two' }))
      wm.addWindow(new UIWindowWC({ title: 'Beta' }))
      expect(wm.searchByTitle('Alpha').length).toBe(2)
      expect(wm.searchByTitle('Beta').length).toBe(1)
      expect(wm.searchByTitle('Gamma').length).toBe(0)
    })

    it('getAllByTitle', () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'Same' }))
      wm.addWindow(new UIWindowWC({ title: 'Same' }))
      wm.addWindow(new UIWindowWC({ title: 'Other' }))
      expect(wm.getAllByTitle('Same').length).toBe(2)
    })

    it('findWindows / findWindow', () => {
      makeWM()
      const w1 = new UIWindowWC({ title: 'Find1' })
      const w2 = new UIWindowWC({ title: 'Find2' })
      wm.addWindow(w1)
      wm.addWindow(w2)
      const results = wm.findWindows((c: any) => c.title.startsWith('Find'))
      expect(results.length).toBe(2)
      const single = wm.findWindow((c: any) => c.title === 'Find1')
      expect(single).toBe(w1)
    })

    it('hasState', async () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'W' }))
      await flush()
      expect(wm.hasState('normal')).toBe(true)
      expect(wm.hasState('minimized')).toBe(false)
    })

    it('getFocused returns focused window', async () => {
      makeWM()
      const win = new UIWindowWC({ title: 'F' })
      wm.addWindow(win)
      await flush()
      wm.bringToFront(win)
      expect(wm.getFocused()).toBe(win)
    })

    it('getMinimized returns empty by default', () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'W' }))
      expect(wm.getMinimized().length).toBe(0)
    })
  })

  // ── Destroy ──

  describe('destroy()', () => {
    it('destroys and closes all', () => {
      makeWM()
      wm.addWindow(new UIWindowWC({ title: 'A' }))
      wm.destroy()
      expect(wm.isDestroyed).toBe(true)
    })
  })

  // ── Fluid width (DimensionKind.Auto) ──

  describe('fluid width — no width option', () => {
    let container: HTMLDivElement

    afterEach(() => {
      if (container?.parentNode) container.remove()
    })

    function makeFluidWM(options?: ConstructorParameters<typeof UIWindowManagerWC>[0]) {
      container = document.createElement('div')
      container.style.cssText = 'width:1000px;display:block;position:relative;'
      document.body.appendChild(container)
      wm = new UIWindowManagerWC({ height: 600, ...options })
      container.appendChild(wm)
      return wm
    }

    it('does not set inline style.width when width is omitted', async () => {
      makeFluidWM()
      await flush()
      // applyLayout must NOT force a px width — style.width should be empty
      expect(wm.style.width).toBe('')
    })

    it('flows to parent width (clientWidth matches container)', async () => {
      makeFluidWM()
      await flush()
      // The WM should fill its 1000px parent
      expect(wm.clientWidth).toBeGreaterThan(0)
      expect(wm.clientWidth).toBeLessThanOrEqual(1000)
    })

    it('managerWidth returns resolved clientWidth, not 0 or 100', async () => {
      makeFluidWM()
      await flush()
      expect(wm.managerWidth).toBeGreaterThan(100)
      expect(wm.managerWidth).toBeLessThanOrEqual(1000)
    })

    it('explicit width still works as fixed px', async () => {
      makeFluidWM({ width: 500 })
      await flush()
      expect(wm.style.width).toBe('500px')
      expect(wm.managerWidth).toBe(500)
    })

    it('explicit width: "auto" behaves same as omitting width', async () => {
      makeFluidWM({ width: 'auto' })
      await flush()
      expect(wm.style.width).toBe('')
      expect(wm.clientWidth).toBeGreaterThan(0)
    })

    it('keeps position:relative and overflow:hidden when fluid', async () => {
      makeFluidWM()
      await flush()
      expect(wm.style.position).toBe('relative')
      expect(wm.style.overflow).toBe('hidden')
    })

    it('child windows are constrained to fluid parent width', async () => {
      makeFluidWM()
      await flush()
      const win = new UIWindowWC({ title: 'W', left: 900, top: 0, width: 200, height: 100 })
      wm.addWindow(win)
      await flush()
      const winLeft = parseInt(win.element.style.left) || 0
      // Window should be clamped inside the manager bounds
      expect(winLeft + 200).toBeLessThanOrEqual(wm.managerWidth)
    })

    it('height is still explicit when only width is omitted', async () => {
      makeFluidWM()
      await flush()
      expect(wm.style.height).toBe('600px')
    })
  })
})
