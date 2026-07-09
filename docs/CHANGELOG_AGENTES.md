# Changelog de Agentes

Registro incremental de tareas implementadas por agentes. Cada entrada describe qué se hizo, qué archivos se modificaron, decisiones técnicas y estado actual.

---

## 2026-07-09 — Fix: Mapbox tiles grises al montar el mapa + offline strategy

### Fix: Mapbox tiles no cargaban hasta hacer zoom

Se agregó un `useEffect` que forza `mapRef.current?.resize()` 100ms después del montaje del mapa para que Mapbox recalcule el tile coverage cuando el contenedor ya tiene su altura definitiva.

- **Archivo:** `app/(student)/mapa/page.tsx`
- **Causa:** El mapa usa `style={{ position: 'fixed', inset: 0 }}`. Mapbox calcula los tiles a renderizar según el tamaño del contenedor en el momento del montaje. Si el contenedor no tiene altura resuelta al primer paint, los cálculos fallan y los tiles quedan grises. Al hacer zoom, Mapbox re-calcula el tile coverage y carga correctamente.
- **Solución:** `mapRef.current?.resize()` con `setTimeout` de 100ms post-montaje, forzando a Mapbox a re-evaluar el viewport.
- **Estado:** ✅

### Offline strategy (branch `feat/cosa_a_implementar`)

Se implementó la estrategia completa de tolerancia a fallos de red descrita en la sección 2 del documento de arquitectura técnica.

- **Service Worker:** vía `@serwist/turbopack` con precaché de 44 entradas (9.3 MiB). Registrado solo en producción para evitar bucle de recarga en desarrollo.
- **IndexedDB:** usando la librería `idb` con tres stores: `pending_responses` (cola de respuestas de trivia/texto), `pending_photos` (cola de fotos pendientes de subir), `cached_missions` (caché de misiones).
- **Compresión WebP:** `photo-compressor.ts` reduce fotos a ~200 KB vía canvas (`toBlob('image/webp', 0.6)`, max 1200px).
- **Sincronización automática:** `useOfflineSync` detecta `navigator.onLine` y replay automático al reconectar. `useSubmitMission` intenta Supabase primero, encola en IndexedDB si falla.
- **Archivos creados:** `app/sw.ts`, `app/manifest.ts`, `app/serwist/[path]/route.ts`, `shared/infrastructure/offline/` (5 archivos), `modules/missions/presentation/hooks/useOfflineSync.ts`, `modules/missions/presentation/hooks/useSubmitMission.ts`
- **Archivos modificados:** `next.config.ts`, `app/layout.tsx`, `app/(student)/mision/[id]/page.tsx`
- **Decisión técnica:** Se usó `@serwist/turbopack` en vez de `@serwist/next` porque Next.js 16 usa Turbopack por defecto. El SW se desactiva en desarrollo (`process.env.NODE_ENV === 'development'`) para evitar el bucle de recarga causado por `clientsClaim: true`.
- **Estado:** ✅ en rama `feat/cosa_a_implementar`

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
