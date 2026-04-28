-- ============================================================
-- ALERTA MICROSERVICE
-- ============================================================

-- 1. Crear la tabla de alertas
CREATE TABLE IF NOT EXISTS alerta (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id      UUID NOT NULL REFERENCES liga(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,
  entidad_tipo TEXT NOT NULL, -- 'equipo' | 'jugador' | 'liga'
  entidad_id   UUID NOT NULL,
  mensaje      TEXT NOT NULL,
  resuelta     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerta_liga_resuelta ON alerta(liga_id, resuelta);
CREATE INDEX idx_alerta_entidad ON alerta(entidad_id);

-- 2. Ajustes al schema existente
-- Agregamos mínimo de jugadores a la liga
ALTER TABLE liga ADD COLUMN IF NOT EXISTS minimo_jugadores INT NOT NULL DEFAULT 11;

-- Agregamos fecha de vencimiento a la inscripción del equipo
ALTER TABLE inscripcion_equipo ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago DATE;

-- ============================================================
-- REGLA 1: Equipos con jugadores insuficientes
-- ============================================================
CREATE OR REPLACE FUNCTION alerta_equipos_incompletos(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  eq RECORD;
  minimo INT;
BEGIN
  SELECT minimo_jugadores INTO minimo FROM liga WHERE id = p_liga_id;

  FOR eq IN
    SELECT e.id, e.nombre
    FROM equipo e
    JOIN inscripcion_equipo ie ON ie.equipo_id = e.id
    JOIN temporada t ON t.id = ie.temporada_id
    LEFT JOIN plantel p ON p.equipo_id = e.id AND p.temporada_id = t.id
    LEFT JOIN inscripcion_jugador ij ON ij.plantel_id = p.id AND ij.estado = 'activo'
    WHERE e.liga_id = p_liga_id 
      AND t.estado = 'activa'
    GROUP BY e.id, e.nombre
    HAVING COUNT(ij.id) < minimo
  LOOP
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
        'El equipo "' || eq.nombre || '" no alcanza el mínimo de ' || minimo || ' jugadores activos requerido.'
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- REGLA 2: Pagos vencidos
-- ============================================================
CREATE OR REPLACE FUNCTION alerta_pagos_vencidos(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  eq RECORD;
BEGIN
  FOR eq IN
    SELECT e.id, e.nombre, ie.fecha_vencimiento_pago
    FROM equipo e
    JOIN inscripcion_equipo ie ON ie.equipo_id = e.id
    JOIN temporada t ON t.id = ie.temporada_id
    WHERE e.liga_id = p_liga_id
      AND t.estado = 'activa'
      AND ie.estado_pago = 'pendiente'
      AND ie.fecha_vencimiento_pago IS NOT NULL
      AND ie.fecha_vencimiento_pago < CURRENT_DATE
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM alerta
      WHERE entidad_id = eq.id
        AND tipo = 'pago_vencido'
        AND resuelta = FALSE
    ) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (
        p_liga_id,
        'pago_vencido',
        'equipo',
        eq.id,
        'El equipo "' || eq.nombre || '" tiene el pago de inscripción vencido desde el ' || eq.fecha_vencimiento_pago || '.'
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- REGLA 3: Equipos penalizados
-- ============================================================
CREATE OR REPLACE FUNCTION alerta_equipos_penalizados(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  eq RECORD;
BEGIN
  FOR eq IN
    SELECT DISTINCT e.id, e.nombre
    FROM equipo e
    JOIN sancion_equipo se ON se.equipo_id = e.id
    WHERE e.liga_id = p_liga_id
      AND se.estado = 'activa'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM alerta
      WHERE entidad_id = eq.id
        AND tipo = 'equipo_penalizado'
        AND resuelta = FALSE
    ) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (
        p_liga_id,
        'equipo_penalizado',
        'equipo',
        eq.id,
        'El equipo "' || eq.nombre || '" tiene una penalización activa.'
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- REGLA 4: Jugadores penalizados
-- ============================================================
CREATE OR REPLACE FUNCTION alerta_jugadores_penalizados(p_liga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  jug RECORD;
BEGIN
  FOR jug IN
    SELECT DISTINCT j.id, j.nombre || ' ' || j.apellido AS nombre_completo
    FROM jugador j
    JOIN inscripcion_jugador ij ON ij.jugador_id = j.id
    JOIN plantel p ON p.id = ij.plantel_id
    JOIN equipo e ON e.id = p.equipo_id
    JOIN sancion_jugador sj ON sj.inscripcion_jugador_id = ij.id
    WHERE e.liga_id = p_liga_id
      AND sj.estado = 'activa'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM alerta
      WHERE entidad_id = jug.id
        AND tipo = 'jugador_penalizado'
        AND resuelta = FALSE
    ) THEN
      INSERT INTO alerta(liga_id, tipo, entidad_tipo, entidad_id, mensaje)
      VALUES (
        p_liga_id,
        'jugador_penalizado',
        'jugador',
        jug.id,
        'El jugador "' || jug.nombre_completo || '" tiene una penalización activa.'
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- FUNCIÓN PRINCIPAL DE EVALUACIÓN
-- ============================================================
CREATE OR REPLACE FUNCTION evaluar_alertas()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  liga_rec RECORD;
BEGIN
  -- Evaluamos solo ligas que tienen al menos una temporada activa
  FOR liga_rec IN
    SELECT DISTINCT l.id
    FROM liga l
    JOIN temporada t ON t.liga_id = l.id
    WHERE t.estado = 'activa'
  LOOP
    PERFORM alerta_equipos_incompletos(liga_rec.id);
    PERFORM alerta_pagos_vencidos(liga_rec.id);
    PERFORM alerta_equipos_penalizados(liga_rec.id);
    PERFORM alerta_jugadores_penalizados(liga_rec.id);
  END LOOP;
END;
$$;

-- ============================================================
-- CONFIGURACIÓN PG_CRON
-- ============================================================
-- Aseguramos que la extensión esté habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Eliminamos el job si ya existe para evitar duplicados en re-migración
SELECT cron.unschedule('evaluar-alertas-diario') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'evaluar-alertas-diario');

SELECT cron.schedule(
  'evaluar-alertas-diario',
  '0 3 * * *',  -- 3:00 AM UTC
  $$SELECT evaluar_alertas()$$
);

