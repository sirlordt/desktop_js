import Konva from 'konva'
import type { CanvasColors } from '../common/canvas-theme'

export type ArrowDirection = 'up' | 'down' | 'left' | 'right'

/** Which ends of the track are exposed (no button adjacent) */
export interface TrackCaps {
  roundStart: boolean   // back end (top or left)
  roundEnd: boolean     // forward end (bottom or right)
}

/** Which outer edge to round: 'start' (top/left), 'end' (bottom/right), or 'none' */
export type RoundEdge = 'start' | 'end' | 'none'

export interface ScrollbarPainter {
  drawTrack(group: Konva.Group, w: number, h: number, colors: CanvasColors, isHorizontal: boolean, caps: TrackCaps): void
  drawThumb(group: Konva.Group, w: number, h: number, colors: CanvasColors): void
  drawButton(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, roundEdge?: RoundEdge): void
  drawButtonPressed(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, roundEdge?: RoundEdge): void
  drawCustomButton(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, isHorizontal: boolean, roundEdge?: RoundEdge): void
  drawCustomButtonPressed(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, isHorizontal: boolean, roundEdge?: RoundEdge): void
}

function roundEdgeCR(w: number, h: number, isH: boolean, edge: RoundEdge): [number, number, number, number] {
  if (edge === 'none') return [0, 0, 0, 0]
  const r = Math.min(w, h) / 2
  if (isH) {
    // start = left, end = right
    return edge === 'start' ? [r, 0, 0, r] : [0, r, r, 0]
  } else {
    // start = top, end = bottom
    return edge === 'start' ? [r, r, 0, 0] : [0, 0, r, r]
  }
}

// ── Named icons ──

const NAMED_ICONS: Record<string, (w: number, h: number, pad: number) => Konva.Shape> = {
  minus: (w, h, pad) => {
    const cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 - pad
    return new Konva.Line({
      points: [cx - s, cy, cx + s, cy],
      stroke: '', strokeWidth: 2, lineCap: 'round',
    })
  },
  plus: (w, h, pad) => {
    const cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 - pad
    const g = new Konva.Group() as any
    // Hack: return group with two lines — we'll handle this in drawCustomButton
    g._plusLines = [
      [cx - s, cy, cx + s, cy],
      [cx, cy - s, cx, cy + s],
    ]
    return g
  },
  square: (w, h, pad) => {
    const cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 - pad - 1
    return new Konva.Rect({
      x: cx - s, y: cy - s, width: s * 2, height: s * 2,
      fill: '',
    })
  },
  circle: (w, h, pad) => {
    const cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 - pad - 1
    return new Konva.Circle({
      x: cx, y: cy, radius: s,
      fill: '',
    })
  },
}

function drawIconInto(group: Konva.Group, w: number, h: number, icon: string, color: string): void {
  const pad = Math.round(Math.min(w, h) * 0.3)
  const factory = NAMED_ICONS[icon]
  if (factory) {
    const shape = factory(w, h, pad)
    if ((shape as any)._plusLines) {
      // Plus icon: two lines
      for (const pts of (shape as any)._plusLines) {
        group.add(new Konva.Line({ points: pts, stroke: color, strokeWidth: 2, lineCap: 'round' }))
      }
    } else if (shape instanceof Konva.Line) {
      shape.stroke(color)
      group.add(shape)
    } else if (shape instanceof Konva.Rect) {
      shape.fill(color)
      group.add(shape)
    } else if (shape instanceof Konva.Circle) {
      shape.fill(color)
      group.add(shape)
    }
  } else {
    // Treat as SVG path data
    group.add(new Konva.Path({
      data: icon,
      fill: color,
    }))
  }
}

// ── Helpers ──

function arrowTriangle(w: number, h: number, pad: number, dir: ArrowDirection): number[] {
  const cx = w / 2, cy = h / 2, s = Math.min(w, h) / 2 - pad
  const b = s * 0.6  // base half-width (narrower than tip height)
  switch (dir) {
    case 'up':    return [cx - b, cy + s * 0.4, cx, cy - s * 0.4, cx + b, cy + s * 0.4]
    case 'down':  return [cx - b, cy - s * 0.4, cx, cy + s * 0.4, cx + b, cy - s * 0.4]
    case 'left':  return [cx + s * 0.4, cy - b, cx - s * 0.4, cy, cx + s * 0.4, cy + b]
    case 'right': return [cx - s * 0.4, cy - b, cx + s * 0.4, cy, cx - s * 0.4, cy + b]
  }
}

