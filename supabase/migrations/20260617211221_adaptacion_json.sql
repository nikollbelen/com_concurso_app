
  create table "public"."fragments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "icon" text not null,
    "created_at" timestamp with time zone not null default now(),
    "deleted_at" text,
    "updated_at" text
      );


alter table "public"."fragments" enable row level security;

alter table "public"."chapters" drop column "fragment";

alter table "public"."chapters" add column  IF NOT EXISTS "color" text;

alter table "public"."chapters" add column  IF NOT EXISTS "id_fragment" uuid not null;

alter table "public"."chapters" add column  IF NOT EXISTS "required_level" smallint;

alter table "public"."chapters" add column  IF NOT EXISTS "subtitle" text;

alter table "public"."chapters" add column  IF NOT EXISTS "total_missions" smallint;

alter table "public"."mission_progression" alter column "status" set data type text using "status"::text;

alter table "public"."mission_progression" alter column "status" set default 'available'::text;

alter table "public"."missions" add column  IF NOT EXISTS "coordinates" text;

alter table "public"."missions" add column  IF NOT EXISTS "correct_answer" text;

alter table "public"."missions" add column  IF NOT EXISTS "location" text;

alter table "public"."missions" add column  IF NOT EXISTS "options" json;

alter table "public"."missions" add column  IF NOT EXISTS "question" text;

alter table "public"."missions" add column  IF NOT EXISTS "type" text;

alter table "public"."schools" add column  IF NOT EXISTS "missions_completed" smallint default 0;

alter table "public"."teams" add column  IF NOT EXISTS "color" text;

alter table "public"."teams" add column  IF NOT EXISTS "current_chapter_id" uuid;

alter table "public"."teams" add column  IF NOT EXISTS "level_title" text;

alter table "public"."teams" add column  IF NOT EXISTS "missions_completed" smallint default 0;

alter table "public"."teams" add column  IF NOT EXISTS "next_level_points" bigint;

CREATE UNIQUE INDEX fragment_pkey ON public.fragments USING btree (id);

alter table "public"."fragments" add constraint "fragment_pkey" PRIMARY KEY using index "fragment_pkey";

