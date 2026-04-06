import Konva from 'konva'
import { ScrollbarModel } from './scrollbar-model'
import { canvasTheme, onCanvasThemeChange, getPainter } from '../common/canvas-theme'
import './scrollbar-painters-register'
import type { ScrollBar2DOptions, ScrollBar2DChangeDetail, ScrollBar2DSize, ScrollBar2DButtonConfig } from '../common/types'
import type { CanvasColors } from '../common/canvas-theme'
import type { ScrollbarPainter, ArrowDirection, RoundEdge } from './scrollbar-painter'

const SIZE_TO_BAR: Record<string, number> = {
  small: 16,
  normal: 18,
  large: 24,
}

const REPEAT_DELAY = 400
const REPEAT_INTERVAL = 50

function resolveBarSize(size?: ScrollBar2DSize, customBarSize?: number): number {
  if (!size || size === 'custom') return customBarSize ?? 16
  return SIZE_TO_BAR[size] ?? 16
}

interface BarRef {
  container: HTMLDivElement
  stage: Konva.Stage
  layer: Konva.Layer
}

export class UIScrollbar2DWC extends HTMLElement {
  private _bar: BarRef | null = null
  private _model: ScrollbarModel
  private _opts: Required<Pick<ScrollBar2DOptions, 'kind' | 'width' | 'height' | 'barSize'>> & ScrollBar2DOptions
  private _theme: CanvasColors = canvasTheme()
  private _userTheme: Partial<CanvasColors> | null = null
  private _userPainter: ScrollbarPainter | null = null
  private _unsubTheme: (() => void) | null = null
  private _enabled = true
  private _focusable = false
  private _showBackButton = true
  private _showForwardButton = true
  private _slim = false
  private _slimCollapsed = false
  private _startButtons: ScrollBar2DButtonConfig[] = []
  private _endButtons: ScrollBar2DButtonConfig[] = []
  private _activeHoverBtn: { reset: () => void } | null = null
  private _configured = false
  private _connected = false
  private _destroyed = false
  private _rebuildScheduled = false
  private _pulseTween: Konva.Tween | null = null
  private _pulseOverlay: Konva.Rect | null = null
  private _pulsing = false
  private _cleanups: Array<() => void> = []

  static get observedAttributes(): string[] {
    return [
      'kind', 'size', 'width', 'height', 'bar-size',
      'min', 'max', 'value', 'visible-size', 'step', 'page-step',
      'enabled', 'focusable', 'show-back-button', 'show-forward-button', 'slim',
    ]
  }

  constructor() {
    super()
    this._model = new ScrollbarModel({ min: 0, max: 100, value: 0, visibleSize: 25, step: 1, pageStep: 10, trackLength: 0 })
    this._opts = { kind: 'vertical', width: 16, height: 300, barSize: 16 }
  }

  /** Expose the stage for testing */
  get stage(): Konva.Stage | null { return this._bar?.stage ?? null }

  get value(): number { return this._model.value }
  set value(v: number) {
    const prev = this._model.value
    this._model.setValue(v)
    if (this._model.value !== prev) {
      this._updateThumbPosition()
      this._fireChange(this._model.value, prev)
    }
  }

  get min(): number { return this._model.min }
  get max(): number { return this._model.max }
  get isDestroyed(): boolean { return this._destroyed }

  get enabled(): boolean { return this._enabled }
  set enabled(v: boolean) {
    this._enabled = v
    if (!v) {
      this.removeAttribute('tabindex')
      this._stopPulse()
    } else if (this._focusable) {
      this.setAttribute('tabindex', '0')
    }
    this._applyDisabledVisual()
  }

  get focusable(): boolean { return this._focusable }
  set focusable(v: boolean) {
    this._focusable = v
    if (v) {
      this.setAttribute('tabindex', '0')
    } else {
      this.removeAttribute('tabindex')
    }
  }

