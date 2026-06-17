CREATE OR REPLACE FUNCTION actualizar_estadisticas_mision()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;