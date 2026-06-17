CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
  v_team_id bigint;
  v_claims jsonb;
BEGIN
  -- 1. Intentamos obtener los datos del usuario de forma segura
  SELECT role_id, team_id INTO v_role_id, v_team_id
  FROM public.usuarios
  WHERE id = (event->>'user_id')::uuid;

  -- 2. Extraemos los claims actuales (o creamos un objeto vacío si no existen)
  v_claims := COALESCE(event->'claims', '{}'::jsonb);

  -- 3. FUSIÓN INTELIGENTE:
  -- jsonb_build_object agrupa los datos.
  -- jsonb_strip_nulls elimina automáticamente las llaves que tengan valor NULL.
  -- El operador || fusiona los nuevos claims con los existentes.
  v_claims := v_claims || jsonb_strip_nulls(
    jsonb_build_object(
      'role_id', v_role_id,
      'team_id', v_team_id
    )
  );

  -- 4. Reemplazamos los claims empaquetados en el evento original
  event := jsonb_set(event, '{claims}', v_claims);
  
  RETURN event;

EXCEPTION WHEN OTHERS THEN
  -- 5. EL PARACAÍDAS: Si algo falla (ej. error de tipos, tabla borrada, etc.), 
  -- devolvemos el evento original para que Supabase NO lance el Error 500
  -- y permita al usuario hacer login de todas formas.
  RETURN event;
END;
$$;