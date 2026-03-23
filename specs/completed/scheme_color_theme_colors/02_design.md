# Design: scheme_color_theme_colors

## Technical decisions

- **CSS custom properties** on `:root` are used for all color, typography, and component values.
- Each theme (GTK4, WIN95) defines its own variables with the **same names**, allowing theme switching without modifying components.
- Light/dark modes are implemented via classes on `<html>`: `data-theme="gtk4-light"`, `data-theme="gtk4-dark"`, `data-theme="win95-light"`, `data-theme="win95-dark"`.
- `prefers-color-scheme` is avoided as the primary mechanism to allow explicit user control.
- **WIN95 secondary colors strategy:** In WIN95 themes, secondary colors (success, warning, error) use a neutral system background (`--button-bg-color`) instead of colored surfaces. The color is applied to the **foreground (text/icons)** only, matching the original WIN95 aesthetic where colored backgrounds were never used on buttons or surfaces — color appeared only on icons and labels.

---

## 1. Color Variables (CSS)

### 1.1 GTK4 Theme — Light (Adwaita Light)

```css
[data-theme="gtk4-light"] {
  /* Background and Surface */
  --window-bg-color: #f6f5f4;
  --window-fg-color: #2e3436;
  --view-bg-color: #ffffff;
  --view-fg-color: #000000;
  --headerbar-bg-color: #ebebeb;
  --headerbar-fg-color: #2e3436;
  --sidebar-bg-color: #f0f0ef;
  --sidebar-fg-color: #2e3436;
  --card-bg-color: #ffffff;
  --card-fg-color: #2e3436;

  /* Accent Colors (GTK Blue) */
  --accent-bg-color: #3584e4;
  --accent-fg-color: #ffffff;
  --accent-hover-color: #2a76d6;
  --accent-active-color: #1e68c8;

  /* Secondary Colors */
  --success-bg-color: #33d17a;
  --success-fg-color: #ffffff;
  --warning-bg-color: #f5c211;
  --warning-fg-color: #000000;
  --error-bg-color: #e01b24;
  --error-fg-color: #ffffff;

  /* Button / UI States */
  --button-bg-color: #eeeeec;
  --button-fg-color: #2e3436;
  --button-hover-bg-color: #e5e5e2;
  --button-active-bg-color: #d6d6d1;
  --button-disabled-bg-color: #f6f5f4;
  --button-disabled-fg-color: #929595;

  /* Input / Forms */
  --input-bg-color: #ffffff;
  --input-fg-color: #2e3436;
  --input-border-color: rgba(0, 0, 0, 0.18);
  --input-focus-border-color: #3584e4;
  --input-placeholder-color: #929595;

  /* Borders and Shadows */
  --border-color: rgba(0, 0, 0, 0.15);
  --shadow-color: rgba(0, 0, 0, 0.1);

  /* Scrollbar */
  --scrollbar-bg-color: transparent;
  --scrollbar-thumb-color: rgba(0, 0, 0, 0.25);
  --scrollbar-thumb-hover-color: rgba(0, 0, 0, 0.4);
}
```

### 1.2 GTK4 Theme — Dark (Adwaita Dark)

```css
[data-theme="gtk4-dark"] {
  /* Background and Surface */
  --window-bg-color: #242424;
  --window-fg-color: #ffffff;
  --view-bg-color: #1e1e1e;
  --view-fg-color: #ffffff;
  --headerbar-bg-color: #303030;
  --headerbar-fg-color: #ffffff;
  --sidebar-bg-color: #2a2a2a;
  --sidebar-fg-color: #ffffff;
  --card-bg-color: #303030;
  --card-fg-color: #ffffff;

  /* Accent Colors (GTK Blue) */
  --accent-bg-color: #3584e4;
  --accent-fg-color: #ffffff;
  --accent-hover-color: #4a91e8;
  --accent-active-color: #2a76d6;

  /* Secondary Colors */
  --success-bg-color: #33d17a;
  --success-fg-color: #ffffff;
  --warning-bg-color: #f5c211;
  --warning-fg-color: #000000;
  --error-bg-color: #e01b24;
  --error-fg-color: #ffffff;

  /* Button / UI States */
  --button-bg-color: #303030;
  --button-fg-color: #ffffff;
  --button-hover-bg-color: #3a3a3a;
  --button-active-bg-color: #262626;
  --button-disabled-bg-color: #242424;
  --button-disabled-fg-color: #6e6e6e;

  /* Input / Forms */
  --input-bg-color: #1e1e1e;
  --input-fg-color: #ffffff;
  --input-border-color: rgba(255, 255, 255, 0.12);
  --input-focus-border-color: #3584e4;
  --input-placeholder-color: #6e6e6e;

  /* Borders and Shadows */
  --border-color: rgba(255, 255, 255, 0.1);
  --shadow-color: rgba(0, 0, 0, 0.4);

  /* Scrollbar */
  --scrollbar-bg-color: transparent;
  --scrollbar-thumb-color: rgba(255, 255, 255, 0.2);
  --scrollbar-thumb-hover-color: rgba(255, 255, 255, 0.35);
}
```

