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
