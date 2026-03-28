import { describe, it, expect, afterEach } from 'vitest'
import { UIWindowWC } from '../ui-window-wc/ui-window-wc'
import { UIWindowManagerWC } from '../ui-window-manager-wc/ui-window-manager-wc'
import { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'
import '../ui-scrollbar-wc/ui-scrollbar-wc'
import '../ui-scrollbox-wc/ui-scrollbox-wc'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function flush(ms = 30): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

/** Check whether a window's titlebar shows the focused (blue) style */
function hasFocus(win: UIWindowWC): boolean {
  return win.titleBarElement.classList.contains('focused')
}

/** Fire a real mousedown on an element so WM / standalone handlers react */
function mousedown(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }))
}

/** Dispatch a keyboard event on document (capture) */
function pressKey(key: string, opts: Partial<KeyboardEventInit> = {}): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

/* ------------------------------------------------------------------ */
/*  Fixture                                                            */
/* ------------------------------------------------------------------ */

let wm: UIWindowManagerWC
let overlord: UIWindowWC
let win2: UIWindowWC

let popupToolPalette: UIPopupWC   // menu-kind, detachable
let popupSettings: UIPopupWC      // container-kind, detachable
let popupLayers: UIPopupWC        // menu-kind, detachable
let popupPrefs: UIPopupWC         // container-kind, detachable

let btnToolPalette: HTMLButtonElement
let btnSettings: HTMLButtonElement
let btnLayers: HTMLButtonElement
let btnPrefs: HTMLButtonElement

function buildFixture(): void {
  // ── Window Manager ──
  wm = document.createElement('window-manager-wc') as UIWindowManagerWC
  wm.style.cssText = 'width:800px;height:600px;display:block;position:relative;'
  wm.animated = false
  document.body.appendChild(wm)

  // ── Overlord window (Window 1) with 4 anchor buttons ──
  overlord = new UIWindowWC({
    title: 'Overlord', left: 0, top: 0, width: 500, height: 300,
  })
  overlord.contentElement.style.cssText =
    'display:flex;flex-wrap:wrap;gap:8px;padding:10px;align-content:flex-start;'

  function makeBtn(label: string): HTMLButtonElement {
    const b = document.createElement('button')
    b.textContent = label
    b.setAttribute('data-focusable', '')
    b.style.cssText = 'width:130px;height:30px;'
    overlord.contentElement.appendChild(b)
    return b
  }

  btnToolPalette = makeBtn('Tool Palette')
  btnSettings    = makeBtn('Settings')
  btnLayers      = makeBtn('Layers')
  btnPrefs       = makeBtn('Preferences')

  // ── Popup 1: Tool Palette (menu-kind, detachable) ──
  popupToolPalette = new UIPopupWC({
    anchor: btnToolPalette, alignment: 'BottomLeft', width: 180, height: 200,
    title: 'Tool Palette', detachable: true, resizable: true,
  })
  popupToolPalette.overlord = overlord
  for (const text of ['Select', 'Move', 'Rotate']) {
    popupToolPalette.addChild(new UIMenuItemWC({ text }))
  }
  btnToolPalette.addEventListener('click', () => popupToolPalette.toggle())

  // ── Popup 2: Settings (container-kind, detachable) ──
  popupSettings = new UIPopupWC({
    anchor: btnSettings, kind: 'container', alignment: 'BottomLeft',
    width: 220, height: 160, title: 'Settings', detachable: true, resizable: true,
  })
  popupSettings.overlord = overlord
  const settingsDiv = document.createElement('div')
  settingsDiv.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:12px;'
  const cb1 = document.createElement('label')
  cb1.setAttribute('data-focusable', '')
  cb1.tabIndex = 0
  cb1.innerHTML = '<input type="checkbox" checked> Auto-save'
  const cb2 = document.createElement('label')
  cb2.setAttribute('data-focusable', '')
  cb2.tabIndex = 0
  cb2.innerHTML = '<input type="checkbox"> Dark mode'
  settingsDiv.appendChild(cb1); settingsDiv.appendChild(cb2)
  popupSettings.addChild(settingsDiv)
  btnSettings.addEventListener('click', () => popupSettings.toggle())

  // ── Popup 3: Layers (menu-kind, detachable) ──
  popupLayers = new UIPopupWC({
    anchor: btnLayers, alignment: 'BottomLeft', width: 180, height: 180,
    title: 'Layers', detachable: true, resizable: true,
  })
  popupLayers.overlord = overlord
  for (const text of ['Background', 'Foreground', 'Overlay']) {
    popupLayers.addChild(new UIMenuItemWC({ text }))
  }
  btnLayers.addEventListener('click', () => popupLayers.toggle())

  // ── Popup 4: Preferences (container-kind, detachable) ──
  popupPrefs = new UIPopupWC({
    anchor: btnPrefs, kind: 'container', alignment: 'BottomLeft',
    width: 240, height: 180, title: 'Preferences', detachable: true, resizable: true,
  })
  popupPrefs.overlord = overlord
  const prefsDiv = document.createElement('div')
  prefsDiv.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:12px;'
  const inp = document.createElement('input')
  inp.type = 'number'; inp.value = '8'
  inp.setAttribute('data-focusable', '')
  const saveBtn = document.createElement('button')
  saveBtn.textContent = 'Save'
  saveBtn.setAttribute('data-focusable', '')
  prefsDiv.appendChild(inp); prefsDiv.appendChild(saveBtn)
  popupPrefs.addChild(prefsDiv)
  btnPrefs.addEventListener('click', () => popupPrefs.toggle())

  // ── Window 2 ──
  win2 = new UIWindowWC({
    title: 'Window 2', left: 520, top: 0, width: 250, height: 200,
  })

  wm.addWindow(overlord)
  wm.addWindow(win2)
}

