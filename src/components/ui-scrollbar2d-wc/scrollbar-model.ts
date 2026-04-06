export interface ScrollbarModelOptions {
  min: number
  max: number
  value: number
  visibleSize: number
  step: number
  pageStep: number
  trackLength: number
}

const MIN_THUMB = 20

export class ScrollbarModel {
  min: number
  max: number
  value: number
  visibleSize: number
  step: number
  pageStep: number
  trackLength: number

  constructor(opts: ScrollbarModelOptions) {
    this.min = opts.min
    this.max = opts.max
    this.visibleSize = opts.visibleSize
    this.step = Math.abs(opts.step) || 1
    this.pageStep = Math.abs(opts.pageStep) || 10
    this.trackLength = opts.trackLength
    this.value = this.clamp(opts.value)
  }

  get thumbSize(): number {
    const contentSize = (this.max - this.min) + this.visibleSize
    if (contentSize <= 0 || this.trackLength <= 0) return MIN_THUMB
    const raw = (this.visibleSize / contentSize) * this.trackLength
    return Math.min(Math.max(raw, MIN_THUMB), this.trackLength)
  }

  get thumbPosition(): number {
    const range = this.max - this.min
    if (range <= 0 || this.trackLength <= 0) return 0
    const available = this.trackLength - this.thumbSize
    if (available <= 0) return 0
    const ratio = (this.value - this.min) / range
    return ratio * available
  }

  setValue(v: number): number {
    this.value = this.clamp(v)
    return this.value
  }

  stepForward(): number {
    return this.setValue(this.value + this.step)
  }

  stepBackward(): number {
    return this.setValue(this.value - this.step)
  }

  pageForward(): number {
    return this.setValue(this.value + this.pageStep)
  }

  pageBackward(): number {
    return this.setValue(this.value - this.pageStep)
  }

  setFromThumbPosition(pos: number): number {
    const available = this.trackLength - this.thumbSize
    if (available <= 0) return this.setValue(this.min)
    const clamped = Math.max(0, Math.min(pos, available))
    const ratio = clamped / available
    const range = this.max - this.min
    return this.setValue(this.min + ratio * range)
  }

  private clamp(v: number): number {
    return Math.max(this.min, Math.min(this.max, v))
  }
}
