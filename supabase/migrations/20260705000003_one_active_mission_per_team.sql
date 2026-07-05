-- Regla de juego: un equipo solo puede tener UNA misión activa (in_progress)
-- a la vez. El estado de misión es compartido por todo el equipo (la tabla usa
-- team_id, no student_id), así que cualquier integrante puede empezarla y otro
-- integrante del mismo equipo puede completarla.
--
-- Este índice único parcial es el respaldo a nivel de BD contra carreras: si dos
-- alumnos del mismo equipo pulsan "Empezar misión" en misiones distintas casi al
-- mismo tiempo, el segundo INSERT/UPDATE a in_progress viola el índice y falla,
-- garantizando que nunca haya dos misiones activas simultáneas.
--
-- Nota: al enviar la evidencia (status pasa a review) o completarse, la fila deja
-- de ser in_progress y el equipo queda libre para empezar otra misión.

create unique index if not exists "mission_progression_one_active_per_team"
  on "public"."mission_progression" ("team_id")
  where (status = 'in_progress');
