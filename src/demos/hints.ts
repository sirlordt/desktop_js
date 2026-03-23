import '../components/ui-button/ui-button'
import { UIHint } from '../components/ui-hint/ui-hint'
import type { HintAlignment } from '../components/common/types'
import type { DemoRoute } from '../header'

const allHints: UIHint[] = []

function destroyAllHints() {
  for (const h of allHints) h.destroy()
  allHints.length = 0
}

export const hintsDemo: DemoRoute = {
  id: 'hints',
  label: 'Hints',
  render: () => `
    <div class="demo-app">

      <!-- All 13 Alignments -->
      <section class="demo-section">
        <h2>All 13 Alignments (hover)</h2>
        <div class="btn-demo-row" id="hint-alignments" style="flex-wrap:wrap;gap:10px;justify-content:center;"></div>
      </section>

      <!-- With Arrow -->
      <section class="demo-section">
        <h2>With Arrow (hover)</h2>
        <div class="btn-demo-row" id="hint-arrows" style="justify-content:center;"></div>
      </section>

      <!-- Click Trigger -->
      <section class="demo-section">
        <h2>Click Trigger</h2>
        <div class="btn-demo-row" id="hint-click"></div>
      </section>

      <!-- Programmatic Trigger -->
      <section class="demo-section">
        <h2>Programmatic Trigger</h2>
        <div class="btn-demo-row" id="hint-programmatic" style="justify-content:space-between;"></div>
      </section>

      <!-- Combined Triggers -->
      <section class="demo-section">
        <h2>Combined Triggers (hover + click)</h2>
        <div class="btn-demo-row" id="hint-combined"></div>
      </section>

      <!-- Animation -->
      <section class="demo-section">
        <h2>Animation: fade vs none</h2>
        <div class="btn-demo-row" id="hint-animation"></div>
      </section>

      <!-- Delays -->
      <section class="demo-section">
        <h2>Show/Hide Delays</h2>
        <div class="btn-demo-row" id="hint-delays" style="flex-wrap:wrap;"></div>
      </section>

      <!-- Margins -->
      <section class="demo-section">
        <h2>Margin (distance from anchor)</h2>
        <div class="btn-demo-row" id="hint-margins" style="flex-wrap:wrap;"></div>
      </section>

      <!-- Arrow Sizes -->
      <section class="demo-section">
        <h2>Arrow Sizes</h2>
        <div class="btn-demo-row" id="hint-arrow-sizes" style="flex-wrap:wrap;"></div>
      </section>

      <!-- Border Styling -->
      <section class="demo-section">
        <h2>Border Styling</h2>
        <div class="btn-demo-row" id="hint-borders" style="flex-wrap:wrap;"></div>
      </section>

      <!-- Rich Content -->
      <section class="demo-section">
        <h2>Rich Content</h2>
        <div class="btn-demo-row" id="hint-rich" style="justify-content:space-between;"></div>
      </section>

      <!-- Closable -->
      <section class="demo-section">
        <h2>Closable Hint (click to open, [x] to close)</h2>
        <div class="btn-demo-row" id="hint-closable"></div>
      </section>

      <!-- Input Hint -->
      <section class="demo-section">
        <h2>Input Hint (type + accept/cancel)</h2>
        <div class="btn-demo-row" id="hint-input"></div>
      </section>

      <!-- Disabled -->
      <section class="demo-section">
        <h2>Disabled</h2>
        <div class="btn-demo-row" id="hint-disabled"></div>
      </section>

      <!-- Auto-flip -->
      <section class="demo-section">
        <h2>Auto-flip (push to edge)</h2>
        <div class="btn-demo-row" id="hint-autoflip" style="justify-content:space-between;"></div>
      </section>

      <!-- MouseCursor -->
      <section class="demo-section">
        <h2>MouseCursor Alignment</h2>
        <div id="hint-cursor-area" class="hint-demo-cursor-area">
          Hover anywhere in this area
        </div>
      </section>

    </div>
  `,

  setup: () => {
    destroyAllHints()

    // ── 1. Alignments ──
    const alignRow = document.getElementById('hint-alignments')!
    const alignments: HintAlignment[] = [
      'TopLeft', 'TopCenter', 'TopRight',
      'LeftTop', 'LeftCenter', 'LeftBottom',
      'RightTop', 'RightCenter', 'RightBottom',
      'BottomLeft', 'BottomCenter', 'BottomRight',
      'MouseCursor',
    ]
    for (const alignment of alignments) {
      const btn = makeAnchor(alignment)
      alignRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment,
        content: `<div style="padding:6px 10px;font-size:12px;">${alignment}</div>`,
        trigger: 'hover', showDelay: 200, hideDelay: 150,
      }))
    }

    // ── 2. With Arrow ──
    const arrowRow = document.getElementById('hint-arrows')!
    for (const alignment of ['BottomCenter', 'TopCenter', 'RightCenter', 'LeftCenter'] as HintAlignment[]) {
      const btn = makeAnchor(`Arrow ${alignment}`)
      arrowRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment,
        content: `<div style="padding:6px 10px;font-size:12px;">Arrow → ${alignment}</div>`,
        trigger: 'hover', arrow: true, arrowSize: 6,
        showDelay: 150, hideDelay: 100,
      }))
    }

    // ── 3. Click Trigger ──
    const clickRow = document.getElementById('hint-click')!
    for (const alignment of ['BottomCenter', 'RightCenter'] as HintAlignment[]) {
      const btn = makeAnchor(`Click me (${alignment})`)
      clickRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment,
        content: `<div style="padding:6px 10px;font-size:12px;">Click to close</div>`,
        trigger: 'click', arrow: true,
        showDelay: 0, hideDelay: 0, animation: 'fade', animationDuration: 100,
      }))
    }

    // ── 4. Programmatic ──
    const progRow = document.getElementById('hint-programmatic')!

    // Left
    const progLeftWrap = document.createElement('div')
    progLeftWrap.style.cssText = 'display:flex;gap:8px;align-items:center;'
    const progTargetL = makeAnchor('Target Left')
    progLeftWrap.appendChild(progTargetL)
    const progHintL = new UIHint({
      anchor: progTargetL, alignment: 'BottomCenter',
      content: `<div style="padding:6px 10px;font-size:12px;">Programmatic (left)</div>`,
      trigger: 'programmatic', arrow: true, showDelay: 0, hideDelay: 0,
    })
    allHints.push(progHintL)
    for (const [label, action, variant] of [
      ['Show', () => progHintL.showImmediate(), 'success'],
      ['Hide', () => progHintL.hideImmediate(), 'danger'],
      ['Toggle', () => progHintL.toggle(), 'info'],
    ] as const) {
      const b = makeActionBtn(label, variant as string)
      b.addEventListener('click', action as () => void)
      progLeftWrap.appendChild(b)
    }
    progRow.appendChild(progLeftWrap)

    // Right
    const progRightWrap = document.createElement('div')
    progRightWrap.style.cssText = 'display:flex;gap:8px;align-items:center;'
    const progTargetR = makeAnchor('Target Right')
    const progHintR = new UIHint({
      anchor: progTargetR, alignment: 'BottomCenter',
      content: `<div style="padding:6px 10px;font-size:12px;">This is a longer hint text to test how the arrow repositions itself when the hint is wider than the anchor element near the right edge of the viewport</div>`,
      trigger: 'programmatic', arrow: true, showDelay: 0, hideDelay: 0,
    })
    allHints.push(progHintR)
    for (const [label, action, variant] of [
      ['Toggle', () => progHintR.toggle(), 'info'],
      ['Hide', () => progHintR.hideImmediate(), 'danger'],
      ['Show', () => progHintR.showImmediate(), 'success'],
    ] as const) {
      const b = makeActionBtn(label, variant as string)
      b.addEventListener('click', action as () => void)
      progRightWrap.appendChild(b)
    }
    progRightWrap.appendChild(progTargetR)
    progRow.appendChild(progRightWrap)

    // ── 5. Combined ──
    const combRow = document.getElementById('hint-combined')!
    const combBtn = makeAnchor('Hover or Click')
    combRow.appendChild(combBtn)
    allHints.push(new UIHint({
      anchor: combBtn, alignment: 'BottomCenter',
      content: `<div style="padding:6px 10px;font-size:12px;">Works with hover AND click</div>`,
      trigger: ['hover', 'click'], arrow: true,
    }))

    // ── 6. Animation ──
    const animRow = document.getElementById('hint-animation')!
    for (const anim of ['fade', 'none'] as const) {
      const btn = makeAnchor(`animation: ${anim}`)
      animRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">${anim} animation</div>`,
        trigger: 'hover', animation: anim,
        animationDuration: anim === 'fade' ? 300 : 0,
        showDelay: 0, hideDelay: 0,
      }))
    }

    // ── 7. Delays ──
    const delayRow = document.getElementById('hint-delays')!
    for (const d of [
      { show: 0, hide: 0 }, { show: 300, hide: 200 },
      { show: 800, hide: 500 }, { show: 0, hide: 1000 },
    ]) {
      const label = `${d.show}/${d.hide}ms`
      const btn = makeAnchor(label)
      delayRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">show: ${d.show}ms, hide: ${d.hide}ms</div>`,
        trigger: 'hover', showDelay: d.show, hideDelay: d.hide,
      }))
    }

    // ── 8. Margins ──
    const marginRow = document.getElementById('hint-margins')!
    for (const m of [0, 4, 8, 16, 32]) {
      const btn = makeAnchor(`margin: ${m}px`)
      marginRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">${m}px from anchor</div>`,
        trigger: 'hover', margin: m, showDelay: 100, hideDelay: 100,
      }))
    }

    // ── 9. Arrow Sizes ──
    const arrowSizeRow = document.getElementById('hint-arrow-sizes')!
    for (const as of [4, 6, 8, 12]) {
      const btn = makeAnchor(`arrow: ${as}px`)
      arrowSizeRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">Arrow size: ${as}px</div>`,
        trigger: 'hover', arrow: true, arrowSize: as,
        showDelay: 100, hideDelay: 100,
      }))
    }

    // ── 10. Borders ──
    const borderRow = document.getElementById('hint-borders')!
    const borderConfigs = [
      { bw: 1, br: 4, bc: undefined, label: 'Default' },
      { bw: 2, br: 8, bc: '#2563eb', label: '2px blue r8' },
      { bw: 0, br: 0, bc: undefined, label: 'No border' },
      { bw: 3, br: 12, bc: '#dc2626', label: '3px red r12' },
    ]
    for (const cfg of borderConfigs) {
      const btn = makeAnchor(cfg.label)
      borderRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">${cfg.label}</div>`,
        trigger: 'hover', borderWidth: cfg.bw, borderRadius: cfg.br,
        borderColor: cfg.bc, showDelay: 100, hideDelay: 100,
      }))
    }

    // Border + Arrow
    const borderArrowConfigs = [
      { bw: 1, br: 4, bc: undefined, label: 'Default + arrow' },
      { bw: 2, br: 8, bc: '#2563eb', label: '2px blue r8 + arrow' },
      { bw: 3, br: 12, bc: '#dc2626', label: '3px red r12 + arrow' },
      { bw: 2, br: 6, bc: '#16a34a', label: '2px green r6 + arrow' },
    ]
    const borderArrowRow = document.createElement('div')
    borderArrowRow.className = 'btn-demo-row'
    borderArrowRow.style.cssText = 'flex-wrap:wrap;margin-top:12px;'
    borderRow.parentElement!.insertBefore(borderArrowRow, borderRow.nextSibling)

    const borderArrowLabel = document.createElement('p')
    borderArrowLabel.className = 'btn-demo-hint'
    borderArrowLabel.textContent = 'With arrow — border should continue into the arrow triangle'
    borderRow.parentElement!.insertBefore(borderArrowLabel, borderArrowRow)

    for (const cfg of borderArrowConfigs) {
      const btn = makeAnchor(cfg.label)
      borderArrowRow.appendChild(btn)
      allHints.push(new UIHint({
        anchor: btn, alignment: 'BottomCenter',
        content: `<div style="padding:6px 10px;font-size:12px;">${cfg.label}</div>`,
        trigger: 'hover', arrow: true, arrowSize: 8,
        borderWidth: cfg.bw, borderRadius: cfg.br,
        borderColor: cfg.bc, showDelay: 100, hideDelay: 100,
      }))
    }

    // ── 11. Rich Content ──
    const richRow = document.getElementById('hint-rich')!
    const richBtn = makeAnchor('Hover for rich hint')
    richRow.appendChild(richBtn)

    const richEl = document.createElement('div')
    richEl.style.cssText = 'width:240px;padding:10px;'
    richEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:6px;background:var(--accent-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="#fff"><rect x="7" y="3" width="2" height="6" rx="1"/><rect x="7" y="11" width="2" height="2" rx="1"/></svg></div>
        <div style="font-size:13px;font-weight:700;">Component Info</div>
      </div>
      <div style="height:1px;margin-bottom:8px;background:var(--separator-color);"></div>
      <div style="font-size:12px;margin-bottom:4px;">Status: Active</div>
      <div style="font-size:12px;margin-bottom:4px;">Version: 1.2.3</div>
    `
    allHints.push(new UIHint({
      anchor: richBtn, alignment: 'BottomCenter',
      content: richEl, trigger: 'hover', arrow: true,
      borderWidth: 1, showDelay: 200, hideDelay: 200,
    }))

    const richBtnR = makeAnchor('Rich hint (right edge)')
    richRow.appendChild(richBtnR)

    const richEl2 = document.createElement('div')
    richEl2.style.cssText = 'width:240px;padding:10px;'
    richEl2.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:6px;background:var(--error-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1.5 13h13L8 1.5z"/><line x1="8" y1="6" x2="8" y2="9.5"/><line x1="8" y1="11.5" x2="8" y2="12"/></svg></div>
        <div style="font-size:13px;font-weight:700;">Warning Details</div>
      </div>
      <div style="height:1px;margin-bottom:8px;background:var(--separator-color);"></div>
      <div style="font-size:12px;margin-bottom:4px;">Memory usage: 87%</div>
      <div style="font-size:12px;margin-bottom:4px;">CPU load: High</div>
    `
    allHints.push(new UIHint({
      anchor: richBtnR, alignment: 'BottomCenter',
      content: richEl2, trigger: 'hover', arrow: true,
      borderWidth: 1, showDelay: 200, hideDelay: 200,
    }))

    // ── 12. Closable ──
    const closableRow = document.getElementById('hint-closable')!
    const closableBtn = makeAnchor('Click to open hint')
    closableRow.appendChild(closableBtn)

    const closableEl = document.createElement('div')
    closableEl.style.cssText = 'width:240px;padding:10px;position:relative;'
    closableEl.innerHTML = `
      <div class="hint-close-btn" style="position:absolute;top:10px;right:10px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:#dc2626;border-radius:4px;cursor:pointer;user-select:none;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-right:24px;">
        <div style="width:28px;height:28px;border-radius:6px;background:var(--success-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,11.5 13,5"/></svg></div>
        <div style="font-size:13px;font-weight:700;">Task Complete</div>
      </div>
      <div style="height:1px;margin-bottom:8px;background:var(--separator-color);"></div>
      <div style="font-size:12px;margin-bottom:4px;">Build passed successfully</div>
      <div style="font-size:12px;margin-bottom:4px;">All 42 tests green</div>
    `
    const closableHint = new UIHint({
      anchor: closableBtn, alignment: 'BottomCenter',
      content: closableEl, trigger: 'click', arrow: true,
      borderWidth: 1, showDelay: 0, hideDelay: 0,
    })
    allHints.push(closableHint)
    closableEl.querySelector('.hint-close-btn')!.addEventListener('click', (e) => {
      e.stopPropagation()
      closableHint.hideImmediate()
    })

    // ── 13. Input Hint ──
    const inputRow = document.getElementById('hint-input')!
    const inputBtn = makeAnchor('Click to edit')
    inputRow.appendChild(inputBtn)

    const inputEl = document.createElement('div')
    inputEl.style.cssText = 'width:260px;padding:10px;'
    inputEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:6px;background:var(--accent-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2.5l4 4L5 15H1v-4L9.5 2.5z"/></svg></div>
        <div style="font-size:13px;font-weight:700;">Edit Value</div>
      </div>
      <div style="height:1px;margin-bottom:8px;background:var(--separator-color);"></div>
      <div style="font-size:11px;margin-bottom:8px;opacity:0.6;">Enter any value to update the configuration.</div>
      <input type="text" placeholder="Type something..." style="width:100%;box-sizing:border-box;padding:6px 8px;font-size:12px;border:1px solid var(--input-border-color);border-radius:4px;margin-bottom:10px;background:var(--input-bg-color);color:var(--input-fg-color);outline:none;font-family:var(--font-sans);">
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <div class="hint-accept-btn" style="padding:4px 12px;font-size:12px;border-radius:4px;cursor:pointer;user-select:none;background:#16a34a;color:#fff;">Accept</div>
        <div class="hint-cancel-btn" style="padding:4px 12px;font-size:12px;border-radius:4px;cursor:pointer;user-select:none;background:#dc2626;color:#fff;">Cancel</div>
      </div>
    `
    const inputHint = new UIHint({
      anchor: inputBtn, alignment: 'BottomLeft',
      content: inputEl, trigger: 'click', arrow: true,
      borderWidth: 1, showDelay: 0, hideDelay: 0,
    })
    allHints.push(inputHint)
    inputEl.querySelector('.hint-accept-btn')!.addEventListener('click', (e) => {
      e.stopPropagation(); inputHint.hideImmediate()
    })
    inputEl.querySelector('.hint-cancel-btn')!.addEventListener('click', (e) => {
      e.stopPropagation(); inputHint.hideImmediate()
    })

    // ── 14. Disabled ──
    const disRow = document.getElementById('hint-disabled')!
    const disBtn = makeAnchor('Hover (disabled hint)')
    disRow.appendChild(disBtn)
    const disHint = new UIHint({
      anchor: disBtn, alignment: 'BottomCenter',
      content: `<div style="padding:6px 10px;font-size:12px;">You should not see this</div>`,
      trigger: 'hover', disabled: true,
    })
    allHints.push(disHint)
    const disToggle = makeActionBtn('Enable', 'warning')
    disToggle.addEventListener('click', () => {
      disHint.disabled = !disHint.disabled
      disToggle.textContent = disHint.disabled ? 'Enable' : 'Disable'
    })
    disRow.appendChild(disToggle)

    // ── 15. Auto-flip ──
    const flipRow = document.getElementById('hint-autoflip')!
    const flipL = makeAnchor('LeftCenter')
    flipRow.appendChild(flipL)
    allHints.push(new UIHint({
      anchor: flipL, alignment: 'LeftCenter',
      content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">Should auto-flip if no space on left</div>`,
      trigger: 'hover', arrow: true, showDelay: 100, hideDelay: 100,
    }))
    const flipR = makeAnchor('RightCenter')
    flipRow.appendChild(flipR)
    allHints.push(new UIHint({
      anchor: flipR, alignment: 'RightCenter',
      content: `<div style="padding:6px 10px;font-size:12px;white-space:nowrap;">Should auto-flip if no space on right</div>`,
      trigger: 'hover', arrow: true, showDelay: 100, hideDelay: 100,
    }))

    // ── 16. MouseCursor ──
    const cursorArea = document.getElementById('hint-cursor-area')!
    allHints.push(new UIHint({
      anchor: cursorArea, alignment: 'MouseCursor',
      content: `<div style="padding:6px 10px;font-size:12px;">Following cursor</div>`,
      trigger: 'hover', showDelay: 0, hideDelay: 100,
    }))
  },
}

function makeAnchor(text: string): HTMLElement {
  const el = document.createElement('ui-button')
  el.textContent = text
  el.setAttribute('variant', 'outline')
  el.setAttribute('size', 'small')
  return el
}

function makeActionBtn(text: string, variant: string): HTMLElement {
  const el = document.createElement('ui-button')
  el.textContent = text
  el.setAttribute('variant', variant)
  el.setAttribute('size', 'small')
  return el
}
