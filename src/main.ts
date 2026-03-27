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
import { hintsWCDemo } from './demos/hints-wc'
import { panelsWCDemo } from './demos/panels-wc'
import { windowsWCDemo } from './demos/windows-wc'
import { menuItemsWCDemo } from './demos/menu-items-wc'
import { popupsWCDemo } from './demos/popups-wc'

// Register all demos here
registerDemos([
  colorsDemo,
  buttonsDemo,
  layoutDemo,
  hintsDemo,
  hintsWCDemo,
  scrollbarDemo,
  scrollbarWCDemo,
  scrollboxDemo,
  scrollboxWCDemo,
  panelsDemo,
  panelsWCDemo,
  windowsWCDemo,
  windowsDemo,
  menuItemsDemo,
  menuItemsWCDemo,
  popupsWCDemo,
  popupsDemo,
])

initApp()
