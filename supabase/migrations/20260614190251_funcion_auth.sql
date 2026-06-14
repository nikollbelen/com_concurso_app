set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  claims jsonb;
  usuario_rol uuid;
  usuario_equipo bigint;
BEGIN
  -- Buscar los datos del usuario en la tabla pública
  SELECT role_id, team_id INTO usuario_rol, usuario_equipo
  FROM public.usuarios
  WHERE id = (event->>'user_id')::uuid;

  -- Leer los claims actuales del evento
  claims := event->'claims';

  -- Si el usuario tiene un equipo, lo inyectamos en el token
  IF usuario_equipo IS NOT NULL THEN
    claims := jsonb_set(claims, '{team_id}', to_jsonb(usuario_equipo));
  END IF;

  -- Si el usuario tiene un rol, lo inyectamos en el token
  IF usuario_rol IS NOT NULL THEN
    claims := jsonb_set(claims, '{role_id}', to_jsonb(usuario_rol));
  END IF;

  -- Actualizar el evento con los nuevos claims y retornarlo a Supabase Auth
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;$function$
;


