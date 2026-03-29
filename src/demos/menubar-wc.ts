import { UIMenuBarWC } from '../components/ui-menubar-wc/ui-menubar-wc'
import { UIMenuItemWC } from '../components/ui-menu-item-wc/ui-menu-item-wc'
import { UIPopupWC } from '../components/ui-popup-wc/ui-popup-wc'
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
  },
}
