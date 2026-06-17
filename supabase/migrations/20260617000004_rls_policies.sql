-- RLS: cada usuario puede leer su propio perfil
CREATE POLICY "usuarios_select_own"
ON public.usuarios FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- RLS: cada usuario puede actualizar su propio perfil
CREATE POLICY "usuarios_update_own"
ON public.usuarios FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- roles: todos los autenticados pueden leer (necesario para el join en fetchProfile)
CREATE POLICY "roles_select_all"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- schools: todos los autenticados pueden leer
CREATE POLICY "schools_select_all"
ON public.schools FOR SELECT
TO authenticated
USING (true);

-- teams: todos los autenticados pueden leer
CREATE POLICY "teams_select_all"
ON public.teams FOR SELECT
TO authenticated
USING (true);
