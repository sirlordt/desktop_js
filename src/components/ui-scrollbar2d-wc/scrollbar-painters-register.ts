import { registerPainter } from '../common/canvas-theme'
import { GTK4ScrollbarPainter, WIN95ScrollbarPainter } from './scrollbar-painter'

// Register built-in painters
registerPainter('GTK4_ScrollbarPainter', new GTK4ScrollbarPainter())
registerPainter('WIN95_ScrollbarPainter', new WIN95ScrollbarPainter())
