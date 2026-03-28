import { describe, it, expect, afterEach } from 'vitest'
import '../ui-scrollbar-wc/ui-scrollbar-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 10)) }

describe('scrollbar-wc', () => {
  let el: any

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && !el.isDestroyed) el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('creates element with shadowRoot', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.shadowRoot).toBeTruthy()
    })

    it('has default values', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.min).toBe(0)
      expect(el.max).toBe(100)
      expect(el.value).toBe(0)
      expect(el.disabled).toBe(false)
      expect(el.isDestroyed).toBe(false)
    })
  })

  // ── Attributes ──

  describe('attributes', () => {
    it('kind attribute reflects to property', () => {
      el = document.createElement('scrollbar-wc')
      el.setAttribute('kind', 'vertical')
      document.body.appendChild(el)
      expect(el.kind).toBe('vertical')
    })

    it('size attribute reflects to property', () => {
      el = document.createElement('scrollbar-wc')
      el.setAttribute('size', 'large')
      document.body.appendChild(el)
      expect(el.size).toBe('large')
    })

    it('min/max/value attributes reflect to properties', () => {
      el = document.createElement('scrollbar-wc')
      el.setAttribute('min', '10')
      el.setAttribute('max', '200')
      el.setAttribute('value', '50')
      document.body.appendChild(el)
      expect(el.min).toBe(10)
      expect(el.max).toBe(200)
      expect(el.value).toBe(50)
    })

    it('disabled attribute reflects to property', () => {
      el = document.createElement('scrollbar-wc')
      el.setAttribute('disabled', '')
      document.body.appendChild(el)
      expect(el.disabled).toBe(true)
    })

    it('step and page-step attributes reflect', () => {
      el = document.createElement('scrollbar-wc')
      el.setAttribute('step', '5')
      el.setAttribute('page-step', '20')
      document.body.appendChild(el)
      expect(el.step).toBe(5)
      expect(el.pageStep).toBe(20)
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('kind setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.kind = 'vertical'
      expect(el.kind).toBe('vertical')
    })

    it('size setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.size = 'medium'
      expect(el.size).toBe('medium')
    })

    it('min/max setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.min = 10
      el.max = 50
      expect(el.min).toBe(10)
      expect(el.max).toBe(50)
    })

    it('value is clamped to min/max', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.min = 0
      el.max = 100
      el.value = 150
      expect(el.value).toBe(100)
      el.value = -10
      expect(el.value).toBe(0)
    })

    it('hover getter/setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.hover).toBe(false)
      el.hover = true
      expect(el.hover).toBe(true)
    })

    it('focusable getter/setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.focusable = true
      expect(el.focusable).toBe(true)
      expect(el.tabIndex).toBe(0)
      el.focusable = false
      expect(el.focusable).toBe(false)
    })

    it('customWidth/customHeight getter/setter works', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.customWidth = 200
      expect(el.customWidth).toBe(200)
      el.customHeight = 30
      expect(el.customHeight).toBe(30)
    })
  })

  // ── configure() ──

  describe('configure()', () => {
    it('sets multiple properties at once', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ kind: 'vertical', size: 'large', min: 10, max: 200, value: 50 })
      document.body.appendChild(el)
      expect(el.kind).toBe('vertical')
      expect(el.size).toBe('large')
      expect(el.min).toBe(10)
      expect(el.max).toBe(200)
      expect(el.value).toBe(50)
    })

    it('can be called before appending to DOM', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ kind: 'horizontal', min: 0, max: 50, value: 25 })
      document.body.appendChild(el)
      expect(el.value).toBe(25)
      expect(el.max).toBe(50)
    })
  })

  // ── increase() / decrease() ──

  describe('increase/decrease', () => {
    it('increase changes value by step', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50, step: 5 })
      document.body.appendChild(el)
      el.increase()
      expect(el.value).toBe(55)
    })

    it('decrease changes value by step', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50, step: 5 })
      document.body.appendChild(el)
      el.decrease()
      expect(el.value).toBe(45)
    })

    it('increase with custom amount', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50 })
      document.body.appendChild(el)
      el.increase(20)
      expect(el.value).toBe(70)
    })

    it('increase respects max bound', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 95, step: 10 })
      document.body.appendChild(el)
      el.increase()
      expect(el.value).toBe(100)
    })

    it('decrease respects min bound', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 3, step: 10 })
      document.body.appendChild(el)
      el.decrease()
      expect(el.value).toBe(0)
    })
  })

  // ── Events ──

  describe('events', () => {
    it('sb-change fires on value change', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 0 })
      document.body.appendChild(el)
      let received: number | null = null
      el.addEventListener('sb-change', (e: any) => { received = e.detail.value })
      el.value = 42
      expect(received).toBe(42)
    })

    it('sb-change event bubbles and is composed', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      let evt: CustomEvent | null = null
      el.addEventListener('sb-change', (e: any) => { evt = e })
      el.value = 10
      expect(evt!.bubbles).toBe(true)
      expect(evt!.composed).toBe(true)
    })

    it('sb-change does not fire when value unchanged', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ value: 50 })
      document.body.appendChild(el)
      let count = 0
      el.addEventListener('sb-change', () => { count++ })
      el.value = 50
      expect(count).toBe(0)
    })

    it('on/off vanilla listeners work', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      let count = 0
      const handler = () => { count++ }
      el.on('change', handler)
      el.value = 10
      expect(count).toBe(1)
      el.off('change', handler)
      el.value = 20
      expect(count).toBe(1)
    })
  })

  // ── Disabled ──

  describe('disabled state', () => {
    it('increase does nothing when disabled', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50 })
      document.body.appendChild(el)
      el.disabled = true
      el.increase()
      expect(el.value).toBe(50)
    })

    it('decrease does nothing when disabled', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50 })
      document.body.appendChild(el)
      el.disabled = true
      el.decrease()
      expect(el.value).toBe(50)
    })

    it('re-enabling allows increase/decrease', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 50, step: 1 })
      document.body.appendChild(el)
      el.disabled = true
      el.increase()
      expect(el.value).toBe(50)
      el.disabled = false
      el.increase()
      expect(el.value).toBe(51)
    })
  })

  // ── Destroy ──

  describe('destroy()', () => {
    it('sets isDestroyed to true', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(el.isDestroyed).toBe(true)
    })

    it('double destroy is safe', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })
  })

  // ── DOM elements ──

  describe('internal elements', () => {
    it('exposes track, thumb, start, end elements', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.trackElement).toBeInstanceOf(HTMLDivElement)
      expect(el.thumbElement).toBeInstanceOf(HTMLDivElement)
      expect(el.startElement).toBeInstanceOf(HTMLDivElement)
      expect(el.endElement).toBeInstanceOf(HTMLDivElement)
    })

    it('exposes dec/inc button elements', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.decButtonElement).toBeInstanceOf(HTMLElement)
      expect(el.incButtonElement).toBeInstanceOf(HTMLElement)
    })
  })

  // ── Missing public fields ──

  describe('public fields', () => {
    it('thumbSize', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.thumbSize).toBeNull()
      el.thumbSize = 30
      expect(el.thumbSize).toBe(30)
      el.thumbSize = '50%'
      expect(el.thumbSize).toBe('50%')
    })

    it('showTooltip', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.showTooltip).toBe(false)
      el.showTooltip = true
      expect(el.showTooltip).toBe(true)
    })

    it('tooltipColors', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.tooltipColors).toEqual([])
      el.tooltipColors = [{ min: 0, max: 50, bg: 'red' }]
      expect(el.tooltipColors.length).toBe(1)
    })

    it('onTooltipColor', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.onTooltipColor).toBeNull()
      const fn = () => ({ bg: 'red' })
      el.onTooltipColor = fn
      expect(el.onTooltipColor).toBe(fn)
    })

    it('captureParentEvents', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.captureParentEvents).toBe(false)
      el.captureParentEvents = true
      expect(el.captureParentEvents).toBe(true)
    })

    it('wheelFactor', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.wheelFactor).toBe(1)
      el.wheelFactor = 3
      expect(el.wheelFactor).toBe(3)
    })

    it('step / pageStep', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      expect(el.step).toBe(1)
      expect(el.pageStep).toBe(10)
      el.step = 5
      el.pageStep = 25
      expect(el.step).toBe(5)
      expect(el.pageStep).toBe(25)
    })
  })

  // ── showStartZone / showEndZone ──

  describe('zone visibility', () => {
    it('showStartZone hides start element', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.showStartZone = false
      expect(el.startElement.style.display).toBe('none')
      el.showStartZone = true
      expect(el.startElement.style.display).toBe('')
    })

    it('showEndZone hides end element', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.showEndZone = false
      expect(el.endElement.style.display).toBe('none')
      el.showEndZone = true
      expect(el.endElement.style.display).toBe('')
    })
  })

  // ── Missing methods ──

  describe('utility methods', () => {
    it('setVar sets CSS custom property', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      el.setVar('--test-color', 'red')
      expect(el.style.getPropertyValue('--test-color')).toBe('red')
    })

    it('insertBeforeDecBtn adds element', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      const span = document.createElement('span')
      span.className = 'custom'
      el.insertBeforeDecBtn(span)
      expect(el.startElement.contains(span)).toBe(true)
    })

    it('insertAfterIncBtn adds element', () => {
      el = document.createElement('scrollbar-wc')
      document.body.appendChild(el)
      const span = document.createElement('span')
      span.className = 'custom'
      el.insertAfterIncBtn(span)
      expect(el.endElement.contains(span)).toBe(true)
    })
  })

  // ── Missing events ──

  describe('drag events', () => {
    it('sb-change fires via increase()', () => {
      el = document.createElement('scrollbar-wc')
      el.configure({ min: 0, max: 100, value: 0 })
      document.body.appendChild(el)
      let received = false
      el.addEventListener('sb-change', () => { received = true })
      el.increase()
      expect(received).toBe(true)
    })
  })
})
