# Guardianes de Arequipa

Plataforma web para el concurso inter-escolar **"La Búsqueda de los Guardianes de Arequipa"** — 16 instituciones educativas, 5 capítulos, 24 misiones en puntos históricos reales de la ciudad.

## Funcionalidades principales

- Autenticación con Supabase Auth usando alias/PIN y perfiles vinculados a `auth.users`.
- Roles de usuario: estudiante, docente/líder, director y administrador.
- Redirección y paneles especializados según rol.
- Mapa interactivo de Arequipa con misiones ubicadas en puntos históricos reales.
- Geolocalización del estudiante y validación de llegada con cálculo de distancia.
- Radio de llegada configurable desde la app.
- Flujo de misión con estados: `available`, `in_progress`, `review`, `completed`, `rejected`, `locked` y `blocked`.
- Restricción para que un equipo solo tenga una misión activa a la vez.
- Misiones tipo trivia, foto/evidencia y creativa.
- Asignación estable de una variante de pregunta cuando el equipo inicia una misión.
- Progreso por equipo, capítulo, colegio y usuario.
- Sistema de capítulos, niveles, puntos, fragmentos coleccionables e insignias.
- Ranking de colegios con podio y posiciones.
- Tablero vivo para proyección pública durante el concurso.
- Panel del estudiante con resumen del equipo, miembros, progreso, misiones y fragmentos.
- Panel del docente/líder para revisar evidencias pendientes y aprobar o rechazar misiones.
- Panel del director para revisar equipos y rendimiento de su colegio.
- Panel administrador con métricas globales por colegios y equipos.
- Base de datos con migraciones, seed, vistas SQL, triggers y políticas RLS.
- Datos mock temporales para vistas que todavía pueden funcionar sin conexión completa a Supabase.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 · React 19 · TypeScript |
| Estilos | Tailwind CSS v4 (`@theme {}` en globals.css, sin `tailwind.config.ts`) |
| Mapa | Mapbox GL JS via `react-map-gl/mapbox` v8 |
| Estado | Zustand v5 (cliente) · TanStack Query v5 (server) |
| Validación | Zod v4 |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Deploy | Vercel (frontend) · Supabase Cloud (BD) |
| CI/CD | GitHub Actions — deploy automático de migraciones a `main` |

## Requisitos previos

