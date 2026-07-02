# Migración de la capa de datos: JSON → Supabase

> Refactor de arquitectura (no es un cambio menor). Inicio: 2026-07-01.
> Objetivo: que todas las páginas lean de Supabase y dejar de depender de `data/json/`.

## Decisión arquitectónica: hexagonal **ligero**

Se descartó el hexagonal completo del `CLAUDE.md` (ports + use-cases + value-objects + DI) por sobre-ingeniería: hay un solo backend (Supabase), el dominio es CRUD + reglas simples, y las carpetas `ports/`/`use-cases/` llevaban meses vacías.

En su lugar, **capa de datos delgada** por dominio:

```
modules/<dominio>/
  domain/entities/<x>.ts                    ← tipo + esquema Zod
  infrastructure/repositories/<x>.repository.ts  ← consulta Supabase, mapea fila→entidad, valida con Zod
  presentation/hooks/use<X>.ts              ← hook de TanStack Query que envuelve el repo
```

Reglas:
- Las páginas **solo consumen hooks**. Prohibido `.from()` inline en componentes.
- El cliente vive en `shared/infrastructure/supabase/client.ts`. Se usa `(supabase as any)` en los repos porque no hay tipos generados (mismo criterio que `authStore`).
- Los repos hacen el "amoldado": parsean `coordinates` (texto → `[lng,lat]`), `options` (`[{label,text}]` → `string[]`) y `correct_answer` (letra → índice).
- No se agregan ports/use-cases hasta que aparezca una regla compleja o un segundo origen de datos (YAGNI).

## Infraestructura base

- `shared/infrastructure/providers/QueryProvider.tsx` — `QueryClientProvider` global, montado en `app/layout.tsx`. (TanStack Query ya era dependencia pero no se usaba.)
- Defaults del client: `staleTime` 1 min, `refetchOnWindowFocus: false`, `retry: 1`.

## Dominios creados

| Dominio | Entidad | Repositorio | Hook(s) |
|---|---|---|---|
| chapters | `Chapter` (Zod) | `getChapters` | `useChapters` |
| missions | `Mission` (Zod) | `getMissions`, `getMissionById` | `useMissions`, `useMission` |
| missions (progreso) | — | `getTeamProgress` | `useTeamProgress` |
| missions (revisión) | `ReviewData` | `getReviewData`, `setMissionStatus` | `useReviewData`, `useSetMissionStatus` |
| teams | `Team` | `getTeam` | `useTeam` |
| teams (dashboard) | `StudentDashboard` | `getStudentDashboard` | `useStudentDashboard` |
| schools | `SchoolRanking` | `getSchoolRanking` | `useSchoolRanking` |
| schools (detalle) | `SchoolDetail` | `getSchoolsDetail` | `useSchoolsDetail` |

## Reglas de dominio resueltas

- **Estado de misión**: sin fila en `mission_progression` = `available` si el capítulo está desbloqueado, si no `locked`.
- **Capítulos desbloqueados**: `chapter.requiredLevel <= team.level`.
- **Fragmentos ganados**: `chapter.requiredLevel < team.level`.
- **Stats del director**: derivadas de `getSchoolRanking` (posición = orden por puntos).
- **Defaults** donde el seed dejó NULL: `nextLevelPoints → 1500`, `level → 1`, `currentChapterId → primer capítulo`.

## Progreso de migración de páginas — COMPLETO ✅

| Página | Estado | Notas |
|---|---|---|
| `/mapa` | ✅ migrada | Quitados los 4 JSON. |
| `/mision/[id]` | ✅ migrada | Quitados 3 JSON. |
| `/insignias` | ✅ migrada | Insignias calculadas por-usuario desde progreso + capítulos. |
| `/admin/panel` | ✅ migrada | `useSchoolsDetail` (colegios + equipos + miembros). |
| `/director/panel` | ✅ migrada | `useSchoolsDetail` filtrado al colegio del director. |
| `/ranking` | ✅ refactorizada | Pasó de Supabase inline a `useSchoolRanking`. |
| `/leader/panel` | ✅ refactorizada | `useReviewData` + `useSetMissionStatus` (aprobar/rechazar). |
| `/student/panel` | ✅ refactorizada | `useStudentDashboard`. |

**Ninguna página importa ya `data/json/`.** (Los JSON siguen en el repo como referencia, pero no se consumen.)

## Bug corregido en el camino

`/leader/panel` consultaba `missions!inner(title, ...)`, pero la tabla `missions`
**no tiene** columna `title` (su nombre visible es `location`). Se corrigió en
`getReviewData` a `location`.

## Nota de flujo de trabajo

Se trabaja directamente sobre `main` (equipo chico, revisión informal). No se usan
ramas/PR por ahora. Los cambios de datos van en `seed.sql`; los de esquema irían en
`supabase/migrations/`.

## Verificación

- `npx tsc --noEmit` → sin errores.
- `npm run lint` → 0 errores (solo warnings pre-existentes de `<img>` y variables sin usar).
- Smoke test HTTP 200 contra el dev server en las 8 páginas migradas.
