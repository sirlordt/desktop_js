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

    it('ArrowRight wraps from last to first item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Activate on last item (View)
      items[2].click()
      await flush()
      popups[2].close()
      await flush()

      pressKey('ArrowRight')
      await flush()
      expect(items[0].highlighted).toBe(true)
      expect(items[2].highlighted).toBe(false)
    })

    it('ArrowLeft wraps from first to last item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      popups[0].close()
      await flush()

      pressKey('ArrowLeft')
      await flush()
      expect(items[2].highlighted).toBe(true)
      expect(items[0].highlighted).toBe(false)
    })

    it('ArrowRight clears previous highlight before setting new', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      popups[0].close()
      await flush()

      // File is highlighted (index 0)
      expect(items[0].highlighted).toBe(true)

      pressKey('ArrowRight')
      await flush()

      // Only Edit should be highlighted
      expect(items[0].highlighted).toBe(false)
      expect(items[1].highlighted).toBe(true)
      expect(items[2].highlighted).toBe(false)
    })

    it('multiple ArrowRight steps cycle through all items', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      popups[0].close()
      await flush()

      // File → Edit
      pressKey('ArrowRight')
      await flush()
      expect(items[1].highlighted).toBe(true)

      // Edit → View
      pressKey('ArrowRight')
      await flush()
      expect(items[2].highlighted).toBe(true)

      // View → File (wrap)
      pressKey('ArrowRight')
      await flush()
      expect(items[0].highlighted).toBe(true)
    })

    it('Escape at bar level deactivates bar and clears highlight', async () => {
      const { items } = buildMenu()
      await flush()

      // Activate bar via focus (no popup involved, so no _popupJustClosed)
      items[0].focus()
      await flush()
      expect(items[0].highlighted).toBe(true)

      // Escape at bar level: deactivates bar
      pressKey('Escape')
      await flush()

      expect(items[0].highlighted).toBe(false)
      expect(items[1].highlighted).toBe(false)
      expect(items[2].highlighted).toBe(false)
    })

    it('Escape closes popup, returns to bar-level with highlight', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      // Escape 1: closes popup — _onPopupClosed re-highlights the item
      pressKey('Escape')
      await flush()
      expect(popups[0].visible).toBe(false)
      expect(items[0].highlighted).toBe(true)

      // Escape 2: consumed by _popupJustClosed guard (still highlighted)
      pressKey('Escape')
      await flush()

      // Escape 3: actually deactivates bar
      pressKey('Escape')
      await flush()
      expect(items[0].highlighted).toBe(false)
    })

    it('after full Escape sequence, arrows do nothing', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()

      // Escape 1: close popup, Escape 2: skip (popupJustClosed), Escape 3: deactivate bar
      pressKey('Escape')
      await flush()
      pressKey('Escape')
      await flush()
      pressKey('Escape')
      await flush()

      pressKey('ArrowRight')
      await flush()
      expect(items[0].highlighted).toBe(false)
      expect(items[1].highlighted).toBe(false)
      expect(items[2].highlighted).toBe(false)
    })

    it('disabled bar ignores keyboard navigation', async () => {
      const { bar, items } = buildMenu()
      await flush()

      bar.disabled = true
      // Try to activate via focus
      items[0].focus()
      await flush()

      pressKey('ArrowRight')
      await flush()
      expect(items[1].highlighted).toBe(false)
    })
  })

  // ═══════════════════════════════════════
  // 7. Keyboard: focus-based activation (Tab)
  // ═══════════════════════════════════════

  describe('keyboard — Tab focus activation', () => {
    it('focus on item activates bar and highlights item', async () => {
      const { items } = buildMenu()
      await flush()

      items[0].focus()
      await flush()

      expect(items[0].highlighted).toBe(true)
    })

    it('focus on item then ArrowRight moves highlight', async () => {
      const { items } = buildMenu()
      await flush()

      items[0].focus()
      await flush()
      expect(items[0].highlighted).toBe(true)

      pressKey('ArrowRight')
      await flush()
      expect(items[0].highlighted).toBe(false)
      expect(items[1].highlighted).toBe(true)
    })

    it('focus on item then Enter opens popup', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].focus()
      await flush()

      pressKey('Enter')
      await flush()
      expect(popups[0].visible).toBe(true)
    })

    it('focus on item then ArrowDown opens popup', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[1].focus()
      await flush()

      pressKey('ArrowDown')
      await flush()
      expect(popups[1].visible).toBe(true)
    })

    it('blur clears highlight when focus leaves the bar', async () => {
      const { items } = buildMenu()
      await flush()

      // Create an external element to move focus to
      const external = document.createElement('button')
      external.textContent = 'Outside'
      document.body.appendChild(external)
      cleanup.push(external)

      items[0].focus()
      await flush()
      expect(items[0].highlighted).toBe(true)

      external.focus()
      await flush(50) // wait for rAF in blur handler

      expect(items[0].highlighted).toBe(false)
    })
  })

  // ═══════════════════════════════════════
  // 8. Keyboard: popup boundary crossing
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

    it('ArrowLeft at popup root wraps to last bar item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open File popup (first item)
      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      // ArrowLeft → should wrap to View (last item)
      pressKey('ArrowLeft')
      await flush()

      expect(popups[0].visible).toBe(false)
      expect(popups[2].visible).toBe(true)
    })

    it('ArrowRight at popup root wraps to first bar item', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open View popup (last item)
      items[2].click()
      await flush()
      expect(popups[2].visible).toBe(true)

      // ArrowRight → should wrap to File (first item)
      pressKey('ArrowRight')
      await flush()

      expect(popups[2].visible).toBe(false)
      expect(popups[0].visible).toBe(true)
    })

    it('active item changes when crossing with ArrowLeft', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[2].click() // Open View
      await flush()
      expect(items[2].active).toBe(true)

      pressKey('ArrowLeft') // Cross to Edit
      await flush()

      expect(items[2].active).toBe(false)
      expect(items[1].active).toBe(true)
      expect(popups[1].visible).toBe(true)
    })

    it('active item changes when crossing with ArrowRight', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click() // Open File
      await flush()
      expect(items[0].active).toBe(true)

      pressKey('ArrowRight') // Cross to Edit
      await flush()

      expect(items[0].active).toBe(false)
      expect(items[1].active).toBe(true)
      expect(popups[1].visible).toBe(true)
    })

    it('Escape closes popup and returns to bar-level nav', async () => {
      const { items, popups } = buildMenu()
      await flush()

      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      pressKey('Escape')
      await flush()
      expect(popups[0].visible).toBe(false)

      // Bar should still be active with File highlighted
      expect(items[0].highlighted).toBe(true)

      // ArrowRight should now work at bar level
      pressKey('ArrowRight')
      await flush()
      expect(items[1].highlighted).toBe(true)
    })

    it('rapid ArrowLeft crossing opens correct popups in sequence', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open View
      items[2].click()
      await flush()
      expect(popups[2].visible).toBe(true)

      // ArrowLeft → Edit
      pressKey('ArrowLeft')
      await flush()
      expect(popups[1].visible).toBe(true)

      // ArrowLeft → File
      pressKey('ArrowLeft')
      await flush()
      expect(popups[0].visible).toBe(true)

      // ArrowLeft → View (wrap)
      pressKey('ArrowLeft')
      await flush()
      expect(popups[2].visible).toBe(true)
    })

    it('rapid ArrowRight crossing opens correct popups in sequence', async () => {
      const { items, popups } = buildMenu()
      await flush()

      // Open File
      items[0].click()
      await flush()
      expect(popups[0].visible).toBe(true)

      // ArrowRight → Edit
      pressKey('ArrowRight')
      await flush()
      expect(popups[1].visible).toBe(true)

      // ArrowRight → View
      pressKey('ArrowRight')
      await flush()
      expect(popups[2].visible).toBe(true)

      // ArrowRight → File (wrap)
      pressKey('ArrowRight')
      await flush()
      expect(popups[0].visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 9. Multi-bar isolation
  // ═══════════════════════════════════════

  describe('multi-bar isolation', () => {
    it('clicking on bar A deactivates bar B', async () => {
      const { items: itemsA, popups: popupsA } = buildMenu()
      await flush()

      // Create a second bar
      const bar2 = createBar()
      const itemsB: UIMenuItemWC[] = []
      const popupsB: UIPopupWC[] = []
      for (const name of ['Alpha', 'Beta']) {
        const item = createItem(name)
        itemsB.push(item)
        const popup = createPopup(item)
        popup.addChild(new UIMenuItemWC({ text: `${name} Action` }))
        bar2.addItem(item, popup)
        popupsB.push(popup)
      }
      await flush()

      // Activate bar A
      itemsA[0].click()
      await flush()
      expect(popupsA[0].visible).toBe(true)

      // Click on bar B item — should close bar A popup
      itemsB[0].click()
      await flush()
      expect(popupsA[0].visible).toBe(false)
      expect(popupsB[0].visible).toBe(true)
    })

    it('focusing bar B clears bar A highlight', async () => {
      const { items: itemsA, popups: popupsA } = buildMenu()
      await flush()

      // Create a second bar
      const bar2 = createBar()
      const itemsB: UIMenuItemWC[] = []
      for (const name of ['Alpha', 'Beta']) {
        const item = createItem(name)
        itemsB.push(item)
        const popup = createPopup(item)
        popup.addChild(new UIMenuItemWC({ text: `${name} Action` }))
        bar2.addItem(item, popup)
      }
      await flush()

      // Activate bar A via focus
      itemsA[0].focus()
      await flush()
      expect(itemsA[0].highlighted).toBe(true)

      // Focus bar B item
      itemsB[0].focus()
      await flush()
      expect(itemsA[0].highlighted).toBe(false)
      expect(itemsB[0].highlighted).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 10. Disabled
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
  // 11. Events
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
  // 12. Destroy
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
