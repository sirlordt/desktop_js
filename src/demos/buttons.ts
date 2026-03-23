import '../components/ui-button/ui-button'
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
          <ui-button variant="destructive">Destructive</ui-button>
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
          <ui-button size="xlarge">Giant</ui-button>
        </div>
      </section>

      <!-- Sizes x Variants -->
      <section class="demo-section">
        <h2>Sizes x Variants</h2>
        <div class="btn-demo-grid">
          <div class="btn-demo-grid__header"></div>
          <div class="btn-demo-grid__header">Solid</div>
          <div class="btn-demo-grid__header">Outline</div>
          <div class="btn-demo-grid__header">Ghost</div>
          <div class="btn-demo-grid__header">Destructive</div>

          <div class="btn-demo-grid__label">Tiny</div>
          <div><ui-button size="tiny" variant="solid">Action</ui-button></div>
          <div><ui-button size="tiny" variant="outline">Action</ui-button></div>
          <div><ui-button size="tiny" variant="ghost">Action</ui-button></div>
          <div><ui-button size="tiny" variant="destructive">Action</ui-button></div>

          <div class="btn-demo-grid__label">Small</div>
          <div><ui-button size="small" variant="solid">Action</ui-button></div>
          <div><ui-button size="small" variant="outline">Action</ui-button></div>
          <div><ui-button size="small" variant="ghost">Action</ui-button></div>
          <div><ui-button size="small" variant="destructive">Action</ui-button></div>

          <div class="btn-demo-grid__label">Medium</div>
          <div><ui-button size="medium" variant="solid">Action</ui-button></div>
          <div><ui-button size="medium" variant="outline">Action</ui-button></div>
          <div><ui-button size="medium" variant="ghost">Action</ui-button></div>
          <div><ui-button size="medium" variant="destructive">Action</ui-button></div>

          <div class="btn-demo-grid__label">Large</div>
          <div><ui-button size="large" variant="solid">Action</ui-button></div>
          <div><ui-button size="large" variant="outline">Action</ui-button></div>
          <div><ui-button size="large" variant="ghost">Action</ui-button></div>
          <div><ui-button size="large" variant="destructive">Action</ui-button></div>

          <div class="btn-demo-grid__label">Giant</div>
          <div><ui-button size="xlarge" variant="solid">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="outline">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="ghost">Action</ui-button></div>
          <div><ui-button size="xlarge" variant="destructive">Action</ui-button></div>
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
          <ui-button variant="destructive" disabled>Destructive</ui-button>
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
          <ui-button variant="destructive">
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
          <ui-button variant="destructive">
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
          <ui-button variant="destructive">
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
          <ui-button focusable="false" variant="destructive">Destructive</ui-button>
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
          <ui-button focusable="false" variant="destructive">
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
          <ui-button truncate="120" variant="destructive">Delete all the things forever</ui-button>
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
  },
}
