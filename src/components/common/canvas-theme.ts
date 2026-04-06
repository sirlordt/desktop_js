/**
 * Centralized theme registry for Konva/canvas-based components.
 *
 * Colors:
 *   import { canvasTheme, onCanvasThemeChange } from '../common/canvas-theme'
 *   const colors = canvasTheme()
 *   const unsub = onCanvasThemeChange((colors) => { ... })
 *
 * Painters:
 *   import { registerPainter, getPainter } from '../common/canvas-theme'
 *   registerPainter('GTK4_ScrollbarPainter', new GtkScrollbarPainter())
 *   const painter = getPainter<ScrollbarPainter>('ScrollbarPainter')
 */

// ── Colors ──

export interface CanvasColors {
  trackFill: string
  trackStroke: string
  thumbFill: string
  thumbHoverFill: string
  thumbDragFill: string
  thumbPulseFill: string
  buttonFill: string
  buttonHoverFill: string
  buttonArrowStroke: string
  cornerFill: string
}

const THEMES: Record<string, CanvasColors> = {
  'gtk4-light': {
    trackFill: '#e8e8e8',
    trackStroke: '#d0d0d0',
    thumbFill: '#a0a0a0',
    thumbHoverFill: '#888888',
    thumbDragFill: '#666666',
    thumbPulseFill: '#888888',
    buttonFill: '#e0e0e0',
    buttonHoverFill: '#c8c8c8',
    buttonArrowStroke: '#555555',
    cornerFill: '#e0e0e0',
  },
  'gtk4-dark': {
    trackFill: '#2a2a2a',
    trackStroke: '#383838',
    thumbFill: '#666666',
    thumbHoverFill: '#888888',
    thumbDragFill: '#aaaaaa',
    thumbPulseFill: '#888888',
    buttonFill: '#333333',
    buttonHoverFill: '#444444',
    buttonArrowStroke: '#cccccc',
    cornerFill: '#333333',
  },
  'win95-light': {
    trackFill: '#e0e0e0',
    trackStroke: '#c8c8c8',
    thumbFill: '#c0c0c0',
    thumbHoverFill: '#c0c0c0',
    thumbDragFill: '#c0c0c0',
    thumbPulseFill: '#a0a0a0',
    buttonFill: '#c0c0c0',
    buttonHoverFill: '#c0c0c0',
    buttonArrowStroke: '#000000',
    cornerFill: '#c0c0c0',
  },
  'win95-dark': {
    trackFill: '#a0a0a0',
    trackStroke: '#909090',
    thumbFill: '#909090',
    thumbHoverFill: '#909090',
    thumbDragFill: '#909090',
    thumbPulseFill: '#707070',
    buttonFill: '#909090',
    buttonHoverFill: '#909090',
    buttonArrowStroke: '#1a1a1a',
    cornerFill: '#909090',
  },
}

const DEFAULT_THEME = 'gtk4-light'

type ThemeListener = (colors: CanvasColors) => void
const listeners = new Set<ThemeListener>()
let observer: MutationObserver | null = null

export function getActiveThemeName(): string {
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME
}

/** Register a new color theme or override an existing one */
export function registerCanvasTheme(name: string, colors: CanvasColors): void {
  THEMES[name] = colors
}

/** Get the current resolved colors (base theme + optional overrides) */
export function canvasTheme(overrides?: Partial<CanvasColors>): CanvasColors {
  const name = getActiveThemeName()
  const base = THEMES[name] || THEMES[DEFAULT_THEME]
  return overrides ? { ...base, ...overrides } : { ...base }
}

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function onCanvasThemeChange(fn: ThemeListener): () => void {
  listeners.add(fn)
  ensureObserver()
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) stopObserver()
  }
}

function ensureObserver(): void {
  if (observer) return
  observer = new MutationObserver(() => {
    const colors = canvasTheme()
    for (const fn of listeners) fn(colors)
  })
  observer.observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  })
}

function stopObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// ── Painter Registry ──
//
// Keys follow the convention: "{ThemeFamily}_{Component}Painter"
// e.g. "GTK4_ScrollbarPainter", "WIN95_ScrollbarPainter"
//
// Theme families map from data-theme values:
//   "gtk4-light" | "gtk4-dark"  →  "GTK4"
//   "win95-light" | "win95-dark" →  "WIN95"

const THEME_FAMILY: Record<string, string> = {
  'gtk4-light': 'GTK4',
  'gtk4-dark': 'GTK4',
  'win95-light': 'WIN95',
  'win95-dark': 'WIN95',
}

const painters = new Map<string, unknown>()

/** Register a painter. Key: "{Family}_{Component}Painter" e.g. "GTK4_ScrollbarPainter" */
export function registerPainter(key: string, painter: unknown): void {
  painters.set(key, painter)
}

/** Get the painter for a component type based on the active theme.
 *  @param componentPainterName — e.g. "ScrollbarPainter"
 *  @returns the painter registered for the active theme family, or undefined
 */
export function getPainter<T>(componentPainterName: string): T | undefined {
  const themeName = getActiveThemeName()
  const family = THEME_FAMILY[themeName] || 'GTK4'
  const key = `${family}_${componentPainterName}`
  return painters.get(key) as T | undefined
}

/** Register a theme family mapping (e.g. "my-theme" → "MyFamily") */
export function registerThemeFamily(themeName: string, family: string): void {
  THEME_FAMILY[themeName] = family
}
