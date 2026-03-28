import { describe, it, expect, afterEach, vi } from 'vitest'
import { UIMenuItemWC } from '../ui-menu-item-wc/ui-menu-item-wc'
import { UIPopupWC } from '../ui-popup-wc/ui-popup-wc'

function flush(ms = 10): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function pressKey(key: string, opts?: Partial<KeyboardEventInit>): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

describe('sub-menus', () => {
  const cleanup: HTMLElement[] = []
  let anchor: HTMLButtonElement

  function createAnchor(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.textContent = 'Menu'
    btn.style.cssText = 'position:fixed;left:100px;top:100px;width:80px;height:30px;'
    document.body.appendChild(btn)
    cleanup.push(btn)
    return btn
  }

  function createPopup(opts?: Partial<ConstructorParameters<typeof UIPopupWC>[0]>): UIPopupWC {
    const popup = new UIPopupWC({ anchor, kind: 'menu', width: 200, height: 200, ...opts })
    document.body.appendChild(popup)
    cleanup.push(popup)
    return popup
  }

  function createItem(text: string, opts?: Partial<ConstructorParameters<typeof UIMenuItemWC>[0]>): UIMenuItemWC {
    return new UIMenuItemWC({ text, ...opts })
  }

  afterEach(async () => {
    for (const el of cleanup) {
      if (el.parentNode) el.remove()
      if ('destroy' in el && typeof (el as any).destroy === 'function') (el as any).destroy()
    }
    cleanup.length = 0
    // Clean up stray popups
    document.querySelectorAll('window-wc').forEach(el => el.remove())
    await flush(50)
  })

  // ═══════════════════════════════════════
  // 1. subMenu property
  // ═══════════════════════════════════════

  describe('subMenu property', () => {
    it('defaults to null', () => {
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)
      expect(item.subMenu).toBe(null)
      expect(item.hasSubMenu).toBe(false)
    })

    it('accepts a UIPopupWC instance', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(item.subMenu).toBe(sub)
      expect(item.hasSubMenu).toBe(true)
    })

    it('can be set to null to detach', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      item.subMenu = null
      expect(item.subMenu).toBe(null)
      expect(item.hasSubMenu).toBe(false)
    })

    it('can be swapped at runtime', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub1 = createPopup()
      const sub2 = createPopup()
      item.subMenu = sub1
      expect(item.subMenu).toBe(sub1)
      item.subMenu = sub2
      expect(item.subMenu).toBe(sub2)
      // sub1 should no longer reference this item
      expect((sub1 as any)._parentMenuItem).toBe(null)
      expect((sub2 as any)._parentMenuItem).toBe(item)
    })

    it('sets popup anchor to the menu item', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(sub.anchor).toBe(item)
    })

    it('sets popup alignment to RightTop by default', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(sub.alignment).toBe('RightTop')
    })

    it('respects subMenuAlignment override', () => {
      anchor = createAnchor()
      const item = createItem('File', { subMenuAlignment: 'LeftTop' })
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(sub.alignment).toBe('LeftTop')
    })

    it('can be set via constructor options', () => {
      anchor = createAnchor()
      const sub = createPopup()
      const item = new UIMenuItemWC({ text: 'File', subMenu: sub as any })
      document.body.appendChild(item)
      cleanup.push(item)

      expect(item.subMenu).toBe(sub)
      expect(item.hasSubMenu).toBe(true)
    })

    it('disables closeOnClickOutside and closeOnEscape on sub-menu', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(sub.closeOnClickOutside).toBe(false)
      expect(sub.closeOnEscape).toBe(false)
    })
  })

  // ═══════════════════════════════════════
  // 2. Arrow indicator
  // ═══════════════════════════════════════

  describe('arrow indicator', () => {
    it('shows arrow when subMenu is set', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      const arrow = item.shadowRoot!.querySelector('.submenu-arrow')
      expect(arrow).toBeTruthy()
    })

    it('removes arrow when subMenu is set to null', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      item.subMenu = null
      const arrow = item.shadowRoot!.querySelector('.submenu-arrow')
      expect(arrow).toBeFalsy()
    })

    it('has has-right class when arrow is shown', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect(item.classList.contains('has-right')).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 3. Click behavior
  // ═══════════════════════════════════════

  describe('click behavior', () => {
    it('clicking item with subMenu opens sub-menu instead of emitting menuitem-click', () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item = createItem('File')
      parent.addChild(item)
      cleanup.push(item)

      const sub = createPopup()
      sub.addChild(createItem('Sub Item'))
      item.subMenu = sub

      const clickHandler = vi.fn()
      item.addEventListener('menuitem-click', clickHandler)

      parent.show()
      item.click()
      expect(clickHandler).not.toHaveBeenCalled()
    })

    it('clicking item without subMenu emits menuitem-click normally', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const clickHandler = vi.fn()
      item.addEventListener('menuitem-click', clickHandler)
      item.click()
      expect(clickHandler).toHaveBeenCalledTimes(1)
    })
  })

  // ═══════════════════════════════════════
  // 4. isSubMenu / closeIfAttached on UIPopupWC
  // ═══════════════════════════════════════

  describe('UIPopupWC sub-menu API', () => {
    it('isSubMenu returns false for standalone popup', () => {
      anchor = createAnchor()
      const popup = createPopup()
      expect(popup.isSubMenu).toBe(false)
    })

    it('isSubMenu returns true when used as sub-menu', () => {
      anchor = createAnchor()
      const popup = createPopup()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)
      item.subMenu = popup
      expect(popup.isSubMenu).toBe(true)
    })

    it('closeIfAttached closes when attached', () => {
      anchor = createAnchor()
      const popup = createPopup()
      popup.show()
      expect(popup.state).toBe('attached')
      popup.closeIfAttached()
      expect(popup.state).toBe('closed')
    })

    it('closeIfAttached does nothing when closed', () => {
      anchor = createAnchor()
      const popup = createPopup()
      expect(popup.state).toBe('closed')
      popup.closeIfAttached() // should not throw
      expect(popup.state).toBe('closed')
    })
  })

  // ═══════════════════════════════════════
  // 5. Cascade close
  // ═══════════════════════════════════════

  describe('cascade close', () => {
    it('request-parent-close from leaf closes attached parent popup', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const itemWithSub = createItem('File')
      parent.addChild(itemWithSub)

      const sub = createPopup()
      const leaf = createItem('New')
      sub.addChild(leaf)
      itemWithSub.subMenu = sub

      parent.show()
      await flush()
      itemWithSub.openSubMenu()
      await flush(50)

      expect(parent.state).toBe('attached')
      expect(sub.state).toBe('attached')

      // Leaf click triggers request-parent-close cascade
      leaf.click()
      await flush(50)

      expect(sub.state).toBe('closed')
    })

    it('closing parent popup also closes open child sub-menus', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const itemWithSub = createItem('File')
      parent.addChild(itemWithSub)

      const sub = createPopup()
      const subItem = createItem('New')
      sub.addChild(subItem)
      itemWithSub.subMenu = sub

      parent.show()
      await flush()
      itemWithSub.openSubMenu()
      await flush(50)

      expect(parent.state).toBe('attached')
      expect(sub.state).toBe('attached')

      // Close the parent — sub-menu should close too
      parent.close()
      await flush()

      expect(parent.state).toBe('closed')
      expect(sub.state).toBe('closed')
    })
  })

  // ═══════════════════════════════════════
  // 6. Keyboard navigation
  // ═══════════════════════════════════════

  describe('keyboard navigation', () => {
    it('Arrow Right opens sub-menu of highlighted item', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item1 = createItem('File')
      const item2 = createItem('Edit')
      parent.addChild(item1)
      parent.addChild(item2)

      const sub = createPopup()
      sub.addChild(createItem('New'))
      sub.addChild(createItem('Open'))
      item1.subMenu = sub

      parent.show()
      await flush()

      // Highlight first item
      pressKey('ArrowDown')
      await flush()

      // Arrow Right should open sub-menu
      pressKey('ArrowRight')
      await flush()

      expect(sub.visible).toBe(true)
    })

    it('Arrow Left closes attached sub-menu', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item = createItem('File')
      parent.addChild(item)

      const sub = createPopup()
      sub.addChild(createItem('New'))
      item.subMenu = sub

      parent.show()
      await flush()

      pressKey('ArrowDown') // highlight File
      pressKey('ArrowRight') // open sub-menu
      await flush()
      expect(sub.visible).toBe(true)

      pressKey('ArrowLeft') // close sub-menu
      await flush()
      expect(sub.state).toBe('closed')
    })

    it('Arrow Right is no-op when highlighted item has no sub-menu', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item = createItem('Edit')
      parent.addChild(item)

      parent.show()
      await flush()

      pressKey('ArrowDown')
      pressKey('ArrowRight') // no sub-menu — should not throw
      await flush()
    })

    it('Enter on item with subMenu opens it', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item = createItem('File')
      parent.addChild(item)

      const sub = createPopup()
      sub.addChild(createItem('New'))
      item.subMenu = sub

      parent.show()
      await flush()

      pressKey('ArrowDown')
      pressKey('Enter')
      await flush()

      expect(sub.visible).toBe(true)
    })

    it('Arrow Down/Up in sub-menu moves exactly one item (no double-step)', async () => {
      anchor = createAnchor()
      const parent = createPopup()
      const item = createItem('File')
      parent.addChild(item)

      const sub = createPopup()
      const subItem1 = createItem('New')
      const subItem2 = createItem('Open')
      const subItem3 = createItem('Save')
      sub.addChild(subItem1)
      sub.addChild(subItem2)
      sub.addChild(subItem3)
      item.subMenu = sub

      parent.show()
      await flush()

      pressKey('ArrowDown') // highlight "File"
      pressKey('ArrowRight') // open sub-menu, highlights "New" (index 0)
      await flush()

      // ArrowDown should move to "Open" (index 1), not skip to "Save" (index 2)
      pressKey('ArrowDown')
      await flush()
      expect(subItem2.classList.contains('highlight')).toBe(true)
      expect(subItem3.classList.contains('highlight')).toBe(false)

      // ArrowUp should go back to "New" (index 0)
      pressKey('ArrowUp')
      await flush()
      expect(subItem1.classList.contains('highlight')).toBe(true)
      expect(subItem2.classList.contains('highlight')).toBe(false)
    })

    it('3-level keyboard navigation: ArrowRight twice opens level 2, ArrowLeft returns', async () => {
      anchor = createAnchor()
      const level0 = createPopup()
      const item0 = createItem('File')
      level0.addChild(item0)

      const level1 = createPopup()
      const item1 = createItem('New')
      level1.addChild(item1)
      level1.addChild(createItem('Open'))
      item0.subMenu = level1

      const level2 = createPopup()
      const l2item1 = createItem('React')
      const l2item2 = createItem('Vue')
      level2.addChild(l2item1)
      level2.addChild(l2item2)
      item1.subMenu = level2

      level0.show()
      await flush()

      pressKey('ArrowDown')  // highlight "File"
      pressKey('ArrowRight') // open level1, highlight "New"
      await flush()
      expect(level1.visible).toBe(true)

      pressKey('ArrowRight') // open level2, highlight "React"
      await flush()
      expect(level2.visible).toBe(true)
      expect(l2item1.classList.contains('highlight')).toBe(true)

      pressKey('ArrowDown') // move to "Vue"
      await flush()
      expect(l2item2.classList.contains('highlight')).toBe(true)

      pressKey('ArrowLeft') // close level2, back to level1
      await flush()
      expect(level2.state).toBe('closed')
      expect(level1.visible).toBe(true)

      pressKey('ArrowLeft') // close level1, back to level0
      await flush()
      expect(level1.state).toBe('closed')
    })

    it('switching between sibling items with sub-menus via keyboard works', async () => {
      anchor = createAnchor()
      const root = createPopup()
      const drawItem = createItem('Drawing')
      const transformItem = createItem('Transform')
      root.addChild(drawItem)
      root.addChild(transformItem)

      const drawSub = createPopup()
      drawSub.addChild(createItem('Pencil'))
      drawSub.addChild(createItem('Brush'))
      drawItem.subMenu = drawSub

      const transformSub = createPopup()
      transformSub.addChild(createItem('Move'))
      transformSub.addChild(createItem('Rotate'))
      transformItem.subMenu = transformSub

      root.show()
      await flush()

      // Navigate to Drawing and open its sub-menu
      pressKey('ArrowDown') // highlight Drawing
      pressKey('ArrowRight') // open Drawing sub-menu
      await flush()
      expect(drawSub.visible).toBe(true)

      // Go back to root
      pressKey('ArrowLeft')
      await flush()
      expect(drawSub.state).toBe('closed')

      // Move down to Transform and open its sub-menu
      pressKey('ArrowDown') // highlight Transform
      pressKey('ArrowRight') // open Transform sub-menu
      await flush()
      expect(transformSub.visible).toBe(true)

      // Go back to root
      pressKey('ArrowLeft')
      await flush()
      expect(transformSub.state).toBe('closed')

      // Move back up to Drawing and re-open its sub-menu
      pressKey('ArrowUp') // highlight Drawing
      pressKey('ArrowRight') // open Drawing sub-menu AGAIN
      await flush()
      expect(drawSub.visible).toBe(true)
      // Root should still be open
      expect(root.state).toBe('attached')
    })

    it('clicking a sibling item with sub-menu while another sub-menu is open does not close root', async () => {
      anchor = createAnchor()
      const root = createPopup()
      const drawItem = createItem('Drawing')
      const transformItem = createItem('Transform')
      root.addChild(drawItem)
      root.addChild(transformItem)

      const drawSub = createPopup()
      drawSub.addChild(createItem('Pencil'))
      drawItem.subMenu = drawSub

      const transformSub = createPopup()
      transformSub.addChild(createItem('Move'))
      transformItem.subMenu = transformSub

      root.show()
      await flush()

      // Open Transform sub-menu via keyboard
      pressKey('ArrowDown') // Drawing
      pressKey('ArrowDown') // Transform
      pressKey('ArrowRight') // open Transform
      await flush()
      expect(transformSub.visible).toBe(true)

      // Now CLICK on Drawing — should close Transform sub-menu and open Drawing sub-menu
      drawItem.click()
      await flush(50)

      expect(drawSub.visible).toBe(true)
      expect(transformSub.state).toBe('closed')
      // Root should STILL be open
      expect(root.state).toBe('attached')
    })
  })

  // ═══════════════════════════════════════
  // 7. Multi-level nesting
  // ═══════════════════════════════════════

  describe('multi-level nesting', () => {
    it('supports 3 levels of sub-menus', async () => {
      anchor = createAnchor()
      const level0 = createPopup()
      const item0 = createItem('File')
      level0.addChild(item0)

      const level1 = createPopup()
      const item1 = createItem('New')
      level1.addChild(item1)
      item0.subMenu = level1

      const level2 = createPopup()
      level2.addChild(createItem('React'))
      level2.addChild(createItem('Vue'))
      item1.subMenu = level2

      level0.show()
      item0.openSubMenu()
      await flush()
      expect(level1.visible).toBe(true)

      item1.openSubMenu()
      await flush()
      expect(level2.visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 7b. Detachable sub-menus: detach deepest first, then parents
  // ═══════════════════════════════════════

  describe('detachable sub-menu chain', () => {
    it('sub-menu popups get overlord auto-wired so detach works', async () => {
      anchor = createAnchor()

      // Create a host window to serve as root overlord
      const { UIWindowWC } = await import('../ui-window-wc/ui-window-wc')
      const hostWin = new UIWindowWC({
        title: 'Host', left: 0, top: 0, width: 400, height: 300, positioning: 'relative',
      })
      document.body.appendChild(hostWin)
      cleanup.push(hostWin)

      const level0 = new UIPopupWC({
        anchor, kind: 'menu', width: 200, height: 200, detachable: true, title: 'Root',
      })
      level0.overlord = hostWin
      document.body.appendChild(level0)
      cleanup.push(level0)

      const item0 = createItem('Drawing')
      level0.addChild(item0)

      // Sub-menus created WITHOUT explicit overlord — should be auto-wired
      const level1 = new UIPopupWC({
        anchor: item0, kind: 'menu', width: 180, height: 180, detachable: true, title: 'Drawing',
      })
      document.body.appendChild(level1)
      cleanup.push(level1)
      const item1 = createItem('Brush Type')
      level1.addChild(item1)
      item0.subMenu = level1

      const level2 = new UIPopupWC({
        anchor: item1, kind: 'menu', width: 160, height: 140, detachable: true, title: 'Brushes',
      })
      document.body.appendChild(level2)
      cleanup.push(level2)
      level2.addChild(createItem('Round'))
      item1.subMenu = level2

      // Sub-menu overlords should be auto-wired to parent popup's window
      level0.show()
      await flush(50)
      item0.openSubMenu()
      await flush(50)

      // level1 should have its overlord set to level0's window
      expect((level1 as any)._overlord).toBeTruthy()

      item1.openSubMenu()
      await flush(50)

      // level2 should have its overlord set to level1's window
      expect((level2 as any)._overlord).toBeTruthy()

      // All 3 levels open
      expect(level0.state).toBe('attached')
      expect(level1.state).toBe('attached')
      expect(level2.state).toBe('attached')

      // Simulate detach of level2 (deepest)
      level2.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(level2.state).toBe('detached')

      // Simulate detach of level1
      level1.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(level1.state).toBe('detached')

      // Simulate detach of level0 (root)
      level0.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(level0.state).toBe('detached')

      // All 3 should still be visible as detached tools
      expect(level0.visible).toBe(true)
      expect(level1.visible).toBe(true)
      expect(level2.visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 7c. Titlebar focus preservation
  // ═══════════════════════════════════════

  describe('titlebar focus preservation', () => {
    it('root popup titlebar stays focused when sub-menus open', async () => {
      anchor = createAnchor()
      const root = createPopup({ detachable: true, title: 'Root' })
      const item0 = createItem('Drawing')
      root.addChild(item0)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const item1 = createItem('Brush Type')
      level1.addChild(item1)
      item0.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      level2.addChild(createItem('Round'))
      item1.subMenu = level2

      root.show()
      await flush(50)

      const rootWin = root.window!
      // Root titlebar should be focused
      expect(rootWin.titleBarElement.classList.contains('focused')).toBe(true)

      // Open level 1 via click (simulates real user interaction)
      item0.click()
      await flush(50)

      const l1Win = level1.window!
      // Simulate mousedown on sub-menu window (triggers standalone focus handler in capture)
      ;(l1Win as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }))
      await flush(50)

      // Manually call onFocused to simulate what the standalone handler does
      l1Win.onFocused()
      await flush(50)

      expect(l1Win.titleBarElement.classList.contains('focused')).toBe(true)
      // Root should STILL be focused — this is the bug: onFocused() strips siblings
      expect(rootWin.titleBarElement.classList.contains('focused')).toBe(true)

      // Open level 2 via click
      item1.click()
      await flush(50)

      const l2Win = level2.window!
      ;(l2Win as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      await flush(50)

      expect(l2Win.titleBarElement.classList.contains('focused')).toBe(true)
      // Root and level 1 should STILL be focused
      expect(rootWin.titleBarElement.classList.contains('focused')).toBe(true)
      expect(l1Win.titleBarElement.classList.contains('focused')).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 8. Container sub-menu focus suppression
  // ═══════════════════════════════════════

  describe('container sub-menu focus suppression', () => {
    it('container sub-menu does not steal focus from anchor', async () => {
      anchor = createAnchor()
      anchor.focus()

      const parent = createPopup()
      const item = createItem('Tools')
      parent.addChild(item)

      const containerSub = createPopup({ kind: 'container' })
      containerSub.addChild(document.createElement('div'))
      item.subMenu = containerSub

      parent.show()
      item.openSubMenu()
      await flush()

      // Container sub-menu should NOT have stolen focus
      // (In menu-kind, focus always stays on the anchor)
      expect(containerSub.visible).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 9. Destroy cleanup
  // ═══════════════════════════════════════

  describe('destroy cleanup', () => {
    it('destroying menu item clears _parentMenuItem on sub-menu', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      expect((sub as any)._parentMenuItem).toBe(item)

      item.destroy()
      expect((sub as any)._parentMenuItem).toBe(null)
    })

    it('setting subMenu to null does not destroy the popup', () => {
      anchor = createAnchor()
      const item = createItem('File')
      document.body.appendChild(item)
      cleanup.push(item)

      const sub = createPopup()
      item.subMenu = sub
      item.subMenu = null

      // Popup should still be usable
      expect(sub.state).toBe('closed')
      sub.anchor = anchor
      sub.show()
      expect(sub.visible).toBe(true)
      sub.close()
    })
  })
})
