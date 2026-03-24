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
