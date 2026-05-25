-- ============================================================
-- Agrega columna tiempo_adicionado a partido
-- Permite registrar tiempo adicional (descuento / añadido)
-- en partidos en vivo. Almacenado en segundos.
-- ============================================================
ALTER TABLE partido ADD COLUMN IF NOT EXISTS tiempo_adicionado INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN partido.tiempo_adicionado IS
  'Tiempo adicional / de descuento en segundos.
   Se acumula durante un partido en vivo para indicar
   los minutos añadidos por el árbitro.';
