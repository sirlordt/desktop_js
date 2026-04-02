import '../components/ui-button-wc/ui-button-wc'
import { UITextBoxWC } from '../components/ui-textbox-wc/ui-textbox-wc'
import { UIHintWC } from '../components/ui-hint-wc/ui-hint-wc'
import { UIWindowManagerWC } from '../components/ui-window-manager-wc/ui-window-manager-wc'
import { UIWindowWC } from '../components/ui-window-wc/ui-window-wc'
import type { DemoRoute } from '../header'
import type { TextBoxVariant } from '../components/common/types'

export const textboxWCDemo: DemoRoute = {
  id: 'textbox-wc',
  label: 'TextBox WC',

  render: () => `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 48px);">
      <div style="padding:8px 16px;display:flex;gap:6px;align-items:center;flex-shrink:0;flex-wrap:wrap;">
        <ui-button id="tbwc-window-demo" size="small" variant="solid">Window Demo</ui-button>
        <ui-button id="tbwc-clear-log" size="small" variant="outline">Clear Log</ui-button>
      </div>
      <div style="flex:1;padding:16px;overflow:auto;display:flex;gap:24px;">
        <div id="tbwc-demos" style="display:flex;flex-direction:column;gap:28px;min-width:0;flex:1;max-width:700px;"></div>
        <div id="tbwc-log" style="min-width:200px;max-width:350px;font-family:monospace;font-size:11px;color:var(--view-fg-color);background:var(--view-bg-color);border:1px solid var(--input-border-color);border-radius:4px;padding:8px;overflow:auto;white-space:pre-wrap;opacity:0.8;"></div>
      </div>
    </div>
  `,

  setup: () => {
    const demos = document.getElementById('tbwc-demos')!
    const logEl = document.getElementById('tbwc-log')!
    let logLines: string[] = []

    const log = (msg: string) => {
      const t = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      logLines.push(`[${t}] ${msg}`)
      if (logLines.length > 80) logLines = logLines.slice(-60)
      logEl.textContent = logLines.join('\n')
      logEl.scrollTop = logEl.scrollHeight
    }

    const hookEvents = (tb: UITextBoxWC, name: string) => {
      tb.addEventListener('input', (e) => log(`${name} input: "${(e as CustomEvent).detail.value}"`))
      tb.addEventListener('change', (e) => log(`${name} change: "${(e as CustomEvent).detail.value}"`))
      tb.addEventListener('focus', () => log(`${name} focus`))
      tb.addEventListener('blur', () => log(`${name} blur`))
      tb.addEventListener('clear', () => log(`${name} clear`))
    }

    const makeSection = (title: string, ...children: HTMLElement[]): HTMLDivElement => {
      const s = document.createElement('div')
      const h = document.createElement('div')
      h.textContent = title
      h.style.cssText = 'font-size:13px;font-weight:600;color:var(--view-fg-color);margin-bottom:8px;opacity:0.7;'
      s.appendChild(h)
      const row = document.createElement('div')
      row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;'
      for (const c of children) row.appendChild(c)
      s.appendChild(row)
      return s
    }

    // ── 1. All variants × all sizes ──
    const variants: TextBoxVariant[] = ['outlined', 'filled', 'standard', 'fixed']
    const sizes = ['small', 'medium', 'large'] as const

    for (const v of variants) {
      const label = v.charAt(0).toUpperCase() + v.slice(1)
      const els = sizes.map(s => {
        const tb = new UITextBoxWC({
          variant: v,
          size: s,
          label: `${label} ${s}`,
          width: 200,
        })
        hookEvents(tb, `${v}-${s}`)
        return tb
      })
      demos.appendChild(makeSection(`${label}`, ...els))
    }

    // ── 2. All variants with icon ──
    const makeIcon = (emoji: string, slot: string): HTMLSpanElement => {
      const icon = document.createElement('span')
      icon.slot = slot
      icon.textContent = emoji
      icon.style.cssText = 'font-size:14px;padding:0 2px;'
      return icon
    }

    const makeClearIcon = (slot: string, tb: UITextBoxWC): HTMLButtonElement => {
      const btn = document.createElement('button')
      btn.slot = slot
      btn.textContent = '✕'
      btn.style.cssText = 'font-size:13px;padding:2px 4px;border:none;background:transparent;color:var(--input-label-color);cursor:pointer;border-radius:50%;line-height:1;transition:all 200ms ease-out;'
      btn.addEventListener('mouseenter', () => { btn.style.color = 'var(--view-fg-color)'; btn.style.background = 'rgba(128,128,128,0.2)' })
      btn.addEventListener('mouseleave', () => { btn.style.color = 'var(--input-label-color)'; btn.style.background = 'transparent' })
      btn.addEventListener('click', () => { tb.clear(); tb.focus() })
      return btn
    }

    for (const v of variants) {
      const label = v.charAt(0).toUpperCase() + v.slice(1)
      const els = sizes.map(s => {
        const tb = new UITextBoxWC({
          variant: v,
          size: s,
          label: `${label} ${s}`,
          width: 220,
        })
        hookEvents(tb, `${v}-${s}-icon`)
        tb.appendChild(makeIcon('🔍', 'start'))
        tb.appendChild(makeClearIcon('end', tb))
        return tb
      })
      demos.appendChild(makeSection(`${label} with icon`, ...els))
    }

    // ── 3. With slots ──
    const tbIcon = new UITextBoxWC({ label: 'Search', variant: 'outlined', width: 260, clearable: true, hint: 'Search by name or keyword' })
    const searchIcon = document.createElement('span')
    searchIcon.slot = 'start'
    searchIcon.textContent = '🔍'
    searchIcon.style.cssText = 'font-size:14px;padding:0 2px;'
    tbIcon.appendChild(searchIcon)
    hookEvents(tbIcon, 'search')

    // Custom hint on email
    const emailHint = new UIHintWC()
    const tbBtn = new UITextBoxWC({ label: 'Email', variant: 'outlined', width: 300, type: 'email' })
    emailHint.configure({
      anchor: tbBtn,
      content: '<div style="padding:6px 10px;"><b>Email format</b><br>user@domain.com</div>',
      alignment: 'BottomCenter',
      trigger: 'hover',
      arrow: true,
      showDelay: 400,
    })
    const sendBtn = document.createElement('ui-button')
    sendBtn.setAttribute('slot', 'end')
    sendBtn.setAttribute('size', 'tiny')
    sendBtn.setAttribute('variant', 'solid')
    sendBtn.textContent = 'Send'
    tbBtn.appendChild(sendBtn)
    hookEvents(tbBtn, 'email')

    const tbPrefix = new UITextBoxWC({ label: 'Price', variant: 'fixed', width: 180, type: 'number' })
    const prefix = document.createElement('span')
    prefix.slot = 'start'
    prefix.textContent = '$'
    prefix.style.cssText = 'color:var(--view-fg-color);font-size:14px;padding:0 2px;'
    tbPrefix.appendChild(prefix)
    const suffix = document.createElement('span')
    suffix.slot = 'end'
    suffix.textContent = '.00'
    suffix.style.cssText = 'color:var(--input-placeholder-color);font-size:14px;padding:0 4px;'
    tbPrefix.appendChild(suffix)

    demos.appendChild(makeSection('With Slots (icons, buttons, prefix/suffix)', tbIcon, tbBtn, tbPrefix))

    // ── 4. Clearable ──
    const tbClear = new UITextBoxWC({ label: 'Clearable', variant: 'outlined', width: 250, clearable: true, value: 'Clear me' })
    hookEvents(tbClear, 'clearable')
    demos.appendChild(makeSection('Clearable', tbClear))

    // ── 5. Validation ──
    const tbSuccess = new UITextBoxWC({ label: 'Username', variant: 'outlined', width: 250, value: 'john_doe', validation: 'success', helperText: 'Username is available!', helperIcon: 'auto' })
    const tbError = new UITextBoxWC({ label: 'Email', variant: 'outlined', width: 250, value: 'invalid', validation: 'error', helperText: 'Please enter a valid email address', helperIcon: 'auto' })
    demos.appendChild(makeSection('Validation', tbSuccess, tbError))

    // ── 6. Disabled / Readonly ──
    const tbDisabled = new UITextBoxWC({ label: 'Disabled', variant: 'outlined', width: 220, value: 'Cannot edit', disabled: true })
    const tbReadonly = new UITextBoxWC({ label: 'Read-only', variant: 'outlined', width: 220, value: 'Select only', readonly: true })
    demos.appendChild(makeSection('Disabled / Readonly', tbDisabled, tbReadonly))

    // ── 7. Password toggle ──
    const tbPass = new UITextBoxWC({ label: 'Password', variant: 'outlined', width: 280, type: 'password', value: 'secret123' })
    const eyeBtn = document.createElement('button')
    eyeBtn.slot = 'end'
    eyeBtn.textContent = '👁'
    eyeBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:14px;padding:2px 4px;'
    eyeBtn.addEventListener('click', () => {
      tbPass.type = tbPass.type === 'password' ? 'text' : 'password'
      eyeBtn.textContent = tbPass.type === 'password' ? '👁' : '🙈'
    })
    tbPass.appendChild(eyeBtn)
    hookEvents(tbPass, 'password')
    demos.appendChild(makeSection('Password Toggle', tbPass))

    // ── 8. Multiline — all variants ──
    for (const v of variants) {
      const label = v.charAt(0).toUpperCase() + v.slice(1)
      const tb = new UITextBoxWC({
        variant: v,
        multiline: true,
        rows: 4,
        label: `${label} multiline`,
        width: 280,
        value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6',
      })
      hookEvents(tb, `${v}-multiline`)
      demos.appendChild(makeSection(`Multiline ${label}`, tb))
    }

    // ── 9. Multiline clearable + validation ──
    const tbMultiClear = new UITextBoxWC({
      multiline: true, rows: 3, label: 'Notes', variant: 'outlined', width: 300,
      clearable: true, value: 'Some notes here...',
    })
    hookEvents(tbMultiClear, 'multi-clearable')
    const tbMultiError = new UITextBoxWC({
      multiline: true, rows: 3, label: 'Description', variant: 'outlined', width: 300,
      validation: 'error', helperText: 'Description is required', helperIcon: 'auto',
    })
    const tbMultiSuccess = new UITextBoxWC({
      multiline: true, rows: 3, label: 'Bio', variant: 'outlined', width: 300,
      validation: 'success', helperText: 'Looks good!', helperIcon: 'auto',
      value: 'Software developer with 10 years of experience.',
    })
    demos.appendChild(makeSection('Multiline Clearable + Validation', tbMultiClear, tbMultiError, tbMultiSuccess))

    // ── 10. Runtime multiline toggle ──
    const tbToggle = new UITextBoxWC({ label: 'Toggle me', variant: 'outlined', width: 300, value: 'Type here' })
    hookEvents(tbToggle, 'toggle')
    const toggleBtn = document.createElement('ui-button')
    toggleBtn.setAttribute('size', 'small')
    toggleBtn.setAttribute('variant', 'solid')
    toggleBtn.textContent = 'Toggle Multiline'
    toggleBtn.addEventListener('click', () => {
      tbToggle.multiline = !tbToggle.multiline
      if (tbToggle.multiline) tbToggle.rows = 4
      log(`toggle: multiline=${tbToggle.multiline}`)
    })
    const toggleWrap = document.createElement('div')
    toggleWrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;'
    toggleWrap.appendChild(tbToggle)
    toggleWrap.appendChild(toggleBtn)
    demos.appendChild(makeSection('Runtime Multiline Toggle', toggleWrap))

    // ── 11. Form demo ──
    const formFields = [
      new UITextBoxWC({ label: 'First Name', variant: 'outlined', width: 220 }),
      new UITextBoxWC({ label: 'Last Name', variant: 'outlined', width: 220 }),
      new UITextBoxWC({ label: 'Email', variant: 'outlined', width: 220, type: 'email' }),
      new UITextBoxWC({ label: 'Phone', variant: 'outlined', width: 220, type: 'tel' }),
    ]
    const tbComments = new UITextBoxWC({ label: 'Comments', variant: 'outlined', width: '100%', multiline: true, rows: 4 })
    hookEvents(tbComments, 'comments')
    const formWrap = document.createElement('div')
    formWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;'
    for (const f of formFields) formWrap.appendChild(f)
    const formCol = document.createElement('div')
    formCol.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;max-width:460px;'
    formCol.appendChild(formWrap)
    tbComments.style.width = '100%'
    formCol.appendChild(tbComments)
    demos.appendChild(makeSection('Form Layout with Multiline', formCol))

    // ── Window demo button ──
    let wm: UIWindowManagerWC | null = null

    document.getElementById('tbwc-window-demo')?.addEventListener('click', () => {
      if (wm) { wm.destroy(); wm = null }
      const container = demos.parentElement!
      wm = new UIWindowManagerWC({ height: 350 })
      wm.style.width = '100%'
      wm.style.display = 'block'
      wm.style.position = 'relative'
      wm.style.marginTop = '16px'
      wm.style.border = '1px solid var(--input-border-color)'
      container.appendChild(wm)

      const win = new UIWindowWC({ title: 'Login Form', width: 320, height: 280, left: 20, top: 20 })
      wm.addWindow(win)
      wm.bringToFront(win)

      const form = document.createElement('div')
      form.style.cssText = 'padding:12px;display:flex;flex-direction:column;gap:12px;'

      const tbUser = new UITextBoxWC({ label: 'Username', variant: 'outlined' })
      tbUser.style.width = '100%'
      form.appendChild(tbUser)

      const tbPwd = new UITextBoxWC({ label: 'Password', variant: 'outlined', type: 'password' })
      tbPwd.style.width = '100%'
      form.appendChild(tbPwd)

      const loginBtn = document.createElement('ui-button')
      loginBtn.setAttribute('variant', 'solid')
      loginBtn.textContent = 'Login'
      loginBtn.style.cssText = 'align-self:flex-end;margin-top:4px;'
      form.appendChild(loginBtn)

      win.contentElement.appendChild(form)
      log('Window demo opened')
    })

    document.getElementById('tbwc-clear-log')?.addEventListener('click', () => {
      logLines = []
      logEl.textContent = ''
    })

    log('TextBox WC demo ready')
  },
}
