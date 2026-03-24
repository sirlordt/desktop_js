# Feature: WindowManager component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
Se requiere un componente window manager que permita gestionar los child de cualquier tipo. Y que permita hacer que cuando se le haga click a un child, este se ponga al frente de los demás. Además, el componente debe permitir cerrar los child y minimizar los child. Mediante el paso de mensajes. 

## Acceptance criteria
- [ ] Es un contenedor. Similar UIView
- [ ] Tiene logica de alineacion. Dichos child no se ven afectados por el reordenamiento.   
- [ ] Todo child que se le haga click, se pone al frente de los demás. Siempre que su posicion sea relativa. Debe ser absnostico del tipo de child, es decir el child debe pedir subir a su parent. Y este debe encargse de reordenar a los child.
- [ ] El componente debe permitir cerrar los child. Para esto, el child debe pedir a su parent que se cierre. Y el parent debe encargarse de eliminarlo.
- [ ] El componente debe permitir minimizar los child. Para esto, el child debe pedir a su parent que se minimice. Y el parent debe encargarse de minimizarlo.  
- [ ] El componente debe permitir restaurar los child minimizados. Para esto, el child debe pedir a su parent que se restaure. Y el parent debe encargarse de restaurarlo.
- [ ] El componente debe permitir minimizar todos los child. Para esto, el componente debe tener un metodo que minimice todos los child. Y cada child debe tener un metodo que minimice su estado.  
- [ ] El componente debe permitir restaurar todos los child minimizados. Para esto, el componente debe tener un metodo que restaure todos los child minimizados. Y cada child debe tener un metodo que restaure su estado.
- [ ] El componente debe permitir cerrar todos los child. Para esto, el componente debe tener un metodo que cierre todos los child. Y cada child debe tener un metodo que cierre su estado.
- [ ] El componente debe permitir obtener el estado de los child. Para esto, el componente debe tener un metodo que devuelva el estado de todos los child. Y cada child debe tener un metodo que devuelva su estado.
- [ ] El componente debe permitir obtener el estado de un child en particular. Para esto, el componente debe tener un metodo que devuelva el estado de un child en particular. Y cada child debe tener un metodo que devuelva su estado.
- [ ] El componente debe permitir obtener el estado de los child minimizados. Para esto, el componente debe tener un metodo que devuelva el estado de los child minimizados. Y cada child debe tener un metodo que devuelva su estado.
- [ ] El componente debe permitir ser notificado de los movimineto de los child, cuando son dragged. Para esto, el componente debe tener un metodo que sea llamado cuando un child es movido. Y cada child debe tener un metodo que sea llamado cuando es movido.
- [ ] Para propisotos de prueba se debe implementar un componente llamado UIWindow


## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
<!-- Other features or specs this one depends on. -->
