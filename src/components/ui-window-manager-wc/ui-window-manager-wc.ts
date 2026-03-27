import { PanelWC } from '../ui-panel-wc/ui-panel-wc'
import type { IWindowChild, WindowChildInfo, WindowCycleShortcut, WindowState } from '../common/types'

/**
 * <window-manager-wc> — Web Component window manager.
 * Placeholder — full implementation in next commit.
 */
export class WindowManagerWC extends PanelWC {
  animated: boolean = true
  minimizeSlotWidth: number = 160
  minimizeSlotHeight: number = 28
  cycleNextShortcut: WindowCycleShortcut = { key: 'F6', altKey: true }
  cyclePrevShortcut: WindowCycleShortcut = { key: 'F6', altKey: true, shiftKey: true }

  get element(): HTMLElement { return this }

  addWindow(_child: IWindowChild): void {}
  removeWindow(_child: IWindowChild): void {}
  closeChild(_child: IWindowChild): boolean { return false }
  minimizeChild(_child: IWindowChild): boolean { return false }
  restoreChild(_child: IWindowChild): boolean { return false }
  maximizeChild(_child: IWindowChild): boolean { return false }
  restoreMaximized(_child: IWindowChild): boolean { return false }
  activateWindow(_child: IWindowChild): void {}
  bringToFront(_child: IWindowChild): void {}
  sendToBack(_child: IWindowChild): void {}
  setTopmost(_child: IWindowChild, _topmost: boolean): void {}
  focusNext(): void {}
  focusPrevious(): void {}
  minimizeAll(): void {}
  restoreAll(): void {}
  closeAll(): void {}
  getAll(): IWindowChild[] { return [] }
  getAllStates(): WindowChildInfo[] { return [] }
  getMinimized(): IWindowChild[] { return [] }
  getFloating(): IWindowChild[] { return [] }
  getFocused(): IWindowChild | null { return null }
  getById(_id: string): IWindowChild | null { return null }
  getByTitle(_title: string): IWindowChild | null { return null }
  getAllByTitle(_title: string): IWindowChild[] { return [] }
  searchByTitle(_query: string): IWindowChild[] { return [] }
  getChildState(_child: IWindowChild): WindowChildInfo | null { return null }
  getMaximizedExcluding(_exclude: IWindowChild): IWindowChild | null { return null }
  findWindows(_predicate: (child: IWindowChild) => boolean): IWindowChild[] { return [] }
  findWindow(_predicate: (child: IWindowChild) => boolean): IWindowChild | null { return null }
  hasState(_state: WindowState): boolean { return false }
  notifyDrag(_child: IWindowChild, _left: number, _top: number): void {}
  notifyResize(_child: IWindowChild, _width: number, _height: number): void {}
}

customElements.define('window-manager-wc', WindowManagerWC)
