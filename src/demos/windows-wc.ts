import { WindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { WindowWC } from '../components/ui-window-wc/ui-window-wc'
import type { DemoRoute } from '../header'

let mgr: WindowManagerWC | null = null

export const windowsWCDemo: DemoRoute = {
  id: 'windows-wc',
  label: 'Windows WC',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);padding:16px;">
      <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <h2 style="margin:0;">Windows WC</h2>
        <ui-button id="wc-add-win" size="small">Add Window</ui-button>
        <ui-button id="wc-add-tool" size="small" variant="outline">Add Tool</ui-button>
        <ui-button id="wc-add-scroll" size="small" variant="outline">Add Scroll Window</ui-button>
        <ui-button id="wc-add-modal" size="small" variant="warning">Add Modal</ui-button>
        <ui-button id="wc-min-all" size="small" variant="ghost">Minimize All</ui-button>
        <ui-button id="wc-restore-all" size="small" variant="ghost">Restore All</ui-button>
        <ui-button id="wc-close-all" size="small" variant="danger">Close All</ui-button>
        <span id="wc-status" style="font-size:12px;color:var(--button-disabled-fg-color);margin-left:auto;"></span>
      </div>
      <div id="wc-manager-container" style="flex:1;min-height:0;"></div>
    </div>
  `,

  setup: () => {
    if (mgr) { mgr.destroy(); mgr = null }

    const container = document.getElementById('wc-manager-container')!
    const statusEl = document.getElementById('wc-status')!

    mgr = new WindowManagerWC({
      width: container.clientWidth,
      height: container.clientHeight,
      bg: 'var(--view-bg-color)',
      borderColor: 'var(--border-color)',
    })
    container.appendChild(mgr)

    // Resize handler
    const onResize = () => {
      if (!mgr) return
      mgr.managerWidth = container.clientWidth
      mgr.managerHeight = container.clientHeight
    }
    window.addEventListener('resize', onResize)
    mgr.core.cleanups.push(() => window.removeEventListener('resize', onResize))

    let winCount = 0
    let lastOverlord: WindowWC | null = null

    const updateStatus = () => {
      if (!mgr) return
      const total = mgr.getAll().length
      const minimized = mgr.getMinimized().length
      const focused = mgr.getFocused()
      statusEl.textContent = `Windows: ${total} | Minimized: ${minimized} | Focused: ${focused?.title ?? 'none'}`
    }

    mgr.core.on('window-focus', updateStatus)
    mgr.core.on('window-close', updateStatus)
    mgr.core.on('window-minimize', updateStatus)
    mgr.core.on('window-restore', updateStatus)

    // Add Window button
    document.getElementById('wc-add-win')!.addEventListener('click', () => {
      winCount++
      const offset = (winCount - 1) * 30
      const win = new WindowWC({
        title: `Window ${winCount}`,
        left: 20 + offset, top: 20 + offset,
        width: 320, height: 220,
      })
      fillContent(win.contentElement, `Window ${winCount}`)
      mgr!.addWindow(win)
      mgr!.bringToFront(win)
      lastOverlord = win
      updateStatus()
    })

    // Add Tool button
    document.getElementById('wc-add-tool')!.addEventListener('click', () => {
      if (!lastOverlord || lastOverlord.isDestroyed) {
        // Create a parent window first
        winCount++
        const offset = (winCount - 1) * 30
        lastOverlord = new WindowWC({
          title: `Window ${winCount}`,
          left: 20 + offset, top: 20 + offset,
          width: 320, height: 220,
        })
        fillContent(lastOverlord.contentElement, `Window ${winCount}`)
        mgr!.addWindow(lastOverlord)
      }
      winCount++
      const tool = new WindowWC({
        title: `Tool ${winCount}`,
        kind: 'tool',
        left: lastOverlord.left + lastOverlord.width + 5,
        top: lastOverlord.top,
        width: 180, height: 160,
      })
      fillContent(tool.contentElement, `Tool for ${lastOverlord.title}`)
      mgr!.addWindow(tool)
      lastOverlord.addTool(tool)
      mgr!.bringToFront(lastOverlord)
      updateStatus()
    })

    // Add Scroll Window button
    document.getElementById('wc-add-scroll')!.addEventListener('click', () => {
      winCount++
      const offset = (winCount - 1) * 30
      const win = new WindowWC({
        title: `Scroll ${winCount}`,
        left: 40 + offset, top: 40 + offset,
        width: 300, height: 200,
        scroll: 'both',
      })
      // Add grid content
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const cell = document.createElement('div')
          const hue = ((r * 10 + c) * 17) % 360
          Object.assign(cell.style, {
            position: 'absolute', left: `${c * 50}px`, top: `${r * 50}px`,
            width: '48px', height: '48px', backgroundColor: `hsl(${hue}, 60%, 70%)`,
            border: '1px solid rgba(0,0,0,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#333',
          })
          cell.textContent = `${c},${r}`
          win.contentElement.appendChild(cell)
        }
      }
      win.scrollBox!.contentWidth = 500
      win.scrollBox!.contentHeight = 500
      win.scrollBox!.refresh()
      mgr!.addWindow(win)
      mgr!.bringToFront(win)
      lastOverlord = win
      updateStatus()
    })

    // Add Modal button
    document.getElementById('wc-add-modal')!.addEventListener('click', () => {
      winCount++
      const win = new WindowWC({
        title: `Modal ${winCount}`,
        left: 100, top: 80,
        width: 280, height: 160,
        modal: true,
        minimizable: false,
        maximizable: false,
      })
      fillContent(win.contentElement, 'This is a modal dialog')
      mgr!.addWindow(win)
      mgr!.bringToFront(win)
      updateStatus()
    })

    // Batch operations
    document.getElementById('wc-min-all')!.addEventListener('click', () => { mgr!.minimizeAll(); updateStatus() })
    document.getElementById('wc-restore-all')!.addEventListener('click', () => { mgr!.restoreAll(); updateStatus() })
    document.getElementById('wc-close-all')!.addEventListener('click', () => { mgr!.closeAll(); updateStatus() })

    // Create initial windows
    const win1 = new WindowWC({ title: 'Welcome', left: 20, top: 20, width: 320, height: 200 })
    fillContent(win1.contentElement, 'Welcome to WindowWC demo!')
    mgr.addWindow(win1)

    const win2 = new WindowWC({ title: 'Settings', left: 200, top: 80, width: 280, height: 220 })
    fillContent(win2.contentElement, 'Settings window')
    mgr.addWindow(win2)

    mgr.bringToFront(win1)
    lastOverlord = win1
    winCount = 2
    updateStatus()
  },
}

function fillContent(el: HTMLDivElement, text: string): void {
  el.style.padding = '12px'
  el.style.fontSize = '13px'
  el.style.color = 'var(--button-fg-color)'
  el.innerHTML = `<div style="margin-bottom:8px;font-weight:bold;">${text}</div>
    <div style="font-size:11px;color:var(--button-disabled-fg-color);">
      Drag the titlebar to move. Resize from edges/corners. Use titlebar buttons to minimize, maximize, or close.
    </div>`
}