### 1.3 WIN95 Theme — Light

```css
[data-theme="win95-light"] {
  /* Background and Surface */
  --window-bg-color: #c0c0c0;
  --window-fg-color: #000000;
  --view-bg-color: #ffffff;
  --view-fg-color: #000000;
  --headerbar-bg-color: #000080;
  --headerbar-fg-color: #ffffff;
  --sidebar-bg-color: #c0c0c0;
  --sidebar-fg-color: #000000;
  --card-bg-color: #c0c0c0;
  --card-fg-color: #000000;

  /* Accent Colors (Classic Blue) */
  --accent-bg-color: #000080;
  --accent-fg-color: #ffffff;
  --accent-hover-color: #0000a0;
  --accent-active-color: #000060;

  /* Secondary Colors (neutral bg, color on text/icons only) */
  --success-bg-color: #c0c0c0;
  --success-fg-color: #008000;
  --warning-bg-color: #c0c0c0;
  --warning-fg-color: #808000;
  --error-bg-color: #c0c0c0;
  --error-fg-color: #ff0000;

  /* Button / UI States */
  --button-bg-color: #c0c0c0;
  --button-fg-color: #000000;
  --button-hover-bg-color: #d0d0d0;
  --button-active-bg-color: #a0a0a0;
  --button-disabled-bg-color: #c0c0c0;
  --button-disabled-fg-color: #808080;

  /* Input / Forms */
  --input-bg-color: #ffffff;
  --input-fg-color: #000000;
  --input-border-color: #808080;
  --input-focus-border-color: #000080;
  --input-placeholder-color: #808080;

  /* Borders and Shadows (classic 3D effect) */
  --border-color: #808080;
  --border-light-color: #ffffff;
  --border-dark-color: #404040;
  --shadow-color: rgba(0, 0, 0, 0.3);

  /* Scrollbar */
  --scrollbar-bg-color: #c0c0c0;
  --scrollbar-thumb-color: #808080;
  --scrollbar-thumb-hover-color: #606060;
}
```

### 1.4 WIN95 Theme — Dark

```css
[data-theme="win95-dark"] {
  /* Background and Surface */
  --window-bg-color: #2c2c2c;
  --window-fg-color: #c0c0c0;
  --view-bg-color: #1a1a1a;
  --view-fg-color: #c0c0c0;
  --headerbar-bg-color: #000060;
  --headerbar-fg-color: #ffffff;
  --sidebar-bg-color: #333333;
  --sidebar-fg-color: #c0c0c0;
  --card-bg-color: #383838;
  --card-fg-color: #c0c0c0;

  /* Accent Colors (Classic Blue) */
  --accent-bg-color: #1a1aaa;
  --accent-fg-color: #ffffff;
  --accent-hover-color: #2a2ac0;
  --accent-active-color: #000080;

  /* Secondary Colors (neutral bg, color on text/icons only) */
  --success-bg-color: #484848;
  --success-fg-color: #33d17a;
  --warning-bg-color: #484848;
  --warning-fg-color: #cccc00;
  --error-bg-color: #484848;
  --error-fg-color: #ff4444;

  /* Button / UI States */
  --button-bg-color: #484848;
  --button-fg-color: #c0c0c0;
  --button-hover-bg-color: #555555;
  --button-active-bg-color: #3a3a3a;
  --button-disabled-bg-color: #2c2c2c;
  --button-disabled-fg-color: #606060;

  /* Input / Forms */
  --input-bg-color: #1a1a1a;
  --input-fg-color: #c0c0c0;
  --input-border-color: #555555;
  --input-focus-border-color: #1a1aaa;
  --input-placeholder-color: #606060;

  /* Borders and Shadows (classic 3D dark effect) */
  --border-color: #555555;
  --border-light-color: #6a6a6a;
  --border-dark-color: #1a1a1a;
  --shadow-color: rgba(0, 0, 0, 0.5);

  /* Scrollbar */
  --scrollbar-bg-color: #2c2c2c;
  --scrollbar-thumb-color: #555555;
  --scrollbar-thumb-hover-color: #6a6a6a;
}
```

---

## 2. Typography

### 2.1 GTK4 Theme

