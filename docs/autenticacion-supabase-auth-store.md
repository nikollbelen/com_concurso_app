# Autenticación con Supabase — Auth Store

## Resumen

Migración del sistema de autenticación desde mock JSON local a Supabase Auth real. Se reescribió completamente `authStore.ts` y la página de login.

---

## authStore.ts

**Archivo:** `modules/auth/infrastructure/stores/authStore.ts`

**Antes:** Usaba `localStorage` + usuarios mock de `data/json/users.json`. Login simulaba delay con `setTimeout`.

**Después:**

### Interfaces

```ts
export interface AuthUser {
  id: string
  name: string
  username: string
  role: Role          // 'student' | 'leader' | 'director' | 'admin'
  teamId?: number     // antes era string
  schoolId?: string
  schoolShortName?: string
  schoolName?: string
  color: string
  level?: number
  levelTitle?: string
}
```

### Funciones

| Función | Descripción |
|---|---|
| `hydrate()` | Llama a `supabase.auth.getSession()`. Si hay sesión, hace fetch del perfil completo a `public.usuarios` con JOINs a roles, schools, teams |
| `login(alias, pin)` | Construye email `{alias}@guardianes.local`, llama a `supabase.auth.signInWithPassword()`. Luego `fetchProfile()` |
| `logout()` | `supabase.auth.signOut()` + limpia estado |

### fetchProfile

Consulta a `public.usuarios` con:
- `roles(type)` — para obtener el rol del usuario
- `schools(id, name, short, color)` — datos del colegio
- `teams!usuarios_team_id_fkey(level)` — nivel del equipo

Mapea a `AuthUser` incluyendo `levelTitle` desde `LEVEL_TITLES` (Iniciado, Explorador Histórico, Guardián Novato, etc.)

---

## Login Page

**Archivo:** `app/(auth)/login/page.tsx`

- Placeholders cambiados a "Alias" y "PIN secreto"
- Login ahora es async (`await login(username, password)`)
- Mensaje de error: "Alias o PIN incorrectos. Intenta nuevamente."

---

## Auth Hook (lado servidor)

**Archivo:** `supabase/migrations/20260614190251_funcion_auth.sql`

`custom_access_token_hook`:

- Se ejecuta en cada login/refresh como SECURITY DEFINER
- Lee `role_id` y `team_id` de `public.usuarios`
- Los inyecta en los claims JWT como `role_id` y `team_id`
- Incluye `jsonb_strip_nulls` para omitir campos NULL
- Paracaídas: si falla, devuelve event original sin modificar (no bloquea login)

Configurado en `config.toml`:
```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"
```

---

## Seed de datos

**Archivo:** `supabase/seed.sql`

- 1 admin: `asistem@guardianes.local` / `secreto123`
- 5 schools con 3 equipos cada una (1 leader + 5 students por equipo)
- Passwords: todas `secreto123` (hash con `extensions.crypt()`)
- Usa `pgcrypto` con schema `extensions`
- Roles con UUIDs fijos y deterministas

### Script alternativo de seed

`scripts/seed-users.mjs` — script Node.js para crear usuarios vía `supabase.auth.admin.createUser()`. Usa `SUPABASE_SERVICE_ROLE_KEY`.
