import { UIScrollBar } from '../components/ui-scrollbar/ui-scrollbar'
import type { ScrollBarSize, UIScrollBarOptions } from '../components/common/types'
import type { DemoRoute } from '../header'

const allSbs: UIScrollBar[] = []

export const scrollbarDemo: DemoRoute = {
  id: 'scrollbar',
  label: 'Scrollbar',

  render: () => `
    <div id="scrollbar-demo-content"></div>
  `,

  setup: () => {
    // Clean up previous instances
    for (const s of allSbs) s.destroy()
    allSbs.length = 0

    const container = document.getElementById('scrollbar-demo-content')!

    const sizes: ScrollBarSize[] = ['small', 'medium', 'large']

    for (const sz of sizes) {
      const vHeight = sz === 'large' ? '120px' : sz === 'medium' ? '100px' : '80px'
      const hWidth = '200px'

      const section = document.createElement('section')
      section.className = 'demo-section'

      const title = document.createElement('h2')
      title.textContent = `Size: ${sz}`
      section.appendChild(title)

      // --- Standard ---
      addRow(section, 'Standard', (row) => {
        const h = sb({ kind: 'horizontal', size: sz, max: 100, value: 40 }, hWidth)
        const v = sb({ kind: 'vertical', size: sz, max: 100, value: 60 }, undefined, vHeight)
        row.appendChild(h.element); row.appendChild(v.element)
        allSbs.push(h, v)
      })

      // --- No buttons ---
      addRow(section, 'No buttons', (row) => {
        const h = sb({ kind: 'horizontal', size: sz, max: 100, value: 50, showStartZone: false, showEndZone: false }, hWidth)
        const v = sb({ kind: 'vertical', size: sz, max: 100, value: 50, showStartZone: false, showEndZone: false }, undefined, vHeight)
        row.appendChild(h.element); row.appendChild(v.element)
        allSbs.push(h, v)
      })

      // --- Hover mode ---
      addRow(section, 'Hover mode', (row) => {
        const h = sb({ kind: 'horizontal', size: sz, max: 100, value: 40, hover: true }, hWidth)
        const v = sb({ kind: 'vertical', size: sz, max: 100, value: 60, hover: true }, undefined, vHeight)
        row.appendChild(h.element); row.appendChild(v.element)
        allSbs.push(h, v)
      })

      // --- Hover mode + no buttons ---
      addRow(section, 'Hover + no buttons', (row) => {
        const h = sb({ kind: 'horizontal', size: sz, max: 100, value: 35, hover: true, showStartZone: false, showEndZone: false }, hWidth)
        const v = sb({ kind: 'vertical', size: sz, max: 100, value: 55, hover: true, showStartZone: false, showEndZone: false }, undefined, vHeight)
        row.appendChild(h.element); row.appendChild(v.element)
        allSbs.push(h, v)
      })

      // --- Custom buttons ---
      addRow(section, 'Custom buttons (before/after)', (row) => {
        const s = sb({ kind: 'horizontal', size: sz, max: 100, value: 50, showTooltip: true }, '260px')
        const btnSize = sz === 'large' ? '28px' : sz === 'medium' ? '20px' : '14px'
        const lineW = sz === 'large' ? '10px' : sz === 'medium' ? '8px' : '6px'
        const lineH = sz === 'large' ? '3px' : '2px'

        const before = document.createElement('div')
        before.className = 'ui-scrollbar__btn'
        Object.assign(before.style, {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: btnSize, height: '100%', cursor: 'pointer',
        })
        const minusLine = document.createElement('div')
        Object.assign(minusLine.style, { width: lineW, height: lineH, backgroundColor: 'currentColor' })
        before.appendChild(minusLine)
        before.addEventListener('click', () => s.decrease(10))
        s.insertBeforeDecBtn(before)

        const after = document.createElement('div')
        after.className = 'ui-scrollbar__btn'
        Object.assign(after.style, {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: btnSize, height: '100%', cursor: 'pointer', position: 'relative',
        })
        const plusH = document.createElement('div')
        Object.assign(plusH.style, { width: lineW, height: lineH, backgroundColor: 'currentColor', position: 'absolute' })
        const plusV = document.createElement('div')
        Object.assign(plusV.style, { width: lineH, height: lineW, backgroundColor: 'currentColor', position: 'absolute' })
        after.appendChild(plusH)
        after.appendChild(plusV)
        after.addEventListener('click', () => s.increase(10))
        s.insertAfterIncBtn(after)

        row.appendChild(s.element)
        allSbs.push(s)
      })

      // --- Stacked buttons after ---
      addRow(section, 'Stacked after (2 extra)', (row) => {
        for (const kind of ['horizontal', 'vertical'] as const) {
          const w = kind === 'horizontal' ? '280px' : undefined
          const h = kind === 'vertical' ? '150px' : undefined
          const s = sb({ kind, size: sz, max: 100, value: 50 }, w, h)

          for (let i = 0; i < 2; i++) {
            const btn = makeCustomBtn(sz, i === 0 ? 'square' : 'circle')
            btn.addEventListener('click', () => s.increase(5))
            s.insertAfterIncBtn(btn)
          }

          row.appendChild(s.element)
          allSbs.push(s)
        }
      })

      // --- Fixed thumb size ---
      addRow(section, 'Fixed thumb size', (row) => {
        row.style.flexWrap = 'wrap'
        const thumbSizes = [
          { ts: 20, label: '20px' },
          { ts: 40, label: '40px' },
          { ts: '15%', label: '15%' },
          { ts: '30%', label: '30%' },
          { ts: '50%', label: '50%' },
        ]
        for (const t of thumbSizes) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = t.label
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const s = sb({ kind: 'horizontal', size: sz, max: 1000, value: 300, thumbSize: t.ts, showTooltip: true }, '160px')
          wrapper.appendChild(s.element)
          row.appendChild(wrapper)
          allSbs.push(s)
        }
      })

      // --- Different ranges ---
      addRow(section, 'Different ranges', (row) => {
        row.style.flexWrap = 'wrap'
        for (const r of [20, 100, 1000, 10000]) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = `max=${r}`
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const s = sb({ kind: 'horizontal', size: sz, max: r, value: r / 3, pageStep: 10 }, '160px')
          wrapper.appendChild(s.element)
          row.appendChild(wrapper)
          allSbs.push(s)
        }
      })

      // --- Custom min/max ranges ---
      addRow(section, 'Custom min/max (tooltip)', (row) => {
        row.style.flexWrap = 'wrap'
        const ranges = [
          { min: 0, max: 100, value: 50, label: '0..100' },
          { min: -100, max: 100, value: 0, label: '-100..100' },
          { min: -50, max: 50, value: -25, label: '-50..50' },
          { min: 200, max: 500, value: 350, label: '200..500' },
        ]
        for (const r of ranges) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = r.label
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const s = sb({ kind: 'horizontal', size: sz, min: r.min, max: r.max, value: r.value, showTooltip: true }, '160px')
          wrapper.appendChild(s.element)
          row.appendChild(wrapper)
          allSbs.push(s)
        }
      })

      // --- Tooltip color ranges ---
      addRow(section, 'Tooltip color by value (ranges)', (row) => {
        const s = sb({
          kind: 'horizontal', size: sz,
          min: 100, max: 500, value: 200, showTooltip: true,
          tooltipColors: [
            { from: 100, to: 250, bg: '#16a34a', bold: true },
            { from: 251, to: 350, bg: '#ea580c', bold: true },
            { from: 351, to: 500, bg: '#dc2626', bold: true },
          ],
        }, '300px')
        row.appendChild(s.element)
        allSbs.push(s)
      })

      // --- Tooltip color callback ---
      addRow(section, 'Tooltip color by callback (gradient)', (row) => {
        const s = sb({
          kind: 'horizontal', size: sz,
          min: 0, max: 100, value: 50, showTooltip: true,
          onTooltipColor: (value, min, max) => {
            const pct = (value - min) / (max - min)
            const r = Math.round(255 * pct)
            const g = Math.round(255 * (1 - pct))
            return { bg: `rgb(${r}, ${g}, 0)`, color: '#fff' }
          },
        }, '300px')
        row.appendChild(s.element)
        allSbs.push(s)
      })

      // --- Wheel factor ---
      addRow(section, 'Wheel factor (0.5x / 1x / 3x / 10x)', (row) => {
        row.style.flexWrap = 'wrap'
        for (const wf of [0.5, 1, 3, 10]) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = `${wf}x`
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const s = sb({ kind: 'horizontal', size: sz, max: 100, value: 50, wheelFactor: wf, showTooltip: true }, '150px')
          wrapper.appendChild(s.element)
          row.appendChild(wrapper)
          allSbs.push(s)
        }
      })

      // --- Disabled ---
      addRow(section, 'Disabled', (row) => {
        const h = sb({ kind: 'horizontal', size: sz, max: 100, value: 40, disabled: true }, hWidth)
        const v = sb({ kind: 'vertical', size: sz, max: 100, value: 60, disabled: true }, undefined, vHeight)
        row.appendChild(h.element); row.appendChild(v.element)
        allSbs.push(h, v)
      })

      container.appendChild(section)
    }

    // --- Layout integration ---
    const layoutSection = document.createElement('section')
    layoutSection.className = 'demo-section'

    const layoutTitle = document.createElement('h2')
    layoutTitle.textContent = 'Layout integration'
    layoutSection.appendChild(layoutTitle)

    const layoutBody = document.createElement('div')
    Object.assign(layoutBody.style, {
      height: '250px', display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden',
    })

    const hWrapper = document.createElement('div')
    Object.assign(hWrapper.style, { flex: '1', display: 'flex', minHeight: '0' })

    const contentArea = document.createElement('div')
    Object.assign(contentArea.style, {
      flex: '1', backgroundColor: 'var(--view-bg-color)',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--button-disabled-fg-color)', fontSize: '14px',
    })
    contentArea.textContent = 'Content area'

    const vScroll = new UIScrollBar({ kind: 'vertical', max: 200, value: 50, showTooltip: true, hover: true })
    Object.assign(vScroll.element.style, { height: '100%' })
    allSbs.push(vScroll)

    hWrapper.appendChild(contentArea)
    hWrapper.appendChild(vScroll.element)

    const bottomRow = document.createElement('div')
    Object.assign(bottomRow.style, { display: 'flex' })

    const hScroll = new UIScrollBar({ kind: 'horizontal', max: 300, value: 100, showTooltip: true, hover: true })
    Object.assign(hScroll.element.style, { flex: '1' })
    allSbs.push(hScroll)

    const corner = document.createElement('div')
    Object.assign(corner.style, { width: '14px', height: '14px', flexShrink: '0' })

    bottomRow.appendChild(hScroll.element)
    bottomRow.appendChild(corner)

    layoutBody.appendChild(hWrapper)
    layoutBody.appendChild(bottomRow)
    layoutSection.appendChild(layoutBody)
    container.appendChild(layoutSection)

    // Refresh all after layout
    requestAnimationFrame(() => allSbs.forEach(s => s.refresh()))
  },
}

