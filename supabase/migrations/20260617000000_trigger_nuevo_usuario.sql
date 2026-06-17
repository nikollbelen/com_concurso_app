-- Trigger que crea automáticamente el perfil en public.usuarios
-- cuando se registra un usuario en Supabase Auth.
-- DO UPDATE permite que un seed script posterior sobrescriba con datos completos.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, alias, nombre)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    split_part(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO UPDATE SET
    alias  = EXCLUDED.alias,
    nombre = EXCLUDED.nombre;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
