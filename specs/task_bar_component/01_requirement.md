# Feature: task_bar_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
Crear un task bar component que permita a los usuarios acceder rápidamente a las vetanas.

## Acceptance criteria
- [ ] Permite a los usuarios acceder rápidamente a las ventanas abiertas.
- [ ] Este componente se alinea siempre a uno de los bordes de la pantalla, dentro de un componente desktop manager.
- [ ] Y se integra con el desktop manager pana manejar la lógica de minimización de ventanas.
- [ ] Podria verse como un opción que se le activa al componente window manager, y que reemplaza la lógica de minimización de ventanas por defecto, para que en vez de minimizar las ventanas en un grid, se muevan a este task bar component. 
- [ ] Por cada ventana de tipo normal se tiene un boton que representa la ventana, su minimiza muestra el estado visual minimizado, cuando esta presente, se permite varias ventanas maximizadas, que pueden cambiarse a al frente si se hacer click en el su boton correspondiente, incluso restauradas pueden pasar al frente si se tienen una minimizada.
- [ ] Cuando se hace click en el boton de una ventana minimizada, se restaura y se muestra en el frente.
- [ ] El boton que represetan la vetana tiene el mismo icono y titulo que la ventana que representa.
- [ ] El tamaño de los botones es fijo en ancho, solo comienza ha reducirse cuando ya no queda espacio.
- [ ] El bootn debe tener un hint que permita mostra el titulo de la ventana cuando este tiene ...
- [ ] La vetana puede enviar o tener un hint custom para mostrar en el boton de la barra de tareas, que hara overrid.
- [ ] El task bar tiene 3 tamaños, small, medium, large.
- [ ] A pesar de que el tamaño del boton se reduce cuando mas botones de ventanas hay presentes, el limite de width es el icono ya menos de eso no debe reducirese el width del boton, en ese caso que ya no se tenga mas espoacio se debe mostrar 
al lado derecho de le barra un boton que muestra un menu en el que se .

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
