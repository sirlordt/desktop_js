import '../components/ui-button/ui-button'
import { WindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { WindowWC } from '../components/ui-window-wc/ui-window-wc'
import { UIToolButton } from '../components/common/ui-tool-button-core'
import type { DemoRoute } from '../header'
import type { TitleAlign } from '../components/common/types'

let wm: WindowManagerWC | null = null

export const windowsWCDemo: DemoRoute = {
  id: 'windows-wc',
  label: 'Windows WC',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
      <div style="padding:8px 16px;display:flex;gap:6px;align-items:center;flex-shrink:0;flex-wrap:wrap;">
        <ui-button id="wwc-add" size="small" variant="solid">Add Window</ui-button>
        <ui-button id="wwc-add-no-title" size="small" variant="outline">No Title</ui-button>
        <ui-button id="wwc-add-center" size="small" variant="outline">Center Title</ui-button>
        <ui-button id="wwc-add-custom-btns" size="small" variant="outline">Custom Btns</ui-button>
        <ui-button id="wwc-add-no-resize" size="small" variant="outline">No Resize</ui-button>
        <ui-button id="wwc-add-no-move" size="small" variant="outline">No Move</ui-button>
        <ui-button id="wwc-add-scrollable" size="small" variant="outline">Scrollable</ui-button>
        <ui-button id="wwc-add-tool" size="small" variant="outline">With Tool</ui-button>
        <ui-button id="wwc-add-config" size="small" variant="info">Config Demo</ui-button>
        <ui-button id="wwc-add-modal" size="small" variant="danger">Modal</ui-button>
        <ui-button id="wwc-minimize-all" size="small" variant="warning">Minimize All</ui-button>
        <ui-button id="wwc-restore-all" size="small" variant="success">Restore All</ui-button>
        <ui-button id="wwc-close-all" size="small" variant="danger">Close All</ui-button>
        <span id="wwc-status" style="font-size:12px;color:var(--button-disabled-fg-color);margin-left:auto;"></span>
      </div>
      <div id="wwc-container" style="flex:1;min-height:0;position:relative;"></div>
    </div>
  `,

  setup: () => {
    if (wm) { wm.destroy(); wm = null }

    const container = document.getElementById('wwc-container')!
    const status = document.getElementById('wwc-status')!
    let winCount = 0

    wm = new WindowManagerWC({ bg: 'var(--sidebar-bg-color)' })
    container.appendChild(wm)
    wm.style.width = '100%'
    wm.style.height = '100%'
    wm.style.display = 'block'
    wm.style.position = 'relative'

    const updateStatus = () => {
      if (!wm) return
      const all = wm.getAllStates()
      const mins = wm.getMinimized()
      const focused = wm.getFocused()
      status.textContent = `Windows: ${all.length} | Minimized: ${mins.length} | Focused: ${focused?.windowId ?? 'none'}`
    }

    wm.core.on('window-focus', updateStatus)
    wm.core.on('window-close', updateStatus)
    wm.core.on('window-minimize', updateStatus)
    wm.core.on('window-restore', updateStatus)

    const colors = ['#3584e4', '#33d17a', '#e01b24', '#f5c211', '#8b5cf6', '#f97316', '#06b6d4']

    const makeIcon = (color: string): string => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="3" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
      <rect x="4" y="4" width="8" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
      <rect x="4" y="8" width="5" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
    </svg>`

    const addWindow = (opts?: Partial<{
      title: string, showTitle: boolean, titleAlign: TitleAlign,
      resizable: boolean, movable: boolean, rightElements: HTMLElement[],
      scroll: 'none' | 'vertical' | 'horizontal' | 'both', bigContent: boolean, icon: string,
    }>) => {
      if (!wm) return
      winCount++
      const color = colors[(winCount - 1) % colors.length]

      const win = new WindowWC({
        title: opts?.title ?? `Window ${winCount}`,
        left: 30 + ((winCount - 1) % 5) * 35,
        top: 30 + ((winCount - 1) % 5) * 30,
        width: 300, height: 200,
        showTitle: opts?.showTitle, titleAlign: opts?.titleAlign,
        resizable: opts?.resizable, movable: opts?.movable,
        rightElements: opts?.rightElements,
        scroll: opts?.scroll, icon: opts?.icon ?? makeIcon(color),
      })

      if (opts?.bigContent && win.scrollBox) {
        win.scrollBox.contentWidth = 600
        win.scrollBox.contentHeight = 500
        const cols = 12, rows = 10
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div')
            const hue = ((r * cols + c) * 17) % 360
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
      } else {
        const content = document.createElement('div')
        content.style.cssText = 'padding:12px;font-size:13px;white-space:nowrap;'
        content.innerHTML = `
          <div style="width:20px;height:20px;background:${color};border-radius:4px;margin-bottom:8px;"></div>
          <p style="margin:0 0 8px;">This is <strong>${win.title || 'Untitled'}</strong></p>
          <p style="margin:0 0 10px;color:var(--button-disabled-fg-color);font-size:11px;">
            Tab cycles inside this window. Alt+F6 switches windows.
          </p>
          <div style="display:flex;gap:6px;"></div>
        `
        const btnRow = content.querySelector('div:last-child')!
        for (const [label, variant] of [['Action', 'solid'], ['Details', 'outline'], ['Cancel', 'ghost']]) {
          const b = document.createElement('ui-button') as any
          b.setAttribute('size', 'small'); b.setAttribute('variant', variant)
          b.setAttribute('data-focusable', ''); b.textContent = label
          btnRow.appendChild(b)
        }

        const topRow = document.createElement('label')
        topRow.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:6px;font-size:11px;color:var(--button-disabled-fg-color);'
        const topCb = document.createElement('input')
        topCb.type = 'checkbox'; topCb.setAttribute('data-focusable', '')
        topCb.addEventListener('change', () => { wm!.setTopmost(win, topCb.checked) })
        topRow.appendChild(topCb); topRow.appendChild(document.createTextNode('Topmost'))
        content.appendChild(topRow)

        win.contentElement.appendChild(content)
      }

      if (win.scrollBox) requestAnimationFrame(() => win.scrollBox?.refresh())

      wm.addWindow(win)
      wm.bringToFront(win)
      updateStatus()
      return win
    }

    // Initial windows
    for (let i = 0; i < 3; i++) addWindow()

    // ── Buttons ──

    document.getElementById('wwc-add')!.addEventListener('click', () => addWindow())

    document.getElementById('wwc-add-no-title')!.addEventListener('click', () => {
      addWindow({ title: '', showTitle: false })
    })

    document.getElementById('wwc-add-center')!.addEventListener('click', () => {
      addWindow({ title: `Centered ${winCount + 1}`, titleAlign: 'center' })
    })

    document.getElementById('wwc-add-custom-btns')!.addEventListener('click', () => {
      const helpBtn = new UIToolButton({ icon: 'dots-h', size: 18 })
      helpBtn.onClick(() => alert('Help clicked!'))
      const pinBtn = new UIToolButton({ icon: 'chevron-down', size: 18 })
      pinBtn.onClick(() => alert('Pin clicked!'))
      addWindow({ title: `Custom Btns ${winCount + 1}`, rightElements: [helpBtn.element, pinBtn.element] })
    })

    document.getElementById('wwc-add-no-resize')!.addEventListener('click', () => {
      addWindow({ title: `Fixed Size ${winCount + 1}`, resizable: false })
    })

    document.getElementById('wwc-add-no-move')!.addEventListener('click', () => {
      addWindow({ title: `No Move ${winCount + 1}`, movable: false })
    })

    document.getElementById('wwc-add-scrollable')!.addEventListener('click', () => {
      addWindow({ title: `Scrollable ${winCount + 1}`, scroll: 'both', bigContent: true })
    })

    document.getElementById('wwc-add-tool')!.addEventListener('click', () => {
      if (!wm) return
      const mainWin = new WindowWC({
        title: `Main ${winCount + 1}`,
        left: 30 + (winCount % 5) * 35, top: 30 + (winCount % 5) * 30,
        width: 300, height: 220, icon: makeIcon('#3584e4'),
      })
      winCount++

      const content = document.createElement('div')
      content.style.cssText = 'padding:12px;font-size:13px;white-space:nowrap;'
      content.innerHTML = `<p style="margin:0 0 8px;">This window has a tool window attached.</p>
        <p style="margin:0 0 10px;color:var(--button-disabled-fg-color);font-size:11px;">
          Minimize or close this window to see the tool follow.
        </p>`

      const addToolBtn = document.createElement('ui-button') as any
      addToolBtn.setAttribute('size', 'small'); addToolBtn.setAttribute('variant', 'outline')
      addToolBtn.setAttribute('data-focusable', ''); addToolBtn.textContent = 'Add Another Tool'
      addToolBtn.addEventListener('click', () => {
        const tool = new WindowWC({
          title: `Tool ${mainWin.tools.length + 1}`,
          left: mainWin.left + mainWin.width + 5,
          top: mainWin.top + mainWin.tools.length * 30,
          width: 180, height: 120, icon: makeIcon('#f97316'),
        })
        const tc = document.createElement('div')
        tc.style.cssText = 'padding:8px;font-size:11px;display:flex;flex-direction:column;gap:4px;white-space:nowrap;'
        tc.innerHTML = `<span>Tool of ${mainWin.title}</span>`
        const tBtnRow = document.createElement('div')
        tBtnRow.style.cssText = 'display:flex;gap:4px;'
        for (const label of ['Apply', 'Reset']) {
          const b = document.createElement('ui-button') as any
          b.setAttribute('size', 'tiny'); b.setAttribute('variant', label === 'Apply' ? 'solid' : 'outline')
          b.setAttribute('data-focusable', ''); b.textContent = label
          tBtnRow.appendChild(b)
        }
        tc.appendChild(tBtnRow)
        tool.contentElement.appendChild(tc)
        wm!.addWindow(tool)
        mainWin.addTool(tool)
      })
      content.appendChild(addToolBtn)
      mainWin.contentElement.appendChild(content)
      wm.addWindow(mainWin)

      // Initial tool
      const toolWin = new WindowWC({
        title: 'Tool 1', left: mainWin.left + mainWin.width + 5, top: mainWin.top,
        width: 180, height: 120, icon: makeIcon('#f97316'),
      })
      const tc = document.createElement('div')
      tc.style.cssText = 'padding:8px;font-size:11px;display:flex;flex-direction:column;gap:4px;white-space:nowrap;'
      tc.innerHTML = `<span>Tool of ${mainWin.title}</span>`
      const tBtnRow = document.createElement('div')
      tBtnRow.style.cssText = 'display:flex;gap:4px;'
      for (const label of ['Apply', 'Reset']) {
        const b = document.createElement('ui-button') as any
        b.setAttribute('size', 'tiny'); b.setAttribute('variant', label === 'Apply' ? 'solid' : 'outline')
        b.setAttribute('data-focusable', ''); b.textContent = label
        tBtnRow.appendChild(b)
      }
      tc.appendChild(tBtnRow)
      toolWin.contentElement.appendChild(tc)
      wm.addWindow(toolWin)
      mainWin.addTool(toolWin)
      wm.bringToFront(mainWin)
      updateStatus()
    })

    document.getElementById('wwc-add-config')!.addEventListener('click', () => {
      if (!wm) return
      const existing = wm.getByTitle('Config Demo') as WindowWC | null
      if (existing) {
        wm.activateWindow(existing)
        if (existing.windowState !== 'minimized') {
          if (existing.folded) existing.unfold()
          existing.flash()
        }
        return
      }
      winCount++

      const win = new WindowWC({
        id: 'config-demo', title: 'Config Demo',
        left: 60 + ((winCount - 1) % 5) * 35, top: 60 + ((winCount - 1) % 5) * 30,
        width: 280, height: 420,
        icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6.5 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"/><path d="M7 1h2l.35 1.76.96.4L12 2.3l1.42 1.42-.86 1.69.4.96L14.72 7v2l-1.76.35-.4.96.86 1.69L12 13.42l-1.69-.86-.96.4L9 14.72H7l-.35-1.76-.96-.4L4 13.42 2.58 12l.86-1.69-.4-.96L1.28 9V7l1.76-.35.4-.96L2.58 4 4 2.58l1.69.86.96-.4L7 1.28zM8 4a4 4 0 100 8 4 4 0 000-8z"/></svg>`,
      })

      const form = document.createElement('div')
      form.style.cssText = 'padding:10px;font-size:12px;display:flex;flex-direction:column;gap:6px;'

      const makeToggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => {
        const row = document.createElement('label')
        row.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;'
        const cb = document.createElement('input')
        cb.type = 'checkbox'; cb.checked = checked; cb.setAttribute('data-focusable', '')
        cb.addEventListener('change', () => onChange(cb.checked))
        row.appendChild(cb); row.appendChild(document.createTextNode(label))
        return row
      }

      form.appendChild(makeToggle('Movable', true, (v) => { win.movable = v }))
      form.appendChild(makeToggle('Resizable', true, (v) => { win.resizable = v }))
      form.appendChild(makeToggle('Show Title', true, (v) => { win.showTitle = v }))
      form.appendChild(makeToggle('Minimize Button', true, (v) => { win.minimizable = v }))
      form.appendChild(makeToggle('Maximize Button', true, (v) => { win.maximizable = v }))
      form.appendChild(makeToggle('Close Button', true, (v) => { win.closable = v }))
      form.appendChild(makeToggle('Foldable', false, (v) => { win.foldable = v }))
      form.appendChild(makeToggle('Auto Unfold', false, (v) => { win.autoUnfold = v }))
      form.appendChild(makeToggle('Topmost', false, (v) => { wm!.setTopmost(win, v) }))

      // Title align
      const alignRow = document.createElement('div')
      alignRow.style.cssText = 'display:flex;align-items:center;gap:6px;'
      alignRow.appendChild(document.createTextNode('Title align:'))
      for (const align of ['left', 'center', 'right'] as const) {
        const btn = document.createElement('ui-button') as any
        btn.setAttribute('size', 'small'); btn.setAttribute('variant', 'outline')
        btn.setAttribute('data-focusable', ''); btn.textContent = align
        btn.addEventListener('click', () => { win.titleAlign = align })
        alignRow.appendChild(btn)
      }
      form.appendChild(alignRow)

      // Title text
      const titleRow = document.createElement('div')
      titleRow.style.cssText = 'display:flex;align-items:center;gap:6px;'
      titleRow.appendChild(document.createTextNode('Title:'))
      const titleInput = document.createElement('input')
      titleInput.type = 'text'; titleInput.value = win.title
      titleInput.style.cssText = 'flex:1;font-size:11px;padding:2px 4px;'
      titleInput.setAttribute('data-focusable', '')
      titleInput.addEventListener('input', () => { win.title = titleInput.value })
      titleRow.appendChild(titleInput)
      form.appendChild(titleRow)

      const sep1 = document.createElement('div')
      sep1.style.cssText = 'border-top:1px solid var(--border-color);margin:4px 0;'
      form.appendChild(sep1)

      // Min/Max constraints
      const makeNumberRow = (label: string, initial: number, isInfinity: boolean, onChange: (v: number) => void) => {
        const row = document.createElement('div')
        row.style.cssText = 'display:flex;align-items:center;gap:6px;'
        const cb = document.createElement('input')
        cb.type = 'checkbox'; cb.checked = !isInfinity; cb.setAttribute('data-focusable', '')
        const inp = document.createElement('input')
        inp.type = 'number'; inp.value = String(initial)
        inp.style.cssText = 'width:60px;font-size:11px;padding:2px 4px;'
        inp.disabled = isInfinity; inp.setAttribute('data-focusable', '')
        cb.addEventListener('change', () => {
          inp.disabled = !cb.checked
          onChange(cb.checked ? (parseInt(inp.value) || initial) : (label.includes('Max') ? Infinity : 0))
        })
        inp.addEventListener('input', () => { if (cb.checked) onChange(parseInt(inp.value) || 0) })
        row.appendChild(cb); row.appendChild(document.createTextNode(label)); row.appendChild(inp)
        return row
      }

      form.appendChild(makeNumberRow('Min Width', 150, false, (v) => { win.minWidth = v }))
      form.appendChild(makeNumberRow('Min Height', 80, false, (v) => { win.minHeight = v }))
      form.appendChild(makeNumberRow('Max Width', 500, true, (v) => { win.maxWidth = v }))
      form.appendChild(makeNumberRow('Max Height', 400, true, (v) => { win.maxHeight = v }))

      const sep2 = document.createElement('div')
      sep2.style.cssText = 'border-top:1px solid var(--border-color);margin:4px 0;'
      form.appendChild(sep2)

      // Scroll mode
      const scrollRow = document.createElement('div')
      scrollRow.style.cssText = 'display:flex;align-items:center;gap:6px;'
      scrollRow.appendChild(document.createTextNode('Scroll:'))
      for (const mode of ['none', 'vertical', 'horizontal', 'both'] as const) {
        const btn = document.createElement('ui-button') as any
        btn.setAttribute('size', 'small'); btn.setAttribute('variant', 'outline')
        btn.setAttribute('data-focusable', ''); btn.textContent = mode
        btn.addEventListener('click', () => { win.setScroll(mode) })
        scrollRow.appendChild(btn)
      }
      form.appendChild(scrollRow)

      win.contentElement.appendChild(form)
      wm.addWindow(win)
      wm.bringToFront(win)
      updateStatus()
    })

    // ── Modal ──
    let modalCount = 0
    const createModal = () => {
      if (!wm) return
      modalCount++
      const win = new WindowWC({
        title: `Modal ${modalCount}`, modal: true,
        left: 150 + (modalCount - 1) * 20, top: 100 + (modalCount - 1) * 20,
        width: 280, height: 160, resizable: false, icon: makeIcon('#e01b24'),
      })
      const content = document.createElement('div')
      content.style.cssText = 'padding:12px;font-size:13px;white-space:nowrap;'
      content.innerHTML = `<p style="margin:0 0 10px;">This is a modal dialog. You cannot interact with other windows.</p>`
      const btnRow = document.createElement('div')
      btnRow.style.cssText = 'display:flex;gap:6px;'
      const nestedBtn = document.createElement('ui-button') as any
      nestedBtn.setAttribute('size', 'small'); nestedBtn.setAttribute('variant', 'danger')
      nestedBtn.setAttribute('data-focusable', ''); nestedBtn.textContent = 'Nested Modal'
      nestedBtn.addEventListener('click', () => createModal())
      btnRow.appendChild(nestedBtn)
      const closeBtn = document.createElement('ui-button') as any
      closeBtn.setAttribute('size', 'small'); closeBtn.setAttribute('variant', 'outline')
      closeBtn.setAttribute('data-focusable', ''); closeBtn.textContent = 'Close'
      closeBtn.addEventListener('click', () => wm?.closeChild(win))
      btnRow.appendChild(closeBtn)
      content.appendChild(btnRow)
      win.contentElement.appendChild(content)
      wm.addWindow(win)
      wm.bringToFront(win)
      updateStatus()
    }

    document.getElementById('wwc-add-modal')!.addEventListener('click', () => createModal())
    document.getElementById('wwc-minimize-all')!.addEventListener('click', () => { wm?.minimizeAll(); updateStatus() })
    document.getElementById('wwc-restore-all')!.addEventListener('click', () => { wm?.restoreAll(); updateStatus() })
    document.getElementById('wwc-close-all')!.addEventListener('click', () => { wm?.closeAll(); updateStatus() })

    updateStatus()
  },
}
