-- ============================================================
-- D-02: Add 'entre_tiempo' to estado_partido_enum
-- Allows pausing a match at half-time.
-- State machine: en_juego → entre_tiempo → en_juego (resume)
-- ============================================================
ALTER TYPE estado_partido_enum ADD VALUE IF NOT EXISTS 'entre_tiempo' AFTER 'en_juego';

-- Fix CHECK constraint to allow goals during entre_tiempo
ALTER TABLE partido DROP CONSTRAINT IF EXISTS goles_requieren_estado;
ALTER TABLE partido ADD CONSTRAINT goles_requieren_estado CHECK (
  (goles_local IS NULL AND goles_visitante IS NULL)
  OR estado IN ('en_juego', 'entre_tiempo', 'finalizado')
);
