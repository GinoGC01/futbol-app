-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- Declarar todos los tipos antes que las tablas que los usan.
-- ============================================================

-- Tipo de fútbol de la liga
CREATE TYPE tipo_futbol_enum AS ENUM (
  'f5', 'f6', 'f7', 'f9', 'f11'
);

-- Tipo de formato de competencia (plantilla reutilizable)
CREATE TYPE tipo_formato_enum AS ENUM (
  'liga',   -- todos contra todos, con puntos
  'copa',   -- eliminación directa
  'mixto'   -- grupos + eliminatoria
);

-- Tipo de fase dentro de una temporada
CREATE TYPE tipo_fase_enum AS ENUM (
  'todos_contra_todos',
  'eliminacion_directa'
);

-- Estado del ciclo de vida de una temporada
CREATE TYPE estado_temporada_enum AS ENUM (
  'borrador',    -- en configuración, no visible al público
  'activa',      -- en curso
  'finalizada'   -- cerrada, solo lectura
);

-- Estado de una jornada
CREATE TYPE estado_jornada_enum AS ENUM (
  'programada',
  'jugada',
  'postergada'
);

-- Estado de un partido
CREATE TYPE estado_partido_enum AS ENUM (
  'programado',
  'en_juego',
  'finalizado',
  'postergado',
  'suspendido'
);

-- Posición de un jugador en el plantel
CREATE TYPE posicion_enum AS ENUM (
  'arquero',
  'defensor',
  'mediocampista',
  'delantero'
);

-- Estado de un jugador en su inscripción al plantel
CREATE TYPE estado_inscripcion_jugador_enum AS ENUM (
  'activo',
  'suspendido',
  'inactivo'
);

-- Tipo de tarjeta en un partido
CREATE TYPE tipo_tarjeta_enum AS ENUM (
  'amarilla',
  'roja',
  'doble_amarilla'
);

-- Estado de una sanción (jugador o equipo)
CREATE TYPE estado_sancion_enum AS ENUM (
  'activa',
  'cumplida',
  'apelada'
);

-- Estado de pago de la inscripción de un equipo a una temporada
CREATE TYPE estado_pago_enum AS ENUM (
  'pendiente',
  'parcial',
  'pagado'
);
