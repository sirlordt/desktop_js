import { UIWindowManager } from '../components/ui-window-manager/ui-window-manager'
import { UIWindow } from '../components/ui-window/ui-window'
import { UIToolButton } from '../components/common/ui-tool-button'
import type { DemoRoute } from '../header'

let wm: UIWindowManager | null = null

export const windowsDemo: DemoRoute = {
  id: 'windows',
  label: 'Windows',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
      <div style="padding:8px 16px;display:flex;gap:8px;align-items:center;flex-shrink:0;flex-wrap:wrap;">
        <button id="wm-add">Add Window</button>
        <button id="wm-add-no-title">No Title</button>
        <button id="wm-add-center">Center Title</button>
        <button id="wm-add-custom-btns">Custom Buttons</button>
        <button id="wm-add-no-resize">No Resize</button>
        <button id="wm-add-no-move">No Move</button>
        <button id="wm-add-scrollable">Scrollable</button>
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

    wm = new UIWindowManager({
      bg: 'var(--sidebar-bg-color)',
    })
    container.appendChild(wm.element)
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

    wm.on('window-focus', updateStatus)
    wm.on('window-close', updateStatus)
    wm.on('window-minimize', updateStatus)
    wm.on('window-restore', updateStatus)

    const colors = ['#3584e4', '#33d17a', '#e01b24', '#f5c211', '#8b5cf6', '#f97316', '#06b6d4']

    const addWindow = (opts?: Partial<{
      title: string, showTitle: boolean, titleAlign: 'left' | 'center' | 'right',
      resizable: boolean, movable: boolean, leftElements: HTMLElement[], rightElements: HTMLElement[],
      scroll: 'none' | 'vertical' | 'horizontal' | 'both', bigContent: boolean,
    }>) => {
      if (!wm) return
      winCount++
      const color = colors[(winCount - 1) % colors.length]

      const win = new UIWindow({
        title: opts?.title ?? `Window ${winCount}`,
        left: 30 + ((winCount - 1) % 5) * 35,
        top: 30 + ((winCount - 1) % 5) * 30,
        width: 300,
        height: 200,
        showTitle: opts?.showTitle,
        titleAlign: opts?.titleAlign,
        resizable: opts?.resizable,
        movable: opts?.movable,
        leftElements: opts?.leftElements,
        rightElements: opts?.rightElements,
        scroll: opts?.scroll,
      })

      if (opts?.bigContent && win.scrollBox) {
        // Set large content dimensions for scrollbox
        win.scrollBox.contentWidth = 600
        win.scrollBox.contentHeight = 500
        // Fill with color grid
        const cols = 12, rows = 10
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div')
            const hue = ((r * cols + c) * 17) % 360
            Object.assign(cell.style, {
              position: 'absolute', left: `${c * 50}px`, top: `${r * 50}px`,
              width: '48px', height: '48px',
              backgroundColor: `hsl(${hue}, 60%, 70%)`,
              border: '1px solid rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', color: '#333',
            })
            cell.textContent = `${c},${r}`
            win.contentElement.appendChild(cell)
          }
        }
      } else {
        const content = document.createElement('div')
        content.style.cssText = 'padding:12px;font-size:13px;'
        content.innerHTML = `
          <div style="width:20px;height:20px;background:${color};border-radius:4px;margin-bottom:8px;"></div>
          <p style="margin:0 0 8px;">This is <strong>${win.title || 'Untitled'}</strong></p>
          <p style="margin:0;color:var(--button-disabled-fg-color);font-size:11px;">
            Drag titlebar to move. Resize from any edge or corner.
            ${opts?.resizable === false ? '<br><em>Resize disabled.</em>' : ''}
            ${opts?.movable === false ? '<br><em>Move disabled.</em>' : ''}
          </p>
        `
        win.contentElement.appendChild(content)
      }

      if (win.scrollBox) {
        requestAnimationFrame(() => win.scrollBox?.refresh())
      }

      wm.addWindow(win)
      wm.bringToFront(win)
      updateStatus()
    }

    // Add 3 initial windows
    for (let i = 0; i < 3; i++) addWindow()

    // Buttons
    document.getElementById('wm-add')!.addEventListener('click', () => addWindow())

    document.getElementById('wm-add-no-title')!.addEventListener('click', () => {
      addWindow({ title: '', showTitle: false })
    })

    document.getElementById('wm-add-center')!.addEventListener('click', () => {
      addWindow({ title: `Centered ${winCount + 1}`, titleAlign: 'center' })
    })

    document.getElementById('wm-add-custom-btns')!.addEventListener('click', () => {
      const helpBtn = new UIToolButton({ icon: 'dots-h', size: 18 })
      helpBtn.onClick(() => alert('Help clicked!'))

      const pinBtn = new UIToolButton({ icon: 'chevron-down', size: 18 })
      pinBtn.onClick(() => alert('Pin clicked!'))

      addWindow({
        title: `Custom Btns ${winCount + 1}`,
        rightElements: [helpBtn.element, pinBtn.element],
      })
    })

    document.getElementById('wm-add-no-resize')!.addEventListener('click', () => {
      addWindow({ title: `Fixed Size ${winCount + 1}`, resizable: false })
    })

    document.getElementById('wm-add-no-move')!.addEventListener('click', () => {
      addWindow({ title: `No Move ${winCount + 1}`, movable: false })
    })

    document.getElementById('wm-add-scrollable')!.addEventListener('click', () => {
      addWindow({ title: `Scrollable ${winCount + 1}`, scroll: 'both', bigContent: true })
    })

    document.getElementById('wm-minimize-all')!.addEventListener('click', () => { wm?.minimizeAll(); updateStatus() })
    document.getElementById('wm-restore-all')!.addEventListener('click', () => { wm?.restoreAll(); updateStatus() })
    document.getElementById('wm-close-all')!.addEventListener('click', () => { wm?.closeAll(); updateStatus() })

    updateStatus()
  },
}
