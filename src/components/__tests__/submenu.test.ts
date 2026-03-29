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
  // 7c. Keyboard nav to detached sub-menu
  // ═══════════════════════════════════════

  describe('keyboard navigation to detached sub-menu', () => {
    it('ArrowRight on item with detached sub-menu highlights first item in tool window', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      const subItem0 = createItem('Pencil')
      const subItem1 = createItem('Eraser')
      const subItem2 = createItem('Fill')
      sub.addChild(subItem0)
      sub.addChild(subItem1)
      sub.addChild(subItem2)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Open sub-menu via keyboard
      pressKey('ArrowDown')  // highlight Select All
      pressKey('ArrowDown')  // highlight Drawing
      pressKey('ArrowRight') // open sub-menu
      await flush(50)
      expect(sub.state).toBe('attached')

      // Detach the sub-menu
      sub.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(sub.state).toBe('detached')

      // Navigate back to root: ArrowLeft clears sub-menu delegation,
      // but Drawing stays highlighted in root (activeIndex unchanged)
      pressKey('ArrowLeft')
      await flush()
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // ArrowRight on Drawing (still highlighted) → redirect nav to detached sub-menu
      pressKey('ArrowRight')
      await flush()

      // The detached sub-menu should have its first item highlighted
      expect(subItem0.classList.contains('highlight')).toBe(true)

      // ArrowDown should navigate within the detached sub-menu
      pressKey('ArrowDown')
      await flush()
      expect(subItem0.classList.contains('highlight')).toBe(false)
      expect(subItem1.classList.contains('highlight')).toBe(true)

      // ArrowLeft should return to root popup
      pressKey('ArrowLeft')
      await flush()
      expect(subItem1.classList.contains('highlight')).toBe(false)
      // Drawing should still be highlighted in root
      expect(itemDrawing.classList.contains('highlight')).toBe(true)
    })

    it('ArrowRight navigates to sub-menu detached via mouse hover', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      const subItem0 = createItem('Pencil')
      const subItem1 = createItem('Eraser')
      sub.addChild(subItem0)
      sub.addChild(subItem1)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Open sub-menu via mouse hover (simulated by calling openSubMenu directly)
      itemDrawing.openSubMenu()
      await flush(50)
      expect(sub.state).toBe('attached')

      // Detach the sub-menu via drag
      sub.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(sub.state).toBe('detached')

      // Now navigate via keyboard: highlight Drawing, press ArrowRight
      pressKey('ArrowDown')  // highlight Select All
      pressKey('ArrowDown')  // highlight Drawing
      pressKey('ArrowRight') // should redirect to detached sub-menu
      await flush()

      expect(subItem0.classList.contains('highlight')).toBe(true)

      // Navigate and return
      pressKey('ArrowDown')
      expect(subItem1.classList.contains('highlight')).toBe(true)
      pressKey('ArrowLeft')
      await flush()
      expect(itemDrawing.classList.contains('highlight')).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 7c-2. Detached ROOT popup: ArrowRight/Enter open sub-menus
  // ═══════════════════════════════════════

  describe('detached root popup sub-menu keyboard nav', () => {
    it('ArrowRight opens sub-menu when root popup is detached', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      const subItem0 = createItem('Pencil')
      const subItem1 = createItem('Eraser')
      sub.addChild(subItem0)
      sub.addChild(subItem1)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Detach the ROOT popup itself
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      // Focus anchor so detached nav activates
      anchor.focus()
      await flush()

      // Navigate down to Drawing
      pressKey('ArrowDown')  // highlight Select All
      pressKey('ArrowDown')  // highlight Drawing
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // ArrowRight should open the sub-menu (attached) or navigate to detached
      pressKey('ArrowRight')
      await flush(50)

      // Sub-menu should be visible and first item highlighted
      expect(sub.visible).toBe(true)
      expect(subItem0.classList.contains('highlight')).toBe(true)
    })

    it('ArrowDown navigates within opened sub-menu, not parent', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      const subItem0 = createItem('Pencil')
      const subItem1 = createItem('Eraser')
      const subItem2 = createItem('Fill')
      sub.addChild(subItem0)
      sub.addChild(subItem1)
      sub.addChild(subItem2)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Detach the ROOT popup
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Navigate to Drawing and open sub-menu
      pressKey('ArrowDown')  // highlight Select All
      pressKey('ArrowDown')  // highlight Drawing
      pressKey('ArrowRight') // open sub-menu → Pencil highlighted
      await flush(50)
      expect(subItem0.classList.contains('highlight')).toBe(true)

      // ArrowDown should move within sub-menu, NOT parent
      pressKey('ArrowDown')
      await flush()
      expect(subItem1.classList.contains('highlight')).toBe(true)
      // Parent's highlight should still be on Drawing (unchanged)
      expect(itemDrawing.classList.contains('highlight')).toBe(true)
      expect(itemFlatten.classList.contains('highlight')).toBe(false)

      // ArrowDown again
      pressKey('ArrowDown')
      await flush()
      expect(subItem2.classList.contains('highlight')).toBe(true)

      // ArrowUp should go back within sub-menu
      pressKey('ArrowUp')
      await flush()
      expect(subItem1.classList.contains('highlight')).toBe(true)

      // ArrowLeft should return control to parent
      pressKey('ArrowLeft')
      await flush()
      expect(subItem1.classList.contains('highlight')).toBe(false)
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // ArrowDown should now move within parent again
      pressKey('ArrowDown')
      await flush()
      expect(itemFlatten.classList.contains('highlight')).toBe(true)
    })

    it('Enter on sub-menu item closes attached sub-menu and returns control to detached parent', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      let pencilClicked = false
      const subItemPencil = createItem('Pencil')
      subItemPencil.onClick(() => { pencilClicked = true })
      const subItemEraser = createItem('Eraser')
      sub.addChild(subItemPencil)
      sub.addChild(subItemEraser)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Detach the ROOT popup
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Navigate to Drawing → open sub-menu → highlight Pencil
      pressKey('ArrowDown')   // Select All
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open sub-menu, highlight Pencil
      await flush(50)
      expect(sub.state).toBe('attached')
      expect(subItemPencil.classList.contains('highlight')).toBe(true)

      // Press Enter on Pencil — should click, close sub-menu, return control to parent
      pressKey('Enter')
      await flush(100)
      expect(pencilClicked).toBe(true)
      expect(sub.state).toBe('closed')

      // Parent should still be detached and Drawing still highlighted
      expect(root.state).toBe('detached')
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // Arrow keys should now control the PARENT, not the dead sub-menu
      pressKey('ArrowDown')
      await flush()
      expect(itemFlatten.classList.contains('highlight')).toBe(true)
      expect(itemDrawing.classList.contains('highlight')).toBe(false)
    })

    it('delegated nav works for 3-level deep sub-menus in detached root', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemDrawing = createItem('Drawing')
      root.addChild(itemDrawing)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Item0 = createItem('Brush Type')
      const l1Item1 = createItem('Eraser')
      level1.addChild(l1Item0)
      level1.addChild(l1Item1)
      itemDrawing.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      const l2Item0 = createItem('Round')
      const l2Item1 = createItem('Flat')
      level2.addChild(l2Item0)
      level2.addChild(l2Item1)
      l1Item0.subMenu = level2

      root.show()
      await flush(50)

      // Detach root
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Navigate: root → Drawing → ArrowRight → Brush Type → ArrowRight → Round
      pressKey('ArrowDown')   // highlight Drawing
      pressKey('ArrowRight')  // open level1, highlight Brush Type
      await flush(50)
      expect(l1Item0.classList.contains('highlight')).toBe(true)

      pressKey('ArrowRight')  // open level2, highlight Round
      await flush(50)
      expect(l2Item0.classList.contains('highlight')).toBe(true)

      // ArrowDown in deepest level
      pressKey('ArrowDown')
      await flush()
      expect(l2Item1.classList.contains('highlight')).toBe(true)

      // Escape should close deepest level and return to level1
      pressKey('Escape')
      await flush()
      expect(l1Item0.classList.contains('highlight')).toBe(true)
      expect(l2Item1.classList.contains('highlight')).toBe(false)
    })

    it('Enter in 3-level deep sub-menu closes all attached levels and returns control to detached root', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Pencil = createItem('Pencil')
      const l1BrushType = createItem('Brush Type')
      const l1Eraser = createItem('Eraser')
      level1.addChild(l1Pencil)
      level1.addChild(l1BrushType)
      level1.addChild(l1Eraser)
      itemDrawing.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      let roundClicked = false
      const l2Round = createItem('Round')
      l2Round.onClick(() => { roundClicked = true })
      const l2Flat = createItem('Flat')
      level2.addChild(l2Round)
      level2.addChild(l2Flat)
      l1BrushType.subMenu = level2

      root.show()
      await flush(50)

      // Detach root
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Navigate: root → Drawing → level1 → Brush Type → level2 → Round
      pressKey('ArrowDown')   // Select All
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open level1, highlight Pencil
      await flush(50)
      expect(level1.state).toBe('attached')
      expect(l1Pencil.classList.contains('highlight')).toBe(true)

      pressKey('ArrowDown')   // Brush Type
      expect(l1BrushType.classList.contains('highlight')).toBe(true)

      pressKey('ArrowRight')  // open level2, highlight Round
      await flush(50)
      expect(level2.state).toBe('attached')
      expect(l2Round.classList.contains('highlight')).toBe(true)

      // Enter on Round — should click, close level2 AND level1, return to root
      pressKey('Enter')
      await flush(150)

      expect(roundClicked).toBe(true)
      expect(level2.state).toBe('closed')
      expect(level1.state).toBe('closed')
      expect(root.state).toBe('detached')

      // Drawing should still be highlighted in root
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // Arrow keys should control the ROOT again
      pressKey('ArrowDown')
      await flush()
      expect(itemFlatten.classList.contains('highlight')).toBe(true)
      expect(itemDrawing.classList.contains('highlight')).toBe(false)

      // And going back up
      pressKey('ArrowUp')
      await flush()
      expect(itemDrawing.classList.contains('highlight')).toBe(true)
    })

    it('Enter in level3 returns control to detached level1 when both root and level1 are detached', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      const itemFlatten = createItem('Flatten')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)
      root.addChild(itemFlatten)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Pencil = createItem('Pencil')
      const l1BrushType = createItem('Brush Type')
      const l1Eraser = createItem('Eraser')
      level1.addChild(l1Pencil)
      level1.addChild(l1BrushType)
      level1.addChild(l1Eraser)
      itemDrawing.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      let roundClicked = false
      const l2Round = createItem('Round')
      l2Round.onClick(() => { roundClicked = true })
      const l2Flat = createItem('Flat')
      level2.addChild(l2Round)
      level2.addChild(l2Flat)
      l1BrushType.subMenu = level2

      root.show()
      await flush(50)

      // Detach ROOT
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Open Drawing sub-menu via keyboard
      pressKey('ArrowDown')   // Select All
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open level1 (attached)
      await flush(50)
      expect(level1.state).toBe('attached')

      // Detach level1 (Drawing) too — user drags it
      level1.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(level1.state).toBe('detached')

      // Navigate in detached Drawing → Brush Type → open level2
      // root._activeSubMenu = level1 (detached), delegate nav to level1
      pressKey('ArrowDown')   // highlight Pencil in Drawing
      await flush()
      expect(l1Pencil.classList.contains('highlight')).toBe(true)

      pressKey('ArrowDown')   // highlight Brush Type
      expect(l1BrushType.classList.contains('highlight')).toBe(true)

      pressKey('ArrowRight')  // open level2 (attached)
      await flush(50)
      expect(level2.state).toBe('attached')
      expect(l2Round.classList.contains('highlight')).toBe(true)

      // Enter on Round — should close level2, return control to Drawing (detached)
      pressKey('Enter')
      await flush(150)

      expect(roundClicked).toBe(true)
      expect(level2.state).toBe('closed')
      expect(level1.state).toBe('detached')  // Drawing stays detached
      expect(root.state).toBe('detached')    // Root stays detached

      // Brush Type should still be highlighted in Drawing
      expect(l1BrushType.classList.contains('highlight')).toBe(true)

      // Arrow keys should control DRAWING (level1), not the dead level2
      pressKey('ArrowDown')
      await flush()
      expect(l1Eraser.classList.contains('highlight')).toBe(true)
      expect(l1BrushType.classList.contains('highlight')).toBe(false)
    })

    it('request-parent-close propagates through detached levels closing attached ones', async () => {
      anchor = createAnchor()
      anchor.focus()

      // Build chain: root (will detach) → Drawing (will stay attached) → Brush Type (will detach)
      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Pencil = createItem('Pencil')
      const l1BrushType = createItem('Brush Type')
      level1.addChild(l1Pencil)
      level1.addChild(l1BrushType)
      itemDrawing.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      let roundClicked = false
      const l2Round = createItem('Round')
      l2Round.onClick(() => { roundClicked = true })
      const l2Flat = createItem('Flat')
      level2.addChild(l2Round)
      level2.addChild(l2Flat)
      l1BrushType.subMenu = level2

      root.show()
      await flush(50)

      // Detach root (Tools)
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      // Open Drawing sub-menu (attached) via keyboard
      pressKey('ArrowDown')   // Select All
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open level1
      await flush(50)
      expect(level1.state).toBe('attached')

      // Open Brush Type sub-menu, then detach it
      pressKey('ArrowDown')   // Brush Type in Drawing
      pressKey('ArrowRight')  // open level2
      await flush(50)
      expect(level2.state).toBe('attached')

      level2.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(level2.state).toBe('detached')

      // State: root=detached, Drawing=attached, Brush Type=detached
      // Navigate in detached Brush Type and press Enter
      pressKey('ArrowDown')   // highlight Round
      await flush()
      expect(l2Round.classList.contains('highlight')).toBe(true)

      pressKey('Enter')
      await flush(150)

      // Round should have been clicked
      expect(roundClicked).toBe(true)
      // Drawing (attached) should be closed by cascade
      expect(level1.state).toBe('closed')
      // Root and Brush Type (both detached) stay open
      expect(root.state).toBe('detached')
      expect(level2.state).toBe('detached')
    })

    it('Enter opens sub-menu when root popup is detached and item has sub-menu', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      const subItem0 = createItem('Pencil')
      sub.addChild(subItem0)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Detach the ROOT popup
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      anchor.focus()
      await flush()

      pressKey('ArrowDown')  // highlight Select All
      pressKey('ArrowDown')  // highlight Drawing

      // Enter on Drawing should open sub-menu, not just click
      pressKey('Enter')
      await flush(50)

      expect(sub.visible).toBe(true)
      expect(subItem0.classList.contains('highlight')).toBe(true)
    })
  })

  // ═══════════════════════════════════════
  // 7c-2b. Escape closes only the active keyboard level
  // ═══════════════════════════════════════

  describe('Escape closes only the active keyboard level', () => {
    it('Escape in attached sub-menu closes only that level, not the root', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup()
      const itemSelect = createItem('Select All')
      const itemDrawing = createItem('Drawing')
      root.addChild(itemSelect)
      root.addChild(itemDrawing)

      const sub = createPopup()
      const subItem0 = createItem('Pencil')
      const subItem1 = createItem('Eraser')
      sub.addChild(subItem0)
      sub.addChild(subItem1)
      itemDrawing.subMenu = sub

      root.show()
      await flush(50)

      // Navigate to Drawing and open sub-menu
      pressKey('ArrowDown')   // Select All
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open sub-menu
      await flush(50)
      expect(sub.state).toBe('attached')
      expect(subItem0.classList.contains('highlight')).toBe(true)

      // Escape should close ONLY the sub-menu, not the root
      pressKey('Escape')
      await flush(50)
      expect(sub.state).toBe('closed')
      expect(root.state).toBe('attached')  // root stays open!
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // Second Escape should close root
      pressKey('Escape')
      await flush(50)
      expect(root.state).toBe('closed')
    })

    it('Escape in 3-level chain closes one level at a time', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup()
      const itemDrawing = createItem('Drawing')
      root.addChild(itemDrawing)

      const level1 = createPopup()
      const l1BrushType = createItem('Brush Type')
      level1.addChild(l1BrushType)
      itemDrawing.subMenu = level1

      const level2 = createPopup()
      const l2Round = createItem('Round')
      level2.addChild(l2Round)
      l1BrushType.subMenu = level2

      root.show()
      await flush(50)

      // Navigate all the way to level2
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open level1
      await flush(50)
      pressKey('ArrowRight')  // open level2
      await flush(50)
      expect(level2.state).toBe('attached')

      // First Escape: close level2, return to level1
      pressKey('Escape')
      await flush(50)
      expect(level2.state).toBe('closed')
      expect(level1.state).toBe('attached')
      expect(l1BrushType.classList.contains('highlight')).toBe(true)

      // Second Escape: close level1, return to root
      pressKey('Escape')
      await flush(50)
      expect(level1.state).toBe('closed')
      expect(root.state).toBe('attached')
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      // Third Escape: close root
      pressKey('Escape')
      await flush(50)
      expect(root.state).toBe('closed')
    })
  })

  // ═══════════════════════════════════════
  // 7c-3. Anchor blur/focus clears/restores highlight across all detached levels
  // ═══════════════════════════════════════

  describe('anchor blur/focus propagates to all detached levels', () => {
    it('anchor blur clears highlight in all detached sub-menus', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemDrawing = createItem('Drawing')
      root.addChild(itemDrawing)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1BrushType = createItem('Brush Type')
      const l1Eraser = createItem('Eraser')
      level1.addChild(l1BrushType)
      level1.addChild(l1Eraser)
      itemDrawing.subMenu = level1

      const level2 = createPopup({ detachable: true, title: 'Brush Type' })
      const l2Round = createItem('Round')
      const l2Flat = createItem('Flat')
      level2.addChild(l2Round)
      level2.addChild(l2Flat)
      l1BrushType.subMenu = level2

      root.show()
      await flush(50)

      // Detach all three levels
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      anchor.focus()
      await flush()

      // Open level1 via keyboard, then detach it
      pressKey('ArrowDown')   // Drawing
      pressKey('ArrowRight')  // open level1
      await flush(50)
      level1.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      anchor.focus()
      await flush()

      // Navigate into level1, open level2, detach it
      pressKey('ArrowDown')   // Brush Type in level1
      pressKey('ArrowRight')  // open level2
      await flush(50)
      level2.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      anchor.focus()
      await flush()

      // Navigate to highlight items at each level
      pressKey('ArrowDown')   // highlight Drawing in root
      await flush()
      expect(itemDrawing.classList.contains('highlight')).toBe(true)

      pressKey('ArrowRight')  // delegate to level1 (detached)
      await flush()
      expect(l1BrushType.classList.contains('highlight')).toBe(true)

      pressKey('ArrowRight')  // delegate to level2 (detached)
      await flush()
      expect(l2Round.classList.contains('highlight')).toBe(true)

      // Now blur the anchor — ALL levels should clear highlights
      anchor.blur()
      await flush()

      expect(itemDrawing.classList.contains('highlight')).toBe(false)
      expect(l1BrushType.classList.contains('highlight')).toBe(false)
      expect(l2Round.classList.contains('highlight')).toBe(false)
    })

    it('anchor focus resets scroll in all detached sub-menus', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools' })
      const itemDrawing = createItem('Drawing')
      root.addChild(itemDrawing)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Item = createItem('Pencil')
      level1.addChild(l1Item)
      itemDrawing.subMenu = level1

      root.show()
      await flush(50)

      // Detach root
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      anchor.focus()
      await flush()

      // Open and detach level1
      pressKey('ArrowDown')
      pressKey('ArrowRight')
      await flush(50)
      level1.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      // Blur and re-focus → all levels should reset
      anchor.blur()
      await flush()
      anchor.focus()
      await flush()

      // After focus, highlights should be cleared and activeIndex reset
      expect(itemDrawing.classList.contains('highlight')).toBe(false)
      expect(l1Item.classList.contains('highlight')).toBe(false)
    })
  })

  // ═══════════════════════════════════════
  // 7c-4. Detached scroll-follow behavior
  // ═══════════════════════════════════════

  describe('detached scroll-follow behavior', () => {
    it('detachedScroll=follow shifts popup position by scroll delta', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools', detachedScroll: 'follow' as any })
      root.addChild(createItem('Select All'))
      root.addChild(createItem('Drawing'))

      root.show()
      await flush(50)

      // Detach root
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)
      expect(root.state).toBe('detached')

      // Record position after detach
      const el = root.window! as HTMLElement
      const origLeft = parseFloat(el.style.left)
      const origTop = parseFloat(el.style.top)

      // Simulate scroll by changing window.scrollY and dispatching scroll
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true })
      document.dispatchEvent(new Event('scroll', { bubbles: true }))
      await flush()

      // Position should shift by delta (0 - 0 = 0 for X, 0 - 100 = -100 for Y)
      expect(parseFloat(el.style.left)).toBe(origLeft)
      expect(parseFloat(el.style.top)).toBe(origTop - 100)

      // Reset
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    })

    it('detachedScroll=follow shifts fixed popups, skips absolute (they follow naturally)', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools', detachedScroll: 'follow' as any })
      const itemDrawing = createItem('Drawing')
      root.addChild(itemDrawing)

      const level1 = createPopup({ detachable: true, title: 'Drawing' })
      const l1Item = createItem('Pencil')
      level1.addChild(l1Item)
      itemDrawing.subMenu = level1

      root.show()
      await flush(50)

      // Detach root (no overlord → stays position:fixed)
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      anchor.focus()
      await flush()

      // Open and detach level1 (has overlord → becomes position:absolute)
      pressKey('ArrowDown')
      pressKey('ArrowRight')
      await flush(50)
      level1.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      const rootEl = root.window! as HTMLElement
      const l1El = level1.window! as HTMLElement
      const rootTop = parseFloat(rootEl.style.top)
      const l1Top = parseFloat(l1El.style.top)

      expect(rootEl.style.position).toBe('fixed')
      expect(l1El.style.position).toBe('absolute')

      // Scroll down 50px
      Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true })
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true })
      document.dispatchEvent(new Event('scroll', { bubbles: true }))
      await flush()

      // Root (fixed) should shift by -50
      expect(parseFloat(rootEl.style.top)).toBe(rootTop - 50)
      // Level1 (absolute) should NOT be shifted — it follows scroll via offset parent
      expect(parseFloat(l1El.style.top)).toBe(l1Top)

      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    })

    it('detachedScroll=fixed (default) does not move popup on scroll', async () => {
      anchor = createAnchor()
      anchor.focus()

      // Default: no detachedScroll option → 'fixed'
      const root = createPopup({ detachable: true, title: 'Tools' })
      root.addChild(createItem('Item'))

      root.show()
      await flush(50)

      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      const el = root.window! as HTMLElement
      const origTop = parseFloat(el.style.top)

      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true })
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true })
      document.dispatchEvent(new Event('scroll', { bubbles: true }))
      await flush()

      // Should NOT have moved
      expect(parseFloat(el.style.top)).toBe(origTop)

      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    })

    it('scroll-follow handler is cleaned up on return from detached', async () => {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup({ detachable: true, title: 'Tools', detachedScroll: 'follow' as any })
      root.addChild(createItem('Item'))

      root.show()
      await flush(50)

      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      const el = root.window! as HTMLElement

      // Close the detached popup (return from detached)
      root.window!.dispatchEvent(new CustomEvent('before-close', { bubbles: true }))
      ;(root as any)._returnFromDetached()
      await flush(50)
      expect(root.state).toBe('closed')

      // Re-open and detach again to get fresh position
      root.show()
      await flush(50)
      root.window!.dispatchEvent(new CustomEvent('end-drag', { bubbles: true }))
      await flush(50)

      const origTop = parseFloat(el.style.top)

      // Scroll should still work (new handler bound)
      Object.defineProperty(window, 'scrollY', { value: 30, writable: true, configurable: true })
      Object.defineProperty(window, 'scrollX', { value: 0, writable: true, configurable: true })
      document.dispatchEvent(new Event('scroll', { bubbles: true }))
      await flush()

      expect(parseFloat(el.style.top)).toBe(origTop - 30)

      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    })

    it('detachedScroll is inherited by sub-menus from parent popup', async () => {
      anchor = createAnchor()
      const root = createPopup({ detachable: true, title: 'Tools', detachedScroll: 'follow' as any })
      const item = createItem('Drawing')
      root.addChild(item)

      const sub = createPopup({ detachable: true, title: 'Drawing' })
      sub.addChild(createItem('Pencil'))
      item.subMenu = sub

      root.show()
      await flush(50)

      // Open sub-menu — it should inherit detachedScroll
      item.openSubMenu()
      await flush(50)

      expect((sub as any)._detachedScroll).toBe('follow')
    })
  })

  // ═══════════════════════════════════════
  // 7d. Titlebar focus preservation
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

    // ── Keyboard: ArrowRight on container sub-menu must NOT transfer keyboard control ──

    function makeContainerSubMenuScene() {
      anchor = createAnchor()
      anchor.focus()

      const root = createPopup()
      const item1 = createItem('Settings')
      const item2 = createItem('About')
      const item3 = createItem('Export')
      root.addChild(item1)
      root.addChild(item2)
      root.addChild(item3)

      const containerSub = new UIPopupWC({
        anchor: item1, kind: 'container', width: 200, height: 150,
        title: 'Settings Panel', detachable: true,
      })
      document.body.appendChild(containerSub)
      cleanup.push(containerSub)

      const content = document.createElement('div')
      content.innerHTML = '<input data-focusable placeholder="Name"><input data-focusable placeholder="Email">'
      containerSub.addChild(content)
      item1.subMenu = containerSub

      root.show()
      return { root, item1, item2, item3, containerSub }
    }

    it('ArrowRight opens container sub-menu but does NOT set _activeSubMenu', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // should open container sub-menu
      await flush()

      expect(containerSub.visible).toBe(true)
      // Parent must NOT have transferred keyboard control
      expect((root as any)._activeSubMenu).toBe(null)
    })

    it('ArrowRight on container sub-menu keeps highlight on parent item', async () => {
      const { root } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // open container sub-menu
      await flush()

      // Parent's _activeIndex should still point to Settings (index 0)
      expect((root as any)._activeIndex).toBe(0)
    })

    it('ArrowDown with open container sub-menu closes it and highlights next item', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // open container sub-menu
      await flush()
      expect(containerSub.visible).toBe(true)

      pressKey('ArrowDown')  // should close container sub-menu and highlight About
      await flush()

      expect(containerSub.visible).toBe(false)
      expect((root as any)._activeIndex).toBe(1) // About
    })

    it('ArrowUp with open container sub-menu closes it and highlights previous item', async () => {
      const { containerSub } = makeContainerSubMenuScene()
      await flush()

      // Navigate to About (index 1), then back to Settings and open container
      pressKey('ArrowDown')  // Settings (0)
      pressKey('ArrowDown')  // About (1)
      pressKey('ArrowUp')    // Settings (0) again
      pressKey('ArrowRight') // open container sub-menu
      await flush()
      expect(containerSub.visible).toBe(true)

      pressKey('ArrowUp')    // should close container and go to Export (last item, wrapping)
      await flush()

      expect(containerSub.visible).toBe(false)
    })

    it('Escape closes container sub-menu and keeps parent active', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // open container sub-menu
      await flush()
      expect(containerSub.visible).toBe(true)

      pressKey('Escape')
      await flush()

      expect(containerSub.visible).toBe(false)
      // Parent should still be open
      expect(root.visible).toBe(true)
    })

    it('ArrowLeft closes container sub-menu same as Escape', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // open container sub-menu
      await flush()
      expect(containerSub.visible).toBe(true)

      pressKey('ArrowLeft')
      await flush()

      expect(containerSub.visible).toBe(false)
      expect(root.visible).toBe(true)
    })

    it('Enter on container sub-menu item opens it without transferring keyboard', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      pressKey('ArrowDown')  // highlight Settings
      pressKey('Enter')      // should open container sub-menu
      await flush()

      expect(containerSub.visible).toBe(true)
      expect((root as any)._activeSubMenu).toBe(null)
    })

    it('detached container sub-menu: ArrowRight brings to front without keyboard transfer', async () => {
      const { root, containerSub } = makeContainerSubMenuScene()
      await flush()

      // Open container sub-menu, then simulate detach via internal method
      pressKey('ArrowDown')  // highlight Settings
      pressKey('ArrowRight') // open container sub-menu
      await flush()

      ;(containerSub as any)._detach()
      await flush()
      expect(containerSub.state).toBe('detached')

      // ArrowRight again should bring to front, NOT transfer keyboard
      pressKey('ArrowRight')
      await flush()

      expect((root as any)._activeSubMenu).toBe(null)
      expect((root as any)._activeIndex).toBe(0) // still on Settings
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
