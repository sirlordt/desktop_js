import { UIPanel } from '../components/ui-panel/ui-panel'
import type { DemoRoute } from '../header'

let rootPanel: UIPanel | null = null

export const panelsDemo: DemoRoute = {
  id: 'panels',
  label: 'Panels',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);padding:16px;">
      <div style="margin-bottom:12px;">
        <h2 style="margin:0 0 8px;">Panel Layout (Docking)</h2>
        <p style="margin:0;font-size:var(--font-size-sm);color:var(--button-disabled-fg-color);">
          Demonstrates align docking (top, bottom, left, right, client, center) and anchored positioning.
          Resize the browser window to see anchors in action.
        </p>
      </div>
      <div id="panel-demo" style="flex:1;min-height:0;position:relative;"></div>
    </div>
  `,

  setup: () => {
    if (rootPanel) { rootPanel.destroy(); rootPanel = null }

    const container = document.getElementById('panel-demo')!

    // ── Root ──
    const root = new UIPanel({
      name: 'root',
      bg: '#f0f0f0',
      borderColor: '#333',
    })
    root.width = container.clientWidth
    root.height = container.clientHeight
    rootPanel = root

    // Resize handler
    const onResize = () => {
      root.width = container.clientWidth
      root.height = container.clientHeight
      root.update()
    }
    window.addEventListener('resize', onResize)
    root.core.cleanups.push(() => window.removeEventListener('resize', onResize))

    // ── Top bar 1 (red) ──
    new UIPanel({ parent: root, name: 'topBar', height: 50, align: 'top', bg: '#ef4444', borderColor: '#dc2626' })

    // ── Top bar 2 (green) ──
    new UIPanel({ parent: root, name: 'topBar2', height: 35, align: 'top', bg: '#22c55e', borderColor: '#16a34a' })

    // ── Bottom bar 1 (amber) ──
    new UIPanel({ parent: root, name: 'bottomBar', height: 40, align: 'bottom', bg: '#f59e0b', borderColor: '#d97706' })

    // ── Bottom bar 2 (green) ──
    new UIPanel({ parent: root, name: 'bottomBar2', height: 35, align: 'bottom', bg: '#22c55e', borderColor: '#16a34a' })

    // ── Client area ──
    const clientArea = new UIPanel({ parent: root, name: 'clientArea', align: 'client', bg: '#e5e7eb', borderColor: '#999' })

    // Left panel 1 (blue)
    new UIPanel({ parent: clientArea, name: 'left1', width: 150, align: 'left', bg: '#3b82f6', borderColor: '#2563eb' })

    // Left panel 2 (cyan)
    new UIPanel({ parent: clientArea, name: 'left2', width: 100, align: 'left', bg: '#06b6d4', borderColor: '#0891b2' })

    // Right panel 1 (purple)
    new UIPanel({ parent: clientArea, name: 'right1', width: 150, align: 'right', bg: '#8b5cf6', borderColor: '#7c3aed' })

    // Right panel 2 (orange)
    new UIPanel({ parent: clientArea, name: 'right2', width: 100, align: 'right', bg: '#f97316', borderColor: '#ea580c' })

    // Center (fills remaining)
    const center = new UIPanel({ parent: clientArea, name: 'center', align: 'client', bg: '#f1f5f9', borderColor: '#cbd5e1' })

    // Anchored to all edges (yellow, 10px margins)
    new UIPanel({
      parent: center, name: 'anchoredAll',
      left: 10, top: 5, right: 15, bottom: 20,
      anchors: { toLeft: true, toTop: true, toRight: true, toBottom: true },
      bg: '#fbbf24', borderColor: '#f59e0b',
    })

    // Anchored bottom-right (green box)
    new UIPanel({
      parent: center, name: 'anchoredBR',
      width: 80, height: 80, right: 50, bottom: 50,
      anchors: { toLeft: false, toTop: false, toRight: true, toBottom: true },
      bg: '#22c55e', borderColor: '#16a34a',
    })

    // Anchored top-right (green box)
    new UIPanel({
      parent: center, name: 'anchoredTR',
      width: 80, height: 80, top: 50, right: 50,
      anchors: { toLeft: false, toTop: true, toRight: true, toBottom: false },
      bg: '#22c55e', borderColor: '#16a34a',
    })

    // Anchored bottom-left (green box)
    new UIPanel({
      parent: center, name: 'anchoredBL',
      width: 80, height: 80, left: 50, bottom: 50,
      anchors: { toLeft: true, toTop: false, toRight: false, toBottom: true },
      bg: '#22c55e', borderColor: '#16a34a',
    })

    // Render and mount
    const el = root.render()
    container.appendChild(el)
  },
}
