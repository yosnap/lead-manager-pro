# Historial de Cambios - Lead Manager Pro

## [1.4.0] - 2025-05-17

### Nuevas funcionalidades
- **Panel de ajustes**: Implementada nueva sección de ajustes en el popup principal de la extensión.
- **Botón de emergencia configurable**: Ahora el botón de emergencia solo se muestra si está habilitado en los ajustes.

## [1.3.0] - 2025-05-17

### Mejoras
- **Interacción sin distracciones**: Implementada funcionalidad para ocultar automáticamente el sidebar y la interfaz de interacción durante el proceso de interacción con miembros.
- **Experiencia de usuario mejorada**: La interfaz de interacción se muestra nuevamente al finalizar el proceso.
- **Interfaz simplificada**: Eliminado botón redundante de interacción con miembros para una interfaz más limpia.

### Correcciones
- Solucionado problema de carga de la extensión debido a referencias a archivos inexistentes.
- Implementada compatibilidad con versiones anteriores para evitar errores de carga.

## [1.2.0] - 2025-05-16

### Nuevas funcionalidades
- **Mensajes personalizados múltiples**: Implementado sistema de acordeón con hasta 5 mensajes personalizables.
- **Selección aleatoria de mensajes**: Los mensajes se seleccionan aleatoriamente durante las interacciones.
- **Mejora de la interfaz**: Rediseñada la sección de mensajes para una mejor experiencia de usuario.
- **Sidebar arrastrable**: Añadida funcionalidad para arrastrar y posicionar el sidebar de interacciones.
- **Scroll automático**: Implementado scroll vertical cuando el contenido del sidebar es demasiado grande.

### Correcciones
- Solucionado el error "messageTextarea is not defined" al guardar la configuración.
- Corregido problema con el guardado y carga de mensajes personalizados.
- Mejorada la gestión de mensajes en la interacción con miembros.
- Corregido problema de solapamiento del sidebar en la parte superior de la pantalla.

## [1.1.0] - 2025-05-10

### Mejoras
- **Interacción con miembros**: Mejorado el flujo de interacción con miembros de grupos para enviar mensajes automáticamente.
  - Implementada detección robusta del botón de mensaje en diferentes interfaces de Facebook.
  - Añadido paso para cerrar el modal del usuario después de hacer clic en el botón de mensaje.
  - Mejorada la búsqueda del campo de mensaje en la ventana de chat.
  - Optimizado el proceso de envío de mensajes con múltiples métodos de respaldo.
  - Añadidos logs detallados para facilitar la depuración.

### Correcciones
- Solucionado el error "No se encontró el botón de mensaje" que ocurría en algunas interfaces de Facebook.
- Corregido el problema de DOMException al interactuar con ciertos perfiles.
- Mejorada la detección de elementos en la interfaz cambiante de Facebook.
- Implementada estrategia de múltiples capas para encontrar elementos en la interfaz.

### Cambios técnicos
- Refactorizado el método `findMessageButton()` para usar múltiples estrategias de búsqueda.
- Añadido nuevo método `closeUserModal()` para cerrar el modal del usuario.
- Actualizado el flujo de interacción para seguir un proceso de 8 pasos claramente definidos.
- Mejorado el manejo de errores en todo el proceso de interacción.

## [1.0.0] - Versión inicial

- Funcionalidad básica para buscar y gestionar leads en Facebook.
- Interfaz de usuario para interactuar con miembros de grupos.
- Extracción de perfiles y datos de contacto.
- Integración con n8n para automatización de flujos de trabajo.
