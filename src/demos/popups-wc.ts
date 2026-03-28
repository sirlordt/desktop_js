import '../components/ui-button-wc/ui-button-wc'
import { UIPopupWC } from '../components/ui-popup-wc/ui-popup-wc'
import { UIMenuItemWC } from '../components/ui-menu-item-wc/ui-menu-item-wc'
import { UIWindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { UIWindowWC } from '../components/ui-window-wc/ui-window-wc'
import type { DemoRoute } from '../header'

function makeBtn(text: string, variant = 'outline'): HTMLElement {
  const btn = document.createElement('ui-button') as HTMLElement
  btn.setAttribute('variant', variant); btn.setAttribute('size', 'small')
  btn.setAttribute('data-focusable', ''); btn.textContent = text
  return btn
}

/** Create an inline SVG icon from a path string (16x16 viewBox, stroke-based) */
function makeIcon(d: string, size = 14): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  for (const p of d.split('|')) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', p.trim())
    svg.appendChild(path)
  }
  return svg as unknown as HTMLElement
}

// Icon paths (Lucide-style, 24x24 viewBox)
const ICONS = {
  file:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6',
  folderOpen: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  save:       'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z|M17 21v-8H7v8|M7 3v5h8',
  x:          'M18 6L6 18|M6 6l12 12',
  cursor:     'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z',
  move:       'M5 9l-3 3 3 3|M9 5l3-3 3 3|M15 19l-3 3-3-3|M19 9l3 3-3 3|M2 12h20|M12 2v20',
  rotateCw:   'M21 2v6h-6|M21 13a9 9 0 1 1-3-7.7L21 8',
  maximize:   'M15 3h6v6|M9 21H3v-6|M21 3l-7 7|M3 21l7-7',
  brush:      'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08|M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
  eraser:     'M7 21h10|M5.5 13.5L12 7l5 5-6.5 6.5a2.12 2.12 0 0 1-3 0L5.5 16.5a2.12 2.12 0 0 1 0-3z',
  paintBucket:'M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0L19 11z|M5 2l5 5|M2 13h15',
  type:       'M4 7V4h16v3|M9 20h6|M12 4v16',
  wand:       'M15 4V2|M15 16v-2|M8 9h2|M20 9h2|M17.8 11.8L19 13|M17.8 6.2L19 5|M11.2 6.2L10 5|M11.2 11.8L10 13|M21 21l-5.5-5.5',
  layers:     'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5',
  image:      'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M21 15l-5-5L5 21',
  eye:        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff:     'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94|M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19|M1 1l22 22',
  sparkles:   'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z|M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z',
  grid:       'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  compass:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
} as const

