-- ============================================================
-- INSCRIPCION_EQUIPO
-- Relación entre un equipo y una temporada específica.
-- Registra el estado de pago y los montos.
-- Un equipo puede participar en múltiples temporadas de su liga.
-- ============================================================
CREATE TABLE inscripcion_equipo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id        UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  temporada_id     UUID NOT NULL REFERENCES temporada(id) ON DELETE RESTRICT,
  estado_pago      estado_pago_enum NOT NULL DEFAULT 'pendiente',
  monto_total      NUMERIC(10,2) NOT NULL DEFAULT 0
                   CHECK (monto_total >= 0),
  monto_abonado    NUMERIC(10,2) NOT NULL DEFAULT 0
                   CHECK (monto_abonado >= 0),
  fecha_inscripcion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un equipo solo puede inscribirse una vez por temporada
  CONSTRAINT inscripcion_equipo_unica UNIQUE (equipo_id, temporada_id),

  -- No puede haber abonado más de lo que debe
  CONSTRAINT monto_abonado_valido
    CHECK (monto_abonado <= monto_total)
);

COMMENT ON TABLE inscripcion_equipo IS
  'Registra la participación de un equipo en una temporada y su estado de pago.
   El equipo pertenece a la liga, pero participa en temporadas específicas.';

CREATE INDEX idx_insc_equipo_equipo ON inscripcion_equipo(equipo_id);
CREATE INDEX idx_insc_equipo_temporada ON inscripcion_equipo(temporada_id);
CREATE INDEX idx_insc_equipo_pago ON inscripcion_equipo(estado_pago);

CREATE TRIGGER inscripcion_equipo_updated_at
  BEFORE UPDATE ON inscripcion_equipo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PLANTEL
-- Lista de jugadores de un equipo para una temporada específica.
-- El mismo equipo tiene un plantel DIFERENTE por temporada.
-- Esto permite que jugadores cambien de equipo entre temporadas.
-- ============================================================
CREATE TABLE plantel (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id         UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  temporada_id      UUID NOT NULL REFERENCES temporada(id) ON DELETE RESTRICT,
  limite_jugadores  INT NOT NULL DEFAULT 20
                    CHECK (limite_jugadores >= 5 AND limite_jugadores <= 50),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un equipo solo puede tener un plantel por temporada
  CONSTRAINT plantel_unico UNIQUE (equipo_id, temporada_id)
);

COMMENT ON TABLE plantel IS
  'Contenedor de jugadores de un equipo por temporada.
   Permite que un jugador esté en distintos equipos en distintas temporadas
   manteniendo su historial completo en la tabla jugador.';

CREATE INDEX idx_plantel_equipo ON plantel(equipo_id);
CREATE INDEX idx_plantel_temporada ON plantel(temporada_id);

-- ============================================================
-- INSCRIPCION_JUGADOR
-- Relación entre un jugador y un plantel específico.
-- Es el punto donde el jugador "existe" en una temporada.
-- Goles, tarjetas y sanciones apuntan a esta tabla, no a jugador.
-- ============================================================
CREATE TABLE inscripcion_jugador (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id UUID NOT NULL REFERENCES jugador(id) ON DELETE RESTRICT,
  plantel_id UUID NOT NULL REFERENCES plantel(id) ON DELETE RESTRICT,
  dorsal     INT CHECK (dorsal >= 0 AND dorsal <= 99),
  posicion   posicion_enum,    -- opcional: no todos los admins lo cargan
  estado     estado_inscripcion_jugador_enum NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un jugador solo puede estar una vez en cada plantel
  CONSTRAINT jugador_plantel_unico UNIQUE (jugador_id, plantel_id)
);

COMMENT ON TABLE inscripcion_jugador IS
  'Instancia de un jugador en un plantel de una temporada.
   Los goles y tarjetas referencian inscripcion_jugador (no jugador)
   para mantener el contexto de en qué equipo y temporada ocurrió.';

COMMENT ON COLUMN inscripcion_jugador.estado IS
  'activo: puede jugar.
   suspendido: cumpliendo sancion, no puede jugar.
   inactivo: dado de baja del plantel, no puede jugar.';

CREATE INDEX idx_insc_jugador_jugador ON inscripcion_jugador(jugador_id);
CREATE INDEX idx_insc_jugador_plantel ON inscripcion_jugador(plantel_id);
CREATE INDEX idx_insc_jugador_estado ON inscripcion_jugador(estado);

CREATE TRIGGER inscripcion_jugador_updated_at
  BEFORE UPDATE ON inscripcion_jugador
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
