import { describe, it, expect, afterEach } from 'vitest'
import { UIMenuBarWC } from '../ui-menubar-wc/ui-menubar-wc'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'
import { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'

function flush(ms = 10): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function pressKey(key: string, opts?: Partial<KeyboardEventInit>): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

describe('menubar-wc', () => {
  const cleanup: HTMLElement[] = []

  function createBar(opts?: ConstructorParameters<typeof UIMenuBarWC>[0]): UIMenuBarWC {
    const bar = new UIMenuBarWC(opts)
    bar.style.cssText = 'width:600px;display:flex;'
    document.body.appendChild(bar)
    cleanup.push(bar)
    return bar
  }

  function createItem(text: string): UIMenuItemWC {
    const item = new UIMenuItemWC({ text })
    cleanup.push(item)
    return item
  }

  function createPopup(anchor: HTMLElement): UIPopupWC {
    const popup = new UIPopupWC({ anchor, kind: 'menu', width: 180, height: 200 })
    document.body.appendChild(popup)
    cleanup.push(popup)
    return popup
  }

  function buildMenu(): { bar: UIMenuBarWC, items: UIMenuItemWC[], popups: UIPopupWC[] } {
    const bar = createBar()
    const items: UIMenuItemWC[] = []
    const popups: UIPopupWC[] = []

    for (const name of ['File', 'Edit', 'View']) {
      const item = createItem(name)
      items.push(item)

      const popup = createPopup(item)
      const sub1 = new UIMenuItemWC({ text: `${name} Action 1` })
      const sub2 = new UIMenuItemWC({ text: `${name} Action 2` })
      popup.addChild(sub1)
      popup.addChild(sub2)
      bar.addItem(item, popup)
      popups.push(popup)
    }

    return { bar, items, popups }
  }

  afterEach(async () => {
    for (const el of cleanup) {
      if (el.parentNode) el.remove()
      if ('destroy' in el && typeof (el as any).destroy === 'function') (el as any).destroy()
    }
    cleanup.length = 0
    document.querySelectorAll('window-wc').forEach(el => el.remove())
    await flush(50)
  })

  // ═══════════════════════════════════════
  // 1. Construction
  // ═══════════════════════════════════════

  describe('construction', () => {
    it('creates element with shadow DOM', () => {
      const bar = createBar()
      expect(bar).toBeInstanceOf(HTMLElement)
      expect(bar.shadowRoot).toBeTruthy()
    })

    it('registers as menubar-wc custom element', () => {
      const bar = document.createElement('menubar-wc')
      document.body.appendChild(bar)
      cleanup.push(bar)
      expect(bar).toBeInstanceOf(UIMenuBarWC)
    })
  })

  // ═══════════════════════════════════════
  // 2. Auto-detection of slotted children
  // ═══════════════════════════════════════

  describe('auto-detection', () => {
    it('detects menuitem-wc children added to the bar', async () => {
      const bar = createBar()
      const item1 = createItem('File')
      const item2 = createItem('Edit')
      bar.appendChild(item1)
      bar.appendChild(item2)
      await flush()

      expect(bar.getItems().length).toBe(2)
    })

    it('detects item removal', async () => {
      const bar = createBar()
      const item = createItem('File')
      bar.appendChild(item)
      await flush()
      expect(bar.getItems().length).toBe(1)

      item.remove()
      await flush()
      expect(bar.getItems().length).toBe(0)
    })
  })

  // ═══════════════════════════════════════
  // 3. Imperative addItem / removeItem
  // ═══════════════════════════════════════

  describe('addItem / removeItem', () => {
    it('addItem appends to DOM and is detected', async () => {
      const bar = createBar()
      const item = createItem('File')
      bar.addItem(item)
      await flush()

      expect(bar.contains(item)).toBe(true)
      expect(bar.getItems().length).toBe(1)
    })

    it('removeItem removes from DOM', async () => {
      const bar = createBar()
      const item = createItem('File')
      bar.addItem(item)
      await flush()

      bar.removeItem(item)
      await flush()
      expect(bar.getItems().length).toBe(0)
    })
  })

  // ═══════════════════════════════════════
  // 4. Click opens popup
  // ═══════════════════════════════════════

  describe('click behavior', () => {
    it('clicking an item opens its popup', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()

      expect(popups[0].visible).toBe(true)
    })

    it('clicking an item with open popup closes it', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(false)
    })
  })

  // ═══════════════════════════════════════
  // 5. Hover swap (popup already open)
  // ═══════════════════════════════════════

  describe('hover swap', () => {
    it('hovering another item while popup open closes current and opens new', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open File popup
      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      // Hover Edit
      items[1].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await flush()

      expect(popups[0].visible).toBe(false)
      expect(popups[1].visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 6. Keyboard navigation (bar level)
  // ═══════════════════════════════════════

  describe('keyboard navigation — bar level', () => {
    it('ArrowRight highlights next item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open and close to activate bar keyboard
      items[0].click()
      await flush()
      popups[0].close()
      await flush()

      // Now bar-level nav should work
      pressKey('ArrowRight')
      await flush()
      expect(items[1].highlighted).toBe(true)
    })

    it('ArrowLeft highlights previous item (wraps)', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      popups[0].close()
      await flush()

      pressKey('ArrowLeft')
      await flush()
      // Should wrap to last item (View)
      expect(items[2].highlighted).toBe(true)
    })

    it('Enter opens highlighted item popup', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open and close to activate bar keyboard
      items[0].click()
      await flush()
      pressKey('Escape')
      await flush()

      pressKey('Enter')
      await flush()
      expect(popups[0].visible).toBe(true)
    })

    it('ArrowDown opens highlighted item popup', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      pressKey('Escape')
      await flush()

      pressKey('ArrowDown')
      await flush()
      expect(popups[0].visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 7. Keyboard: popup boundary crossing
  // ═══════════════════════════════════════

  describe('keyboard — popup boundary to bar', () => {
    it('ArrowLeft at popup root closes popup and opens previous bar item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open Edit popup
      items[1].click()
      await flush()
      expect(popups[1].visible).toBe(true)

      // ArrowLeft at root level → should close Edit, open File
      pressKey('ArrowLeft')
      await flush()

      expect(popups[1].visible).toBe(false)
      expect(popups[0].visible).toBe(true)
    })

    it('ArrowRight at popup root (no sub-menu) closes popup and opens next bar item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open File popup
      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      // Navigate to an item with no sub-menu, then ArrowRight
      pressKey('ArrowDown') // highlight first item
      await flush()
      pressKey('ArrowRight') // no sub-menu → should cross to Edit
      await flush()

      expect(popups[0].visible).toBe(false)
      expect(popups[1].visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 8. Disabled
  // ═══════════════════════════════════════

  describe('disabled', () => {
    it('disabled bar prevents popup from opening on click', async () => {
      const { bar, items, popups } = buildMenu()
      await flush()

      bar.disabled = true
      items[0].click()
      await flush()

      expect(popups[0].visible).toBe(false)
    })

    it('disabled reflects as class', async () => {
      const bar = createBar()
      bar.disabled = true
      expect(bar.classList.contains('disabled')).toBe(true)
    })

    it('disabled = false re-enables interaction', async () => {
      const { bar, items, popups } = buildMenu()
      await flush()

      bar.disabled = true
      bar.disabled = false

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 9. Events
  // ═══════════════════════════════════════

  describe('events', () => {
    it('fires menubar-open when popup opens', async () => {
      const { bar, items } = buildMenu()
      await flush()

      let fired = false
      bar.addEventListener('menubar-open', () => { fired = true })

      items[0].click()
      await flush()
      expect(fired).toBe(true)
    })

    it('fires menubar-close when popup closes', async () => {
      const { bar, items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      let fired = false
      bar.addEventListener('menubar-close', () => { fired = true })

      popups[0].close()
      await flush()
      expect(fired).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 10. Destroy
  // ═══════════════════════════════════════

  describe('destroy', () => {
    it('cleans up without errors', async () => {
      const { bar } = buildMenu()
      await flush()
      bar.destroy()
      expect(() => bar.getItems()).not.toThrow()
    })
  })
})
