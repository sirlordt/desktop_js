import { describe, it, expect } from 'vitest'
import { ScrollbarModel } from '../ui-scrollbar2d-wc/scrollbar-model'

describe('ScrollbarModel', () => {
  function create(overrides: Partial<ConstructorParameters<typeof ScrollbarModel>[0]> = {}) {
    return new ScrollbarModel({
      min: 0,
      max: 100,
      value: 0,
      visibleSize: 25,
      step: 1,
      pageStep: 10,
      trackLength: 200,
      ...overrides,
    })
  }

  // ── Construction & defaults ──

  describe('construction', () => {
    it('stores initial values', () => {
      const m = create({ min: 10, max: 50, value: 20 })
      expect(m.min).toBe(10)
      expect(m.max).toBe(50)
      expect(m.value).toBe(20)
    })

    it('clamps initial value to range', () => {
      const m = create({ min: 0, max: 100, value: 150 })
      expect(m.value).toBe(100)
    })

    it('clamps initial value below min', () => {
      const m = create({ min: 10, max: 100, value: 5 })
      expect(m.value).toBe(10)
    })
  })

  // ── setValue ──

  describe('setValue', () => {
    it('sets value within range', () => {
      const m = create()
      expect(m.setValue(50)).toBe(50)
      expect(m.value).toBe(50)
    })

    it('clamps value above max', () => {
      const m = create({ max: 100 })
      expect(m.setValue(200)).toBe(100)
    })

    it('clamps value below min', () => {
      const m = create({ min: 10 })
      expect(m.setValue(5)).toBe(10)
    })

    it('returns current value when setting same value', () => {
      const m = create({ value: 30 })
      expect(m.setValue(30)).toBe(30)
    })
  })

  // ── Step operations ──

  describe('stepForward', () => {
    it('increments by step', () => {
      const m = create({ value: 0, step: 5 })
      expect(m.stepForward()).toBe(5)
      expect(m.value).toBe(5)
    })

    it('does not exceed max', () => {
      const m = create({ value: 98, max: 100, step: 5 })
      expect(m.stepForward()).toBe(100)
    })
  })

  describe('stepBackward', () => {
    it('decrements by step', () => {
      const m = create({ value: 10, step: 5 })
      expect(m.stepBackward()).toBe(5)
      expect(m.value).toBe(5)
    })

    it('does not go below min', () => {
      const m = create({ value: 2, min: 0, step: 5 })
      expect(m.stepBackward()).toBe(0)
    })
  })

  describe('pageForward', () => {
    it('increments by pageStep', () => {
      const m = create({ value: 0, pageStep: 10 })
      expect(m.pageForward()).toBe(10)
    })

    it('does not exceed max', () => {
      const m = create({ value: 95, max: 100, pageStep: 10 })
      expect(m.pageForward()).toBe(100)
    })
  })

  describe('pageBackward', () => {
    it('decrements by pageStep', () => {
      const m = create({ value: 50, pageStep: 10 })
      expect(m.pageBackward()).toBe(40)
    })

    it('does not go below min', () => {
      const m = create({ value: 3, min: 0, pageStep: 10 })
      expect(m.pageBackward()).toBe(0)
    })
  })

  // ── Thumb size ──

  describe('thumbSize', () => {
    it('is proportional to visibleSize / contentSize', () => {
      // visibleSize=25, range=100, trackLength=200
      // thumbSize = (25 / (100 + 25)) * 200 = 40
      const m = create({ min: 0, max: 100, visibleSize: 25, trackLength: 200 })
      expect(m.thumbSize).toBe(40)
    })

    it('has a minimum of 20px', () => {
      // visibleSize=1, range=1000, trackLength=200
      // raw = (1 / 1001) * 200 ≈ 0.2 → clamped to 20
      const m = create({ min: 0, max: 1000, visibleSize: 1, trackLength: 200 })
      expect(m.thumbSize).toBe(20)
    })

    it('does not exceed track length', () => {
      // visibleSize=500, range=10, trackLength=200
      // raw = (500 / 510) * 200 ≈ 196 → ok
      const m = create({ min: 0, max: 10, visibleSize: 500, trackLength: 200 })
      expect(m.thumbSize).toBeLessThanOrEqual(200)
    })
  })

  // ── Thumb position ──

  describe('thumbPosition', () => {
    it('is 0 when value equals min', () => {
      const m = create({ min: 0, max: 100, value: 0 })
      expect(m.thumbPosition).toBe(0)
    })

    it('is at end when value equals max', () => {
      const m = create({ min: 0, max: 100, value: 100, trackLength: 200, visibleSize: 25 })
      // thumbPosition should be trackLength - thumbSize
      expect(m.thumbPosition).toBe(200 - m.thumbSize)
    })

    it('is proportional for mid-range values', () => {
      const m = create({ min: 0, max: 100, value: 50, trackLength: 200, visibleSize: 25 })
      const pos = m.thumbPosition
      expect(pos).toBeGreaterThan(0)
      expect(pos).toBeLessThan(200 - m.thumbSize)
    })
  })

  // ── setFromThumbPosition (drag) ──

  describe('setFromThumbPosition', () => {
    it('sets value to min when position is 0', () => {
      const m = create({ min: 0, max: 100 })
      expect(m.setFromThumbPosition(0)).toBe(0)
    })

    it('sets value to max when position is at end', () => {
      const m = create({ min: 0, max: 100, trackLength: 200, visibleSize: 25 })
      const endPos = 200 - m.thumbSize
      expect(m.setFromThumbPosition(endPos)).toBe(100)
    })

    it('clamps negative positions to min', () => {
      const m = create({ min: 0 })
      expect(m.setFromThumbPosition(-50)).toBe(0)
    })

    it('clamps positions beyond track to max', () => {
      const m = create({ min: 0, max: 100, trackLength: 200 })
      expect(m.setFromThumbPosition(500)).toBe(100)
    })

    it('maps mid position to proportional value', () => {
      const m = create({ min: 0, max: 100, trackLength: 200, visibleSize: 25 })
      const midPos = (200 - m.thumbSize) / 2
      const val = m.setFromThumbPosition(midPos)
      expect(val).toBeCloseTo(50, 0)
    })
  })

  // ── Edge cases ──

  describe('edge cases', () => {
    it('handles min === max', () => {
      const m = create({ min: 50, max: 50, value: 50 })
      expect(m.value).toBe(50)
      expect(m.stepForward()).toBe(50)
      expect(m.stepBackward()).toBe(50)
      expect(m.thumbPosition).toBe(0)
    })

    it('handles zero trackLength', () => {
      const m = create({ trackLength: 0 })
      expect(m.thumbSize).toBe(20) // minimum
      expect(m.thumbPosition).toBe(0)
    })

    it('handles negative step gracefully', () => {
      const m = create({ value: 50, step: -5 })
      // stepForward with negative step should still move forward
      const after = m.stepForward()
      expect(after).not.toBe(50)
    })
  })
})
