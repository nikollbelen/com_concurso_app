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

Nivel requerido 1-5, con colores y 4-5 misiones cada uno.

### Misiones (24 total)

Extraídas del documento de propuesta, cada una con:
- `type`: trivia (23) + creative (1)
- `location`: lugar real en Arequipa
- `question`: texto de la pregunta
- `options`: JSON array con label y text
- `correct_answer`: letra de la opción correcta (A, B, C, D)
- `points`: 10 o 15 pts

### Usuario Admin

- Alias: `asistem`
- Email: `asistem@guardianes.local`
- PIN: `secreto123`
- Rol: admin (sin school ni team)

### Generación masiva (DO $$ block)

5 escuelas, cada una con:
- 1 director
- 3 equipos (cada uno con 1 leader/profesor + 5 alumnos)
- Total: ~96 usuarios + 15 equipos + 5 escuelas

### Fixes aplicados

1. `f310ce5` — `pgcrypto` ahora usa schema `extensions` (`extensions.gen_salt`, `extensions.crypt`) para compatibilidad en producción
2. `22e0243` — corrección de `crypt()` a `extensions.crypt()` en seed de admin
3. `bb1183e` — se agregó `short` a las escuelas para ranking

### Script alternativo: `scripts/seed-users.mjs`

Script Node.js que usa `SUPABASE_SERVICE_ROLE_KEY` para crear usuarios vía `supabase.auth.admin.createUser()`. Lee `.env.local`. Útil para despliegues específicos donde no se puede ejecutar seed SQL directamente.
