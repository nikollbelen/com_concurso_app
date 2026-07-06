-- ════════════════════════════════════════════════════════════════════
-- Variantes de pregunta para misiones de trivia (`mission_questions`)
-- ────────────────────────────────────────────────────────────────────
-- Antes cada misión tenía UNA sola pregunta embebida en `missions`
-- (question/options/correct_answer). Eso permite que equipos del mismo
-- colegio se pasen la respuesta.
--
-- Ahora una misión de trivia puede tener 1..N *variantes* de pregunta.
-- Al empezar la misión, a cada equipo se le asigna una variante al azar
-- (ver mission_progression.question_id, más abajo). Copiar "la respuesta
-- de la misión" deja de servir porque cada equipo responde algo distinto.
--
-- Photo/creative NO usan esta tabla: su prompt es único y sigue viviendo
-- en `missions.question`.
-- ════════════════════════════════════════════════════════════════════

create table if not exists "public"."mission_questions" (
    "id" uuid not null default gen_random_uuid(),
    "mission_id" uuid not null,
    "question" text not null,
    -- Mismo formato JSON que missions.options: [{ "label": "A", "text": "…" }, …]
    "options" json not null,
    -- Letra de la alternativa correcta ('A'..'D'), igual que missions.correct_answer
    "correct_answer" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" text,
    "deleted_at" text,
    constraint "mission_questions_pkey" primary key ("id")
);

-- FK a la misión dueña. Las variantes mueren con la misión (CASCADE).
alter table "public"."mission_questions"
    drop constraint if exists "mission_questions_mission_id_fkey";
alter table "public"."mission_questions"
    add constraint "mission_questions_mission_id_fkey"
    foreign key ("mission_id") references "public"."missions"("id")
    on update cascade on delete cascade
    not valid;
alter table "public"."mission_questions" validate constraint "mission_questions_mission_id_fkey";

-- Búsqueda de variantes por misión (para la asignación aleatoria).
create index if not exists "mission_questions_mission_id_idx"
    on "public"."mission_questions" ("mission_id");

-- RLS: lectura pública (catálogo), igual que `missions`.
alter table "public"."mission_questions" enable row level security;

drop policy if exists "Lectura pública de variantes" on "public"."mission_questions";
create policy "Lectura pública de variantes"
  on "public"."mission_questions"
  as permissive
  for select
  to public
  using (true);

grant select on table "public"."mission_questions" to "anon";
grant select on table "public"."mission_questions" to "authenticated";
grant select on table "public"."mission_questions" to "service_role";

-- ── Backfill: cada trivia existente → su variante #1 ────────────────
-- Así nada se rompe: las 20 trivias actuales quedan con una variante que
-- reproduce exactamente la pregunta que ya tenían. Añadir más variantes
-- es simplemente insertar filas nuevas con el mismo mission_id.
-- Idempotente: solo inserta si la misión aún no tiene variantes.
insert into "public"."mission_questions" ("mission_id", "question", "options", "correct_answer")
select m."id", m."question", m."options", m."correct_answer"
from "public"."missions" m
where m."type" = 'trivia'
  and m."question" is not null
  and m."options" is not null
  and m."correct_answer" is not null
  and not exists (
    select 1 from "public"."mission_questions" q where q."mission_id" = m."id"
  );

-- ════════════════════════════════════════════════════════════════════
-- mission_progression.question_id — variante asignada al equipo
-- ────────────────────────────────────────────────────────────────────
-- Registra QUÉ variante le tocó a este equipo en esta misión. Se fija al
-- empezar la misión (startMission) y no se reasigna: el equipo ve siempre
-- la misma pregunta. Es también la base para una futura regla "no repetir
-- variante dentro del mismo colegio" (bastaría filtrar por school_id).
-- NULL = misión sin variante asignada (photo/creative, o trivia aún no
-- empezada).
-- ════════════════════════════════════════════════════════════════════
alter table "public"."mission_progression"
    add column if not exists "question_id" uuid;

alter table "public"."mission_progression"
    drop constraint if exists "mission_progression_question_id_fkey";
alter table "public"."mission_progression"
    add constraint "mission_progression_question_id_fkey"
    foreign key ("question_id") references "public"."mission_questions"("id")
    on update cascade on delete set null
    not valid;
alter table "public"."mission_progression" validate constraint "mission_progression_question_id_fkey";
