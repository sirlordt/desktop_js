import { UIScrollBox } from '../components/ui-scrollbox/ui-scrollbox'
import { UIPanel } from '../components/ui-panel/ui-panel'
import type { ScrollBarSize, ScrollMode, VerticalScrollPosition, HorizontalScrollPosition, ScrollBoxScrollBarConfig } from '../components/common/types'
import type { DemoRoute } from '../header'

const allBoxes: UIScrollBox[] = []

export const scrollboxDemo: DemoRoute = {
  id: 'scrollbox',
  label: 'ScrollBox',

  render: () => `
    <div id="scrollbox-demo-content"></div>
  `,

  setup: () => {
    for (const b of allBoxes) b.destroy()
    allBoxes.length = 0

    const container = document.getElementById('scrollbox-demo-content')!
    const sizes: ScrollBarSize[] = ['tiny', 'small', 'medium', 'large', 'xlarge']

    for (const sz of sizes) {
      const section = document.createElement('section')
      section.className = 'demo-section'

      const title = document.createElement('h2')
      title.textContent = `Size: ${sz}`
      section.appendChild(title)

      const boxW = sz === 'xlarge' ? 500 : sz === 'large' ? 450 : sz === 'medium' ? 400 : sz === 'small' ? 350 : 300
      const boxH = 220

      // --- Both scroll ---
      addRow(section, 'Both scroll (default)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both' })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Vertical only: left, right, both ---
      addRow(section, 'Vertical scroll (left / right / both)', (row) => {
        for (const pos of ['left', 'right', 'both'] as const) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;gap:8px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = pos
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const sb = makeBox({ sz, boxW: 180, boxH, scroll: 'vertical', verticalScroll: pos })
          wrapper.appendChild(sb.element)
          row.appendChild(wrapper)
          allBoxes.push(sb)
        }
      })

      // --- Horizontal only: top, bottom, both ---
      addRow(section, 'Horizontal scroll (top / bottom / both)', (row) => {
        row.style.flexDirection = 'column'
        row.style.alignItems = 'flex-start'
        for (const pos of ['top', 'bottom', 'both'] as const) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;gap:8px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = pos
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);width:40px;'
          wrapper.appendChild(lbl)
          const sb = makeBox({ sz, boxW, boxH: 70, scroll: 'horizontal', horizontalScroll: pos, contentH: 50 })
          wrapper.appendChild(sb.element)
          row.appendChild(wrapper)
          allBoxes.push(sb)
        }
      })

      // --- All 4 scrollbars ---
      addRow(section, 'All 4 scrollbars (vertical: both + horizontal: both)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both' })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Custom corner content ---
      addRow(section, 'Custom corner content (4 scrollbars)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both' })
        const cornerStyle = 'display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;color:var(--button-disabled-fg-color);'
        if (sb.cornerTopLeft) { sb.cornerTopLeft.style.cssText += cornerStyle; sb.cornerTopLeft.style.backgroundColor = '#fecaca'; sb.cornerTopLeft.textContent = 'TL' }
        if (sb.cornerTopRight) { sb.cornerTopRight.style.cssText += cornerStyle; sb.cornerTopRight.style.backgroundColor = '#bbf7d0'; sb.cornerTopRight.textContent = 'TR' }
        if (sb.cornerBottomLeft) { sb.cornerBottomLeft.style.cssText += cornerStyle; sb.cornerBottomLeft.style.backgroundColor = '#bfdbfe'; sb.cornerBottomLeft.textContent = 'BL' }
        if (sb.cornerBottomRight) { sb.cornerBottomRight.style.cssText += cornerStyle; sb.cornerBottomRight.style.backgroundColor = '#fde68a'; sb.cornerBottomRight.textContent = 'BR' }
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Hover mode ---
      addRow(section, 'Hover mode scrollbars', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', hover: true })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- 4 scrollbars + hover ---
      addRow(section, '4 scrollbars + hover', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both', hover: true })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- 4 scrollbars + tooltip ---
      addRow(section, '4 scrollbars + tooltip', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both', tooltip: true })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Per-scrollbar config ---
      addRow(section, 'Per-scrollbar config (hover right, tooltip bottom)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both',
          vRightConfig: { hover: true },
          hBottomConfig: { showTooltip: true },
        })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- No border ---
      addRow(section, 'No border (borderWidth: 0)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', borderW: 0 })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Wheel factor ---
      addRow(section, 'Wheel factor (0.5x / 1x / 5x)', (row) => {
        row.style.flexWrap = 'wrap'
        for (const wf of [0.5, 1, 5]) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = `${wf}x`
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const sb = makeBox({ sz, boxW: 250, boxH: 180, scroll: 'both',
            vRightConfig: { showTooltip: true },
            hBottomConfig: { showTooltip: true },
            wheelFactor: wf,
          })
          wrapper.appendChild(sb.element)
          allBoxes.push(sb)
          row.appendChild(wrapper)
        }
      })

      // --- Alt+Wheel horizontal ---
      addRow(section, 'Alt+Wheel horizontal (enabled / disabled)', (row) => {
        for (const enabled of [true, false]) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = enabled ? 'Alt+Wheel = H scroll' : 'Alt+Wheel disabled'
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const sb = makeBox({ sz, boxW: 250, boxH: 180, scroll: 'both', altWheelHorizontal: enabled })
          wrapper.appendChild(sb.element)
          allBoxes.push(sb)
          row.appendChild(wrapper)
        }
      })

      // --- Auto-hide scrollbars ---
      addRow(section, 'Auto-hide (content fits = no scrollbar)', (row) => {
        row.style.flexWrap = 'wrap'
        const cases = [
          { label: 'fits both', cW: 100, cH: 80 },
          { label: 'overflow V only', cW: 100, cH: 500 },
          { label: 'overflow H only', cW: 600, cH: 80 },
          { label: 'overflow both', cW: 600, cH: 500 },
        ]
        for (const c of cases) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center;'
          const lbl = document.createElement('span')
          lbl.textContent = c.label
          lbl.style.cssText = 'font-size:10px;color:var(--button-disabled-fg-color);'
          wrapper.appendChild(lbl)
          const sb = makeBox({ sz, boxW: 200, boxH: 150, scroll: 'both', contentW: c.cW, contentH: c.cH })
          wrapper.appendChild(sb.element)
          allBoxes.push(sb)
          row.appendChild(wrapper)
        }
      })

      // --- UIPanel child with anchored nested panel ---
      addRow(section, 'UIPanel child with anchored nested panel', (row) => {
        const sb = new UIScrollBox({
          scroll: 'both', scrollBarSize: sz,
          contentWidth: 600, contentHeight: 400,
        })
        sb.element.style.width = `${boxW}px`
        sb.element.style.height = `${boxH}px`

        const parentPanel = new UIPanel({
          name: 'parent', width: 600, height: 400,
          bg: 'var(--sidebar-bg-color)', borderColor: 'var(--accent-bg-color)', borderWidth: 1,
        })

        new UIPanel({
          parent: parentPanel, name: 'child',
          width: 120, height: 80, right: 30, bottom: 20,
          anchors: { toLeft: false, toTop: false, toRight: true, toBottom: true },
          bg: 'var(--error-bg-color)', borderColor: 'var(--error-bg-color)', borderWidth: 1,
        })

        const panelEl = parentPanel.render()
        sb.contentElement.appendChild(panelEl)
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- No scroll ---
      addRow(section, 'No scroll (scroll: none)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'none' })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      // --- Disabled ---
      addRow(section, 'Disabled', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', disabled: true })
        row.appendChild(sb.element)
        allBoxes.push(sb)
      })

      container.appendChild(section)
    }

    // Refresh all after layout
    requestAnimationFrame(() => allBoxes.forEach(b => b.refresh()))
  },
}

