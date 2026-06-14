ALTER TABLE "public"."nombre_de_la_tabla" ENABLE ROW LEVEL SECURITY;

-- 1. Política de LECTURA (SELECT)
CREATE POLICY "Ver solo lo de mi equipo"
ON "public"."nombre_de_la_tabla"
FOR SELECT TO authenticated
USING (
  team_id = (current_setting('request.jwt.claims', true)::jsonb->>'team_id')::bigint
);

-- 2. Política de CREACIÓN (INSERT)
CREATE POLICY "Crear solo para mi equipo"
ON "public"."nombre_de_la_tabla"
FOR INSERT TO authenticated
WITH CHECK (
  team_id = (current_setting('request.jwt.claims', true)::jsonb->>'team_id')::bigint
);

-- 3. Política de EDICIÓN (UPDATE)
CREATE POLICY "Editar solo lo de mi equipo"
ON "public"."nombre_de_la_tabla"
FOR UPDATE TO authenticated
USING (
  team_id = (current_setting('request.jwt.claims', true)::jsonb->>'team_id')::bigint
)
WITH CHECK (
  team_id = (current_setting('request.jwt.claims', true)::jsonb->>'team_id')::bigint
);

CREATE POLICY "Cualquier jugador puede leer"
ON "public"."nombre_de_la_tabla"
FOR SELECT TO authenticated
USING (true);