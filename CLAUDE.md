# CLAUDE.md — Guía para Claude Code

## Qué es este proyecto

Plataforma web para el concurso inter-escolar **"La Búsqueda de los Guardianes de Arequipa"**. 16 colegios de Arequipa compiten resolviendo misiones en ubicaciones físicas de la ciudad. Los alumnos van en equipos de 4-6 personas acompañados por un docente.

## Stack

- **Next.js 16** · App Router · React 19 · TypeScript
- **Tailwind CSS v4** — configuración en `app/globals.css` con `@theme {}`, NO hay `tailwind.config.ts`
- **react-map-gl v8** + **mapbox-gl v3** — importar desde `react-map-gl/mapbox`
- **Zustand v5** para estado global de cliente
- **TanStack Query v5** para server state
- **Zod v4** para validación
- **Supabase** — pendiente de integrar (fase futura)

## Arquitectura

Hexagonal + Screaming Architecture + SOLID.

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

## Datos mock (fase actual)

No hay Supabase todavía. Los datos vienen de `data/json/`:
- `chapters.json` — 5 capítulos
- `missions.json` — 24 misiones con coordenadas reales de Arequipa
- `teams.json` — equipo mock con `missionProgress`

Para simular estados edita `teams.json`:
```json
"missionProgress": {
  "m-1-1": "completed",
  "m-1-2": "review",
  "m-1-3": "available"
}
```

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
| `FabButton` | `shared/ui/components/FabButton.tsx` | FAB Material 3D, `variant: 'primary' \| 'surface'` |
| `GpsBanner` | `shared/ui/components/GpsBanner.tsx` | Banner naranja cuando GPS denegado |
| `MissionMarker` | `modules/missions/presentation/components/MissionMarker.tsx` | Marcadores con Lucide icons |
| `MissionBottomSheet` | `modules/missions/presentation/components/MissionBottomSheet.tsx` | Sheet inferior responsive |

## Vistas y su estado

| Ruta | Estado | Archivo |
|------|--------|---------|
| `/mapa` | ✅ completa + auth | `app/(student)/mapa/page.tsx` |
| `/login` | ✅ completa | `app/(auth)/login/page.tsx` |
| `/mision/[id]` | ⏳ siguiente | `app/(student)/mision/[id]/page.tsx` |
| `/perfil` | pendiente | `app/(student)/perfil/page.tsx` |
| `/ranking` | pendiente | `app/(student)/ranking/page.tsx` |
| `/insignias` | pendiente | `app/(student)/insignias/page.tsx` |
| `/leader/panel` | ✅ placeholder | `app/leader/panel/page.tsx` |
| `/director/panel` | ✅ placeholder | `app/director/panel/page.tsx` |
| `/admin/panel` | ✅ placeholder | `app/admin/panel/page.tsx` |
| `/tablero-vivo` | pendiente | `app/tablero-vivo/page.tsx` |

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

> **Variantes de trivia**: una misión de trivia tiene 1..N variantes de pregunta en la tabla `mission_questions`; al empezar la misión se asigna una al azar por equipo (`mission_progression.question_id`) para que equipos del mismo colegio no se copien. `photo`/`creative` usan su prompt único en `missions.question`. Detalle en `docs/variantes-pregunta-trivia.md`.

## Estados de misión

- `available` — rojo pulsante (`#F44336`), Lucide icon por tipo de misión
- `in_progress` — el equipo pulsó "Empezar" y va en camino (comparte la UI de resolución con `available`; solo **una** misión `in_progress` por equipo)
- `review` — naranja pulsante (`#FF9800`), `Clock`
- `completed` — verde (`#00E676`), `CheckCircle`
- `rejected` — evidencia rechazada por el docente
- `locked` — gris (`#546E7A`), `Lock`

Flujo: `available` → `in_progress` → `review` → `completed` / `rejected`. Tipo canónico en `modules/missions/domain/entities/mission.ts` (`MissionStatus`).

## Variables de entorno

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxx   # obligatorio
```

## Convenciones

- Componentes interactivos: `'use client'` al inicio
- Importar cn: `import { cn } from '@/shared/ui/styles/cn'`
- Importar mapa: `import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'`
- JSON cast: `const data = raw as MyType[]`
- No usar Supabase aún — todo desde `data/json/`
- Colores via `style={{}}` inline, NO clases Tailwind para los colores personalizados del juego
- `safe-area-inset-bottom` en sheets: `paddingBottom: 'max(24px, env(safe-area-inset-bottom))'`

## Comandos

```bash
npm run dev     # desarrollo en http://localhost:3000
npm run build   # verificar compilación
npm run lint    # linting
```
