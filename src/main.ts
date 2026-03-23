import './style.css'
import { registerDemos, initApp } from './header'
import { colorsDemo } from './demos/colors'
import { buttonsDemo } from './demos/buttons'
import { layoutDemo } from './demos/layout'

// Register all demos here
registerDemos([
  colorsDemo,
  buttonsDemo,
  layoutDemo,
])

initApp()
