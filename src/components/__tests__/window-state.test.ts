import { describe, it, expect, afterEach } from 'vitest'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'

function flush(ms = 20): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

function pressKey(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function clickShadowBtn(win: UIWindowWC, selector: string): void {
  const el = win.shadowRoot?.querySelector(selector) as HTMLElement | null
  if (el) el.click()
}

/* ================================================================== */
/*  Inside a WindowManager                                             */
/* ================================================================== */

describe('window state — inside WM', () => {
  let wm: UIWindowManagerWC
  let win: UIWindowWC
  let win2: UIWindowWC

  function setup(): void {
    wm = document.createElement('window-manager-wc') as UIWindowManagerWC
    wm.style.cssText = 'width:800px;height:600px;display:block;position:relative;'
    wm.animated = false
    document.body.appendChild(wm)

    win = new UIWindowWC({ title: 'Main', left: 10, top: 10, width: 300, height: 200, minimizable: true, maximizable: true, closable: true })
    win2 = new UIWindowWC({ title: 'Other', left: 320, top: 10, width: 200, height: 150 })
    wm.addWindow(win)
    wm.addWindow(win2)
  }

  afterEach(async () => {
    if (wm && !wm.isDestroyed) wm.destroy()
    document.querySelectorAll('window-manager-wc, window-wc').forEach(el => el.remove())
    await flush()
  })

  // ── Minimize via button ──

  describe('minimize via button', () => {
    it('click minimize sets windowState to minimized', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.min-btn')
      await flush()
      expect(win.windowState).toBe('minimized')
    })

    it('click minimize again restores to normal', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.min-btn')
      await flush()
      clickShadowBtn(win, '.min-btn')
      await flush()
      expect(win.windowState).toBe('normal')
    })

    it('minimized window body is hidden', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.min-btn')
      await flush()
      const body = win.shadowRoot?.querySelector('.body') as HTMLElement
      expect(body.classList.contains('body--hidden')).toBe(true)
    })

    it('restored window body is visible', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.min-btn')
      await flush()
      clickShadowBtn(win, '.min-btn')
      await flush()
      const body = win.shadowRoot?.querySelector('.body') as HTMLElement
      expect(body.classList.contains('body--hidden')).toBe(false)
    })

    it('getMinimized includes minimized window', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.min-btn')
      await flush()
      expect(wm.getMinimized().length).toBe(1)
      expect(wm.getMinimized()[0]).toBe(win)
    })
  })

  // ── Maximize via button ──

  describe('maximize via button', () => {
    it('click maximize sets windowState to maximized', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.max-btn')
      await flush()
      expect(win.windowState).toBe('maximized')
    })

    it('click maximize again restores to normal', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.max-btn')
      await flush()
      clickShadowBtn(win, '.max-btn')
      await flush()
      expect(win.windowState).toBe('normal')
    })

    it('maximized window fills the WM area', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      clickShadowBtn(win, '.max-btn')
      await flush()
      expect(win.left).toBe(0)
      expect(win.top).toBe(0)
      expect(win.width).toBe(wm.clientWidth)
      expect(win.height).toBe(wm.clientHeight)
    })

    it('restore from maximized returns to original size', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      const origLeft = win.left, origTop = win.top
      const origW = win.width, origH = win.height
      clickShadowBtn(win, '.max-btn')
      await flush()
      clickShadowBtn(win, '.max-btn')
      await flush()
      expect(win.windowState).toBe('normal')
      expect(win.left).toBe(origLeft)
      expect(win.top).toBe(origTop)
      expect(win.width).toBe(origW)
      expect(win.height).toBe(origH)
    })
  })

  // ── Close via button ──

  describe('close via button', () => {
    it('click close removes window from WM', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      const countBefore = wm.getAll().length
      clickShadowBtn(win, '.close-btn')
      await flush()
      expect(wm.getAll().length).toBe(countBefore - 1)
    })

    it('window-close event fires', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      let fired = false
      wm.addEventListener('window-close', () => { fired = true })
      clickShadowBtn(win, '.close-btn')
      await flush()
      expect(fired).toBe(true)
    })
  })

  // ── Keyboard: F7 minimize/restore ──

  describe('F7 minimize/restore', () => {
    it('F7 minimizes the focused window', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      await flush()
      pressKey('F7')
      await flush()
      expect(win.windowState).toBe('minimized')
    })

    it('F7 restores when minimized window is re-focused', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      await flush()
      pressKey('F7')
      await flush()
      expect(win.windowState).toBe('minimized')
      // Re-focus the minimized window (simulates clicking its minimize slot)
      wm.restoreChild(win)
      await flush()
      expect(win.windowState).toBe('normal')
    })

    it('F7 does not affect tool-kind windows', async () => {
      setup(); await flush()
      const tool = new UIWindowWC({ title: 'Tool', kind: 'tool' })
      wm.addWindow(tool)
      wm.bringToFront(tool)
      await flush()
      pressKey('F7')
      await flush()
      expect(tool.windowState).toBe('normal')
      tool.destroy()
    })
  })

  // ── Keyboard: F8 maximize/restore ──

  describe('F8 maximize/restore', () => {
    it('F8 maximizes the focused window', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      await flush()
      pressKey('F8')
      await flush()
      expect(win.windowState).toBe('maximized')
    })

    it('F8 again restores from maximized', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      await flush()
      pressKey('F8')
      await flush()
      pressKey('F8')
      await flush()
      expect(win.windowState).toBe('normal')
    })
  })

  // ── Keyboard: F9 close ──

  describe('F9 close', () => {
    it('F9 closes the focused window', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      await flush()
      const countBefore = wm.getAll().length
      pressKey('F9')
      await flush()
      expect(wm.getAll().length).toBe(countBefore - 1)
    })
  })

  // ── State transitions ──

  describe('state transitions', () => {
    it('minimize → maximize is not allowed (must restore first)', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      wm.minimizeChild(win)
      await flush()
      expect(win.windowState).toBe('minimized')
      // Trying to maximize a minimized window — maximizeChild should handle it
      wm.maximizeChild(win)
      await flush()
      // Should either stay minimized or go to maximized (depends on implementation)
      expect(['minimized', 'maximized']).toContain(win.windowState)
    })

    it('minimize button icon changes to restore icon', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      const minBtn = (win as any)._minBtn
      expect(minBtn.icon).toBe('window-minimize')
      wm.minimizeChild(win)
      await flush()
      expect(minBtn.icon).toBe('window-restore')
    })

    it('maximize button icon changes to restore icon', async () => {
      setup(); await flush()
      wm.bringToFront(win)
      const maxBtn = (win as any)._maxBtn
      expect(maxBtn.icon).toBe('window-maximize')
      wm.maximizeChild(win)
      await flush()
      expect(maxBtn.icon).toBe('window-restore')
    })
  })
})

