<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Breaking changes in this version. Read the guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

- **Next.js 16** · App Router · React 19 · TypeScript (strict)
- **Tailwind CSS v4** — config in `app/globals.css` via `@theme {}`, no `tailwind.config.ts`
- **react-map-gl/mapbox v8** + **mapbox-gl v3** — import from `'react-map-gl/mapbox'`
- **Zustand v5** (client state) · **TanStack Query v5** (server state)
- **Zod v4** for validation
- **Supabase** — `shared/infrastructure/supabase/client.ts` (no generic type, `createClient(url, key)`)
- **MCP** — local Supabase at `http://127.0.0.1:54321/mcp` (for schema introspection)

## Commands

```bash
npm run dev      # next dev
npm run build    # MUST run before committing — catches type errors
npm run lint     # ESLint
```

**No test infra** (no Jest, Vitest, Playwright). CI only triggers on `supabase/migrations/**` pushes to `main`.

## Architecture (light hexagonal, no ports/use-cases)

```
modules/<domain>/
  domain/entities/          ← Zod schema or TypeScript interface
  infrastructure/repositories/  ← Supabase query + row→entity mapping
  presentation/hooks/       ← TanStack Query wrapper (pages consume hooks)
```

6 domains: `auth` (Zustand store), `chapters`, `missions`, `schools`, `teams`, `settings`.

Pages **must not** call Supabase directly — only consume hooks. The Supabase client has no generic type (intentional), use `as unknown as T[]` for query results.

**Supabase panel pattern** (bypass Zustand cache):
```ts
const { data: { session } } = await supabase.auth.getSession()
const { data: usuario } = await supabase.from('usuarios').select('team_id').eq('id', session.user.id).single()
// Then Promise.all() for parallel queries
```

## Color tokens (CSS vars from globals.css `@theme {}` — use inline `style={{}}`)

`--color-game-red: #ff3b30` | `--color-game-green: #34c759` | `--color-game-amber: #ff9500` | `--color-game-locked: #475569` | `--color-game-gold: #f9bd22` | `--color-surface: #0f1729` | `--color-on-surface: #e8f4ff` | `--color-on-surface-var: #94a3b8` | `--color-outline: rgba(255,255,255,0.2)`

- **Fonts**: Cinzel Decorative (headings), Exo 2 (stats/buttons), Inter (body). Use `style={{ fontFamily: 'var(--font-<name>)' }}`.
- **Tailwind v4**: use `bg-linear-to-r`, `shrink-0`, etc. (new syntax).
- **Icons**: Lucide React only, no emojis.

## Routes

| Route | Data | Status |
|-------|------|--------|
| `/` (landing) | Supabase | ✅ |
| `/login` | Supabase Auth | ✅ |
| `/mapa` | Supabase | ✅ |
| `/mision/[id]` | Supabase | ✅ |
| `/student/panel` | Supabase | ✅ |
| `/ranking` | Supabase | ✅ |
| `/leader/panel` | Supabase | ✅ |
| `/director/panel` | Supabase | ✅ |
| `/admin/panel` | Supabase | ✅ |
| `/tablero-vivo` | Supabase | ✅ |

## Mission system

- Types: `trivia` (10pts, auto), `photo` (15pts, teacher review), `creative` (20pts, teacher/judge)
- States: `available → in_progress → review → completed | rejected`, plus `locked`
- Trivia has 1..N question variants (`mission_questions`), one assigned per team at start to prevent answer-sharing
- Only **one** `in_progress` mission per team (enforced by DB unique index)
- Points updated by DB trigger (`trigger_mision_completada`), not manually

## Key conventions

- `'use client'` at top of interactive components
- `import { cn } from '@/shared/ui/styles/cn'`
- `import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'`
- `style={{}}` inline for game colors, never Tailwind classes
- **Do NOT commit unless explicitly requested with `/commit-all`**
- After completing a feature, write an entry in `docs/CHANGELOG_AGENTES.md`

## Migrations (16 files in `supabase/migrations/`)

- `20260614…` base schema, auth hook, triggers, RLS, grants
- `20260617…` `adaptacion_json.sql` (main: fragments, view, point trigger)
- `20260618…` school `short` column
- `20260623…` GRANT SELECT on view
- `20260705…` levels catalog, in_progress state, app_settings, uniqueness index, ranking tiebreak, question variants

## Credenciales de prueba (seed local)

- Admin: `asistem` / `secreto123`
- Directores: `director_1`..`director_5`
- Líderes: `lider_1_1`..`lider_5_3` (multi-equipo: `lider_1_1` lidera 2 equipos)
- Alumnos: `alumno_1_1_1`..`alumno_5_3_5`
