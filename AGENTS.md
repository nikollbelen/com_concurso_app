<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Qué es este proyecto

Plataforma web para el concurso inter-escolar **"La Búsqueda de los Guardianes de Arequipa"**. 16 colegios de Arequipa compiten resolviendo misiones en ubicaciones físicas de la ciudad. Los alumnos van en equipos de 4-6 personas acompañados por un docente.

## Stack

- **Next.js 16** · App Router · React 19 · TypeScript
- **Tailwind CSS v4** — configuración en `app/globals.css` con `@theme {}`, NO hay `tailwind.config.ts`
- **react-map-gl v8** + **mapbox-gl v3** — importar desde `react-map-gl/mapbox`
- **Zustand v5** para estado global de cliente
- **TanStack Query v5** para server state
- **Zod v4** para validación
- **Supabase** — integrado vía Supabase JS client + MCP local + migraciones versionadas

## Arquitectura

Hexagonal + Screaming Architecture + SOLID (implementación parcial por ahora).

```
modules/<dominio>/
  domain/entities/        ← entidades puras
  domain/value-objects/
  domain/ports/           ← interfaces (IRepository, etc.)
  domain/use-cases/       ← lógica de negocio
  infrastructure/
    repositories/         ← implementaciones (JSON ahora, Supabase después)
    adapters/
  presentation/
    components/           ← componentes React del módulo
    hooks/
```

**Nota:** Actualmente solo existen `modules/auth/` (Zustand store) y `modules/missions/` (componentes de presentación). El resto de la lógica de negocio vive directamente en las páginas de `app/`. La arquitectura hexagonal completa está pendiente de implementar.

## Sistema de colores (Material M3 dark — definido en globals.css `@theme {}`)

| Token CSS var | Hex | Uso |
|---|---|---|
| `--color-game-red` | `#F44336` | Botones primarios, marcador "disponible" |
| `--color-game-red-shadow` | `#7B1B1B` | Sombra 3D de botones rojos |
| `--color-game-gold` | `#FFD600` | Puntos XP, bordes chip |
| `--color-game-green` | `#00E676` | Misión completada |
| `--color-game-amber` | `#FF9800` | Misión en revisión |
| `--color-game-locked` | `#546E7A` | Misión bloqueada |
| `--color-surface` | `#1C1B1F` | Fondo principal |
| `--color-surface-container` | `#211F26` | Superficies de tarjetas |
| `--color-surface-high` | `#2B2930` | Superficies elevadas |
| `--color-on-surface` | `#E6E1E5` | Texto principal |
| `--color-on-surface-var` | `#CAC4D0` | Texto secundario |
| `--color-outline` | `#938F99` | Bordes suaves |

> **Nota Tailwind v4**: usar `bg-linear-to-r` no `bg-gradient-to-r`, `shrink-0` no `flex-shrink-0`.

## Tipografías

Definidas en `app/layout.tsx` como variables CSS:

| Variable | Fuente | Uso |
|---|---|---|
| `--font-cinzel` | Cinzel Decorative | Títulos RPG, nombre del equipo, capítulos |
| `--font-exo2` | Exo 2 | Stats, números, labels, botones |
| `--font-inter` | Inter | Texto de cuerpo, descripciones |

Usar con: `style={{ fontFamily: 'var(--font-cinzel), serif' }}`

## Estilo visual — RPG / Material M3 dark

- Fondo `#1C1B1F` (M3 surface)
- Componentes flotantes: `rounded-3xl`, `backdropFilter: blur(24px)`, `background: rgba(33,31,38,0.96)`
- Sombra 3D botones: `boxShadow: '0 5px 0 #7B1B1B, 0 8px 24px rgba(...)'`
- Glow en elementos activos: `0 0 16px rgba(color, 0.5)`
- XP bar con shimmer (keyframe en globals.css)
- Marcadores: bordes `1.5px solid rgba(255,255,255,0.15)`, sin emojis → Lucide icons

## Mapbox

- Estilo del mapa: `mapbox://styles/mapbox/navigation-night-v1` (mapa con colores)
- **NO usar** `NavigationControl` ni `GeolocateControl` (controles por defecto ocultos en globals.css)
- GPS manual via `navigator.geolocation.watchPosition`
- Centrar mapa: `mapRef.current?.easeTo({ center: [lng, lat], duration: 800 })`
- Todos los controles Mapbox ocultos en globals.css con `display: none !important`

## Componentes compartidos clave

| Componente | Archivo | Descripción |
|---|---|---|
| `GameHeader` | `shared/ui/components/GameHeader.tsx` | Tarjeta flotante top, glassmorphism |
| `FabButton` | `shared/ui/components/FabButton.tsx` | FAB Material 3D, `variant: 'primary' \| 'surface' \| 'gold'` |
| `GpsBanner` | `shared/ui/components/GpsBanner.tsx` | Banner naranja cuando GPS denegado |
| `MissionMarker` | `modules/missions/presentation/components/MissionMarker.tsx` | Marcadores con Lucide icons |
| `MissionBottomSheet` | `modules/missions/presentation/components/MissionBottomSheet.tsx` | Sheet inferior responsive (alumno) |
| `LeaderBottomSheet` | `modules/missions/presentation/components/LeaderBottomSheet.tsx` | Sheet inferior responsive (docente) |
| `AdminBottomSheet` | `shared/ui/components/AdminBottomSheet.tsx` | HUD global con ranking top 3 (auto-contenido, fetch a Supabase) |
| `DirectorBottomSheet` | `shared/ui/components/DirectorBottomSheet.tsx` | Stats del colegio para director |
| `LogoutModal` | `shared/ui/components/LogoutModal.tsx` | Modal de confirmación de cierre de sesión |

