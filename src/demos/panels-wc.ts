import { UIPanelWC } from '../components/ui-panel-wc/ui-panel-wc'
import type { DemoRoute } from '../header'

let rootPanel: UIPanelWC | null = null

export const panelsWCDemo: DemoRoute = {
  id: 'panels-wc',
  label: 'Panels WC',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);padding:16px;">
      <div style="margin-bottom:12px;">
        <h2 style="margin:0 0 8px;">Panel Layout WC (Docking)</h2>
        <p style="margin:0;font-size:var(--font-size-sm);color:var(--button-disabled-fg-color);">
          Demonstrates align docking (top, bottom, left, right, client, center) and anchored positioning
          using &lt;panel-wc&gt; web components. Resize the browser window to see anchors in action.
        </p>
      </div>
      <div id="panel-wc-demo" style="flex:1;min-height:0;position:relative;"></div>
    </div>
  `,

  setup: () => {
    if (rootPanel) { rootPanel.destroy(); rootPanel = null }

    const container = document.getElementById('panel-wc-demo')!

    // ── Root ──
    const root = makePanel({ name: 'root', bg: '#f0f0f0', borderColor: '#333', borderWidth: 1 })
    root.panelWidth = container.clientWidth
    root.panelHeight = container.clientHeight
    rootPanel = root

    // Resize handler
    const onResize = () => {
      root.panelWidth = container.clientWidth
      root.panelHeight = container.clientHeight
      root.update()
    }
    window.addEventListener('resize', onResize)
    root.core.cleanups.push(() => window.removeEventListener('resize', onResize))

    // ── Top bar 1 (red) ──
    root.appendChild(makePanel({ name: 'topBar', height: 50, align: 'top', bg: '#ef4444', borderColor: '#dc2626', borderWidth: 1 }))

    // ── Top bar 2 (green) ──
    root.appendChild(makePanel({ name: 'topBar2', height: 35, align: 'top', bg: '#22c55e', borderColor: '#16a34a', borderWidth: 1 }))

    // ── Bottom bar 1 (amber) ──
    root.appendChild(makePanel({ name: 'bottomBar', height: 40, align: 'bottom', bg: '#f59e0b', borderColor: '#d97706', borderWidth: 1 }))

    // ── Bottom bar 2 (green) ──
    root.appendChild(makePanel({ name: 'bottomBar2', height: 35, align: 'bottom', bg: '#22c55e', borderColor: '#16a34a', borderWidth: 1 }))

    // ── Client area ──
    const clientArea = makePanel({ name: 'clientArea', align: 'client', bg: '#e5e7eb', borderColor: '#999', borderWidth: 1 })
    root.appendChild(clientArea)

    // Left panel 1 (blue)
    clientArea.appendChild(makePanel({ name: 'left1', width: 150, align: 'left', bg: '#3b82f6', borderColor: '#2563eb', borderWidth: 1 }))

    // Left panel 2 (cyan)
    clientArea.appendChild(makePanel({ name: 'left2', width: 100, align: 'left', bg: '#06b6d4', borderColor: '#0891b2', borderWidth: 1 }))

    // Right panel 1 (purple)
    clientArea.appendChild(makePanel({ name: 'right1', width: 150, align: 'right', bg: '#8b5cf6', borderColor: '#7c3aed', borderWidth: 1 }))

    // Right panel 2 (orange)
    clientArea.appendChild(makePanel({ name: 'right2', width: 100, align: 'right', bg: '#f97316', borderColor: '#ea580c', borderWidth: 1 }))

    // Center (fills remaining)
    const center = makePanel({ name: 'center', align: 'client', bg: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 1 })
    clientArea.appendChild(center)

    // Anchored to all edges (yellow, margins)
    center.appendChild(makePanel({
      name: 'anchoredAll',
      left: 10, top: 5, right: 15, bottom: 20,
      anchors: { toLeft: true, toTop: true, toRight: true, toBottom: true },
      bg: '#fbbf24', borderColor: '#f59e0b', borderWidth: 1,
    }))

    // Anchored bottom-right (green box)
    center.appendChild(makePanel({
      name: 'anchoredBR',
      width: 80, height: 80, right: 50, bottom: 50,
      anchors: { toLeft: false, toTop: false, toRight: true, toBottom: true },
      bg: '#22c55e', borderColor: '#16a34a', borderWidth: 1,
    }))

    // Anchored top-right (green box)
    center.appendChild(makePanel({
      name: 'anchoredTR',
      width: 80, height: 80, top: 50, right: 50,
      anchors: { toLeft: false, toTop: true, toRight: true, toBottom: false },
      bg: '#22c55e', borderColor: '#16a34a', borderWidth: 1,
    }))

    // Anchored bottom-left (green box)
    center.appendChild(makePanel({
      name: 'anchoredBL',
      width: 80, height: 80, left: 50, bottom: 50,
      anchors: { toLeft: true, toTop: false, toRight: false, toBottom: true },
      bg: '#22c55e', borderColor: '#16a34a', borderWidth: 1,
    }))

    // Mount root — connectedCallback fires and cascades to children
    container.appendChild(root)

    // Force layout pass after full tree is in DOM
    root.update()
  },
}

// =====================
// Helpers
// =====================

function makePanel(options: import('../components/ui-panel-wc/ui-panel-wc').PanelWCOptions): UIPanelWC {
  const p = new UIPanelWC()
  p.configure(options)
  return p
}
