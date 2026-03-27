import { ScrollBoxWC } from '../components/ui-scrollbox-wc/ui-scrollbox-wc'
import type { ScrollBarSize, ScrollMode, VerticalScrollPosition, HorizontalScrollPosition, ScrollBoxScrollBarConfig } from '../components/common/types'
import type { DemoRoute } from '../header'

const allBoxes: ScrollBoxWC[] = []

export const scrollboxWCDemo: DemoRoute = {
  id: 'scrollbox-wc',
  label: 'ScrollBox WC',

  render: () => `
    <div id="scrollbox-wc-demo-content"></div>
  `,

  setup: () => {
    for (const b of allBoxes) b.destroy()
    allBoxes.length = 0

    const container = document.getElementById('scrollbox-wc-demo-content')!
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
        row.appendChild(sb)
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
          wrapper.appendChild(sb)
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
          wrapper.appendChild(sb)
          row.appendChild(wrapper)
          allBoxes.push(sb)
        }
      })

      // --- All 4 scrollbars ---
      addRow(section, 'All 4 scrollbars (vertical: both + horizontal: both)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both' })
        row.appendChild(sb)
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
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- Hover mode ---
      addRow(section, 'Hover mode scrollbars', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', hover: true })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- 4 scrollbars + hover ---
      addRow(section, '4 scrollbars + hover', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both', hover: true })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- 4 scrollbars + tooltip ---
      addRow(section, '4 scrollbars + tooltip', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', verticalScroll: 'both', horizontalScroll: 'both', tooltip: true })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- Per-scrollbar config ---
      addRow(section, 'Per-scrollbar config (hover right, tooltip bottom)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both',
          vRightConfig: { hover: true },
          hBottomConfig: { showTooltip: true },
        })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- No border ---
      addRow(section, 'No border (borderWidth: 0)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', borderW: 0 })
        row.appendChild(sb)
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
          wrapper.appendChild(sb)
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
          wrapper.appendChild(sb)
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
          wrapper.appendChild(sb)
          allBoxes.push(sb)
          row.appendChild(wrapper)
        }
      })

      // --- No scroll ---
      addRow(section, 'No scroll (scroll: none)', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'none' })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      // --- Disabled ---
      addRow(section, 'Disabled', (row) => {
        const sb = makeBox({ sz, boxW, boxH, scroll: 'both', disabled: true })
        row.appendChild(sb)
        allBoxes.push(sb)
      })

      container.appendChild(section)
    }

    // --- CustomEvent demo ---
    const eventSection = document.createElement('section')
    eventSection.className = 'demo-section'

    const eventTitle = document.createElement('h2')
    eventTitle.textContent = 'CustomEvent demo (Web Component)'
    eventSection.appendChild(eventTitle)

    const eventInfo = document.createElement('div')
    eventInfo.style.cssText = 'font-size:11px;color:var(--button-disabled-fg-color);margin-bottom:8px;'
    eventInfo.textContent = 'Listening via addEventListener("scrollbox-scroll") on the <scrollbox-wc> element:'
    eventSection.appendChild(eventInfo)

    const eventRow = document.createElement('div')
    eventRow.className = 'btn-demo-row'

    const eventSb = makeBox({ sz: 'small', boxW: 350, boxH: 220, scroll: 'both' })
    const eventLabel = document.createElement('span')
    eventLabel.style.cssText = 'font-size:12px;color:var(--button-fg-color);min-width:150px;'
    eventLabel.textContent = 'x: 0, y: 0'

    eventSb.addEventListener('scrollbox-scroll', ((e: CustomEvent) => {
      eventLabel.textContent = `x: ${Math.round(e.detail.x)}, y: ${Math.round(e.detail.y)}`
    }) as EventListener)

    eventRow.appendChild(eventSb)
    eventRow.appendChild(eventLabel)
    eventSection.appendChild(eventRow)
    allBoxes.push(eventSb)

    container.appendChild(eventSection)

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

function makeBox(o: MakeBoxOpts): ScrollBoxWC {
  const contentW = o.contentW ?? 800
  const contentH = o.contentH ?? 600

  const sb = document.createElement('scrollbox-wc') as unknown as ScrollBoxWC
  sb.configure({
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
  sb.style.width = `${o.boxW}px`
  sb.style.height = `${o.boxH}px`

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
