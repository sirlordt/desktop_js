import { UITextBoxExpWC } from '../components/ui-textbox-exp/ui-textbox-exp'
import type { DemoRoute } from '../header'

export const textboxExpDemo: DemoRoute = {
  id: 'textbox-exp',
  label: 'TextBox Exp',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
      <div style="padding:8px 16px;display:flex;gap:6px;align-items:center;flex-shrink:0;flex-wrap:wrap;">
        <ui-button id="tbx-clear-log" size="small" variant="outline">Clear Log</ui-button>
        <ui-button id="tbx-select-all" size="small" variant="outline">Select All (first)</ui-button>
        <ui-button id="tbx-set-value" size="small" variant="outline">Set Value</ui-button>
        <ui-button id="tbx-toggle-disabled" size="small" variant="warning">Toggle Disabled</ui-button>
      </div>
      <div style="flex:1;padding:16px;overflow:auto;display:flex;gap:24px;">
        <div id="tbx-demos" style="display:flex;flex-direction:column;gap:16px;min-width:0;"></div>
        <div id="tbx-log" style="flex:1;min-width:200px;max-width:400px;font-family:monospace;font-size:12px;color:var(--view-fg-color);background:var(--view-bg-color);border:1px solid var(--input-border-color);border-radius:4px;padding:8px;overflow:auto;white-space:pre-wrap;opacity:0.8;"></div>
      </div>
    </div>
  `,

  setup: () => {
    const demos = document.getElementById('tbx-demos')!
    const logEl = document.getElementById('tbx-log')!
    const textboxes: UITextBoxExpWC[] = []

    let logLines: string[] = []
    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      logLines.push(`[${time}] ${msg}`)
      if (logLines.length > 100) logLines = logLines.slice(-80)
      logEl.textContent = logLines.join('\n')
      logEl.scrollTop = logEl.scrollHeight
    }

    const makeSection = (label: string, tb: UITextBoxExpWC): HTMLDivElement => {
      const section = document.createElement('div')
      section.style.cssText = 'display:flex;flex-direction:column;gap:4px;'
      const title = document.createElement('span')
      title.textContent = label
      title.style.cssText = 'font-size:12px;font-weight:600;color:var(--view-fg-color);opacity:0.7;'
      section.appendChild(title)
      section.appendChild(tb)
      return section
    }

    const hookEvents = (tb: UITextBoxExpWC, name: string) => {
      tb.addEventListener('input', (e) => log(`${name} input: "${(e as CustomEvent).detail.value}"`))
      tb.addEventListener('change', (e) => log(`${name} change: "${(e as CustomEvent).detail.value}"`))
      tb.addEventListener('focus', () => log(`${name} focus`))
      tb.addEventListener('blur', () => log(`${name} blur`))
      tb.addEventListener('select', (e) => {
        const d = (e as CustomEvent).detail
        if (d.start !== d.end) log(`${name} select: [${d.start}, ${d.end}]`)
      })
    }

    // 1. Basic
    const tb1 = new UITextBoxExpWC({ placeholder: 'Type here...', width: 250, height: 28 })
    hookEvents(tb1, 'Basic')
    textboxes.push(tb1)
    demos.appendChild(makeSection('Basic', tb1))

    // 2. Pre-filled
    const tb2 = new UITextBoxExpWC({ value: 'Hello World', width: 250, height: 28 })
    hookEvents(tb2, 'Pre-filled')
    textboxes.push(tb2)
    demos.appendChild(makeSection('Pre-filled', tb2))

    // 3. Disabled
    const tb3 = new UITextBoxExpWC({ value: 'Cannot edit this', disabled: true, width: 250, height: 28 })
    hookEvents(tb3, 'Disabled')
    textboxes.push(tb3)
    demos.appendChild(makeSection('Disabled', tb3))

    // 4. Read-only
    const tb4 = new UITextBoxExpWC({ value: 'Select me, but no edit', readonly: true, width: 250, height: 28 })
    hookEvents(tb4, 'Readonly')
    textboxes.push(tb4)
    demos.appendChild(makeSection('Read-only', tb4))

    // 5. Max length (10)
    const tb5 = new UITextBoxExpWC({ placeholder: 'Max 10 chars', maxLength: 10, width: 250, height: 28 })
    hookEvents(tb5, 'MaxLen')
    textboxes.push(tb5)
    demos.appendChild(makeSection('Max length (10)', tb5))

    // 6. Large
    const tb6 = new UITextBoxExpWC({ placeholder: 'Bigger box', width: 400, height: 36, fontSize: 18 })
    hookEvents(tb6, 'Large')
    textboxes.push(tb6)
    demos.appendChild(makeSection('Large (400x36, 18px font)', tb6))

    // Toolbar buttons
    document.getElementById('tbx-clear-log')?.addEventListener('click', () => {
      logLines = []
      logEl.textContent = ''
    })

    document.getElementById('tbx-select-all')?.addEventListener('click', () => {
      tb1.focus()
      tb1.selectAll()
      log('Select All triggered on Basic')
    })

    document.getElementById('tbx-set-value')?.addEventListener('click', () => {
      tb1.value = 'Programmatic value!'
      log('Set Value on Basic: "Programmatic value!"')
    })

    document.getElementById('tbx-toggle-disabled')?.addEventListener('click', () => {
      tb1.disabled = !tb1.disabled
      log(`Basic disabled: ${tb1.disabled}`)
    })

    log('TextBox Exp demo ready')
  },
}
