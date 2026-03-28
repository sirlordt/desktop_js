import { UIMenuItemWC } from '../components/ui-menu-item-wc/ui-menu-item-wc'
import type { DemoRoute } from '../header'
import type { MenuItemSize } from '../components/common/types'

function makeSvgIcon(paths: string[], size = 16, opts?: { fill?: string; stroke?: string; strokeWidth?: number }): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`); svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', opts?.fill ?? 'none'); svg.setAttribute('stroke', opts?.stroke ?? 'currentColor')
  svg.setAttribute('stroke-width', `${opts?.strokeWidth ?? 2}`)
  svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round')
  for (const d of paths) { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); svg.appendChild(p) }
  return svg as unknown as HTMLElement
}

const ICONS: Record<string, string[]> = {
  file: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6'],
  fileText: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
  folder: ['M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'],
  folderOpen: ['M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1', 'M2 10h20l-2 9H4z'],
  save: ['M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z', 'M17 21v-8H7v8', 'M7 3v5h8'],
  scissors: ['M6 9a3 3 0 100-6 3 3 0 000 6z', 'M6 21a3 3 0 100-6 3 3 0 000 6z', 'M20 4L8.12 15.88', 'M14.47 14.48L20 20', 'M8.12 8.12L12 12'],
  copy: ['M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z', 'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1'],
  clipboard: ['M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2', 'M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z'],
  undo: ['M3 10h10a5 5 0 010 10H13', 'M3 10l4-4', 'M3 10l4 4'],
  redo: ['M21 10H11a5 5 0 000 10h2', 'M21 10l-4-4', 'M21 10l-4 4'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2', 'M10 11v6', 'M14 11v6'],
  search: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35'],
  settings: ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z'],
  print: ['M6 9V2h12v7', 'M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2', 'M6 14h12v8H6z'],
  download: ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  zoomIn: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35', 'M11 8v6', 'M8 11h6'],
  zoomOut: ['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35', 'M8 11h6'],
  star: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
  lock: ['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M7 11V7a5 5 0 0110 0v4'],
  terminal: ['M4 17l6-6-6-6', 'M12 19h8'],
  code: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  eye: ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'],
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
  upload: ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
}

const ic = (name: string, size = 16) => makeSvgIcon(ICONS[name], size)

function makeArrowSvg(size = 14): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`); svg.setAttribute('height', `${size}`)
  svg.setAttribute('viewBox', '0 0 16 16'); svg.setAttribute('fill', 'currentColor')
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.setAttribute('d', 'M6 4l5 4-5 4z'); svg.appendChild(p)
  return svg as unknown as HTMLElement
}

function makeDotSvg(color: string, size = 10): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', `${size}`); svg.setAttribute('height', `${size}`); svg.setAttribute('viewBox', '0 0 16 16')
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  c.setAttribute('cx', '8'); c.setAttribute('cy', '8'); c.setAttribute('r', '5'); c.setAttribute('fill', color)
  svg.appendChild(c); return svg as unknown as HTMLElement
}

function section(title: string, root: HTMLElement): HTMLDivElement {
  const s = document.createElement('div'); s.style.cssText = 'margin-bottom:24px;'
  const h = document.createElement('h2'); h.textContent = title; h.style.cssText = 'margin:0 0 8px;font-size:16px;font-weight:600;'
  s.appendChild(h); root.appendChild(s); return s
}

function menuBox(width = 280): HTMLDivElement {
  const d = document.createElement('div')
  d.style.cssText = `width:${width}px;border:1px solid var(--border-color);border-radius:6px;overflow:hidden;background:var(--window-bg-color,#fff);`
  return d
}

function sep(container: HTMLElement): void {
  const hr = document.createElement('div'); hr.style.cssText = 'height:1px;background:var(--border-color);margin:2px 0;'
  container.appendChild(hr)
}