alter table "public"."chapters" add constraint "chapters_id_fragment_fkey" FOREIGN KEY (id_fragment) REFERENCES public.fragments(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."chapters" validate constraint "chapters_id_fragment_fkey";

alter table "public"."mission_progression" drop constraint if exists "mission_progression_status_check";

alter table "public"."mission_progression" add constraint "mission_progression_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'review'::text, 'completed'::text, 'rejected'::text, 'locked'::text]))) not valid;

alter table "public"."mission_progression" validate constraint "mission_progression_status_check";

alter table "public"."teams" add constraint "teams_current_chapter_id_fkey" FOREIGN KEY (current_chapter_id) REFERENCES public.chapters(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."teams" validate constraint "teams_current_chapter_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.actualizar_estadisticas_mision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  mision_puntos bigint;
  equipo_escuela uuid;
  
  -- Nuevas variables para la lógica de subida de nivel
  puntos_totales bigint;
  puntos_requeridos bigint;
BEGIN
  -- Solo actuamos si la misión acaba de ser aprobada por el docente ('completed')
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    
    -- 1. Obtenemos cuántos puntos vale la misión que acaban de completar
    SELECT points INTO mision_puntos FROM public.missions WHERE id = NEW.mission_id;
    
    -- 2. Obtenemos la escuela y la meta de puntos del equipo
    SELECT school_id, next_level_points INTO equipo_escuela, puntos_requeridos 
    FROM public.teams WHERE id = NEW.team_id;

    -- 3. Actualizamos al equipo (Sumamos misiones y puntos)
    -- Usamos RETURNING para saber con cuántos puntos quedó el equipo en este mismo instante
    UPDATE public.teams 
    SET missions_completed = missions_completed + 1, 
        points = points + mision_puntos
    WHERE id = NEW.team_id
    RETURNING points INTO puntos_totales;

    -- ==========================================================
    -- 4. ¡LA MAGIA DEL LEVEL UP (NUEVO)!
    -- Si el equipo alcanzó o superó la meta de puntos...
    -- ==========================================================
    IF puntos_requeridos IS NOT NULL AND puntos_totales >= puntos_requeridos THEN
      UPDATE public.teams 
      SET 
        level = level + 1, 
        -- Aquí puedes definir cuánto costará el SIGUIENTE nivel. 
        -- (Ejemplo: sumamos 1500 puntos a la meta anterior)
        next_level_points = puntos_requeridos + 1500 
      WHERE id = NEW.team_id;
    END IF;

    -- 5. Actualizamos el colegio al instante (Para el Ranking General Público)
    UPDATE public.schools 
    SET missions_completed = missions_completed + 1, 
        points = points + mision_puntos
    WHERE id = equipo_escuela;

  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

create or replace view "public"."vista_equipos_completos" with (security_invoker = on) as SELECT t.id AS team_id,
    t.name AS team_name,
    t.level,
    t.points,
    t.color,
    t.school_id,
    s.name AS school_name,
    ( SELECT COALESCE(json_agg(json_build_object('id', u.id, 'name', u.nombre, 'alias', u.alias)), '[]'::json) AS "coalesce"
           FROM public.usuarios u
          WHERE (u.team_id = t.id)) AS members,
    ( SELECT COALESCE(json_agg(f.id), '[]'::json) AS "coalesce"
           FROM (public.chapters c
             JOIN public.fragments f ON ((c.id_fragment = f.id)))
          WHERE (c.required_level < t.level)) AS earned_fragments
   FROM (public.teams t
     JOIN public.schools s ON ((t.school_id = s.id)));


grant delete on table "public"."fragments" to "anon";

grant insert on table "public"."fragments" to "anon";

grant references on table "public"."fragments" to "anon";

grant select on table "public"."fragments" to "anon";

grant trigger on table "public"."fragments" to "anon";

grant truncate on table "public"."fragments" to "anon";

grant update on table "public"."fragments" to "anon";

grant delete on table "public"."fragments" to "authenticated";

grant insert on table "public"."fragments" to "authenticated";

grant references on table "public"."fragments" to "authenticated";

grant select on table "public"."fragments" to "authenticated";

grant trigger on table "public"."fragments" to "authenticated";

grant truncate on table "public"."fragments" to "authenticated";

grant update on table "public"."fragments" to "authenticated";

grant delete on table "public"."fragments" to "service_role";

grant insert on table "public"."fragments" to "service_role";

grant references on table "public"."fragments" to "service_role";

grant select on table "public"."fragments" to "service_role";

grant trigger on table "public"."fragments" to "service_role";

grant truncate on table "public"."fragments" to "service_role";

grant update on table "public"."fragments" to "service_role";


  create policy "Lectura pública de capítulos"
  on "public"."chapters"
  as permissive
  for select
  to public
using (true);



  create policy "Lectura pública de fragmentos"
  on "public"."fragments"
  as permissive
  for select
  to public
using (true);



  create policy "Lectura pública de insignias"
  on "public"."insignia"
  as permissive
  for select
  to public
using (true);



  create policy "Actualizar progreso por Estudiante, Docente o Admin"
  on "public"."mission_progression"
  as permissive
  for update
  to authenticated
using (((((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'team_id'::text))::bigint = team_id) AND ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '11111111-1111-1111-1111-111111111111'::uuid)) OR ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '22222222-2222-2222-2222-222222222222'::uuid) OR ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '44444444-4444-4444-4444-444444444444'::uuid)))
with check (((((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'team_id'::text))::bigint = team_id) AND ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '11111111-1111-1111-1111-111111111111'::uuid)) OR ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '22222222-2222-2222-2222-222222222222'::uuid) OR ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '44444444-4444-4444-4444-444444444444'::uuid)));



  create policy "Feed en vivo visible para anonimos"
  on "public"."mission_progression"
  as permissive
  for select
  to public
using (true);



  create policy "Insertar progreso por rol"
  on "public"."mission_progression"
  as permissive
  for insert
  to authenticated
with check (((((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'team_id'::text))::bigint = team_id) AND ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '11111111-1111-1111-1111-111111111111'::uuid)) OR ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '44444444-4444-4444-4444-444444444444'::uuid)));



  create policy "Lectura pública de misiones"
  on "public"."missions"
  as permissive
  for select
  to public
using (true);



  create policy "Lectura pública de roles"
  on "public"."roles"
  as permissive
  for select
  to public
using (true);



  create policy "Ranking colegios visible para anonimos"
  on "public"."schools"
  as permissive
  for select
  to public
using (true);



  create policy "Todos ven insignias ganadas"
  on "public"."team_insignia"
  as permissive
  for select
  to public
using (true);



  create policy "Ranking equipos visible para anonimos"
  on "public"."teams"
  as permissive
  for select
  to public
using (true);



  create policy "Todos pueden ver a los usuarios"
  on "public"."usuarios"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER trigger_mision_completada AFTER UPDATE ON public.mission_progression FOR EACH ROW EXECUTE FUNCTION public.actualizar_estadisticas_mision();