/** Open the popup, wait for DOM, dispatch end-drag to trigger _detach */
async function detachPopup(popup: UIPopupWC): Promise<UIWindowWC> {
  popup.show()
  await flush()
  const win = (popup as any)._window as UIWindowWC
  // Simulate end-drag to trigger _detach
  win.dispatchEvent(new CustomEvent('end-drag', {
    bubbles: true, composed: true, cancelable: true,
    detail: { left: win.left, top: win.top, width: win.width, height: win.height },
  }))
  await flush()
  return win
}

function getToolWindow(popup: UIPopupWC): UIWindowWC {
  return (popup as any)._window as UIWindowWC
}

/* ------------------------------------------------------------------ */
/*  Teardown                                                           */
/* ------------------------------------------------------------------ */

afterEach(async () => {
  for (const p of [popupToolPalette, popupSettings, popupLayers, popupPrefs]) {
    if (!p) continue
    const w = (p as any)?._window as UIWindowWC | null
    if (w && !w.isDestroyed) w.destroy()
  }
  if (wm && !wm.isDestroyed) wm.destroy()
  document.querySelectorAll('window-manager-wc, window-wc, popup-wc, button').forEach(el => el.remove())
  await flush()
})

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe('popup detach + tool window focus (WM integration)', () => {

  // ── 1. Detaching creates tool windows ──

  describe('detaching popups', () => {
    it('detach menu-kind popup creates a tool window', async () => {
      buildFixture()
      await flush()
      const toolWin = await detachPopup(popupToolPalette)
      expect(toolWin.isTool).toBe(true)
      expect(toolWin.overlord).toBe(overlord)
      expect(overlord.tools).toContain(toolWin)
    })

    it('detach container-kind popup creates a tool window', async () => {
      buildFixture()
      await flush()
      const toolWin = await detachPopup(popupSettings)
      expect(toolWin.isTool).toBe(true)
      expect(toolWin.overlord).toBe(overlord)
      expect(overlord.tools).toContain(toolWin)
    })

    it('detach all 4 popups creates 4 tool windows', async () => {
      buildFixture()
      await flush()
      await detachPopup(popupToolPalette)
      await detachPopup(popupSettings)
      await detachPopup(popupLayers)
      await detachPopup(popupPrefs)
      expect(overlord.tools.length).toBe(4)
    })
  })

  // ── 2. Tool focus maintained with overlord inside WM ──

  describe('tools maintain focus with overlord', () => {
    it('all tools show focused when overlord is focused', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)
      const ly = await detachPopup(popupLayers)
      const pr = await detachPopup(popupPrefs)

      wm.bringToFront(overlord)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
      expect(hasFocus(ly)).toBe(true)
      expect(hasFocus(pr)).toBe(true)
    })

    it('mousedown on a tool keeps all sibling tools focused (bug fix)', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)
      const ly = await detachPopup(popupLayers)
      const pr = await detachPopup(popupPrefs)

      wm.bringToFront(overlord)
      await flush()

      // Mousedown on Preferences should NOT blur siblings
      mousedown(pr)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
      expect(hasFocus(ly)).toBe(true)
      expect(hasFocus(pr)).toBe(true)
    })

    it('mousedown on overlord keeps all tools focused', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(overlord)
      await flush()

      mousedown(overlord)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
    })
  })

  // ── 3. Focus change between WM windows ──

  describe('switching windows in WM', () => {
    it('switching to Window 2 removes focus from overlord and all tools', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(overlord)
      await flush()
      expect(hasFocus(overlord)).toBe(true)

      // Switch to Window 2
      wm.bringToFront(win2)
      await flush()

      expect(hasFocus(win2)).toBe(true)
      expect(hasFocus(overlord)).toBe(false)
      expect(hasFocus(tp)).toBe(false)
      expect(hasFocus(st)).toBe(false)
    })

    it('switching back to overlord restores focus on all tools', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(win2)
      await flush()
      expect(hasFocus(overlord)).toBe(false)

      wm.bringToFront(overlord)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
      expect(hasFocus(win2)).toBe(false)
    })
  })

  // ── 4. Clicking overlord or tool focuses the group ──

  describe('clicking overlord or tool focuses group', () => {
    it('clicking overlord after Window 2 was focused restores group', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(win2)
      await flush()

      mousedown(overlord)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
      expect(hasFocus(win2)).toBe(false)
    })

    it('clicking a tool window after Window 2 was focused restores group', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(win2)
      await flush()

      // Click on Tool Palette tool window
      mousedown(tp)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)
      expect(hasFocus(st)).toBe(true)
      expect(hasFocus(win2)).toBe(false)
    })
  })

  // ── 5. Tab cycling across overlord + container tools, skipping menu tools ──

  describe('Tab cycling', () => {
    it('Tab cycles through overlord buttons and container-tool focusables, skipping menu-tools', async () => {
      buildFixture()
      await flush()

      // Detach one menu-kind and one container-kind
      await detachPopup(popupToolPalette) // menu → no data-focusable children in tab cycle
      await detachPopup(popupSettings)    // container → cb1, cb2 are focusable

      wm.bringToFront(overlord)
      await flush()

      // Collect all group-focusable elements
      const allFocusable = (overlord as any)._getAllGroupFocusable() as HTMLElement[]

      // Overlord has 4 buttons (data-focusable), Settings tool has 2 labels (data-focusable)
      // Tool Palette (menu) should NOT contribute focusable children
      const overlordFocusable = (overlord as any)._getBodyFocusable() as HTMLElement[]
      const toolPaletteWin = getToolWindow(popupToolPalette)
      const settingsWin = getToolWindow(popupSettings)
      const toolPaletteFocusable = (toolPaletteWin as any)._getBodyFocusable() as HTMLElement[]
      const settingsFocusable = (settingsWin as any)._getBodyFocusable() as HTMLElement[]

      // Menu-kind tool should have 0 focusable (menu items are not data-focusable when detached)
      expect(toolPaletteFocusable.length).toBe(0)
      // Container-kind tool should have focusable children
      expect(settingsFocusable.length).toBeGreaterThan(0)
      // Total = overlord buttons + settings labels
      expect(allFocusable.length).toBe(overlordFocusable.length + settingsFocusable.length)
    })

    it('Tab moves focus forward through the group', async () => {
      buildFixture()
      await flush()
      await detachPopup(popupSettings) // container tool with focusable children

      wm.bringToFront(overlord)
      await flush()

      // Focus the first button in the overlord
      btnToolPalette.focus()
      await flush()

      const allFocusable = (overlord as any)._getAllGroupFocusable() as HTMLElement[]
      const startIdx = allFocusable.indexOf(btnToolPalette)
      expect(startIdx).toBeGreaterThanOrEqual(0)

      // Press Tab to advance
      pressKey('Tab')
      await flush()

      // The next focusable element should now have focus
      const active = (UIWindowWC as any)._deepActiveElement?.() ?? document.activeElement
      const nextExpected = allFocusable[(startIdx + 1) % allFocusable.length]
      expect(active).toBe(nextExpected)
    })

    it('Tab into container tool brings it to front of sibling tools', async () => {
      buildFixture()
      await flush()
      // Detach Settings (container) first, then Tool Palette (menu) — Settings starts behind
      const st = await detachPopup(popupSettings)
      const tp = await detachPopup(popupToolPalette)

      wm.bringToFront(overlord)
      await flush()

      expect(st.zIndex).toBeLessThan(tp.zIndex)

      // Tab until focus enters Settings' first child
      // Group focusable = [4 overlord buttons, Settings' cb1, Settings' cb2]
      // Tool Palette (menu) has no focusable children
      const allFocusable = (overlord as any)._getAllGroupFocusable() as HTMLElement[]
      const overlordCount = (overlord as any)._getBodyFocusable().length

      // Focus last overlord button, then Tab once to enter Settings
      const lastOverlordBtn = allFocusable[overlordCount - 1]
      lastOverlordBtn.focus()
      await flush()
      pressKey('Tab')
      await flush()

      // Settings should now be in front
      expect(st.zIndex).toBeGreaterThan(tp.zIndex)
    })
  })

  // ── 6. Arrow keys in detached menu-kind tool ──

  describe('arrow keys in menu-kind tool', () => {
    it('anchor focus brings menu tool to front immediately (no arrow needed)', async () => {
      buildFixture()
      await flush()
      // Detach Tool Palette first, then Settings — Tool Palette starts behind
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(overlord)
      await flush()

      expect(tp.zIndex).toBeLessThan(st.zIndex)

      // Focus the Tool Palette anchor — should bring its tool to front
      btnToolPalette.focus()
      await flush()

      expect(tp.zIndex).toBeGreaterThan(st.zIndex)
    })

    it('ArrowDown highlights next menu item when anchor has focus', async () => {
      buildFixture()
      await flush()
      await detachPopup(popupToolPalette)

      wm.bringToFront(overlord)
      await flush()

      // Focus the anchor button
      btnToolPalette.focus()
      await flush()

      // Press ArrowDown — should highlight first menu item
      pressKey('ArrowDown')
      await flush()

      const activeIdx = (popupToolPalette as any)._activeIndex
      expect(activeIdx).toBe(0)
    })

    it('ArrowDown wraps around menu items', async () => {
      buildFixture()
      await flush()
      await detachPopup(popupToolPalette)

      wm.bringToFront(overlord)
      await flush()

      btnToolPalette.focus()
      await flush()

      // Navigate through all items (starts at -1, so length+1 presses to wrap)
      const items = (popupToolPalette as any)._getMenuItems() as HTMLElement[]
      for (let i = 0; i <= items.length; i++) {
        pressKey('ArrowDown')
      }
      await flush()

      // After going past the last item, should wrap to first
      const activeIdx = (popupToolPalette as any)._activeIndex
      expect(activeIdx).toBe(0)
    })

    it('ArrowUp navigates backward in menu items', async () => {
      buildFixture()
      await flush()
      await detachPopup(popupToolPalette)

      wm.bringToFront(overlord)
      await flush()

      btnToolPalette.focus()
      await flush()

      // ArrowUp from start should go to last item
      pressKey('ArrowUp')
      await flush()

      const items = (popupToolPalette as any)._getMenuItems() as HTMLElement[]
      const activeIdx = (popupToolPalette as any)._activeIndex
      expect(activeIdx).toBe(items.length - 1)
    })
  })

  // ── 7. Tool z-order: clicking or arrow-keying brings tool to front ──

  describe('tool z-order', () => {
    it('mousedown on a container tool brings it to front of sibling tools', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)
      const ly = await detachPopup(popupLayers)
      const pr = await detachPopup(popupPrefs)

      wm.bringToFront(overlord)
      await flush()

      // Settings was detached second, so it has a lower z-index than later tools
      const zBefore = st.zIndex
      expect(pr.zIndex).toBeGreaterThan(zBefore)

      // Click on Settings — should bring it to front
      mousedown(st)
      await flush()

      expect(st.zIndex).toBeGreaterThan(tp.zIndex)
      expect(st.zIndex).toBeGreaterThan(ly.zIndex)
      expect(st.zIndex).toBeGreaterThan(pr.zIndex)
    })

    it('container tool comes to front on detach (first child gets focus)', async () => {
      buildFixture()
      await flush()
      // Detach Tool Palette (menu) first, then Layers (menu), then Settings (container)
      const tp = await detachPopup(popupToolPalette)
      const ly = await detachPopup(popupLayers)
      // Settings is detached last → its first child gets focus → should be on top
      const st = await detachPopup(popupSettings)

      // Settings (container) should be in front because _bringToolToFront fires on detach
      expect(st.zIndex).toBeGreaterThan(tp.zIndex)
      expect(st.zIndex).toBeGreaterThan(ly.zIndex)
    })

    it('mousedown on container tool content brings it to front', async () => {
      buildFixture()
      await flush()
      // Detach Settings first, then Tool Palette — so Settings starts behind
      const st = await detachPopup(popupSettings)
      const tp = await detachPopup(popupToolPalette)

      wm.bringToFront(overlord)
      await flush()

      // Settings was detached first → lower z-index (behind Tool Palette)
      expect(st.zIndex).toBeLessThan(tp.zIndex)

      // Click on Settings content — should bring it to front
      mousedown(st)
      await flush()

      expect(st.zIndex).toBeGreaterThan(tp.zIndex)
    })

    it('ArrowDown in menu tool brings it to front of sibling tools', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)
      const ly = await detachPopup(popupLayers)

      wm.bringToFront(overlord)
      await flush()

      // Tool Palette was detached first, lowest z-index among tools
      expect(tp.zIndex).toBeLessThan(st.zIndex)
      expect(tp.zIndex).toBeLessThan(ly.zIndex)

      // Focus its anchor and press ArrowDown
      btnToolPalette.focus()
      await flush()
      pressKey('ArrowDown')
      await flush()

      // Tool Palette should now be in front
      expect(tp.zIndex).toBeGreaterThan(st.zIndex)
      expect(tp.zIndex).toBeGreaterThan(ly.zIndex)
    })

    it('ArrowUp in menu tool brings it to front of sibling tools', async () => {
      buildFixture()
      await flush()
      const tp = await detachPopup(popupToolPalette)
      const st = await detachPopup(popupSettings)

      wm.bringToFront(overlord)
      await flush()

      expect(tp.zIndex).toBeLessThan(st.zIndex)

      btnToolPalette.focus()
      await flush()
      pressKey('ArrowUp')
      await flush()

      expect(tp.zIndex).toBeGreaterThan(st.zIndex)
    })
  })

  // ── 8. Attached popup window doesn't steal WM focus ──

  describe('attached popup does not interfere with WM focus', () => {
    it('mousedown on attached popup window does not blur overlord tools', async () => {
      buildFixture()
      await flush()

      // Detach one popup to create a tool
      const tp = await detachPopup(popupToolPalette)
      wm.bringToFront(overlord)
      await flush()

      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)

      // Now open Settings as attached (NOT detached)
      popupSettings.show()
      await flush()

      const settingsWin = getToolWindow(popupSettings)

      // Mousedown on the attached popup's window
      mousedown(settingsWin)
      await flush()

      // The overlord and its tools should NOT lose focus
      expect(hasFocus(overlord)).toBe(true)
      expect(hasFocus(tp)).toBe(true)

      popupSettings.close()
      await flush()
    })
  })

  // ── 9. Standalone (no WM) — Tab cycling and z-order ──

  describe('standalone (no WM) tool focus and z-order', () => {
    let standaloneOverlord: UIWindowWC
    let standaloneWin2: UIWindowWC
    let saPopupMenu: UIPopupWC
    let saPopupContainer: UIPopupWC
    let saBtnMenu: HTMLElement
    let saBtnContainer: HTMLElement
    let saContainer: HTMLDivElement

    function buildStandalone(): void {
      saContainer = document.createElement('div')
      saContainer.style.cssText = 'position:relative;width:800px;height:600px;display:flex;gap:16px;'
      document.body.appendChild(saContainer)

      standaloneOverlord = new UIWindowWC({
        title: 'SA Overlord', left: 0, top: 0, width: 400, height: 250, positioning: 'relative',
      })
      standaloneOverlord.contentElement.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:10px;'

      // Button 1: anchor for menu-kind popup
      saBtnMenu = document.createElement('button')
      saBtnMenu.textContent = 'Open Menu'
      saBtnMenu.setAttribute('data-focusable', '')
      saBtnMenu.tabIndex = 0
      standaloneOverlord.contentElement.appendChild(saBtnMenu)

      // Button 2: anchor for container-kind popup
      saBtnContainer = document.createElement('button')
      saBtnContainer.textContent = 'Open Container'
      saBtnContainer.setAttribute('data-focusable', '')
      saBtnContainer.tabIndex = 0
      standaloneOverlord.contentElement.appendChild(saBtnContainer)

      // Menu popup
      saPopupMenu = new UIPopupWC({
        anchor: saBtnMenu, alignment: 'BottomLeft', width: 180, height: 200,
        title: 'Menu Tool', detachable: true, resizable: true,
      })
      saPopupMenu.overlord = standaloneOverlord
      for (const text of ['Item A', 'Item B', 'Item C']) {
        saPopupMenu.addChild(new UIMenuItemWC({ text }))
      }
      saBtnMenu.addEventListener('click', () => saPopupMenu.toggle())

      // Container popup
      saPopupContainer = new UIPopupWC({
        anchor: saBtnContainer, kind: 'container', alignment: 'BottomLeft',
        width: 200, height: 150, title: 'Container Tool', detachable: true, resizable: true,
      })
      saPopupContainer.overlord = standaloneOverlord
      const div = document.createElement('div')
      div.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:10px;'
      const cb = document.createElement('label')
      cb.setAttribute('data-focusable', '')
      cb.tabIndex = 0
      cb.innerHTML = '<input type="checkbox"> Option'
      const applyBtn = document.createElement('button')
      applyBtn.textContent = 'Apply'
      applyBtn.setAttribute('data-focusable', '')
      applyBtn.tabIndex = 0
      div.appendChild(cb); div.appendChild(applyBtn)
      saPopupContainer.addChild(div)
      saBtnContainer.addEventListener('click', () => saPopupContainer.toggle())

      // Second standalone window (for focus alternation)
      standaloneWin2 = new UIWindowWC({
        title: 'SA Window 2', left: 0, top: 0, width: 300, height: 200, positioning: 'relative',
      })

      saContainer.appendChild(standaloneOverlord)
      saContainer.appendChild(standaloneWin2)
    }

    afterEach(async () => {
      for (const p of [saPopupMenu, saPopupContainer]) {
        if (!p) continue
        const w = (p as any)?._window as UIWindowWC | null
        if (w && !w.isDestroyed) w.destroy()
      }
      if (standaloneOverlord && !standaloneOverlord.isDestroyed) standaloneOverlord.destroy()
      if (standaloneWin2 && !standaloneWin2.isDestroyed) standaloneWin2.destroy()
      if (saContainer?.parentNode) saContainer.remove()
      await flush()
    })

    it('Tab from last container child moves focus to first overlord child (not stolen back)', async () => {
      buildStandalone()
      await flush()
      await detachPopup(saPopupMenu)
      const ct = await detachPopup(saPopupContainer)
      // Focus overlord to initialize
      standaloneOverlord.onFocused()
      await flush()

      // Focus Apply (last focusable in the group)
      const allFocusable = (standaloneOverlord as any)._getAllGroupFocusable() as HTMLElement[]
      const applyEl = allFocusable[allFocusable.length - 1]
      applyEl.focus()
      await flush()

      // Press Tab — should wrap to first element (Open Menu button)
      pressKey('Tab')
      await flush()

      const active = (UIWindowWC as any)._deepActiveElement?.() ?? document.activeElement
      // Focus should be on the first element, NOT stolen back to Apply
      expect(active).not.toBe(applyEl)
      // Walk up from active to find containing window
      let node: any = active
      while (node) {
        if (node === standaloneOverlord) break
        const p = node.parentElement
        if (p) { node = p } else {
          const r = node.getRootNode()
          node = r instanceof ShadowRoot ? (r as ShadowRoot).host : null
        }
      }
      expect(node).toBe(standaloneOverlord)
    })

    it('Tab into container tool brings it to front (standalone)', async () => {
      buildStandalone()
      await flush()
      // Detach container first (lower z), then menu (higher z)
      const ct = await detachPopup(saPopupContainer)
      const mt = await detachPopup(saPopupMenu)
      standaloneOverlord.onFocused()
      await flush()

      // Container should be behind menu
      expect(ct.zIndex).toBeLessThan(mt.zIndex)

      // Tab until focus enters container tool
      const allFocusable = (standaloneOverlord as any)._getAllGroupFocusable() as HTMLElement[]
      const overlordCount = (standaloneOverlord as any)._getBodyFocusable().length
      // Focus last overlord button, Tab into container's first child
      allFocusable[overlordCount - 1].focus()
      await flush()
      pressKey('Tab')
      await flush()

      // Container tool should now be in front
      expect(ct.zIndex).toBeGreaterThan(mt.zIndex)
    })

    it('anchor focus brings menu tool to front (standalone)', async () => {
      buildStandalone()
      await flush()
      const mt = await detachPopup(saPopupMenu)
      const ct = await detachPopup(saPopupContainer)
      standaloneOverlord.onFocused()
      await flush()

      // Menu was detached first → lower z-index
      expect(mt.zIndex).toBeLessThan(ct.zIndex)

      // Focus the menu anchor
      saBtnMenu.focus()
      await flush()

      // Menu tool should now be in front
      expect(mt.zIndex).toBeGreaterThan(ct.zIndex)
    })

    it('mousedown on standalone tool brings it to front', async () => {
      buildStandalone()
      await flush()
      const mt = await detachPopup(saPopupMenu)
      const ct = await detachPopup(saPopupContainer)
      standaloneOverlord.onFocused()
      await flush()

      expect(mt.zIndex).toBeLessThan(ct.zIndex)

      mousedown(mt)
      await flush()

      expect(mt.zIndex).toBeGreaterThan(ct.zIndex)
    })
  })
})
