-- Agregar el valor 'cerrada' al enum estado_jornada_enum
-- En PostgreSQL no se puede hacer dentro de una transacción o IF NOT EXISTS fácilmente
-- Así que usamos este bloque anónimo de PL/pgSQL para verificar si ya existe.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'estado_jornada_enum' AND e.enumlabel = 'cerrada') THEN
        ALTER TYPE estado_jornada_enum ADD VALUE 'cerrada';
    END IF;
END
$$;

COMMENT ON COLUMN jornada.estado IS 'programada, jugada, postergada, cerrada. Una jornada cerrada bloquea todos sus partidos.';
