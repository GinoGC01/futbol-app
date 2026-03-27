-- ============================================================
-- PREMIO
-- Definición de premios por temporada o fase.
-- El organizador configura qué premios ofrece (ej. "Bota de Oro").
-- ============================================================
CREATE TABLE premio (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporada_id  UUID NOT NULL REFERENCES temporada(id) ON DELETE CASCADE,
  fase_id       UUID REFERENCES fase(id) ON DELETE SET NULL,
  nombre        TEXT NOT NULL CHECK (length(trim(nombre)) >= 3),
  descripcion   TEXT,
  criterio      criterio_premio_enum NOT NULL,
  categoria     categoria_premio_enum NOT NULL,
  premio_fisico TEXT, -- Ej: "Botines Nike", "Trofeo", "Asado para 15"
  imagen_url    TEXT,
  publicado     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN premio.fase_id IS
  'Si es NULL, el premio es por toda la temporada.
   Si tiene valor, es por una fase específica (ej. Goleador de la Fase Regular).';

CREATE INDEX idx_premio_temporada ON premio(temporada_id);
CREATE INDEX idx_premio_fase ON premio(fase_id);

CREATE TRIGGER premio_updated_at
  BEFORE UPDATE ON premio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
