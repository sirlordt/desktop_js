# Feature: popup_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
El popup component es un componente que se muestra como un contenedor flotante.

## Acceptance criteria
- [ ] Tendria sentido usar un UIWindow como base sin titleBar, sin capacidad de moverse y agregar las capacidade de anchor del UIHint o hacerlo directo en el componente UIWindow? 
- [ ] Es contenedor flotante muy similar en caracterisiticas al UIHint
- [ ] Solo que este desaparece al hacer click afuera del contenedor o al recibir un evento close de alguno de sus child.
- [ ] Y tiene propiedades de scroll=both, vertical, horinzontal, none. 
- [ ] Tiene una propiedad arange = vertical, horinzotal, none en modo none es relative, con el clip activado. Por defecto vertical. 
- [ ] a pesar de ser un contenedor generico flotante se debe tener pensado para ser usando como popup_menu, y como listbox_menu, y otros elementos que requieren intereaccion por teclado. 

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
