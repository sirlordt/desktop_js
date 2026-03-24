import { UIScrollBar } from '../components/ui-scrollbar/ui-scrollbar'
import { UIToolButton } from '../components/common/ui-tool-button'
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

    const sizes: ScrollBarSize[] = ['tiny', 'small', 'medium', 'large', 'xlarge']

    for (const sz of sizes) {
      const vHeight = sz === 'xlarge' ? '220px' : sz === 'large' ? '180px' : sz === 'medium' ? '150px' : sz === 'small' ? '120px' : '100px'
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
        const btnPx = sz === 'xlarge' ? 36 : sz === 'large' ? 28 : sz === 'medium' ? 20 : sz === 'small' ? 14 : 10

        const minusBtn = new UIToolButton({
          icon: 'minus', size: btnPx,
          className: 'ui-scrollbar__btn',
        })
        minusBtn.element.style.height = '100%'
        minusBtn.onClick(() => s.decrease(10))
        s.insertBeforeDecBtn(minusBtn.element)

        const plusBtn = new UIToolButton({
          icon: 'plus', size: btnPx,
          className: 'ui-scrollbar__btn',
        })
        plusBtn.element.style.height = '100%'
        plusBtn.onClick(() => s.increase(10))
        s.insertAfterIncBtn(plusBtn.element)

        row.appendChild(s.element)
        allSbs.push(s)
      })

      // --- Stacked buttons after ---
      addRow(section, 'Stacked after (2 extra)', (row) => {
        // Vertical needs extra height: 4 buttons (arrow + 2 custom + arrow) + track space
        const btnPx = sz === 'xlarge' ? 36 : sz === 'large' ? 28 : sz === 'medium' ? 20 : sz === 'small' ? 14 : 10
        const stackedVHeight = `${btnPx * 4 + 80}px`
        for (const kind of ['horizontal', 'vertical'] as const) {
          const w = kind === 'horizontal' ? '280px' : undefined
          const h = kind === 'vertical' ? stackedVHeight : undefined
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

    // --- Custom size section ---
    const customSection = document.createElement('section')
    customSection.className = 'demo-section'
    const customTitle = document.createElement('h2')
    customTitle.textContent = 'Size: custom'
    customSection.appendChild(customTitle)

    // Horizontal custom sizes
    addRow(customSection, 'Custom horizontal sizes (8px, 16px, 24px, 42px)', (row) => {
      for (const h of [8, 16, 24, 42]) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
        const lbl = document.createElement('span')
        lbl.textContent = `${h}px`
        lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
        wrapper.appendChild(lbl)
        const s = sb({ kind: 'horizontal', size: 'custom', customHeight: h, max: 100, value: 40, showTooltip: true }, '200px')
        wrapper.appendChild(s.element)
        row.appendChild(wrapper)
        allSbs.push(s)
      }
    })

    // Vertical custom sizes
    addRow(customSection, 'Custom vertical sizes (8px, 16px, 24px, 42px)', (row) => {
      for (const w of [8, 16, 24, 42]) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
        const lbl = document.createElement('span')
        lbl.textContent = `${w}px`
        lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
        wrapper.appendChild(lbl)
        const s = sb({ kind: 'vertical', size: 'custom', customWidth: w, max: 100, value: 60, showTooltip: true }, undefined, '120px')
        wrapper.appendChild(s.element)
        row.appendChild(wrapper)
        allSbs.push(s)
      }
    })

    // No buttons
    addRow(customSection, 'No buttons (6px, 12px, 24px)', (row) => {
      for (const h of [6, 12, 24]) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
        const lbl = document.createElement('span')
        lbl.textContent = `${h}px`
        lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
        wrapper.appendChild(lbl)
        const s = sb({ kind: 'horizontal', size: 'custom', customHeight: h, max: 100, value: 50, showStartZone: false, showEndZone: false }, '200px')
        wrapper.appendChild(s.element)
        row.appendChild(wrapper)
        allSbs.push(s)
      }
    })

    // Hover mode custom
    addRow(customSection, 'Hover mode (16px, 24px, 36px)', (row) => {
      for (const h of [16, 24, 36]) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
        const lbl = document.createElement('span')
        lbl.textContent = `${h}px`
        lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
        wrapper.appendChild(lbl)
        const s = sb({ kind: 'horizontal', size: 'custom', customHeight: h, max: 100, value: 40, hover: true, showTooltip: true }, '200px')
        wrapper.appendChild(s.element)
        row.appendChild(wrapper)
        allSbs.push(s)
      }
    })

    // Fixed thumb + custom size + tooltip
    addRow(customSection, 'Fixed thumb 30% on custom sizes', (row) => {
      for (const h of [12, 20, 32]) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
        const lbl = document.createElement('span')
        lbl.textContent = `${h}px`
        lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
        wrapper.appendChild(lbl)
        const s = sb({ kind: 'horizontal', size: 'custom', customHeight: h, max: 500, value: 150, thumbSize: '30%', showTooltip: true }, '200px')
        wrapper.appendChild(s.element)
        row.appendChild(wrapper)
        allSbs.push(s)
      }
    })

    // Disabled custom
    addRow(customSection, 'Disabled (24px)', (row) => {
      const h = sb({ kind: 'horizontal', size: 'custom', customHeight: 24, max: 100, value: 40, disabled: true }, '200px')
      const v = sb({ kind: 'vertical', size: 'custom', customWidth: 24, max: 100, value: 60, disabled: true }, undefined, '120px')
      row.appendChild(h.element); row.appendChild(v.element)
      allSbs.push(h, v)
    })

    container.appendChild(customSection)

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
  const btnPx = size === 'xlarge' ? 36 : size === 'large' ? 28 : size === 'medium' ? 20 : size === 'small' ? 14 : 10
  const iconPx = size === 'xlarge' ? 10 : size === 'large' ? 8 : size === 'medium' ? 6 : size === 'small' ? 4 : 3

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
