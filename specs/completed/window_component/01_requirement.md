# Feature: Window component

## Status
- [x] Requirement complete
- [x] Design complete
- [x] Implementation complete
- [ ] Tests passing

## Description
<!-- What the user needs. Written from the end user's perspective. -->

## Acceptance criteria
El componente window tiene varios detalles. 

1. Se debe poder redimencionas el ventana desde cualquier borde no solo el inferior derecho.
2. Si se minimiza. El Windows manager debe colocar la ventana en el fondo a la zuiqerda la primera luego la segunda al lado. Y hasta llenar el fondo luego sigue a la siguente linea. Si se maximiza alguna se deja el espacio vacio para se usada por otra ventana a ser maximizada. Basicamente todoe l fondo e sun grid. de tamaño fijo y ancho fio para hbicar ventanas vacias. Por que no existe un taskbar registrado.
3. Cuando se minimizan no se puede mover. Solo cerrar restauran o maximizar.
4. Se debe poder desactivar el redimensionado y movimiento de la vetana. Mediante propiedades.
5. Se debe poder dejar sin titulo. Mediante propiuedades.
6. Se debe porder desactiva el maximizar, restaurar y cerrar, mediante propiedades.
7. Se le debe poder agregar botones custon a la derecha antes de los botones estandares, html icons lo que sea.
8. Se debe poder agregar botones a la izquoerda. O elemento html como iconos o lo que sea. 
9. Se debe poder alinea el titulo a la izquierda centro o la derecha.
10. El boton de maximizar debe cambiar a restaurar y viceversa. Cuando se le haga click. Y el estado de la ventana debe cambiar a maximizado o restaurado respectivamente.
11. El boton de cerrar debe cerrar la ventana. Y eliminarla del dom.
12. El boton de minimizar debe minimizar la ventana. Y enviar un mensaje al window manager para que la ubique en el fondo. Y cambie su estado a minimizado.
13. El titulo de la ventana debe ser un string que se le pase como propiedad. Y debe ser actualizado cada vez que se le pase un nuevo titulo. Y debe ser mostrado en el titulo de la ventana.
14. El componente debe permitir ser movido. Para esto, el componente debe tener un metodo que sea llamado cuando se le haga click a la ventana. Y este metodo debe encargarse de mover la ventana a la posicion del mouse. Y el componente debe tener un metodo que sea llamado cuando se le haga click a la ventana y se arrastre. Y este metodo debe encargarse de mover la ventana a la posicion del mouse.
15. El componente debe permitir ser redimencionado. Para esto, el componente debe tener un metodo que sea llamado cuando se le haga click a un borde de la ventana. Y este metodo debe encargarse de redimencionar la ventana a la posicion del mouse. Y el componente debe tener un metodo que sea llamado cuando se le haga click a un borde de la ventana y se arrastre. Y este metodo debe encargarse de redimencionar la ventana a la posicion del mouse
16. En el tema win95 el boton de cerrar esta un poco separado del resto.

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
