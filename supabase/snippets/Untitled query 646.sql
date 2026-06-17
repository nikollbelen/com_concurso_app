SELECT public.custom_access_token_hook(
  jsonb_build_object(
    'user_id', '97375ed6-bd60-413f-a496-e245e54c2348', -- Pon aquí un ID de usuario válido
    'claims', '{"role": "authenticated"}'::jsonb
  )
);