# Variantes de pregunta para misiones de trivia (`mission_questions`)

## Resumen

Las misiones de trivia dejan de tener **una sola** pregunta embebida en `missions`
(`question` / `options` / `correct_answer`) y pasan a poder tener **1..N variantes**
en la tabla nueva `mission_questions`. Al **empezar** la misión, a cada equipo se le
asigna **una variante al azar** que queda fijada en `mission_progression.question_id`.

**Motivación:** con una única pregunta por misión, equipos del mismo colegio que van
a la misma ubicación física se pasan la respuesta. Con variantes por equipo, copiar
"la respuesta de la misión" deja de servir porque cada equipo responde algo distinto.

> **Alcance:** solo trivia. `photo` y `creative` tienen un prompt único que sigue
> viviendo en `missions.question` y **no** usan esta tabla (no se les asigna variante,
> `question_id` queda `NULL`).

---

## Modelo de datos

Migración: [`20260705000005_mission_question_variants.sql`](../supabase/migrations/20260705000005_mission_question_variants.sql)

### Tabla `mission_questions`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `mission_id` | uuid | FK → `missions.id` `ON DELETE CASCADE` (las variantes mueren con la misión) |
| `question` | text | enunciado |
| `options` | json | mismo formato que `missions.options`: `[{ "label": "A", "text": "…" }, …]` |
| `correct_answer` | text | letra `'A'..'D'`, igual que `missions.correct_answer` |
| `created_at` / `updated_at` / `deleted_at` | — | soft-delete via `deleted_at` |

- Índice `mission_questions_mission_id_idx` para la asignación aleatoria.
- **RLS**: lectura pública (`select` para `anon`/`authenticated`/`service_role`), igual que `missions`.
- **Backfill idempotente**: cada trivia existente genera su variante #1 copiando su
  `question/options/correct_answer` actuales. Nada se rompe; añadir más variantes es
  simplemente insertar filas con el mismo `mission_id`.

### `mission_progression.question_id`

Columna nueva `uuid` (nullable), FK → `mission_questions.id` `ON DELETE SET NULL`.
Registra **qué variante le tocó a este equipo en esta misión**. Se fija al empezar la
misión y **no se reasigna**: el equipo ve siempre la misma pregunta aunque reabra.
`NULL` = sin variante (photo/creative, o trivia aún no empezada).

---

## Flujo

1. **Empezar misión** → [`startMission`](../modules/missions/infrastructure/repositories/mission-progress.repository.ts)
   llama a `pickRandomVariantId(missionId)`:
   - lee las variantes activas (`deleted_at IS NULL`) de la misión,
   - si no hay filas → `null` (photo/creative),
   - si hay → elige una al azar.
   La asignación es **estable**: si la fila de progreso ya tiene `question_id` no se
   reasigna.
2. **Resolver** → [`mision/[id]/page.tsx`](../app/(student)/mision/[id]/page.tsx) usa
   [`useAssignedQuestion`](../modules/missions/presentation/hooks/useMissionQuestion.ts)
   para traer la variante asignada y muestra `trivia.question/options/correctAnswer`.
   Si aún no hay variante (misión no empezada o BD sin variantes) cae a la pregunta
   base de la misión.

---

## Archivos

| Archivo | Rol |
|---|---|
| [`supabase/migrations/20260705000005_mission_question_variants.sql`](../supabase/migrations/20260705000005_mission_question_variants.sql) | tabla + `question_id` + backfill + RLS |
| [`modules/missions/domain/entities/mission.ts`](../modules/missions/domain/entities/mission.ts) | entidad + Zod `MissionQuestion` (opciones ya texto plano, respuesta ya índice) |
| [`modules/missions/infrastructure/repositories/mission-questions.repository.ts`](../modules/missions/infrastructure/repositories/mission-questions.repository.ts) | `getMissionQuestions` (todas las variantes) y `getAssignedQuestion` (la del equipo) |
| [`modules/missions/presentation/hooks/useMissionQuestion.ts`](../modules/missions/presentation/hooks/useMissionQuestion.ts) | hook `useAssignedQuestion(teamId, missionId)` |
| [`modules/missions/infrastructure/repositories/mission-progress.repository.ts`](../modules/missions/infrastructure/repositories/mission-progress.repository.ts) | `pickRandomVariantId` + asignación en `startMission` |
| [`app/(student)/mision/[id]/page.tsx`](../app/(student)/mision/[id]/page.tsx) | resuelve usando la variante asignada; `in_progress` también puede resolver |

Sigue el patrón de capa de datos del proyecto (repo mapea fila cruda → entidad Zod;
hook TanStack Query; la página solo consume hooks). Ver
[migracion-capa-datos-supabase.md](migracion-capa-datos-supabase.md).

---

## Futuro

- **No repetir variante dentro del mismo colegio**: `pickRandomVariantId` solo tendría
  que excluir las variantes ya asignadas a otros equipos de la misma escuela (filtrar
  por `school_id` cruzando `teams`).
- Editor de variantes para el admin (`getMissionQuestions` ya expone el conteo/listado).
