# Historial de Cambios - Lead Manager Pro

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
