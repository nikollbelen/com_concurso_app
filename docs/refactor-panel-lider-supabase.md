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

---

## Actualización (2026-07-05): panel docente multi-equipo

Un docente puede liderar **uno o más** equipos. Antes el panel resolvía "el equipo del
docente" por `usuarios.team_id`, pero esa columna es la relación **alumno↔equipo**, no
la de líder. El panel ahora resuelve los equipos por **`teams.leader_id = <id del docente>`**.

### Cambios en la capa de datos
[`mission-progress.repository.ts`](../modules/missions/infrastructure/repositories/mission-progress.repository.ts):

- `getReviewData(teamId)` → **`getLeaderReviewData(leaderId)`**: devuelve un bloque
  `LeaderTeamReview` por **cada** equipo liderado (info del equipo + evidencias en
  revisión + nº de aprobadas), ordenado por nombre de equipo. Devuelve `[]` si el
  docente no lidera ninguno.
  1. `SELECT id FROM teams WHERE leader_id = <docente>` (no `usuarios.team_id`).
  2. En paralelo, con `.in('team_id', teamIds)`: `vista_equipos_completos`, evidencias
     en `review` y conteo de `completed`; luego se agrupa por equipo en memoria.
- La interfaz `ReviewData` se reemplaza por `LeaderTeamReview` (bloque por equipo).

### Cambios en hooks
[`useReviewData.ts`](../modules/missions/presentation/hooks/useReviewData.ts):

- `useReviewData(teamId)` → **`useLeaderReviewData(leaderId)`** (queryKey `['leader-review-data', leaderId]`).
- `useSetMissionStatus(teamId)` → **`useLeaderSetMissionStatus(leaderId)`**: al aprobar/
  rechazar invalida todos los equipos del docente.

### Cambios en la UI
[`app/leader/panel/page.tsx`](../app/leader/panel/page.tsx): renderiza un bloque por
equipo liderado; ya no asume un único equipo. (Se eliminó el botón "Ver mapa".)

### Seed de prueba
El seed crea **2 docentes por colegio**: `lider_i_1` lidera los equipos 1 y 2 (caso
multi-equipo), `lider_i_2` el equipo 3. Los docentes tienen `team_id = NULL`. Cuenta de
prueba multi-equipo: **`lider_1_1`**. Ver [seed-datos-prueba.md](seed-datos-prueba.md).
