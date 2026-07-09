# Changelog de Agentes

Registro incremental de tareas implementadas por agentes. Cada entrada describe qué se hizo, qué archivos se modificaron, decisiones técnicas y estado actual.

---

## 2026-07-09 — Infraestructura de testing + fix logout race + docs

### Tests (Vitest + Testing Library)

Se instaló y configuró el ecosistema completo de testing para el proyecto:

- **Dependencias:** `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vite-tsconfig-paths`
- **Config:** `vitest.config.mts` con jsdom, React plugin, tsconfig paths nativo (`resolve.tsconfigPaths: true`)
- **Setup:** `tests/setup.ts` con `import '@testing-library/jest-dom/vitest'`
- **Scripts:** `npm test` (vitest run), `npm run test:watch` (vitest watch)
- **Tests escritos:**
  - `tests/shared/ui/styles/cn.test.ts` — 5 tests: merge, conflictos Tailwind, condicionales, falsy, vacío
  - `tests/shared/ui/components/FabButton.test.tsx` — 6 tests: render, aria-label, badge 0/3, className, onClick
- **Resultado:** 11/11 tests pasan, 0 warnings, ~3.5s de ejecución
- **Archivos creados:** `vitest.config.mts`, `tests/setup.ts`, `tests/cn.test.ts`, `tests/FabButton.test.tsx`
- **Archivos modificados:** `package.json` (scripts), `AGENTS.md` (comandos de test)

**Decisión técnica:** Se usó `resolve.tsconfigPaths: true` nativo de Vite en vez del plugin `vite-tsconfig-paths` para evitar el warning de deprecación. Estructura de `tests/` replica la de `src/` para facilitar la navegación.

### Fix: race condition en logout

Se agregó flag `isLoggingOut` al store de Zustand para evitar que `hydrate()` re-pueble el usuario con una sesión aún no invalidada por `signOut()`.

- **Archivo:** `modules/auth/infrastructure/stores/authStore.ts`
- **Cambio:** `hydrate()` consulta `get().isLoggingOut` antes de llamar a `getSession()`; si es true, retorna early. `logout()` setea `isLoggingOut: true` antes de `signOut()` y lo limpia después.
- **Estado:** ✅

### Docs: DB_SCHEMA.md + AGENTS.md compacto

- **`docs/DB_SCHEMA.md`:** Documento de esquema de BD verificado contra la base real vía MCP Supabase (12 tablas, 1 vista, 1 trigger, auth hook, RLS, ranking tiebreaker, credenciales de prueba).
- **`AGENTS.md`:** Reescribito de 194 → ~105 líneas. Se eliminó información stale (colores que no coincidían con globals.css, tablas de migraciones incompletas, rutas que ya no existen). Se corrigieron fuentes de datos por ruta (todas en Supabase).
- **Estado:** ✅

### Chore: untrack opencode.json

- Se removió `.opencode/opencode.json` del tracking de git porque contenía una API key.
- Se agregaron patrones a `.gitignore`: `.opencode/opencode.json` y `.opencode/codebase-index.json`.
- **Archivos:** `.gitignore` modificado, `.opencode/opencode.json` eliminado del índice.
- **Estado:** ✅
