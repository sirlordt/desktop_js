# Feature: menu_bar_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
Se requiere un componente de barra de menú para la aplicación que permita a los usuarios navegar fácilmente entre las diferentes secciones y funcionalidades. El componente debe ser intuitivo, accesible y adaptable a diferentes tamaños de pantalla.

## Acceptance criteria
- [ ] El menu bar debe contener de manera horizontal varios UIMenuItems, cada uno con un título
- [ ] Al hacer clic en un UIMenuItem, se debe mostrar un menú desplegable con opciones relacionadas a ese item. Usando el UIPopupWC. Pueden deser kind menu o kind container. 
- [ ] Cuado la barra no tiene suficiente espeacion horizontal para mostrar todos los UIMenuItems, se debe mostrar un menuitem de ">>" que al hacer clic despliegue un menú con los items restantes.
- [ ] El componente debe ser adaptable a diferentes tamaños de pantalla.
- [ ] Debe manera el foco de teclado, flecha izquierda flecha derecha para moverser por los items, excepto cuando estan expandidos, por que esta lo control el popup, excepto si es .
- [ ] Debe tener test para uso con teclado y con mouse.
- [ ] Debe tener demo para uso con teclado y con mouse.


## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
