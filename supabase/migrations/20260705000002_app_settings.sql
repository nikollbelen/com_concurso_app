-- Tabla de ajustes globales del juego (key-value), editables desde el panel admin.
-- Primer ajuste: `arrival_radius_m` = radio en metros dentro del cual se considera
-- que un alumno "llegó" al marcador de una misión (geofence).

create table if not exists "public"."app_settings" (
  "key" text primary key,
  "value" jsonb not null,
  "updated_at" timestamptz not null default now()
);

alter table "public"."app_settings" enable row level security;

-- Lectura pública: los alumnos necesitan el radio para el check de llegada.
create policy "Lectura pública de ajustes"
  on "public"."app_settings"
  as permissive
  for select
  to public
  using (true);

-- Escritura solo para administradores (role_id admin).
create policy "Solo admin modifica ajustes"
  on "public"."app_settings"
  as permissive
  for all
  to authenticated
  using ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '44444444-4444-4444-4444-444444444444'::uuid)
  with check ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role_id'::text))::uuid = '44444444-4444-4444-4444-444444444444'::uuid);

grant select on table "public"."app_settings" to "anon";
grant select on table "public"."app_settings" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."app_settings" to "service_role";
grant insert, update, delete on table "public"."app_settings" to "authenticated";

-- Valor por defecto (20 m).
insert into "public"."app_settings" ("key", "value")
values ('arrival_radius_m', '20'::jsonb)
on conflict ("key") do nothing;
