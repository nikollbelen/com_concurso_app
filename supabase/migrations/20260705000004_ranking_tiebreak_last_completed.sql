-- Desempate del ranking por tiempo de la última misión completada.
--
-- Regla de juego: cuando dos o más colegios (o equipos) tienen los MISMOS puntos,
-- sube más arriba en la tabla de posiciones el que completó ANTES su última misión
-- (el que llegó primero a ese puntaje). Como los puntos solo cambian al completar
-- una misión, la marca `last_completed_at` es justamente el instante en que el
-- colegio/equipo alcanzó su puntaje actual.
--
-- El orden final del ranking pasa a ser: points DESC, last_completed_at ASC
-- (más temprano = mejor). Los que aún no puntúan quedan con last_completed_at NULL
-- y se ordenan al final (nulls last), igual que antes quedaban sin puesto.

-- 1. Marca de tiempo de la última misión completada (NULL = aún sin completar ninguna).
alter table "public"."teams"   add column if not exists "last_completed_at" timestamptz;
alter table "public"."schools" add column if not exists "last_completed_at" timestamptz;

-- 2. El trigger que ya suma puntos/misiones al completar ahora también sella el
--    instante de la última misión completada, tanto en el equipo como en el colegio.
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.actualizar_estadisticas_mision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  mision_puntos bigint;
  equipo_escuela uuid;

  -- Variables para la lógica de subida de nivel
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

    -- 3. Actualizamos al equipo (Sumamos misiones y puntos + sellamos la última completada)
    -- Usamos RETURNING para saber con cuántos puntos quedó el equipo en este mismo instante
    UPDATE public.teams
    SET missions_completed = missions_completed + 1,
        points = points + mision_puntos,
        last_completed_at = now()
    WHERE id = NEW.team_id
    RETURNING points INTO puntos_totales;

    -- ==========================================================
    -- 4. ¡LA MAGIA DEL LEVEL UP!
    -- Si el equipo alcanzó o superó la meta de puntos...
    -- ==========================================================
    IF puntos_requeridos IS NOT NULL AND puntos_totales >= puntos_requeridos THEN
      UPDATE public.teams
      SET
        level = level + 1,
        next_level_points = puntos_requeridos + 1500
      WHERE id = NEW.team_id;
    END IF;

    -- 5. Actualizamos el colegio al instante (Para el Ranking General Público)
    --    y sellamos también su última misión completada (desempate del ranking).
    UPDATE public.schools
    SET missions_completed = missions_completed + 1,
        points = points + mision_puntos,
        last_completed_at = now()
    WHERE id = equipo_escuela;

  END IF;
  RETURN NEW;
END;
$function$
;
