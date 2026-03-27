-- ============================================================
-- LIGA
-- Tenant principal del sistema. Cada organizador puede tener
-- múltiples ligas. El slug genera la URL pública única.
-- ============================================================
CREATE TABLE liga (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizador_id UUID NOT NULL REFERENCES organizador(id) ON DELETE RESTRICT,
  nombre         TEXT NOT NULL CHECK (length(trim(nombre)) >= 3),
  slug           TEXT NOT NULL UNIQUE
                 CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  descripcion    TEXT,
  tipo_futbol    tipo_futbol_enum NOT NULL,
  logo_url       TEXT,
  zona           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN liga.slug IS
  'Identificador URL único. Solo minúsculas, números y guiones.
   Ejemplo: liga-norte-palermo → tuapp.com/liga/liga-norte-palermo';

COMMENT ON COLUMN liga.tipo_futbol IS
  'Define la modalidad de la liga. No cambia por temporada.
   Valores: f5, f6, f7, f9, f11';

COMMENT ON COLUMN liga.organizador_id IS
  'ON DELETE RESTRICT: no se puede eliminar un organizador
   que tenga ligas activas. Primero eliminar o transferir las ligas.';

CREATE INDEX idx_liga_organizador ON liga(organizador_id);
CREATE INDEX idx_liga_slug ON liga(slug);

CREATE TRIGGER liga_updated_at
  BEFORE UPDATE ON liga
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TEMPORADA
-- Ciclo de competencia dentro de una liga.
-- Usa un formato_competencia para definir sus reglas generales.
-- Las reglas específicas se definen en las FASES.
-- ============================================================
CREATE TABLE temporada (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id     UUID NOT NULL REFERENCES liga(id) ON DELETE RESTRICT,
  formato_id  UUID NOT NULL REFERENCES formato_competencia(id) ON DELETE RESTRICT,
  nombre      TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  fecha_inicio DATE,
  fecha_fin    DATE,
  estado      estado_temporada_enum NOT NULL DEFAULT 'borrador',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validación: si ambas fechas están presentes, inicio <= fin
  CONSTRAINT fechas_validas CHECK (
    fecha_inicio IS NULL OR fecha_fin IS NULL OR fecha_inicio <= fecha_fin
  )
);

COMMENT ON COLUMN temporada.estado IS
  'borrador: en configuración, no visible al público.
   activa: en curso, visible y editable por el admin.
   finalizada: cerrada, datos de solo lectura.';

COMMENT ON COLUMN temporada.formato_id IS
  'ON DELETE RESTRICT: no se puede eliminar un formato que tenga
   temporadas asociadas.';

CREATE INDEX idx_temporada_liga ON temporada(liga_id);
CREATE INDEX idx_temporada_estado ON temporada(estado);

CREATE TRIGGER temporada_updated_at
  BEFORE UPDATE ON temporada
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
