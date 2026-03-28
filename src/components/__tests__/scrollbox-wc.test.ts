import { describe, it, expect, afterEach } from 'vitest'
import '../ui-scrollbox-wc/ui-scrollbox-wc'

function flush(): Promise<void> { return new Promise(r => setTimeout(r, 10)) }

describe('scrollbox-wc', () => {
  let el: any

  afterEach(async () => {
    if (el?.parentNode) el.remove()
    if (el && !el.isDestroyed) el.destroy()
    await flush()
  })

  // ── Construction ──

  describe('construction', () => {
    it('creates element with shadowRoot', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      expect(el.shadowRoot).toBeTruthy()
    })

    it('has default values', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      expect(el.scrollMode).toBe('both')
      expect(el.scrollX).toBe(0)
      expect(el.scrollY).toBe(0)
      expect(el.disabled).toBe(false)
    })
  })

  // ── configure() ──

  describe('configure()', () => {
    it('sets scroll mode and size', () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ scroll: 'vertical', scrollBarSize: 'large' })
      document.body.appendChild(el)
      expect(el.scrollMode).toBe('vertical')
      expect(el.scrollBarSize).toBe('large')
    })

    it('sets border styles', () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ borderWidth: 2, borderColor: 'red', borderStyle: 'dashed' })
      document.body.appendChild(el)
      expect(el.borderWidth).toBe(2)
      expect(el.borderColor).toBe('red')
      expect(el.borderStyle).toBe('dashed')
    })

    it('sets background and opacity', () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ backgroundColor: '#fff', opacity: 0.5 })
      document.body.appendChild(el)
      expect(el.backgroundColor).toBe('#fff')
      expect(el.opacity).toBe(0.5)
    })

    it('sets content dimensions', () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 500, contentHeight: 1000 })
      document.body.appendChild(el)
      expect(el.contentWidth).toBe(500)
      expect(el.contentHeight).toBe(1000)
    })
  })

  // ── Properties ──

  describe('properties', () => {
    it('scrollMode', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.scrollMode = 'horizontal'
      expect(el.scrollMode).toBe('horizontal')
    })

    it('verticalScroll', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.verticalScroll = 'left'
      expect(el.verticalScroll).toBe('left')
    })

    it('horizontalScroll', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.horizontalScroll = 'top'
      expect(el.horizontalScroll).toBe('top')
    })

    it('scrollBarSize', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.scrollBarSize = 'medium'
      expect(el.scrollBarSize).toBe('medium')
    })

    it('scrollBarHover / scrollBarTooltip', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.scrollBarHover = true
      el.scrollBarTooltip = true
      expect(el.scrollBarHover).toBe(true)
      expect(el.scrollBarTooltip).toBe(true)
    })

    it('border properties', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.borderWidth = 3
      el.borderColor = 'blue'
      el.borderStyle = 'dotted'
      expect(el.borderWidth).toBe(3)
      expect(el.borderColor).toBe('blue')
      expect(el.borderStyle).toBe('dotted')
    })

    it('backgroundColor / opacity', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.backgroundColor = '#000'
      el.opacity = 0.75
      expect(el.backgroundColor).toBe('#000')
      expect(el.opacity).toBe(0.75)
    })

    it('contentWidth / contentHeight', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.contentWidth = 800
      el.contentHeight = 600
      expect(el.contentWidth).toBe(800)
      expect(el.contentHeight).toBe(600)
    })

    it('scrollStep', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.scrollStep = 50
      expect(el.scrollStep).toBe(50)
    })

    it('disabled', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.disabled = true
      expect(el.disabled).toBe(true)
      expect(el.classList.contains('disabled')).toBe(true)
    })
  })

  // ── Attributes ──

  describe('attributes', () => {
    it('scroll attribute reflects to scrollMode', () => {
      el = document.createElement('scrollbox-wc')
      el.setAttribute('scroll', 'vertical')
      document.body.appendChild(el)
      expect(el.scrollMode).toBe('vertical')
    })

    it('scrollbar-size attribute reflects', () => {
      el = document.createElement('scrollbox-wc')
      el.setAttribute('scrollbar-size', 'large')
      document.body.appendChild(el)
      expect(el.scrollBarSize).toBe('large')
    })

    it('border-width attribute reflects', () => {
      el = document.createElement('scrollbox-wc')
      el.setAttribute('border-width', '5')
      document.body.appendChild(el)
      expect(el.borderWidth).toBe(5)
    })

    it('content-width/content-height via configure', () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 400, contentHeight: 300 })
      document.body.appendChild(el)
      expect(el.contentWidth).toBe(400)
      expect(el.contentHeight).toBe(300)
    })
  })

  // ── Scroll methods ──

  describe('scroll methods', () => {
    it('scrollContentTo sets scrollX/scrollY', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000, contentHeight: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      el.scrollContentTo(50, 100)
      expect(el.scrollX).toBe(50)
      expect(el.scrollY).toBe(100)
    })

    it('scrollContentBy adjusts by delta', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000, contentHeight: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      el.scrollContentTo(10, 20)
      el.scrollContentBy(5, 10)
      expect(el.scrollX).toBe(15)
      expect(el.scrollY).toBe(30)
    })

    it('scrollX clamps to min 0', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      el.scrollX = -100
      expect(el.scrollX).toBe(0)
    })
  })

  // ── Content element ──

  describe('content element', () => {
    it('contentElement returns div inside shadowRoot', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      expect(el.contentElement).toBeInstanceOf(HTMLDivElement)
      expect(el.shadowRoot!.contains(el.contentElement)).toBe(true)
    })
  })

  // ── Events ──

  describe('events', () => {
    it('scrollbox-scroll fires on scroll', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000, contentHeight: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      let detail: any = null
      el.addEventListener('scrollbox-scroll', (e: any) => { detail = e.detail })
      el.scrollContentTo(10, 20)
      expect(detail).toBeTruthy()
      expect(detail.x).toBe(10)
    })

    it('onScroll/offScroll vanilla listeners', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000, contentHeight: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      let count = 0
      const handler = () => { count++ }
      el.onScroll(handler)
      el.scrollContentTo(10, 10)
      expect(count).toBeGreaterThan(0)
      const prev = count
      el.offScroll(handler)
      el.scrollContentTo(20, 20)
      expect(count).toBe(prev)
    })
  })

  // ── Destroy ──

  describe('destroy()', () => {
    it('sets isDestroyed to true', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(el.isDestroyed).toBe(true)
    })

    it('double destroy is safe', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      el.destroy()
      expect(() => el.destroy()).not.toThrow()
    })
  })

  // ── Missing public fields ──

  describe('public fields', () => {
    it('wheelFactor', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      expect(el.wheelFactor).toBe(1)
      el.wheelFactor = 3
      expect(el.wheelFactor).toBe(3)
    })

    it('altWheelHorizontal', () => {
      el = document.createElement('scrollbox-wc')
      document.body.appendChild(el)
      expect(el.altWheelHorizontal).toBe(true)
      el.altWheelHorizontal = false
      expect(el.altWheelHorizontal).toBe(false)
    })
  })

  // ── Missing methods ──

  describe('additional methods', () => {
    it('refresh does not throw', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 500, contentHeight: 500 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      expect(() => el.refresh()).not.toThrow()
    })

    it('scrollChildIntoView does not throw for valid child', async () => {
      el = document.createElement('scrollbox-wc')
      el.configure({ contentWidth: 2000, contentHeight: 2000 })
      el.style.cssText = 'width:200px;height:200px;display:block;'
      document.body.appendChild(el)
      await flush()
      const child = document.createElement('div')
      child.style.cssText = 'width:50px;height:50px;'
      el.contentElement.appendChild(child)
      expect(() => el.scrollChildIntoView(child)).not.toThrow()
    })
  })
})
