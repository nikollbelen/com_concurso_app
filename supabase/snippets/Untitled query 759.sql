-- 1. Permisos para que el hook funcione
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON TABLE public.usuarios TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 2. Roles base
INSERT INTO public.roles (id, type) VALUES
  ('11111111-1111-1111-1111-111111111111', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'leader'),
  ('33333333-3333-3333-3333-333333333333', 'director'),
  ('44444444-4444-4444-4444-444444444444', 'admin')
ON CONFLICT DO NOTHING;

-- 3. Escuela
INSERT INTO public.schools (id, name, color, points) VALUES
  ('aaaa0001-0000-0000-0000-000000000000', 'Colegio Independencia Americana', '#7C3AED', 0)
ON CONFLICT DO NOTHING;

-- 4. Usuario lcondor (el UUID viene de auth.users)
INSERT INTO public.usuarios (id, alias, nombre, apellidos, role_id, school_id) VALUES
  ('bbbb0000-0000-0000-0000-000000000004',
   'lcondor', 'Lucas', 'Cóndor',
   '11111111-1111-1111-1111-111111111111',
   'aaaa0001-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;