- Node.js 18+
- npm 9+
- Token de Mapbox ([obtener gratis en mapbox.com](https://mapbox.com))
- Proyecto en [Supabase](https://supabase.com) (para conectar la BD)
- Supabase CLI (opcional, para desarrollo local): `npm install -g supabase`

## Correr en local

**1. Clonar el repositorio**

```bash
git clone <URL_DEL_REPOSITORIO>
cd com_concurso_app
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar variables de entorno**

Crea `.env.local` en la raíz del proyecto:

```env
# Mapbox (obligatorio)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxx

# Supabase (obligatorio para autenticación y BD)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx

# Modo demo local (opcional)
NEXT_PUBLIC_DEMO_MODE=false
```

Estos valores se obtienen en el [Dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → Settings → API.

> El token de Mapbox puede ser el del plan gratuito. Si usas Supabase local, primero ejecuta las migraciones y seed indicados en la sección de base de datos.

### Modo demo para capturas

Si Supabase no está disponible o necesitas compartir accesos de solo lectura para revisar las vistas, activa el modo demo:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Con este modo la app usa datos ficticios locales desde `data/json/` y las acciones de escritura quedan simuladas. Credenciales disponibles:

| Rol | Alias | PIN |
|-----|-------|-----|
| Alumno | `alumno_demo` | `1234` |
| Docente/líder | `docente_demo` | `1234` |
| Director | `director_demo` | `1234` |
| Admin | `admin_demo` | `1234` |

El panel del alumno incluye accesos a `/mision/m-1-1` (trivia) y `/mision/m-1-5` (foto/evidencia). Tambien puedes abrir las misiones desde el mapa con "VER MISION", independientemente de su progreso. Las vistas muestran preguntas y evidencia requerida con los envios desactivados. La llegada GPS es una muestra simulada, identificada como demo; no solicita tu ubicacion ni modifica el progreso. El administrador carga los colegios y equipos locales desde el primer render.

Reinicia el servidor despues de cambiar `NEXT_PUBLIC_DEMO_MODE`; para un despliegue debes volver a generar el build.

**4. Iniciar el servidor de desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente a `/mapa`.

## Base de datos (Supabase)

### Schema

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Perfil público vinculado a `auth.users` (alias, nombre, rol, equipo, colegio) |
| `roles` | Tipos de usuario: `student`, `leader`, `director`, `admin` |
| `schools` | 16 instituciones educativas participantes (points, missions_completed, short, color) |
| `teams` | Equipos de 4-6 alumnos por colegio (leader_id, level, points) |
| `chapters` | 5 capítulos de la narrativa (required_level, id_fragment, color) |
| `fragments` | 5 fragmentos coleccionables (uno por capítulo) |
| `missions` | 24 misiones con coordenadas, pregunta, opciones, tipo |
| `mission_progression` | Estado por equipo: `available`, `review`, `completed`, `rejected`, `locked` |
| `insignia` | Insignias desbloqueables |
| `team_insignia` | Relación equipo ↔ insignias obtenidas |

### Vistas y triggers clave

| Objeto | Propósito |
|--------|-----------|
| `vista_equipos_completos` | Denormaliza teams + schools + miembros (JSON) + fragmentos (JSON) |
| `trigger_mision_completada` → `actualizar_estadisticas_mision()` | Suma puntos al equipo/colegio y maneja level-up al aprobar misión |
| `custom_access_token_hook` | Inyecta `team_id` y `role_id` en claims JWT en cada login |

### Migraciones locales (opcional)

```bash
supabase start          # levanta Supabase completo en Docker
supabase db reset       # aplica migraciones desde cero
supabase db push        # sube migraciones al proyecto remoto
```

### Deploy automático (CI/CD)

Cada push a la rama `main` con cambios en `supabase/migrations/` dispara el workflow `.github/workflows/deploy_migration_dev.yml` que aplica las migraciones pendientes al proyecto remoto.

Requiere dos secretos en GitHub Actions:
- `SUPABASE_ACCESS_TOKEN` — token personal de Supabase CLI
- `SUPABASE_DB_URL` — connection string de la BD remota

### Seed de datos

- `supabase/seed.sql` — genera datos de prueba (5 escuelas, 15 equipos, ~96 usuarios, admin `asistem`)
- `scripts/seed-users.mjs` — script Node.js alternativo que usa `SUPABASE_SERVICE_ROLE_KEY`

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo (hot reload)
npm run build    # build de producción (verifica tipos y compilación)
npm run start    # sirve el build de producción
npm run lint     # ESLint
```

> **IMPORTANTE:** Siempre ejecuta `npm run build` antes de commitear para verificar que no hay errores de tipo o compilación.

## Estructura de carpetas

```
app/
  (auth)/login/              ← autenticación (Supabase Auth)
  (student)/mapa/            ← VISTA PRINCIPAL — mapa interactivo (mock data)
  (student)/mision/[id]/     ← detalle de misión (mock data)
  (student)/perfil/          ← perfil del alumno (pendiente)
  (student)/ranking/         ← ranking (Supabase)
  (student)/insignias/       ← insignias (mock data)
  (student)/panel/           ← panel del estudiante (Supabase)
  (leader)/panel/            ← panel del docente/líder (Supabase)
  (director)/panel/          ← panel del director (placeholder, mock data)
  (admin)/panel/             ← panel del administrador (placeholder, mock data)
  tablero-vivo/              ← pantalla pública/proyector (pendiente)

modules/                 ← arquitectura hexagonal (screaming)
  auth/                  ← autenticación (Zustand store + Supabase)
  missions/              ← misiones (componentes de presentación)
  teams/                 ← dominio de equipos
  schools/               ← dominio de colegios
  rankings/              ← dominio de rankings
  badges/                ← dominio de insignias
  fragments/             ← dominio de fragmentos
  chapters/              ← dominio de capítulos

shared/
  ui/components/         ← componentes UI reutilizables
  ui/styles/cn.ts        ← utility cn (clsx + tailwind-merge)
  domain/types/          ← tipos compartidos
  infrastructure/
    supabase/
      client.ts          ← singleton del cliente Supabase (tipado)
      database.types.ts  ← tipos generados del schema de BD

supabase/                ← config del CLI de Supabase
  config.toml            ← configuración local (puertos, auth, storage)
  migrations/            ← historial versionado del schema SQL

data/json/               ← datos mock (temporal hasta integrar Supabase)
  chapters.json
  missions.json
  teams.json
```

## Estado de la app (vistas)

| Ruta | Estado | Fuente de datos |
|------|--------|----------------|
| `/mapa` | ✅ Funcional | Supabase + Mapbox + GPS |
| `/login` | ✅ Completa | Supabase Auth |
| `/mision/[id]` | ✅ Funcional | Supabase |
| `/student/panel` | ✅ Completa | Supabase |
| `/ranking` | ✅ Completa | Supabase |
| `/leader/panel` | ✅ Completa | Supabase |
| `/director/panel` | ✅ Funcional | Supabase |
| `/admin/panel` | ✅ Funcional | Supabase |
| `/perfil` | ⏳ Placeholder | — |
| `/tablero-vivo` | ✅ Funcional | Supabase |

## Datos mock

Mientras no todas las vistas estén migradas a Supabase, algunas páginas siguen usando `data/json/`:

| Archivo | Usado por |
|---------|-----------|
| `chapters.json` | `/mapa`, `/mision/[id]` |
| `missions.json` | `/mapa`, `/mision/[id]` |
| `teams.json` | `/mapa`, `/mision/[id]`, `/insignias`, `/director/panel` |
| `schools.json` | `/mapa`, `/director/panel`, `/admin/panel` |

Para simular progreso de un equipo, edita `data/json/teams.json`:
- `currentChapterId`: capítulo activo
- `missionProgress`: estado de cada misión
- `unlockedChapters`: array de capítulos desbloqueados

## Patrón de conexión a Supabase

Todos los paneles que consultan datos reales siguen este patrón (bypass de caché):

```ts
const { data: { session } } = await supabase.auth.getSession()
const { data: usuario } = await supabase.from('usuarios').select('team_id').eq('id', session.user.id).single()

// Consultas paralelas
const [equipo, stats] = await Promise.all([
  supabase.from('vista_equipos_completos').select('*').eq('id', usuario.team_id).single(),
  supabase.from('mission_progression').select('*', { count: 'exact', head: true }).eq('team_id', usuario.team_id).eq('status', 'completed'),
])
```

## Tests

El proyecto tiene Vitest configurado en `package.json`:

```bash
npm run test
npm run test:watch
```

La cobertura de pruebas todavía debe ampliarse, especialmente en flujos de misión, validación GPS, revisión docente y reglas de progreso por equipo.

## Convenciones de código

- Componentes interactivos: `'use client'` al inicio
- Colores del juego: via `style={{}}` inline con las variables CSS, NO clases Tailwind
- Iconos: Lucide React, NO emojis
- Importar mapa: `import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'`
- Importar cn: `import { cn } from '@/shared/ui/styles/cn'`
- Supabase: `import { supabase } from '@/shared/infrastructure/supabase/client'`
- JSON cast: `const data = raw as unknown as MyType[]` (para strict mode)
- `safe-area-inset-bottom` en sheets: `paddingBottom: 'max(24px, env(safe-area-inset-bottom))'`
- Tailwind v4: usar `bg-linear-to-r` no `bg-gradient-to-r`, `shrink-0` no `flex-shrink-0`
