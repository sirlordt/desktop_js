export const DimensionKind = {
  Set: 'set',
  Dynamic: 'dynamic',
  Auto: 'auto',
} as const
export type DimensionKind = typeof DimensionKind[keyof typeof DimensionKind]

export interface DimensionProp {
  kind: DimensionKind
  value: number
}

export const Align = {
  None: 'none',
  Left: 'left',
  Top: 'top',
  Right: 'right',
  Bottom: 'bottom',
  Center: 'center',
  Client: 'client',
} as const
export type Align = typeof Align[keyof typeof Align]

export interface Anchors {
  toLeft: boolean
  toTop: boolean
  toRight: boolean
  toBottom: boolean
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export const UISize = {
  Tiny: 'tiny',
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
  XLarge: 'xlarge',
  Custom: 'custom',
} as const
export type UISize = typeof UISize[keyof typeof UISize]

export const UIPosition = {
  Fluid: 'fluid',
  Relative: 'relative',
  Absolute: 'absolute',
  Fixed: 'fixed',
} as const
export type UIPosition = typeof UIPosition[keyof typeof UIPosition]

// ── MenuItem types ──

export const MenuItemSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const
export type MenuItemSize = typeof MenuItemSize[keyof typeof MenuItemSize]

export const MenuItemTextAlign = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const
export type MenuItemTextAlign = typeof MenuItemTextAlign[keyof typeof MenuItemTextAlign]

export interface UIMenuItemOptions {
  text: string
  size?: MenuItemSize
  textAlign?: MenuItemTextAlign
  shortcut?: string
  margin?: number
  iconGap?: number
  leftElement?: HTMLElement | null
  rightElement?: HTMLElement | null
  centerElement?: HTMLElement | null
  pushable?: boolean
  pushedElement?: HTMLElement | null
  pushed?: boolean
  disabled?: boolean
  requestParentClose?: boolean
  className?: string
  /** Sub-menu popup to show when this item is activated */
  subMenu?: HTMLElement | null
  /** Alignment override for the sub-menu. Default: 'RightTop' */
  subMenuAlignment?: HintAlignment
}

// ── Popup types ──

export const PopupArrange = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
  None: 'none',
} as const
export type PopupArrange = typeof PopupArrange[keyof typeof PopupArrange]

export const PopupState = {
  Closed: 'closed',
  Attached: 'attached',
  Detached: 'detached',
} as const
export type PopupState = typeof PopupState[keyof typeof PopupState]

export type PopupKind = 'menu' | 'container'

/** How detached popups behave on page scroll */
export type DetachedScrollBehavior = 'fixed' | 'follow'

export interface UIPopupOptions {
  anchor: HTMLElement
  kind?: PopupKind
  alignment?: HintAlignment
  margin?: number
  scroll?: ScrollMode
  arrange?: PopupArrange
  width?: number | 'auto'
  height?: number | 'auto'
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  detachable?: boolean
  title?: string
  closeOnClickOutside?: boolean
  closeOnEscape?: boolean
  detachedScroll?: DetachedScrollBehavior
  className?: string
  parentRef?: HTMLElement | null
}

// ── Hint types ──

export const HintAlignment = {
  BottomLeft: 'BottomLeft',
  BottomCenter: 'BottomCenter',
  BottomRight: 'BottomRight',
  RightTop: 'RightTop',
  RightCenter: 'RightCenter',
  RightBottom: 'RightBottom',
  TopLeft: 'TopLeft',
  TopCenter: 'TopCenter',
  TopRight: 'TopRight',
  LeftTop: 'LeftTop',
  LeftCenter: 'LeftCenter',
  LeftBottom: 'LeftBottom',
  MouseCursor: 'MouseCursor',
} as const
export type HintAlignment = typeof HintAlignment[keyof typeof HintAlignment]

export const HintTrigger = {
  Hover: 'hover',
  Click: 'click',
  Programmatic: 'programmatic',
} as const
export type HintTrigger = typeof HintTrigger[keyof typeof HintTrigger]

export const HintAnimation = {
  Fade: 'fade',
  None: 'none',
} as const
export type HintAnimation = typeof HintAnimation[keyof typeof HintAnimation]

