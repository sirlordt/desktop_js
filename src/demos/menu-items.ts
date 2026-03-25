import { UIMenuItem } from '../components/ui-menu-item/ui-menu-item'
import type { DemoRoute } from '../header'
import type { MenuItemSize } from '../components/common/types'

function makeSvgIcon(paths: string[], size = 16, opts?: { fill?: string; stroke?: string; strokeWidth?: number }): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', opts?.fill ?? 'none')
  svg.setAttribute('stroke', opts?.stroke ?? 'currentColor')
  svg.setAttribute('stroke-width', `${opts?.strokeWidth ?? 2}`)
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  for (const d of paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', d)
    svg.appendChild(path)
  }
  return svg as unknown as HTMLElement
}

// Icon library (Feather-style paths, viewBox 24x24)
const ICONS = {
  file:       ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6'],
  fileText:   ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  folder:     ['M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'],
  folderOpen: ['M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1', 'M2 10h20l-2 9H4z'],
  save:       ['M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  scissors:   ['M6 9a3 3 0 100-6 3 3 0 000 6z', 'M6 21a3 3 0 100-6 3 3 0 000 6z', 'M20 4L8.12 15.88', 'M14.47 14.48L20 20', 'M8.12 8.12L12 12'],
  copy:       ['M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z', 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'],
  clipboard:  ['M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2', 'M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z'],
  undo:       ['M3 10h10a5 5 0 010 10H13', 'M3 10l4-4', 'M3 10l4 4'],
  redo:       ['M21 10H11a5 5 0 000 10h2', 'M21 10l-4-4', 'M21 10l-4 4'],
  trash:      ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', 'M10 11v6', 'M14 11v6'],
  search:     ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  settings:   ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z'],
  print:      ['M6 9V2h12v7', 'M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2', 'M6 14h12v8H6z'],
  download:   ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  upload:     ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  zoomIn:     ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35', 'M11 8v6', 'M8 11h6'],
  zoomOut:    ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35', 'M8 11h6'],
  terminal:   ['M4 17l6-6-6-6', 'M12 19h8'],
  code:       ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  eye:        ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'],
  lock:       ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M7 11V7a5 5 0 0110 0v4'],
  refresh:    ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
  star:       ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
}

function icon(name: keyof typeof ICONS, size = 16): HTMLElement {
  return makeSvgIcon(ICONS[name], size)
}

function makeArrowSvg(size = 14): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('fill', 'currentColor')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M6 4l5 4-5 4z')
  svg.appendChild(path)
  return svg as unknown as HTMLElement
}

function makeDotSvg(color: string, size = 10): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`)
  svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 16 16')
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  circle.setAttribute('cx', '8')
  circle.setAttribute('cy', '8')
  circle.setAttribute('r', '5')
  circle.setAttribute('fill', color)
  svg.appendChild(circle)
  return svg as unknown as HTMLElement
}

function createSection(title: string, container: HTMLElement): HTMLDivElement {
  const section = document.createElement('div')
  section.style.cssText = 'margin-bottom: 24px;'
  const h2 = document.createElement('h2')
  h2.textContent = title
  h2.style.cssText = 'margin: 0 0 8px; font-size: 16px; font-weight: 600;'
  section.appendChild(h2)
  container.appendChild(section)
  return section
}

function createMenuContainer(width = 280): HTMLDivElement {
  const div = document.createElement('div')
  div.style.cssText = `width: ${width}px; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; background: var(--window-bg-color, #fff);`
  return div
}

function addSeparator(container: HTMLElement): void {
  const hr = document.createElement('div')
  hr.style.cssText = 'height: 1px; background: var(--border-color); margin: 2px 0;'
  container.appendChild(hr)
}

export const menuItemsDemo: DemoRoute = {
  id: 'menu-items',
  label: 'MenuItems',
  render: () => `<div id="menuitem-demo" class="demo-app" style="padding: 20px;"></div>`,
  setup: () => {
    const root = document.getElementById('menuitem-demo')!

    // ── File Menu with Icons ──
    const sec1 = createSection('File Menu', root)
    const menu1 = createMenuContainer(300)
    sec1.appendChild(menu1)

    const items1 = [
      new UIMenuItem({ text: 'New File', shortcut: 'Ctrl+N', leftElement: icon('file') }),
      new UIMenuItem({ text: 'Open File...', shortcut: 'Ctrl+O', leftElement: icon('folderOpen') }),
      new UIMenuItem({ text: 'Save', shortcut: 'Ctrl+S', leftElement: icon('save') }),
      new UIMenuItem({ text: 'Save As...', shortcut: 'Ctrl+Shift+S', leftElement: icon('download') }),
    ]
    items1.forEach(item => menu1.appendChild(item.element))
    addSeparator(menu1)
    new UIMenuItem({ text: 'Print...', shortcut: 'Ctrl+P', leftElement: icon('print') })
      .element && items1.push(new UIMenuItem({ text: 'Print...', shortcut: 'Ctrl+P', leftElement: icon('print') }))
    menu1.appendChild(new UIMenuItem({ text: 'Print...', shortcut: 'Ctrl+P', leftElement: icon('print') }).element)
    addSeparator(menu1)
    menu1.appendChild(new UIMenuItem({ text: 'Exit', shortcut: 'Alt+F4' }).element)

    // ── Edit Menu with Icons ──
    const sec1b = createSection('Edit Menu', root)
    const editRow = document.createElement('div')
    editRow.style.cssText = 'display: flex; gap: 16px; align-items: flex-start;'
    sec1b.appendChild(editRow)

    const menu1b = createMenuContainer(300)
    editRow.appendChild(menu1b)
    ;[
      new UIMenuItem({ text: 'Undo', shortcut: 'Ctrl+Z', leftElement: icon('undo') }),
      new UIMenuItem({ text: 'Redo', shortcut: 'Ctrl+Y', leftElement: icon('redo') }),
    ].forEach(i => menu1b.appendChild(i.element))
    addSeparator(menu1b)
    ;[
      new UIMenuItem({ text: 'Cut', shortcut: 'Ctrl+X', leftElement: icon('scissors') }),
      new UIMenuItem({ text: 'Copy', shortcut: 'Ctrl+C', leftElement: icon('copy') }),
      new UIMenuItem({ text: 'Paste', shortcut: 'Ctrl+V', leftElement: icon('clipboard') }),
      new UIMenuItem({ text: 'Delete', shortcut: 'Del', leftElement: icon('trash') }),
    ].forEach(i => menu1b.appendChild(i.element))
    addSeparator(menu1b)
    ;[
      new UIMenuItem({ text: 'Find...', shortcut: 'Ctrl+F', leftElement: icon('search') }),
      new UIMenuItem({ text: 'Replace...', shortcut: 'Ctrl+H', leftElement: icon('refresh') }),
    ].forEach(i => menu1b.appendChild(i.element))

    // ── View Menu with Icons ──
    const menu1c = createMenuContainer(300)
    editRow.appendChild(menu1c)
    ;[
      new UIMenuItem({ text: 'Zoom In', shortcut: 'Ctrl++', leftElement: icon('zoomIn') }),
      new UIMenuItem({ text: 'Zoom Out', shortcut: 'Ctrl+-', leftElement: icon('zoomOut') }),
    ].forEach(i => menu1c.appendChild(i.element))
    addSeparator(menu1c)
    ;[
      new UIMenuItem({ text: 'Terminal', shortcut: 'Ctrl+`', leftElement: icon('terminal') }),
      new UIMenuItem({ text: 'Source Code', shortcut: 'Ctrl+U', leftElement: icon('code') }),
      new UIMenuItem({ text: 'Preview', shortcut: 'Ctrl+K V', leftElement: icon('eye') }),
    ].forEach(i => menu1c.appendChild(i.element))
    addSeparator(menu1c)
    ;[
      new UIMenuItem({ text: 'Settings', shortcut: 'Ctrl+,', leftElement: icon('settings') }),
      new UIMenuItem({ text: 'Lock Screen', shortcut: 'Ctrl+L', leftElement: icon('lock') }),
    ].forEach(i => menu1c.appendChild(i.element))

    // ── Icons + Submenu Arrows ──
    const sec1d = createSection('Icons + Submenu Arrow', root)
    const menu1d = createMenuContainer(300)
    sec1d.appendChild(menu1d)
    ;[
      new UIMenuItem({ text: 'Bookmarks', leftElement: icon('star'), rightElement: makeArrowSvg() }),
      new UIMenuItem({ text: 'Downloads', leftElement: icon('download'), rightElement: makeArrowSvg() }),
      new UIMenuItem({ text: 'Recent Files', leftElement: icon('fileText'), rightElement: makeArrowSvg() }),
      new UIMenuItem({ text: 'Open Folder', leftElement: icon('folder') }),
      new UIMenuItem({ text: 'Upload File', leftElement: icon('upload'), shortcut: 'Ctrl+U' }),
    ].forEach(i => menu1d.appendChild(i.element))

    // ── Sizes ──
    const sec2 = createSection('Sizes', root)
    const sizesRow = document.createElement('div')
    sizesRow.style.cssText = 'display: flex; gap: 16px; align-items: flex-start;'
    sec2.appendChild(sizesRow)

    const sizes: MenuItemSize[] = ['small', 'medium', 'large']
    sizes.forEach(size => {
      const menuW = createMenuContainer(240)
      const label = document.createElement('div')
      label.textContent = size.toUpperCase()
      label.style.cssText = 'padding: 4px 8px; font-size: 11px; font-weight: bold; opacity: 0.5;'
      menuW.appendChild(label)
      const iconSize = size === 'small' ? 12 : size === 'large' ? 18 : 16
      const items = [
        new UIMenuItem({ text: 'Cut', size, shortcut: 'Ctrl+X', leftElement: icon('scissors', iconSize) }),
        new UIMenuItem({ text: 'Copy', size, shortcut: 'Ctrl+C', leftElement: icon('copy', iconSize) }),
        new UIMenuItem({ text: 'Paste', size, shortcut: 'Ctrl+V', leftElement: icon('clipboard', iconSize) }),
      ]
      items.forEach(i => menuW.appendChild(i.element))
      sizesRow.appendChild(menuW)
    })

    // ── Pushable (Toggle) ──
    const sec3 = createSection('Pushable / Toggle', root)
    const menu3 = createMenuContainer()
    sec3.appendChild(menu3)

    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'padding: 8px; font-size: 12px; opacity: 0.6;'
    statusLabel.textContent = 'Click items to toggle:'

    const toggleItems = [
      new UIMenuItem({ text: 'Word Wrap', pushable: true, pushed: true }),
      new UIMenuItem({ text: 'Show Line Numbers', pushable: true }),
      new UIMenuItem({ text: 'Minimap', pushable: true, pushed: true }),
      new UIMenuItem({ text: 'Breadcrumbs', pushable: true }),
    ]

    menu3.appendChild(statusLabel)
    toggleItems.forEach(item => {
      menu3.appendChild(item.element)
      item.onPushedChange((pushed) => {
        statusLabel.textContent = `${item.text}: ${pushed ? 'ON' : 'OFF'}`
      })
    })

    // ── Left & Right Elements ──
    const sec4 = createSection('Left & Right Elements', root)
    const menu4 = createMenuContainer(300)
    sec4.appendChild(menu4)

    const items4 = [
      new UIMenuItem({
        text: 'Errors',
        leftElement: makeDotSvg('#e01b24'),
        rightElement: makeArrowSvg(),
      }),
      new UIMenuItem({
        text: 'Warnings',
        leftElement: makeDotSvg('#e5a50a'),
        rightElement: makeArrowSvg(),
      }),
      new UIMenuItem({
        text: 'Info',
        leftElement: makeDotSvg('#3584e4'),
      }),
      new UIMenuItem({
        text: 'Success',
        leftElement: makeDotSvg('#2ec27e'),
      }),
    ]
    items4.forEach(item => menu4.appendChild(item.element))

    // ── Disabled ──
    const sec5 = createSection('Disabled Items', root)
    const menu5 = createMenuContainer()
    sec5.appendChild(menu5)

    const items5 = [
      new UIMenuItem({ text: 'Undo', shortcut: 'Ctrl+Z' }),
      new UIMenuItem({ text: 'Redo', shortcut: 'Ctrl+Y', disabled: true }),
      new UIMenuItem({ text: 'Cut', shortcut: 'Ctrl+X', disabled: true }),
      new UIMenuItem({ text: 'Copy', shortcut: 'Ctrl+C' }),
      new UIMenuItem({ text: 'Paste', shortcut: 'Ctrl+V' }),
    ]
    items5.forEach(item => menu5.appendChild(item.element))

    // ── Text Alignment ──
    const sec6 = createSection('Text Alignment', root)
    const alignRow = document.createElement('div')
    alignRow.style.cssText = 'display: flex; gap: 16px; align-items: flex-start;'
    sec6.appendChild(alignRow)

    const aligns = ['left', 'center', 'right'] as const
    aligns.forEach(align => {
      const menuW = createMenuContainer(200)
      const label = document.createElement('div')
      label.textContent = align.toUpperCase()
      label.style.cssText = 'padding: 4px 8px; font-size: 11px; font-weight: bold; opacity: 0.5;'
      menuW.appendChild(label)
      const items = [
        new UIMenuItem({ text: 'Option A', textAlign: align, leftElement: icon('file') }),
        new UIMenuItem({ text: 'Option B', textAlign: align, leftElement: icon('folder') }),
        new UIMenuItem({ text: 'Option C', textAlign: align, leftElement: icon('star') }),
      ]
      items.forEach(i => menuW.appendChild(i.element))
      alignRow.appendChild(menuW)
    })

    // ── Truncation with Hint ──
    const sec7 = createSection('Truncation (hover to see hint)', root)
    const menu7 = createMenuContainer(200)
    sec7.appendChild(menu7)

    const items7 = [
      new UIMenuItem({ text: 'Short', leftElement: icon('file') }),
      new UIMenuItem({ text: 'This is a very long menu item text that should be truncated', leftElement: icon('fileText') }),
      new UIMenuItem({ text: 'Another extremely long text entry that definitely will not fit in this container width', leftElement: icon('search') }),
      new UIMenuItem({ text: 'Normal length', leftElement: icon('star') }),
    ]
    items7.forEach(item => menu7.appendChild(item.element))

    // ── Center Element (extra widget) ──
    const sec8 = createSection('Center Element (Label + Widget)', root)
    const menu8 = createMenuContainer(300)
    sec8.appendChild(menu8)

    const zoomInput = document.createElement('input')
    zoomInput.type = 'number'
    zoomInput.value = '100'
    zoomInput.min = '25'
    zoomInput.max = '400'
    zoomInput.step = '25'
    zoomInput.style.cssText = 'width: 50px; height: 18px; font-size: 11px; text-align: center; border: 1px solid var(--border-color); background: var(--window-bg-color); color: inherit; border-radius: 2px;'

    const zoomItem = new UIMenuItem({
      text: 'Zoom:',
      leftElement: icon('zoomIn'),
      centerElement: zoomInput,
    })
    menu8.appendChild(zoomItem.element)

    const selectEl = document.createElement('select')
    selectEl.style.cssText = 'height: 18px; font-size: 11px; border: 1px solid var(--border-color); background: var(--window-bg-color); color: inherit; border-radius: 2px;'
    ;['Auto', 'UTF-8', 'ASCII', 'ISO-8859-1'].forEach(enc => {
      const opt = document.createElement('option')
      opt.textContent = enc
      selectEl.appendChild(opt)
    })

    const encodingItem = new UIMenuItem({
      text: 'Encoding:',
      leftElement: icon('settings'),
      centerElement: selectEl,
    })
    menu8.appendChild(encodingItem.element)
  },
}
