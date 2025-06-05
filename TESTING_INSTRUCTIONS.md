# 🧪 INSTRUCCIONES DE PRUEBA: Sistema de Almacenamiento Consolidado

## 📋 PASOS PARA PROBAR LA SOLUCIÓN

### 1️⃣ **Cargar la Extensión**

1. Abre Google Chrome
2. Ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador" (esquina superior derecha)
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta: `/Users/paulo/Documents/Proyectos/Personales/Extension Chrome - Lead Manager Pro/lead-manager-pro`

### 2️⃣ **Verificar que se Cargó Correctamente**

1. Verifica que aparezca "Lead Manager Pro" en la lista de extensiones
2. Asegúrate de que esté activada (toggle en azul)
3. Si hay errores, revísalos en la sección de errores de la extensión

### 3️⃣ **Abrir Facebook y Ejecutar Pruebas**

1. Navega a `https://facebook.com`
2. Inicia sesión si es necesario
3. Abre las herramientas de desarrollador (F12)
4. Ve a la pestaña "Console"

### 4️⃣ **Ejecutar Prueba Rápida**

Copia y pega este código en la consola:

```javascript
// Cargar el script de prueba
const script = document.createElement("script");
script.src = chrome.runtime.getURL("debug/quick-storage-test.js");
document.head.appendChild(script);
```

O alternativamente, copia todo el contenido de `debug/quick-storage-test.js` directamente en la consola.

### 5️⃣ **Interpretar los Resultados**

#### ✅ **Resultado Esperado (ÉXITO)**

```
🚀 PRUEBA RÁPIDA: Sistema de Almacenamiento Consolidado
═══════════════════════════════════════════════════════════════
📋 1. VERIFICANDO ESTADO ACTUAL...
📦 Datos actuales en chrome.storage: {lmp_group_search_options: {publicGroups: true, ...}}
💾 Datos en localStorage: {publicGroups: true, ...}
🔧 2. PROBANDO FUNCIONALIDAD DEL CHECKBOX...
🔄 Cambiando "Solo públicos": true → false
💾 Configuración guardada
✅ 3. VERIFICACIÓN DE GUARDADO...
✅ ¡ÉXITO! El checkbox se guardó correctamente en ambos sistemas
🧹 4. VERIFICANDO LIMPIEZA DE DATOS ANTIGUOS...
✅ Excelente: No hay datos antiguos restantes
✅ localStorage antiguo limpiado correctamente
🎯 5. RESUMEN FINAL...
✅ Sistema unificado funcionando
✅ Checkbox guarda correctamente
✅ Sincronización Chrome ↔ Local
✅ Datos antiguos limpiados
🎉 ¡SISTEMA FUNCIONANDO PERFECTAMENTE!
```

#### ❌ **Posibles Problemas**

**Error: StorageConsolidator no disponible**

- Solución: Recarga la extensión desde `chrome://extensions/`

**Error: Datos antiguos restantes**

- Ejecuta: `runManualMigration()`
- Luego ejecuta: `quickStorageTest()`

**Error: Checkbox no se guarda**

- Verifica que no hay errores de JavaScript en la consola
- Revisa que el manifest.json tiene storageConsolidator.js incluido

### 6️⃣ **Probar Funcionalidad Real**

#### **Buscar la Interfaz de la Extensión**

1. En Facebook, busca el sidebar de Lead Manager Pro (debería aparecer automáticamente)
2. Si no aparece, verifica que estés en una página apropiada de Facebook

#### **Probar el Checkbox "Solo públicos"**

1. Encuentra la sección de búsqueda de grupos
2. Localiza el checkbox "Solo públicos"
3. Márcalo y desmárcalo varias veces
4. Recarga la página
5. Verifica que el estado se mantiene

### 7️⃣ **Verificación Adicional con DevTools**

```javascript
// Verificar datos actuales
chrome.storage.local.get(["lmp_group_search_options"], console.log);

// Verificar que no hay datos antiguos
chrome.storage.local.get(
  [
    "leadManagerGroupFilters",
    "snap_lead_manager_group_options",
    "groupPublic",
    "groupPrivate",
  ],
  console.log
);

// Ver localStorage
console.log("localStorage:", localStorage.getItem("lmp_group_search_options"));
```

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Si la extensión no carga:**

1. Verifica errores en `chrome://extensions/`
2. Revisa que manifest.json es válido
3. Comprueba que todos los archivos existen

### **Si hay errores en consola:**

1. Busca errores relacionados con `storageConsolidator`
2. Verifica que los módulos se cargan en el orden correcto
3. Revisa permisos de storage en manifest.json

### **Si el checkbox no funciona:**

1. Ejecuta `runManualMigration()` en consola
2. Limpia el storage: `chrome.storage.local.clear()`
3. Recarga la extensión y prueba de nuevo

### **Si hay datos duplicados:**

1. Ejecuta el script de limpieza: `debug/storage-cleanup.js`
2. Fuerza la migración: `runManualMigration()`

## 📊 MÉTRICAS DE ÉXITO

- ✅ Extensión carga sin errores
- ✅ Console muestra "🎉 ¡SISTEMA FUNCIONANDO PERFECTAMENTE!"
- ✅ Checkbox mantiene estado después de recargar página
- ✅ No hay claves de almacenamiento duplicadas
- ✅ Búsquedas respetan la configuración del checkbox

---

**🎯 Objetivo:** Confirmar que el checkbox "Solo públicos" y todo el sistema de filtros de grupos funcionan correctamente con el sistema de almacenamiento consolidado.
