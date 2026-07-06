# Seed de Datos de Prueba

## Resumen

Se implementó un seed completo en `supabase/seed.sql` que genera datos de prueba para desarrollo, basado en la propuesta oficial del concurso.

---

## Contenido del seed

### Roles (UUIDs fijos y deterministas)

| UUID | Type |
|---|---|
| `11111111-1111-1111-1111-111111111111` | student |
| `22222222-2222-2222-2222-222222222222` | leader |
| `33333333-3333-3333-3333-333333333333` | director |
| `44444444-4444-4444-4444-444444444444` | admin |

### Fragmentos

| ID | Nombre | Icono |
|---|---|---|
| `f1111111-...` | Fragmento del Sillar | `/images/capitulo1.png` |
| `f2222222-...` | Fragmento del Misti | `/images/capitulo2.png` |
| `f3333333-...` | Fragmento del Chili | `/images/capitulo3.png` |
| `f4444444-...` | Fragmento de la Historia | `/images/capitulo4.png` |
| `f5555555-...` | Fragmento de la Cultura | `/images/capitulo5.png` |

### Capítulos (5, uno por fragmento)

Nivel requerido 1-5, con 4-5 misiones cada uno. Colores y subtítulos tomados de `data/json/chapters.json`:

| # | Color | Misiones |
|---|---|---|
| 1 | `#F59E0B` | 5 |
| 2 | `#EF4444` | 5 |
| 3 | `#3B82F6` | 4 |
| 4 | `#8B5CF6` | 5 |
| 5 | `#10B981` | 5 |

### Misiones (24 total)

Sincronizadas con `data/json/missions.json` (incluye coordenadas), cada una con:
- `type`: trivia (17) + photo (6) + creative (1)
- `location`: lugar real en Arequipa
- `coordinates`: par `[lng, lat]` guardado como texto (para el mapa)
- `question`: texto de la pregunta
- `options`: JSON array con label y text
- `correct_answer`: letra de la opción correcta (A, B, C, D)
- `points`: 10 (trivia), 15 (photo) o 20 (creative)
- `marker_image`: vacío por ahora (las misiones aún no tienen imagen)

### Usuario Admin

- Alias: `asistem`
- Email: `asistem@guardianes.local`
- PIN: `secreto123`
- Rol: admin (sin school ni team)

### Colegios (16 oficiales, desde `schools.json`)

Los 16 colegios se insertan con UUID fijos (`e0000000-...-0001` … `e0000000-...-0010`).
Como `schools.json` no trae color ni abreviatura, se genera una **paleta de 16 colores** + `short`.
Todos inician en `points = 0` y `missions_completed = 0` (el juego arranca de cero).
Los equipos **no llevan color propio**: heredan el color de su colegio vía `school_id`.

### Generación de usuarios/equipos (DO $$ block)

El bloque **no crea colegios**: engancha los usuarios y equipos a los **primeros 5 de los 16 colegios**.
Cada uno de esos 5 colegios recibe:
- 1 director
- **2 docentes** (líderes) — un docente puede liderar **varios** equipos
- 3 equipos (cada uno con 5 alumnos)
- Total: **91 usuarios + 15 equipos**, repartidos en 5 colegios (los otros 11 quedan sin equipos, solo en el ranking en 0)

> **Docente multi-equipo (2026-07-05):** el docente es **líder**, no miembro — se le
> asigna por `teams.leader_id`, **no** por `usuarios.team_id` (esa es la relación
> alumno↔equipo, y en los docentes queda `NULL`). El primer docente (`lider_i_1`)
> lidera los equipos 1 y 2 (caso multi-equipo de prueba); el segundo (`lider_i_2`)
> lidera el equipo 3. Ver [refactor-panel-lider-supabase.md](refactor-panel-lider-supabase.md).

**Alias de login (fijos y sin tildes)** — ver `fix-seed-alias-fijos.md`:
- `director_<escuela>` (ej. `director_1`)
- `lider_<escuela>_<n>` con `n = 1..2` (ej. `lider_1_1`, `lider_1_2`) — **por docente, no por equipo**
- `alumno_<escuela>_<equipo>_<n>` (ej. `alumno_1_2_5`)
- Cuenta de prueba multi-equipo: **`lider_1_1`** (lidera 2 equipos).
- Los nombres/apellidos visibles siguen siendo aleatorios; solo el **alias** es determinista.

### Progreso e insignias (vacíos)

`mission_progression`, `insignia` y `team_insignia` se dejan **vacías** a propósito: el juego empieza de cero y las insignias las cargará el equipo organizador.

### Fixes aplicados

1. `f310ce5` — `pgcrypto` ahora usa schema `extensions` (`extensions.gen_salt`, `extensions.crypt`) para compatibilidad en producción
2. `22e0243` — corrección de `crypt()` a `extensions.crypt()` en seed de admin
3. `bb1183e` — se agregó `short` a las escuelas para ranking

### Script alternativo: `scripts/seed-users.mjs`

Script Node.js que usa `SUPABASE_SERVICE_ROLE_KEY` para crear usuarios vía `supabase.auth.admin.createUser()`. Lee `.env.local`. Útil para despliegues específicos donde no se puede ejecutar seed SQL directamente.
