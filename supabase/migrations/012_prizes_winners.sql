-- ============================================================
-- GANADOR_PREMIO
-- Registro de quién ganó cada premio, con datos del logro
-- y notas de desempate.
-- ============================================================
CREATE TABLE ganador_premio (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  premio_id      UUID NOT NULL REFERENCES premio(id) ON DELETE CASCADE,
  equipo_id      UUID REFERENCES equipo(id) ON DELETE CASCADE,
  jugador_id     UUID REFERENCES jugador(id) ON DELETE CASCADE,

  -- Datos del logro
  valor_record   TEXT, -- Ej: "10 goles (0 penales)", "Promedio 0.5 gc/p"
  nota_desempate TEXT, -- Ej: "Ganador por sorteo ante empate técnico con Jugador X"

  -- Manejo de la entrega
  compartido     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validación: Debe haber un ganador (equipo o jugador)
  CONSTRAINT tiene_ganador CHECK (
    (equipo_id IS NOT NULL) OR (jugador_id IS NOT NULL)
  )
);

CREATE INDEX idx_ganador_premio_id ON ganador_premio(premio_id);
CREATE INDEX idx_ganador_equipo ON ganador_premio(equipo_id);
CREATE INDEX idx_ganador_jugador ON ganador_premio(jugador_id);
