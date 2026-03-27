import './style.css'
import { registerDemos, initApp } from './header'
import { colorsDemo } from './demos/colors'
import { buttonsDemo } from './demos/buttons'
import { layoutDemo } from './demos/layout'
import { hintsDemo } from './demos/hints'
import { scrollbarDemo } from './demos/scrollbar'
import { panelsDemo } from './demos/panels'
import { scrollboxDemo } from './demos/scrollbox'
import { windowsDemo } from './demos/windows'
import { menuItemsDemo } from './demos/menu-items'
import { popupsDemo } from './demos/popups'
import { scrollbarWCDemo } from './demos/scrollbar-wc'
import { scrollboxWCDemo } from './demos/scrollbox-wc'

// Register all demos here
registerDemos([
  colorsDemo,
  buttonsDemo,
  layoutDemo,
  hintsDemo,
  scrollbarDemo,
  scrollbarWCDemo,
  scrollboxDemo,
  scrollboxWCDemo,
  panelsDemo,
  windowsDemo,
  menuItemsDemo,
  popupsDemo,
])

initApp()
