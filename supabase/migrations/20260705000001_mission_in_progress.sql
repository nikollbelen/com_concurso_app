-- Añade el estado `in_progress` a las misiones.
-- Representa que el equipo ya "empezó" la misión y va en camino al lugar físico
-- del marcador. Al confirmar su llegada (geofence 20m) pasa a resolver la misión.

alter table "public"."mission_progression"
  drop constraint if exists "mission_progression_status_check";

alter table "public"."mission_progression"
  add constraint "mission_progression_status_check"
  CHECK ((status = ANY (ARRAY[
    'available'::text,
    'in_progress'::text,
    'review'::text,
    'completed'::text,
    'rejected'::text,
    'locked'::text
  ]))) not valid;

alter table "public"."mission_progression"
  validate constraint "mission_progression_status_check";
