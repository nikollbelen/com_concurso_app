-- Corrige el trigger para que un seed script posterior pueda sobrescribir
-- el alias y nombre que el trigger crea con los datos completos.

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