// ── GTK4 Painter ──
// Modern minimal: pill-shaped thumb, circular buttons, subtle track

export class GTK4ScrollbarPainter implements ScrollbarPainter {
  drawTrack(group: Konva.Group, w: number, h: number, colors: CanvasColors, isHorizontal: boolean, caps: TrackCaps): void {
    const r = Math.min(w, h) / 2
    let cr: [number, number, number, number]
    if (isHorizontal) {
      // [topLeft, topRight, bottomRight, bottomLeft]
      cr = [
        caps.roundStart ? r : 0,
        caps.roundEnd ? r : 0,
        caps.roundEnd ? r : 0,
        caps.roundStart ? r : 0,
      ]
    } else {
      cr = [
        caps.roundStart ? r : 0,
        caps.roundStart ? r : 0,
        caps.roundEnd ? r : 0,
        caps.roundEnd ? r : 0,
      ]
    }
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.trackFill,
      cornerRadius: cr,
    }))
  }

  drawThumb(group: Konva.Group, w: number, h: number, colors: CanvasColors): void {
    const cross = Math.min(w, h)
    const inset = Math.max(2, Math.round(cross * 0.15))
    const r = (cross - inset * 2) / 2
    const isH = w > h
    group.add(new Konva.Rect({
      x: isH ? 1 : inset,
      y: isH ? inset : 1,
      width: isH ? w - 2 : w - inset * 2,
      height: isH ? h - inset * 2 : h - 2,
      fill: colors.thumbFill,
      cornerRadius: r,
    }))
  }

  drawButton(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, roundEdge?: RoundEdge): void {
    const isH = dir === 'left' || dir === 'right'
    const edge = roundEdge ?? (dir === 'up' || dir === 'left' ? 'start' : 'end')
    const cr = roundEdgeCR(w, h, isH, edge)
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.buttonFill,
      cornerRadius: cr,
    }))
    group.add(new Konva.Line({
      name: 'arrow',
      points: arrowTriangle(w, h, Math.round(w * 0.3), dir),
      fill: colors.buttonArrowStroke,
      closed: true,
    }))
  }

  drawButtonPressed(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, roundEdge?: RoundEdge): void {
    const isH = dir === 'left' || dir === 'right'
    const edge = roundEdge ?? (dir === 'up' || dir === 'left' ? 'start' : 'end')
    const cr = roundEdgeCR(w, h, isH, edge)
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.buttonHoverFill,
      cornerRadius: cr,
    }))
    const arrow = new Konva.Line({
      name: 'arrow',
      points: arrowTriangle(w, h, Math.round(w * 0.3), dir),
      fill: colors.buttonArrowStroke,
      closed: true,
    })
    arrow.move({ x: 1, y: 1 })
    group.add(arrow)
  }

  drawCustomButton(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, isHorizontal: boolean, roundEdge?: RoundEdge): void {
    const cr = roundEdgeCR(w, h, isHorizontal, roundEdge ?? 'none')
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.buttonFill,
      cornerRadius: cr,
    }))
    drawIconInto(group, w, h, icon, colors.buttonArrowStroke)
  }

  drawCustomButtonPressed(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, isHorizontal: boolean, roundEdge?: RoundEdge): void {
    const cr = roundEdgeCR(w, h, isHorizontal, roundEdge ?? 'none')
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.buttonHoverFill,
      cornerRadius: cr,
    }))
    // Shift icon 1px for push
    const iconGroup = new Konva.Group({ x: 1, y: 1 })
    drawIconInto(iconGroup, w, h, icon, colors.buttonArrowStroke)
    group.add(iconGroup)
  }
}

// ── WIN95 checkerboard pattern ──

function createCheckerboardImage(color1: string, color2: string): HTMLCanvasElement {
  const size = 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color1
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = color2
  ctx.fillRect(0, 0, 1, 1)
  ctx.fillRect(1, 1, 1, 1)
  return canvas
}

// ── WIN95 Painter ──
// 3D bevels: highlight top-left, shadow bottom-right, no corner radius

