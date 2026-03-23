# Feature: scheme_color_theme_colors

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
A new color scheme is required for the desktop application's color theme. This color scheme must be consistent with the brand's visual identity and provide a pleasant and accessible user experience. The new color scheme must include a primary color palette, secondary colors, and accent colors to be used throughout the application. Additionally, the color scheme must be adaptable to different display modes, such as dark mode and light mode, to ensure an optimal user experience under all lighting conditions. The new color scheme must be implemented across all parts of the application, including the user interface, icons, and graphic elements, to ensure a coherent and professional appearance throughout the desktop application.

## Acceptance criteria
- [ ] The primary color palette, secondary colors, and accent colors for the new color scheme must be defined.
- [ ] The new color scheme must be consistent with the brand's visual identity.
- [ ] The new color scheme must provide a pleasant user experience.
- [ ] There must be 2 color schemes adaptable to different display modes (dark mode and light mode).
- [ ] The new color scheme must be implemented across all parts of the application, including the user interface, icons, and graphic elements.
- [ ] Multiple themes are available, including GTK4 and WIN95. Using the same CSS variables, each theme has a different color scheme but shares the same CSS variables, so that theme switching is smooth and seamless. In both light and dark schemes, the same CSS variables must be used but with different values for each theme, to ensure a coherent and fluid user experience when switching between themes.
- [ ] System fonts must be defined as part of the theme. Each theme must specify its own fonts (family, size, weight, etc.) using CSS variables, so that switching themes also updates the fonts consistently.

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
