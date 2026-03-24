import './style.css'
import { registerDemos, initApp } from './header'
import { colorsDemo } from './demos/colors'
import { buttonsDemo } from './demos/buttons'
import { layoutDemo } from './demos/layout'
import { hintsDemo } from './demos/hints'
import { scrollbarDemo } from './demos/scrollbar'
import { panelsDemo } from './demos/panels'

// Register all demos here
registerDemos([
  colorsDemo,
  buttonsDemo,
  layoutDemo,
  hintsDemo,
  scrollbarDemo,
  panelsDemo,
])

initApp()
