import '../components/ui-button/ui-button'
import { PopupWC } from '../components/ui-popup-wc/ui-popup-wc'
import { MenuItemWC } from '../components/ui-menu-item-wc/ui-menu-item-wc'
import { WindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { WindowWC } from '../components/ui-window-wc/ui-window-wc'
import type { DemoRoute } from '../header'

function makeBtn(text: string, variant = 'outline'): HTMLElement {
  const btn = document.createElement('ui-button') as HTMLElement
  btn.setAttribute('variant', variant); btn.setAttribute('size', 'small')
  btn.setAttribute('data-focusable', ''); btn.textContent = text
  return btn
}

export const popupsWCDemo: DemoRoute = {
  id: 'popups-wc',
  label: 'Popups WC',
  render: () => `<div id="popup-wc-demo" class="demo-app" style="padding:0;"></div>`,
  setup: () => {
    const container = document.getElementById('popup-wc-demo')!
    container.style.padding = '20px'
    container.style.overflow = 'auto'

    const wm = new WindowManagerWC({ width: 900, height: 600 })
    wm.style.border = '1px solid #888'
    wm.style.display = 'block'

    const root = container

    // ── 1. Basic Popup ──
    const sec1 = document.createElement('div'); sec1.style.cssText = 'margin-bottom:32px;'
    sec1.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Basic Popup</h2>'
    const btn1 = makeBtn('Open Popup'); sec1.appendChild(btn1); root.appendChild(sec1)

    const popup1 = new PopupWC({ anchor: btn1, alignment: 'BottomLeft', width: 220, height: 200 })
    ;['New File', 'Open...', 'Save', 'Close'].forEach(text => {
      popup1.addChild(new MenuItemWC({ text, shortcut: 'Ctrl+' + text[0] }))
    })
    btn1.addEventListener('click', () => popup1.toggle())

    // ── 2. Auto-flip ──
    const sec2 = document.createElement('div'); sec2.style.cssText = 'margin-bottom:32px;'
    sec2.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Auto-flip (buttons near edges)</h2>'
    root.appendChild(sec2)
    const edgeRow = document.createElement('div'); edgeRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;'
    sec2.appendChild(edgeRow)

    for (const [label, align] of [['Left Edge', 'LeftTop'], ['Center', 'BottomCenter'], ['Right Edge', 'RightTop']] as const) {
      const btn = makeBtn(label); edgeRow.appendChild(btn)
      const popup = new PopupWC({ anchor: btn, alignment: align, width: 200, height: 180 })
      ;['Option A', 'Option B', 'Option C'].forEach(t => popup.addChild(new MenuItemWC({ text: t })))
      btn.addEventListener('click', () => popup.toggle())
    }

    // ── 3. All alignments ──
    const sec3 = document.createElement('div'); sec3.style.cssText = 'margin-bottom:32px;margin-top:100px;'
    sec3.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">All Alignments</h2>'
    root.appendChild(sec3)
    const alignGrid = document.createElement('div'); alignGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;justify-content:center;'
    sec3.appendChild(alignGrid)

    const aligns = ['BottomLeft', 'BottomCenter', 'BottomRight', 'TopLeft', 'TopCenter', 'TopRight',
      'LeftTop', 'LeftCenter', 'LeftBottom', 'RightTop', 'RightCenter', 'RightBottom']
    aligns.forEach(align => {
      const btn = makeBtn(align); alignGrid.appendChild(btn)
      const popup = new PopupWC({ anchor: btn, alignment: align as any, width: 160, height: 120 })
      ;['One', 'Two', 'Three'].forEach(t => popup.addChild(new MenuItemWC({ text: t })))
      btn.addEventListener('click', () => popup.toggle())
    })

    // ── 4. Resizable ──
    const sec4 = document.createElement('div'); sec4.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec4.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Resizable Popup</h2>'
    root.appendChild(sec4)
    const btn4 = makeBtn('Open Resizable'); sec4.appendChild(btn4)
    const popup4 = new PopupWC({ anchor: btn4, alignment: 'BottomLeft', width: 250, height: 200, resizable: true, minWidth: 150, minHeight: 100 })
    for (let i = 1; i <= 6; i++) popup4.addChild(new MenuItemWC({ text: `Resizable Item ${i}` }))
    btn4.addEventListener('click', () => popup4.toggle())

    // ── 5. Mini-Drag ──
    const sec5 = document.createElement('div'); sec5.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec5.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Mini-Drag Popup</h2>'
    root.appendChild(sec5)
    const btn5 = makeBtn('Open Mini-Drag'); sec5.appendChild(btn5)
    const popup5 = new PopupWC({ anchor: btn5, alignment: 'BottomLeft', width: 200, height: 180, title: 'Tools', resizable: true })
    ;['Select', 'Move', 'Rotate', 'Scale', 'Brush', 'Eraser'].forEach(text => popup5.addChild(new MenuItemWC({ text })))
    btn5.addEventListener('click', () => popup5.toggle())

    // ── 6. Detachable ──
    const sec6 = document.createElement('div'); sec6.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec6.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Detachable Popup (drag titlebar to detach)</h2>'
    root.appendChild(sec6)

    const emptyWin = new WindowWC({ title: 'Window 1', left: 20, top: 20, width: 400, height: 300 })
    const secondWin = new WindowWC({ title: 'Window 2', left: 500, top: 20, width: 350, height: 250 })

    const detachBtn = makeBtn('Open Detachable')
    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'margin-top:8px;font-size:12px;opacity:0.6;'
    statusLabel.textContent = 'Click button to open popup. Drag its titlebar to detach.'

    const popupDetach = new PopupWC({
      anchor: detachBtn, alignment: 'BottomLeft', width: 180, height: 200,
      title: 'Tool Palette', detachable: true, resizable: true,
    })
    popupDetach.overlord = emptyWin

    const tools: [string, string][] = [['Select', 'Ctrl+A'], ['Move', 'Ctrl+M'], ['Rotate', 'Ctrl+R'], ['Scale', 'Alt+S'],
      ['Brush', 'Ctrl+B'], ['Eraser', 'Alt+E'], ['Fill', 'Ctrl+G'], ['Text', 'Ctrl+T']]
    tools.forEach(([text, key]) => {
      const item = new MenuItemWC({ text, shortcut: key })
      popupDetach.addChild(item)
      item.onClick(() => { statusLabel.textContent = `Tool: ${text}` })
    })
    detachBtn.addEventListener('click', () => popupDetach.toggle())
    popupDetach.on('detach', () => { statusLabel.textContent = 'Popup detached! Now a tool window.' })
    popupDetach.on('attach', () => { statusLabel.textContent = 'Popup returned.' })

    // Container popup
    const containerBtn = makeBtn('Open Container')
    const popupContainer = new PopupWC({
      anchor: containerBtn, kind: 'container', alignment: 'BottomLeft',
      width: 220, height: 160, title: 'Settings', detachable: true, resizable: true,
    })
    popupContainer.overlord = emptyWin

    const settingsContent = document.createElement('div')
    settingsContent.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:12px 14px;'
    const cb1 = document.createElement('label')
    cb1.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    cb1.setAttribute('data-focusable', ''); cb1.innerHTML = '<input type="checkbox" checked> Auto-save'
    const cb2 = document.createElement('label')
    cb2.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    cb2.setAttribute('data-focusable', ''); cb2.innerHTML = '<input type="checkbox"> Dark mode'
    const inp = document.createElement('input')
    inp.type = 'text'; inp.placeholder = 'Search...'; inp.setAttribute('data-focusable', '')
    inp.style.cssText = 'width:100%;padding:6px 8px;box-sizing:border-box;border:1px solid #555;border-radius:4px;background:var(--view-bg-color);color:var(--fg-color);'
    const applyBtn = makeBtn('Apply', 'solid')
    applyBtn.style.alignSelf = 'flex-end'
    applyBtn.addEventListener('click', () => { statusLabel.textContent = 'Settings applied!' })
    settingsContent.appendChild(cb1); settingsContent.appendChild(cb2)
    settingsContent.appendChild(inp); settingsContent.appendChild(applyBtn)
    popupContainer.addChild(settingsContent)
    containerBtn.addEventListener('click', () => popupContainer.toggle())

    // Layers popup
    const detachBtn2 = makeBtn('Open Layers')
    const popupDetach2 = new PopupWC({
      anchor: detachBtn2, alignment: 'BottomLeft', width: 180, height: 180,
      title: 'Layers', detachable: true, resizable: true,
    })
    popupDetach2.overlord = emptyWin
    ;[['Background', 'F1'], ['Foreground', 'F2'], ['Overlay', 'F3'], ['Mask', 'F4'], ['Shadow', 'F5'], ['Glow', 'F6']].forEach(([text, key]) => {
      const item = new MenuItemWC({ text, shortcut: key })
      popupDetach2.addChild(item)
      item.onClick(() => { statusLabel.textContent = `Layer: ${text}` })
    })
    detachBtn2.addEventListener('click', () => popupDetach2.toggle())
    popupDetach2.on('detach', () => { statusLabel.textContent = 'Layers detached!' })
    popupDetach2.on('attach', () => { statusLabel.textContent = 'Layers returned.' })

    // Preferences popup
    const containerBtn2 = makeBtn('Open Preferences')
    const popupContainer2 = new PopupWC({
      anchor: containerBtn2, kind: 'container', alignment: 'BottomLeft',
      width: 240, height: 180, title: 'Preferences', detachable: true, resizable: true,
    })
    popupContainer2.overlord = emptyWin
    const prefsContent = document.createElement('div')
    prefsContent.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:12px 14px;'
    const cbSnap = document.createElement('label')
    cbSnap.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    cbSnap.setAttribute('data-focusable', ''); cbSnap.innerHTML = '<input type="checkbox" checked> Snap to grid'
    const cbGuides = document.createElement('label')
    cbGuides.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    cbGuides.setAttribute('data-focusable', ''); cbGuides.innerHTML = '<input type="checkbox"> Show guides'
    const gridInput = document.createElement('input')
    gridInput.type = 'number'; gridInput.value = '8'; gridInput.min = '1'; gridInput.max = '64'
    gridInput.setAttribute('data-focusable', '')
    gridInput.style.cssText = 'width:100%;padding:6px 8px;box-sizing:border-box;border:1px solid #555;border-radius:4px;background:var(--view-bg-color);color:var(--fg-color);'
    gridInput.placeholder = 'Grid size'
    const saveBtn = makeBtn('Save', 'solid')
    saveBtn.style.alignSelf = 'flex-end'
    saveBtn.addEventListener('click', () => { statusLabel.textContent = 'Preferences saved!' })
    prefsContent.appendChild(cbSnap); prefsContent.appendChild(cbGuides)
    prefsContent.appendChild(gridInput); prefsContent.appendChild(saveBtn)
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
    container.appendChild(wm)
    wm.addWindow(emptyWin)
    wm.addWindow(secondWin)
  },
}
