# Infraestructura: opencode + MCP + Warp

## Resumen

Configuración del proyecto para usar opencode con MCP Supabase local, plugin Warp, y documentos de contexto cargados automáticamente en cada sesión.

---

## Configuración

**Archivo:** `.opencode/opencode.json`

```json
{
  "plugin": ["@warp-dot-dev/opencode-warp@0.1.5"],
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "http://127.0.0.1:54321/mcp?features=database%2Cdevelopment%2Cdebugging%2Cdocs",
      "enabled": true
    }
  },
  "instructions": ["docs/Arquitectura Técnica y Estrategia - Guardianes de Arequipa V3.md", "docs/Propuesta_Guardianes_de_Arequipa.md", "docs/*"]
}
```

### Componentes

| Componente | Descripción |
|---|---|
| **Plugin Warp** | `@warp-dot-dev/opencode-warp` — conecta opencode con Warp terminal |
| **MCP Supabase** | Conexión remota vía `127.0.0.1:54321/mcp` con features: database, development, debugging, docs |
| **Instrucciones** | 3 documentos Markdown + glob `docs/*` cargados como contexto en cada sesión |
| **OAuth** | Autenticación completada exitosamente |

### Autenticación MCP

```bash
opencode mcp auth supabase
```

Flujo OAuth completado exitosamente, permitiendo que opencode acceda al esquema y datos de Supabase local.

---

## Documentos de contexto

| Archivo | Propósito |
|---|---|
| `docs/Arquitectura Técnica y Estrategia - Guardianes de Arequipa V3.md` | Documento de arquitectura técnica, estrategia offline, optimización de imágenes, autenticación, pool de conexiones, monitoreo |
| `docs/Propuesta_Guardianes_de_Arequipa.md` | Documento de propuesta del concurso: narrativa completa, 5 capítulos, 25 misiones, sistema de puntos, roles de usuario |

---

## Doc generados (post-implementación)

| Archivo | Cubre |
|---|---|
| `docs/migraciones-supabase-completas.md` | Schema completo, migraciones, triggers, vistas, RLS |
| `docs/conexion-paneles-supabase.md` | Conexión de 4 paneles frontend con datos reales |
| `docs/autenticacion-supabase-auth-store.md` | Auth store, login, custom_access_token_hook |
| `docs/seed-datos-prueba.md` | Seed de datos de prueba, fixes aplicados |
| `docs/infraestructura-mcp-opencode.md` | Configuración opencode + MCP + Warp (este archivo) |

## CI/CD

**Archivo:** `.github/workflows/deploy_migration_dev.yml`

- Se activa solo con cambios en `supabase/migrations/**` (commit `29eac4e`)
- Branch: `main`
- Usa `supabase/setup-cli@v2`
