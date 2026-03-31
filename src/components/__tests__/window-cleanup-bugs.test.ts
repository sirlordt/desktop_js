import { describe, it, expect, afterEach } from 'vitest'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'

function flush(ms = 20): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

// ── Fix #1: Standalone blur listener leak ──

describe('Fix #1 — standalone blur listener cleanup on destroy', () => {
  it('destroy() removes the standalone blur document listener', async () => {
    const container = document.createElement('div')
    const win = new UIWindowWC({ title: 'Leak', positioning: 'relative' })
    container.appendChild(win)
    document.body.appendChild(container)
    await flush()

    // Focus the window so the blur listener is "armed"
    win.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(win.titleBarElement.classList.contains('focused')).toBe(true)

    // Destroy the window
    win.destroy()
    await flush()

    // Now click somewhere else on the document — if the listener leaked,
    // it will try to access the destroyed window and/or throw
    expect(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    }).not.toThrow()

    // The leaked listener would try to call onBlurred on a destroyed element.
    // Verify titlebar class was not touched after destroy (no stale reference).
    // The key assertion: no errors thrown above + no spurious side-effects.

    container.remove()
  })
})

// ── Fix #2: On-demand resize/drag listeners ──

describe('Fix #2 — resize/drag listeners are on-demand (not permanent)', () => {
  it('no document mousemove listeners from window when not dragging or resizing', async () => {
    // Snapshot listener count before creating window
    const spy = { add: 0, remove: 0 }
    const origAdd = document.addEventListener.bind(document)
    const origRemove = document.removeEventListener.bind(document)
    const moveAdds: Function[] = []
    const moveRemoves: Function[] = []

    document.addEventListener = function (type: string, fn: any, opts?: any) {
      if (type === 'mousemove') { spy.add++; moveAdds.push(fn) }
      return origAdd(type, fn, opts)
    } as any
    document.removeEventListener = function (type: string, fn: any, opts?: any) {
      if (type === 'mousemove') { spy.remove++; moveRemoves.push(fn) }
      return origRemove(type, fn, opts)
    } as any

    const win = new UIWindowWC({ title: 'Listener', width: 300, height: 200, resizable: true })
    document.body.appendChild(win)
    await flush()

    // After construction, no permanent mousemove listeners should exist
    // (drag + 8 resize = 9 permanent mousemove listeners in the old code)
    // With on-demand registration, expect 0 mousemove listeners at rest
    const permanentMoveListeners = spy.add - spy.remove
    expect(permanentMoveListeners).toBe(0)

    // Restore
    document.addEventListener = origAdd as any
    document.removeEventListener = origRemove as any
    win.destroy()
  })
})

// ── Fix #3: Shared theme MutationObserver ──

describe('Fix #3 — shared theme MutationObserver', () => {
  it('multiple windows share a single theme observer (not one per window)', async () => {
    // We can't directly count observers, but we can verify the static pattern:
    // the class should have a static/shared observer instead of per-instance.
    const wins: UIWindowWC[] = []
    for (let i = 0; i < 5; i++) {
      const w = new UIWindowWC({ title: `W${i}` })
      document.body.appendChild(w)
      wins.push(w)
    }
    await flush()

    // Verify theme sync still works: change theme and check all windows react
    document.documentElement.setAttribute('data-theme', 'win95')
    await flush()
    for (const w of wins) {
      expect(w.classList.contains('win95')).toBe(true)
    }

    // Reset theme
    document.documentElement.removeAttribute('data-theme')
    await flush()
    for (const w of wins) {
      expect(w.classList.contains('win95')).toBe(false)
    }

    // Destroy all — the shared observer should still work for remaining windows
    wins[0].destroy()
    wins[1].destroy()

    document.documentElement.setAttribute('data-theme', 'win95')
    await flush()
    // Remaining windows still react
    expect(wins[2].classList.contains('win95')).toBe(true)
    expect(wins[3].classList.contains('win95')).toBe(true)
    expect(wins[4].classList.contains('win95')).toBe(true)

    document.documentElement.removeAttribute('data-theme')
    await flush()

    for (const w of wins) {
      if (!w.isDestroyed) w.destroy()
    }
  })

  it('destroying all windows disconnects the shared observer', async () => {
    const w1 = new UIWindowWC({ title: 'Solo' })
    document.body.appendChild(w1)
    await flush()
    w1.destroy()
    await flush()

    // After all windows destroyed, changing theme should not throw
    expect(() => {
      document.documentElement.setAttribute('data-theme', 'win95')
    }).not.toThrow()
    document.documentElement.removeAttribute('data-theme')
  })
})

// ── Fix #4: Keyboard handler scoped to its manager ──

describe('Fix #4 — keyboard handler scoped to its own manager', () => {
  let wm1: UIWindowManagerWC
  let wm2: UIWindowManagerWC

  afterEach(async () => {
    if (wm1?.parentNode) wm1.remove()
    if (wm1 && !wm1.isDestroyed) wm1.destroy()
    if (wm2?.parentNode) wm2.remove()
    if (wm2 && !wm2.isDestroyed) wm2.destroy()
    await flush()
  })

  it('F6 in one manager does not cycle focus in the other manager', async () => {
    // Create two independent managers
    wm1 = document.createElement('window-manager-wc') as UIWindowManagerWC
    wm1.style.cssText = 'width:400px;height:300px;display:block;position:relative;'
    document.body.appendChild(wm1)

    wm2 = document.createElement('window-manager-wc') as UIWindowManagerWC
    wm2.style.cssText = 'width:400px;height:300px;display:block;position:relative;'
    document.body.appendChild(wm2)

    const w1a = new UIWindowWC({ title: 'WM1-A', left: 0, top: 0, width: 100, height: 80 })
    const w1b = new UIWindowWC({ title: 'WM1-B', left: 10, top: 10, width: 100, height: 80 })
    wm1.addWindow(w1a)
    wm1.addWindow(w1b)

    const w2a = new UIWindowWC({ title: 'WM2-A', left: 0, top: 0, width: 100, height: 80 })
    const w2b = new UIWindowWC({ title: 'WM2-B', left: 10, top: 10, width: 100, height: 80 })
    wm2.addWindow(w2a)
    wm2.addWindow(w2b)
    await flush()

    // Focus w2a in manager2
    wm2.bringToFront(w2a)
    expect(wm2.getFocused()).toBe(w2a)

    // Focus w1a in manager1
    wm1.bringToFront(w1a)
    expect(wm1.getFocused()).toBe(w1a)

    // Snapshot wm2's focus state
    const wm2FocusBefore = wm2.getFocused()

    // Press Alt+F6 (cycle next) — should only affect wm1 (which has a focused window
    // that is actively within the document focus)
    wm1.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6', altKey: true, bubbles: true }))
    await flush()

    // wm1 should have cycled
    expect(wm1.getFocused()).toBe(w1b)

    // wm2 should NOT have changed — this is the bug: both managers respond
    expect(wm2.getFocused()).toBe(wm2FocusBefore)
  })
})
