import { UIWindowManager } from '../components/ui-window-manager/ui-window-manager'
import { UIWindow } from '../components/ui-window/ui-window'
import type { DemoRoute } from '../header'

let wm: UIWindowManager | null = null

export const windowsDemo: DemoRoute = {
  id: 'windows',
  label: 'Windows',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
      <div style="padding:8px 16px;display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <button id="wm-add">Add Window</button>
        <button id="wm-minimize-all">Minimize All</button>
        <button id="wm-restore-all">Restore All</button>
        <button id="wm-close-all">Close All</button>
        <span id="wm-status" style="font-size:12px;color:var(--button-disabled-fg-color);margin-left:auto;"></span>
      </div>
      <div id="wm-container" style="flex:1;min-height:0;position:relative;"></div>
    </div>
  `,

  setup: () => {
    if (wm) { wm.destroy(); wm = null }

    const container = document.getElementById('wm-container')!
    const status = document.getElementById('wm-status')!
    let winCount = 0

    // Create window manager filling the container
    wm = new UIWindowManager({
      bg: 'var(--sidebar-bg-color)',
    })
    container.appendChild(wm.element)
    // Override layout — fill container
    wm.element.style.width = '100%'
    wm.element.style.height = '100%'
    wm.element.style.position = 'relative'

    const updateStatus = () => {
      if (!wm) return
      const all = wm.getAllStates()
      const mins = wm.getMinimized()
      const focused = wm.getFocused()
      status.textContent = `Windows: ${all.length} | Minimized: ${mins.length} | Focused: ${focused?.windowId ?? 'none'}`
    }

    // Listen to events
    wm.on('window-focus', updateStatus)
    wm.on('window-close', updateStatus)
    wm.on('window-minimize', updateStatus)
    wm.on('window-restore', updateStatus)

    const addWindow = () => {
      if (!wm) return
      winCount++
      const colors = ['#3584e4', '#33d17a', '#e01b24', '#f5c211', '#8b5cf6', '#f97316', '#06b6d4']
      const color = colors[(winCount - 1) % colors.length]

      const win = new UIWindow({
        title: `Window ${winCount}`,
        left: 30 + (winCount - 1) * 30,
        top: 30 + (winCount - 1) * 25,
        width: 280,
        height: 180,
      })

      // Add some content
      const content = document.createElement('div')
      content.style.cssText = 'padding:12px;font-size:13px;'
      content.innerHTML = `
        <div style="width:20px;height:20px;background:${color};border-radius:4px;margin-bottom:8px;"></div>
        <p style="margin:0 0 8px;">This is <strong>${win.title}</strong></p>
        <p style="margin:0;color:var(--button-disabled-fg-color);font-size:11px;">Drag the titlebar to move. Resize from edges/corner. Click to bring to front.</p>
      `
      win.contentElement.appendChild(content)

      wm.addWindow(win)
      wm.bringToFront(win)
      updateStatus()
    }

    // Add initial windows
    for (let i = 0; i < 3; i++) addWindow()

    // Button handlers
    document.getElementById('wm-add')!.addEventListener('click', addWindow)
    document.getElementById('wm-minimize-all')!.addEventListener('click', () => { wm?.minimizeAll(); updateStatus() })
    document.getElementById('wm-restore-all')!.addEventListener('click', () => { wm?.restoreAll(); updateStatus() })
    document.getElementById('wm-close-all')!.addEventListener('click', () => { wm?.closeAll(); updateStatus() })

    updateStatus()
  },
}
