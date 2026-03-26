CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- LIGAS (tenant raíz del sistema)
-- =============================================
CREATE TABLE ligas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL CHECK (length(nombre) >= 3),
  slug       TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  zona       TEXT,
  logo_url   TEXT,
  plan       TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ADMIN USERS (vincula auth.users con ligas)
-- =============================================
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  liga_id    UUID NOT NULL REFERENCES ligas(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- EQUIPOS
-- =============================================
CREATE TABLE equipos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id         UUID NOT NULL REFERENCES ligas(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL CHECK (length(nombre) >= 2),
  escudo_url      TEXT,
  color_principal TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- JUGADORES
-- =============================================
CREATE TABLE jugadores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id  UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL CHECK (length(nombre) >= 2),
  dorsal     INT CHECK (dorsal >= 1 AND dorsal <= 99),
  posicion   TEXT CHECK (posicion IN ('arquero','defensor','mediocampista','delantero')),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TEMPORADAS
-- =============================================
CREATE TABLE temporadas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id    UUID NOT NULL REFERENCES ligas(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  inicio     DATE,
  fin        DATE,
  activa     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PARTIDOS
-- ENMIENDA 1: columna "jornada" para agrupar por fecha deportiva
-- =============================================
CREATE TABLE partidos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporada_id     UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
  jornada          INT CHECK (jornada >= 1 AND jornada <= 99),
  equipo_local     UUID NOT NULL REFERENCES equipos(id),
  equipo_visitante UUID NOT NULL REFERENCES equipos(id),
  goles_local      INT CHECK (goles_local >= 0),
  goles_visitante  INT CHECK (goles_visitante >= 0),
  fecha            TIMESTAMPTZ,
  cancha           TEXT,
  estado           TEXT NOT NULL DEFAULT 'programado'
                   CHECK (estado IN (
                     'programado',
                     'en_juego',
                     'finalizado',
                     'finalizado_parcial',
                     'postergado',
                     'suspendido'
                   )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT equipos_distintos CHECK (equipo_local <> equipo_visitante)
);

-- =============================================
-- GOLES
-- =============================================
CREATE TABLE goles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id),
  minuto     INT CHECK (minuto >= 0 AND minuto <= 120),
  es_penal   BOOLEAN NOT NULL DEFAULT FALSE,
  es_contra  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TARJETAS
-- =============================================
CREATE TABLE tarjetas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id),
  tipo       TEXT NOT NULL CHECK (tipo IN ('amarilla','roja','doble_amarilla')),
  minuto     INT CHECK (minuto >= 0 AND minuto <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_equipos_liga ON equipos(liga_id);
CREATE INDEX idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX idx_temporadas_liga ON temporadas(liga_id);
CREATE INDEX idx_partidos_temporada ON partidos(temporada_id);
CREATE INDEX idx_partidos_estado ON partidos(estado);
CREATE INDEX idx_partidos_jornada ON partidos(temporada_id, jornada);
CREATE INDEX idx_goles_partido ON goles(partido_id);
CREATE INDEX idx_goles_jugador ON goles(jugador_id);
CREATE INDEX idx_tarjetas_partido ON tarjetas(partido_id);
CREATE INDEX idx_admin_liga ON admin_users(liga_id);

-- =============================================
-- TRIGGER: actualizar updated_at automáticamente
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ligas_updated_at
  BEFORE UPDATE ON ligas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER partidos_updated_at
  BEFORE UPDATE ON partidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
