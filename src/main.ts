import './style.css'
import { registerDemos, initApp } from './header'
import { colorsDemo } from './demos/colors'
import { buttonsDemo } from './demos/buttons'
import { layoutDemo } from './demos/layout'
import { hintsWCDemo } from './demos/hints-wc'
import { scrollbarWCDemo } from './demos/scrollbar-wc'
import { scrollboxWCDemo } from './demos/scrollbox-wc'
import { panelsWCDemo } from './demos/panels-wc'
import { windowsWCDemo } from './demos/windows-wc'
import { menuItemsWCDemo } from './demos/menu-items-wc'
import { popupsWCDemo } from './demos/popups-wc'
import { menuBarWCDemo } from './demos/menubar-wc'

// Register all demos here
registerDemos([
  colorsDemo,
  buttonsDemo,
  layoutDemo,
  hintsWCDemo,
  scrollbarWCDemo,
  scrollboxWCDemo,
  panelsWCDemo,
  windowsWCDemo,
  menuItemsWCDemo,
  popupsWCDemo,
  menuBarWCDemo,
])

initApp()
