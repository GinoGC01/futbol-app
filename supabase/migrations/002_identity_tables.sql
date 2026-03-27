-- ============================================================
-- ORGANIZADOR
-- Usuario administrador del sistema. Se vincula con auth.users
-- de Supabase Auth para el manejo de sesiones.
-- ============================================================
CREATE TABLE organizador (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre     TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  email      TEXT NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  telefono   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN organizador.auth_id IS
  'Referencia al usuario de Supabase Auth. Nullable para permitir
   crear organizadores antes de que confirmen su email.';

-- ============================================================
-- FORMATO_COMPETENCIA
-- Plantilla reutilizable que describe el tipo de competencia.
-- No es por temporada: es un catálogo global (liga, copa, mixto).
-- ============================================================
CREATE TABLE formato_competencia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  tipo        tipo_formato_enum NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE formato_competencia IS
  'Catálogo de formatos reutilizables: Liga (todos vs todos),
   Copa (eliminación directa), Mixto (grupos + eliminatoria).';

-- ============================================================
-- JUGADOR
-- Identidad permanente de un jugador, independiente de cualquier
-- equipo o temporada. El DNI es informativo y opcional.
-- La unicidad real se maneja con un índice compuesto blando
-- sobre (nombre, apellido, fecha_nacimiento) — ver más abajo.
-- ============================================================
CREATE TABLE jugador (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  apellido         TEXT NOT NULL CHECK (length(trim(apellido)) >= 2),
  fecha_nacimiento DATE,    -- opcional
  dni              TEXT,    -- opcional, sin UNIQUE, solo referencial
  foto_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN jugador.dni IS
  'Documento de identidad. Opcional y sin restricción UNIQUE.
   La detección de duplicados se hace por índice compuesto
   (nombre, apellido, fecha_nacimiento) desde la capa de aplicación.';

-- Índice para detección de duplicados con fecha de nacimiento conocida
CREATE INDEX idx_jugador_duplicado_completo
  ON jugador (lower(nombre), lower(apellido), fecha_nacimiento)
  WHERE fecha_nacimiento IS NOT NULL;

-- Índice para búsqueda por nombre cuando no hay fecha de nacimiento
CREATE INDEX idx_jugador_nombre_apellido
  ON jugador (lower(nombre), lower(apellido));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizador_updated_at
  BEFORE UPDATE ON organizador
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER jugador_updated_at
  BEFORE UPDATE ON jugador
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
