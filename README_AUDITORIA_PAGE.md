# 🎨 AuditoriaPage.jsx - Documentación Frontend

## ✅ Estado: COMPLETAMENTE IMPLEMENTADO

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- `frontend/src/pages/AuditoriaPage.jsx` (700+ líneas)

### Archivos Modificados
- `frontend/src/App.js` - Agregado import y ruta
- `frontend/src/components/Sidebar.jsx` - Agregado link en menú
- `frontend/src/api/services.js` - Agregados 6 endpoints

---

## 🎯 Funcionalidades Implementadas

### 1. **Cards de Estadísticas**
- Muestra las 4 tablas más modificadas
- Contador de acciones por tipo (INSERT/UPDATE/DELETE)
- Diseño con gradientes y glassmorphism

### 2. **Alertas de Actividad Sospechosa**
- Banner rojo cuando se detecta actividad anormal
- Muestra las 3 alertas más recientes
- Información de usuario, tipo de alerta y detalles

### 3. **Filtros Avanzados**
- Tabla (dropdown con 13 opciones)
- Operación (INSERT/UPDATE/DELETE)
- Fecha inicio y fin
- Límite de registros (25/50/100/200)
- Botón para limpiar filtros

### 4. **Tabla de Registros**
- 8 columnas:
  - Fecha/Hora (con ícono de reloj)
  - Usuario (con ícono de usuario)
  - Tabla (badge con fondo)
  - Operación (badge con colores: verde=INSERT, azul=UPDATE, rojo=DELETE)
  - Registro ID (formato mono)
  - Campos Modificados (badges azules, máx 3 visibles + contador)
  - IP Address (formato mono)
  - Acciones (botón "Ver" con ícono de ojo)
- Hover effect en cada fila
- Estado vacío con ícono y mensaje
- Loading state con spinner

### 5. **Modal de Detalle**
- Header con título dinámico
- Información general en cards:
  - Usuario
  - Fecha y Hora
  - Operación (badge con color)
  - IP Address
- User Agent completo
- Campos modificados (badges azules)
- Datos Anteriores (before) en JSON formateado
- Datos Nuevos (after) en JSON formateado
- Indicador visual (punto rojo/verde) para before/after
- Botón cerrar

### 6. **Exportación CSV**
- Botón con ícono de descarga
- Respeta filtros de fecha
- Nombre de archivo con fecha actual
- Toast de confirmación

### 7. **Toast Notifications**
- Success: verde
- Error: rojo
- Warning: amarillo
- Info: azul
- Auto-cierre en 3 segundos

---

## 🎨 Diseño

### Paleta de Colores
- **Fondo**: slate-900
- **Cards**: slate-800
- **Borders**: slate-700
- **Texto principal**: white
- **Texto secundario**: slate-300/slate-400
- **Acentos**: purple-500, purple-600, pink-600

### Operaciones (Color Coding)
- **INSERT**: Verde (green-400/green-500)
- **UPDATE**: Azul (blue-400/blue-500)
- **DELETE**: Rojo (red-400/red-500)

### Componentes Reutilizados
- `PageHeader` con gradiente purple → pink
- `Toast` para notificaciones
- Heroicons para todos los íconos

---

## 🔌 Integración Backend

### Endpoints Consumidos

```javascript
// Lista de auditorías con filtros
GET /api/auditoria?tabla=&operacion=&fecha_inicio=&fecha_fin=&limite=

// Historial de un registro específico
GET /api/auditoria/historial/:tabla/:id

// Estadísticas agregadas
GET /api/auditoria/estadisticas?fecha_inicio=&fecha_fin=

// Actividad sospechosa
GET /api/auditoria/actividad-sospechosa

// Lista de tablas auditadas
GET /api/auditoria/tablas

// Exportar a CSV
GET /api/auditoria/exportar?formato=csv&fecha_inicio=&fecha_fin=
```

### Headers Requeridos
Todos los endpoints requieren:
```javascript
{
  Authorization: `Bearer ${token}`
}
```

### Roles Permitidos
Solo usuarios con rol `admin` o `director` pueden acceder.

