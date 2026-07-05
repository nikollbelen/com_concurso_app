-- ════════════════════════════════════════════════════════════════════
-- Catálogo de niveles (`levels`)
-- ────────────────────────────────────────────────────────────────────
-- Fuente de verdad de los títulos de nivel y los umbrales de puntos.
-- Antes el título ("Aprendiz de Arequipa", etc.) vivía hardcodeado en el
-- frontend (3 copias de un mapa LEVEL_TITLES) y el umbral estaba fijo en
-- +1500 dentro del trigger. Ahora todo se lee de esta tabla.
-- Títulos oficiales según docs/Propuesta_Guardianes_de_Arequipa.md (§1.4).
-- ════════════════════════════════════════════════════════════════════

create table if not exists "public"."levels" (
    "level" bigint not null,
    "title" text not null,
    -- Puntos totales que el equipo debe alcanzar para subir al SIGUIENTE
    -- nivel. NULL = nivel máximo (no hay nivel superior).
    "next_level_points" bigint,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" text,
    constraint "levels_pkey" primary key ("level")
);

-- RLS: el event-trigger rls_auto_enable ya activa RLS al crear la tabla;
-- lo dejamos explícito e idempotente y añadimos lectura pública (catálogo).
alter table "public"."levels" enable row level security;

drop policy if exists "Lectura pública de niveles" on "public"."levels";
create policy "Lectura pública de niveles"
  on "public"."levels"
  as permissive
  for select
  to public
  using (true);

grant select on table "public"."levels" to "anon";
grant select on table "public"."levels" to "authenticated";
grant select on table "public"."levels" to "service_role";

-- ── Poblar el catálogo (idempotente) ────────────────────────────────
-- Umbrales de puntos de ejemplo (1500 por nivel); ajústalos cuando el
-- equipo defina el balance real del concurso. Nivel 5 = tope (NULL).
insert into "public"."levels" ("level", "title", "next_level_points") values
    (1, 'Aprendiz de Arequipa', 1500),
    (2, 'Explorador Histórico', 3000),
    (3, 'Custodio del Sillar',  4500),
    (4, 'Guardián del Chili',   6000),
    (5, 'Cronista Legendario',  null)
on conflict ("level") do update
    set "title" = excluded."title",
        "next_level_points" = excluded."next_level_points";

-- ── FK teams.level → levels.level ───────────────────────────────────
-- Garantiza que el nivel de un equipo siempre exista en el catálogo y
-- habilita el embedding de PostgREST (teams → levels). Se añade DESPUÉS
-- de poblar `levels` para que sea válida también en BDs con datos.
alter table "public"."teams"
    drop constraint if exists "teams_level_fkey";
alter table "public"."teams"
    add constraint "teams_level_fkey"
    foreign key ("level") references "public"."levels"("level")
    on update cascade on delete set null
    not valid;
alter table "public"."teams" validate constraint "teams_level_fkey";

-- ════════════════════════════════════════════════════════════════════
-- Trigger de subida de nivel: ahora lee el umbral desde `levels`
-- ────────────────────────────────────────────────────────────────────
-- Antes leía teams.next_level_points (que quedaba NULL en el seed, por lo
-- que el level-up nunca disparaba). Ahora toma el umbral del nivel actual
-- desde el catálogo `levels`. Al llegar al último nivel (next_level_points
-- NULL) deja de subir de forma natural.
-- ════════════════════════════════════════════════════════════════════
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.actualizar_estadisticas_mision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  mision_puntos bigint;
  equipo_escuela uuid;
  puntos_totales bigint;
  puntos_requeridos bigint;
  nivel_actual bigint;
BEGIN
  -- Solo actuamos si la misión acaba de ser aprobada ('completed')
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN

    -- 1. Puntos que vale la misión
    SELECT points INTO mision_puntos FROM public.missions WHERE id = NEW.mission_id;

    -- 2. Escuela y nivel ACTUAL del equipo
    SELECT school_id, level INTO equipo_escuela, nivel_actual
    FROM public.teams WHERE id = NEW.team_id;

    -- 3. Sumamos misión y puntos (RETURNING para saber el total al instante)
    UPDATE public.teams
    SET missions_completed = missions_completed + 1,
        points = points + mision_puntos
    WHERE id = NEW.team_id
    RETURNING points INTO puntos_totales;

    -- 4. Umbral del nivel actual, desde el catálogo `levels` (fuente de verdad)
    SELECT next_level_points INTO puntos_requeridos
    FROM public.levels WHERE level = nivel_actual;

    -- 5. Level up si alcanzó la meta (y no es el nivel tope → umbral NULL)
    IF puntos_requeridos IS NOT NULL AND puntos_totales >= puntos_requeridos THEN
      UPDATE public.teams SET level = level + 1 WHERE id = NEW.team_id;
    END IF;

    -- 6. Actualizamos el colegio (ranking general público)
    UPDATE public.schools
    SET missions_completed = missions_completed + 1,
        points = points + mision_puntos
    WHERE id = equipo_escuela;

  END IF;
  RETURN NEW;
END;
$function$
;

-- ════════════════════════════════════════════════════════════════════
-- Vista de equipos: exponemos el título del nivel desde el catálogo
-- ════════════════════════════════════════════════════════════════════
-- DROP + CREATE (no CREATE OR REPLACE): añadimos columnas en medio del
-- SELECT y CREATE OR REPLACE no permite reordenar/renombrar columnas.
drop view if exists "public"."vista_equipos_completos";
create view "public"."vista_equipos_completos" with (security_invoker = on) as SELECT t.id AS team_id,
    t.name AS team_name,
    t.level,
    l.title AS level_title,
    l.next_level_points,
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
   FROM ((public.teams t
     JOIN public.schools s ON ((t.school_id = s.id)))
     LEFT JOIN public.levels l ON ((l.level = t.level)));

-- ── Re-otorgar SELECT sobre la vista recreada ───────────────────────
-- DROP VIEW borra TODOS los grants; sin esto la app (rol anon/authenticated)
-- recibe "permission denied for view" → el dashboard cae a sus fallbacks
-- (nextLevelPoints = null → "¡Nivel máximo alcanzado!" con 0 XP). Ver
-- 20260623000000_grant_select.sql, que quedó anulado al recrear la vista.
grant select on public.vista_equipos_completos to authenticated;
grant select on public.vista_equipos_completos to anon;
