-- ============================================================
-- ALERTA MICROSERVICE - ACTUALIZACIÓN DINÁMICA
-- ============================================================

-- 1. Actualizar Regla 1: Equipos con jugadores insuficientes (DINÁMICO)
CREATE OR REPLACE FUNCTION alerta_equipos_incompletos(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  eq RECORD;
BEGIN
  FOR eq IN
    SELECT 
      e.id, 
      e.nombre, 
      pl.limite_jugadores as cupo_maximo,
      COUNT(ij.id) as inscritos
    FROM equipo e
    JOIN inscripcion_equipo ie ON ie.equipo_id = e.id
    JOIN temporada t ON t.id = ie.temporada_id
    JOIN plantel pl ON pl.equipo_id = e.id AND pl.temporada_id = t.id
    LEFT JOIN inscripcion_jugador ij ON ij.plantel_id = pl.id AND ij.estado = 'activo'
    WHERE e.liga_id = p_liga_id 
      AND t.estado = 'activa'
    GROUP BY e.id, e.nombre, pl.limite_jugadores
    HAVING COUNT(ij.id) < pl.limite_jugadores
  LOOP
    -- Solo insertar si no existe una alerta activa para este equipo y este cupo
    IF NOT EXISTS (
      SELECT 1 FROM alerta
      WHERE entidad_id = eq.id
        AND tipo = 'equipo_incompleto'
        AND resuelta = FALSE
    ) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (
        p_liga_id,
        'equipo_incompleto',
        'equipo',
        eq.id,
        'Al equipo "' || eq.nombre || '" le faltan ' || (eq.cupo_maximo - eq.inscritos) || ' jugadores para completar su cupo de ' || eq.cupo_maximo || '.'
      );
    END IF;
  END LOOP;
END;
$$;

-- 2. Nueva Regla: Temporadas en Borrador (Asistencia al Organizador)
CREATE OR REPLACE FUNCTION alerta_temporadas_pendientes(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  temp RECORD;
BEGIN
  FOR temp IN
    SELECT id, nombre
    FROM temporada
    WHERE liga_id = p_liga_id AND estado = 'borrador'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM alerta
      WHERE entidad_id = temp.id
        AND tipo = 'temporada_borrador'
        AND resuelta = FALSE
    ) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (
        p_liga_id,
        'temporada_borrador',
        'liga',
        temp.id,
        'La temporada "' || temp.nombre || '" está en borrador. Completa la configuración para poder iniciar el torneo.'
      );
    END IF;
  END LOOP;
END;
$$;

-- 3. Actualizar la Función Principal para incluir las nuevas reglas dinámicas
CREATE OR REPLACE FUNCTION evaluar_alertas()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  liga_rec RECORD;
BEGIN
  FOR liga_rec IN SELECT id FROM liga LOOP
    -- Reglas de torneos activos
    PERFORM alerta_equipos_incompletos(liga_rec.id);
    PERFORM alerta_pagos_vencidos(liga_rec.id);
    PERFORM alerta_equipos_penalizados(liga_rec.id);
    PERFORM alerta_jugadores_penalizados(liga_rec.id);
    
    -- Reglas de configuración/asistencia
    PERFORM alerta_temporadas_pendientes(liga_rec.id);
  END LOOP;
END;
$$;
