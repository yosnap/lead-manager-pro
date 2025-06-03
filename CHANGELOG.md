# Changelog - Lead Manager Pro

## [0.5.0] - 2025-06-04

### ✨ Nuevas Funcionalidades

#### Menú Principal Mejorado
- **"Buscar y guardar" inteligente**: Navegación automática a Facebook home y apertura del sidebar
- **Detección de ubicación**: Comportamiento adaptativo según la página actual
- **Mensajes informativos**: Feedback visual durante las transiciones
- **Experiencia optimizada**: Tiempos de espera calculados para mejor UX

#### Opciones Generales Mejoradas
- **Scrolls máximos para mostrar resultados**: Control del número máximo de scrolls automáticos
- **Tiempo de espera entre scrolls**: Configuración del delay entre scrolls en segundos
- Valores por defecto: 50 scrolls máximos, 2 segundos de espera

#### Sistema de Filtros para Búsqueda de Grupos
- **Tipos de grupo**: Checkboxes para seleccionar grupos públicos y/o privados
- **Cantidad mínima de miembros**: Campo numérico para filtrar por número de miembros
- **Cantidad mínima de publicaciones**: Sistema flexible con tres criterios:
  - Por año (mínimo de publicaciones anuales)
  - Por mes (mínimo de publicaciones mensuales) 
  - Por día (mínimo de publicaciones diarias)
- **Lógica de validación**: Grupos válidos si cumplen con miembros mínimos Y al menos uno de los criterios de publicaciones

#### Sidebar de Grupos Renovado
- **Herramienta "Contar miembros"**: Conteo automático de miembros del grupo actual
- **Herramienta "Interactuar con miembros"**: Acceso directo a la funcionalidad de interacción
- **Configuración simplificada**: 
  - Número de miembros a interactuar
  - Tiempo entre interacciones (ms)
  - Mensaje personalizado para chat
  - Opción de cerrar chat automáticamente
- **Estadísticas en tiempo real**: Información del grupo actual y contadores

### 🔧 Mejoras Técnicas

#### Almacenamiento de Datos
- Migración completa a `chrome.storage.local` para mayor persistencia
- Estructura de datos preparada para integración con n8n
- Claves de almacenamiento organizadas

#### Nuevos Módulos
- `groupSearchFilters.js`: Lógica de filtrado y validación de grupos
- `groupSearchFiltersUI.js`: Interfaz de usuario para configurar filtros
- `new-features-tests.js`: Suite de pruebas para las nuevas funcionalidades

## [1.4.0] - 2025-05-17

### Nuevas funcionalidades
- **Sección de opciones**: Implementada nueva sección en el popup principal para configurar opciones de la extensión.
- **Configuración del botón de emergencia**: Añadida opción para mostrar/ocultar el botón de emergencia según preferencia del usuario.
- **Interfaz mejorada**: Rediseñada la página de opciones con un estilo moderno y coherente con la extensión.

### Mejoras
- **Feedback visual**: Añadida notificación de confirmación al guardar la configuración.
- **Restaurada funcionalidad de interacción**: Corregido el problema con el botón de interacción en el popup principal.
- **Persistencia de configuración**: Las preferencias del usuario se guardan entre sesiones.

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
 reportes
- Exportación de datos en múltiples formatos
- Mejoras en la UI basadas en feedback de usuarios
- Optimizaciones de rendimiento

---

*Para más detalles técnicos, consultar `NUEVAS_FUNCIONALIDADES.md`*