```css
[data-theme="gtk4-light"],
[data-theme="gtk4-dark"] {
  /* Font Families */
  --font-sans: 'Cantarell', 'Noto Sans', system-ui, sans-serif;
  --font-heading: 'Cantarell', 'Noto Sans', system-ui, sans-serif;
  --font-mono: 'Source Code Pro', 'Noto Sans Mono', ui-monospace, monospace;

  /* Base Sizes */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;

  /* Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.65;

  /* Letter Spacing */
  --letter-spacing-tight: -0.5px;
  --letter-spacing-normal: 0px;
  --letter-spacing-wide: 0.5px;
}
```

### 2.2 WIN95 Theme

```css
[data-theme="win95-light"],
[data-theme="win95-dark"] {
  /* Font Families */
  --font-sans: 'MS Sans Serif', 'Microsoft Sans Serif', 'Tahoma', 'Arial', sans-serif;
  --font-heading: 'MS Sans Serif', 'Microsoft Sans Serif', 'Tahoma', 'Arial', sans-serif;
  --font-mono: 'Fixedsys', 'Courier New', 'Consolas', monospace;

  /* Base Sizes */
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-md: 12px;
  --font-size-lg: 14px;
  --font-size-xl: 18px;
  --font-size-2xl: 22px;
  --font-size-3xl: 28px;

  /* Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 400;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.1;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.6;

  /* Letter Spacing */
  --letter-spacing-tight: 0px;
  --letter-spacing-normal: 0.2px;
  --letter-spacing-wide: 0.5px;
}
```

---

## 3. Button Methodology (UI Button Specs)

Buttons are organized by **Size (Columns)** and **State (Rows)**, using the same CSS variables across both themes.

### 3.1 Sizes

| Name | Padding | Font Size | Border Radius (GTK4) | Border Radius (WIN95) |
| :--- | :--- | :--- | :--- | :--- |
| **Tiny** | `var(--btn-padding-tiny)` 4px 8px | `var(--font-size-xs)` | 4px | 0px |
| **Small** | `var(--btn-padding-small)` 6px 12px | `var(--font-size-sm)` | 5px | 0px |
| **Medium** | `var(--btn-padding-medium)` 8px 16px | `var(--font-size-md)` | 6px | 0px |
| **Large** | `var(--btn-padding-large)` 10px 20px | `var(--font-size-lg)` | 8px | 0px |
| **Giant** | `var(--btn-padding-giant)` 12px 24px | `var(--font-size-xl)` | 10px | 0px |

> **Note:** WIN95 uses `border-radius: 0px` on all sizes to respect the classic square aesthetic.

### 3.2 Button Variables per Theme

```css
/* GTK4 */
[data-theme="gtk4-light"],
[data-theme="gtk4-dark"] {
  --btn-border-radius-tiny: 4px;
  --btn-border-radius-small: 5px;
  --btn-border-radius-medium: 6px;
  --btn-border-radius-large: 8px;
  --btn-border-radius-giant: 10px;
  --btn-border-width: 1px;
  --btn-border-style: solid;
  --btn-focus-ring-width: 2px;
  --btn-focus-ring-offset: 2px;
  --btn-transition: all 150ms ease-in-out;
}

/* WIN95 */
[data-theme="win95-light"],
[data-theme="win95-dark"] {
  --btn-border-radius-tiny: 0px;
  --btn-border-radius-small: 0px;
  --btn-border-radius-medium: 0px;
  --btn-border-radius-large: 0px;
  --btn-border-radius-giant: 0px;
  --btn-border-width: 2px;
  --btn-border-style: outset;
  --btn-focus-ring-width: 1px;
  --btn-focus-ring-offset: -4px;
  --btn-transition: none;
}
```

### 3.3 States

| State | Description | Main Property |
| :--- | :--- | :--- |
| **Default** | Base state | `--button-bg-color`, `--button-fg-color` |
| **Hover** | Mouse over | `--button-hover-bg-color` |
| **Focus** | Keyboard focus | Ring using `--accent-bg-color` with `--btn-focus-ring-width` |
| **Press (Active)** | Sustained click | `--button-active-bg-color` |
| **Disabled** | Disabled | `--button-disabled-bg-color`, `--button-disabled-fg-color`, `opacity: 0.6`, `pointer-events: none` |

### 3.4 Style Variations

| Variation | Default | Hover | Notes |
| :--- | :--- | :--- | :--- |
| **Solid (Primary)** | `--accent-bg-color` + `--accent-fg-color` | `--accent-hover-color` | Main action button |
| **Outline** | Border `1px solid --accent-bg-color`, transparent background | Background fills with `--accent-bg-color` | Secondary action |
| **Ghost** | No background or border | Subtle `--button-hover-bg-color` background | Tertiary action / toolbar |
| **Destructive** | `--error-bg-color` + `--error-fg-color` | Darkened `--error-bg-color` | Dangerous actions. GTK4: colored bg + white text. WIN95: neutral bg + colored text |

