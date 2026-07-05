# Desempate del ranking por última misión completada

## Resumen

Cuando dos o más **colegios** (o **equipos**) tienen los **mismos puntos**, sube más
arriba en la tabla de posiciones el que **completó antes su última misión** — es
decir, el que llegó primero a ese puntaje.

Antes el ranking se ordenaba **solo por `points` desc**, sin criterio de desempate,
por lo que los empates quedaban en un orden arbitrario (el que devolviera Postgres).

**Criterio final de orden:** `points DESC, last_completed_at ASC (nulls last)`.

Como los puntos de un colegio/equipo **solo cambian al completar una misión**, la
marca `last_completed_at` es exactamente el instante en que alcanzó su puntaje
actual. A menor `last_completed_at` (más temprano), mejor posición.

---

## Cambio en la base de datos

**Migración:** `supabase/migrations/20260705000004_ranking_tiebreak_last_completed.sql`

### Columna nueva

| Tabla | Columna | Tipo | Descripción |
|---|---|---|---|
| `teams` | `last_completed_at` | `timestamptz null` | Instante de la última misión completada. `NULL` = aún no completa ninguna |
| `schools` | `last_completed_at` | `timestamptz null` | Ídem, agregado a nivel colegio |

### Trigger

`public.actualizar_estadisticas_mision()` (redefinido en la misma migración) ya
sumaba puntos y misiones al aprobarse una misión (`status → 'completed'`). Ahora
además **sella `last_completed_at = now()`** en el mismo `UPDATE`, tanto en el
equipo como en el colegio:

```sql
UPDATE public.teams
SET missions_completed = missions_completed + 1,
    points = points + mision_puntos,
    last_completed_at = now()          -- ← nuevo
WHERE id = NEW.team_id;

UPDATE public.schools
SET missions_completed = missions_completed + 1,
    points = points + mision_puntos,
    last_completed_at = now()          -- ← nuevo
WHERE id = equipo_escuela;
```

> **Sin histórico que rellenar:** todos los colegios/equipos arrancan en 0 puntos
> (seed), así que la marca empieza a registrarse limpia desde la primera misión
> completada tras aplicar la migración.

---

## Cambio en el código (orden del ranking)

Los tres lugares que ordenaban solo por `points` ahora añaden el desempate
`last_completed_at ASC` con `nullsFirst: false` (los que aún no puntúan van al final):

| Lector | Archivo | Alcance |
|---|---|---|
| Ranking público | `modules/schools/.../schools.repository.ts` → `getSchoolRanking` | Colegios (alimenta `/ranking`, home, `/tablero-vivo`, `/mapa`) |
| Paneles admin/director | `modules/schools/.../schools.repository.ts` → `getSchoolsDetail` | Colegios **y** equipos anidados de cada colegio |
| Podio HUD admin | `shared/ui/components/AdminBottomSheet.tsx` | Colegios (top 3) |

Para los **equipos anidados** en `getSchoolsDetail` se usa el orden por tabla
referenciada de PostgREST:

```ts
.order('points', { ascending: false })
.order('last_completed_at', { ascending: true, nullsFirst: false })
// equipos dentro de cada colegio, mismo criterio:
.order('points', { referencedTable: 'teams', ascending: false })
.order('last_completed_at', { referencedTable: 'teams', ascending: true, nullsFirst: false })
```

> **Nota:** `rankingPosition` se calcula a partir del orden devuelto, así que ahora
> es **siempre estricto**: dos colegios empatados en puntos reciben posiciones
> distintas (#1 y #2) según quién completó antes, en vez de un orden indefinido.

Los tipos generados (`shared/infrastructure/supabase/database.types.ts`) incluyen la
columna `last_completed_at` en `schools` y `teams`.

---

## Cómo aplicar

```bash
supabase migration up    # aplica solo la nueva migración (conserva datos)
# o
supabase db reset        # recrea desde cero (migraciones + seed)
```

Para producción: `supabase db push`. La migración es idempotente
(`add column if not exists` + `create or replace function`).

## Cómo verificar

Completar dos misiones en colegios distintos que los dejen empatados en puntos y
confirmar que en `/ranking` aparece arriba el que completó primero.
