-- ============================================================
-- FASE
-- Subdivisión de una temporada. Permite formatos mixtos:
-- una temporada tipo 'mixto' tendrá una fase de grupos (orden 1)
-- seguida de una fase eliminatoria (orden 2).
-- ============================================================
CREATE TABLE fase (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temporada_id      UUID NOT NULL REFERENCES temporada(id) ON DELETE CASCADE,
  nombre            TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  tipo              tipo_fase_enum NOT NULL,
  orden             INT NOT NULL CHECK (orden >= 1),
  puntos_victoria   INT NOT NULL DEFAULT 3 CHECK (puntos_victoria >= 0),
  puntos_empate     INT NOT NULL DEFAULT 1 CHECK (puntos_empate >= 0),
  puntos_derrota    INT NOT NULL DEFAULT 0 CHECK (puntos_derrota >= 0),
  ida_y_vuelta      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No puede haber dos fases con el mismo orden dentro de una temporada
  CONSTRAINT fase_orden_unico UNIQUE (temporada_id, orden)
);

COMMENT ON TABLE fase IS
  'Para formato "liga": una sola fase tipo todos_contra_todos.
   Para formato "copa": una sola fase tipo eliminacion_directa.
   Para formato "mixto": múltiples fases en orden (grupos + eliminatoria).';

COMMENT ON COLUMN fase.puntos_victoria IS
  'Configurable: algunas ligas amateur usan 2 puntos por victoria.';

COMMENT ON COLUMN fase.ida_y_vuelta IS
  'Si es TRUE, cada par de equipos juega dos partidos (local e invitado).';

CREATE INDEX idx_fase_temporada ON fase(temporada_id);
CREATE INDEX idx_fase_orden ON fase(temporada_id, orden);

-- ============================================================
-- JORNADA
-- Agrupa partidos de una misma fecha dentro de una fase.
-- Permite reagendar una fecha completa sin tocar cada partido.
-- ============================================================
CREATE TABLE jornada (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id         UUID NOT NULL REFERENCES fase(id) ON DELETE CASCADE,
  numero          INT NOT NULL CHECK (numero >= 1),
  fecha_tentativa DATE,
  estado          estado_jornada_enum NOT NULL DEFAULT 'programada',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No puede haber dos jornadas con el mismo número dentro de una fase
  CONSTRAINT jornada_numero_unico UNIQUE (fase_id, numero)
);

CREATE INDEX idx_jornada_fase ON jornada(fase_id);
CREATE INDEX idx_jornada_estado ON jornada(estado);

-- ============================================================
-- EQUIPO
-- Pertenece a una liga. Participa en temporadas a través de
-- la tabla inscripcion_equipo (no directamente aquí).
-- ============================================================
CREATE TABLE equipo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liga_id         UUID NOT NULL REFERENCES liga(id) ON DELETE RESTRICT,
  nombre          TEXT NOT NULL CHECK (length(trim(nombre)) >= 2),
  escudo_url      TEXT,
  color_principal TEXT CHECK (
    color_principal IS NULL OR color_principal ~ '^#[0-9A-Fa-f]{6}$'
  ),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN equipo.color_principal IS
  'Color en formato hexadecimal (#RRGGBB). Opcional.
   Usado para mostrar el color del equipo en la interfaz.';

CREATE INDEX idx_equipo_liga ON equipo(liga_id);

CREATE TRIGGER equipo_updated_at
  BEFORE UPDATE ON equipo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PARTIDO
-- Evento central del sistema. Se obtiene la fase y temporada
-- navegando: partido → jornada → fase → temporada.
-- Los equipos se referencian dos veces (local y visitante).
-- ============================================================
CREATE TABLE partido (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jornada_id          UUID NOT NULL REFERENCES jornada(id) ON DELETE RESTRICT,
  equipo_local_id     UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  equipo_visitante_id UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  goles_local         INT CHECK (goles_local >= 0),
  goles_visitante     INT CHECK (goles_visitante >= 0),
  fecha_hora          TIMESTAMPTZ,
  cancha              TEXT CHECK (length(trim(cancha)) >= 2 OR cancha IS NULL),
  estado              estado_partido_enum NOT NULL DEFAULT 'programado',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un equipo no puede jugar contra sí mismo
  CONSTRAINT equipos_distintos
    CHECK (equipo_local_id <> equipo_visitante_id),

  -- Los goles solo tienen sentido si el partido está finalizado o en juego
  CONSTRAINT goles_requieren_estado
    CHECK (
      (goles_local IS NULL AND goles_visitante IS NULL)
      OR estado IN ('en_juego', 'finalizado')
    ),

  -- Si hay goles_local, debe haber goles_visitante y viceversa
  CONSTRAINT goles_ambos_o_ninguno
    CHECK (
      (goles_local IS NULL) = (goles_visitante IS NULL)
    )
);

COMMENT ON COLUMN partido.goles_local IS
  'NULL mientras el partido no haya comenzado.
   Se completa cuando estado pasa a en_juego o finalizado.';

CREATE INDEX idx_partido_jornada ON partido(jornada_id);
CREATE INDEX idx_partido_estado ON partido(estado);
CREATE INDEX idx_partido_equipo_local ON partido(equipo_local_id);
CREATE INDEX idx_partido_equipo_visitante ON partido(equipo_visitante_id);

CREATE TRIGGER partido_updated_at
  BEFORE UPDATE ON partido
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
