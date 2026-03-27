-- ============================================================
-- GOL
-- Evento de gol dentro de un partido.
-- Siempre referencia a inscripcion_jugador (no a jugador directamente)
-- para saber en qué equipo y temporada ocurrió.
-- ============================================================
CREATE TABLE gol (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id              UUID NOT NULL REFERENCES partido(id) ON DELETE CASCADE,
  inscripcion_jugador_id  UUID NOT NULL REFERENCES inscripcion_jugador(id) ON DELETE RESTRICT,
  minuto                  INT CHECK (minuto >= 0 AND minuto <= 130),
  es_penal                BOOLEAN NOT NULL DEFAULT FALSE,
  es_contra               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN gol.es_contra IS
  'Si TRUE, el gol se suma a los goles en contra del equipo del jugador,
   no a los goles a favor. Afecta el ranking de goleadores.';

COMMENT ON COLUMN gol.minuto IS
  'Minuto del partido en que ocurrió el gol. Nullable: no siempre se registra.
   Máximo 130 para permitir tiempos extra prolongados.';

CREATE INDEX idx_gol_partido ON gol(partido_id);
CREATE INDEX idx_gol_inscripcion ON gol(inscripcion_jugador_id);
CREATE INDEX idx_gol_penal ON gol(es_penal) WHERE es_penal = TRUE;

-- ============================================================
-- TARJETA
-- Evento disciplinario dentro de un partido.
-- Una tarjeta puede generar automáticamente una sanción
-- (esto se maneja en la capa de aplicación o con un trigger).
-- ============================================================
CREATE TABLE tarjeta (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id              UUID NOT NULL REFERENCES partido(id) ON DELETE CASCADE,
  inscripcion_jugador_id  UUID NOT NULL REFERENCES inscripcion_jugador(id) ON DELETE RESTRICT,
  tipo                    tipo_tarjeta_enum NOT NULL,
  minuto                  INT CHECK (minuto >= 0 AND minuto <= 130),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tarjeta IS
  'Registro de tarjetas durante un partido.
   doble_amarilla implica expulsión y genera sanción automática de 1 fecha.
   roja directa genera sanción mínima de 1 fecha (puede ser mayor).';

CREATE INDEX idx_tarjeta_partido ON tarjeta(partido_id);
CREATE INDEX idx_tarjeta_inscripcion ON tarjeta(inscripcion_jugador_id);
CREATE INDEX idx_tarjeta_tipo ON tarjeta(tipo);

-- ============================================================
-- SANCION_JUGADOR
-- Consecuencia disciplinaria que inhabilita a un jugador
-- por N fechas. Puede originarse en una tarjeta o
-- ser aplicada directamente por el organizador.
-- ============================================================
CREATE TABLE sancion_jugador (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_jugador_id  UUID NOT NULL REFERENCES inscripcion_jugador(id) ON DELETE RESTRICT,
  tarjeta_id              UUID REFERENCES tarjeta(id) ON DELETE SET NULL,
  causa                   TEXT NOT NULL CHECK (length(trim(causa)) >= 3),
  fechas_suspension       INT NOT NULL DEFAULT 1
                          CHECK (fechas_suspension >= 1 AND fechas_suspension <= 52),
  estado                  estado_sancion_enum NOT NULL DEFAULT 'activa',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sancion_jugador.tarjeta_id IS
  'NULL si la sanción fue aplicada directamente (sin tarjeta en partido).
   ON DELETE SET NULL: si se borra la tarjeta, la sanción queda como directa.';

COMMENT ON COLUMN sancion_jugador.fechas_suspension IS
  'Cantidad de partidos que el jugador no puede jugar.
   La aplicación actualiza inscripcion_jugador.estado a "suspendido"
   mientras la sanción esté activa.';

CREATE INDEX idx_sancion_jugador_inscripcion ON sancion_jugador(inscripcion_jugador_id);
CREATE INDEX idx_sancion_jugador_estado ON sancion_jugador(estado);
CREATE INDEX idx_sancion_jugador_tarjeta ON sancion_jugador(tarjeta_id);

CREATE TRIGGER sancion_jugador_updated_at
  BEFORE UPDATE ON sancion_jugador
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SANCION_EQUIPO
-- Consecuencia disciplinaria sobre un equipo.
-- Puede incluir descuento de puntos o multa económica.
-- Puede o no estar asociada a un partido específico.
-- ============================================================
CREATE TABLE sancion_equipo (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id          UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  partido_id         UUID REFERENCES partido(id) ON DELETE SET NULL,
  causa              TEXT NOT NULL CHECK (length(trim(causa)) >= 3),
  puntos_descontados INT NOT NULL DEFAULT 0
                     CHECK (puntos_descontados >= 0 AND puntos_descontados <= 30),
  monto_multa        NUMERIC(10,2) NOT NULL DEFAULT 0
                     CHECK (monto_multa >= 0),
  estado             estado_sancion_enum NOT NULL DEFAULT 'activa',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sancion_equipo.partido_id IS
  'NULL si la sanción no está asociada a un partido específico.
   ON DELETE SET NULL: si se borra el partido, la sanción queda como general.';

COMMENT ON COLUMN sancion_equipo.puntos_descontados IS
  'Se descuenta del total de puntos del equipo en la tabla de posiciones.
   Las vistas de estadísticas lo tienen en cuenta.';

CREATE INDEX idx_sancion_equipo_equipo ON sancion_equipo(equipo_id);
CREATE INDEX idx_sancion_equipo_partido ON sancion_equipo(partido_id);
CREATE INDEX idx_sancion_equipo_estado ON sancion_equipo(estado);

CREATE TRIGGER sancion_equipo_updated_at
  BEFORE UPDATE ON sancion_equipo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
