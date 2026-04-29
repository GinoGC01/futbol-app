-- ============================================================
-- RPC: delete_liga_cascade
-- Elimina una liga y todos sus registros asociados de forma segura.
-- Requiere validación de propiedad por parte del organizador.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_liga_cascade(
  p_liga_id UUID,
  p_organizador_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios de creador para bypass RLS si es necesario, pero validamos manualmente
AS $$
BEGIN
  -- 1. Validar propiedad (Seguridad Nivel 1: DB)
  IF NOT EXISTS (
    SELECT 1 FROM liga 
    WHERE id = p_liga_id AND organizador_id = p_organizador_id
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para eliminar esta liga o la liga no existe.'
    USING ERRCODE = '42501'; -- Insufficient Privilege
  END IF;

  -- 2. Eliminar registros en orden inverso de dependencias (de hojas a raíz)
  
  -- Sanciones (dependen de inscripciones y equipos)
  DELETE FROM sancion_jugador 
  WHERE inscripcion_jugador_id IN (
    SELECT ij.id FROM inscripcion_jugador ij
    JOIN plantel p ON p.id = ij.plantel_id
    JOIN temporada t ON t.id = p.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  DELETE FROM sancion_equipo
  WHERE equipo_id IN (SELECT id FROM equipo WHERE liga_id = p_liga_id);

  -- Eventos de partido (goles, tarjetas - aunque tengan CASCADE, eliminamos explícitamente para mayor control)
  DELETE FROM gol
  WHERE partido_id IN (
    SELECT p.id FROM partido p
    JOIN jornada j ON j.id = p.jornada_id
    JOIN fase f ON f.id = j.fase_id
    JOIN temporada t ON t.id = f.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  DELETE FROM tarjeta
  WHERE partido_id IN (
    SELECT p.id FROM partido p
    JOIN jornada j ON j.id = p.jornada_id
    JOIN fase f ON f.id = j.fase_id
    JOIN temporada t ON t.id = f.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  -- Partidos
  DELETE FROM partido
  WHERE jornada_id IN (
    SELECT j.id FROM jornada j
    JOIN fase f ON f.id = j.fase_id
    JOIN temporada t ON t.id = f.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  -- Premios y ganadores
  DELETE FROM ganador_premio
  WHERE premio_id IN (
    SELECT id FROM premio WHERE temporada_id IN (
      SELECT id FROM temporada WHERE liga_id = p_liga_id
    )
  );

  DELETE FROM premio
  WHERE temporada_id IN (SELECT id FROM temporada WHERE liga_id = p_liga_id);

  -- Estructura de competencia (Jornadas, Fases)
  DELETE FROM jornada
  WHERE fase_id IN (
    SELECT f.id FROM fase f
    JOIN temporada t ON t.id = f.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  DELETE FROM fase
  WHERE temporada_id IN (SELECT id FROM temporada WHERE liga_id = p_liga_id);

  -- Planteles e inscripciones
  DELETE FROM inscripcion_jugador
  WHERE plantel_id IN (
    SELECT p.id FROM plantel p
    JOIN temporada t ON t.id = p.temporada_id
    WHERE t.liga_id = p_liga_id
  );

  DELETE FROM plantel
  WHERE temporada_id IN (SELECT id FROM temporada WHERE liga_id = p_liga_id);

  DELETE FROM inscripcion_equipo
  WHERE temporada_id IN (SELECT id FROM temporada WHERE liga_id = p_liga_id);

  -- Temporadas y Equipos
  DELETE FROM temporada WHERE liga_id = p_liga_id;
  DELETE FROM equipo WHERE liga_id = p_liga_id;

  -- Alertas
  DELETE FROM alerta WHERE liga_id = p_liga_id;

  -- Finalmente, la Liga
  DELETE FROM liga WHERE id = p_liga_id;

END;
$$;

COMMENT ON FUNCTION delete_liga_cascade IS 'Elimina una liga en cascada manual validando propiedad del organizador.';