---

## 🚀 Cómo Usar

### 1. Acceder a la Página
- Iniciar sesión como admin o director
- En el sidebar, hacer clic en **"Auditoría del Sistema"** (ícono morado)
- La ruta es: `/auditoria`

### 2. Ver Registros
- Por defecto muestra los últimos 50 registros
- Ordenados por fecha descendente (más recientes primero)

### 3. Filtrar Registros
1. Hacer clic en **"Mostrar Filtros"**
2. Seleccionar:
   - Tabla específica (ej: calificaciones)
   - Tipo de operación (INSERT/UPDATE/DELETE)
   - Rango de fechas
   - Cantidad de registros
3. Hacer clic en **"Actualizar"**
4. Para limpiar: **"Limpiar Filtros"**

### 4. Ver Detalles
1. Hacer clic en el botón **"Ver"** de cualquier registro
2. Se abre un modal con:
   - Información completa del usuario
   - Datos antes y después del cambio
   - Campos específicos modificados
   - IP y navegador usado
3. Cerrar con el botón **"Cerrar"** o la X

### 5. Exportar Datos
1. (Opcional) Aplicar filtros de fecha
2. Hacer clic en **"Exportar CSV"**
3. El archivo se descarga automáticamente con nombre `auditoria_YYYY-MM-DD.csv`

### 6. Alertas de Seguridad
- Si aparece un banner rojo en la parte superior, indica actividad sospechosa
- Revisar las alertas mostradas
- Hacer clic en cada alerta para más detalles

---

## 📱 Responsive Design

La página es completamente responsive:

### Desktop (> 1024px)
- Grid de 4 columnas para estadísticas
- Grid de 5 columnas para filtros
- Tabla completa con todas las columnas

### Tablet (768px - 1024px)
- Grid de 2-3 columnas para estadísticas
- Grid de 3 columnas para filtros
- Tabla con scroll horizontal

### Mobile (< 768px)
- Grid de 1 columna para estadísticas
- Grid de 1 columna para filtros
- Tabla con scroll horizontal
- Modal ocupa 100% del viewport

---

## 🔍 Casos de Uso Reales

### Caso 1: "¿Quién cambió esta calificación?"
1. Filtrar por tabla: "calificaciones"
2. Buscar el registro por ID o fecha
3. Hacer clic en "Ver"
4. Revisar "Datos Anteriores" vs "Datos Nuevos"
5. Ver qué nota tenía antes y después

### Caso 2: "¿Qué hizo el profesor X hoy?"
1. Aplicar filtro de fecha: Hoy
2. Buscar visualmente por email del profesor
3. Ver todas sus acciones en la tabla
4. Hacer clic en "Ver" para detalles de cada acción

### Caso 3: "Exportar auditoría del mes"
1. Filtro fecha inicio: 01/01/2026
2. Filtro fecha fin: 31/01/2026
3. Hacer clic en "Exportar CSV"
4. Abrir el archivo en Excel

### Caso 4: "Revisar actividad sospechosa"
1. Si aparece el banner rojo, revisar las alertas
2. Filtrar por usuario sospechoso
3. Ver todas sus acciones
4. Exportar evidencia en CSV

---

## 🛠️ Personalización

### Cambiar Colores del Tema
```javascript
// En AuditoriaPage.jsx, línea ~225
gradientFrom="purple-600"  // Cambiar color inicial
gradientTo="pink-600"       // Cambiar color final
```

### Cambiar Límite por Defecto
```javascript
// En AuditoriaPage.jsx, línea ~50
limite: 50,  // Cambiar a 100, 200, etc.
```

### Agregar Más Filtros
```javascript
// Agregar en el estado filtros:
const [filtros, setFiltros] = useState({
  // ... filtros existentes
  usuario_email: "",  // Nuevo filtro
});

// Agregar input en la sección de filtros
```

---

## 🐛 Troubleshooting

### Error: "No se puede cargar la auditoría"
- **Causa**: Backend no está corriendo o token expiró
- **Solución**: Verificar que el backend esté en puerto 4000, verificar token

