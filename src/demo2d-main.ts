import './style.css'
import { UIScrollbar2DWC } from './components/ui-scrollbar2d-wc/ui-scrollbar2d-wc'
import { setTheme, getTheme } from './header'
import type { ScrollBar2DOptions } from './components/common/types'

const THEMES = [
  { value: 'gtk4-light', label: 'GTK4 Light' },
  { value: 'gtk4-dark', label: 'GTK4 Dark' },
  { value: 'win95-light', label: 'WIN95 Light' },
  { value: 'win95-dark', label: 'WIN95 Dark' },
] as const

const allSbs: UIScrollbar2DWC[] = []

function renderPage() {
  for (const s of allSbs) s.destroy()
  allSbs.length = 0

  const theme = getTheme()
  const app = document.getElementById('app')!
  app.innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <span class="header-title">Desktop.js — 2D Canvas</span>
        <nav class="header-nav">
          <a href="/" class="nav-link">Back to main</a>
        </nav>
      </div>
      <div class="header-right">
        <label for="theme-select" class="header-theme-label">Theme:</label>
        <select id="theme-select" class="header-theme-select">
          ${THEMES.map(t => `<option value="${t.value}" ${t.value === theme ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
    </header>
    <main class="demo-content" id="demo2d-content"></main>
  `

  setTheme(theme)

  const select = document.querySelector<HTMLSelectElement>('#theme-select')!
  select.addEventListener('change', () => {
    setTheme(select.value)
  })

  const container = document.getElementById('demo2d-content')!
  buildDemos(container)
}

function buildDemos(container: HTMLElement) {
  // ── Sizes: small, normal, large ──
  const sizes: Array<{ label: string, size: 'small' | 'normal' | 'large', bs: number, vHeight: number, hWidth: number }> = [
    { label: 'Small', size: 'small', bs: 16, vHeight: 180, hWidth: 250 },
    { label: 'Normal', size: 'normal', bs: 18, vHeight: 250, hWidth: 350 },
    { label: 'Large', size: 'large', bs: 24, vHeight: 350, hWidth: 450 },
  ]

  for (const sz of sizes) {
    addSection(container, `Size: ${sz.label}`, (body) => {
      addRow(body, 'Vertical & Horizontal', (row) => {
        row.style.gap = '24px'
        const v = sb2d({
          kind: 'vertical', size: sz.size, width: sz.bs, height: sz.vHeight,
          min: 0, max: 200, visibleSize: 50, step: 1, pageStep: 20,
        })
        const vInfo = infoLabel(v)

        const h = sb2d({
          kind: 'horizontal', size: sz.size, width: sz.hWidth, height: sz.bs,
          min: 0, max: 300, visibleSize: 80, step: 1, pageStep: 30,
        })
        const hInfo = infoLabel(h)

        const vWrap = wrapWithLabel('Vertical', v, vInfo)
        const hWrap = wrapWithLabel('Horizontal', h, hInfo)
        row.appendChild(vWrap)
        row.appendChild(hWrap)
      })

      addRow(body, 'Custom min/max — -100..100', (row) => {
        const s = sb2d({
          kind: 'horizontal', size: sz.size, width: sz.hWidth, height: sz.bs,
          min: -100, max: 100, value: 0, visibleSize: 40, step: 1, pageStep: 20,
        })
        const info = infoLabel(s)
        row.appendChild(s)
        row.appendChild(info)
      })
    })
  }

  // ── Hidden buttons ──
  addSection(container, 'Hidden buttons', (body) => {
    addRow(body, 'No buttons', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: false, showForwardButton: false,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: false, showForwardButton: false,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })

    addRow(body, 'Only forward button', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: false, showForwardButton: true,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: false, showForwardButton: true,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })

    addRow(body, 'Only back button', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: true, showForwardButton: false,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25,
        showBackButton: true, showForwardButton: false,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })
  })

  // ── Custom buttons ──
  addSection(container, 'Custom buttons (before/after)', (body) => {
    addRow(body, 'Minus before, Plus after', (row) => {
      const s = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25,
        startButtons: [{ icon: 'minus', onClick: () => { s.value -= 10 } }],
        endButtons: [{ icon: 'plus', onClick: () => { s.value += 10 } }],
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })

    addRow(body, 'Stacked after (square + circle)', (row) => {
      row.style.gap = '24px'
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25,
        endButtons: [
          { icon: 'square', onClick: () => { h.value = 0 } },
          { icon: 'circle', onClick: () => { h.value = 100 } },
        ],
      })
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, visibleSize: 25,
        endButtons: [
          { icon: 'square', onClick: () => { v.value = 0 } },
          { icon: 'circle', onClick: () => { v.value = 100 } },
        ],
      })
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      row.appendChild(hWrap)
      row.appendChild(vWrap)
    })

    addRow(body, 'Small — minus/plus', (row) => {
      row.style.gap = '24px'
      const h = sb2d({
        kind: 'horizontal', size: 'small', width: 250, height: 16,
        min: 0, max: 100, visibleSize: 25,
        startButtons: [{ icon: 'minus', onClick: () => { h.value -= 10 } }],
        endButtons: [{ icon: 'plus', onClick: () => { h.value += 10 } }],
      })
      const v = sb2d({
        kind: 'vertical', size: 'small', width: 16, height: 180,
        min: 0, max: 100, visibleSize: 25,
        startButtons: [{ icon: 'minus', onClick: () => { v.value -= 10 } }],
        endButtons: [{ icon: 'plus', onClick: () => { v.value += 10 } }],
      })
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      row.appendChild(hWrap)
      row.appendChild(vWrap)
    })

    addRow(body, 'Large — minus/plus + stacked square/circle', (row) => {
      row.style.gap = '24px'
      const h = sb2d({
        kind: 'horizontal', size: 'large', width: 450, height: 24,
        min: 0, max: 100, visibleSize: 25,
        startButtons: [{ icon: 'minus', onClick: () => { h.value -= 10 } }],
        endButtons: [
          { icon: 'plus', onClick: () => { h.value += 10 } },
          { icon: 'square', onClick: () => { h.value = 0 } },
          { icon: 'circle', onClick: () => { h.value = 100 } },
        ],
      })
      const v = sb2d({
        kind: 'vertical', size: 'large', width: 24, height: 350,
        min: 0, max: 100, visibleSize: 25,
        startButtons: [{ icon: 'minus', onClick: () => { v.value -= 10 } }],
        endButtons: [
          { icon: 'plus', onClick: () => { v.value += 10 } },
          { icon: 'square', onClick: () => { v.value = 0 } },
          { icon: 'circle', onClick: () => { v.value = 100 } },
        ],
      })
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      row.appendChild(hWrap)
      row.appendChild(vWrap)
    })
  })

  // ── Disabled ──
  addSection(container, 'Disabled', (body) => {
    addRow(body, 'Disabled scrollbars', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, value: 40, visibleSize: 25, enabled: false,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, value: 60, visibleSize: 25, enabled: false,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })

    addRow(body, 'Disabled large with custom buttons', (row) => {
      const s = sb2d({
        kind: 'horizontal', size: 'large', width: 450, height: 24,
        min: 0, max: 100, value: 30, visibleSize: 25, enabled: false,
        startButtons: [{ icon: 'minus', onClick: () => {} }],
        endButtons: [{ icon: 'plus', onClick: () => {} }],
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })
  })

  // ── Slim mode ──
  addSection(container, 'Slim mode (hover or Tab to focus — thumb pulses on keyboard focus)', (body) => {
    addRow(body, 'Slim with buttons (focusable)', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'large', width: 24, height: 300,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'large', width: 400, height: 24,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })

    addRow(body, 'Slim without buttons (focusable)', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'large', width: 24, height: 300,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
        showBackButton: false, showForwardButton: false,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'large', width: 400, height: 24,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
        showBackButton: false, showForwardButton: false,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })

    addRow(body, 'Slim normal size (focusable)', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, visibleSize: 25, slim: true, focusable: true,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })
  })

  // ── Thumb proportions ──
  addSection(container, 'Thumb proportions (different visibleSize)', (body) => {
    for (const vis of [10, 25, 50, 100, 200]) {
      addRow(body, `visibleSize=${vis}, max=200`, (row) => {
        const s = sb2d({
          kind: 'horizontal', width: 300, height: 16, barSize: 16,
          min: 0, max: 200, visibleSize: vis,
        })
        row.appendChild(s)
      })
    }
  })

  // ── Keyboard & wheel ──
  addSection(container, 'Keyboard & wheel — focusable (Tab to focus, thumb pulses)', (body) => {
    addRow(body, 'Vertical — ArrowUp/Down, PageUp/Down, Home/End, mouse wheel', (row) => {
      const s = sb2d({
        kind: 'vertical', size: 'normal', width: 18, height: 250,
        min: 0, max: 100, value: 50, visibleSize: 25, step: 2, pageStep: 10, focusable: true,
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })

    addRow(body, 'Horizontal — ArrowLeft/Right, PageUp/Down, Home/End, mouse wheel', (row) => {
      const s = sb2d({
        kind: 'horizontal', size: 'normal', width: 350, height: 18,
        min: 0, max: 100, value: 50, visibleSize: 25, step: 2, pageStep: 10, focusable: true,
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })

    addRow(body, 'Slim focusable — Tab to see pulse, then use keys', (row) => {
      row.style.gap = '24px'
      const v = sb2d({
        kind: 'vertical', size: 'large', width: 24, height: 300,
        min: 0, max: 100, value: 50, visibleSize: 25, step: 2, pageStep: 10,
        slim: true, focusable: true,
      })
      const h = sb2d({
        kind: 'horizontal', size: 'large', width: 400, height: 24,
        min: 0, max: 100, value: 50, visibleSize: 25, step: 2, pageStep: 10,
        slim: true, focusable: true,
      })
      const vWrap = wrapWithLabel('Vertical', v, infoLabel(v))
      const hWrap = wrapWithLabel('Horizontal', h, infoLabel(h))
      row.appendChild(vWrap)
      row.appendChild(hWrap)
    })
  })

  // ── Button repeat ──
  addSection(container, 'Button repeat (hold a button to keep scrolling)', (body) => {
    addRow(body, 'Hold the arrow buttons', (row) => {
      const s = sb2d({
        kind: 'horizontal', width: 400, height: 16, barSize: 16,
        min: 0, max: 500, visibleSize: 50, step: 3,
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })
  })

  // ── Custom theme override ──
  addSection(container, 'Custom theme override (ignores global theme)', (body) => {
    addRow(body, 'Blue theme', (row) => {
      const s = sb2d({
        kind: 'horizontal', width: 350, height: 18, barSize: 16,
        min: 0, max: 100, visibleSize: 30,
        theme: {
          trackFill: '#1e293b',
          trackStroke: '#334155',
          thumbFill: '#3b82f6',
          thumbHoverFill: '#60a5fa',
          thumbDragFill: '#2563eb',
          buttonFill: '#1e3a5f',
          buttonHoverFill: '#2563eb',
          buttonArrowStroke: '#93c5fd',
          cornerFill: '#0f172a',
        },
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })

    addRow(body, 'Green theme', (row) => {
      const s = sb2d({
        kind: 'vertical', width: 20, height: 250, barSize: 20,
        min: 0, max: 100, visibleSize: 30,
        theme: {
          trackFill: '#14532d',
          trackStroke: '#166534',
          thumbFill: '#22c55e',
          thumbHoverFill: '#4ade80',
          thumbDragFill: '#16a34a',
          buttonFill: '#15803d',
          buttonHoverFill: '#22c55e',
          buttonArrowStroke: '#bbf7d0',
          cornerFill: '#052e16',
        },
      })
      const info = infoLabel(s)
      row.appendChild(s)
      row.appendChild(info)
    })
  })
}

// ── Helpers ──

function sb2d(opts: ScrollBar2DOptions): UIScrollbar2DWC {
  const s = new UIScrollbar2DWC()
  s.configure(opts)
  allSbs.push(s)
  return s
}

function infoLabel(s: UIScrollbar2DWC): HTMLSpanElement {
  const lbl = document.createElement('span')
  lbl.style.cssText = 'font-family:monospace; font-size:12px; color:var(--button-fg-color); min-width:80px; align-self:flex-start; margin-top:4px;'
  lbl.textContent = `${Math.round(s.value)}`
  s.addEventListener('sb2d-change', () => {
    lbl.textContent = `${Math.round(s.value)}`
  })
  return lbl
}

function addSection(parent: HTMLElement, title: string, build: (body: HTMLElement) => void) {
  const section = document.createElement('section')
  section.className = 'demo-section'
  const h2 = document.createElement('h2')
  h2.textContent = title
  section.appendChild(h2)
  build(section)
  parent.appendChild(section)
}

function addRow(parent: HTMLElement, label: string, build: (row: HTMLDivElement) => void) {
  const lbl = document.createElement('div')
  lbl.textContent = label
  lbl.style.cssText = 'font-size:11px;color:var(--button-disabled-fg-color);margin-bottom:6px;padding-left:16px;'
  parent.appendChild(lbl)

  const row = document.createElement('div')
  row.className = 'btn-demo-row'
  row.style.cssText = 'margin-bottom:16px;padding-left:16px;'
  build(row)
  parent.appendChild(row)
}

function wrapWithLabel(title: string, scrollbar: HTMLElement, info: HTMLElement): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:4px;'
  const lbl = document.createElement('span')
  lbl.textContent = title
  lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
  const row = document.createElement('div')
  row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;'
  row.appendChild(scrollbar)
  row.appendChild(info)
  wrap.appendChild(lbl)
  wrap.appendChild(row)
  return wrap
}

// Init
setTheme(getTheme())
renderPage()
