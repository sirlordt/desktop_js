import '../components/ui-button/ui-button'
import { UIPopup } from '../components/ui-popup/ui-popup'
import { UIMenuItem } from '../components/ui-menu-item/ui-menu-item'
import { UIWindowManager } from '../components/ui-window-manager/ui-window-manager'
import { UIWindow } from '../components/ui-window/ui-window'

import type { DemoRoute } from '../header'

function makeBtn(text: string, variant = 'outline'): HTMLElement {
  const btn = document.createElement('ui-button') as HTMLElement
  btn.setAttribute('variant', variant)
  btn.setAttribute('size', 'small')
  btn.setAttribute('data-focusable', '')
  btn.textContent = text
  return btn
}

export const popupsDemo: DemoRoute = {
  id: 'popups',
  label: 'Popups',
  render: () => `<div id="popup-demo" class="demo-app" style="padding: 0;"></div>`,
  setup: () => {
    const container = document.getElementById('popup-demo')!
    container.style.padding = '20px'
    container.style.overflow = 'auto'

    // ── WindowManager (empty, sibling of buttons) ──
    const wm = new UIWindowManager({
      width: 900,
      height: 600,
    })
    wm.element.style.border = '1px solid #888'

    const root = container

    // ── 1. Basic Popup ──
    const sec1 = document.createElement('div')
    sec1.style.cssText = 'margin-bottom: 32px;'
    sec1.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Basic Popup</h2>'
    const btn1 = makeBtn('Open Popup')
    sec1.appendChild(btn1)
    root.appendChild(sec1)

    const popup1 = new UIPopup({
      anchor: btn1,
      alignment: 'BottomLeft',
      width: 220,
      height: 200,
    })
    const items1 = ['New File', 'Open...', 'Save', 'Close']
    items1.forEach(text => {
      const item = new UIMenuItem({ text, shortcut: 'Ctrl+' + text[0] })
      popup1.addChild(item.element)
    })
    btn1.addEventListener('click', () => popup1.toggle())

    // ── 2. Auto-flip: buttons at edges ──
    const sec2 = document.createElement('div')
    sec2.style.cssText = 'margin-bottom: 32px;'
    sec2.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Auto-flip (buttons near edges)</h2>'
    root.appendChild(sec2)

    const edgeRow = document.createElement('div')
    edgeRow.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start;'
    sec2.appendChild(edgeRow)

    // Left edge
    const btnLeft = makeBtn('Left Edge')
    edgeRow.appendChild(btnLeft)
    const popupLeft = new UIPopup({
      anchor: btnLeft,
      alignment: 'LeftTop',
      width: 200,
      height: 180,
    })
    ;['Option A', 'Option B', 'Option C'].forEach(t => popupLeft.addChild(new UIMenuItem({ text: t }).element))
    btnLeft.addEventListener('click', () => popupLeft.toggle())

    // Center
    const btnCenter = makeBtn('Center')
    edgeRow.appendChild(btnCenter)
    const popupCenter = new UIPopup({
      anchor: btnCenter,
      alignment: 'BottomCenter',
      width: 200,
      height: 180,
    })
    ;['Option A', 'Option B', 'Option C'].forEach(t => popupCenter.addChild(new UIMenuItem({ text: t }).element))
    btnCenter.addEventListener('click', () => popupCenter.toggle())

    // Right edge
    const btnRight = makeBtn('Right Edge')
    edgeRow.appendChild(btnRight)
    const popupRight = new UIPopup({
      anchor: btnRight,
      alignment: 'RightTop',
      width: 200,
      height: 180,
    })
    ;['Option A', 'Option B', 'Option C'].forEach(t => popupRight.addChild(new UIMenuItem({ text: t }).element))
    btnRight.addEventListener('click', () => popupRight.toggle())

    // ── 3. Bottom edge auto-flip ──
    const sec3 = document.createElement('div')
    sec3.style.cssText = 'margin-bottom: 32px; margin-top: 200px;'
    sec3.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Bottom auto-flip (popup flips up)</h2>'
    root.appendChild(sec3)

    const bottomRow = document.createElement('div')
    bottomRow.style.cssText = 'display: flex; gap: 16px;'
    sec3.appendChild(bottomRow)

    const btnBottom1 = makeBtn('BottomLeft (should flip up)')
    bottomRow.appendChild(btnBottom1)
    const popupBottom1 = new UIPopup({
      anchor: btnBottom1,
      alignment: 'BottomLeft',
      width: 220,
      height: 300,
    })
    for (let i = 1; i <= 8; i++) popupBottom1.addChild(new UIMenuItem({ text: `Item ${i}` }).element)
    btnBottom1.addEventListener('click', () => popupBottom1.toggle())

    const btnBottom2 = makeBtn('TopLeft (normal)')
    bottomRow.appendChild(btnBottom2)
    const popupBottom2 = new UIPopup({
      anchor: btnBottom2,
      alignment: 'TopLeft',
      width: 220,
      height: 200,
    })
    ;['Alpha', 'Beta', 'Gamma', 'Delta'].forEach(t => popupBottom2.addChild(new UIMenuItem({ text: t }).element))
    btnBottom2.addEventListener('click', () => popupBottom2.toggle())

    // ── 4. All alignments ──
    const sec4 = document.createElement('div')
    sec4.style.cssText = 'margin-bottom: 32px; margin-top: 100px;'
    sec4.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">All Alignments</h2>'
    root.appendChild(sec4)

    const alignGrid = document.createElement('div')
    alignGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;'
    sec4.appendChild(alignGrid)

    const aligns = [
      'BottomLeft', 'BottomCenter', 'BottomRight',
      'TopLeft', 'TopCenter', 'TopRight',
      'LeftTop', 'LeftCenter', 'LeftBottom',
      'RightTop', 'RightCenter', 'RightBottom',
    ]
    aligns.forEach(align => {
      const btn = makeBtn(align)
      alignGrid.appendChild(btn)
      const popup = new UIPopup({
        anchor: btn,
        alignment: align as any,
        width: 160,
        height: 120,
      })
      ;['One', 'Two', 'Three'].forEach(t => popup.addChild(new UIMenuItem({ text: t }).element))
      btn.addEventListener('click', () => popup.toggle())
    })

    // ── 5. Resizable popup ──
    const sec5 = document.createElement('div')
    sec5.style.cssText = 'margin-bottom: 32px; margin-top: 50px;'
    sec5.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Resizable Popup</h2>'
    root.appendChild(sec5)

    const btn5 = makeBtn('Open Resizable')
    sec5.appendChild(btn5)
    const popup5 = new UIPopup({
      anchor: btn5,
      alignment: 'BottomLeft',
      width: 250,
      height: 200,
      resizable: true,
      minWidth: 150,
      minHeight: 100,
    })
    for (let i = 1; i <= 6; i++) popup5.addChild(new UIMenuItem({ text: `Resizable Item ${i}` }).element)
    btn5.addEventListener('click', () => popup5.toggle())

    // ── 6. Mini-Drag Popup ──
    const sec6 = document.createElement('div')
    sec6.style.cssText = 'margin-bottom: 32px; margin-top: 50px;'
    sec6.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Mini-Drag Popup</h2>'
    root.appendChild(sec6)

    const btn6 = makeBtn('Open Mini-Drag')
    sec6.appendChild(btn6)
    const popup6 = new UIPopup({
      anchor: btn6,
      alignment: 'BottomLeft',
      width: 200,
      height: 180,
      title: 'Tools',
      resizable: true,
    })
    ;['Select', 'Move', 'Rotate', 'Scale', 'Brush', 'Eraser'].forEach(text => {
      popup6.addChild(new UIMenuItem({ text }).element)
    })
    btn6.addEventListener('click', () => popup6.toggle())

    // ── 7. Detachable Popup ──
    const sec7 = document.createElement('div')
    sec7.style.cssText = 'margin-bottom: 32px; margin-top: 50px;'
    sec7.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Detachable Popup (drag titlebar to detach)</h2>'
    root.appendChild(sec7)

    // ── WindowManager con ventanas ──
    const emptyWin = new UIWindow({
      title: 'Window 1',
      left: 20,
      top: 20,
      width: 400,
      height: 300,
      resizable: true,
      movable: true,
      closable: true,
      minimizable: true,
      maximizable: true,
    })
    const secondWin = new UIWindow({
      title: 'Window 2',
      left: 500,
      top: 20,
      width: 350,
      height: 250,
      resizable: true,
      movable: true,
      closable: true,
      minimizable: true,
      maximizable: true,
    })

    const detachBtn = makeBtn('Open Detachable')

    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'margin-top: 8px; font-size: 12px; opacity: 0.6;'
    statusLabel.textContent = 'Click button to open popup. Drag its titlebar to detach.'

    const popupDetach = new UIPopup({
      anchor: detachBtn,
      alignment: 'BottomLeft',
      width: 180,
      height: 200,
      title: 'Tool Palette',
      detachable: true,
      resizable: true,
    })
    popupDetach.overlord = emptyWin


    const tools: [string, string][] = [
      ['Select', 'Ctrl+A'], ['Move', 'Ctrl+M'], ['Rotate', 'Ctrl+R'], ['Scale', 'Alt+S'],
      ['Brush', 'Ctrl+B'], ['Eraser', 'Alt+E'], ['Fill', 'Ctrl+G'], ['Text', 'Ctrl+T'],
    ]
    tools.forEach(([text, key]) => {
      const item = new UIMenuItem({ text, shortcut: key })
      popupDetach.addChild(item.element)
      item.onClick(() => {
        statusLabel.textContent = `Tool: ${text}`
      })
    })

    detachBtn.addEventListener('click', () => popupDetach.toggle())

    popupDetach.on('detach', () => {
      statusLabel.textContent = 'Popup detached! Now a tool window. Close it to return.'
    })
    popupDetach.on('attach', () => {
      statusLabel.textContent = 'Popup returned. Click button to open again.'
    })

    // Container popup (kind = 'container')
    const containerBtn = makeBtn('Open Container')
    const popupContainer = new UIPopup({
      anchor: containerBtn,
      kind: 'container',
      alignment: 'BottomLeft',
      width: 220,
      height: 160,
      title: 'Settings',
      detachable: true,
      resizable: true,
    })
    popupContainer.overlord = emptyWin

    // Settings popup content wrapper
    const settingsContent = document.createElement('div')
    settingsContent.style.cssText = 'display: flex; flex-direction: column; gap: 10px; padding: 12px 14px;'

    const cb1 = document.createElement('label')
    cb1.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;'
    cb1.setAttribute('data-focusable', '')
    cb1.innerHTML = '<input type="checkbox" checked> Auto-save'

    const cb2 = document.createElement('label')
    cb2.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;'
    cb2.setAttribute('data-focusable', '')
    cb2.innerHTML = '<input type="checkbox"> Dark mode'

    const inp = document.createElement('input')
    inp.type = 'text'
    inp.placeholder = 'Search...'
    inp.setAttribute('data-focusable', '')
    inp.style.cssText = 'width: 100%; padding: 6px 8px; box-sizing: border-box; border: 1px solid #555; border-radius: 4px; background: var(--view-bg-color); color: var(--fg-color);'

    const applyBtn = makeBtn('Apply', 'solid')
    applyBtn.style.alignSelf = 'flex-end'
    applyBtn.addEventListener('click', () => {
      statusLabel.textContent = 'Settings applied!'
    })

    settingsContent.appendChild(cb1)
    settingsContent.appendChild(cb2)
    settingsContent.appendChild(inp)
    settingsContent.appendChild(applyBtn)
    popupContainer.addChild(settingsContent)

    containerBtn.addEventListener('click', () => popupContainer.toggle())

    // ── Second Tool Palette (Layers) ──
    const detachBtn2 = makeBtn('Open Layers')
    const popupDetach2 = new UIPopup({
      anchor: detachBtn2,
      alignment: 'BottomLeft',
      width: 180,
      height: 180,
      title: 'Layers',
      detachable: true,
      resizable: true,
    })
    popupDetach2.overlord = emptyWin

    const layers: [string, string][] = [
      ['Background', 'F1'], ['Foreground', 'F2'], ['Overlay', 'F3'],
      ['Mask', 'F4'], ['Shadow', 'F5'], ['Glow', 'F6'],
    ]
    layers.forEach(([text, key]) => {
      const item = new UIMenuItem({ text, shortcut: key })
      popupDetach2.addChild(item.element)
      item.onClick(() => { statusLabel.textContent = `Layer: ${text}` })
    })
    detachBtn2.addEventListener('click', () => popupDetach2.toggle())
    popupDetach2.on('detach', () => { statusLabel.textContent = 'Layers detached!' })
    popupDetach2.on('attach', () => { statusLabel.textContent = 'Layers returned.' })

    // ── Second Container (Preferences) ──
    const containerBtn2 = makeBtn('Open Preferences')
    const popupContainer2 = new UIPopup({
      anchor: containerBtn2,
      kind: 'container',
      alignment: 'BottomLeft',
      width: 240,
      height: 180,
      title: 'Preferences',
      detachable: true,
      resizable: true,
    })
    popupContainer2.overlord = emptyWin

    const prefsContent = document.createElement('div')
    prefsContent.style.cssText = 'display: flex; flex-direction: column; gap: 10px; padding: 12px 14px;'

    const cbSnap = document.createElement('label')
    cbSnap.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;'
    cbSnap.setAttribute('data-focusable', '')
    cbSnap.innerHTML = '<input type="checkbox" checked> Snap to grid'

    const cbGuides = document.createElement('label')
    cbGuides.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px;'
    cbGuides.setAttribute('data-focusable', '')
    cbGuides.innerHTML = '<input type="checkbox"> Show guides'

    const gridInput = document.createElement('input')
    gridInput.type = 'number'
    gridInput.value = '8'
    gridInput.min = '1'
    gridInput.max = '64'
    gridInput.setAttribute('data-focusable', '')
    gridInput.style.cssText = 'width: 100%; padding: 6px 8px; box-sizing: border-box; border: 1px solid #555; border-radius: 4px; background: var(--view-bg-color); color: var(--fg-color);'
    gridInput.placeholder = 'Grid size'

    const saveBtn = makeBtn('Save', 'solid')
    saveBtn.style.alignSelf = 'flex-end'
    saveBtn.addEventListener('click', () => { statusLabel.textContent = 'Preferences saved!' })

    prefsContent.appendChild(cbSnap)
    prefsContent.appendChild(cbGuides)
    prefsContent.appendChild(gridInput)
    prefsContent.appendChild(saveBtn)
    popupContainer2.addChild(prefsContent)
    containerBtn2.addEventListener('click', () => popupContainer2.toggle())

    emptyWin.contentElement.style.padding = '10px'
    emptyWin.contentElement.style.display = 'flex'
    emptyWin.contentElement.style.flexWrap = 'wrap'
    emptyWin.contentElement.style.gap = '8px'
    emptyWin.contentElement.style.alignContent = 'flex-start'
    emptyWin.contentElement.appendChild(detachBtn)
    emptyWin.contentElement.appendChild(containerBtn)
    emptyWin.contentElement.appendChild(detachBtn2)
    emptyWin.contentElement.appendChild(containerBtn2)
    statusLabel.style.width = '100%'
    emptyWin.contentElement.appendChild(statusLabel)
    container.appendChild(wm.element)
    wm.addWindow(emptyWin)
    wm.addWindow(secondWin)
  },
}
