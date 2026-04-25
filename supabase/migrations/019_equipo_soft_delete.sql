-- Borrado lógico para equipos
ALTER TABLE equipo ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX idx_equipo_activo ON equipo(activo) WHERE activo = TRUE;

COMMENT ON COLUMN equipo.activo IS 'Si es FALSE, el equipo se considera eliminado (soft delete).';