export class WIN95ScrollbarPainter implements ScrollbarPainter {
  drawTrack(group: Konva.Group, w: number, h: number, colors: CanvasColors, _isHorizontal: boolean, _caps: TrackCaps): void {
    // Checkerboard pattern background
    const patternCanvas = createCheckerboardImage(colors.trackFill, colors.trackStroke)
    const patternImage = new Image()
    patternImage.src = patternCanvas.toDataURL()
    patternImage.onload = () => {
      const rect = group.getChildren()[0] as Konva.Rect | undefined
      if (rect) {
        rect.fillPatternImage(patternImage)
        rect.fillPatternRepeat('repeat')
        rect.fill('')
        rect.getLayer()?.draw()
      }
    }
    // Base rect (solid color until pattern loads)
    group.add(new Konva.Rect({
      width: w, height: h,
      fill: colors.trackFill,
    }))
  }

  drawThumb(group: Konva.Group, w: number, h: number, colors: CanvasColors): void {
    this._drawWin95Face(group, w, h, colors.thumbFill)
  }

  drawButton(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, _roundEdge?: RoundEdge): void {
    this._drawWin95Face(group, w, h, colors.buttonFill)
    group.add(new Konva.Line({
      name: 'arrow',
      points: arrowTriangle(w, h, 4, dir),
      fill: colors.buttonArrowStroke,
      closed: true,
    }))
  }

  drawButtonPressed(group: Konva.Group, w: number, h: number, dir: ArrowDirection, colors: CanvasColors, _roundEdge?: RoundEdge): void {
    this._drawWin95FacePressed(group, w, h, colors.buttonFill)
    const arrow = new Konva.Line({
      name: 'arrow',
      points: arrowTriangle(w, h, 4, dir),
      fill: colors.buttonArrowStroke,
      closed: true,
    })
    arrow.move({ x: 1, y: 1 })
    group.add(arrow)
  }

  drawCustomButton(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, _isHorizontal: boolean, _roundEdge?: RoundEdge): void {
    this._drawWin95Face(group, w, h, colors.buttonFill)
    drawIconInto(group, w, h, icon, colors.buttonArrowStroke)
  }

  drawCustomButtonPressed(group: Konva.Group, w: number, h: number, icon: string, colors: CanvasColors, _isHorizontal: boolean, _roundEdge?: RoundEdge): void {
    this._drawWin95FacePressed(group, w, h, colors.buttonFill)
    const iconGroup = new Konva.Group({ x: 1, y: 1 })
    drawIconInto(iconGroup, w, h, icon, colors.buttonArrowStroke)
    group.add(iconGroup)
  }

  private _drawWin95Face(group: Konva.Group, w: number, h: number, fill: string): void {
    const outerLight = '#ffffff'
    const outerDark = '#000000'
    const innerLight = '#dfdfdf'
    const innerDark = '#808080'
    group.add(new Konva.Rect({ width: w, height: h, fill }))
    // Outer bevel
    group.add(new Konva.Line({ points: [0, 0, w - 1, 0], stroke: outerLight, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [0, 0, 0, h - 1], stroke: outerLight, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [0, h - 1, w, h - 1], stroke: outerDark, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [w - 1, 0, w - 1, h], stroke: outerDark, strokeWidth: 1 }))
    // Inner bevel
    group.add(new Konva.Line({ points: [1, 1, w - 2, 1], stroke: innerLight, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [1, 1, 1, h - 2], stroke: innerLight, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [1, h - 2, w - 1, h - 2], stroke: innerDark, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [w - 2, 1, w - 2, h - 1], stroke: innerDark, strokeWidth: 1 }))
  }

  private _drawWin95FacePressed(group: Konva.Group, w: number, h: number, fill: string): void {
    const outerDark = '#000000'
    const innerDark = '#808080'
    // Pressed: dark double bevel top-left, single white bottom-right
    group.add(new Konva.Rect({ width: w, height: h, fill }))
    // Outer dark top-left
    group.add(new Konva.Line({ points: [0, 0, w - 1, 0], stroke: outerDark, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [0, 0, 0, h - 1], stroke: outerDark, strokeWidth: 1 }))
    // Inner dark top-left
    group.add(new Konva.Line({ points: [1, 1, w - 2, 1], stroke: innerDark, strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [1, 1, 1, h - 2], stroke: innerDark, strokeWidth: 1 }))
    // Single white bottom-right (outer only)
    group.add(new Konva.Line({ points: [0, h - 1, w, h - 1], stroke: '#ffffff', strokeWidth: 1 }))
    group.add(new Konva.Line({ points: [w - 1, 0, w - 1, h], stroke: '#ffffff', strokeWidth: 1 }))
  }
}