export interface UIHintOptions {
  anchor: HTMLElement
  alignment?: HintAlignment
  margin?: number
  content?: HTMLElement | string
  trigger?: HintTrigger | HintTrigger[]
  showDelay?: number
  hideDelay?: number
  animation?: HintAnimation
  animationDuration?: number
  arrow?: boolean
  arrowSize?: number
  marginMouseCursorX?: number
  marginMouseCursorY?: number
  borderRadius?: number
  borderColor?: string
  borderWidth?: number
  disabled?: boolean
  name?: string
  /** Container element for the popup DOM. Defaults to document.body.
   *  Use this to keep the hint inside a framework-managed container
   *  (e.g. React Portal target, Vue Teleport target). */
  container?: HTMLElement
}

// ── ScrollBar types ──

export const ScrollBarKind = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
} as const
export type ScrollBarKind = typeof ScrollBarKind[keyof typeof ScrollBarKind]

export const ScrollBarSize = {
  Tiny: 'tiny',
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
  XLarge: 'xlarge',
  Custom: 'custom',
} as const
export type ScrollBarSize = typeof ScrollBarSize[keyof typeof ScrollBarSize]

export interface TooltipColorRange {
  from: number
  to: number
  bg?: string
  color?: string
  bold?: boolean
}

export type TooltipColorFn = (value: number, min: number, max: number) =>
  { bg?: string; color?: string; bold?: boolean } | null

export interface UIScrollBarOptions {
  kind?: ScrollBarKind
  size?: ScrollBarSize
  customWidth?: number
  customHeight?: number
  min?: number
  max?: number
  value?: number
  step?: number
  pageStep?: number
  thumbSize?: number | string | null
  showTooltip?: boolean
  captureParentEvents?: boolean
  showStartZone?: boolean
  showEndZone?: boolean
  hover?: boolean
  focusable?: boolean
  disabled?: boolean
  wheelFactor?: number
  tooltipColors?: TooltipColorRange[]
  onTooltipColor?: TooltipColorFn
}

// ── ScrollBox types ──

export const ScrollMode = {
  None: 'none',
  Vertical: 'vertical',
  Horizontal: 'horizontal',
  Both: 'both',
} as const
export type ScrollMode = typeof ScrollMode[keyof typeof ScrollMode]

export const VerticalScrollPosition = {
  Left: 'left',
  Right: 'right',
  Both: 'both',
} as const
export type VerticalScrollPosition = typeof VerticalScrollPosition[keyof typeof VerticalScrollPosition]

export const HorizontalScrollPosition = {
  Top: 'top',
  Bottom: 'bottom',
  Both: 'both',
} as const
export type HorizontalScrollPosition = typeof HorizontalScrollPosition[keyof typeof HorizontalScrollPosition]

export interface ScrollBoxScrollBarConfig {
  hover?: boolean
  showTooltip?: boolean
  showStartZone?: boolean
  showEndZone?: boolean
}

export interface UIScrollBoxOptions {
  scroll?: ScrollMode
  verticalScroll?: VerticalScrollPosition
  horizontalScroll?: HorizontalScrollPosition
  scrollBarSize?: ScrollBarSize
  scrollBarHover?: boolean
  scrollBarTooltip?: boolean
  hScrollTopConfig?: ScrollBoxScrollBarConfig
  hScrollBottomConfig?: ScrollBoxScrollBarConfig
  vScrollLeftConfig?: ScrollBoxScrollBarConfig
  vScrollRightConfig?: ScrollBoxScrollBarConfig
  scrollStep?: number
  wheelFactor?: number
  altWheelHorizontal?: boolean
  contentWidth?: number
  contentHeight?: number
  borderWidth?: number
  borderColor?: string
  borderStyle?: string
  backgroundColor?: string
  opacity?: number
  disabled?: boolean
}

// ── WindowManager types ──

export const WindowState = {
  Normal: 'normal',
  Minimized: 'minimized',
  Maximized: 'maximized',
} as const
export type WindowState = typeof WindowState[keyof typeof WindowState]

export interface WindowChildInfo {
  id: string
  state: WindowState
  zIndex: number
  left: number
  top: number
  width: number
  height: number
}

