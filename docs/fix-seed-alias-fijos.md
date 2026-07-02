# Fix: Alias de Login Fijos y Sin Tildes en el Seed

## Resumen

Se cambió la generación de alias en `supabase/seed.sql` (bloque `DO $$`) para que los alias de login sean **deterministas y ASCII puro**. Antes se construían a partir de nombres/apellidos aleatorios, lo que producía dos problemas.

---

## Problema

El seed armaba el alias como `inicial_nombre + apellido + sufijo`, con nombres/apellidos elegidos con `random()` de un array. Esto causaba:

1. **Alias distintos en cada `supabase db reset`** → imposibles de documentar de forma estable.
2. **Alias con tildes/ñ** (ej. `jfernández_prof_1_1`, `lzúñiga_1_1_1`, `mfernández_dir_2`). Estos **no pueden iniciar sesión**: GoTrue rechaza el email no-ASCII `<alias>@guardianes.local` con HTTP 400. ~40 de los ~96 usuarios quedaban inutilizables para probar.

## Solución

Se reemplazaron las 3 asignaciones de `v_alias` por patrones fijos basados en los índices del bucle:

| Rol | Antes | Ahora |
|---|---|---|
| Director | `mvargas_dir_1` (aleatorio) | `director_<i>` → `director_1` |
| Líder | `lcarpio_prof_1_2` (aleatorio) | `lider_<i>_<j>` → `lider_1_2` |
| Alumno | `dflores_1_2_3` (aleatorio) | `alumno_<i>_<j>_<k>` → `alumno_1_2_3` |

Donde `i` = escuela (1-5), `j` = equipo (1-3), `k` = alumno (1-5).
Los campos `nombre` y `apellidos` (lo que se muestra en la UI) siguen siendo aleatorios; solo cambió el **alias/login**.

Mapa de escuelas: `1=Independencia · 2=San Francisco · 3=San José · 4=Pilar · 5=La Salle`.

## Credenciales resultantes

- **PIN de todos:** `secreto123`
- **Admin:** `asistem` (sin cambios, siempre fue fijo)
- **Directores:** `director_1` .. `director_5`
- **Líderes:** `lider_1_1` .. `lider_5_3` (15)
- **Alumnos:** `alumno_1_1_1` .. `alumno_5_3_5` (75)

## Verificación

Tras `supabase db reset`:
- `SELECT count(*) FROM usuarios WHERE alias ~ '[áéíóúñ]'` → **0**
- Conteo por rol: 1 admin, 5 director, 15 leader, 75 student
- Login (`/auth/v1/token?grant_type=password`) probado para `asistem`, `director_1`, `lider_1_1`, `alumno_1_1_1`, `alumno_5_3_5` → **HTTP 200**

## Alcance

- **Solo afecta a la BD local.** El seed corre únicamente en `supabase db reset` local; el Supabase remoto/producción no se toca.
- La lista de credenciales quedó documentada como comentarios en `.env.local`.
