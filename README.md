# Snap Lead Manager - Extensión para Facebook con integración N8N

## Funcionalidad: Configuración inicial

### Implementación
- Se ha creado la estructura básica del proyecto para la extensión "Snap Lead Manager"
- Se ha configurado el manifest.json con los permisos necesarios (tabs, storage, scripting, webNavigation, windows)
- Se ha establecido el esquema de colores blanco y negro para la interfaz
- Se ha creado la interfaz básica de la extensión (popup.html)

### Componentes implementados
- **manifest.json**: Configuración principal de la extensión con permisos y estructura
- **popup.html**: Interfaz de usuario con diseño en blanco y negro
- **popup.css**: Estilos para la interfaz de usuario
- **popup.js**: Funcionalidad básica para la interacción con la interfaz
- **background.js**: Script en segundo plano para gestionar el estado de la extensión
- **content.js**: Script para interactuar con las páginas de Facebook

### Funcionalidad básica
- Interfaz de búsqueda de perfiles en Facebook
- Controles para iniciar, pausar y detener el proceso
- Indicador de progreso y mensajes de estado
- Comunicación entre los diferentes componentes de la extensión
- Opción para mantener el popup abierto como una ventana independiente durante las operaciones

### Próximos pasos
- Implementar la funcionalidad de búsqueda en Facebook
- Desarrollar algoritmos para identificar y seleccionar perfiles
- Implementar análisis de perfiles y extracción de datos
- Desarrollar integración con N8N

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

### Uso de la ventana independiente
1. Al hacer clic en el icono de la extensión, se abrirá el popup tradicional
2. En la parte inferior del popup, encontrarás un botón "Abrir en ventana"
3. Al hacer clic en este botón, se abrirá la interfaz en una ventana independiente que permanecerá abierta durante todas las operaciones
4. Esta ventana se mantendrá abierta incluso cuando se realicen búsquedas o se interactúe con Facebook

### Recargar la extensión después de cambios
1. Después de realizar cambios en el código, regresa a `chrome://extensions/`
2. Haz clic en el icono de recarga (↻) en la tarjeta de la extensión "Snap Lead Manager"
3. Los cambios deberían aplicarse inmediatamente

### Depuración
1. Haz clic en "Detalles" en la tarjeta de la extensión
2. Desplázate hacia abajo y haz clic en "Página en segundo plano" para inspeccionar el background script
3. Para depurar el popup, haz clic derecho en el icono de la extensión y selecciona "Inspeccionar"
4. Para depurar los content scripts, abre las herramientas de desarrollador en una página de Facebook donde se esté ejecutando la extensión

### Notas importantes
- Asegúrate de que los iconos estén presentes en la carpeta `/icons` antes de cargar la extensión
- Si realizas cambios en el `manifest.json`, deberás recargar la extensión manualmente
- Para probar la extensión en Facebook, deberás iniciar sesión en tu cuenta de Facebook