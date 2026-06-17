-- 1. Permiso crucial: Permitir al auth admin "entrar" al esquema public
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- 2. Permiso para ejecutar el hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- 3. (Opcional pero recomendado) Revocar a los demás para seguridad
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;