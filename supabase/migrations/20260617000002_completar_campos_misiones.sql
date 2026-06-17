-- ============================================================
-- CHAPTERS: campos que existen en el JSON pero no en la BD
-- ============================================================
ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS subtitle       text,
  ADD COLUMN IF NOT EXISTS required_level smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS color          text,
  ADD COLUMN IF NOT EXISTS total_missions smallint,
  ADD COLUMN IF NOT EXISTS fragment_name  text,
  ADD COLUMN IF NOT EXISTS fragment_icon  text;

-- ============================================================
-- MISSIONS: campos críticos para el mapa y la lógica del juego
-- ============================================================
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS type          text NOT NULL DEFAULT 'trivia',
  ADD COLUMN IF NOT EXISTS latitude      double precision,
  ADD COLUMN IF NOT EXISTS longitude     double precision,
  ADD COLUMN IF NOT EXISTS order_index   smallint,
  ADD COLUMN IF NOT EXISTS question      text,
  ADD COLUMN IF NOT EXISTS options       jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer smallint;

ALTER TABLE public.missions
  DROP CONSTRAINT IF EXISTS missions_type_check;
ALTER TABLE public.missions
  ADD CONSTRAINT missions_type_check
  CHECK (type IN ('trivia', 'photo', 'creative'));

-- ============================================================
-- MISSION_PROGRESSION: status boolean → text con 4 estados
-- ============================================================
ALTER TABLE public.mission_progression
  DROP CONSTRAINT IF EXISTS mission_progression_status_check;

ALTER TABLE public.mission_progression
  ALTER COLUMN status TYPE text
  USING CASE WHEN status = true THEN 'completed' ELSE 'available' END;

ALTER TABLE public.mission_progression
  ALTER COLUMN status SET DEFAULT 'available';

ALTER TABLE public.mission_progression
  ADD CONSTRAINT mission_progression_status_check
  CHECK (status IN ('available', 'completed', 'review', 'locked'));
