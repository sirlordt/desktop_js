# Feature: textbox_component

## Status
- [x] Requirement complete
- [x] Design complete
- [x] Implementation complete
- [x] Tests passing

## Description
Se requiere implmenetar un componente de caja de texto (textbox) que permita a los usuarios ingresar y editar texto. El componente debe ser accesible, adaptable a diferentes tamaños de pantalla y compatible con temas visuales. Debe soportar características como selección de texto, cursor parpadeante, y eventos de entrada. 

## Acceptance criteria
- [ ] Quiero experimentar con un textbox pintado usando un canvas. Y que tengan un textbox real con opacidad de 0. Que permita hacer la intergacion con los menus contextuales y el copiar y el pagar. Esta tenica es usadda por flutter para pintar sus textboxes. Y es una tecnica que se puede usar para evitar problemas de rendimiento al renderizar texto en canvas, y al mismo tiempo mantener la funcionalidad de un textbox real.
- [ ] El nombre me gustaria que fuera `UITextBoxExp` el exp es por experimental, ya que esta tecnica es experimental y no se si va a funcionar bien en todos los casos. Pero me gustaria probarla para ver si es una buena opcion para implementar el textbox.
- [ ] Toda la iteraccion del texto seleccion y demas debe ser hecha con el canvas. 

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
