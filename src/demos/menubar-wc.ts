import '../components/ui-button-wc/ui-button-wc'
import { UIMenuBarWC } from '../components/ui-menubar-wc/ui-menubar-wc'
import { UIMenuItemWC } from '../components/ui-menu-item-wc/ui-menu-item-wc'
import { UIPopupWC } from '../components/ui-popup-wc/ui-popup-wc'
import { UIWindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { UIWindowWC } from '../components/ui-window-wc/ui-window-wc'
import type { DemoRoute } from '../header'

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

const I = {
  file:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6',
  folder:     'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  save:       'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z|M17 21v-8H7v8|M7 3v5h8',
  x:          'M18 6L6 18|M6 6l12 12',
  eye:        'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff:     'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94|M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19|M1 1l22 22',
  type:       'M4 7V4h16v3|M9 20h6|M12 4v16',
  undo:       'M21 2v6h-6|M21 13a9 9 0 1 1-3-7.7L21 8',
  grid:       'M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z',
  compass:    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z',
  layers:     'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5',
  wand:       'M15 4V2|M15 16v-2|M8 9h2|M20 9h2|M17.8 11.8L19 13|M17.8 6.2L19 5|M11.2 6.2L10 5|M11.2 11.8L10 13|M21 21l-5.5-5.5',
  brush:      'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08|M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
  eraser:     'M7 21h10|M5.5 13.5L12 7l5 5-6.5 6.5a2.12 2.12 0 0 1-3 0L5.5 16.5a2.12 2.12 0 0 1 0-3z',
  bucket:     'M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0L19 11z|M5 2l5 5|M2 13h15',
  image:      'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M21 15l-5-5L5 21',
  maximize:   'M15 3h6v6|M9 21H3v-6|M21 3l-7 7|M3 21l7-7',
  move:       'M5 9l-3 3 3 3|M9 5l3-3 3 3|M15 19l-3 3-3-3|M19 9l3 3-3 3|M2 12h20|M12 2v20',
  sparkles:   'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z|M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z',
  settings:   'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z|M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  terminal:   'M4 17l6-6-6-6|M12 19h8',
  help:       'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z|M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3|M12 17h.01',
} as const

/** Simple menu popup with flat items */
function makeMenuPopup(items: { text: string, shortcut?: string, icon?: string, disabled?: boolean }[]): UIPopupWC {
  const popup = new UIPopupWC()
  popup.kind = 'menu'
  popup.width = 220
  for (const def of items) {
    const item = new UIMenuItemWC({
      text: def.text,
      shortcut: def.shortcut,
      leftElement: def.icon ? makeIcon(def.icon) : undefined,
      disabled: def.disabled,
    })
    popup.addChild(item)
  }
  return popup
}

/** Create a sub-menu popup (attached to a parent item) */
function makeSubMenu(parentItem: UIMenuItemWC, items: string[], opts?: { kind?: 'menu' | 'container', detachable?: boolean, title?: string, width?: number }): UIPopupWC {
  const kind = opts?.kind ?? 'menu'
  const sub = new UIPopupWC({
    anchor: parentItem, kind, width: opts?.width ?? 160, height: 'auto',
    detachable: opts?.detachable, title: opts?.title,
  })
  if (kind === 'menu') {
    for (const t of items) sub.addChild(new UIMenuItemWC({ text: t }))
  } else {
    const content = document.createElement('div')
    content.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:10px 12px;font-size:13px;'
    for (const t of items) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;'
      label.setAttribute('data-focusable', '')
      label.innerHTML = `<input type="checkbox"> ${t}`
      content.appendChild(label)
    }
    sub.addChild(content)
  }
  parentItem.subMenu = sub
  return sub
}

