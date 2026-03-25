import type { HintAlignment } from './types'

// Opposite side mapping for auto-flip
export const OPPOSITE_SIDE: Record<string, string> = {
  Bottom: 'Top', Top: 'Bottom', Right: 'Left', Left: 'Right',
}

// Cascade order: opposite → perpendicular1 → perpendicular2
export const FLIP_CASCADE: Record<string, string[]> = {
  Bottom: ['Top', 'Right', 'Left'],
  Top: ['Bottom', 'Right', 'Left'],
  Right: ['Left', 'Bottom', 'Top'],
  Left: ['Right', 'Bottom', 'Top'],
}

// Map secondary alignment to a valid one for the target side
export const SECONDARY_MAP: Record<string, Record<string, string>> = {
  Bottom: { Left: 'Left', Center: 'Center', Right: 'Right', Top: 'Left', Bottom: 'Left' },
  Top: { Left: 'Left', Center: 'Center', Right: 'Right', Top: 'Left', Bottom: 'Left' },
  Right: { Top: 'Top', Center: 'Center', Bottom: 'Bottom', Left: 'Top', Right: 'Top' },
  Left: { Top: 'Top', Center: 'Center', Bottom: 'Bottom', Left: 'Top', Right: 'Top' },
}

export interface Pos { left: number; top: number }

export function parseSide(alignment: HintAlignment): { side: string; secondary: string } {
  if (alignment === 'MouseCursor') return { side: 'MouseCursor', secondary: '' }
  for (const side of ['Bottom', 'Top', 'Right', 'Left']) {
    if (alignment.startsWith(side)) {
      return { side, secondary: alignment.slice(side.length) }
    }
  }
  return { side: 'Bottom', secondary: 'Center' }
}

export function buildAlignment(side: string, secondary: string): HintAlignment {
  return `${side}${secondary}` as HintAlignment
}

export function calcPosition(
  anchorRect: DOMRect, hW: number, hH: number,
  side: string, secondary: string, margin: number,
): Pos {
  const a = anchorRect
  let left = 0
  let top = 0

  switch (side) {
    case 'Bottom':
      top = a.bottom + margin
      if (secondary === 'Left') left = a.left
      else if (secondary === 'Center') left = a.left + a.width / 2 - hW / 2
      else left = a.right - hW
      break
    case 'Top':
      top = a.top - hH - margin
      if (secondary === 'Left') left = a.left
      else if (secondary === 'Center') left = a.left + a.width / 2 - hW / 2
      else left = a.right - hW
      break
    case 'Right':
      left = a.right + margin
      if (secondary === 'Top') top = a.top
      else if (secondary === 'Center') top = a.top + a.height / 2 - hH / 2
      else top = a.bottom - hH
      break
    case 'Left':
      left = a.left - hW - margin
      if (secondary === 'Top') top = a.top
      else if (secondary === 'Center') top = a.top + a.height / 2 - hH / 2
      else top = a.bottom - hH
      break
  }

  return { left, top }
}

export function fitsInViewport(left: number, top: number, w: number, h: number): boolean {
  return left >= 0 && top >= 0
    && left + w <= window.innerWidth
    && top + h <= window.innerHeight
}

/**
 * Find the best position for a floating element anchored to another element.
 * Tries the requested alignment first, then flips through cascade alternatives.
 */
export function findBestPosition(
  anchorRect: DOMRect,
  elWidth: number,
  elHeight: number,
  alignment: HintAlignment,
  margin: number,
): { pos: Pos; alignment: HintAlignment } {
  const { side, secondary } = parseSide(alignment)

  // Try requested alignment
  const pos = calcPosition(anchorRect, elWidth, elHeight, side, secondary, margin)
  if (fitsInViewport(pos.left, pos.top, elWidth, elHeight)) {
    return { pos, alignment }
  }

  // Try other secondaries on same side
  const secs = side === 'Bottom' || side === 'Top'
    ? ['Left', 'Center', 'Right'] : ['Top', 'Center', 'Bottom']
  for (const sec of secs) {
    if (sec === secondary) continue
    const p = calcPosition(anchorRect, elWidth, elHeight, side, sec, margin)
    if (fitsInViewport(p.left, p.top, elWidth, elHeight)) {
      return { pos: p, alignment: buildAlignment(side, sec) }
    }
  }

  // Flip cascade
  const cascade = FLIP_CASCADE[side] || []
  for (const flipSide of cascade) {
    const mappedSec = SECONDARY_MAP[flipSide]?.[secondary] || 'Center'
    const allSecs = [mappedSec, ...(['Left', 'Center', 'Right', 'Top', 'Bottom']
      .filter(s => SECONDARY_MAP[flipSide]?.[s] === s && s !== mappedSec))]

    for (const sec of allSecs) {
      const p = calcPosition(anchorRect, elWidth, elHeight, flipSide, sec, margin)
      if (fitsInViewport(p.left, p.top, elWidth, elHeight)) {
        return { pos: p, alignment: buildAlignment(flipSide, sec) }
      }
    }
  }

  // Fallback: original position
  return { pos, alignment }
}