export interface IWindowChild {
  readonly windowId: string
  readonly element: HTMLElement
  title?: string
  readonly kind?: WindowKind
  readonly modal?: boolean
  readonly topmost?: boolean
  windowState: WindowState
  readonly isFloating: boolean
  onFocused?(): void
  onBlurred?(): void
  onMinimized?(): void
  onRestored?(): void
  onClosed?(): void
  zIndex: number
  visible: boolean
}

export const WindowKind = {
  Normal: 'normal',
  Tool: 'tool',
} as const
export type WindowKind = typeof WindowKind[keyof typeof WindowKind]

export const TitleBarStyle = {
  Normal: 'normal',
  Tool: 'tool',
  MiniDrag: 'mini-drag',
} as const
export type TitleBarStyle = typeof TitleBarStyle[keyof typeof TitleBarStyle]

export const TitleAlign = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const
export type TitleAlign = typeof TitleAlign[keyof typeof TitleAlign]

export interface WindowCycleShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
}

export interface UIMenuBarOptions {
  disabled?: boolean
  className?: string
}

export interface UIWindowManagerOptions {
  width?: number | 'auto'
  height?: number | 'auto'
  bg?: string
  borderColor?: string
  className?: string
  cycleNextShortcut?: WindowCycleShortcut
  cyclePrevShortcut?: WindowCycleShortcut
  /** Disable MutationObserver auto-detection of <window-wc> children.
   *  Use addWindow()/removeWindow() explicitly in framework environments. */
  manualChildManagement?: boolean
}

export interface UIWindowOptions {
  kind?: WindowKind
  positioning?: UIPosition
  zIndex?: number
  id?: string
  title?: string
  left?: number
  top?: number
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  movable?: boolean
  closable?: boolean
  foldable?: boolean
  autoUnfold?: boolean
  modal?: boolean
  topmost?: boolean
  minimizable?: boolean
  maximizable?: boolean
  titleBarStyle?: TitleBarStyle
  titleBarHeight?: number
  icon?: HTMLElement | string
  showTitle?: boolean
  titleAlign?: TitleAlign
  leftElements?: HTMLElement[]
  rightElements?: HTMLElement[]
  scroll?: ScrollMode
  scrollBarSize?: ScrollBarSize
  showHints?: boolean
  showShortcuts?: boolean
  allowMoveOffParent?: boolean
}

// ── TextBox Experimental ──

export interface UITextBoxExpOptions {
  /** Initial text value */
  value?: string
  /** Placeholder text shown when empty and unfocused */
  placeholder?: string
  /** Width in pixels */
  width?: number
  /** Height in pixels */
  height?: number
  /** Font family */
  fontFamily?: string
  /** Font size in pixels */
  fontSize?: number
  /** Disabled state — no interaction */
  disabled?: boolean
  /** Read-only state — selectable but not editable */
  readonly?: boolean
  /** Maximum character count (-1 = unlimited) */
  maxLength?: number
  /** CSS class to add to host */
  className?: string
}

// ── TextBox WC (production) ──

export const TextBoxVariant = {
  Outlined: 'outlined',
  Filled: 'filled',
  Standard: 'standard',
  Fixed: 'fixed',
} as const
export type TextBoxVariant = typeof TextBoxVariant[keyof typeof TextBoxVariant]

export const TextBoxSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const
export type TextBoxSize = typeof TextBoxSize[keyof typeof TextBoxSize]

export const TextBoxValidation = {
  None: 'none',
  Success: 'success',
  Error: 'error',
} as const
export type TextBoxValidation = typeof TextBoxValidation[keyof typeof TextBoxValidation]

export interface UITextBoxWCOptions {
  variant?: TextBoxVariant
  size?: TextBoxSize
  label?: string
  placeholder?: string
  value?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  pattern?: string
  required?: boolean
  validation?: TextBoxValidation
  helperText?: string
  clearable?: boolean
  /** Icon shown before helper text. 'auto' shows ✓ for success, ⚠ for error */
  helperIcon?: string | 'auto'
  /** Tooltip hint: string for simple text, or a pre-configured UIHintWC instance */
  hint?: string | HTMLElement
  width?: number | string
  name?: string
  autocomplete?: string
  /** Use a <textarea> instead of <input>. Switchable at runtime. */
  multiline?: boolean
  /** Number of visible rows when multiline (default: 3) */
  rows?: number
}
