import '../components/ui-button/ui-button'
import { UIButton } from '../components/ui-button/ui-button'
import { UIHint } from '../components/ui-hint/ui-hint'
import type { DemoRoute } from '../header'

export const buttonsDemo: DemoRoute = {
  id: 'buttons',
  label: 'Buttons',
  render: () => `
    <div class="demo-app">

      <!-- Variants -->
      <section class="demo-section">
        <h2>Variants</h2>
        <div class="btn-demo-row">
          <ui-button variant="solid">Solid</ui-button>
          <ui-button variant="outline">Outline</ui-button>
          <ui-button variant="ghost">Ghost</ui-button>
          <ui-button variant="danger">Danger</ui-button>
          <ui-button variant="warning">Warning</ui-button>
          <ui-button variant="info">Info</ui-button>
          <ui-button variant="success">Success</ui-button>
        </div>
      </section>

      <!-- Sizes -->
      <section class="demo-section">
        <h2>Sizes</h2>
        <div class="btn-demo-row btn-demo-row--align-end">
          <ui-button size="tiny">Tiny</ui-button>
          <ui-button size="small">Small</ui-button>
          <ui-button size="medium">Medium</ui-button>
          <ui-button size="large">Large</ui-button>
          <ui-button size="xlarge">XLarge</ui-button>
        </div>
      </section>

      <!-- Sizes x Variants -->
      <section class="demo-section">
        <h2>Sizes x Variants</h2>
        <div class="btn-demo-grid" style="grid-template-columns: 80px repeat(7, 1fr);">
          <div class="btn-demo-grid__header"></div>
          <div class="btn-demo-grid__header">Solid</div>
          <div class="btn-demo-grid__header">Outline</div>
          <div class="btn-demo-grid__header">Ghost</div>
          <div class="btn-demo-grid__header">Danger</div>
          <div class="btn-demo-grid__header">Warning</div>
          <div class="btn-demo-grid__header">Info</div>
          <div class="btn-demo-grid__header">Success</div>

          <div class="btn-demo-grid__label">Tiny</div>
          <div><ui-button size="tiny" variant="solid">Act</ui-button></div>
          <div><ui-button size="tiny" variant="outline">Act</ui-button></div>
          <div><ui-button size="tiny" variant="ghost">Act</ui-button></div>
          <div><ui-button size="tiny" variant="danger">Act</ui-button></div>
          <div><ui-button size="tiny" variant="warning">Act</ui-button></div>
          <div><ui-button size="tiny" variant="info">Act</ui-button></div>
          <div><ui-button size="tiny" variant="success">Act</ui-button></div>

          <div class="btn-demo-grid__label">Small</div>
          <div><ui-button size="small" variant="solid">Act</ui-button></div>
          <div><ui-button size="small" variant="outline">Act</ui-button></div>
          <div><ui-button size="small" variant="ghost">Act</ui-button></div>
          <div><ui-button size="small" variant="danger">Act</ui-button></div>
          <div><ui-button size="small" variant="warning">Act</ui-button></div>
          <div><ui-button size="small" variant="info">Act</ui-button></div>
          <div><ui-button size="small" variant="success">Act</ui-button></div>

          <div class="btn-demo-grid__label">Medium</div>
          <div><ui-button size="medium" variant="solid">Action</ui-button></div>
          <div><ui-button size="medium" variant="outline">Action</ui-button></div>
          <div><ui-button size="medium" variant="ghost">Action</ui-button></div>
          <div><ui-button size="medium" variant="danger">Action</ui-button></div>
          <div><ui-button size="medium" variant="warning">Action</ui-button></div>
          <div><ui-button size="medium" variant="info">Action</ui-button></div>
          <div><ui-button size="medium" variant="success">Action</ui-button></div>

          <div class="btn-demo-grid__label">Large</div>
          <div><ui-button size="large" variant="solid">Action</ui-button></div>
          <div><ui-button size="large" variant="outline">Action</ui-button></div>
          <div><ui-button size="large" variant="ghost">Action</ui-button></div>
          <div><ui-button size="large" variant="danger">Action</ui-button></div>
          <div><ui-button size="large" variant="warning">Action</ui-button></div>
          <div><ui-button size="large" variant="info">Action</ui-button></div>
          <div><ui-button size="large" variant="success">Action</ui-button></div>

          <div class="btn-demo-grid__label">XLarge</div>
          <div><ui-button size="xlarge" variant="solid">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="outline">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="ghost">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="danger">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="warning">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="info">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="success">Action</ui-button></div>
        </div>
      </section>

      <!-- States -->
      <section class="demo-section">
        <h2>States</h2>
        <div class="btn-demo-row">
          <ui-button>Default</ui-button>
          <ui-button disabled>Disabled</ui-button>
        </div>
        <p class="btn-demo-hint">Hover, focus (Tab), and active (click) states are interactive — try them above.</p>

        <h3 style="margin-top: 16px;">Disabled per variant</h3>
        <div class="btn-demo-row">
          <ui-button variant="solid" disabled>Solid</ui-button>
          <ui-button variant="outline" disabled>Outline</ui-button>
          <ui-button variant="ghost" disabled>Ghost</ui-button>
          <ui-button variant="danger" disabled>Danger</ui-button>
          <ui-button variant="warning" disabled>Warning</ui-button>
          <ui-button variant="info" disabled>Info</ui-button>
          <ui-button variant="success" disabled>Success</ui-button>
        </div>
      </section>

      <!-- Icons -->
      <section class="demo-section">
        <h2>Icons</h2>
        <div class="btn-demo-row">
          <ui-button>
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><polygon points="13,0 4,8 13,16"/></svg>
            Left icon
          </ui-button>
          <ui-button>
            Right icon
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M1 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button>
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/></svg>
            Both icons
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button variant="outline">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="15" y2="15"/></svg>
            Search
          </ui-button>
          <ui-button variant="ghost">
            <svg slot="icon-left" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </ui-button>
          <ui-button variant="danger">
            Delete
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1V0h6v1h4v2H1V1h4zM2 4h12l-1 12H3L2 4z"/></svg>
          </ui-button>
        </div>

        <h3>Icon-only buttons</h3>

        <p class="btn-demo-hint" style="margin-bottom: 8px;">Left icon only</p>
        <div class="btn-demo-row">
          <ui-button>
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg>
          </ui-button>
          <ui-button variant="outline">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="8"/><line x1="8" y1="8" x2="11" y2="10"/></svg>
          </ui-button>
          <ui-button variant="ghost">
            <svg slot="icon-left" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </ui-button>
          <ui-button variant="danger">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1V0h6v1h4v2H1V1h4zM2 4h12l-1 12H3L2 4z"/></svg>
          </ui-button>
        </div>

        <p class="btn-demo-hint" style="margin-bottom: 8px;">Right icon only</p>
        <div class="btn-demo-row">
          <ui-button>
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M1 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button variant="outline">
            <svg slot="icon-right" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="15" y2="15"/></svg>
          </ui-button>
          <ui-button variant="ghost">
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button variant="danger">
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1V0h6v1h4v2H1V1h4zM2 4h12l-1 12H3L2 4z"/></svg>
          </ui-button>
        </div>

        <p class="btn-demo-hint" style="margin-bottom: 8px;">Two icons, no text</p>
        <div class="btn-demo-row">
          <ui-button>
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg>
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button variant="outline">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/></svg>
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button variant="ghost">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="15" y2="15"/></svg>
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M1 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
        </div>
      </section>

      <!-- Toggle -->
      <section class="demo-section">
        <h2>Toggle</h2>
        <div class="btn-demo-row">
          <ui-button toggle id="toggle-play">
            <span slot="icon-left" id="play-icon"></span>
            Play
          </ui-button>
          <ui-button toggle variant="outline" id="toggle-fav">
            <span slot="icon-left" id="fav-icon"></span>
            Favorite
          </ui-button>
          <ui-button toggle variant="ghost" id="toggle-mute">
            <span slot="icon-left" id="mute-icon"></span>
            Notifications
          </ui-button>
        </div>
        <p class="btn-demo-hint" id="toggle-output">Click a toggle button to see its state.</p>
      </section>

      <!-- Focus & Tab Order -->
      <section class="demo-section">
        <h2>Focus & Tab Order</h2>
        <p class="btn-demo-hint" style="margin-bottom: 12px;">Use Tab to navigate. The non-focusable button is skipped. Custom tabindex changes the order.</p>
        <div class="btn-demo-row">
          <ui-button tabindex="3">tabindex=3</ui-button>
          <ui-button tabindex="1">tabindex=1</ui-button>
          <ui-button tabindex="2">tabindex=2</ui-button>
          <ui-button focusable="false">Not focusable</ui-button>
          <ui-button>Default</ui-button>
        </div>

        <h3>Non-focusable per variant</h3>
        <div class="btn-demo-row">
          <ui-button focusable="false" variant="solid">Solid</ui-button>
          <ui-button focusable="false" variant="outline">Outline</ui-button>
          <ui-button focusable="false" variant="ghost">Ghost</ui-button>
          <ui-button focusable="false" variant="danger">Destructive</ui-button>
        </div>

        <h3>Non-focusable with icons</h3>
        <div class="btn-demo-row">
          <ui-button focusable="false" variant="solid">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 13,8 4,14"/></svg>
            Left icon
          </ui-button>
          <ui-button focusable="false" variant="outline">
            Right icon
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M1 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="solid">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="15" y2="15"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="outline">
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="ghost">
            <svg slot="icon-left" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="danger">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1V0h6v1h4v2H1V1h4zM2 4h12l-1 12H3L2 4z"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="solid">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/></svg>
            Both icons
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
          <ui-button focusable="false" variant="outline">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 13,8 4,14"/></svg>
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
        </div>
      </section>

      <!-- Text Overflow -->
      <section class="demo-section">
        <h2>Text Overflow</h2>
        <p class="btn-demo-hint" style="margin-bottom: 12px;">Default: button grows with text. With <code>truncate</code> attribute or <code>--ui-btn-max-width</code>: text is cut with ellipsis.</p>

        <h3>Default (grows)</h3>
        <div class="btn-demo-row">
          <ui-button>This is a button with a very long text that keeps growing</ui-button>
        </div>

        <h3>truncate="200" (pixels)</h3>
        <div class="btn-demo-row">
          <ui-button truncate="200">This is a button with a very long text that gets truncated</ui-button>
          <ui-button truncate="150" variant="outline">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="15" y2="15"/></svg>
            Search with long label here
          </ui-button>
          <ui-button truncate="120" variant="danger">Delete all the things forever</ui-button>
          <ui-button truncate="220">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/></svg>
            A very long label with both icons truncated
            <svg slot="icon-right" viewBox="0 0 16 16" fill="currentColor"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>
          </ui-button>
        </div>

        <h3>truncate (no value = 100% of parent)</h3>
        <div class="btn-demo-row" style="max-width: 300px;">
          <ui-button truncate>This text will truncate to fit the parent container width</ui-button>
        </div>

        <h3>Same max-width, different text lengths</h3>
        <div class="btn-demo-row">
          <ui-button truncate="180">Short</ui-button>
          <ui-button truncate="180">Medium length text</ui-button>
          <ui-button truncate="180">This text is way too long to fit in the button</ui-button>
        </div>
      </section>

      <!-- Custom Override -->
      <section class="demo-section">
        <h2>Custom CSS Override</h2>
        <div class="btn-demo-row">
          <ui-button style="--accent-bg-color: #ff6600; --accent-fg-color: #fff; --accent-hover-color: #e55b00; --accent-active-color: #cc5200;">Orange</ui-button>
          <ui-button style="--accent-bg-color: #8b5cf6; --accent-fg-color: #fff; --accent-hover-color: #7c3aed; --accent-active-color: #6d28d9;">Purple</ui-button>
          <ui-button style="--accent-bg-color: #10b981; --accent-fg-color: #fff; --accent-hover-color: #059669; --accent-active-color: #047857;">Green</ui-button>
        </div>
      </section>

      <!-- Hints -->
      <section class="demo-section">
        <h2>Hints (Tooltips)</h2>
        <h3>Simple (hint attribute)</h3>
        <div class="btn-demo-row">
          <ui-button hint="Save the current document">Save</ui-button>
          <ui-button variant="outline" hint="Undo the last action">Undo</ui-button>
          <ui-button variant="ghost" hint="Open application settings">Settings</ui-button>
          <ui-button variant="danger" hint="Delete this item permanently">Delete</ui-button>
        </div>

        <h3>With Arrow</h3>
        <div class="btn-demo-row">
          <ui-button variant="outline" hint="Left aligned hint" hint-alignment="LeftCenter" hint-arrow>Left</ui-button>
          <ui-button variant="outline" hint="Top aligned hint" hint-alignment="TopCenter" hint-arrow>Top</ui-button>
          <ui-button hint="Bottom hint with arrow" hint-arrow>Bottom</ui-button>
          <ui-button variant="outline" hint="Right aligned hint" hint-alignment="RightCenter" hint-arrow>Right</ui-button>
        </div>

        <h3>Programmatic (via JS API)</h3>
        <div class="btn-demo-row" id="hint-api-row"></div>
        <p class="btn-demo-hint">Custom border, arrow, and rich HTML content via <code>setHint()</code></p>
      </section>

    </div>
  `,

  setup: () => {
    const output = document.getElementById('toggle-output')

    // Toggle icon definitions — simple, clean SVG paths
    const toggleIcons: Record<string, { off: string; on: string }> = {
      'play-icon': {
        off: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><polygon points="4,2 13,8 4,14"/></svg>',
        on:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="3" height="12"/><rect x="10" y="2" width="3" height="12"/></svg>',
      },
      'fav-icon': {
        off: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="8,2 9.8,6 14,6.5 11,9.5 12,14 8,11.5 4,14 5,9.5 2,6.5 6.2,6"/></svg>',
        on:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><polygon points="8,2 9.8,6 14,6.5 11,9.5 12,14 8,11.5 4,14 5,9.5 2,6.5 6.2,6"/></svg>',
      },
      'mute-icon': {
        off: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h4v5a2 2 0 01-4 0V3z"/><path d="M4 13h8"/><path d="M8 11v2"/><path d="M3 6v2a5 5 0 0010 0V6"/></svg>',
        on:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3h4v5a2 2 0 01-4 0V3z"/><path d="M4 13h8"/><path d="M8 11v2"/><path d="M3 6v2a5 5 0 0010 0V6"/><line x1="2" y1="2" x2="14" y2="14" stroke-width="2"/></svg>',
      },
    }

    // Set initial icons
    for (const [id, icons] of Object.entries(toggleIcons)) {
      const el = document.getElementById(id)
      if (el) el.innerHTML = icons.off
    }

    document.querySelectorAll('ui-button[toggle]').forEach(btn => {
      // Using the framework-friendly on() API
      (btn as any).on('ui-click', (detail: { pressed: boolean }) => {
        const label = btn.textContent?.trim()
        if (output) {
          output.textContent = `"${label}" toggled → pressed: ${detail.pressed}`
        }

        // Swap icon
        const iconEl = btn.querySelector('[id$="-icon"]')
        if (iconEl) {
          const iconDef = toggleIcons[iconEl.id]
          if (iconDef) {
            iconEl.innerHTML = detail.pressed ? iconDef.on : iconDef.off
          }
        }
      })
    })

    // ── Hint API demos ──
    const hintApiRow = document.getElementById('hint-api-row')
    if (hintApiRow) {
      // Rich hint with icon + title + separator + details
      const richBtn = document.createElement('ui-button') as UIButton
      richBtn.textContent = 'File Info'
      richBtn.setAttribute('variant', 'outline')
      hintApiRow.appendChild(richBtn)

      const richContent = document.createElement('div')
      richContent.style.cssText = 'width:220px;padding:6px;'
      richContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:24px;height:24px;border-radius:4px;background:var(--accent-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"/><polyline points="9,1 9,5 13,5"/></svg></div>
          <div style="font-size:12px;font-weight:700;">document.ts</div>
        </div>
        <div style="height:1px;margin-bottom:6px;background:var(--separator-color);"></div>
        <div style="font-size:11px;margin-bottom:3px;opacity:0.7;">Size: 14.2 KB</div>
        <div style="font-size:11px;margin-bottom:3px;opacity:0.7;">Modified: 2 hours ago</div>
        <div style="font-size:11px;opacity:0.7;">Type: TypeScript</div>
      `
      richBtn.setHint({
        content: richContent,
        arrow: true,
        alignment: 'BottomCenter',
      })

      // Warning hint with icon + status lines
      const warnBtn = document.createElement('ui-button') as UIButton
      warnBtn.textContent = 'System Status'
      warnBtn.setAttribute('variant', 'warning')
      hintApiRow.appendChild(warnBtn)

      const warnContent = document.createElement('div')
      warnContent.style.cssText = 'width:200px;padding:6px;'
      warnContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:24px;height:24px;border-radius:4px;background:var(--error-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L1.5 13h13L8 1.5z"/><line x1="8" y1="6" x2="8" y2="9.5"/><line x1="8" y1="11.5" x2="8" y2="12"/></svg></div>
          <div style="font-size:12px;font-weight:700;">Warning</div>
        </div>
        <div style="height:1px;margin-bottom:6px;background:var(--separator-color);"></div>
        <div style="font-size:11px;margin-bottom:3px;">CPU: <span style="color:var(--error-bg-color);font-weight:600;">92%</span></div>
        <div style="font-size:11px;margin-bottom:3px;">Memory: <span style="font-weight:600;">6.2 / 8 GB</span></div>
        <div style="font-size:11px;">Disk: <span style="opacity:0.7;">45% used</span></div>
      `
      warnBtn.setHint({
        content: warnContent,
        arrow: true,
        alignment: 'BottomCenter',
      })

      // Custom border hint
      const borderBtn = document.createElement('ui-button') as UIButton
      borderBtn.textContent = 'Custom Border'
      borderBtn.setAttribute('variant', 'info')
      hintApiRow.appendChild(borderBtn)
      borderBtn.setHint({
        content: '<div style="padding:4px 8px;font-size:12px;">Blue border with arrow</div>',
        arrow: true,
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
      })

      // External UIHint (top aligned)
      const extBtn = document.createElement('ui-button') as UIButton
      extBtn.textContent = 'External Hint'
      extBtn.setAttribute('variant', 'success')
      hintApiRow.appendChild(extBtn)

      const extContent = document.createElement('div')
      extContent.style.cssText = 'width:200px;padding:6px;'
      extContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:24px;height:24px;border-radius:4px;background:var(--success-bg-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 6.5,11.5 13,5"/></svg></div>
          <div style="font-size:12px;font-weight:700;">All checks passed</div>
        </div>
        <div style="height:1px;margin-bottom:6px;background:var(--separator-color);"></div>
        <div style="font-size:11px;margin-bottom:3px;opacity:0.7;">Build: 1.2s</div>
        <div style="font-size:11px;opacity:0.7;">Tests: 42/42 green</div>
      `
      extBtn.uiHint = new UIHint({
        anchor: extBtn,
        content: extContent,
        trigger: 'hover',
        arrow: true,
        arrowSize: 8,
        alignment: 'TopCenter',
        showDelay: 100,
        hideDelay: 100,
      })
    }
  },
}
