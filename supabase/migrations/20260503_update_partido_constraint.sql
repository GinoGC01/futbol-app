-- Parte 2: Actualizar la restricción para permitir el nuevo valor
-- Este comando se ejecuta en una transacción separada para que el valor 'entre_tiempo' ya sea reconocido.
ALTER TABLE partido DROP CONSTRAINT IF EXISTS goles_requieren_estado;

ALTER TABLE partido ADD CONSTRAINT goles_requieren_estado CHECK (
  (goles_local IS NULL AND goles_visitante IS NULL)
  OR estado IN ('en_juego', 'entre_tiempo', 'finalizado')
);
