---
description: Project overview, build commands, file structure, and architecture layers
paths: ["*"]
---

# Desktop.js — Project Overview

Desktop.js is a web component library that implements desktop UI primitives (windows, popups, menus, panels, scrollbars, hints) using a custom layout engine (`UIView`) and Web Components. The architecture follows a layered pattern:

```
Types (types.ts) → UIView (layout engine) → UIPanelWC (base WC) → Specialized WCs (WindowManager, Window, Popup, etc.)
```

## Build & Dev

- `npx vite` — start dev server (default port 5173)
- `npx tsc --noEmit` — type-check (some pre-existing errors in test files are known)
- `npx vitest` — run tests
- Demos are registered in `src/main.ts` and accessible via hash routes (e.g., `#popups-wc`)

## File Structure

- `src/components/common/types.ts` — All shared types, interfaces, and enums
- `src/components/common/ui-view.ts` — Layout engine core (dimensions, positioning, alignment, anchors)
- `src/components/ui-panel-wc/` — Base web component with UIView integration
- `src/components/ui-window-manager-wc/` — Window manager (contains UIWindowWC children)
- `src/components/ui-window-wc/` — Individual window component
- `src/components/ui-popup-wc/` — Popup/menu component
- `src/components/ui-menu-item-wc/` — Menu item component
- `src/demos/` — Demo pages for each component
- `src/style.css` — Global styles and demo layout (`.demo-app` container)
