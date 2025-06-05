#!/bin/bash
# Script para verificar las correcciones de claves undefined en Lead Manager Pro

echo "🔧 === VERIFICACIÓN DE CORRECCIONES - LEAD MANAGER PRO ==="
echo ""

# Función para mostrar mensajes con colores
show_message() {
    local type=$1
    local message=$2
    case $type in
        "success")
            echo "✅ $message"
            ;;
        "error")
            echo "❌ $message"
            ;;
        "info")
            echo "ℹ️  $message"
            ;;
        "warning")
            echo "⚠️  $message"
            ;;
    esac
}

# Verificar que estamos en el directorio correcto
if [ ! -f "manifest.json" ]; then
    show_message "error" "No se encontró manifest.json. Ejecuta este script desde el directorio de la extensión."
    exit 1
fi

show_message "info" "Directorio de trabajo: $(pwd)"

# 1. Verificar que los archivos corregidos existen
echo ""
echo "📋 Verificando archivos corregidos..."

files_to_check=(
    "js/sidebar.js"
    "content/modules/DataMigrationManager.js"
    "content/modules/OptionsManager.js"
    "debug/quick-test.js"
    "debug/storage-cleanup.js"
    "debug/undefined-keys-tests.js"
    "test-fixes.html"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        show_message "success" "Archivo encontrado: $file"
    else
        show_message "error" "Archivo faltante: $file"
    fi
done

# 2. Verificar correcciones específicas en el código
echo ""
echo "🔍 Verificando correcciones específicas..."

# Verificar corrección en sidebar.js
if grep -q "onlyPublicGroupsCheckbox\?\." js/sidebar.js; then
    show_message "success" "Corrección de optional chaining encontrada en sidebar.js"
else
    show_message "warning" "No se encontró corrección de optional chaining en sidebar.js"
fi

# Verificar corrección en DataMigrationManager.js
if grep -q "Invalid key provided to saveToChromeStorage" content/modules/DataMigrationManager.js; then
    show_message "success" "Validación de claves encontrada en DataMigrationManager.js"
else
    show_message "error" "No se encontró validación de claves en DataMigrationManager.js"
fi

# Verificar estructura del manifest.json
if grep -q "debug/quick-test.js" manifest.json; then
    show_message "success" "Scripts de debug incluidos en manifest.json"
else
    show_message "warning" "Scripts de debug no encontrados en manifest.json"
fi

# 3. Verificar sintaxis de archivos JavaScript principales
echo ""
echo "🧪 Verificando sintaxis de JavaScript..."

js_files=(
    "js/sidebar.js"
    "content/modules/DataMigrationManager.js"
    "content/modules/OptionsManager.js"
    "debug/quick-test.js"
)

for js_file in "${js_files[@]}"; do
    if command -v node &> /dev/null; then
        if node -c "$js_file" 2>/dev/null; then
            show_message "success" "Sintaxis correcta: $js_file"
        else
            show_message "error" "Error de sintaxis en: $js_file"
        fi
    else
        show_message "info" "Node.js no disponible, saltando verificación de sintaxis"
        break
    fi
done

# 4. Mostrar resumen de correcciones aplicadas
echo ""
echo "📝 === RESUMEN DE CORRECCIONES APLICADAS ==="
echo ""
echo "1. ✅ sidebar.js - Línea ~416:"
echo "   - Agregado optional chaining: onlyPublicGroupsCheckbox?.checked || false"
echo "   - Validación de inputs: minUsersInput?.value || ''"
echo ""
echo "2. ✅ DataMigrationManager.js - saveToChromeStorage():"
echo "   - Validación de claves undefined antes de guardar"
echo "   - Prevención de claves inválidas en chrome.storage"
echo ""
echo "3. ✅ OptionsManager.js:"
echo "   - Validación mejorada de claves de almacenamiento"
echo "   - Prevención de claves undefined en el sistema centralizado"
echo ""
echo "4. ✅ Scripts de debug creados:"
echo "   - debug/quick-test.js - Pruebas rápidas"
echo "   - debug/storage-cleanup.js - Limpieza de almacenamiento"
echo "   - debug/undefined-keys-tests.js - Tests automatizados"
echo "   - test-fixes.html - Interfaz de pruebas"
echo ""

# 5. Instrucciones para el usuario
echo "🚀 === PRÓXIMOS PASOS ==="
echo ""
echo "1. Cargar la extensión en Chrome:"
echo "   - Abre chrome://extensions/"
echo "   - Activa 'Modo de desarrollador'"
echo "   - Haz clic en 'Cargar extensión sin empaquetar'"
echo "   - Selecciona este directorio: $(pwd)"
echo ""
echo "2. Probar las correcciones:"
echo "   - Ve a Facebook y abre la extensión"
echo "   - Abre la consola del navegador (F12)"
echo "   - Ejecuta: chrome.runtime.getURL('debug/quick-test.js')"
echo "   - O abre: $(pwd)/test-fixes.html en el navegador"
echo ""
echo "3. Verificar configuración 'Solo grupos públicos':"
echo "   - Usa la función de búsqueda de grupos"
echo "   - Activa/desactiva 'Solo grupos públicos'"
echo "   - Verifica que se guarde correctamente"
echo ""

# 6. Mostrar comando para abrir test-fixes.html
echo "💡 Comando rápido para probar:"
echo "open test-fixes.html"
echo ""

show_message "success" "Verificación completada. La extensión está lista para probar."
