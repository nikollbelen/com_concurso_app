# Guardianes de Arequipa

Plataforma web para el concurso inter-escolar **"La Búsqueda de los Guardianes de Arequipa"** — 16 instituciones educativas, 5 capítulos, 24 misiones en puntos históricos reales de la ciudad.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 · React 19 · TypeScript |
| Estilos | Tailwind CSS v4 |
| Mapa | Mapbox GL JS via react-map-gl v8 |
| Estado | Zustand · TanStack Query |
| Validación | Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Deploy | Vercel (frontend) · Supabase Cloud (BD) |
| CI/CD | GitHub Actions — deploy automático de migraciones a `develop` |

## Requisitos previos

- Node.js 18+
- npm 9+
- Token de Mapbox ([obtener gratis en mapbox.com](https://mapbox.com))
- Proyecto en [Supabase](https://supabase.com) (para conectar la BD)
- Supabase CLI (opcional, para desarrollo local): `npm install -g supabase`

## Correr en local

**1. Clonar e instalar dependencias**

```bash
npm install
```

**2. Configurar variables de entorno**

Crea `.env.local` en la raíz del proyecto:

```env
# Mapbox (obligatorio)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxx

# Supabase (obligatorio para autenticación y BD)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxx
```

Estos valores se obtienen en el [Dashboard de Supabase](https://supabase.com/dashboard) → tu proyecto → Settings → API.

> El token de Mapbox puede ser el del plan gratuito (50,000 cargas/mes).

**3. Iniciar el servidor de desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente a `/mapa`.

## Base de datos (Supabase)

### Schema

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Perfil público vinculado a `auth.users` (alias, nombre, rol, equipo, colegio) |
| `roles` | Tipos de usuario: `alumno`, `docente`, `director`, `admin` |
| `schools` | 16 instituciones educativas participantes |
| `teams` | Equipos de 4-6 alumnos por colegio |
| `chapters` | 5 capítulos de la narrativa |
| `missions` | 24 misiones con coordenadas en Arequipa |
| `mission_progression` | Estado de cada misión por equipo (evidencias, fotos) |
| `insignia` | Insignias desbloqueables |
| `team_insignia` | Relación equipo ↔ insignias obtenidas |

### Custom JWT Hook

Al hacer login, Supabase ejecuta `custom_access_token_hook` que inyecta en el JWT:
- `team_id` — el equipo del usuario (accesible sin consultas extra)
- `role_id` — el UUID del rol (para RLS y control de acceso)

### Migraciones locales (opcional)

```bash
supabase start          # levanta Supabase completo en Docker
supabase db reset       # aplica migraciones desde cero
supabase db push        # sube migraciones al proyecto remoto
```

### Deploy automático (CI/CD)

Cada push a la rama `develop` dispara el workflow `.github/workflows/deploy_migration_dev.yml`
que aplica las migraciones pendientes al proyecto remoto.

Requiere dos secretos en GitHub Actions:
- `SUPABASE_ACCESS_TOKEN` — token personal de Supabase CLI
- `SUPABASE_DB_URL` — connection string de la BD remota

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo (hot reload)
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # ESLint
```

## Estructura de carpetas

```
app/
  (auth)/login/          ← autenticación
  (student)/mapa/        ← VISTA PRINCIPAL — mapa interactivo
  (student)/mision/[id]/ ← detalle de misión
  (student)/perfil/      ← perfil del alumno
  (student)/ranking/     ← ranking
  (leader)/panel/        ← panel del docente/líder
  (director)/panel/      ← panel del director
  (admin)/panel/         ← panel del administrador
  tablero-vivo/          ← pantalla pública/proyector

modules/                 ← arquitectura hexagonal (screaming)
  missions/              ← dominio de misiones
  teams/                 ← dominio de equipos
  schools/               ← dominio de colegios
  rankings/              ← dominio de rankings
  badges/                ← dominio de insignias
  fragments/             ← dominio de fragmentos
  chapters/              ← dominio de capítulos
  auth/                  ← autenticación

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

## Datos mock

Mientras Supabase no esté integrado, todos los datos vienen de `data/json/`. Para simular el progreso de un equipo edita `data/json/teams.json`:

- `currentChapterId`: capítulo activo
- `missionProgress`: estado de cada misión (`"completed"`, `"review"`, `"available"`)
- `unlockedChapters`: array de capítulos desbloqueados

## Estado de la app (vistas completadas)

- [x] Vista mapa (`/mapa`) — mapa Mapbox con marcadores por estado, bottom sheet, header RPG, FABs

## Próximas vistas

- [ ] Detalle de misión (`/mision/[id]`)
- [ ] Perfil del alumno (`/perfil`)
- [ ] Ranking (`/ranking`)
- [ ] Panel del docente (`/leader/panel`)
- [ ] Panel admin (`/admin/panel`)
- [ ] Tablero en vivo (`/tablero-vivo`)
- [ ] Autenticación (`/login`)
- [x] Cliente Supabase tipado (`shared/infrastructure/supabase/`)
- [ ] Autenticación con Supabase Auth (`/login`)
- [ ] Reemplazar datos mock con queries a Supabase