// =====================
// Helpers
// =====================

function sb(opts: UIScrollBarOptions, width?: string, height?: string): UIScrollBar {
  const s = new UIScrollBar(opts)
  if (width) s.element.style.width = width
  if (height) s.element.style.height = height
  return s
}

function makeCustomBtn(size: ScrollBarSize, icon: 'square' | 'circle'): HTMLDivElement {
  const btnPx = size === 'large' ? 28 : size === 'medium' ? 20 : 14
  const iconPx = size === 'large' ? 8 : size === 'medium' ? 6 : 4

  const btn = document.createElement('div')
  btn.className = 'ui-scrollbar__btn'
  Object.assign(btn.style, {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: `${btnPx}px`, height: `${btnPx}px`, cursor: 'pointer',
  })

  const shape = document.createElement('div')
  Object.assign(shape.style, {
    width: `${iconPx}px`, height: `${iconPx}px`,
    backgroundColor: 'currentColor',
    borderRadius: icon === 'circle' ? '50%' : '0',
  })
  btn.appendChild(shape)

  return btn
}

function addRow(parent: HTMLElement, label: string, build: (row: HTMLDivElement) => void): void {
  const lbl = document.createElement('div')
  lbl.textContent = label
  lbl.style.cssText = 'font-size:11px;color:var(--button-disabled-fg-color);margin-bottom:6px;'
  parent.appendChild(lbl)

  const row = document.createElement('div')
  row.className = 'btn-demo-row'
  row.style.marginBottom = '10px'
  build(row)
  parent.appendChild(row)
}
