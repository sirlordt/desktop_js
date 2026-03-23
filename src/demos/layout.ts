import '../components/ui-button/ui-button'
import type { DemoRoute } from '../header'

export const layoutDemo: DemoRoute = {
  id: 'layout',
  label: 'Layout',
  render: () => `
    <div class="demo-app">

      <!-- Size Presets -->
      <section class="demo-section">
        <h2>Size Presets</h2>
        <p class="btn-demo-hint" style="margin-bottom: 12px;">Each size preset defines a default height. Width adapts to content unless explicitly set.</p>
        <div class="btn-demo-row btn-demo-row--align-end">
          <ui-button size="tiny">Tiny (24px)</ui-button>
          <ui-button size="small">Small (28px)</ui-button>
          <ui-button size="medium">Medium (32px)</ui-button>
          <ui-button size="large">Large (40px)</ui-button>
          <ui-button size="xlarge">XLarge (48px)</ui-button>
        </div>
      </section>

      <!-- Custom Size -->
      <section class="demo-section">
        <h2>Custom Size</h2>
        <div class="btn-demo-row btn-demo-row--align-end">
          <ui-button size="custom" width="200" height="50">200 x 50</ui-button>
          <ui-button size="custom" width="120" height="120" variant="outline">120 x 120</ui-button>
          <ui-button size="custom" width="300" height="36">300 x 36</ui-button>
        </div>
      </section>

      <!-- Absolute Positioning -->
      <section class="demo-section">
        <h2>Absolute Positioning</h2>
        <p class="btn-demo-hint" style="margin-bottom: 12px;">Buttons positioned absolutely within the container, like a desktop window.</p>
        <div class="layout-container" style="position: relative; height: 200px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--view-bg-color);">
          <ui-button position="absolute" left="20" top="20" size="medium">OK</ui-button>
          <ui-button position="absolute" left="120" top="20" size="medium" variant="outline">Cancel</ui-button>
          <ui-button position="absolute" left="20" top="80" size="custom" width="220" height="32" variant="ghost">position="absolute" left="20" top="80"</ui-button>
          <ui-button position="absolute" left="20" top="140" size="small" variant="destructive">
            <svg slot="icon-left" viewBox="0 0 16 16" fill="currentColor"><path d="M5 1V0h6v1h4v2H1V1h4zM2 4h12l-1 12H3L2 4z"/></svg>
            Delete
          </ui-button>
        </div>
      </section>

      <!-- Relative Positioning -->
      <section class="demo-section">
        <h2>Relative Positioning</h2>
        <p class="btn-demo-hint" style="margin-bottom: 12px;">Buttons offset from their normal flow position.</p>
        <div class="btn-demo-row">
          <ui-button>Normal</ui-button>
          <ui-button position="relative" left="10" top="-5" variant="outline">Offset (10, -5)</ui-button>
          <ui-button>Normal</ui-button>
          <ui-button position="relative" left="0" top="10" variant="ghost">Offset (0, 10)</ui-button>
        </div>
      </section>

      <!-- Fluid with explicit width -->
      <section class="demo-section">
        <h2>Fluid with Width</h2>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <ui-button size="custom" width="100%" height="36">width="100%"</ui-button>
          <ui-button size="custom" width="50%" height="36" variant="outline">width="50%"</ui-button>
          <ui-button size="custom" width="300" height="36" variant="ghost">width="300"</ui-button>
        </div>
      </section>

    </div>
  `,
}
