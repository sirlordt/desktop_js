export type DimensionKind = 'set' | 'dynamic'

export interface DimensionProp {
  kind: DimensionKind
  value: number
}

export type Align = 'none' | 'left' | 'top' | 'right' | 'bottom' | 'center' | 'client'

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

export type UISize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'custom'

export type UIPosition = 'fluid' | 'relative' | 'absolute'

// ── Hint types ──

export type HintAlignment =
  | 'BottomLeft' | 'BottomCenter' | 'BottomRight'
  | 'RightTop'   | 'RightCenter'  | 'RightBottom'
  | 'TopLeft'    | 'TopCenter'    | 'TopRight'
  | 'LeftTop'    | 'LeftCenter'   | 'LeftBottom'
  | 'MouseCursor'

export type HintTrigger = 'hover' | 'click' | 'programmatic'

export type HintAnimation = 'fade' | 'none'

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
}

// ── ScrollBar types ──

export type ScrollBarKind = 'horizontal' | 'vertical'

export type ScrollBarSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'custom'

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

export type ScrollMode = 'none' | 'vertical' | 'horizontal' | 'both'

export type VerticalScrollPosition = 'left' | 'right' | 'both'

export type HorizontalScrollPosition = 'top' | 'bottom' | 'both'

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

export type WindowChildState = 'normal' | 'minimized' | 'maximized'

export interface WindowChildInfo {
  id: string
  state: WindowChildState
  zIndex: number
  left: number
  top: number
  width: number
  height: number
}

export interface IWindowChild {
  readonly windowId: string
  readonly element: HTMLElement
  windowState: WindowChildState
  readonly isFloating: boolean
  onFocused?(): void
  onMinimized?(): void
  onRestored?(): void
  onClosed?(): void
  setZIndex(z: number): void
  setVisible(v: boolean): void
}

export interface UIWindowManagerOptions {
  width?: number
  height?: number
  bg?: string
  borderColor?: string
  className?: string
}

export interface UIWindowOptions {
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
  minimizable?: boolean
  maximizable?: boolean
  titleBarHeight?: number
  icon?: HTMLElement | string
  showTitle?: boolean
  titleAlign?: 'left' | 'center' | 'right'
  leftElements?: HTMLElement[]
  rightElements?: HTMLElement[]
  scroll?: ScrollMode
  scrollBarSize?: ScrollBarSize
  showHints?: boolean
}