export const menuItemsWCDemo: DemoRoute = {
  id: 'menu-items-wc',
  label: 'MenuItems WC',
  render: () => `<div id="menuitem-wc-demo" class="demo-app" style="padding:20px;"></div>`,
  setup: () => {
    const root = document.getElementById('menuitem-wc-demo')!

    // ── File Menu ──
    const s1 = section('File Menu', root)
    const m1 = menuBox(300); s1.appendChild(m1)
    for (const o of [
      { text: 'New File', shortcut: 'Ctrl+N', leftElement: ic('file') },
      { text: 'Open File...', shortcut: 'Ctrl+O', leftElement: ic('folderOpen') },
      { text: 'Save', shortcut: 'Ctrl+S', leftElement: ic('save') },
      { text: 'Save As...', shortcut: 'Ctrl+Shift+S', leftElement: ic('download') },
    ]) m1.appendChild(new UIMenuItemWC(o))
    sep(m1)
    m1.appendChild(new UIMenuItemWC({ text: 'Print...', shortcut: 'Ctrl+P', leftElement: ic('print') }))
    sep(m1)
    m1.appendChild(new UIMenuItemWC({ text: 'Exit', shortcut: 'Alt+F4' }))

    // ── Edit Menu ──
    const s2 = section('Edit Menu', root)
    const editRow = document.createElement('div'); editRow.style.cssText = 'display:flex;gap:16px;align-items:flex-start;'
    s2.appendChild(editRow)

    const m2a = menuBox(300); editRow.appendChild(m2a)
    for (const o of [
      { text: 'Undo', shortcut: 'Ctrl+Z', leftElement: ic('undo') },
      { text: 'Redo', shortcut: 'Ctrl+Y', leftElement: ic('redo') },
    ]) m2a.appendChild(new UIMenuItemWC(o))
    sep(m2a)
    for (const o of [
      { text: 'Cut', shortcut: 'Ctrl+X', leftElement: ic('scissors') },
      { text: 'Copy', shortcut: 'Ctrl+C', leftElement: ic('copy') },
      { text: 'Paste', shortcut: 'Ctrl+V', leftElement: ic('clipboard') },
      { text: 'Delete', shortcut: 'Del', leftElement: ic('trash') },
    ]) m2a.appendChild(new UIMenuItemWC(o))
    sep(m2a)
    for (const o of [
      { text: 'Find...', shortcut: 'Ctrl+F', leftElement: ic('search') },
      { text: 'Replace...', shortcut: 'Ctrl+H', leftElement: ic('refresh') },
    ]) m2a.appendChild(new UIMenuItemWC(o))

    const m2b = menuBox(300); editRow.appendChild(m2b)
    for (const o of [
      { text: 'Zoom In', shortcut: 'Ctrl++', leftElement: ic('zoomIn') },
      { text: 'Zoom Out', shortcut: 'Ctrl+-', leftElement: ic('zoomOut') },
    ]) m2b.appendChild(new UIMenuItemWC(o))
    sep(m2b)
    for (const o of [
      { text: 'Terminal', shortcut: 'Ctrl+`', leftElement: ic('terminal') },
      { text: 'Source Code', shortcut: 'Ctrl+U', leftElement: ic('code') },
      { text: 'Preview', shortcut: 'Ctrl+K V', leftElement: ic('eye') },
    ]) m2b.appendChild(new UIMenuItemWC(o))
    sep(m2b)
    for (const o of [
      { text: 'Settings', shortcut: 'Ctrl+,', leftElement: ic('settings') },
      { text: 'Lock Screen', shortcut: 'Ctrl+L', leftElement: ic('lock') },
    ]) m2b.appendChild(new UIMenuItemWC(o))

    // ── Icons + Submenu Arrow ──
    const s3 = section('Icons + Submenu Arrow', root)
    const m3 = menuBox(300); s3.appendChild(m3)
    for (const o of [
      { text: 'Bookmarks', leftElement: ic('star'), rightElement: makeArrowSvg() },
      { text: 'Downloads', leftElement: ic('download'), rightElement: makeArrowSvg() },
      { text: 'Recent Files', leftElement: ic('fileText'), rightElement: makeArrowSvg() },
      { text: 'Open Folder', leftElement: ic('folder') },
      { text: 'Upload File', leftElement: ic('upload'), shortcut: 'Ctrl+U' },
    ]) m3.appendChild(new UIMenuItemWC(o))

    // ── Sizes ──
    const s4 = section('Sizes', root)
    const sizesRow = document.createElement('div'); sizesRow.style.cssText = 'display:flex;gap:16px;align-items:flex-start;'
    s4.appendChild(sizesRow)
    for (const size of ['small', 'medium', 'large'] as MenuItemSize[]) {
      const m = menuBox(240)
      const lbl = document.createElement('div'); lbl.textContent = size.toUpperCase()
      lbl.style.cssText = 'padding:4px 8px;font-size:11px;font-weight:bold;opacity:0.5;'
      m.appendChild(lbl)
      const icoSz = size === 'small' ? 12 : size === 'large' ? 18 : 16
      for (const o of [
        { text: 'Cut', size, shortcut: 'Ctrl+X', leftElement: ic('scissors', icoSz) },
        { text: 'Copy', size, shortcut: 'Ctrl+C', leftElement: ic('copy', icoSz) },
        { text: 'Paste', size, shortcut: 'Ctrl+V', leftElement: ic('clipboard', icoSz) },
      ]) m.appendChild(new UIMenuItemWC(o))
      sizesRow.appendChild(m)
    }

    // ── Pushable ──
    const s5 = section('Pushable / Toggle', root)
    const m5 = menuBox(); s5.appendChild(m5)
    const statusLabel = document.createElement('div')
    statusLabel.style.cssText = 'padding:8px;font-size:12px;opacity:0.6;'
    statusLabel.textContent = 'Click items to toggle:'
    m5.appendChild(statusLabel)
    for (const o of [
      { text: 'Word Wrap', pushable: true, pushed: true },
      { text: 'Show Line Numbers', pushable: true },
      { text: 'Minimap', pushable: true, pushed: true },
      { text: 'Breadcrumbs', pushable: true },
    ]) {
      const item = new UIMenuItemWC(o)
      m5.appendChild(item)
      item.onPushedChange((pushed) => { statusLabel.textContent = `${item.text}: ${pushed ? 'ON' : 'OFF'}` })
    }

    // ── Left & Right Elements ──
    const s6 = section('Left & Right Elements', root)
    const m6 = menuBox(300); s6.appendChild(m6)
    for (const o of [
      { text: 'Errors', leftElement: makeDotSvg('#e01b24'), rightElement: makeArrowSvg() },
      { text: 'Warnings', leftElement: makeDotSvg('#e5a50a'), rightElement: makeArrowSvg() },
      { text: 'Info', leftElement: makeDotSvg('#3584e4') },
      { text: 'Success', leftElement: makeDotSvg('#2ec27e') },
    ]) m6.appendChild(new UIMenuItemWC(o))

    // ── Disabled ──
    const s7 = section('Disabled Items', root)
    const m7 = menuBox(); s7.appendChild(m7)
    for (const o of [
      { text: 'Undo', shortcut: 'Ctrl+Z' },
      { text: 'Redo', shortcut: 'Ctrl+Y', disabled: true },
      { text: 'Cut', shortcut: 'Ctrl+X', disabled: true },
      { text: 'Copy', shortcut: 'Ctrl+C' },
      { text: 'Paste', shortcut: 'Ctrl+V' },
    ]) m7.appendChild(new UIMenuItemWC(o))

    // ── Text Alignment ──
    const s8 = section('Text Alignment', root)
    const alignRow = document.createElement('div'); alignRow.style.cssText = 'display:flex;gap:16px;align-items:flex-start;'
    s8.appendChild(alignRow)
    for (const align of ['left', 'center', 'right'] as const) {
      const m = menuBox(200)
      const lbl = document.createElement('div'); lbl.textContent = align.toUpperCase()
      lbl.style.cssText = 'padding:4px 8px;font-size:11px;font-weight:bold;opacity:0.5;'
      m.appendChild(lbl)
      for (const o of [
        { text: 'Option A', textAlign: align, leftElement: ic('file') },
        { text: 'Option B', textAlign: align, leftElement: ic('folder') },
        { text: 'Option C', textAlign: align, leftElement: ic('star') },
      ]) m.appendChild(new UIMenuItemWC(o))
      alignRow.appendChild(m)
    }

    // ── Truncation ──
    const s9 = section('Truncation (hover to see hint)', root)
    const m9 = menuBox(200); s9.appendChild(m9)
    for (const o of [
      { text: 'Short', leftElement: ic('file') },
      { text: 'This is a very long menu item text that should be truncated', leftElement: ic('fileText') },
      { text: 'Another extremely long text entry that definitely will not fit', leftElement: ic('search') },
      { text: 'Normal length', leftElement: ic('star') },
    ]) m9.appendChild(new UIMenuItemWC(o))

    // ── Center Element ──
    const s10 = section('Center Element (Label + Widget)', root)
    const m10 = menuBox(300); s10.appendChild(m10)
    const zoomInput = document.createElement('input')
    zoomInput.type = 'number'; zoomInput.value = '100'; zoomInput.min = '25'; zoomInput.max = '400'; zoomInput.step = '25'
    zoomInput.style.cssText = 'width:50px;height:18px;font-size:11px;text-align:center;border:1px solid var(--border-color);background:var(--window-bg-color);color:inherit;border-radius:2px;'
    m10.appendChild(new UIMenuItemWC({ text: 'Zoom:', leftElement: ic('zoomIn'), centerElement: zoomInput }))

    const selectEl = document.createElement('select')
    selectEl.style.cssText = 'height:18px;font-size:11px;border:1px solid var(--border-color);background:var(--window-bg-color);color:inherit;border-radius:2px;'
    for (const enc of ['Auto', 'UTF-8', 'ASCII', 'ISO-8859-1']) { const opt = document.createElement('option'); opt.textContent = enc; selectEl.appendChild(opt) }
    m10.appendChild(new UIMenuItemWC({ text: 'Encoding:', leftElement: ic('settings'), centerElement: selectEl }))
  },
}
