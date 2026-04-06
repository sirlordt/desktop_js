import { describe, it, expect, afterEach } from 'vitest'
import '../ui-scrollbar2d-wc/ui-scrollbar2d-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 50)) }

describe('scrollbar2d-wc', () => {
  let el: any

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && typeof el.destroy === 'function') el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('creates element and registers as custom element', () => {
      el = document.createElement('scrollbar2d-wc')
      expect(el).toBeInstanceOf(HTMLElement)
    })

    it('sets display block and overflow hidden on connect', async () => {
      el = document.createElement('scrollbar2d-wc')
      document.body.appendChild(el)
      await flush()
      expect(el.style.display).toBe('block')
      expect(el.style.overflow).toBe('hidden')
    })

    it('does not set tabindex by default (focusable=false)', async () => {
      el = document.createElement('scrollbar2d-wc')
      document.body.appendChild(el)
      await flush()
      expect(el.getAttribute('tabindex')).toBeNull()
    })

    it('creates a Konva stage inside the element', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300 })
      document.body.appendChild(el)
      await flush()
      const canvas = el.querySelector('canvas')
      expect(canvas).toBeTruthy()
    })
  })

  // ── Configure ──

  describe('configure', () => {
    it('accepts options and sets default values', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300 })
      document.body.appendChild(el)
      await flush()
      expect(el.value).toBe(0)
    })

    it('accepts custom initial value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, value: 30 })
      document.body.appendChild(el)
      await flush()
      expect(el.value).toBe(30)
    })
  })

  // ── Value getter/setter ──

  describe('value property', () => {
    it('setter updates scroll position', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, max: 100 })
      document.body.appendChild(el)
      await flush()
      el.value = 50
      expect(el.value).toBe(50)
    })

    it('clamps values to range', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100 })
      document.body.appendChild(el)
      await flush()
      el.value = 200
      expect(el.value).toBe(100)
      el.value = -50
      expect(el.value).toBe(0)
    })
  })

  // ── Scene graph: vertical scrollbar layout ──

  describe('vertical scrollbar layout', () => {
    async function createVertical() {
      el = document.createElement('scrollbar2d-wc')
      el.configure({
        kind: 'vertical', width: 16, height: 300,
        min: 0, max: 100, visibleSize: 25, barSize: 16,
      })
      document.body.appendChild(el)
      await flush()
      return el.stage
    }

    it('back button is at the top', async () => {
      const stage = await createVertical()
      const backBtn = stage.findOne('.backBtn')
      expect(backBtn).toBeTruthy()
      expect(backBtn.y()).toBe(0)
    })

    it('forward button is after the track', async () => {
      const stage = await createVertical()
      const fwdBtn = stage.findOne('.fwdBtn')
      const track = stage.findOne('.track')
      expect(fwdBtn).toBeTruthy()
      expect(fwdBtn.y()).toBe(track.y() + track.height())
    })

    it('thumb is within track bounds', async () => {
      const stage = await createVertical()
      const thumb = stage.findOne('.thumb')
      const track = stage.findOne('.track')
      expect(thumb).toBeTruthy()
      expect(track).toBeTruthy()
      expect(thumb.y()).toBeGreaterThanOrEqual(track.y())
      expect(thumb.y() + thumb.height()).toBeLessThanOrEqual(track.y() + track.height())
    })

    it('thumb size is proportional to visibleSize', async () => {
      const stage = await createVertical()
      const thumb = stage.findOne('.thumb')
      const track = stage.findOne('.track')
      const ratio = thumb.height() / track.height()
      expect(ratio).toBeCloseTo(0.2, 1)
    })

    it('thumb moves down when value increases', async () => {
      const stage = await createVertical()
      const thumb = stage.findOne('.thumb')
      const posAtZero = thumb.y()
      el.value = 50
      await flush()
      expect(thumb.y()).toBeGreaterThan(posAtZero)
    })

    it('thumb is at track start when value is min', async () => {
      const stage = await createVertical()
      const thumb = stage.findOne('.thumb')
      const track = stage.findOne('.track')
      el.value = 0
      await flush()
      expect(thumb.y()).toBe(track.y())
    })

    it('thumb is at track end when value is max', async () => {
      const stage = await createVertical()
      const thumb = stage.findOne('.thumb')
      const track = stage.findOne('.track')
      el.value = 100
      await flush()
      expect(thumb.y() + thumb.height()).toBeCloseTo(track.y() + track.height(), 0)
    })
  })

  // ── Scene graph: horizontal scrollbar layout ──

  describe('horizontal scrollbar layout', () => {
    async function createHorizontal() {
      el = document.createElement('scrollbar2d-wc')
      el.configure({
        kind: 'horizontal', width: 300, height: 16,
        min: 0, max: 100, visibleSize: 25, barSize: 16,
      })
      document.body.appendChild(el)
      await flush()
      return el.stage
    }

    it('back button is at the left', async () => {
      const stage = await createHorizontal()
      const backBtn = stage.findOne('.backBtn')
      expect(backBtn).toBeTruthy()
      expect(backBtn.x()).toBe(0)
    })

    it('forward button is after the track', async () => {
      const stage = await createHorizontal()
      const fwdBtn = stage.findOne('.fwdBtn')
      const track = stage.findOne('.track')
      expect(fwdBtn).toBeTruthy()
      expect(fwdBtn.x()).toBe(track.x() + track.width())
    })

    it('thumb is within track bounds', async () => {
      const stage = await createHorizontal()
      const thumb = stage.findOne('.thumb')
      const track = stage.findOne('.track')
      expect(thumb).toBeTruthy()
      expect(track).toBeTruthy()
      expect(thumb.x()).toBeGreaterThanOrEqual(track.x())
      expect(thumb.x() + thumb.width()).toBeLessThanOrEqual(track.x() + track.width())
    })

    it('thumb moves right when value increases', async () => {
      const stage = await createHorizontal()
      const thumb = stage.findOne('.thumb')
      const posAtZero = thumb.x()
      el.value = 50
      await flush()
      expect(thumb.x()).toBeGreaterThan(posAtZero)
    })
  })

  // ── No overlap between buttons, track, thumb ──

  describe('no overlapping shapes', () => {
    it('vertical: back button does not overlap track', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, barSize: 16 })
      document.body.appendChild(el)
      await flush()
      const stage = el.stage
      const backBtn = stage.findOne('.backBtn')
      const track = stage.findOne('.track')
      expect(backBtn.y() + backBtn.height()).toBeLessThanOrEqual(track.y())
    })

    it('vertical: forward button does not overlap track', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, barSize: 16 })
      document.body.appendChild(el)
      await flush()
      const stage = el.stage
      const fwdBtn = stage.findOne('.fwdBtn')
      const track = stage.findOne('.track')
      expect(track.y() + track.height()).toBeLessThanOrEqual(fwdBtn.y())
    })

    it('horizontal: back button does not overlap track', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'horizontal', width: 300, height: 16, barSize: 16 })
      document.body.appendChild(el)
      await flush()
      const stage = el.stage
      const backBtn = stage.findOne('.backBtn')
      const track = stage.findOne('.track')
      expect(backBtn.x() + backBtn.width()).toBeLessThanOrEqual(track.x())
    })
  })

  // ── Events ──

  describe('events', () => {
    it('fires sb2d-change on value change', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100 })
      document.body.appendChild(el)
      await flush()

      let detail: any = null
      el.addEventListener('sb2d-change', (e: CustomEvent) => { detail = e.detail })
      el.value = 42
      await flush()

      expect(detail).toBeTruthy()
      expect(detail.value).toBe(42)
      expect(detail.previousValue).toBe(0)
    })

    it('does not fire event when value does not change', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, value: 50 })
      document.body.appendChild(el)
      await flush()

      let fired = false
      el.addEventListener('sb2d-change', () => { fired = true })
      el.value = 50
      await flush()

      expect(fired).toBe(false)
    })
  })

  // ── Events: composed ──

  describe('event composition', () => {
    it('sb2d-change event has composed: true', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100 })
      document.body.appendChild(el)
      await flush()

      let composed = false
      el.addEventListener('sb2d-change', (e: CustomEvent) => { composed = e.composed })
      el.value = 42
      await flush()

      expect(composed).toBe(true)
    })
  })

  // ── Destroy / cleanup ──

  describe('destroy', () => {
    it('removes Konva stage on destroy', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300 })
      document.body.appendChild(el)
      await flush()
      expect(el.querySelector('canvas')).toBeTruthy()
      el.destroy()
      await flush()
      expect(el.querySelector('canvas')).toBeFalsy()
    })
  })

  // ── setRange ──

  describe('range updates', () => {
    it('setRange recalculates thumb size (vertical)', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, visibleSize: 50 })
      document.body.appendChild(el)
      await flush()

      const stage = el.stage
      const sizeBefore = stage.findOne('.thumb').height()

      el.setRange(0, 500, 50)
      await flush()

      const sizeAfter = stage.findOne('.thumb').height()
      expect(sizeAfter).toBeLessThan(sizeBefore)
    })

    it('setRange recalculates thumb size (horizontal)', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'horizontal', width: 300, height: 16, min: 0, max: 100, visibleSize: 50 })
      document.body.appendChild(el)
      await flush()

      const stage = el.stage
      const sizeBefore = stage.findOne('.thumb').width()

      el.setRange(0, 500, 50)
      await flush()

      const sizeAfter = stage.findOne('.thumb').width()
      expect(sizeAfter).toBeLessThan(sizeBefore)
    })

    it('clamps current value when range shrinks', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 80 })
      document.body.appendChild(el)
      await flush()

      el.setRange(0, 50, 25)
      await flush()

      expect(el.value).toBeLessThanOrEqual(50)
    })
  })

  // ── Keyboard support ──

  describe('keyboard', () => {
    it('ArrowUp decreases vertical value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
      expect(el.value).toBe(49)
    })

    it('ArrowDown increases vertical value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      expect(el.value).toBe(51)
    })

    it('ArrowLeft decreases horizontal value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'horizontal', width: 300, height: 16, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      expect(el.value).toBe(49)
    })

    it('ArrowRight increases horizontal value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'horizontal', width: 300, height: 16, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      expect(el.value).toBe(51)
    })

    it('PageUp decreases by pageStep', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, pageStep: 10, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }))
      expect(el.value).toBe(40)
    })

    it('PageDown increases by pageStep', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, pageStep: 10, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }))
      expect(el.value).toBe(60)
    })

    it('Home sets to min', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
      expect(el.value).toBe(0)
    })

    it('End sets to max', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.focus()
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
      expect(el.value).toBe(100)
    })
  })

  // ── Wheel support ──

  describe('wheel', () => {
    it('wheel down increases value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }))
      expect(el.value).toBeGreaterThan(50)
    })

    it('wheel up decreases value', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }))
      expect(el.value).toBeLessThan(50)
    })
  })

  // ── Button repeat ──

  describe('button repeat', () => {
    it('holding back button keeps decrementing', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, step: 1, focusable: true })
      document.body.appendChild(el)
      await flush()

      const stage = el.stage
      const backBtn = stage.findOne('.backBtn')
      backBtn.fire('mousedown')
      await new Promise(r => setTimeout(r, 600))
      backBtn.fire('mouseup')
      expect(el.value).toBeLessThan(49)
    })
  })

  // ── Cleanup registry ──

  describe('cleanup', () => {
    it('removes keyboard and wheel listeners on destroy', async () => {
      el = document.createElement('scrollbar2d-wc')
      el.configure({ kind: 'vertical', width: 16, height: 300, min: 0, max: 100, value: 50, focusable: true })
      document.body.appendChild(el)
      await flush()

      el.destroy()
      await flush()

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      expect(el.value).toBe(50)
    })
  })
})