// =====================
// Helpers
// =====================

interface MakeBoxOpts {
  sz: ScrollBarSize
  boxW: number
  boxH: number
  scroll: ScrollMode
  verticalScroll?: VerticalScrollPosition
  horizontalScroll?: HorizontalScrollPosition
  hover?: boolean
  tooltip?: boolean
  borderW?: number
  disabled?: boolean
  wheelFactor?: number
  altWheelHorizontal?: boolean
  contentW?: number
  contentH?: number
  hTopConfig?: ScrollBoxScrollBarConfig
  hBottomConfig?: ScrollBoxScrollBarConfig
  vLeftConfig?: ScrollBoxScrollBarConfig
  vRightConfig?: ScrollBoxScrollBarConfig
}

function makeBox(o: MakeBoxOpts): UIScrollBox {
  const contentW = o.contentW ?? 800
  const contentH = o.contentH ?? 600

  const sb = new UIScrollBox({
    scroll: o.scroll,
    verticalScroll: o.verticalScroll,
    horizontalScroll: o.horizontalScroll,
    scrollBarSize: o.sz,
    scrollBarHover: o.hover,
    scrollBarTooltip: o.tooltip,
    wheelFactor: o.wheelFactor,
    altWheelHorizontal: o.altWheelHorizontal,
    hScrollTopConfig: o.hTopConfig,
    hScrollBottomConfig: o.hBottomConfig,
    vScrollLeftConfig: o.vLeftConfig,
    vScrollRightConfig: o.vRightConfig,
    contentWidth: contentW,
    contentHeight: contentH,
    borderWidth: o.borderW,
    disabled: o.disabled,
  })
  sb.element.style.width = `${o.boxW}px`
  sb.element.style.height = `${o.boxH}px`

  // Fill with color grid
  const cols = Math.ceil(contentW / 50)
  const rows = Math.ceil(contentH / 50)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div')
      const hue = ((r * cols + c) * 17) % 360
      Object.assign(cell.style, {
        position: 'absolute',
        left: `${c * 50}px`,
        top: `${r * 50}px`,
        width: '48px',
        height: '48px',
        backgroundColor: `hsl(${hue}, 60%, 70%)`,
        border: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#333',
      })
      cell.textContent = `${c},${r}`
      sb.contentElement.appendChild(cell)
    }
  }

  return sb
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