## Vistas y su estado

| Ruta | Estado | Fuente de datos | Archivo |
|------|--------|----------------|---------|
| `/mapa` | ✅ completa | Mock JSON | `app/(student)/mapa/page.tsx` |
| `/login` | ✅ completa | Supabase Auth | `app/(auth)/login/page.tsx` |
| `/mision/[id]` | ⏳ siguiente | Mock JSON | `app/(student)/mision/[id]/page.tsx` |
| `/student/panel` | ✅ completa | Supabase | `app/(student)/panel/page.tsx` |
| `/ranking` | ✅ completa | Supabase | `app/(student)/ranking/page.tsx` |
| `/leader/panel` | ✅ completa | Supabase | `app/leader/panel/page.tsx` |
| `/insignias` | pendiente | Mock JSON | `app/(student)/insignias/page.tsx` |
| `/director/panel` | ⏳ placeholder | Mock JSON | `app/director/panel/page.tsx` |
| `/admin/panel` | ⏳ placeholder | Mock JSON | `app/admin/panel/page.tsx` |
| `/perfil` | pendiente | — | `app/(student)/perfil/page.tsx` |
| `/tablero-vivo` | pendiente | — | `app/tablero-vivo/page.tsx` |

## Roles de usuario

1. **Alumno** — completa misiones, ve progreso y ranking
2. **Docente/Líder** — aprueba evidencias fotográficas
3. **Director** — ve estadísticas del colegio
4. **Administrador** — gestiona el evento

## Tipos de misión

| Tipo | Validación | Puntos | Icono Lucide |
|------|-----------|--------|---|
| `trivia` | Automática | 10 pts | `Target` |
| `photo` | Manual docente | 15 pts | `Camera` |
| `creative` | Manual docente/jurado | 20 pts | `Palette` |

## Estados de misión (5 estados)

- `available` — rojo pulsante (`#F44336`), Lucide icon por tipo de misión
- `completed` — verde (`#00E676`), `CheckCircle`
- `review` — naranja pulsante (`#FF9800`), `Clock`
- `rejected` — rojo oscuro, `XCircle`
- `locked` — gris (`#546E7A`), `Lock`

## Variables de entorno

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx   # obligatorio
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Convenciones

- Componentes interactivos: `'use client'` al inicio
- Importar cn: `import { cn } from '@/shared/ui/styles/cn'`
- Importar mapa: `import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'`
- JSON cast: `const data = raw as unknown as MyType[]` (para strict mode de TypeScript 5.9)
- Supabase via `import { supabase } from '@/shared/infrastructure/supabase/client'`
- Colores via `style={{}}` inline, NO clases Tailwind para los colores personalizados del juego
- `safe-area-inset-bottom` en sheets: `paddingBottom: 'max(24px, env(safe-area-inset-bottom))'`
- **Siempre ejecutar `npm run build` antes de commitear** para verificar que no hay errores de tipo
- Cada vez que hagas una tarea importante e implementes una nueva feature, guarda un documento en `./docs/` describiendo qué se hizo y el resultado, optimizado para contexto de agentes.

## Migraciones Supabase

10 migraciones versionadas en `supabase/migrations/`:

| # | Archivo | Propósito |
|---|---------|-----------|s
| 1 | `20260614185117_initial_migration.sql` | Schema base: usuarios, schools, teams, roles, chapters, missions, mission_progression |
| 2 | `20260614190251_funcion_auth.sql` | `custom_access_token_hook` — inyecta role_id/team_id en JWT |
| 3 | `20260617000000_trigger_nuevo_usuario.sql` | `on_auth_user_created` — auto-crea fila en public.usuarios |
| 4 | `20260617000001_fix_trigger_upsert.sql` | Fix: ON CONFLICT DO UPDATE |
| 5 | `20260617000003_hook_permisos.sql` | Grants para supabase_auth_admin |
| 6 | `20260617000004_rls_policies.sql` | Políticas RLS básicas |
| 7 | `20260617173441_permisos_auth.sql` | Más permisos, revokes |
| 8 | `20260617211221_adaptacion_json.sql` | Migración principal: fragments, vista_equipos_completos, trigger de puntos |
| 9 | `20260618231724_add_school_short.sql` | Columna `short` en schools |
| 10 | `20260623000000_grant_select.sql` | GRANT SELECT en vista_equipos_completos |

## Comandos

```bash
npm run dev     # desarrollo en http://localhost:3000
npm run build   # verificar compilación (ejecutar siempre antes de commitear)
npm run lint    # linting
```

## Tests

El proyecto **no tiene** infraestructura de tests (sin Jest, Vitest, Playwright). Es una deuda técnica identificada.
