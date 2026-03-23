# Feature: button_component

## Status
- [ ] Requirement complete
- [ ] Design complete
- [ ] Implementation complete
- [ ] Tests passing

## Description
Se requires a new button component for the desktop application. This button component must be designed to be visually appealing, consistent with the overall design language of the application, and provide a clear and intuitive user experience. The button component should support various states (e.g., default, hover, active, disabled) and be adaptable to different contexts within the application. Additionally, the button component must be implemented using modern web technologies and be compatible with various platforms and devices to ensure a seamless user experience across all environments.

## Acceptance criteria
- [ ] Debe ser implementado en puro typescript y css, sin dependencias externas.
- [ ] Debe ser compatible con GTK4 y WIN95, utilizando los mismos CSS variables para ambos temas, pero con diferentes valores para cada tema, para asegurar una experiencia de usuario coherente y fluida al cambiar entre temas.
- [ ] El componente de botón debe soportar varios estados (por ejemplo, predeterminado, hover, activo, deshabilitado) y ser adaptable a diferentes contextos dentro de la aplicación.
- [ ] El componente de botón debe ser visualmente atractivo y consistente con el lenguaje de diseño general de la aplicación.
- [ ] El componente de botón debe ser implementado utilizando tecnologías web modernas y ser compatible con varias plataformas y dispositivos para garantizar una experiencia de usuario fluida en todos los entornos.
- [ ] Debe wrapper friendly con VUE, React y Angular, permitiendo su fácil integración en proyectos que utilicen estos frameworks. El componente de botón debe ser diseñado de manera modular y flexible, para que pueda ser utilizado en diferentes contextos y adaptarse a las necesidades específicas de cada proyecto sin requerir modificaciones significativas en su código base.
- [ ] El componente aplica sus propiso estilos para ser compatible con Win95 y GTK4, utilizando los mismos CSS variables para ambos temas, pero con diferentes valores para cada tema, para asegurar una experiencia de usuario coherente y fluida al cambiar entre temas. El componente de botón debe ser diseñado de manera modular y flexible, para que pueda ser utilizado en diferentes contextos y adaptarse a las necesidades específicas de cada proyecto sin requerir modificaciones significativas en su código base. Además, el componente debe ser compatible con las características específicas de cada tema, como los estilos de borde, colores y tipografía, para garantizar una integración perfecta con la apariencia general de la aplicación en ambos temas.
- [ ] Debe tene run propiedad para definir el tipo de botón (por ejemplo, primario, secundario, de texto, etc.), lo que permitirá a los desarrolladores elegir el estilo adecuado para cada contexto y mejorar la coherencia visual en toda la aplicación. El componente de botón debe ser diseñado de manera modular y flexible, para que pueda ser utilizado en diferentes contextos y adaptarse a las necesidades específicas de cada proyecto sin requerir modificaciones significativas en su código base. Además, el componente debe ser compatible con las características específicas de cada tema, como los estilos de borde, colores y tipografía, para garantizar una integración perfecta con la apariencia general de la aplicación en ambos temas.
- [ ] Debe tener su pagina demo donde muestre los diferentes estados y tipos de botón, así como su compatibilidad con los temas GTK4 y WIN95. La página demo debe ser diseñada de manera clara y atractiva, para que los desarrolladores puedan comprender fácilmente las características y funcionalidades del componente de botón, y cómo integrarlo en sus proyectos utilizando los diferentes temas disponibles.
- [ ] Puede tener 2 iconos uno a la izquierda y otro a la derecha, para mejorar la usabilidad y proporcionar una experiencia de usuario más rica. El componente de botón debe ser diseñado de manera modular y flexible, para que pueda ser utilizado en diferentes contextos y adaptarse a las necesidades específicas de cada proyecto sin requerir modificaciones significativas en su código base. Además, el componente debe ser compatible con las características específicas de cada tema, como los estilos de borde, colores y tipografía, para garantizar una integración perfecta con la apariencia general de la aplicación en ambos temas.
- [ ] Debe ser facil de personalizar la apariencia atravez de variables css custom que se le puedan pasar. En cuyo caso look and feel o se garantiza para los temas.
- [ ] El boton debe dar feeeback cuando esta focused y cuando essiendo clickeado.
- [ ] El boton debe tener un propiedad toogle para que se quede push. Cuando se le haga click. Tambien debe poder definir cambios de iconos cuando se le haga push y cuando no. Emite un evento click con el estado del toggle.

## Constraints
<!-- Technical, UX, or business limitations that apply to this feature. -->

## Dependencies
- `scheme_color_theme_colors` — The button component consumes the CSS variables defined by the theme system (colors, typography, borders). This is its only dependency.
