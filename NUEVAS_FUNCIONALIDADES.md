# Lead Manager Pro - Nuevas Funcionalidades v0.5.0

## 📋 Opciones Generales Actualizadas

### Nuevas configuraciones:
- **Scrolls máximos para mostrar resultados**: Configura el número máximo de scrolls automáticos (por defecto 50)
- **Tiempo de espera entre scrolls**: Tiempo en segundos entre cada scroll automático (por defecto 2 segundos)

### Ubicación:
- Se guardan en Extension Storage (`chrome.storage.local`)
- Accesibles desde el sidebar principal

---

## 🔍 Filtros de Búsqueda de Grupos

### Tipos de grupo:
- ✅ **Público**: Incluir grupos públicos en los resultados
- ✅ **Privado**: Incluir grupos privados en los resultados
- Se pueden seleccionar ambos tipos mediante checkboxes

### Cantidad mínima de miembros:
- Campo numérico para especificar el número mínimo de miembros
- Valor por defecto: 100 miembros

### Cantidad mínima de publicaciones:
Los grupos deben cumplir con **AL MENOS UNA** de estas condiciones:
- **Por año**: Número mínimo de publicaciones anuales (por defecto: 50)
- **Por mes**: Número mínimo de publicaciones mensuales (por defecto: 10)  
- **Por día**: Número mínimo de publicaciones diarias (por defecto: 1)

### Lógica de filtrado:
1. **Siempre** debe cumplir con el mínimo de miembros
2. **Al menos una** de las condiciones de publicaciones (año, mes o día)
3. Si cumple con publicaciones anuales → ✅ Válido
4. Si cumple con publicaciones mensuales → ✅ Válido
5. Si cumple con publicaciones diarias → ✅ Válido
6. Si no cumple ninguna → ❌ No válido

### Almacenamiento:
- Los filtros se guardan en `chrome.storage.local` bajo la clave `leadManagerGroupFilters`
- Se pueden enviar posteriormente a n8n para análisis

---

## 📱 Sidebar de Grupos Mejorado

### Nuevas herramientas disponibles:
1. **Contar miembros**: Cuenta automáticamente los miembros del grupo actual
2. **Interactuar con miembros**: Abre la interfaz de interacción con configuración personalizada

### Configuración de interacción:
- **Número de miembros a interactuar**: Cantidad máxima por sesión
- **Tiempo entre interacciones**: Delay en milisegundos entre cada interacción
- **Mensaje a enviar**: Texto personalizado para el chat privado
- **Cerrar chat automáticamente**: Opción para cerrar la ventana después de enviar

### Funcionalidades:
- ✅ Configuración persistente en Extension Storage
- ✅ Integración con el sistema de interacción existente
- ✅ Estadísticas en tiempo real del grupo actual
- ✅ Actualización automática del sidebar flotante

---

## 💾 Gestión de Datos

### Extension Storage:
Todos los datos se almacenan usando `chrome.storage.local`:

```javascript
// Opciones generales
{
  maxScrollsToShowResults: 50,
  waitTimeBetweenScrolls: 2
}

// Filtros de grupos
{
  groupTypes: { public: true, private: true },
  minMembers: 100,
  minPosts: { year: 50, month: 10, day: 1 }
}

// Configuración de interacción
{
  membersToInteract: 10,
  interactionDelay: 3000,
  messageToSend: "Mensaje personalizado",
  autoCloseChat: true
}
```

### Preparación para n8n:
Los datos están estructurados para ser enviados fácilmente a n8n para:
- Análisis de grupos encontrados
- Estadísticas de interacciones
- Reportes de actividad

---

## 🧪 Testing

### Archivo de pruebas:
`debug/new-features-tests.js`

### Cómo ejecutar:
```javascript
// En la consola del navegador
window.testNewFeatures();
```

### Tests incluidos:
- ✅ Opciones generales (cargar/guardar)
- ✅ Filtros de grupos (validación/persistencia)
- ✅ Sidebar de grupos (configuración/creación)

---

## 🚀 Instalación y Uso

### 1. Cargar la extensión:
1. Abrir Chrome → Extensiones → Modo desarrollador
2. Cargar extensión sin empaquetar
3. Seleccionar la carpeta `lead-manager-pro`

### 2. Configurar opciones:
1. Abrir sidebar principal
2. Configurar opciones generales
3. Establecer filtros de búsqueda de grupos

### 3. Usar en grupos:
1. Navegar a cualquier grupo de Facebook
2. El sidebar de grupos se activará automáticamente
3. Usar herramientas de conteo e interacción

---

## 📝 Notas de Desarrollo

### Archivos principales modificados:
- `content/modules/generalOptions.js` - Opciones simplificadas
- `content/modules/generalOptionsUI.js` - UI mejorada
- `content/modules/groupSearchFilters.js` - Nuevo módulo de filtros
- `content/modules/groupSearchFiltersUI.js` - UI de filtros
- `content/modules/groupSidebar.js` - Sidebar mejorado

### Nuevos archivos:
- `content/modules/groupSearchFilters.js`
- `content/modules/groupSearchFiltersUI.js`
- `debug/new-features-tests.js`

### Compatibilidad:
- ✅ Compatible con sistema de autenticación existente
- ✅ Compatible con sidebar flotante existente
- ✅ Compatible con sistema de interacción actual

---

## 🔄 Próximos pasos

1. **Integración con n8n**: Configurar webhooks para envío de datos
2. **Mejoras en UI**: Refinar interfaces según feedback
3. **Optimización**: Mejorar rendimiento de filtros y validaciones
4. **Reportes**: Añadir visualización de estadísticas

---

*Última actualización: $(date)*
