import type { DemoRoute } from '../header'

export const colorsDemo: DemoRoute = {
  id: 'colors',
  label: 'Colors',
  render: () => `
    <div class="demo-app">

      <!-- Color Palette -->
      <section class="demo-section">
        <h2>Color Palette</h2>

        <div class="swatch-group">
          <h3>Background & Surface</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--window-bg-color); color: var(--window-fg-color);">Aa</div>
              <span class="swatch-label">window-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); color: var(--view-fg-color);">Aa</div>
              <span class="swatch-label">view-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--headerbar-bg-color); color: var(--headerbar-fg-color);">Aa</div>
              <span class="swatch-label">headerbar-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--sidebar-bg-color); color: var(--sidebar-fg-color);">Aa</div>
              <span class="swatch-label">sidebar-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--card-bg-color); color: var(--card-fg-color);">Aa</div>
              <span class="swatch-label">card-bg</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Accent</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--accent-bg-color); color: var(--accent-fg-color);">Aa</div>
              <span class="swatch-label">accent</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--accent-hover-color); color: var(--accent-fg-color);">Aa</div>
              <span class="swatch-label">accent-hover</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--accent-active-color); color: var(--accent-fg-color);">Aa</div>
              <span class="swatch-label">accent-active</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Secondary / Status</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--success-bg-color); color: var(--success-fg-color);">Aa</div>
              <span class="swatch-label">success</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--warning-bg-color); color: var(--warning-fg-color);">Aa</div>
              <span class="swatch-label">warning</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--error-bg-color); color: var(--error-fg-color);">Aa</div>
              <span class="swatch-label">error</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Button States</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--button-bg-color); color: var(--button-fg-color);">Aa</div>
              <span class="swatch-label">default</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--button-hover-bg-color); color: var(--button-fg-color);">Aa</div>
              <span class="swatch-label">hover</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--button-active-bg-color); color: var(--button-fg-color);">Aa</div>
              <span class="swatch-label">active</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--button-disabled-bg-color); color: var(--button-disabled-fg-color);">Aa</div>
              <span class="swatch-label">disabled</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Input</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--input-bg-color); color: var(--input-fg-color);">Aa</div>
              <span class="swatch-label">input-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--input-bg-color); border: 2px solid var(--input-border-color); color: var(--input-fg-color);">Aa</div>
              <span class="swatch-label">input-border</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--input-bg-color); border: 2px solid var(--input-focus-border-color); color: var(--input-fg-color);">Aa</div>
              <span class="swatch-label">input-focus</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Menu / Dropdown</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--menu-bg-color); color: var(--menu-fg-color);">Aa</div>
              <span class="swatch-label">menu-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--menu-hover-bg-color); color: var(--menu-hover-fg-color);">Aa</div>
              <span class="swatch-label">menu-hover</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--menu-bg-color); border-bottom: 2px solid var(--menu-separator-color);">&#8212;</div>
              <span class="swatch-label">separator</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Tooltip</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--tooltip-bg-color); color: var(--tooltip-fg-color);">Aa</div>
              <span class="swatch-label">tooltip</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Dialog / Modal</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--dialog-bg-color); color: var(--dialog-fg-color);">Aa</div>
              <span class="swatch-label">dialog-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--dialog-overlay-color);">&nbsp;</div>
              <span class="swatch-label">overlay</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Tabs</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--tab-active-bg-color); color: var(--tab-active-fg-color);">Aa</div>
              <span class="swatch-label">tab-active</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--tab-inactive-bg-color); color: var(--tab-inactive-fg-color);">Aa</div>
              <span class="swatch-label">tab-inactive</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Toolbar & Statusbar</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--toolbar-bg-color); color: var(--toolbar-fg-color);">Aa</div>
              <span class="swatch-label">toolbar</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--statusbar-bg-color); color: var(--statusbar-fg-color);">Aa</div>
              <span class="swatch-label">statusbar</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Selection & Link</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--selection-bg-color); color: var(--selection-fg-color);">Aa</div>
              <span class="swatch-label">selection</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); color: var(--link-color);">Aa</div>
              <span class="swatch-label">link</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); color: var(--link-hover-color);">Aa</div>
              <span class="swatch-label">link-hover</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); color: var(--link-visited-color);">Aa</div>
              <span class="swatch-label">link-visited</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Switch / Toggle</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--switch-bg-color); color: var(--switch-thumb-color);">&#9679;</div>
              <span class="swatch-label">switch-off</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--switch-active-bg-color); color: var(--switch-thumb-color);">&#9679;</div>
              <span class="swatch-label">switch-on</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Checkbox / Radio</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--checkbox-bg-color); border: 2px solid var(--checkbox-border-color);">&nbsp;</div>
              <span class="swatch-label">unchecked</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--checkbox-checked-bg-color); color: var(--checkbox-check-color); border: 2px solid var(--checkbox-border-color);">&#10003;</div>
              <span class="swatch-label">checked</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Slider / Range</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--slider-track-bg-color);">&nbsp;</div>
              <span class="swatch-label">track</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--slider-fill-color);">&nbsp;</div>
              <span class="swatch-label">fill</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--slider-thumb-bg-color); border: 2px solid var(--border-color);">&nbsp;</div>
              <span class="swatch-label">thumb</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Progress Bar</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--progress-bg-color);">&nbsp;</div>
              <span class="swatch-label">progress-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--progress-fill-color);">&nbsp;</div>
              <span class="swatch-label">progress-fill</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Focus Ring & Separator</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset);">Aa</div>
              <span class="swatch-label">focus-ring</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); border-bottom: 2px solid var(--separator-color);">&nbsp;</div>
              <span class="swatch-label">separator</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Popover</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--popover-bg-color); color: var(--popover-fg-color); border: 1px solid var(--popover-border-color);">Aa</div>
              <span class="swatch-label">popover</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Scrollbar</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--scrollbar-bg-color); border: 1px solid var(--border-color);">&nbsp;</div>
              <span class="swatch-label">scrollbar-bg</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--scrollbar-thumb-color);">&nbsp;</div>
              <span class="swatch-label">thumb</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--scrollbar-thumb-hover-color);">&nbsp;</div>
              <span class="swatch-label">thumb-hover</span>
            </div>
          </div>
        </div>

        <div class="swatch-group">
          <h3>Borders & Shadows</h3>
          <div class="swatch-row">
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); border: 2px solid var(--border-color);">&nbsp;</div>
              <span class="swatch-label">border</span>
            </div>
            <div class="swatch">
              <div class="swatch-color" style="background: var(--view-bg-color); box-shadow: 0 4px 12px var(--shadow-color);">&nbsp;</div>
              <span class="swatch-label">shadow</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="demo-section">
        <h2>Typography</h2>

        <div class="type-sample">
          <h1>Heading 1 — The quick brown fox</h1>
          <div class="meta">--font-heading / --font-size-3xl / --font-weight-bold</div>
        </div>
        <div class="type-sample">
          <h2>Heading 2 — The quick brown fox</h2>
          <div class="meta">--font-heading / --font-size-2xl / --font-weight-bold</div>
        </div>
        <div class="type-sample">
          <h3>Heading 3 — The quick brown fox</h3>
          <div class="meta">--font-heading / --font-size-xl / --font-weight-bold</div>
        </div>
        <div class="type-sample">
          <p>Body text — The quick brown fox jumps over the lazy dog. 0123456789</p>
          <div class="meta">--font-sans / --font-size-md / --font-weight-regular</div>
        </div>
        <div class="type-sample">
          <p style="font-size: var(--font-size-sm);">Small text — The quick brown fox jumps over the lazy dog.</p>
          <div class="meta">--font-sans / --font-size-sm</div>
        </div>
        <div class="type-sample">
          <code>const theme = 'gtk4-light'; // monospace sample</code>
          <div class="meta">--font-mono / --font-size-sm</div>
        </div>
      </section>

      <!-- Cards -->
      <section class="demo-section">
        <h2>Cards</h2>
        <div class="card-grid">
          <div class="card">
            <h3>Card Title</h3>
            <p>This is a sample card using --card-bg-color and --card-fg-color with a shadow from --shadow-color.</p>
          </div>
          <div class="card">
            <h3>Another Card</h3>
            <p>Cards adapt their background, text color, border and shadow automatically when the theme changes.</p>
          </div>
          <div class="card">
            <h3>Third Card</h3>
            <p>Each theme provides a consistent visual identity through shared CSS variables.</p>
          </div>
        </div>
      </section>

      <!-- Inputs -->
      <section class="demo-section">
        <h2>Inputs</h2>
        <div class="input-demo">
          <input type="text" placeholder="Text input placeholder..." />
          <input type="text" value="Filled input value" />
          <textarea rows="3" placeholder="Textarea placeholder..."></textarea>
        </div>
      </section>

      <!-- Status Badges -->
      <section class="demo-section">
        <h2>Status Badges</h2>
        <div class="badge-row">
          <span class="badge badge-success">Success</span>
          <span class="badge badge-warning">Warning</span>
          <span class="badge badge-error">Error</span>
        </div>
      </section>

      <!-- Layout Demo -->
      <section class="demo-section">
        <h2>Layout (Sidebar + View)</h2>
        <div class="layout-demo">
          <div class="layout-sidebar">
            <ul>
              <li class="active">Dashboard</li>
              <li>Settings</li>
              <li>Files</li>
              <li>Help</li>
            </ul>
          </div>
          <div class="layout-main">
            <h3>Main Content Area</h3>
            <p style="margin-top: 8px;">This area uses --view-bg-color and --view-fg-color.</p>
          </div>
        </div>
      </section>

    </div>
  `,
}