  configure(options?: ScrollBar2DOptions): void {
    if (!options) return
    this._configured = true
    const o = this._opts
    if (options.kind !== undefined) o.kind = options.kind
    if (options.width !== undefined) o.width = options.width
    if (options.height !== undefined) o.height = options.height
    if (options.size !== undefined || options.barSize !== undefined) {
      o.barSize = resolveBarSize(options.size, options.barSize)
    }

    this._model = new ScrollbarModel({
      min: options.min ?? this._model.min,
      max: options.max ?? this._model.max,
      value: options.value ?? this._model.value,
      visibleSize: options.visibleSize ?? this._model.visibleSize,
      step: options.step ?? this._model.step,
      pageStep: options.pageStep ?? this._model.pageStep,
      trackLength: 0,
    })

    if (options.enabled !== undefined) {
      this._enabled = options.enabled
    }
    if (options.focusable !== undefined) {
      this._focusable = options.focusable
    }
    if (options.showBackButton !== undefined) {
      this._showBackButton = options.showBackButton
    }
    if (options.showForwardButton !== undefined) {
      this._showForwardButton = options.showForwardButton
    }
    if (options.slim !== undefined) {
      this._slim = options.slim
    }
    if (options.startButtons !== undefined) {
      this._startButtons = options.startButtons
    }
    if (options.endButtons !== undefined) {
      this._endButtons = options.endButtons
    }

    if ((options as any).painter !== undefined) {
      this._userPainter = (options as any).painter
    }

    if (options.theme) {
      this._userTheme = options.theme
    }
    this._resolveTheme()

    if (this._connected) {
      this._rebuild()
    }
  }

  /** Override the painter for this instance */
  set painter(p: ScrollbarPainter | null) {
    this._userPainter = p
    if (this._connected) this._rebuild()
  }

  setRange(min: number, max: number, visibleSize: number): void {
    const prev = this._model.value
    this._model.min = min
    this._model.max = max
    this._model.visibleSize = visibleSize
    this._model.setValue(this._model.value)
    this._computeTrackLength()
    this._rebuildShapes()
    if (this._model.value !== prev) {
      this._fireChange(this._model.value, prev)
    }
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    if (!this._connected) return
    this._applyAttribute(name, val)
    this._scheduleRebuild()
  }

  private _scheduleRebuild(): void {
    if (this._rebuildScheduled) return
    this._rebuildScheduled = true
    queueMicrotask(() => {
      this._rebuildScheduled = false
      if (this._connected && !this._destroyed) {
        this._rebuild()
      }
    })
  }

  connectedCallback(): void {
    if (!this._configured) {
      this._readAttributes()
    }
    this.style.display = 'block'
    this.style.overflow = 'hidden'
    this.style.position = 'relative'
    this.style.outline = 'none'
    this.style.width = this._opts.width + 'px'
    this.style.height = this._opts.height + 'px'
    if (this._focusable && this._enabled) {
      this.setAttribute('tabindex', '0')
    } else {
      this.removeAttribute('tabindex')
    }
    this._connected = true
    this._resolveTheme()
    this._rebuild()
    this._bindKeyboard()
    this._bindWheel()
    this._observeTheme()
    this._applyDisabledVisual()
  }

  // ── Attributes ──

  private _readAttributes(): void {
    for (const name of UIScrollbar2DWC.observedAttributes) {
      const val = this.getAttribute(name)
      if (val !== null) this._applyAttribute(name, val)
    }
  }

  private _applyAttribute(name: string, val: string | null): void {
    const num = (fallback: number) => val !== null ? Number(val) : fallback
    const bool = () => val !== null && val !== 'false'

    switch (name) {
      case 'kind':
        this._opts.kind = (val as 'horizontal' | 'vertical') ?? 'vertical'
        break
      case 'size':
        this._opts.barSize = resolveBarSize(val as any, this._opts.barSize)
        break
      case 'width':
        this._opts.width = num(this._opts.width)
        break
      case 'height':
        this._opts.height = num(this._opts.height)
        break
      case 'bar-size':
        this._opts.barSize = num(this._opts.barSize)
        break
      case 'min':
        this._model.min = num(0)
        this._model.setValue(this._model.value)
        break
      case 'max':
        this._model.max = num(100)
        this._model.setValue(this._model.value)
        break
      case 'value': {
        const prev = this._model.value
        this._model.setValue(num(0))
        if (this._connected && this._model.value !== prev) {
          this._updateThumbPosition()
          this._fireChange(this._model.value, prev)
        }
        break
      }
      case 'visible-size':
        this._model.visibleSize = num(25)
        break
      case 'step':
        this._model.step = Math.abs(num(1)) || 1
        break
      case 'page-step':
        this._model.pageStep = Math.abs(num(10)) || 10
        break
      case 'enabled':
        this.enabled = val === null || val !== 'false'
        break
      case 'focusable':
        this.focusable = bool()
        break
      case 'show-back-button':
        this._showBackButton = val === null || val !== 'false'
        break
      case 'show-forward-button':
        this._showForwardButton = val === null || val !== 'false'
        break
      case 'slim':
        this._slim = bool()
        break
    }
  }