### Error: "No tienes permisos para acceder"
- **Causa**: Usuario no es admin ni director
- **Solución**: Iniciar sesión con usuario admin o director

### No aparecen registros
- **Causa**: No hay datos en la tabla auditoria
- **Solución**: Realizar cambios en el sistema (crear estudiante, modificar calificación, etc.)

### Modal no se cierra
- **Causa**: JavaScript bloqueado o error en render
- **Solución**: Refrescar la página (F5)

### Exportación CSV falla
- **Causa**: Muchos registros o backend no responde
- **Solución**: Aplicar filtros de fecha más específicos

---

## 📊 Estructura de Datos

### Objeto Auditoria
```javascript
{
  id_auditoria: 123,
  tabla_nombre: "calificaciones",
  registro_id: "456",
  operacion: "UPDATE",
  usuario_id: 1,
  usuario_email: "admin@escuela.com",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  fecha_hora: "2026-01-01T10:30:00Z",
  datos_anteriores: {
    nota: 85,
    nota_cualitativa: "AS"
  },
  datos_nuevos: {
    nota: 95,
    nota_cualitativa: "AA"
  },
  campos_modificados: ["nota", "nota_cualitativa"],
  escuela_id: 1
}
```

### Objeto Estadística
```javascript
{
  tabla_nombre: "calificaciones",
  total_acciones: 450,
  inserciones: 100,
  actualizaciones: 340,
  eliminaciones: 10,
  usuarios_unicos: 12
}
```

### Objeto Actividad Sospechosa
```javascript
{
  usuario_email: "profesor@escuela.com",
  tipo_alerta: "Múltiples cambios en corto tiempo",
  detalles: "50 modificaciones en 5 minutos",
  fecha_deteccion: "2026-01-01T11:00:00Z"
}
```

---

## 🎯 Mejoras Futuras (Opcionales)

### 1. Gráficos
- Agregar Chart.js o Recharts
- Gráfico de línea: acciones por día
- Gráfico de barras: acciones por tabla
- Gráfico de pastel: distribución INSERT/UPDATE/DELETE

### 2. Búsqueda Avanzada
- Buscador de texto en usuario_email
- Búsqueda en JSONB (datos_anteriores/datos_nuevos)
- Autocompletado de usuarios

### 3. Paginación
- Implementar paginación real (actualmente usa límite)
- Botones: Primera, Anterior, Siguiente, Última
- Mostrar: "Mostrando 1-50 de 450"

### 4. Timeline View
- Vista alternativa en formato timeline
- Línea de tiempo con eventos
- Agrupación por día/hora

### 5. Notificaciones en Tiempo Real
- WebSockets para alertas en vivo
- Notificación push cuando hay actividad sospechosa
- Badge con contador de nuevas alertas

---

## ✅ Checklist de Implementación

- [x] Crear componente AuditoriaPage.jsx
- [x] Integrar con API de auditoría
- [x] Agregar ruta en App.js
- [x] Agregar link en Sidebar
- [x] Agregar endpoints en services.js
- [x] Implementar filtros avanzados
- [x] Implementar modal de detalle
- [x] Implementar exportación CSV
- [x] Agregar cards de estadísticas
- [x] Agregar alertas de actividad sospechosa
- [x] Responsive design
- [x] Toast notifications
- [x] Loading states
- [x] Empty states
- [x] Protección por roles
- [ ] Tests unitarios (opcional)
- [ ] Tests E2E (opcional)

---

## 📚 Recursos

### Documentación Relacionada
- `backend/README_AUDITORIA.md` - Documentación del backend
- `backend/GUIA_USO_AUDITORIA.md` - Guía de uso completa
- `backend/ESTADO_FINAL_AUDITORIA.md` - Estado del sistema

### Componentes Usados
- React 18+
- React Router 7
- Heroicons
- date-fns
- Tailwind CSS

---

**Fecha de implementación:** 2026-01-01  
**Versión:** 1.0.0  
**Estado:** ✅ OPERACIONAL
