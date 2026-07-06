# Migraciones y Esquema Supabase — Guardianes de Arequipa

## Resumen

Se implementaron migraciones progresivas que transformaron el esquema desde tablas base hasta un modelo completo con vistas, triggers, RLS y funciones. Todo el schema está versionado en `supabase/migrations/`.

## Migraciones (orden cronológico)

### 1. `20260614185117_initial_migration.sql`
Schema base con tablas: `usuarios`, `schools`, `teams`, `roles`, `missions`, `chapters`, `mission_progression`, `insignia`, `team_insignia`. Relaciones FK básicas.

### 2. `20260614190251_funcion_auth.sql`
`custom_access_token_hook` — función SECURITY DEFINER que inyecta `role_id` y `team_id` en los claims JWT de Supabase Auth. Con paracaídas (EXCEPTION WHEN OTHERS) para evitar errores 500 en login.

### 3. `20260617000000_trigger_nuevo_usuario.sql`
Trigger `on_auth_user_created` (AFTER INSERT ON auth.users) que crea automáticamente fila en `public.usuarios` con alias = parte local del email.

### 4. `20260617000001_fix_trigger_upsert.sql`
Fix del trigger anterior para usar `ON CONFLICT DO UPDATE`, permitiendo que seed scripts sobrescriban datos.

### 5. `20260617000003_hook_permisos.sql`
Grants para `supabase_auth_admin`: EXECUTE en el hook + SELECT en `usuarios`. Revoca de otros roles.

### 6. `20260617000004_rls_policies.sql`
Políticas RLS básicas: usuarios ven/editan su propio perfil; roles, schools, teams son lectura para autenticados.

### 7. `20260617173441_permisos_auth.sql`
GRANT USAGE ON SCHEMA public + EXECUTE del hook a `supabase_auth_admin`. Revoca de authenticated/anon/public.

### 8. `20260617211221_adaptacion_json.sql` (migración principal)
- Crea tabla `fragments` (id, name, icon)
- Agrega columnas faltantes a chapters (color, id_fragment, required_level, subtitle, total_missions)
- Agrega columnas a missions (coordinates, correct_answer, location, options, question, type)
- Convierte `mission_progression.status` de boolean a text (available, review, completed, rejected, locked)
- Crea vista `vista_equipos_completos` (security_invoker ON) con members JSON y earned_fragments
- Crea función `actualizar_estadisticas_mision()` — trigger que al aprobar misión suma puntos al equipo y colegio, y maneja level-up
- Crea trigger `trigger_mision_completada` (AFTER UPDATE ON mission_progression)
- RLS policies para lectura pública de chapters, fragments, insignia, missions, roles, schools, teams, usuarios
- RLS para UPDATE/INSERT en mission_progression según role_id desde JWT claims

### 9. `20260618231724_add_school_short.sql`
`ALTER TABLE schools ADD COLUMN short text` — nombre corto para ranking.

### 10. `20260623000000_grant_select.sql`
`GRANT SELECT ON vista_equipos_completos TO authenticated` y `TO anon`.

### 11. `20260705000000_levels_catalog.sql`
Catálogo de niveles y lógica de progresión de equipos. Detalle en [catalogo-niveles.md](catalogo-niveles.md).

### 12. `20260705000001_mission_in_progress.sql`
Añade el estado `in_progress` a `mission_progression` (el alumno pulsó "Empezar misión"
y va en camino al lugar físico, antes de enviar evidencia).

### 13. `20260705000002_app_settings.sql`
Tabla `app_settings` (configuración global del evento; p. ej. si el concurso ya comenzó).

### 14. `20260705000003_one_active_mission_per_team.sql`
Índice único que garantiza **una sola misión activa (`in_progress`) por equipo**.

### 15. `20260705000004_ranking_tiebreak_last_completed.sql`
Desempate de ranking por última misión completada (colegios y equipos). Detalle en
[ranking-desempate-ultima-mision.md](ranking-desempate-ultima-mision.md).

### 16. `20260705000005_mission_question_variants.sql`
Tabla `mission_questions` (1..N variantes de pregunta por misión de trivia) + columna
`mission_progression.question_id` (variante asignada al equipo) + backfill idempotente
de las trivias existentes a su variante #1. Detalle en
[variantes-pregunta-trivia.md](variantes-pregunta-trivia.md).

## Tablas principales

| Tabla | Propósito |
|---|---|
| `usuarios` | Perfiles de usuario (FK a auth.users) |
| `roles` | student, leader, director, admin (UUIDs fijos) |
| `schools` | Colegios con points, missions_completed, short, color |
| `teams` | Equipos con leader_id, points, level, next_level_points |
| `missions` | Definiciones de misión con question, options, type, location |
| `mission_questions` | Variantes de pregunta (1..N por trivia); se asigna una al azar por equipo |
| `mission_progression` | Progreso por equipo (team_id, mission_id, status TEXT, photo, question_id) |
| `chapters` | Capítulos narrativos con number, required_level, id_fragment |
| `fragments` | Fragmentos coleccionables (5, uno por capítulo) |

## Vista clave

**`vista_equipos_completos`** — denormaliza teams + schools + miembros (JSON) + fragmentos ganados (JSON). Usada por paneles de líder y estudiante.

## Trigger de negocio

**`trigger_mision_completada`** → `actualizar_estadisticas_mision()`:
- Solo actúa en UPDATE con status = 'completed'
- Suma puntos de la misión al equipo y al colegio
- Incrementa `missions_completed`
- Maneja level-up automático cuando se supera `next_level_points`

## Estados de misión

`available` → `in_progress` (alumno pulsó "Empezar" y va en camino) → `review`
(alumno envía evidencia) → `completed` o `rejected` (docente aprueba/rechaza). También
`locked` para misiones bloqueadas por capítulo no disponible. Solo puede haber **una
misión `in_progress` por equipo** (índice único, migración #14).