export const popupsWCDemo: DemoRoute = {
  id: 'popups-wc',
  label: 'Popups WC',
  render: () => `<div id="popup-wc-demo" class="demo-app" style="padding:0;"></div>`,
  setup: () => {
    const container = document.getElementById('popup-wc-demo')!
    container.style.padding = '20px'
    container.style.overflow = 'auto'

    const wm = new UIWindowManagerWC({ width: 900, height: 600 })
    wm.style.border = '1px solid #888'
    wm.style.display = 'block'

    const root = container

    // ── 1. Basic Popup ──
    const sec1 = document.createElement('div'); sec1.style.cssText = 'margin-bottom:32px;'
    sec1.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Basic Popup</h2>'
    const btn1 = makeBtn('Open Popup'); sec1.appendChild(btn1); root.appendChild(sec1)

    const popup1 = new UIPopupWC({ anchor: btn1, alignment: 'BottomLeft', width: 220, height: 200 })
    const fileItems: [string, string, string][] = [
      ['New File', 'Ctrl+N', ICONS.file],
      ['Open...', 'Ctrl+O', ICONS.folderOpen],
      ['Save', 'Ctrl+S', ICONS.save],
      ['Close', 'Ctrl+W', ICONS.x],
    ]
    fileItems.forEach(([text, shortcut, icon]) => {
      const item = new UIMenuItemWC({ text, shortcut, leftElement: makeIcon(icon) })
      popup1.addChild(item)
    })
    btn1.addEventListener('click', () => popup1.toggle())

    // ── 1b. Sub-menus ──
    const secSub = document.createElement('div'); secSub.style.cssText = 'margin-bottom:32px;'
    secSub.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Sub-menus (nested, multi-level)</h2>'
    const btnSub = makeBtn('Open Menu with Sub-menus'); secSub.appendChild(btnSub); root.appendChild(secSub)

    const popupSub = new UIPopupWC({ anchor: btnSub, alignment: 'BottomLeft', width: 220, height: 250 })

    // "New" item with sub-menu
    const newItem = new UIMenuItemWC({ text: 'New', leftElement: makeIcon(ICONS.file) })
    const newSub = new UIPopupWC({ anchor: newItem, kind: 'menu', width: 180, height: 160 })
    // Level 2: "Project" has its own sub-menu
    const projItem = new UIMenuItemWC({ text: 'Project...', leftElement: makeIcon(ICONS.folderOpen) })
    const projSub = new UIPopupWC({ anchor: projItem, kind: 'menu', width: 160, height: 120 })
    ;['React', 'Vue', 'Svelte', 'Angular'].forEach(t => projSub.addChild(new UIMenuItemWC({ text: t })))
    projItem.subMenu = projSub

    newSub.addChild(new UIMenuItemWC({ text: 'File', leftElement: makeIcon(ICONS.file) }))
    newSub.addChild(projItem)
    newSub.addChild(new UIMenuItemWC({ text: 'Snippet', leftElement: makeIcon(ICONS.type) }))
    newItem.subMenu = newSub

    // "View" item with sub-menu
    const viewItem = new UIMenuItemWC({ text: 'View', leftElement: makeIcon(ICONS.eye) })
    const viewSub = new UIPopupWC({ anchor: viewItem, kind: 'menu', width: 180, height: 140 })
    ;['Zoom In', 'Zoom Out', 'Reset Zoom', 'Full Screen'].forEach(t => viewSub.addChild(new UIMenuItemWC({ text: t })))
    viewItem.subMenu = viewSub

    popupSub.addChild(newItem)
    popupSub.addChild(new UIMenuItemWC({ text: 'Open...', shortcut: 'Ctrl+O', leftElement: makeIcon(ICONS.folderOpen) }))
    popupSub.addChild(viewItem)
    popupSub.addChild(new UIMenuItemWC({ text: 'Save', shortcut: 'Ctrl+S', leftElement: makeIcon(ICONS.save) }))
    popupSub.addChild(new UIMenuItemWC({ text: 'Close', shortcut: 'Ctrl+W', leftElement: makeIcon(ICONS.x) }))
    btnSub.addEventListener('click', () => popupSub.toggle())

    // ── 1c. Detachable sub-menus (3 levels, all detachable) ──
    const secDetSub = document.createElement('div'); secDetSub.style.cssText = 'margin-bottom:32px;'
    secDetSub.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Detachable Sub-menus (3 levels, all detachable)</h2>'
    const btnDetSub = makeBtn('Open Detachable Menu'); secDetSub.appendChild(btnDetSub); root.appendChild(secDetSub)

    const detSubRoot = new UIPopupWC({ anchor: btnDetSub, alignment: 'BottomLeft', width: 200, height: 200, detachable: true, resizable: true, title: 'Tools' })

    // Level 1: Drawing sub-menu
    const drawItem = new UIMenuItemWC({ text: 'Drawing', leftElement: makeIcon(ICONS.brush) })
    const drawSub = new UIPopupWC({ anchor: drawItem, kind: 'menu', width: 180, height: 180, detachable: true, resizable: true, title: 'Drawing' })
    // Level 2: Brush type sub-menu
    const brushTypeItem = new UIMenuItemWC({ text: 'Brush Type', leftElement: makeIcon(ICONS.brush) })
    const brushTypeSub = new UIPopupWC({ anchor: brushTypeItem, kind: 'menu', width: 160, height: 140, detachable: true, resizable: true, title: 'Brush Type' })
    ;['Round', 'Flat', 'Fan', 'Palette Knife'].forEach(t => brushTypeSub.addChild(new UIMenuItemWC({ text: t })))
    brushTypeItem.subMenu = brushTypeSub
    drawSub.addChild(new UIMenuItemWC({ text: 'Pencil', leftElement: makeIcon(ICONS.type) }))
    drawSub.addChild(brushTypeItem)
    drawSub.addChild(new UIMenuItemWC({ text: 'Eraser', leftElement: makeIcon(ICONS.eraser) }))
    drawSub.addChild(new UIMenuItemWC({ text: 'Fill', leftElement: makeIcon(ICONS.paintBucket) }))
    drawItem.subMenu = drawSub

    // Level 1: Transform sub-menu
    const transformItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(ICONS.move) })
    const transformSub = new UIPopupWC({ anchor: transformItem, kind: 'menu', width: 160, height: 120, detachable: true, resizable: true, title: 'Transform' })
    ;['Move', 'Rotate', 'Scale', 'Skew'].forEach(t => transformSub.addChild(new UIMenuItemWC({ text: t })))
    transformItem.subMenu = transformSub

    detSubRoot.addChild(new UIMenuItemWC({ text: 'Select All', shortcut: 'Ctrl+A', leftElement: makeIcon(ICONS.cursor) }))
    detSubRoot.addChild(drawItem)
    detSubRoot.addChild(transformItem)
    detSubRoot.addChild(new UIMenuItemWC({ text: 'Flatten', leftElement: makeIcon(ICONS.layers) }))
    btnDetSub.addEventListener('click', () => detSubRoot.toggle())

    // ── 1d. Sub-menu with container (level 3 is container) ──
    const secContSub = document.createElement('div'); secContSub.style.cssText = 'margin-bottom:32px;'
    secContSub.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Sub-menu with Container (level 3 = container)</h2>'
    const btnContSub = makeBtn('Open Menu'); secContSub.appendChild(btnContSub); root.appendChild(secContSub)

    const contSubRoot = new UIPopupWC({ anchor: btnContSub, alignment: 'BottomLeft', width: 200, height: 180 })

    // Level 1: "Settings" opens level 2
    const settingsItem = new UIMenuItemWC({ text: 'Settings', leftElement: makeIcon(ICONS.grid) })
    const settingsSub = new UIPopupWC({ anchor: settingsItem, kind: 'menu', width: 180, height: 140 })
    // Level 2: "Theme" opens container at level 3
    const themeItem = new UIMenuItemWC({ text: 'Theme', leftElement: makeIcon(ICONS.compass) })
    const themeSub = new UIPopupWC({ anchor: themeItem, kind: 'container', width: 200, height: 160 })
    const themeContent = document.createElement('div')
    themeContent.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:10px 12px;font-size:13px;'
    for (const name of ['GTK4 Light', 'GTK4 Dark', 'Win95', 'Win95 Dark']) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;'
      label.innerHTML = `<input type="radio" name="theme-demo" ${name === 'GTK4 Dark' ? 'checked' : ''}> ${name}`
      themeContent.appendChild(label)
    }
    themeSub.addChild(themeContent)
    themeItem.subMenu = themeSub

    settingsSub.addChild(new UIMenuItemWC({ text: 'General', leftElement: makeIcon(ICONS.file) }))
    settingsSub.addChild(themeItem)
    settingsSub.addChild(new UIMenuItemWC({ text: 'Keybindings', leftElement: makeIcon(ICONS.type) }))
    settingsItem.subMenu = settingsSub

    contSubRoot.addChild(settingsItem)
    contSubRoot.addChild(new UIMenuItemWC({ text: 'About', leftElement: makeIcon(ICONS.eye) }))
    contSubRoot.addChild(new UIMenuItemWC({ text: 'Quit', shortcut: 'Ctrl+Q', leftElement: makeIcon(ICONS.x) }))
    btnContSub.addEventListener('click', () => contSubRoot.toggle())

    // ── 2. Auto-flip ──
    const sec2 = document.createElement('div'); sec2.style.cssText = 'margin-bottom:32px;'
    sec2.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Auto-flip (buttons near edges)</h2>'
    root.appendChild(sec2)
    const edgeRow = document.createElement('div'); edgeRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;'
    sec2.appendChild(edgeRow)

    const edgeIcons = [ICONS.cursor, ICONS.eye, ICONS.sparkles]
    for (const [label, align] of [['Left Edge', 'LeftTop'], ['Center', 'BottomCenter'], ['Right Edge', 'RightTop']] as const) {
      const btn = makeBtn(label); edgeRow.appendChild(btn)
      const popup = new UIPopupWC({ anchor: btn, alignment: align, width: 200, height: 180 })
      ;['Option A', 'Option B', 'Option C'].forEach((t, i) => {
        popup.addChild(new UIMenuItemWC({ text: t, leftElement: makeIcon(edgeIcons[i]) }))
      })
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
      const popup = new UIPopupWC({ anchor: btn, alignment: align as any, width: 160, height: 120 })
      ;['One', 'Two', 'Three'].forEach(t => popup.addChild(new UIMenuItemWC({ text: t })))
      btn.addEventListener('click', () => popup.toggle())
    })

    // ── 4. Resizable ──
    const sec4 = document.createElement('div'); sec4.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec4.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Resizable Popup</h2>'
    root.appendChild(sec4)
    const btn4 = makeBtn('Open Resizable'); sec4.appendChild(btn4)
    const popup4 = new UIPopupWC({ anchor: btn4, alignment: 'BottomLeft', width: 250, height: 200, resizable: true, minWidth: 150, minHeight: 100 })
    const resizableIcons = [ICONS.file, ICONS.folderOpen, ICONS.save, ICONS.image, ICONS.layers, ICONS.grid]
    for (let i = 1; i <= 6; i++) popup4.addChild(new UIMenuItemWC({ text: `Resizable Item ${i}`, leftElement: makeIcon(resizableIcons[i - 1]) }))
    btn4.addEventListener('click', () => popup4.toggle())

    // ── 5. Mini-Drag ──
    const sec5 = document.createElement('div'); sec5.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec5.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Mini-Drag Popup</h2>'
    root.appendChild(sec5)
    const btn5 = makeBtn('Open Mini-Drag'); sec5.appendChild(btn5)
    const popup5 = new UIPopupWC({ anchor: btn5, alignment: 'BottomLeft', width: 200, height: 180, title: 'Tools', resizable: true })
    const miniDragItems: [string, string][] = [
      ['Select', ICONS.cursor], ['Move', ICONS.move], ['Rotate', ICONS.rotateCw],
      ['Scale', ICONS.maximize], ['Brush', ICONS.brush], ['Eraser', ICONS.eraser],
    ]
    miniDragItems.forEach(([text, icon]) => popup5.addChild(new UIMenuItemWC({ text, leftElement: makeIcon(icon) })))
    btn5.addEventListener('click', () => popup5.toggle())

    // ── 6. Detachable ──
    const sec6 = document.createElement('div'); sec6.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec6.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Detachable Popup (drag titlebar to detach)</h2>'
    root.appendChild(sec6)

    const emptyWin = new UIWindowWC({ title: 'Window 1', left: 20, top: 20, width: 400, height: 300 })
    const secondWin = new UIWindowWC({ title: 'Window 2', left: 500, top: 20, width: 350, height: 250 })

    const detachBtn = makeBtn('Open Detachable')
    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'margin-top:8px;font-size:12px;opacity:0.6;'
    statusLabel.textContent = 'Click button to open popup. Drag its titlebar to detach.'

    const popupDetach = new UIPopupWC({
      anchor: detachBtn, alignment: 'BottomLeft', width: 180, height: 200,
      title: 'Tool Palette', detachable: true, resizable: true,
    })
    popupDetach.overlord = emptyWin

    const tools: [string, string, string][] = [
      ['Select', 'Ctrl+A', ICONS.cursor], ['Move', 'Ctrl+M', ICONS.move],
      ['Rotate', 'Ctrl+R', ICONS.rotateCw], ['Scale', 'Alt+S', ICONS.maximize],
      ['Brush', 'Ctrl+B', ICONS.brush], ['Eraser', 'Alt+E', ICONS.eraser],
      ['Fill', 'Ctrl+G', ICONS.paintBucket], ['Text', 'Ctrl+T', ICONS.type],
      ['Content-Aware Fill', 'Ctrl+Shift+F', ICONS.wand],
    ]
    tools.forEach(([text, key, icon]) => {
      const item = new UIMenuItemWC({ text, shortcut: key, leftElement: makeIcon(icon) })
      popupDetach.addChild(item)
      item.onClick(() => { statusLabel.textContent = `Tool: ${text}` })
    })
    detachBtn.addEventListener('click', () => popupDetach.toggle())
    popupDetach.on('detach', () => { statusLabel.textContent = 'Popup detached! Now a tool window.' })
    popupDetach.on('attach', () => { statusLabel.textContent = 'Popup returned.' })

    // Container popup
    const containerBtn = makeBtn('Open Container')
    const popupContainer = new UIPopupWC({
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
    const popupDetach2 = new UIPopupWC({
      anchor: detachBtn2, alignment: 'BottomLeft', width: 180, height: 180,
      title: 'Layers', detachable: true, resizable: true,
    })
    popupDetach2.overlord = emptyWin
    const layerItems: [string, string, string][] = [
      ['Background', 'F1', ICONS.image], ['Foreground', 'F2', ICONS.layers],
      ['Overlay', 'F3', ICONS.sparkles], ['Mask', 'F4', ICONS.eyeOff],
      ['Shadow', 'F5', ICONS.eye], ['Glow', 'F6', ICONS.compass],
    ]
    layerItems.forEach(([text, key, icon]) => {
      const item = new UIMenuItemWC({ text, shortcut: key, leftElement: makeIcon(icon) })
      popupDetach2.addChild(item)
      item.onClick(() => { statusLabel.textContent = `Layer: ${text}` })
    })
    detachBtn2.addEventListener('click', () => popupDetach2.toggle())
    popupDetach2.on('detach', () => { statusLabel.textContent = 'Layers detached!' })
    popupDetach2.on('attach', () => { statusLabel.textContent = 'Layers returned.' })

    // Preferences popup
    const containerBtn2 = makeBtn('Open Preferences')
    const popupContainer2 = new UIPopupWC({
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
    // ── Window 2: Sub-menu demo inside managed window ──
    secondWin.contentElement.style.padding = '10px'
    secondWin.contentElement.style.display = 'flex'
    secondWin.contentElement.style.flexWrap = 'wrap'
    secondWin.contentElement.style.gap = '8px'
    secondWin.contentElement.style.alignContent = 'flex-start'

    const w2Status = document.createElement('div')
    w2Status.style.cssText = 'font-size:12px;opacity:0.6;width:100%;'
    w2Status.textContent = 'Sub-menus inside a managed window.'

    const w2MenuBtn = makeBtn('Open Menu')
    const w2Menu = new UIPopupWC({ anchor: w2MenuBtn, alignment: 'BottomLeft', width: 200, height: 200 })
    // Level 1: "Edit" sub-menu
    const w2EditItem = new UIMenuItemWC({ text: 'Edit', leftElement: makeIcon(ICONS.type) })
    const w2EditSub = new UIPopupWC({ anchor: w2EditItem, kind: 'menu', width: 170, height: 140 })
    // Level 2: "Clipboard" sub-menu
    const w2ClipItem = new UIMenuItemWC({ text: 'Clipboard', leftElement: makeIcon(ICONS.file) })
    const w2ClipSub = new UIPopupWC({ anchor: w2ClipItem, kind: 'menu', width: 150, height: 120 })
    ;['Cut', 'Copy', 'Paste', 'Paste Special'].forEach(t => w2ClipSub.addChild(new UIMenuItemWC({ text: t })))
    w2ClipItem.subMenu = w2ClipSub
    w2EditSub.addChild(new UIMenuItemWC({ text: 'Undo', shortcut: 'Ctrl+Z', leftElement: makeIcon(ICONS.rotateCw) }))
    w2EditSub.addChild(new UIMenuItemWC({ text: 'Redo', shortcut: 'Ctrl+Y' }))
    w2EditSub.addChild(w2ClipItem)
    w2EditItem.subMenu = w2EditSub
    w2Menu.addChild(w2EditItem)
    w2Menu.addChild(new UIMenuItemWC({ text: 'Find...', shortcut: 'Ctrl+F', leftElement: makeIcon(ICONS.eye) }))
    w2Menu.addChild(new UIMenuItemWC({ text: 'Replace...', shortcut: 'Ctrl+H' }))
    w2MenuBtn.addEventListener('click', () => w2Menu.toggle())

    const w2DetachBtn = makeBtn('Open Detachable Submenu')
    const w2DetMenu = new UIPopupWC({ anchor: w2DetachBtn, alignment: 'BottomLeft', width: 190, height: 180, detachable: true, title: 'Image' })
    w2DetMenu.overlord = secondWin
    const w2AdjustItem = new UIMenuItemWC({ text: 'Adjustments', leftElement: makeIcon(ICONS.wand) })
    const w2AdjustSub = new UIPopupWC({ anchor: w2AdjustItem, kind: 'menu', width: 160, height: 140, detachable: true, title: 'Adjustments' })
    ;['Brightness', 'Contrast', 'Saturation', 'Hue'].forEach(t => w2AdjustSub.addChild(new UIMenuItemWC({ text: t })))
    w2AdjustItem.subMenu = w2AdjustSub
    w2DetMenu.addChild(new UIMenuItemWC({ text: 'Crop', leftElement: makeIcon(ICONS.maximize) }))
    w2DetMenu.addChild(w2AdjustItem)
    w2DetMenu.addChild(new UIMenuItemWC({ text: 'Resize', leftElement: makeIcon(ICONS.move) }))
    w2DetachBtn.addEventListener('click', () => w2DetMenu.toggle())

    secondWin.contentElement.appendChild(w2MenuBtn)
    secondWin.contentElement.appendChild(w2DetachBtn)
    secondWin.contentElement.appendChild(w2Status)

    container.appendChild(wm)
    wm.addWindow(emptyWin)
    wm.addWindow(secondWin)

    // ── 7. Standalone Window (outside WM) ──
    const sec7 = document.createElement('div'); sec7.style.cssText = 'margin-bottom:32px;margin-top:50px;'
    sec7.innerHTML = '<h2 style="margin:0 0 8px;font-size:16px;">Standalone Window (no WindowManager)</h2>'
    root.appendChild(sec7)

    const standaloneWin = new UIWindowWC({ title: 'Window 3 (standalone)', left: 0, top: 0, width: 500, height: 300, positioning: 'relative' })
    const standaloneStatus = document.createElement('div')
    standaloneStatus.style.cssText = 'margin-top:8px;font-size:12px;opacity:0.6;width:100%;'
    standaloneStatus.textContent = 'Same buttons but outside a WindowManager.'

    // Detachable
    const sDetachBtn = makeBtn('Open Detachable')
    const sPopupDetach = new UIPopupWC({
      anchor: sDetachBtn, alignment: 'BottomLeft', width: 180, height: 200,
      title: 'Tool Palette', detachable: true, resizable: true,
    })
    sPopupDetach.overlord = standaloneWin
    tools.forEach(([text, key, icon]) => {
      const item = new UIMenuItemWC({ text, shortcut: key, leftElement: makeIcon(icon) })
      sPopupDetach.addChild(item)
      item.onClick(() => { standaloneStatus.textContent = `Tool: ${text}` })
    })
    sDetachBtn.addEventListener('click', () => sPopupDetach.toggle())
    sPopupDetach.on('detach', () => { standaloneStatus.textContent = 'Popup detached! Now a tool window.' })
    sPopupDetach.on('attach', () => { standaloneStatus.textContent = 'Popup returned.' })

    // Container
    const sContainerBtn = makeBtn('Open Container')
    const sPopupContainer = new UIPopupWC({
      anchor: sContainerBtn, kind: 'container', alignment: 'BottomLeft',
      width: 220, height: 160, title: 'Settings', detachable: true, resizable: true,
    })
    sPopupContainer.overlord = standaloneWin
    const sSettings = document.createElement('div')
    sSettings.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:12px 14px;'
    const sCb1 = document.createElement('label')
    sCb1.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    sCb1.setAttribute('data-focusable', ''); sCb1.innerHTML = '<input type="checkbox" checked> Auto-save'
    const sCb2 = document.createElement('label')
    sCb2.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;'
    sCb2.setAttribute('data-focusable', ''); sCb2.innerHTML = '<input type="checkbox"> Dark mode'
    const sApply = makeBtn('Apply', 'solid')
    sApply.style.alignSelf = 'flex-end'
    sApply.addEventListener('click', () => { standaloneStatus.textContent = 'Settings applied!' })
    sSettings.appendChild(sCb1); sSettings.appendChild(sCb2); sSettings.appendChild(sApply)
    sPopupContainer.addChild(sSettings)
    sContainerBtn.addEventListener('click', () => sPopupContainer.toggle())

    // Layers
    const sLayersBtn = makeBtn('Open Layers')
    const sPopupLayers = new UIPopupWC({
      anchor: sLayersBtn, alignment: 'BottomLeft', width: 180, height: 180,
      title: 'Layers', detachable: true, resizable: true,
    })
    sPopupLayers.overlord = standaloneWin
    layerItems.forEach(([text, key, icon]) => {
      const item = new UIMenuItemWC({ text, shortcut: key, leftElement: makeIcon(icon) })
      sPopupLayers.addChild(item)
      item.onClick(() => { standaloneStatus.textContent = `Layer: ${text}` })
    })
    sLayersBtn.addEventListener('click', () => sPopupLayers.toggle())

    standaloneWin.contentElement.style.padding = '10px'
    standaloneWin.contentElement.style.display = 'flex'
    standaloneWin.contentElement.style.flexWrap = 'wrap'
    standaloneWin.contentElement.style.gap = '8px'
    standaloneWin.contentElement.style.alignContent = 'flex-start'
    standaloneWin.contentElement.appendChild(sDetachBtn)
    standaloneWin.contentElement.appendChild(sContainerBtn)
    standaloneWin.contentElement.appendChild(sLayersBtn)
    standaloneWin.contentElement.appendChild(standaloneStatus)

    // Window 4 — standalone window with sub-menu demo
    const standaloneWin2 = new UIWindowWC({ title: 'Window 4 (standalone)', left: 0, top: 0, width: 350, height: 250, positioning: 'relative' })
    standaloneWin2.contentElement.style.padding = '10px'
    standaloneWin2.contentElement.style.display = 'flex'
    standaloneWin2.contentElement.style.flexWrap = 'wrap'
    standaloneWin2.contentElement.style.gap = '8px'
    standaloneWin2.contentElement.style.alignContent = 'flex-start'

    const w4Status = document.createElement('div')
    w4Status.style.cssText = 'font-size:12px;opacity:0.6;width:100%;'
    w4Status.textContent = 'Sub-menus in standalone window (no WM).'

    const w4MenuBtn = makeBtn('Open Menu')
    const w4Menu = new UIPopupWC({ anchor: w4MenuBtn, alignment: 'BottomLeft', width: 190, height: 180 })
    // Level 1: "View" sub-menu
    const w4ViewItem = new UIMenuItemWC({ text: 'View', leftElement: makeIcon(ICONS.eye) })
    const w4ViewSub = new UIPopupWC({ anchor: w4ViewItem, kind: 'menu', width: 170, height: 140 })
    // Level 2: "Layout" sub-menu
    const w4LayoutItem = new UIMenuItemWC({ text: 'Layout', leftElement: makeIcon(ICONS.grid) })
    const w4LayoutSub = new UIPopupWC({ anchor: w4LayoutItem, kind: 'menu', width: 150, height: 100 })
    ;['Single', 'Split', 'Grid'].forEach(t => w4LayoutSub.addChild(new UIMenuItemWC({ text: t })))
    w4LayoutItem.subMenu = w4LayoutSub
    w4ViewSub.addChild(new UIMenuItemWC({ text: 'Zoom In', shortcut: 'Ctrl+=' }))
    w4ViewSub.addChild(new UIMenuItemWC({ text: 'Zoom Out', shortcut: 'Ctrl+-' }))
    w4ViewSub.addChild(w4LayoutItem)
    w4ViewItem.subMenu = w4ViewSub
    w4Menu.addChild(w4ViewItem)
    w4Menu.addChild(new UIMenuItemWC({ text: 'Help', leftElement: makeIcon(ICONS.compass) }))
    w4Menu.addChild(new UIMenuItemWC({ text: 'Quit', shortcut: 'Ctrl+Q', leftElement: makeIcon(ICONS.x) }))
    w4MenuBtn.addEventListener('click', () => w4Menu.toggle())

    const w4DetSubBtn = makeBtn('Open Detachable Submenu')
    const w4DetSubRoot = new UIPopupWC({ anchor: w4DetSubBtn, alignment: 'BottomLeft', width: 200, height: 200, detachable: true, resizable: true, title: 'Tools' })
    w4DetSubRoot.overlord = standaloneWin2

    const w4DrawItem = new UIMenuItemWC({ text: 'Drawing', leftElement: makeIcon(ICONS.brush) })
    const w4DrawSub = new UIPopupWC({ anchor: w4DrawItem, kind: 'menu', width: 180, height: 180, detachable: true, resizable: true, title: 'Drawing' })
    const w4BrushTypeItem = new UIMenuItemWC({ text: 'Brush Type', leftElement: makeIcon(ICONS.brush) })
    const w4BrushTypeSub = new UIPopupWC({ anchor: w4BrushTypeItem, kind: 'menu', width: 160, height: 140, detachable: true, resizable: true, title: 'Brush Type' })
    ;['Round', 'Flat', 'Fan', 'Palette Knife'].forEach(t => w4BrushTypeSub.addChild(new UIMenuItemWC({ text: t })))
    w4BrushTypeItem.subMenu = w4BrushTypeSub
    w4DrawSub.addChild(new UIMenuItemWC({ text: 'Pencil', leftElement: makeIcon(ICONS.type) }))
    w4DrawSub.addChild(w4BrushTypeItem)
    w4DrawSub.addChild(new UIMenuItemWC({ text: 'Eraser', leftElement: makeIcon(ICONS.eraser) }))
    w4DrawSub.addChild(new UIMenuItemWC({ text: 'Fill', leftElement: makeIcon(ICONS.paintBucket) }))
    w4DrawItem.subMenu = w4DrawSub

    const w4TransformItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(ICONS.move) })
    const w4TransformSub = new UIPopupWC({ anchor: w4TransformItem, kind: 'menu', width: 160, height: 120, detachable: true, resizable: true, title: 'Transform' })
    ;['Move', 'Rotate', 'Scale', 'Skew'].forEach(t => w4TransformSub.addChild(new UIMenuItemWC({ text: t })))
    w4TransformItem.subMenu = w4TransformSub

    w4DetSubRoot.addChild(new UIMenuItemWC({ text: 'Select All', shortcut: 'Ctrl+A', leftElement: makeIcon(ICONS.cursor) }))
    w4DetSubRoot.addChild(w4DrawItem)
    w4DetSubRoot.addChild(w4TransformItem)
    w4DetSubRoot.addChild(new UIMenuItemWC({ text: 'Flatten', leftElement: makeIcon(ICONS.layers) }))
    w4DetSubBtn.addEventListener('click', () => w4DetSubRoot.toggle())

    standaloneWin2.contentElement.appendChild(w4MenuBtn)
    standaloneWin2.contentElement.appendChild(w4DetSubBtn)
    standaloneWin2.contentElement.appendChild(w4Status)

    const standaloneRow = document.createElement('div')
    standaloneRow.style.cssText = 'display:flex;gap:16px;align-items:flex-start;'
    standaloneRow.appendChild(standaloneWin)
    standaloneRow.appendChild(standaloneWin2)
    sec7.appendChild(standaloneRow)

    // Focus management for standalone windows is handled automatically by
    // UIWindowWC — no WindowManager needed. Each window calls onFocused() on
    // mousedown when it has no manager.
  },
}
