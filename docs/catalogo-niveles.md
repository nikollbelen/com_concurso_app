# Catálogo de niveles (`levels`)

## Resumen

El **título del nivel** ("Aprendiz de Arequipa", "Explorador Histórico", …) y el
**umbral de puntos** para subir de nivel ahora viven en la base de datos, en una
tabla catálogo `levels` que es la **única fuente de verdad**.

Antes el título estaba *hardcodeado* en el frontend, duplicado en 3 mapas
`LEVEL_TITLES` (authStore, student-dashboard, schools). Además 4 de los 5 títulos
no coincidían con la propuesta oficial (§1.4 de
`docs/Propuesta_Guardianes_de_Arequipa.md`). Todo eso se eliminó.

---

## Tabla `levels`

**Migración:** `supabase/migrations/20260705000000_levels_catalog.sql`

| Columna | Tipo | Descripción |
|---|---|---|
| `level` | `bigint` PK | Número de nivel (1–5) |
| `title` | `text not null` | Título narrativo del nivel |
| `next_level_points` | `bigint null` | Puntos totales para subir al **siguiente** nivel. `NULL` = nivel máximo |
| `created_at` / `updated_at` | — | Auditoría |

**Datos sembrados** (títulos oficiales según la propuesta):

| Nivel | Título | Umbral (`next_level_points`) |
|---|---|---|
| 1 | Aprendiz de Arequipa | 1500 |
| 2 | Explorador Histórico | 3000 |
| 3 | Custodio del Sillar | 4500 |
| 4 | Guardián del Chili | 6000 |
| 5 | Cronista Legendario | `NULL` (tope) |

> Los umbrales de puntos son de ejemplo (1500 por nivel). Ajústalos en la
> migración cuando se defina el balance real del concurso.

- **RLS:** lectura pública (`Lectura pública de niveles`) — es un catálogo.
- **FK:** `teams.level → levels.level` (`teams_level_fkey`). Garantiza que el
  nivel de un equipo siempre exista en el catálogo y habilita el *embedding* de
  PostgREST (`teams → levels`).

---

## Trigger de subida de nivel

`public.actualizar_estadisticas_mision()` (redefinido en la misma migración).

**Antes:** leía `teams.next_level_points`, que quedaba en `NULL` tras el seed →
el level-up **nunca disparaba**.

**Ahora:** al aprobarse una misión, lee el umbral del **nivel actual** desde
`levels.next_level_points`. Si los puntos del equipo alcanzan el umbral, sube de
nivel. Al llegar al nivel tope (`next_level_points = NULL`) deja de subir de
forma natural (y la FK impide un nivel fuera del catálogo).

---

## Cómo se lee el título en el frontend

Ya **no** hay ningún mapa `LEVEL_TITLES` en el código. Cada lector obtiene el
título desde la BD:

| Lector | Archivo | Cómo lee el título |
|---|---|---|
| Header del mapa (alumno) | `modules/auth/.../authStore.ts` → `fetchProfile` | Embed `usuarios → teams → levels ( title )` |
| Barra XP (umbral) | `modules/teams/.../teams.repository.ts` → `getTeam` | Embed `teams → levels ( next_level_points )` |
| Panel del alumno | `modules/teams/.../student-dashboard.repository.ts` | Columna `level_title` de la vista `vista_equipos_completos` |
| Panel director/admin | `modules/schools/.../schools.repository.ts` → `getSchoolsDetail` | Embed `teams → levels ( title )` |

La vista `vista_equipos_completos` se amplió con las columnas `level_title` y
`next_level_points` (LEFT JOIN a `levels`).

**Ejemplo de embed (PostgREST):**

```ts
.from('usuarios')
.select('alias, ..., teams!usuarios_team_id_fkey ( level, levels ( title ) )')
```

---

## Cómo aplicar

```bash
npx supabase db reset   # aplica migraciones + seed en local
```

Para producción: `npx supabase db push`. La migración es idempotente
(`insert ... on conflict do update`), así que re-aplicarla actualiza los títulos
sin duplicar filas.

## Cómo cambiar un título en el futuro

Editar **una fila** en la tabla `levels` (vía Studio o SQL). Ya no hay que tocar
código:

```sql
update public.levels set title = 'Nuevo título' where level = 3;
```
