# Conexión de Paneles con Supabase

## Resumen

Se conectaron 4 vistas/componentes del frontend con datos reales de Supabase, eliminando datos mock y aplicando patrón de **bypass de caché** (no confiar en Zustand para datos vivos).

---

## 1. Panel del Estudiante (`/student/panel`)

**Archivo:** `app/student/panel/page.tsx`

**Cambios:**
- Elimina dependencia de JSON locales (`chapters.json`, `missions.json`, `teams.json`)
- Obtiene `team_id` desde `usuarios` vía `supabase.auth.getSession()` (bypass de Zustand)
- Si no tiene equipo, muestra pantalla "Sin Equipo Asignado"
- Promise.all con 4 consultas paralelas:
  - `vista_equipos_completos` — datos del equipo, nivel, XP, fragmentos
  - `chapters` con JOIN a `fragments` — capítulos y fragmentos
  - `mission_progression` — progreso con JOIN a `missions` para stats por capítulo
  - `schools` — conteo total de colegios
- Cálculos en vivo: misiones completadas, en revisión, capítulos desbloqueados, nivel, XP bar
- Fragmentos se muestran desde `fragments.icon` (rutas `/images/capitulo{N}.png`)

---

## 2. Ranking (`/ranking`)

**Archivo:** `app/(student)/ranking/page.tsx`

**Cambios:**
- Elimina array estático `SCHOOLS` con 16 colegios mock
- Consulta `schools` con `teams(id)` JOIN, ordenado por points DESC
- Agrega `schoolId` y `schoolShortName` al objeto `AuthUser` en `authStore.ts`
- Cálculos dinámicos: posición del usuario, XP líder, total misiones completadas
- Tooltip de posición solo se muestra si el usuario tiene colegio asignado
- El nombre de escuela del usuario (`user.schoolId`) se usa para resaltar su fila

---

## 3. Panel del Líder/Docente (`/leader/panel`)

**Archivo:** `app/leader/panel/page.tsx`

**Cambios:**
- Reemplaza `PENDING_MISSIONS` mock con datos reales de Supabase
- 3 estados de página: `loading-auth`, `loading-data`, `no-team`, `error`, `ready`
- Obtiene `team_id` fresco desde `usuarios` (bypass de Zustand)
- Si el líder no tiene equipo asignado → pantalla "Acceso Restringido"
- Promise.all con 3 consultas:
  - `vista_equipos_completos` — datos del equipo, miembros, XP, nivel
  - `mission_progression` con `missions!inner(title, points, type)` — evidencias en `review`
  - `mission_progression` count — total de misiones `completed`
- Botones **Aprobar** y **Rechazar** con UI optimista:
  - `handleApprove`: update a `status: 'completed'` + re-fetch de XP del equipo
  - `handleReject`: update a `status: 'rejected'`
  - Los puntos NO se actualizan manualmente — el trigger DB lo hace
- Sidebar muestra miembros del equipo desde `vista_equipos_completos.members` (JSON)

---

## 4. AdminBottomSheet (HUD global)

**Archivo:** `shared/ui/components/AdminBottomSheet.tsx`

**Cambios:**
- Elimina props `top3`, `totalSchools`, `totalMissionsCompleted`
- Componente ahora auto-contenido: fetch interno a `schools` con `teams(id)` JOIN
- Muestra top 3 del ranking y estadísticas globales
- Incluye estado de carga con shimmer ("CONECTANDO AL CENTRO DE MANDO...")
- Preparado para suscripción en tiempo real vía `supabase.channel()` (comentado)

---

## Patrón común: Bypass de Caché

En todos los paneles se usa este flujo:

```ts
const { data: { session } } = await supabase.auth.getSession()
const { data: usuario } = await supabase.from('usuarios').select('team_id').eq('id', session.user.id).single()
const teamId = usuario.team_id
```

Luego se ejecutan consultas paralelas con `Promise.all()`.
