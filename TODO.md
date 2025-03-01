# Proyecto: Snap Lead Manager - Extensión de Chrome para automatización de Facebook con integración N8N híbrida

## Objetivo
Desarrollar "Snap Lead Manager", una extensión de Chrome que permita buscar perfiles en Facebook, analizar sus datos, integrar con N8N para determinar estrategias de acercamiento, y gestionar conversaciones mediante agentes IA.

## Tareas pendientes

### Configuración inicial
- [x] Crear estructura del proyecto para Snap Lead Manager
- [x] Configurar manifest.json con información de la extensión
- [x] Establecer permisos necesarios (tabs, storage, etc.)
- [x] Crear interfaz básica de la extensión (popup.html)
- [x] Implementar funcionalidad para mantener el popup abierto durante las operaciones

### Funcionalidad 1: Búsqueda en Facebook
- [ ] Crear campo de entrada para términos de búsqueda
- [ ] Desarrollar script para navegar a la página de búsqueda de Facebook
- [ ] Inyectar término de búsqueda en el campo correspondiente
- [ ] Ejecutar búsqueda

### Funcionalidad 2: Identificación y selección de perfiles
- [ ] Desarrollar algoritmo para identificar contenedores de resultados
- [ ] Filtrar solo perfiles personales (excluir páginas y grupos)
- [ ] Implementar selección del primer perfil encontrado

### Funcionalidad 3: Navegación y análisis de perfil
- [ ] Abrir perfil en nueva pestaña
- [ ] Extraer información relevante (publicaciones recientes, información personal)
- [ ] Implementar análisis opcional de imágenes
- [ ] Estructurar datos del perfil para envío a N8N

### Funcionalidad 4: Primera integración con N8N (pre-contacto)
- [ ] Desarrollar API para comunicación entre Snap Lead Manager y N8N
- [ ] Crear webhook para enviar datos del perfil a N8N
- [ ] Implementar sistema para recibir respuesta de N8N con estrategia a seguir
- [ ] Diseñar mecanismo de espera/timeout mientras N8N procesa los datos

### Funcionalidad 5: Envío de solicitud de amistad según directriz de N8N
- [ ] Evaluar respuesta de N8N (proceder/no proceder con el perfil)
- [ ] Si procede, localizar botón de solicitud de amistad
- [ ] Implementar acción de clic en botón según instrucciones de N8N
- [ ] Verificar confirmación de envío

### Funcionalidad 6: Mensajería en Messenger basada en N8N
- [ ] Localizar/abrir chat de Messenger con el perfil
- [ ] Recibir de N8N el mensaje personalizado a enviar
- [ ] Enviar mensaje según instrucciones recibidas
- [ ] Confirmar a N8N el envío exitoso del mensaje

### Funcionalidad 7: Integración del chat con N8N
- [ ] Implementar observador de nuevos mensajes en Messenger
- [ ] Crear sistema de captura de respuestas del lead
- [ ] Enviar respuestas a N8N en tiempo real
- [ ] Recibir de N8N las respuestas a enviar
- [ ] Automatizar escritura de respuestas en el chat

### Funcionalidad 8: Gestión de múltiples conversaciones
- [ ] Desarrollar sistema de IDs para cada conversación activa
- [ ] Implementar cola de mensajes para evitar sobrecarga
- [ ] Crear mecanismo de priorización de respuestas
- [ ] Desarrollar sistema de alertas para intervención humana

### Funcionalidad 9: Gestión de navegación y continuidad
- [ ] Después de configurar chat, cerrar pestaña del perfil
- [ ] Volver a la página de resultados de búsqueda
- [ ] Implementar selección del siguiente perfil
- [ ] Repetir proceso con el siguiente perfil

### Funcionalidad 10: Panel de control en Snap Lead Manager
- [ ] Diseñar interfaz para monitorear conversaciones activas
- [ ] Implementar vista de estadísticas básicas
- [ ] Crear sistema de notificaciones de nuevos mensajes
- [ ] Desarrollar opción para intervención manual

### Mejoras y optimizaciones
- [ ] Implementar manejo de errores
- [ ] Añadir opciones de configuración 
- [ ] Desarrollar sistema de logs para seguimiento de acciones
- [ ] Implementar medidas anti-detección

## Flujo N8N necesario (documentación)

### Flujo 1: Evaluación de perfiles
- [ ] Crear nodo de recepción de datos de perfil
- [ ] Implementar análisis básico del perfil (keywords, intereses)
- [ ] Desarrollar sistema de puntuación para calificar leads
- [ ] Configurar nodo de decisión (proceder/no proceder)
- [ ] Crear nodo para generación de mensaje personalizado
- [ ] Implementar respuesta a Snap Lead Manager con instrucciones

### Flujo 2: Gestión de conversaciones
- [ ] Crear nodo para recepción de mensajes del lead
- [ ] Implementar routing a diferentes agentes IA según contexto
- [ ] Desarrollar sistema de generación de respuestas
- [ ] Configurar nodos para detección de oportunidades de venta
- [ ] Implementar mecanismos de escalado a humanos
- [ ] Crear nodo de respuesta a Snap Lead Manager

## Estructura del README.md

Para cada funcionalidad completada, actualizar README.md con:

```
# Snap Lead Manager - Extensión para Facebook con integración N8N

## Funcionalidad: [Nombre]

### Implementación
- Descripción técnica
- Métodos utilizados
- Desafíos y soluciones

### Testing
- Escenarios probados
- Resultados

### Código relevante
```javascript
// Código clave con comentarios
```
```

## Notas importantes
- Snap Lead Manager debe usarse de manera ética y respetando los términos de servicio de Facebook
- La automatización excesiva puede resultar en restricciones de cuenta
- Se requiere una instancia de N8N configurada correctamente para el funcionamiento completo
- Todas las interacciones deben cumplir con regulaciones de privacidad como GDPR/CCPA