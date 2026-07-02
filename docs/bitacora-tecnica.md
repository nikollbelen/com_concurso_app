# Bitácora Técnica

Registro incremental de fixes y ajustes menores (UI, comportamiento, correcciones puntuales).
Los refactors grandes y cambios de arquitectura tienen su propio archivo en `docs/`.

> Orden: entrada más reciente arriba.

---

## 2026-07-01 — Patrocinadores en el mapa ("Powered by")

**Archivo:** `app/(student)/mapa/page.tsx`

**Cambio:** se retiró la marca de agua del logo del concurso (`logo_principal.png`) del mapa, ya que se muestra al iniciar sesión. En su lugar, en la esquina inferior izquierda se agregaron los dos logos de patrocinadores (`public/images/patrocinadores/logo_yuki.png` y `citrus.png`) con una etiqueta "POWERED BY" encima.

**Detalles UI:**
- Layout en columna: etiqueta "POWERED BY" arriba, logos en fila debajo.
- Etiqueta: `Exo 2`, 9px, mayúsculas, tracking `0.12em`, `opacity-50`, color `--color-on-surface-var`.
- Logos: 30px de alto, `opacity-80`, `object-contain`.
- Contenedor `fixed bottom-4 left-4 z-40 pointer-events-none` con `drop-shadow` para legibilidad sobre el mapa.

**Pendiente:** confirmar que los PNG tengan fondo transparente (si no, se ven como recuadro sobre el mapa oscuro).

---

## 2026-07-01 — Fix: botón "Centrar en mi ubicación" y punto del usuario

**Archivo:** `app/(student)/mapa/page.tsx`

**Problema:** el botón "Centrar en mi ubicación" no hacía nada y el marcador de posición (`UserDot`) nunca aparecía. Causa raíz común: el seguimiento GPS (`watchPosition`) solo arrancaba si el permiso ya estaba en `'granted'`; en el estado inicial `'prompt'` nunca se pedía la ubicación, así que `userPos` quedaba en `null`.

**Solución:**
- `startWatch` extraído a un `useCallback` a nivel de componente (idempotente), reutilizado por el efecto, el botón y el banner de GPS.
- `handleCenterGps` ahora pide la ubicación con `getCurrentPosition` cuando aún no hay posición, centra el mapa (zoom 16) e inicia el seguimiento continuo.
- `handleActivateGps` (banner) también inicia `startWatch` tras conceder permiso.
- Nuevo estado `locating`: el FAB muestra spinner (`Loader2`) + label "Buscando tu ubicación…" mientras resuelve; icono cambiado a `LocateFixed` (azul cuando el GPS está activo).

**UI:** `UserDot` rediseñado al estilo Google Maps — punto azul sólido con borde blanco y glow, anillo de precisión pulsante. Sin flecha de dirección (descartada por diseño).

**Verificación:** `npx tsc --noEmit` sin errores.
