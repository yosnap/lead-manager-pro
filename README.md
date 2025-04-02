# Snap Lead Manager - Extensión para Facebook con integración N8N

## Funcionalidad: Configuración inicial

### Implementación
- Se ha creado la estructura básica del proyecto para la extensión "Snap Lead Manager"
- Se ha configurado el manifest.json con los permisos necesarios (tabs, storage, scripting, webNavigation, windows)
- Se ha establecido el esquema de colores blanco y negro para la interfaz
- Se ha creado la interfaz básica de la extensión (sidebar)

### Componentes implementados
- **manifest.json**: Configuración principal de la extensión con permisos y estructura
- **sidebar.html**: Interfaz de usuario con diseño en blanco y negro
- **sidebar.css**: Estilos para la interfaz de usuario
- **sidebar.js**: Funcionalidad básica para la interacción con la interfaz
- **background.js**: Script en segundo plano para gestionar el estado de la extensión
- **content.js**: Script para interactuar con las páginas de Facebook

### Funcionalidad básica
- Interfaz de búsqueda de perfiles en Facebook
- Controles para iniciar, pausar y detener el proceso
- Indicador de progreso y mensajes de estado
- Comunicación entre los diferentes componentes de la extensión
- Opción para mantener el sidebar abierto como una ventana independiente durante las operaciones

## Notas de Implementación

### Problemas resueltos

#### 1. Selector de filtro de ciudad
Se solucionó un problema con el selector de ciudad en los filtros de búsqueda. El error DOMException se producía cuando:
- Facebook cambiaba la estructura del DOM para los filtros
- Se intentaba hacer clic en elementos que aún no estaban completamente cargados

La solución implementada:
- Uso de selectores más robustos que se adaptan a diferentes variaciones del DOM
- Detección y manejo de errores para reintentar o proveer alternativas
- Mejor manejo de los tiempos de espera entre acciones para asegurar que los elementos estén cargados

#### 2. Persistencia del sidebar
Se implementó una funcionalidad para que el sidebar permanezca visible incluso después de recargar la página.
Esta función permite al usuario:
- Mantener el contexto de su búsqueda actual aunque la página se recargue
- Seguir monitoreando resultados y estados sin perder información
- Continuar trabajo donde lo dejó incluso si hay navegación entre páginas

La implementación involucró:
- Almacenamiento del estado del sidebar en el Background Script
- Sistema de restauración al cargar nuevas páginas
- Sincronización del estado entre el Content Script y Background Script
- Restauración de la información de búsqueda y resultados

## Actualizaciones recientes

### Mejoras en las opciones de configuración
- Se han añadido nuevas opciones generales:
  - **Scrolls máximos**: Configurable para controlar cuánto baja la página antes de mostrar resultados (por defecto 50)
  - **Tiempo de espera entre scroll**: Configurable en segundos para ajustar la velocidad del scraping (por defecto 2 segundos)

### Nuevas características para búsqueda de grupos
- Se han ampliado las opciones de filtrado para grupos de Facebook:
  - **Tipos de grupo**: Selección mediante checkbox para buscar grupos públicos y/o privados
  - **Cantidad mínima de usuarios**: Filtro numérico para encontrar sólo grupos con un mínimo de miembros
  - **Cantidad mínima de publicaciones**: Múltiples filtros configurables:
    - Por año: Número mínimo de publicaciones anuales
    - Por mes: Número mínimo de publicaciones mensuales
    - Por día: Número mínimo de publicaciones diarias
  - **Lógica de filtro mejorada**: Los grupos deben cumplir siempre con el mínimo de usuarios Y al menos uno de los criterios de publicaciones mínimas (año, mes o día)

### Mejora en la experiencia de usuario
- Se ha simplificado la interfaz eliminando completamente el popup
- Al hacer clic en el icono de la extensión, se muestra directamente el sidebar en la página de Facebook
- Si no se está en Facebook, se abre una nueva pestaña con Facebook y se muestra el sidebar
- Corrección de los botones de control durante búsquedas activas:
  - Los botones de Pausar y Detener ahora se activan correctamente durante una búsqueda en curso
  - Mejor feedback visual para indicar el estado de la búsqueda (activa, pausada, detenida)
  - Estilos mejorados para botones habilitados/deshabilitados
- Se ha mejorado la experiencia general al hacer que la interfaz sea más intuitiva y directa

### Mejoras en la interfaz del sidebar
- Se ha implementado un sidebar visible en el lado derecho de Facebook
- Se han mejorado los estilos para garantizar buena visualización y contraste
- Se ha agregado un botón para colapsar/expandir el sidebar
- Se ha añadido un campo para filtrar por ciudad

### Mejoras en la funcionalidad de búsqueda
- Se ha implementado la persistencia de términos de búsqueda tras recargar la página
- La búsqueda ahora funciona correctamente al presionar Enter en los campos
- Se ha añadido soporte para scroll infinito para cargar más resultados
- Se ha aumentado el timeout de búsqueda de 30 a 60 segundos
- Se implementó un sistema para mostrar la búsqueda actual en la interfaz