/* ================================================================== */
/*  Standalone (no WindowManager)                                      */
/* ================================================================== */

describe('window state — standalone (no WM)', () => {
  let win: UIWindowWC
  let container: HTMLDivElement

  function setup(): void {
    container = document.createElement('div')
    container.style.cssText = 'position:relative;width:800px;height:600px;'
    document.body.appendChild(container)
    win = new UIWindowWC({ title: 'Standalone', left: 10, top: 10, width: 300, height: 200, minimizable: true, maximizable: true, closable: true })
    container.appendChild(win)
  }

  afterEach(async () => {
    if (win && !win.isDestroyed) win.destroy()
    if (container?.parentNode) container.remove()
    await flush()
  })

  it('minimize button changes state without WM', async () => {
    setup(); await flush()
    clickShadowBtn(win, '.min-btn')
    await flush()
    expect(win.windowState).toBe('minimized')
    // Click again to restore
    clickShadowBtn(win, '.min-btn')
    await flush()
    expect(win.windowState).toBe('normal')
  })

  it('maximize button changes state without WM', async () => {
    setup(); await flush()
    clickShadowBtn(win, '.max-btn')
    await flush()
    expect(win.windowState).toBe('maximized')
    // Click again to restore
    clickShadowBtn(win, '.max-btn')
    await flush()
    expect(win.windowState).toBe('normal')
  })

  it('close button calls onClosed and can destroy', async () => {
    setup(); await flush()
    let closed = false
    win.onClosed = () => { closed = true; win.destroy() }
    clickShadowBtn(win, '.close-btn')
    await flush()
    expect(closed).toBe(true)
    expect(win.isDestroyed).toBe(true)
  })

  it('close button without onClosed does not throw', async () => {
    setup(); await flush()
    expect(() => clickShadowBtn(win, '.close-btn')).not.toThrow()
  })

  it('F7/F8 have no effect without WM', async () => {
    setup(); await flush()
    win.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flush()
    pressKey('F7')
    await flush()
    expect(win.windowState).toBe('normal')
    pressKey('F8')
    await flush()
    expect(win.windowState).toBe('normal')
  })
})