---

## 4. Shared Variables Summary

All variables that **must exist in every theme** to ensure compatibility:

| Category | Variables |
| :--- | :--- |
| **Background/Surface** | `--window-bg-color`, `--window-fg-color`, `--view-bg-color`, `--view-fg-color`, `--headerbar-bg-color`, `--headerbar-fg-color`, `--sidebar-bg-color`, `--sidebar-fg-color`, `--card-bg-color`, `--card-fg-color` |
| **Accent** | `--accent-bg-color`, `--accent-fg-color`, `--accent-hover-color`, `--accent-active-color` |
| **Secondary** | `--success-bg-color`, `--success-fg-color`, `--warning-bg-color`, `--warning-fg-color`, `--error-bg-color`, `--error-fg-color` |
| **Buttons** | `--button-bg-color`, `--button-fg-color`, `--button-hover-bg-color`, `--button-active-bg-color`, `--button-disabled-bg-color`, `--button-disabled-fg-color` |
| **Input** | `--input-bg-color`, `--input-fg-color`, `--input-border-color`, `--input-focus-border-color`, `--input-placeholder-color` |
| **Menu/Dropdown** | `--menu-bg-color`, `--menu-fg-color`, `--menu-hover-bg-color`, `--menu-hover-fg-color`, `--menu-separator-color`, `--menu-border-color` |
| **Tooltip** | `--tooltip-bg-color`, `--tooltip-fg-color` |
| **Dialog/Modal** | `--dialog-bg-color`, `--dialog-fg-color`, `--dialog-overlay-color` |
| **Tabs** | `--tab-active-bg-color`, `--tab-active-fg-color`, `--tab-inactive-bg-color`, `--tab-inactive-fg-color`, `--tab-border-color` |
| **Toolbar** | `--toolbar-bg-color`, `--toolbar-fg-color` |
| **Statusbar** | `--statusbar-bg-color`, `--statusbar-fg-color` |
| **Selection** | `--selection-bg-color`, `--selection-fg-color` |
| **Link** | `--link-color`, `--link-hover-color`, `--link-visited-color` |
| **Switch/Toggle** | `--switch-bg-color`, `--switch-active-bg-color`, `--switch-thumb-color` |
| **Checkbox/Radio** | `--checkbox-bg-color`, `--checkbox-checked-bg-color`, `--checkbox-check-color`, `--checkbox-border-color` |
| **Slider/Range** | `--slider-track-bg-color`, `--slider-thumb-bg-color`, `--slider-fill-color` |
| **Progress Bar** | `--progress-bg-color`, `--progress-fill-color` |
| **Focus Ring** | `--focus-ring-color`, `--focus-ring-width`, `--focus-ring-offset` |
| **Separator/Divider** | `--separator-color` |
| **Popover** | `--popover-bg-color`, `--popover-fg-color`, `--popover-border-color` |
| **Borders/Shadows** | `--border-color`, `--shadow-color` |
| **Scrollbar** | `--scrollbar-bg-color`, `--scrollbar-thumb-color`, `--scrollbar-thumb-hover-color` |
| **Typography** | `--font-sans`, `--font-heading`, `--font-mono`, `--font-size-xs` to `--font-size-3xl`, `--font-weight-regular`, `--font-weight-medium`, `--font-weight-bold`, `--line-height-*`, `--letter-spacing-*` |
| **Button Shape** | `--btn-border-radius-*`, `--btn-border-width`, `--btn-border-style`, `--btn-focus-ring-width`, `--btn-focus-ring-offset`, `--btn-transition` |

---

## File structure

| File | Action | Description |
|------|--------|-------------|
| `src/themes/gtk4-light.css` | create | GTK4 light theme variables |
| `src/themes/gtk4-dark.css` | create | GTK4 dark theme variables |
| `src/themes/win95-light.css` | create | WIN95 light theme variables |
| `src/themes/win95-dark.css` | create | WIN95 dark theme variables |
| `src/themes/index.css` | create | Central import for all themes |
| `src/components/button.css` | create | Button styles using theme variables |
| `src/style.css` | modify | Replace hardcoded variables with theme system imports |

## Discarded alternatives

- **`prefers-color-scheme` as primary mechanism:** Discarded because it does not allow the user to choose a theme independently from the operating system.
- **Separate variables per component instead of global:** Discarded due to duplication and difficulty in achieving smooth theme switching.
- **CSS-in-JS (styled-components, etc.):** Discarded to keep themes as pure CSS, portable and without JS runtime dependency.
