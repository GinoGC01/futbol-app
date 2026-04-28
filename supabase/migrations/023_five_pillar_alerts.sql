-- ============================================================
-- ALERTA MICROSERVICE - SISTEMA DE 5 PILARES
-- ============================================================

-- PILAR 1: Temporadas inactivas o en borradores
CREATE OR REPLACE FUNCTION alerta_pilar_temporadas(p_liga_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE temp RECORD;
BEGIN
  FOR temp IN SELECT id, nombre FROM temporada WHERE liga_id = p_liga_id AND estado = 'borrador' LOOP
    IF NOT EXISTS (SELECT 1 FROM alerta WHERE entidad_id = temp.id AND tipo = 'temporada_borrador' AND resuelta = FALSE) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (p_liga_id, 'temporada_borrador', 'liga', temp.id, 'La temporada "' || temp.nombre || '" sigue en borrador. Complétala para que los equipos puedan ver el fixture.');
    END IF;
  END LOOP;
END;
$$;

-- PILAR 2: Falta relleno de cupo de jugadores
CREATE OR REPLACE FUNCTION alerta_pilar_cupos(p_liga_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE eq RECORD;
BEGIN
  FOR eq IN
    SELECT e.id, e.nombre, pl.limite_jugadores as max, COUNT(ij.id) as actual
    FROM equipo e
    JOIN inscripcion_equipo ie ON ie.equipo_id = e.id
    JOIN temporada t ON t.id = ie.temporada_id
    JOIN plantel pl ON pl.equipo_id = e.id AND pl.temporada_id = t.id
    LEFT JOIN inscripcion_jugador ij ON ij.plantel_id = pl.id AND ij.estado = 'activo'
    WHERE e.liga_id = p_liga_id AND t.estado = 'activa'
    GROUP BY e.id, e.nombre, pl.limite_jugadores
    HAVING COUNT(ij.id) < pl.limite_jugadores
  LOOP
    IF NOT EXISTS (SELECT 1 FROM alerta WHERE entidad_id = eq.id AND tipo = 'cupo_incompleto' AND resuelta = FALSE) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (p_liga_id, 'cupo_incompleto', 'equipo', eq.id, 'Al equipo "' || eq.nombre || '" le faltan ' || (eq.max - eq.actual) || ' jugadores para llegar a su límite de ' || eq.max || '.');
    END IF;
  END LOOP;
END;
$$;

-- PILAR 3: Penalizaciones de jugadores
CREATE OR REPLACE FUNCTION alerta_pilar_sanciones(p_liga_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE jug RECORD;
BEGIN
  FOR jug IN
    SELECT DISTINCT j.id, j.nombre || ' ' || j.apellido AS nombre_completo, e.nombre as equipo_nombre
    FROM jugador j
    JOIN inscripcion_jugador ij ON ij.jugador_id = j.id
    JOIN plantel p ON p.id = ij.plantel_id
    JOIN equipo e ON e.id = p.equipo_id
    JOIN sancion_jugador sj ON sj.inscripcion_jugador_id = ij.id
    WHERE e.liga_id = p_liga_id AND sj.estado = 'activa'
  LOOP
    IF NOT EXISTS (SELECT 1 FROM alerta WHERE entidad_id = jug.id AND tipo = 'jugador_sancionado' AND resuelta = FALSE) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (p_liga_id, 'jugador_sancionado', 'jugador', jug.id, 'El jugador "' || jug.nombre_completo || '" (' || jug.equipo_nombre || ') tiene una sanción activa y no debería jugar.');
    END IF;
  END LOOP;
END;
$$;

-- PILAR 4: Aviso de proximidad de jornadas (Próximas 48hs)
CREATE OR REPLACE FUNCTION alerta_pilar_jornadas(p_liga_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE jor RECORD;
BEGIN
  FOR jor IN
    SELECT j.id, j.numero, t.nombre as temp_nombre, j.fecha_tentativa
    FROM jornada j
    JOIN fase f ON f.id = j.fase_id
    JOIN temporada t ON t.id = f.temporada_id
    WHERE t.liga_id = p_liga_id 
      AND j.estado = 'programada'
      AND j.fecha_tentativa BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '2 days')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM alerta WHERE entidad_id = jor.id AND tipo = 'jornada_proxima' AND resuelta = FALSE) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (p_liga_id, 'jornada_proxima', 'liga', jor.id, 'La Jornada ' || jor.numero || ' de ' || jor.temp_nombre || ' inicia pronto (' || jor.fecha_tentativa || '). ¡Revisa la logística!');
    END IF;
  END LOOP;
END;
$$;

-- PILAR 5: Estados de pago de los equipos (Vencidos)
CREATE OR REPLACE FUNCTION alerta_pilar_pagos(p_liga_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE eq RECORD;
BEGIN
  FOR eq IN
    SELECT e.id, e.nombre, ie.fecha_vencimiento_pago
    FROM equipo e
    JOIN inscripcion_equipo ie ON ie.equipo_id = e.id
    JOIN temporada t ON t.id = ie.temporada_id
    WHERE e.liga_id = p_liga_id AND t.estado = 'activa' AND ie.estado_pago = 'pendiente' AND ie.fecha_vencimiento_pago < CURRENT_DATE
  LOOP
    IF NOT EXISTS (SELECT 1 FROM alerta WHERE entidad_id = eq.id AND tipo = 'pago_vencido' AND resuelta = FALSE) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (p_liga_id, 'pago_vencido', 'equipo', eq.id, 'Pago vencido: El equipo "' || eq.nombre || '" adeuda su inscripción desde el ' || ie.fecha_vencimiento_pago || '.');
    END IF;
  END LOOP;
END;
$$;

-- FUNCIÓN DE EVALUACIÓN CONSOLIDADA
CREATE OR REPLACE FUNCTION evaluar_alertas()
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE liga_rec RECORD;
BEGIN
  FOR liga_rec IN SELECT id FROM liga LOOP
    PERFORM alerta_pilar_temporadas(liga_rec.id);
    PERFORM alerta_pilar_cupos(liga_rec.id);
    PERFORM alerta_pilar_sanciones(liga_rec.id);
    PERFORM alerta_pilar_jornadas(liga_rec.id);
    PERFORM alerta_pilar_pagos(liga_rec.id);
  END LOOP;
END;
$$;