export const menuBarWCDemo: DemoRoute = {
  id: 'menubar-wc',
  label: 'MenuBar WC',
  render: () => `<div id="menubar-wc-demo" class="demo-app" style="padding:20px;"></div>`,
  setup: () => {
    const container = document.getElementById('menubar-wc-demo')!

    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'margin-top:16px;font-size:13px;opacity:0.7;min-height:20px;'
    statusLabel.textContent = 'Click a menu or use ArrowLeft/ArrowRight to navigate.'

    // ── 1. Basic MenuBar ──
    const sec1 = document.createElement('div')
    sec1.style.cssText = 'margin-bottom:40px;'
    sec1.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Basic MenuBar</h2>'

    const bar1 = new UIMenuBarWC()
    bar1.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;'

    bar1.addItem(new UIMenuItemWC({ text: 'File' }), makeMenuPopup([
      { text: 'New File', shortcut: 'Ctrl+N', icon: I.file },
      { text: 'Open...', shortcut: 'Ctrl+O', icon: I.folder },
      { text: 'Save', shortcut: 'Ctrl+S', icon: I.save },
      { text: 'Save As...', shortcut: 'Ctrl+Shift+S', icon: I.save, disabled: true },
      { text: 'Close', shortcut: 'Ctrl+W', icon: I.x },
    ]))

    bar1.addItem(new UIMenuItemWC({ text: 'Edit' }), makeMenuPopup([
      { text: 'Undo', shortcut: 'Ctrl+Z', icon: I.undo },
      { text: 'Redo', shortcut: 'Ctrl+Y', icon: I.undo, disabled: true },
      { text: 'Cut', shortcut: 'Ctrl+X' },
      { text: 'Copy', shortcut: 'Ctrl+C' },
      { text: 'Paste', shortcut: 'Ctrl+V' },
    ]))

    bar1.addItem(new UIMenuItemWC({ text: 'View' }), makeMenuPopup([
      { text: 'Zoom In', shortcut: 'Ctrl++', icon: I.eye },
      { text: 'Zoom Out', shortcut: 'Ctrl+-', icon: I.eye },
      { text: 'Full Screen', shortcut: 'F11', icon: I.maximize },
      { text: 'Word Wrap', icon: I.type },
    ]))

    bar1.addItem(new UIMenuItemWC({ text: 'Tools' }), makeMenuPopup([
      { text: 'Extensions', icon: I.grid },
      { text: 'Color Theme', icon: I.brush },
      { text: 'Settings', shortcut: 'Ctrl+,', icon: I.settings },
    ]))

    bar1.addItem(new UIMenuItemWC({ text: 'Help' }), makeMenuPopup([
      { text: 'Documentation', icon: I.help },
      { text: 'About', icon: I.compass },
    ]))

    bar1.addEventListener('menubar-open', (e: Event) => {
      const item = (e as CustomEvent).detail.item as UIMenuItemWC
      statusLabel.textContent = `Opened: ${item.text}`
    })
    bar1.addEventListener('menubar-close', (e: Event) => {
      const item = (e as CustomEvent).detail.item as UIMenuItemWC
      statusLabel.textContent = `Closed: ${item.text}`
    })

    sec1.appendChild(bar1)
    sec1.appendChild(statusLabel)
    container.appendChild(sec1)

    // ── 2. MenuBar with icons in the bar ──
    const sec2 = document.createElement('div')
    sec2.style.cssText = 'margin-bottom:40px;'
    sec2.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">MenuBar with Icons</h2>'

    const bar2 = new UIMenuBarWC()
    bar2.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;'

    bar2.addItem(new UIMenuItemWC({ text: 'File', leftElement: makeIcon(I.file) }), makeMenuPopup([
      { text: 'New', shortcut: 'Ctrl+N', icon: I.file },
      { text: 'Open', shortcut: 'Ctrl+O', icon: I.folder },
      { text: 'Save', shortcut: 'Ctrl+S', icon: I.save },
    ]))

    bar2.addItem(new UIMenuItemWC({ text: 'Edit', leftElement: makeIcon(I.type) }), makeMenuPopup([
      { text: 'Undo', shortcut: 'Ctrl+Z', icon: I.undo },
      { text: 'Cut', shortcut: 'Ctrl+X' },
      { text: 'Copy', shortcut: 'Ctrl+C' },
      { text: 'Paste', shortcut: 'Ctrl+V' },
    ]))

    bar2.addItem(new UIMenuItemWC({ text: 'View', leftElement: makeIcon(I.eye) }), makeMenuPopup([
      { text: 'Zoom In', shortcut: 'Ctrl++' },
      { text: 'Zoom Out', shortcut: 'Ctrl+-' },
      { text: 'Toggle Sidebar', icon: I.grid },
    ]))

    bar2.addItem(new UIMenuItemWC({ text: 'Terminal', leftElement: makeIcon(I.terminal) }), makeMenuPopup([
      { text: 'New Terminal', shortcut: 'Ctrl+`', icon: I.terminal },
      { text: 'Split Terminal' },
      { text: 'Kill Terminal', disabled: true },
    ]))

    sec2.appendChild(bar2)
    container.appendChild(sec2)

    // ── 3. MenuBar with nested sub-menus (3 levels) and detachable ──
    const sec3 = document.createElement('div')
    sec3.style.cssText = 'margin-bottom:40px;'
    sec3.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Nested Sub-menus (3 levels, detachable)</h2>'

    const bar3 = new UIMenuBarWC()
    bar3.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;'

    // Image menu — 3-level deep sub-menus, all detachable
    const imageItem = new UIMenuItemWC({ text: 'Image', leftElement: makeIcon(I.image) })
    const imagePopup = new UIPopupWC()
    imagePopup.kind = 'menu'
    imagePopup.width = 200

    // Level 1: Adjustments → Level 2: Color → Level 3: Presets
    const adjustItem = new UIMenuItemWC({ text: 'Adjustments', leftElement: makeIcon(I.wand) })
    const adjustSub = new UIPopupWC({ anchor: adjustItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Adjustments' })

    const colorItem = new UIMenuItemWC({ text: 'Color', leftElement: makeIcon(I.brush) })
    const colorSub = new UIPopupWC({ anchor: colorItem, kind: 'menu', width: 160, height: 'auto', detachable: true, title: 'Color' })

    const presetsItem = new UIMenuItemWC({ text: 'Presets', leftElement: makeIcon(I.sparkles) })
    makeSubMenu(presetsItem, ['Vivid', 'Muted', 'Sepia', 'B&W', 'Cinematic'], { detachable: true, title: 'Presets' })

    colorSub.addChild(new UIMenuItemWC({ text: 'Brightness' }))
    colorSub.addChild(new UIMenuItemWC({ text: 'Contrast' }))
    colorSub.addChild(new UIMenuItemWC({ text: 'Saturation' }))
    colorSub.addChild(presetsItem)
    colorItem.subMenu = colorSub

    adjustSub.addChild(colorItem)
    adjustSub.addChild(new UIMenuItemWC({ text: 'Levels', leftElement: makeIcon(I.layers) }))
    adjustSub.addChild(new UIMenuItemWC({ text: 'Curves', disabled: true }))
    adjustItem.subMenu = adjustSub

    const transformItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(I.move) })
    makeSubMenu(transformItem, ['Rotate 90° CW', 'Rotate 90° CCW', 'Flip Horizontal', 'Flip Vertical'], { detachable: true, title: 'Transform' })

    imagePopup.addChild(adjustItem)
    imagePopup.addChild(transformItem)
    imagePopup.addChild(new UIMenuItemWC({ text: 'Crop', shortcut: 'Ctrl+Shift+X', leftElement: makeIcon(I.maximize) }))
    imagePopup.addChild(new UIMenuItemWC({ text: 'Resize...', leftElement: makeIcon(I.move) }))

    bar3.addItem(imageItem, imagePopup)

    // Filters menu — detachable at first level
    const filtersItem = new UIMenuItemWC({ text: 'Filters', leftElement: makeIcon(I.sparkles) })
    const filtersPopup = new UIPopupWC()
    filtersPopup.kind = 'menu'
    filtersPopup.width = 200

    const blurItem = new UIMenuItemWC({ text: 'Blur', leftElement: makeIcon(I.eye) })
    makeSubMenu(blurItem, ['Gaussian', 'Motion', 'Radial', 'Box'], { detachable: true, title: 'Blur' })

    const sharpenItem = new UIMenuItemWC({ text: 'Sharpen', leftElement: makeIcon(I.wand) })
    makeSubMenu(sharpenItem, ['Unsharp Mask', 'Smart Sharpen', 'High Pass'])

    filtersPopup.addChild(blurItem)
    filtersPopup.addChild(sharpenItem)
    filtersPopup.addChild(new UIMenuItemWC({ text: 'Noise Reduction', leftElement: makeIcon(I.sparkles), disabled: true }))
    filtersPopup.addChild(new UIMenuItemWC({ text: 'Distort', leftElement: makeIcon(I.compass) }))

    bar3.addItem(filtersItem, filtersPopup)

    // Window menu — simple
    bar3.addItem(new UIMenuItemWC({ text: 'Window' }), makeMenuPopup([
      { text: 'New Window', shortcut: 'Ctrl+Shift+N' },
      { text: 'Tile Horizontally' },
      { text: 'Tile Vertically' },
      { text: 'Close All', disabled: true },
    ]))

    sec3.appendChild(bar3)
    container.appendChild(sec3)

    // ── 4. MenuBar with container sub-menus ──
    const sec4 = document.createElement('div')
    sec4.style.cssText = 'margin-bottom:40px;'
    sec4.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Container Sub-menus (kind: container)</h2>'

    const bar4 = new UIMenuBarWC()
    bar4.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;'

    // Preferences menu with container sub-menu for settings panel
    const prefsItem = new UIMenuItemWC({ text: 'Preferences', leftElement: makeIcon(I.settings) })
    const prefsPopup = new UIPopupWC()
    prefsPopup.kind = 'menu'
    prefsPopup.width = 220

    const appearanceItem = new UIMenuItemWC({ text: 'Appearance', leftElement: makeIcon(I.eye) })
    makeSubMenu(appearanceItem, ['Dark Mode', 'Compact View', 'Show Icons', 'Animate Transitions'], {
      kind: 'container', detachable: true, title: 'Appearance', width: 220,
    })

    const editorItem = new UIMenuItemWC({ text: 'Editor', leftElement: makeIcon(I.type) })
    makeSubMenu(editorItem, ['Word Wrap', 'Line Numbers', 'Minimap', 'Bracket Matching'], {
      kind: 'container', detachable: true, title: 'Editor Settings', width: 220,
    })

    prefsPopup.addChild(appearanceItem)
    prefsPopup.addChild(editorItem)
    prefsPopup.addChild(new UIMenuItemWC({ text: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', leftElement: makeIcon(I.terminal) }))
    prefsPopup.addChild(new UIMenuItemWC({ text: 'Reset to Defaults', disabled: true }))

    bar4.addItem(prefsItem, prefsPopup)

    // Tools menu — mixed: menu sub-menus + container sub-menu
    const toolsItem = new UIMenuItemWC({ text: 'Tools', leftElement: makeIcon(I.wand) })
    const toolsPopup = new UIPopupWC()
    toolsPopup.kind = 'menu'
    toolsPopup.width = 220

    const brushToolItem = new UIMenuItemWC({ text: 'Brush Tool', leftElement: makeIcon(I.brush) })
    makeSubMenu(brushToolItem, ['Round', 'Flat', 'Fan', 'Palette Knife'], { detachable: true, title: 'Brush Types' })

    const eraserToolItem = new UIMenuItemWC({ text: 'Eraser', leftElement: makeIcon(I.eraser) })
    makeSubMenu(eraserToolItem, ['Soft', 'Hard', 'Block'], { detachable: true, title: 'Eraser Modes' })

    const fillItem = new UIMenuItemWC({ text: 'Fill Options', leftElement: makeIcon(I.bucket) })
    makeSubMenu(fillItem, ['Tolerance: Low', 'Tolerance: Medium', 'Tolerance: High', 'Contiguous', 'All Layers'], {
      kind: 'container', detachable: true, title: 'Fill Options', width: 200,
    })

    toolsPopup.addChild(brushToolItem)
    toolsPopup.addChild(eraserToolItem)
    toolsPopup.addChild(fillItem)
    toolsPopup.addChild(new UIMenuItemWC({ text: 'Color Picker', shortcut: 'I', leftElement: makeIcon(I.eyeOff) }))

    bar4.addItem(toolsItem, toolsPopup)

    // Help menu — simple
    bar4.addItem(new UIMenuItemWC({ text: 'Help', leftElement: makeIcon(I.help) }), makeMenuPopup([
      { text: 'Documentation', icon: I.help },
      { text: 'Release Notes', icon: I.file },
      { text: 'About', icon: I.compass },
    ]))

    sec4.appendChild(bar4)
    container.appendChild(sec4)

    // ── 5. Disabled MenuBar ──
    const sec5 = document.createElement('div')
    sec5.style.cssText = 'margin-bottom:40px;'
    sec5.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Disabled MenuBar</h2>'

    const bar5 = new UIMenuBarWC({ disabled: true })
    bar5.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;'

    for (const text of ['File', 'Edit', 'View']) {
      bar5.addItem(new UIMenuItemWC({ text }), makeMenuPopup([{ text: `${text} Action` }]))
    }

    const toggleBtn = document.createElement('button')
    toggleBtn.textContent = 'Toggle Disabled'
    toggleBtn.style.cssText = 'margin-top:8px;padding:4px 12px;cursor:pointer;'
    toggleBtn.addEventListener('click', () => {
      bar5.disabled = !bar5.disabled
      toggleBtn.textContent = bar5.disabled ? 'Enable MenuBar' : 'Disable MenuBar'
    })

    sec5.appendChild(bar5)
    sec5.appendChild(toggleBtn)
    container.appendChild(sec5)

    // ── 6. Overflow demo (constrained width) ──
    const sec6 = document.createElement('div')
    sec6.style.cssText = 'margin-bottom:40px;'
    sec6.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Overflow (>> for items that don\'t fit)</h2>'

    const bar6 = new UIMenuBarWC()
    bar6.style.cssText = 'border:1px solid var(--border-color, #555);border-radius:4px;max-width:350px;'

    for (const name of ['File', 'Edit', 'View', 'Tools', 'Window', 'Preferences', 'Help']) {
      bar6.addItem(
        new UIMenuItemWC({ text: name, leftElement: makeIcon(I[name.toLowerCase() as keyof typeof I] || I.file) }),
        makeMenuPopup([
          { text: `${name} Action 1`, icon: I.file },
          { text: `${name} Action 2` },
          { text: `${name} Action 3`, disabled: true },
        ]),
      )
    }

    const widthSlider = document.createElement('input')
    widthSlider.type = 'range'
    widthSlider.min = '150'
    widthSlider.max = '800'
    widthSlider.value = '350'
    widthSlider.style.cssText = 'margin-top:8px;width:300px;display:block;'
    const widthLabel = document.createElement('div')
    widthLabel.style.cssText = 'font-size:12px;opacity:0.6;margin-top:4px;'
    widthLabel.textContent = 'Width: 350px — drag to resize'
    widthSlider.addEventListener('input', () => {
      const w = widthSlider.value
      bar6.style.maxWidth = `${w}px`
      widthLabel.textContent = `Width: ${w}px — drag to resize`
    })

    sec6.appendChild(bar6)
    sec6.appendChild(widthSlider)
    sec6.appendChild(widthLabel)
    container.appendChild(sec6)

    // ── 7. MenuBar inside UIWindowWC with WindowManager ──
    const sec7 = document.createElement('div')
    sec7.style.cssText = 'margin-bottom:40px;'
    sec7.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">MenuBar inside Window (with WindowManager)</h2>'

    const wm = new UIWindowManagerWC({ height: 500 })
    wm.style.border = '1px solid #888'
    wm.style.display = 'block'

    // Window 1 — app-like window with deep detachable menus
    const win1 = new UIWindowWC({ title: 'App Window', left: 10, top: 10, width: 500, height: 350 })
    const bar7 = new UIMenuBarWC()

    // File menu — ROOT detachable, with 3-level detachable sub-menus
    const w1FileItem = new UIMenuItemWC({ text: 'File', leftElement: makeIcon(I.file) })
    const w1FilePopup = new UIPopupWC({ anchor: w1FileItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'File' })

    // Level 1: New → Level 2: From Template → Level 3: Categories
    const w1NewItem = new UIMenuItemWC({ text: 'New', leftElement: makeIcon(I.file) })
    const w1NewSub = new UIPopupWC({ anchor: w1NewItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'New' })

    const w1TemplateItem = new UIMenuItemWC({ text: 'From Template', leftElement: makeIcon(I.grid) })
    const w1TemplateSub = new UIPopupWC({ anchor: w1TemplateItem, kind: 'menu', width: 170, height: 'auto', detachable: true, title: 'Templates' })

    const w1CatItem = new UIMenuItemWC({ text: 'Categories', leftElement: makeIcon(I.layers) })
    makeSubMenu(w1CatItem, ['Business', 'Personal', 'Academic', 'Creative'], { detachable: true, title: 'Categories' })

    w1TemplateSub.addChild(new UIMenuItemWC({ text: 'Blank Document' }))
    w1TemplateSub.addChild(new UIMenuItemWC({ text: 'Letter' }))
    w1TemplateSub.addChild(new UIMenuItemWC({ text: 'Resume' }))
    w1TemplateSub.addChild(w1CatItem)
    w1TemplateItem.subMenu = w1TemplateSub

    w1NewSub.addChild(new UIMenuItemWC({ text: 'Document' }))
    w1NewSub.addChild(new UIMenuItemWC({ text: 'Spreadsheet' }))
    w1NewSub.addChild(new UIMenuItemWC({ text: 'Presentation' }))
    w1NewSub.addChild(w1TemplateItem)
    w1NewItem.subMenu = w1NewSub

    const w1RecentItem = new UIMenuItemWC({ text: 'Recent Files', leftElement: makeIcon(I.folder) })
    makeSubMenu(w1RecentItem, ['report.docx', 'budget.xlsx', 'slides.pptx', 'notes.txt'], { detachable: true, title: 'Recent' })

    w1FilePopup.addChild(w1NewItem)
    w1FilePopup.addChild(new UIMenuItemWC({ text: 'Open...', shortcut: 'Ctrl+O', leftElement: makeIcon(I.folder) }))
    w1FilePopup.addChild(w1RecentItem)
    w1FilePopup.addChild(new UIMenuItemWC({ text: 'Save', shortcut: 'Ctrl+S', leftElement: makeIcon(I.save) }))
    w1FilePopup.addChild(new UIMenuItemWC({ text: 'Save As...', shortcut: 'Ctrl+Shift+S', leftElement: makeIcon(I.save) }))
    w1FilePopup.addChild(new UIMenuItemWC({ text: 'Exit', leftElement: makeIcon(I.x), disabled: true }))

    bar7.addItem(w1FileItem, w1FilePopup)

    // Edit menu — ROOT detachable, with Transform 2-level
    const w1EditItem = new UIMenuItemWC({ text: 'Edit', leftElement: makeIcon(I.type) })
    const w1EditPopup = new UIPopupWC({ anchor: w1EditItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'Edit' })

    w1EditPopup.addChild(new UIMenuItemWC({ text: 'Undo', shortcut: 'Ctrl+Z', leftElement: makeIcon(I.undo) }))
    w1EditPopup.addChild(new UIMenuItemWC({ text: 'Redo', shortcut: 'Ctrl+Y', leftElement: makeIcon(I.undo), disabled: true }))
    w1EditPopup.addChild(new UIMenuItemWC({ text: 'Cut', shortcut: 'Ctrl+X' }))
    w1EditPopup.addChild(new UIMenuItemWC({ text: 'Copy', shortcut: 'Ctrl+C' }))
    w1EditPopup.addChild(new UIMenuItemWC({ text: 'Paste', shortcut: 'Ctrl+V' }))

    const w1TransItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(I.move) })
    const w1TransSub = new UIPopupWC({ anchor: w1TransItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Transform' })
    const w1RotateItem = new UIMenuItemWC({ text: 'Rotate', leftElement: makeIcon(I.compass) })
    makeSubMenu(w1RotateItem, ['90° CW', '90° CCW', '180°', 'Custom...'], { detachable: true, title: 'Rotate' })
    w1TransSub.addChild(w1RotateItem)
    w1TransSub.addChild(new UIMenuItemWC({ text: 'Flip Horizontal' }))
    w1TransSub.addChild(new UIMenuItemWC({ text: 'Flip Vertical' }))
    w1TransSub.addChild(new UIMenuItemWC({ text: 'Scale...' }))
    w1TransItem.subMenu = w1TransSub
    w1EditPopup.addChild(w1TransItem)

    bar7.addItem(w1EditItem, w1EditPopup)

    // View menu — ROOT detachable, Tool Palette + Layers (container)
    const w1ViewItem = new UIMenuItemWC({ text: 'View', leftElement: makeIcon(I.eye) })
    const w1ViewPopup = new UIPopupWC({ anchor: w1ViewItem, kind: 'menu', width: 200, height: 'auto', detachable: true, title: 'View' })

    const w1ToolsItem = new UIMenuItemWC({ text: 'Tool Palette', leftElement: makeIcon(I.brush) })
    const w1ToolsSub = new UIPopupWC({ anchor: w1ToolsItem, kind: 'menu', width: 160, height: 'auto', detachable: true, title: 'Tools' })
    for (const t of ['Brush', 'Eraser', 'Fill', 'Select', 'Gradient']) {
      w1ToolsSub.addChild(new UIMenuItemWC({ text: t }))
    }
    w1ToolsItem.subMenu = w1ToolsSub

    const w1LayersItem = new UIMenuItemWC({ text: 'Layers', leftElement: makeIcon(I.layers) })
    const w1LayersSub = new UIPopupWC({ anchor: w1LayersItem, kind: 'container', width: 190, height: 'auto', detachable: true, title: 'Layers' })
    const layersContent = document.createElement('div')
    layersContent.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 10px;font-size:13px;'
    for (const name of ['Background', 'Layer 1', 'Layer 2', 'Overlay']) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;'
      label.setAttribute('data-focusable', '')
      label.innerHTML = `<input type="checkbox" ${name === 'Background' ? 'checked' : ''}> ${name}`
      layersContent.appendChild(label)
    }
    w1LayersSub.addChild(layersContent)
    w1LayersItem.subMenu = w1LayersSub

    w1ViewPopup.addChild(w1ToolsItem)
    w1ViewPopup.addChild(w1LayersItem)
    w1ViewPopup.addChild(new UIMenuItemWC({ text: 'Zoom In', shortcut: 'Ctrl++' }))
    w1ViewPopup.addChild(new UIMenuItemWC({ text: 'Zoom Out', shortcut: 'Ctrl+-' }))
    w1ViewPopup.addChild(new UIMenuItemWC({ text: 'Full Screen', shortcut: 'F11', leftElement: makeIcon(I.maximize) }))

    bar7.addItem(w1ViewItem, w1ViewPopup)

    win1.contentElement.style.display = 'flex'
    win1.contentElement.style.flexDirection = 'column'
    win1.contentElement.appendChild(bar7)
    const w1Body = document.createElement('div')
    w1Body.style.cssText = 'flex:1;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;'
    for (const label of ['New Doc', 'Save', 'Undo', 'Redo', 'Bold', 'Italic']) {
      const btn = document.createElement('ui-button') as HTMLElement
      btn.setAttribute('variant', 'outline'); btn.setAttribute('size', 'small')
      btn.setAttribute('data-focusable', ''); btn.textContent = label
      w1Body.appendChild(btn)
    }
    win1.contentElement.appendChild(w1Body)

    // Window 2 — with detachable root + 3-level Image menu
    const win2 = new UIWindowWC({ title: 'Editor Window', left: 300, top: 50, width: 420, height: 300 })
    const bar8 = new UIMenuBarWC()

    // File menu — ROOT detachable
    const w2FileItem = new UIMenuItemWC({ text: 'File' })
    const w2FilePopup = new UIPopupWC({ anchor: w2FileItem, kind: 'menu', width: 200, height: 'auto', detachable: true, title: 'File' })
    w2FilePopup.addChild(new UIMenuItemWC({ text: 'New', shortcut: 'Ctrl+N', leftElement: makeIcon(I.file) }))
    w2FilePopup.addChild(new UIMenuItemWC({ text: 'Open', shortcut: 'Ctrl+O', leftElement: makeIcon(I.folder) }))
    w2FilePopup.addChild(new UIMenuItemWC({ text: 'Save', shortcut: 'Ctrl+S', leftElement: makeIcon(I.save) }))
    w2FilePopup.addChild(new UIMenuItemWC({ text: 'Print...', shortcut: 'Ctrl+P', disabled: true }))
    bar8.addItem(w2FileItem, w2FilePopup)

    // Image menu — ROOT detachable, 3 levels: Adjustments → Color → Presets
    const w2ImageItem = new UIMenuItemWC({ text: 'Image', leftElement: makeIcon(I.image) })
    const w2ImagePopup = new UIPopupWC({ anchor: w2ImageItem, kind: 'menu', width: 200, height: 'auto', detachable: true, title: 'Image' })

    const w2AdjItem = new UIMenuItemWC({ text: 'Adjustments', leftElement: makeIcon(I.wand) })
    const w2AdjSub = new UIPopupWC({ anchor: w2AdjItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Adjustments' })

    const w2ColorItem = new UIMenuItemWC({ text: 'Color', leftElement: makeIcon(I.brush) })
    const w2ColorSub = new UIPopupWC({ anchor: w2ColorItem, kind: 'menu', width: 160, height: 'auto', detachable: true, title: 'Color' })

    const w2PresetsItem = new UIMenuItemWC({ text: 'Presets', leftElement: makeIcon(I.sparkles) })
    makeSubMenu(w2PresetsItem, ['Vivid', 'Muted', 'Sepia', 'B&W', 'Cinematic'], { detachable: true, title: 'Presets' })

    w2ColorSub.addChild(new UIMenuItemWC({ text: 'Brightness' }))
    w2ColorSub.addChild(new UIMenuItemWC({ text: 'Contrast' }))
    w2ColorSub.addChild(new UIMenuItemWC({ text: 'Saturation' }))
    w2ColorSub.addChild(w2PresetsItem)
    w2ColorItem.subMenu = w2ColorSub

    w2AdjSub.addChild(w2ColorItem)
    w2AdjSub.addChild(new UIMenuItemWC({ text: 'Levels', leftElement: makeIcon(I.layers) }))
    w2AdjSub.addChild(new UIMenuItemWC({ text: 'Curves', disabled: true }))
    w2AdjItem.subMenu = w2AdjSub

    const w2TransformItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(I.move) })
    makeSubMenu(w2TransformItem, ['Rotate 90° CW', 'Rotate 90° CCW', 'Flip H', 'Flip V'], { detachable: true, title: 'Transform' })

    w2ImagePopup.addChild(w2AdjItem)
    w2ImagePopup.addChild(w2TransformItem)
    w2ImagePopup.addChild(new UIMenuItemWC({ text: 'Crop', shortcut: 'Ctrl+Shift+X', leftElement: makeIcon(I.maximize) }))
    w2ImagePopup.addChild(new UIMenuItemWC({ text: 'Resize...', leftElement: makeIcon(I.move) }))

    bar8.addItem(w2ImageItem, w2ImagePopup)

    // View menu — ROOT detachable
    const w2ViewItem = new UIMenuItemWC({ text: 'View' })
    const w2ViewPopup = new UIPopupWC({ anchor: w2ViewItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'View' })
    w2ViewPopup.addChild(new UIMenuItemWC({ text: 'Word Wrap', leftElement: makeIcon(I.type) }))
    w2ViewPopup.addChild(new UIMenuItemWC({ text: 'Line Numbers' }))
    w2ViewPopup.addChild(new UIMenuItemWC({ text: 'Minimap' }))
    w2ViewPopup.addChild(new UIMenuItemWC({ text: 'Status Bar' }))
    bar8.addItem(w2ViewItem, w2ViewPopup)

    win2.contentElement.style.display = 'flex'
    win2.contentElement.style.flexDirection = 'column'
    win2.contentElement.appendChild(bar8)
    const w2Body = document.createElement('div')
    w2Body.style.cssText = 'flex:1;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;'
    for (const label of ['Find', 'Replace', 'Go To Line', 'Select All']) {
      const btn = document.createElement('ui-button') as HTMLElement
      btn.setAttribute('variant', 'outline'); btn.setAttribute('size', 'small')
      btn.setAttribute('data-focusable', ''); btn.textContent = label
      w2Body.appendChild(btn)
    }
    win2.contentElement.appendChild(w2Body)

    sec7.appendChild(wm)
    container.appendChild(sec7)
    wm.addWindow(win1)
    wm.addWindow(win2)

    // ── 8. Standalone windows with MenuBar (no WindowManager) ──
    const sec8 = document.createElement('div')
    sec8.style.cssText = 'margin-bottom:40px;'
    sec8.innerHTML = '<h2 style="margin:0 0 12px;font-size:16px;">Standalone Windows with MenuBar (no WM)</h2>'

    const standaloneContainer = document.createElement('div')
    standaloneContainer.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;'

    // Window 3 — standalone, ROOT detachable + 3-level deep detachable menus
    const win3 = new UIWindowWC({ title: 'Window 3 (standalone)', left: 0, top: 0, width: 480, height: 320, positioning: 'relative' })
    const bar9 = new UIMenuBarWC()

    // File menu — ROOT detachable, 3 levels: New → From Template → Categories
    const w3FileItem = new UIMenuItemWC({ text: 'File', leftElement: makeIcon(I.file) })
    const w3FilePopup = new UIPopupWC({ anchor: w3FileItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'File' })

    const w3NewItem = new UIMenuItemWC({ text: 'New', leftElement: makeIcon(I.file) })
    const w3NewSub = new UIPopupWC({ anchor: w3NewItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'New' })

    const w3TemplateItem = new UIMenuItemWC({ text: 'From Template', leftElement: makeIcon(I.grid) })
    const w3TemplateSub = new UIPopupWC({ anchor: w3TemplateItem, kind: 'menu', width: 170, height: 'auto', detachable: true, title: 'Templates' })

    const w3CatItem = new UIMenuItemWC({ text: 'Categories', leftElement: makeIcon(I.layers) })
    makeSubMenu(w3CatItem, ['Business', 'Personal', 'Academic', 'Creative'], { detachable: true, title: 'Categories' })

    w3TemplateSub.addChild(new UIMenuItemWC({ text: 'Blank Document' }))
    w3TemplateSub.addChild(new UIMenuItemWC({ text: 'Letter' }))
    w3TemplateSub.addChild(new UIMenuItemWC({ text: 'Resume' }))
    w3TemplateSub.addChild(w3CatItem)
    w3TemplateItem.subMenu = w3TemplateSub

    w3NewSub.addChild(new UIMenuItemWC({ text: 'Document' }))
    w3NewSub.addChild(new UIMenuItemWC({ text: 'Spreadsheet' }))
    w3NewSub.addChild(new UIMenuItemWC({ text: 'Presentation' }))
    w3NewSub.addChild(new UIMenuItemWC({ text: 'Drawing' }))
    w3NewSub.addChild(w3TemplateItem)
    w3NewItem.subMenu = w3NewSub

    const w3RecentItem = new UIMenuItemWC({ text: 'Recent Files', leftElement: makeIcon(I.folder) })
    makeSubMenu(w3RecentItem, ['report_2026.docx', 'budget.xlsx', 'slides.pptx', 'notes.txt', 'sketch.svg'], { detachable: true, title: 'Recent' })

    w3FilePopup.addChild(w3NewItem)
    w3FilePopup.addChild(new UIMenuItemWC({ text: 'Open...', shortcut: 'Ctrl+O', leftElement: makeIcon(I.folder) }))
    w3FilePopup.addChild(w3RecentItem)
    w3FilePopup.addChild(new UIMenuItemWC({ text: 'Save', shortcut: 'Ctrl+S', leftElement: makeIcon(I.save) }))
    w3FilePopup.addChild(new UIMenuItemWC({ text: 'Save As...', shortcut: 'Ctrl+Shift+S', leftElement: makeIcon(I.save) }))
    w3FilePopup.addChild(new UIMenuItemWC({ text: 'Export...', leftElement: makeIcon(I.image), disabled: true }))
    w3FilePopup.addChild(new UIMenuItemWC({ text: 'Close', shortcut: 'Ctrl+W', leftElement: makeIcon(I.x) }))

    bar9.addItem(w3FileItem, w3FilePopup)

    // Edit menu — ROOT detachable, with Transform → Rotate (3 levels)
    const w3EditItem = new UIMenuItemWC({ text: 'Edit', leftElement: makeIcon(I.type) })
    const w3EditPopup = new UIPopupWC({ anchor: w3EditItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'Edit' })

    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Undo', shortcut: 'Ctrl+Z', leftElement: makeIcon(I.undo) }))
    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Redo', shortcut: 'Ctrl+Y', leftElement: makeIcon(I.undo), disabled: true }))
    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Cut', shortcut: 'Ctrl+X' }))
    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Copy', shortcut: 'Ctrl+C' }))
    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Paste', shortcut: 'Ctrl+V' }))

    const w3TransItem = new UIMenuItemWC({ text: 'Transform', leftElement: makeIcon(I.move) })
    const w3TransSub = new UIPopupWC({ anchor: w3TransItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Transform' })
    const w3RotateItem = new UIMenuItemWC({ text: 'Rotate', leftElement: makeIcon(I.compass) })
    makeSubMenu(w3RotateItem, ['90° CW', '90° CCW', '180°', 'Custom...'], { detachable: true, title: 'Rotate' })
    w3TransSub.addChild(w3RotateItem)
    w3TransSub.addChild(new UIMenuItemWC({ text: 'Flip Horizontal' }))
    w3TransSub.addChild(new UIMenuItemWC({ text: 'Flip Vertical' }))
    w3TransSub.addChild(new UIMenuItemWC({ text: 'Scale...' }))
    w3TransItem.subMenu = w3TransSub
    w3EditPopup.addChild(w3TransItem)

    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Select All', shortcut: 'Ctrl+A' }))
    w3EditPopup.addChild(new UIMenuItemWC({ text: 'Find...', shortcut: 'Ctrl+F' }))

    bar9.addItem(w3EditItem, w3EditPopup)

    // View menu — ROOT detachable, Tool Palette + Layers (container)
    const w3ViewItem = new UIMenuItemWC({ text: 'View', leftElement: makeIcon(I.eye) })
    const w3ViewPopup = new UIPopupWC({ anchor: w3ViewItem, kind: 'menu', width: 200, height: 'auto', detachable: true, title: 'View' })

    const w3ToolsItem = new UIMenuItemWC({ text: 'Tool Palette', leftElement: makeIcon(I.brush) })
    const w3ToolsSub = new UIPopupWC({ anchor: w3ToolsItem, kind: 'menu', width: 160, height: 'auto', detachable: true, title: 'Tools' })
    for (const t of ['Brush', 'Eraser', 'Fill', 'Select', 'Gradient']) {
      w3ToolsSub.addChild(new UIMenuItemWC({ text: t }))
    }
    w3ToolsItem.subMenu = w3ToolsSub

    const w3LayersItem = new UIMenuItemWC({ text: 'Layers', leftElement: makeIcon(I.layers) })
    const w3LayersSub = new UIPopupWC({ anchor: w3LayersItem, kind: 'container', width: 190, height: 'auto', detachable: true, title: 'Layers' })
    const w3LayersContent = document.createElement('div')
    w3LayersContent.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 10px;font-size:13px;'
    for (const name of ['Background', 'Layer 1', 'Layer 2', 'Overlay', 'Effects']) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;'
      label.setAttribute('data-focusable', '')
      label.innerHTML = `<input type="checkbox" ${name === 'Background' ? 'checked' : ''}> ${name}`
      w3LayersContent.appendChild(label)
    }
    w3LayersSub.addChild(w3LayersContent)
    w3LayersItem.subMenu = w3LayersSub

    w3ViewPopup.addChild(w3ToolsItem)
    w3ViewPopup.addChild(w3LayersItem)
    w3ViewPopup.addChild(new UIMenuItemWC({ text: 'Zoom In', shortcut: 'Ctrl++' }))
    w3ViewPopup.addChild(new UIMenuItemWC({ text: 'Zoom Out', shortcut: 'Ctrl+-' }))
    w3ViewPopup.addChild(new UIMenuItemWC({ text: 'Full Screen', shortcut: 'F11', leftElement: makeIcon(I.maximize) }))

    bar9.addItem(w3ViewItem, w3ViewPopup)

    // Help menu — ROOT detachable
    const w3HelpItem = new UIMenuItemWC({ text: 'Help', leftElement: makeIcon(I.help) })
    const w3HelpPopup = new UIPopupWC({ anchor: w3HelpItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Help' })
    w3HelpPopup.addChild(new UIMenuItemWC({ text: 'Documentation', leftElement: makeIcon(I.help) }))
    w3HelpPopup.addChild(new UIMenuItemWC({ text: 'Release Notes', leftElement: makeIcon(I.file) }))
    w3HelpPopup.addChild(new UIMenuItemWC({ text: 'About', leftElement: makeIcon(I.compass) }))
    bar9.addItem(w3HelpItem, w3HelpPopup)

    win3.contentElement.style.display = 'flex'
    win3.contentElement.style.flexDirection = 'column'
    win3.contentElement.appendChild(bar9)
    const w3Body = document.createElement('div')
    w3Body.style.cssText = 'flex:1;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;'
    for (const label of ['New Doc', 'Save', 'Undo', 'Redo', 'Draw', 'Clear', 'Export']) {
      const btn = document.createElement('ui-button') as HTMLElement
      btn.setAttribute('variant', 'outline'); btn.setAttribute('size', 'small')
      btn.setAttribute('data-focusable', ''); btn.textContent = label
      w3Body.appendChild(btn)
    }
    win3.contentElement.appendChild(w3Body)
    standaloneContainer.appendChild(win3)

    // Window 4 — standalone, ROOT detachable + 3-level deep (Filters → Blur → Presets)
    const win4 = new UIWindowWC({ title: 'Window 4 (standalone)', left: 0, top: 0, width: 480, height: 320, positioning: 'relative' })
    const bar10 = new UIMenuBarWC()

    // Settings menu — ROOT detachable, Appearance (container) + Editor (container)
    const w4SettingsItem = new UIMenuItemWC({ text: 'Settings', leftElement: makeIcon(I.settings) })
    const w4SettingsPopup = new UIPopupWC({ anchor: w4SettingsItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'Settings' })

    const w4AppearItem = new UIMenuItemWC({ text: 'Appearance', leftElement: makeIcon(I.eye) })
    const w4AppearSub = new UIPopupWC({ anchor: w4AppearItem, kind: 'container', width: 220, height: 'auto', detachable: true, title: 'Appearance' })
    const w4AppearContent = document.createElement('div')
    w4AppearContent.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 10px;font-size:13px;'
    for (const t of ['Dark Mode', 'Compact View', 'Show Icons', 'Animate Transitions']) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;'
      label.setAttribute('data-focusable', '')
      label.innerHTML = `<input type="checkbox"> ${t}`
      w4AppearContent.appendChild(label)
    }
    w4AppearSub.addChild(w4AppearContent)
    w4AppearItem.subMenu = w4AppearSub

    const w4EditorItem = new UIMenuItemWC({ text: 'Editor', leftElement: makeIcon(I.type) })
    const w4EditorSub = new UIPopupWC({ anchor: w4EditorItem, kind: 'container', width: 220, height: 'auto', detachable: true, title: 'Editor Settings' })
    const w4EditorContent = document.createElement('div')
    w4EditorContent.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px 10px;font-size:13px;'
    for (const t of ['Word Wrap', 'Line Numbers', 'Minimap', 'Bracket Matching', 'Auto-Save']) {
      const label = document.createElement('label')
      label.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;'
      label.setAttribute('data-focusable', '')
      label.innerHTML = `<input type="checkbox"> ${t}`
      w4EditorContent.appendChild(label)
    }
    w4EditorSub.addChild(w4EditorContent)
    w4EditorItem.subMenu = w4EditorSub

    w4SettingsPopup.addChild(w4AppearItem)
    w4SettingsPopup.addChild(w4EditorItem)
    w4SettingsPopup.addChild(new UIMenuItemWC({ text: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S', leftElement: makeIcon(I.terminal) }))
    w4SettingsPopup.addChild(new UIMenuItemWC({ text: 'Reset to Defaults', disabled: true }))

    bar10.addItem(w4SettingsItem, w4SettingsPopup)

    // Tools menu — ROOT detachable, 3 levels: Brush → Presets → Custom
    const w4ToolsItem = new UIMenuItemWC({ text: 'Tools', leftElement: makeIcon(I.wand) })
    const w4ToolsPopup = new UIPopupWC({ anchor: w4ToolsItem, kind: 'menu', width: 220, height: 'auto', detachable: true, title: 'Tools' })

    const w4BrushItem = new UIMenuItemWC({ text: 'Brush Tool', leftElement: makeIcon(I.brush) })
    const w4BrushSub = new UIPopupWC({ anchor: w4BrushItem, kind: 'menu', width: 170, height: 'auto', detachable: true, title: 'Brush Types' })

    const w4BrushPresetsItem = new UIMenuItemWC({ text: 'Presets', leftElement: makeIcon(I.sparkles) })
    const w4BrushPresetsSub = new UIPopupWC({ anchor: w4BrushPresetsItem, kind: 'menu', width: 160, height: 'auto', detachable: true, title: 'Brush Presets' })
    const w4CustomItem = new UIMenuItemWC({ text: 'Custom', leftElement: makeIcon(I.settings) })
    makeSubMenu(w4CustomItem, ['Size', 'Opacity', 'Flow', 'Hardness'], { detachable: true, title: 'Custom Brush' })
    w4BrushPresetsSub.addChild(new UIMenuItemWC({ text: 'Soft Round' }))
    w4BrushPresetsSub.addChild(new UIMenuItemWC({ text: 'Hard Round' }))
    w4BrushPresetsSub.addChild(new UIMenuItemWC({ text: 'Textured' }))
    w4BrushPresetsSub.addChild(w4CustomItem)
    w4BrushPresetsItem.subMenu = w4BrushPresetsSub

    w4BrushSub.addChild(new UIMenuItemWC({ text: 'Round' }))
    w4BrushSub.addChild(new UIMenuItemWC({ text: 'Flat' }))
    w4BrushSub.addChild(new UIMenuItemWC({ text: 'Fan' }))
    w4BrushSub.addChild(new UIMenuItemWC({ text: 'Airbrush' }))
    w4BrushSub.addChild(w4BrushPresetsItem)
    w4BrushItem.subMenu = w4BrushSub

    const w4EraserItem = new UIMenuItemWC({ text: 'Eraser', leftElement: makeIcon(I.eraser) })
    makeSubMenu(w4EraserItem, ['Soft', 'Hard', 'Block', 'Background'], { detachable: true, title: 'Eraser Modes' })

    const w4FillItem = new UIMenuItemWC({ text: 'Fill Options', leftElement: makeIcon(I.bucket) })
    makeSubMenu(w4FillItem, ['Tolerance: Low', 'Tolerance: Medium', 'Tolerance: High', 'Contiguous', 'All Layers'], {
      kind: 'container', detachable: true, title: 'Fill Options', width: 200,
    })

    w4ToolsPopup.addChild(w4BrushItem)
    w4ToolsPopup.addChild(w4EraserItem)
    w4ToolsPopup.addChild(w4FillItem)
    w4ToolsPopup.addChild(new UIMenuItemWC({ text: 'Color Picker', shortcut: 'I', leftElement: makeIcon(I.eyeOff) }))
    w4ToolsPopup.addChild(new UIMenuItemWC({ text: 'Magic Wand', shortcut: 'W', leftElement: makeIcon(I.sparkles), disabled: true }))

    bar10.addItem(w4ToolsItem, w4ToolsPopup)

    // Filters menu — ROOT detachable, 3 levels: Blur → Gaussian → Quality
    const w4FiltersItem = new UIMenuItemWC({ text: 'Filters', leftElement: makeIcon(I.sparkles) })
    const w4FiltersPopup = new UIPopupWC({ anchor: w4FiltersItem, kind: 'menu', width: 200, height: 'auto', detachable: true, title: 'Filters' })

    const w4BlurItem = new UIMenuItemWC({ text: 'Blur', leftElement: makeIcon(I.eye) })
    const w4BlurSub = new UIPopupWC({ anchor: w4BlurItem, kind: 'menu', width: 170, height: 'auto', detachable: true, title: 'Blur' })

    const w4GaussianItem = new UIMenuItemWC({ text: 'Gaussian', leftElement: makeIcon(I.sparkles) })
    makeSubMenu(w4GaussianItem, ['Low (1px)', 'Medium (3px)', 'High (5px)', 'Custom...'], { detachable: true, title: 'Gaussian Blur' })

    w4BlurSub.addChild(w4GaussianItem)
    w4BlurSub.addChild(new UIMenuItemWC({ text: 'Motion' }))
    w4BlurSub.addChild(new UIMenuItemWC({ text: 'Radial' }))
    w4BlurSub.addChild(new UIMenuItemWC({ text: 'Box' }))
    w4BlurItem.subMenu = w4BlurSub

    const w4SharpenItem = new UIMenuItemWC({ text: 'Sharpen', leftElement: makeIcon(I.wand) })
    makeSubMenu(w4SharpenItem, ['Unsharp Mask', 'Smart Sharpen', 'High Pass'], { detachable: true, title: 'Sharpen' })

    w4FiltersPopup.addChild(w4BlurItem)
    w4FiltersPopup.addChild(w4SharpenItem)
    w4FiltersPopup.addChild(new UIMenuItemWC({ text: 'Noise Reduction', leftElement: makeIcon(I.sparkles), disabled: true }))
    w4FiltersPopup.addChild(new UIMenuItemWC({ text: 'Distort', leftElement: makeIcon(I.compass) }))

    bar10.addItem(w4FiltersItem, w4FiltersPopup)

    // Help menu — ROOT detachable
    const w4HelpItem = new UIMenuItemWC({ text: 'Help', leftElement: makeIcon(I.help) })
    const w4HelpPopup = new UIPopupWC({ anchor: w4HelpItem, kind: 'menu', width: 180, height: 'auto', detachable: true, title: 'Help' })
    w4HelpPopup.addChild(new UIMenuItemWC({ text: 'Documentation', leftElement: makeIcon(I.help) }))
    w4HelpPopup.addChild(new UIMenuItemWC({ text: 'Release Notes', leftElement: makeIcon(I.file) }))
    w4HelpPopup.addChild(new UIMenuItemWC({ text: 'Report a Bug', leftElement: makeIcon(I.terminal) }))
    w4HelpPopup.addChild(new UIMenuItemWC({ text: 'About', leftElement: makeIcon(I.compass) }))
    bar10.addItem(w4HelpItem, w4HelpPopup)

    win4.contentElement.style.display = 'flex'
    win4.contentElement.style.flexDirection = 'column'
    win4.contentElement.appendChild(bar10)
    const w4Body = document.createElement('div')
    w4Body.style.cssText = 'flex:1;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;'
    for (const label of ['Apply', 'Cancel', 'Reset', 'Import', 'Export', 'Preview']) {
      const btn = document.createElement('ui-button') as HTMLElement
      btn.setAttribute('variant', 'outline'); btn.setAttribute('size', 'small')
      btn.setAttribute('data-focusable', ''); btn.textContent = label
      w4Body.appendChild(btn)
    }
    win4.contentElement.appendChild(w4Body)
    standaloneContainer.appendChild(win4)

    sec8.appendChild(standaloneContainer)
    container.appendChild(sec8)
  },
}