### Mejoras en la detección de perfiles
- Se ha mejorado la detección de perfiles en la página de resultados
- Ahora se extraen más datos de cada perfil, incluyendo información adicional
- Se almacenan los perfiles en localStorage para conservarlos después de recargas
- Se revisa automáticamente si ya existen resultados al abrir Facebook

### Problemas resueltos
- Se ha corregido el problema de visibilidad del sidebar
- Se ha corregido el problema de pérdida de términos de búsqueda al recargar
- Se ha implementado el soporte para scroll infinito de Facebook
- Se ha corregido el problema con la tecla Enter que no iniciaba la búsqueda
- Se ha corregido el problema de timeout en búsquedas extensas

### Mejoras en la persistencia de datos
- Se ha implementado un sistema para guardar y cargar las configuraciones de búsqueda
- Las opciones de búsqueda ahora se guardan en localStorage para recordar las preferencias del usuario
- Se ha preparado la estructura para la futura sincronización con base de datos externa
- Se ha mejorado el manejo del estado de búsqueda activa para mantener la coherencia incluso tras recargar la página

### Próximos pasos
- Implementar el análisis detallado de perfiles
- Desarrollar la extracción de datos adicionales
- Implementar la integración con base de datos externa
- Implementar la integración con N8N
- Mejorar el sistema de informes y análisis de los resultados

## Guía de configuración de la búsqueda de grupos

### Configuración general
Para acceder a las opciones generales:
1. Haz clic en el icono de la extensión mientras estás en Facebook
2. En el sidebar, haz clic en "Configuración Avanzada" para expandir las opciones

### Opciones de scroll
- **Scrolls máximos**: Define cuántos scrolls realizará la extensión antes de detener la búsqueda (valor predeterminado: 50)
  - Un valor mayor obtendrá más resultados pero tardará más tiempo
  - Un valor menor será más rápido pero podría obtener menos resultados
- **Tiempo entre scrolls**: Define cuántos segundos esperar entre cada scroll (valor predeterminado: 2 segundos)
  - Un tiempo mayor es más seguro para evitar bloqueos de Facebook
  - Un tiempo menor acelera la búsqueda pero podría ser detectado como comportamiento automatizado

### Filtros para grupos
- **Tipos de grupo**: Selecciona qué tipos de grupos quieres incluir
  - **Públicos**: Grupos visibles y accesibles para todos
  - **Privados**: Grupos que requieren aprobación para unirse
- **Cantidad mínima de usuarios**: Define el número mínimo de miembros que debe tener un grupo
  - Este filtro SIEMPRE debe cumplirse para que un grupo aparezca en los resultados
- **Cantidad mínima de publicaciones**:
  - **Por año**: Número mínimo de publicaciones anuales
  - **Por mes**: Número mínimo de publicaciones mensuales
  - **Por día**: Número mínimo de publicaciones diarias
  - El grupo debe cumplir con AL MENOS UNO de estos criterios (año, mes o día)

### Uso efectivo de filtros
- Para grupos más activos, aumenta los valores de publicaciones mínimas
- Para grupos más grandes, aumenta el valor mínimo de usuarios
- Si buscas nichos específicos, mantén valores bajos para obtener más resultados
- Los filtros se aplican mientras se recolectan los grupos, no es necesario esperar al final de la búsqueda

## Instalación y pruebas

### Generación de iconos
Antes de cargar la extensión, necesitas generar los iconos:
1. Abre el archivo `icons/generate_icons.html` en tu navegador
2. Haz clic en "Generar Iconos"
3. Para cada tamaño (16x16, 48x48, 128x128), haz clic en "Descargar"
4. Guarda cada archivo con el nombre correspondiente (icon16.png, icon48.png, icon128.png) en la carpeta "icons"

### Cómo cargar la extensión en Chrome
1. Abre Google Chrome y navega a `chrome://extensions/`
2. Activa el "Modo desarrollador" usando el interruptor en la esquina superior derecha
3. Haz clic en "Cargar descomprimida" (o "Load unpacked" en inglés)
4. Selecciona la carpeta raíz del proyecto "Snap Lead Manager"
5. La extensión debería aparecer en la lista de extensiones y estar lista para usar
6. Haz clic en el icono de la extensión en la barra de herramientas para abrir la interfaz

### Uso del sidebar en Facebook
1. Navega a Facebook.com
2. Una vez cargada la página, verás un botón en el lado derecho para mostrar el sidebar
3. Introduce el término de búsqueda (y opcionalmente la ciudad) y haz clic en "Buscar" o presiona Enter
4. Los resultados se procesarán y se mostrarán en el sidebar
5. La información de búsqueda se mantendrá incluso si recargas la página