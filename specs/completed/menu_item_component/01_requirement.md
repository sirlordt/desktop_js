# Feature: menu_item_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
este componentes hace la mimica de un menu item, que se puede usar en el menu bar component, y en el context menu component, y en cualquier otro componente que necesite mostrar un menu item, como por ejemplo un dropdown menu component.

## Acceptance criteria
- [ ] El layout del menu es simple, Zona de izquierda, Zona del centro, Zona de la derecha.
- [ ] La zona de la izquierda siempre es el mismo y siempre esta presente.
- [ ] La zona de la derecha no siempre esta presente, y solo si tiene algo que mostrar, como un icono.
- [ ] El espacio del icono de la derecha no siempre siempre esta presente.
- [ ] El texto del menu siempre esta en el centro y se corta con ... cuando no cabe es el espacio del padre.
- [ ] Se muestra un hint cuando el texto del centro de corta con ...
- [ ] Todo el menuitem siempre ocupa el width de su padre.
- [ ] La alineacion vertical del menu item siempre es el centro.
- [ ] El texto de la zona central puede estar alineado a la izquierda, centro o derecha.
- [ ] Tiene 3 tamaños small, medium, large.
- [ ] La alineacion vertical y horizontal es el centro el las zonas izquierda y detecha.
- [ ] La Zona de la izquierda y derecha solo puede esta un elemento.
- [ ] en la zona de la ziquierda se puede tener cambio de elementos, segun el estado, por ejemplo mostra un icono check o u otro icono cuando se hacer click en el menuitem, similar en concepto al pushed del boton.
- [ ] En la zona central no solo puede vivir un label, tambien puede agregarse un elemento más como un boton o un edit.
- [ ] El elemento completo hace hover, pero no hace efecto down cuando se le hace click, debe emitir eventos, click e indicar el push estate si la propiedad esta activa.
- [ ] Tiene valor que herede de UIView?

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
