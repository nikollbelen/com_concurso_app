# Refactor: Panel de Líder/Docente a Supabase

## Resumen

Se refactorizó `app/leader/panel/page.tsx` para conectar el panel del docente con datos reales de Supabase, implementando bypass de caché, dashboard del equipo y bandeja de revisión de misiones (Aprobar/Rechazar).

---

## Cambios realizados

### Paso 1: Autenticación y Bypass de Caché
- No se confía en `user.team_id` de Zustand
- Se ejecuta `supabase.auth.getSession()` para obtener el ID de usuario seguro
- Consulta fresca: `SELECT team_id FROM usuarios WHERE id = auth.uid()`
- Si el líder no tiene `team_id` → pantalla "Acceso Restringido"

### Paso 2: Consulta Paralela (Promise.all)
Tres consultas simultáneas:
1. **Datos del Equipo**: `vista_equipos_completos` — nivel, XP, miembros (JSON), nombre del colegio
2. **Estadísticas**: conteo de misiones `completed`
3. **Bandeja de Revisión**: `mission_progression` con JOIN `missions!inner(title, points, type)` filtrado por `status = 'review'`

### Paso 3: Dashboard Dinámico
- Nombre del equipo y nivel desde `vista_equipos_completos`
- XP actual en sidebar
- Total de misiones aprobadas y cantidad de alumnos

### Paso 4: Bandeja de Revisión
- Mapea resultados de misiones en estado `review`
- Muestra foto (photo URL), título (missions.title), puntos (missions.points)
- Botones Aprobar (verde) y Rechazar (rojo) por tarjeta

### Paso 5: Mutaciones (UI Optimista)
- **Aprobar**: `UPDATE status = 'completed'` + filter optimista + re-fetch de XP
- **Rechazar**: `UPDATE status = 'rejected'` + filter optimista
- Los puntos NO se actualizan manualmente — el trigger `trigger_mision_completada` en Supabase lo maneja automáticamente

### Estados de página
- `loading-auth` — verificando sesión
- `loading-data` — cargando datos
- `no-team` — docente sin equipo asignado
- `error` — error de conexión con botón reintentar
- `ready` — panel funcionando

---

## Archivos modificados

- `app/leader/panel/page.tsx` — refactor completo (mock → Supabase)
- `AGENTS.md` — estado cambiado de "revision" a "completa"

## Dependencias

- Trigger DB `trigger_mision_completada` actualiza points/level automáticamente
- Vista `vista_equipos_completos` debe tener GRANT SELECT para authenticated