  disconnectedCallback(): void {
    this._connected = false
    this._destroyBar()
    this._stopObservingTheme()
  }

  destroy(): void {
    this._destroyed = true
    this._stopPulse()
    this._runCleanups()
    this._destroyBar()
    this._stopObservingTheme()
  }

  // ── Private ──

  private _getPainter(): ScrollbarPainter {
    if (this._userPainter) return this._userPainter
    return getPainter<ScrollbarPainter>('ScrollbarPainter')!
  }

  private _rebuild(): void {
    this._destroyBar()
    this._computeTrackLength()
    this._createBar()
  }

  private _destroyBar(): void {
    if (this._bar) {
      this._bar.stage.destroy()
      this._bar.container.remove()
      this._bar = null
    }
  }

  private _runCleanups(): void {
    for (const fn of this._cleanups) fn()
    this._cleanups.length = 0
  }

  private _on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    el.addEventListener(event, handler as EventListener, options)
    this._cleanups.push(() => el.removeEventListener(event, handler as EventListener, options))
  }

  private _resolveTheme(): void {
    this._theme = canvasTheme(this._userTheme ?? undefined)
  }

  private _observeTheme(): void {
    this._unsubTheme = onCanvasThemeChange(() => {
      this._resolveTheme()
      if (this._connected) this._rebuild()
    })
  }

  private _stopObservingTheme(): void {
    if (this._unsubTheme) {
      this._unsubTheme()
      this._unsubTheme = null
    }
  }

  private _applyDisabledVisual(): void {
    if (!this._enabled) {
      this.style.opacity = '0.4'
      this.style.pointerEvents = 'none'
      this.removeAttribute('tabindex')
    } else {
      this.style.opacity = ''
      this.style.pointerEvents = ''
      if (this._focusable) this.setAttribute('tabindex', '0')
    }
  }

  private _isHorizontal(): boolean {
    return this._opts.kind === 'horizontal'
  }

  private _computeTrackLength(): void {
    const bs = this._opts.barSize
    const total = this._isHorizontal() ? this._opts.width : this._opts.height
    const navButtons = (this._showBackButton ? bs : 0) + (this._showForwardButton ? bs : 0)
    const customButtons = (this._startButtons.length + this._endButtons.length) * bs
    this._model.trackLength = Math.max(0, total - navButtons - customButtons)
  }

  private _createBar(): void {
    const bs = this._opts.barSize
    const isH = this._isHorizontal()
    const w = isH ? this._opts.width : bs
    const h = isH ? bs : this._opts.height

    const div = document.createElement('div')
    div.style.position = 'absolute'
    div.style.left = '0'
    div.style.top = '0'
    div.style.width = w + 'px'
    div.style.height = h + 'px'
    div.style.overflow = 'visible'

    if (this._slim) {
      const prop = isH ? 'scaleY' : 'scaleX'
      div.style.transition = 'transform 0.15s ease'
      div.style.transformOrigin = 'center'
      div.style.transform = `${prop}(0.2)`
    }

    this.appendChild(div)

    const stage = new Konva.Stage({ container: div, width: w, height: h })
    const layer = new Konva.Layer()
    stage.add(layer)
    this._bar = { container: div, stage, layer }

    this._buildShapes()

    if (this._slim) {
      this._bindSlim(div)
    }
  }

  private _bindSlim(div: HTMLDivElement): void {
    const isH = this._isHorizontal()
    const prop = isH ? 'scaleY' : 'scaleX'
    const layer = this._bar!.layer

    const duration = 0.15
    const thumbGroup = layer.findOne('.thumb') as Konva.Group | undefined
    const thumbRect = thumbGroup?.getChildren()[0] as Konva.Rect | undefined
    const pillRadius = thumbRect ? thumbRect.cornerRadius() : 0

    // Collect only arrow shapes (named 'arrow'), not bevel lines
    const arrows: Konva.Line[] = []
    for (const btnName of ['.backBtn', '.fwdBtn']) {
      const btn = layer.findOne(btnName) as Konva.Group | undefined
      if (!btn) continue
      btn.getChildren().forEach(child => {
        if (child instanceof Konva.Line && child.name() === 'arrow') arrows.push(child)
      })
    }

    const animateTo = (collapsed: boolean) => {
      this._slimCollapsed = collapsed
      div.style.transform = `${prop}(${collapsed ? 0.2 : 1})`

      const currentLayer = this._bar?.layer
      if (!currentLayer) return

      const tr = (currentLayer.findOne('.thumb') as Konva.Group | undefined)?.getChildren()[0] as Konva.Rect | undefined
      if (tr && tr.getLayer()) {
        const pr = collapsed ? 0 : (typeof pillRadius === 'number' ? pillRadius : 0)
        new Konva.Tween({ node: tr, duration, cornerRadius: pr }).play()
      }

      for (const btnName of ['.backBtn', '.fwdBtn']) {
        const btn = currentLayer.findOne(btnName) as Konva.Group | undefined
        if (!btn) continue
        btn.getChildren().forEach(child => {
          if (child instanceof Konva.Line && child.name() === 'arrow' && child.getLayer()) {
            new Konva.Tween({ node: child, duration, opacity: collapsed ? 0 : 1 }).play()
          }
        })
      }
    }

    let dragging = false
    const expand = () => animateTo(false)
    const collapse = () => animateTo(true)
    const collapseIfIdle = () => {
      if (dragging || document.activeElement === this) return
      collapse()
    }

    // Start collapsed (instant)
    this._slimCollapsed = true
    if (thumbRect && thumbRect.getLayer()) thumbRect.cornerRadius(0)
    for (const arrow of arrows) { if (arrow.getLayer()) arrow.opacity(0) }
    layer.draw()

    this._on(this as unknown as HTMLElement, 'mouseenter', expand)
    this._on(this as unknown as HTMLElement, 'mouseleave', collapseIfIdle)
    this._on(this as unknown as HTMLElement, 'focusin', expand)
    this._on(this as unknown as HTMLElement, 'focusout', () => {
      if (!this.matches(':hover') && !dragging) collapse()
    })

    // Track drag state via document mousedown/mouseup
    const onMouseDown = () => { dragging = true }
    const onMouseUp = () => {
      if (!dragging) return
      dragging = false
      if (this.matches(':hover') || document.activeElement === this) {
        // Stay expanded — mouse is still over or focused
        expand()
      } else {
        collapse()
      }
    }
    this._on(this as unknown as HTMLElement, 'mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    this._cleanups.push(() => document.removeEventListener('mouseup', onMouseUp))
  }

  private _rebuildShapes(): void {
    if (!this._bar) return
    this._bar.layer.destroyChildren()
    this._buildShapes()
  }

  private _buildShapes(): void {
    const layer = this._bar!.layer
    const bs = this._opts.barSize
    const isH = this._isHorizontal()
    const trackLen = this._model.trackLength
    const painter = this._getPainter()
    const colors = this._theme

    // Cursor tracks position along the main axis
    let cursor = 0

    // Determine which buttons are first/last for rounding
    const hasStartCustom = this._startButtons.length > 0
    const hasEndCustom = this._endButtons.length > 0
    const backIsFirst = !hasStartCustom && this._showBackButton
    const fwdIsLast = !hasEndCustom && this._showForwardButton
    const backRound: RoundEdge = backIsFirst ? 'start' : 'none'
    const fwdRound: RoundEdge = fwdIsLast ? 'end' : 'none'

    // Start custom buttons
    for (let i = 0; i < this._startButtons.length; i++) {
      const cfg = this._startButtons[i]
      const bx = isH ? cursor : 0
      const by = isH ? 0 : cursor
      const edge: RoundEdge = i === 0 ? 'start' : 'none'
      const btn = new Konva.Group({ name: 'customBtn', x: bx, y: by, width: bs, height: bs })
      painter.drawCustomButton(btn, bs, bs, cfg.icon, colors, isH, edge)
      btn.on('mousedown', () => cfg.onClick())
      this._bindCustomButtonHover(btn, bs, bs, cfg.icon, painter, colors, layer, isH, edge)
      layer.add(btn)
      cursor += bs
    }

    // Back button
    if (this._showBackButton) {
      const backDir: ArrowDirection = isH ? 'left' : 'up'
      const bx = isH ? cursor : 0
      const by = isH ? 0 : cursor
      const backBtn = new Konva.Group({ name: 'backBtn', x: bx, y: by, width: bs, height: bs })
      painter.drawButton(backBtn, bs, bs, backDir, colors, backRound)
      this._bindNavButton(backBtn, bs, bs, backDir, painter, colors, layer, backRound, () => {
        const prev = this._model.value
        this._model.stepBackward()
        if (this._model.value !== prev) {
          this._updateThumbPosition()
          this._fireChange(this._model.value, prev)
        }
      })
      layer.add(backBtn)
      cursor += bs
    }

    // Track
    const trackX = isH ? cursor : 0
    const trackY = isH ? 0 : cursor
    const trackW = isH ? trackLen : bs
    const trackH = isH ? bs : trackLen
    const trackGroup = new Konva.Group({ name: 'track', x: trackX, y: trackY, width: trackW, height: trackH })
    const caps = {
      roundStart: !this._showBackButton && this._startButtons.length === 0,
      roundEnd: !this._showForwardButton && this._endButtons.length === 0,
    }
    painter.drawTrack(trackGroup, trackW, trackH, colors, isH, caps)
    trackGroup.on('mousedown', (e: Konva.KonvaEventObject<MouseEvent>) => {
      const localPos = isH ? e.evt.offsetX - trackX : e.evt.offsetY - trackY
      const prev = this._model.value
      if (localPos < this._model.thumbPosition) {
        this._model.pageBackward()
      } else {
        this._model.pageForward()
      }
      if (this._model.value !== prev) {
        this._updateThumbPosition()
        this._fireChange(this._model.value, prev)
      }
    })
    layer.add(trackGroup)

    // Thumb
    const thumbPos = this._model.thumbPosition
    const thumbSz = this._model.thumbSize
    const thumbW = isH ? thumbSz : bs
    const thumbH = isH ? bs : thumbSz
    const thumb = new Konva.Group({
      name: 'thumb',
      x: isH ? trackX + thumbPos : 0,
      y: isH ? 0 : trackY + thumbPos,
      width: thumbW, height: thumbH,
      draggable: true,
    })
    painter.drawThumb(thumb, thumbW, thumbH, colors)
    thumb.on('dragmove', () => {
      if (isH) {
        thumb.y(0)
        const minX = trackX
        const maxX = trackX + trackLen - this._model.thumbSize
        thumb.x(Math.max(minX, Math.min(thumb.x(), maxX)))
        const prev = this._model.value
        this._model.setFromThumbPosition(thumb.x() - trackX)
        if (this._model.value !== prev) {
          this._fireChange(this._model.value, prev)
        }
      } else {
        thumb.x(0)
        const minY = trackY
        const maxY = trackY + trackLen - this._model.thumbSize
        thumb.y(Math.max(minY, Math.min(thumb.y(), maxY)))
        const prev = this._model.value
        this._model.setFromThumbPosition(thumb.y() - trackY)
        if (this._model.value !== prev) {
          this._fireChange(this._model.value, prev)
        }
      }
    })
    let thumbDragging = false
    let keepHoverUntilHostLeave = false
    const setThumbFill = (fill: string) => {
      const rect = thumb.getChildren()[0] as Konva.Rect | undefined
      if (rect) { rect.fill(fill); layer.draw() }
    }
    thumb.on('mouseenter', () => {
      keepHoverUntilHostLeave = false
      if (!thumbDragging) setThumbFill(colors.thumbHoverFill)
    })
    thumb.on('mouseleave', () => {
      if (thumbDragging || keepHoverUntilHostLeave) return
      setThumbFill(colors.thumbFill)
    })
    thumb.on('mousedown', () => {
      setThumbFill(colors.thumbDragFill)
    })
    thumb.on('dragstart', () => {
      thumbDragging = true
    })
    thumb.on('dragend', () => {
      thumbDragging = false
      if (this.matches(':hover')) {
        keepHoverUntilHostLeave = true
        setThumbFill(colors.thumbHoverFill)
      } else {
        setThumbFill(colors.thumbFill)
      }
    })
    // When mouse leaves the host element, clear the guard
    const onHostLeave = () => {
      if (keepHoverUntilHostLeave) {
        keepHoverUntilHostLeave = false
        setThumbFill(colors.thumbFill)
      }
    }
    this._on(this as unknown as HTMLElement, 'mouseleave', onHostLeave)

    // Focus pulse: add overlay rect for pulse animation
    // Insert at index 1 (after fill rect, before bevel lines) so bevels stay on top
    const thumbBaseRect = thumb.getChildren()[0] as Konva.Rect | undefined
    if (thumbBaseRect) {
      const overlay = new Konva.Rect({
        x: thumbBaseRect.x(), y: thumbBaseRect.y(),
        width: thumbBaseRect.width(), height: thumbBaseRect.height(),
        fill: colors.thumbPulseFill,
        cornerRadius: thumbBaseRect.cornerRadius(),
        opacity: 0,
        listening: false,
      })
      // Insert after fill rect so bevel lines remain on top
      const children = thumb.getChildren()
      if (children.length > 1) {
        overlay.moveTo(thumb)
        overlay.setZIndex(1)
      } else {
        thumb.add(overlay)
      }
      this._pulseOverlay = overlay
    }

    // Bind focus pulse
    this._on(this as unknown as HTMLElement, 'focusin', () => {
      if (!this.matches(':hover')) this._startPulse()
    })
    this._on(this as unknown as HTMLElement, 'focusout', () => this._stopPulse())
    this._on(this as unknown as HTMLElement, 'mouseenter', () => this._stopPulse())
    this._on(this as unknown as HTMLElement, 'mouseleave', () => {
      if (document.activeElement === this) this._startPulse()
    })

    layer.add(thumb)

    // Forward button
    cursor = isH ? trackX + trackLen : trackY + trackLen
    if (this._showForwardButton) {
      const fwdDir: ArrowDirection = isH ? 'right' : 'down'
      const fx = isH ? cursor : 0
      const fy = isH ? 0 : cursor
      const fwdBtn = new Konva.Group({ name: 'fwdBtn', x: fx, y: fy, width: bs, height: bs })
      painter.drawButton(fwdBtn, bs, bs, fwdDir, colors, fwdRound)
      this._bindNavButton(fwdBtn, bs, bs, fwdDir, painter, colors, layer, fwdRound, () => {
        const prev = this._model.value
        this._model.stepForward()
        if (this._model.value !== prev) {
          this._updateThumbPosition()
          this._fireChange(this._model.value, prev)
        }
      })
      layer.add(fwdBtn)
      cursor += bs
    }

    // End custom buttons
    for (let i = 0; i < this._endButtons.length; i++) {
      const cfg = this._endButtons[i]
      const bx = isH ? cursor : 0
      const by = isH ? 0 : cursor
      const edge: RoundEdge = i === this._endButtons.length - 1 ? 'end' : 'none'
      const btn = new Konva.Group({ name: 'customBtn', x: bx, y: by, width: bs, height: bs })
      painter.drawCustomButton(btn, bs, bs, cfg.icon, colors, isH, edge)
      btn.on('mousedown', () => cfg.onClick())
      this._bindCustomButtonHover(btn, bs, bs, cfg.icon, painter, colors, layer, isH, edge)
      layer.add(btn)
      cursor += bs
    }

    layer.draw()
  }

  /** Unified handler: repeat action + visual hover/pressed for nav buttons */
  private _bindNavButton(
    btn: Konva.Group, w: number, h: number, dir: ArrowDirection,
    painter: ScrollbarPainter, colors: CanvasColors, layer: Konva.Layer,
    roundEdge: RoundEdge | undefined, action: () => void,
  ): void {
    let visual: 'normal' | 'hover' | 'pressed' = 'normal'
    let mouseIsDown = false
    let delayTimer: ReturnType<typeof setTimeout> | null = null
    let repeatTimer: ReturnType<typeof setInterval> | null = null

    const hideSlimArrows = () => {
      if (!this._slimCollapsed) return
      btn.getChildren().forEach(child => {
        if (child instanceof Konva.Line && child.name() === 'arrow') child.opacity(0)
      })
    }

    const draw = (s: typeof visual) => {
      visual = s
      btn.destroyChildren()
      if (s === 'pressed') {
        painter.drawButtonPressed(btn, w, h, dir, colors, roundEdge)
      } else if (s === 'hover') {
        painter.drawButton(btn, w, h, dir, { ...colors, buttonFill: colors.buttonHoverFill }, roundEdge)
      } else {
        painter.drawButton(btn, w, h, dir, colors, roundEdge)
      }
      hideSlimArrows()
      layer.draw()
    }

    const startRepeat = () => {
      stopRepeat()
      action()
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(action, REPEAT_INTERVAL)
      }, REPEAT_DELAY)
    }

    const stopRepeat = () => {
      if (delayTimer) { clearTimeout(delayTimer); delayTimer = null }
      if (repeatTimer) { clearInterval(repeatTimer); repeatTimer = null }
    }

    const resetFn = () => { if (visual !== 'normal') { stopRepeat(); draw('normal') } }

    btn.on('mousedown', () => {
      mouseIsDown = true
      draw('pressed')
      startRepeat()
    })

    btn.on('mouseup', () => {
      mouseIsDown = false
      stopRepeat()
      draw('hover')
    })

    btn.on('mouseenter', () => {
      if (this._activeHoverBtn && this._activeHoverBtn.reset !== resetFn) this._activeHoverBtn.reset()
      this._activeHoverBtn = { reset: resetFn }
      if (mouseIsDown) {
        draw('pressed')
        startRepeat()
      } else {
        draw('hover')
      }
    })

    btn.on('mouseleave', () => {
      if (this._activeHoverBtn?.reset === resetFn) this._activeHoverBtn = null
      stopRepeat()
      draw('normal')
    })

    const onDocMouseUp = () => { mouseIsDown = false; stopRepeat() }
    document.addEventListener('mouseup', onDocMouseUp)
    this._cleanups.push(() => document.removeEventListener('mouseup', onDocMouseUp))

    const container = this._bar!.container
    const onContainerLeave = () => resetFn()
    container.addEventListener('mouseleave', onContainerLeave)
    this._cleanups.push(() => container.removeEventListener('mouseleave', onContainerLeave))

    this._cleanups.push(stopRepeat)
  }

  private _bindCustomButtonHover(
    btn: Konva.Group, w: number, h: number, icon: string,
    painter: ScrollbarPainter, colors: CanvasColors, layer: Konva.Layer,
    isHorizontal: boolean, roundEdge?: RoundEdge,
  ): void {
    let state: 'normal' | 'hover' | 'pressed' = 'normal'

    const draw = (s: typeof state) => {
      state = s
      btn.destroyChildren()
      if (s === 'pressed') {
        painter.drawCustomButtonPressed(btn, w, h, icon, colors, isHorizontal, roundEdge)
      } else if (s === 'hover') {
        painter.drawCustomButton(btn, w, h, icon, { ...colors, buttonFill: colors.buttonHoverFill }, isHorizontal, roundEdge)
      } else {
        painter.drawCustomButton(btn, w, h, icon, colors, isHorizontal, roundEdge)
      }
      layer.draw()
    }
    let mouseDown = false
    const resetFn = () => { if (state !== 'normal') draw('normal') }
    btn.on('mouseenter', () => {
      if (this._activeHoverBtn && this._activeHoverBtn.reset !== resetFn) this._activeHoverBtn.reset()
      this._activeHoverBtn = { reset: resetFn }
      draw(mouseDown ? 'pressed' : 'hover')
    })
    btn.on('mouseleave', () => {
      if (this._activeHoverBtn?.reset === resetFn) this._activeHoverBtn = null
      draw('normal')
    })
    btn.on('mousedown', () => { mouseDown = true; draw('pressed') })
    btn.on('mouseup', () => { mouseDown = false; draw('hover') })

    const onDocMouseUp = () => { mouseDown = false }
    document.addEventListener('mouseup', onDocMouseUp)
    this._cleanups.push(() => document.removeEventListener('mouseup', onDocMouseUp))

    const container = this._bar!.container
    const onContainerLeave = () => resetFn()
    container.addEventListener('mouseleave', onContainerLeave)
    this._cleanups.push(() => container.removeEventListener('mouseleave', onContainerLeave))
  }

  private _startPulse(): void {
    if (this._pulsing || !this._pulseOverlay) return
    this._pulsing = true
    const overlay = this._pulseOverlay

    const pulseIn = () => {
      if (!this._pulsing || !overlay.getLayer()) return
      this._pulseTween = new Konva.Tween({
        node: overlay,
        duration: 0.8,
        opacity: 1,
        easing: Konva.Easings.EaseInOut,
        onFinish: pulseOut,
      })
      this._pulseTween.play()
    }

    const pulseOut = () => {
      if (!this._pulsing || !overlay.getLayer()) return
      this._pulseTween = new Konva.Tween({
        node: overlay,
        duration: 0.8,
        opacity: 0,
        easing: Konva.Easings.EaseInOut,
        onFinish: pulseIn,
      })
      this._pulseTween.play()
    }

    pulseIn()
  }

  private _stopPulse(): void {
    if (!this._pulsing) return
    this._pulsing = false
    if (this._pulseTween) {
      this._pulseTween.destroy()
      this._pulseTween = null
    }
    if (this._pulseOverlay && this._pulseOverlay.getLayer()) {
      this._pulseOverlay.opacity(0)
      this._pulseOverlay.getLayer()!.draw()
    }
  }

  private _updateThumbPosition(): void {
    if (!this._bar) return
    const bs = this._opts.barSize
    const offset = (this._startButtons.length * bs) + (this._showBackButton ? bs : 0)
    const isH = this._isHorizontal()
    const thumb = this._bar.layer.findOne('.thumb') as Konva.Group | undefined
    if (thumb) {
      if (isH) {
        thumb.x(offset + this._model.thumbPosition)
      } else {
        thumb.y(offset + this._model.thumbPosition)
      }
      this._bar.layer.draw()
    }
  }

  // ── Keyboard ──

  private _bindKeyboard(): void {
    this._on(this as unknown as HTMLElement, 'keydown', (e) => {
      if (this._destroyed || !this._enabled) return
      const isH = this._isHorizontal()
      switch (e.key) {
        case 'ArrowUp':
          if (!isH) { e.preventDefault(); this.value = this._model.value - this._model.step }
          break
        case 'ArrowDown':
          if (!isH) { e.preventDefault(); this.value = this._model.value + this._model.step }
          break
        case 'ArrowLeft':
          if (isH) { e.preventDefault(); this.value = this._model.value - this._model.step }
          break
        case 'ArrowRight':
          if (isH) { e.preventDefault(); this.value = this._model.value + this._model.step }
          break
        case 'PageUp':
          e.preventDefault(); this.value = this._model.value - this._model.pageStep
          break
        case 'PageDown':
          e.preventDefault(); this.value = this._model.value + this._model.pageStep
          break
        case 'Home':
          e.preventDefault(); this.value = this._model.min
          break
        case 'End':
          e.preventDefault(); this.value = this._model.max
          break
      }
    })
  }

  // ── Wheel ──

  private _bindWheel(): void {
    this._on(this as unknown as HTMLElement, 'wheel', (e) => {
      if (this._destroyed || !this._enabled) return
      e.preventDefault()
      if (e.deltaY > 0) this.value = this._model.value + this._model.step
      else if (e.deltaY < 0) this.value = this._model.value - this._model.step
    }, { passive: false } as AddEventListenerOptions)
  }

  // ── Shared ──

  private _fireChange(value: number, previousValue: number): void {
    const detail: ScrollBar2DChangeDetail = { value, previousValue }
    this.dispatchEvent(new CustomEvent('sb2d-change', { detail, bubbles: true, composed: true }))
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
  }
}

customElements.define('scrollbar2d-wc', UIScrollbar2DWC)

declare global {
  interface HTMLElementTagNameMap {
    'scrollbar2d-wc': UIScrollbar2DWC
  }
}
