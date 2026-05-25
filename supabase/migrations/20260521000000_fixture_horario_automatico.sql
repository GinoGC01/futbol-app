-- ============================================================
-- PARCHE CRÍTICO: Gestión automática de horarios y estados
-- ============================================================

-- 1. Agregar 'vencida' al enum estado_jornada_enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'estado_jornada_enum' AND e.enumlabel = 'vencida') THEN
        ALTER TYPE estado_jornada_enum ADD VALUE 'vencida';
    END IF;
END
$$;

-- 2. Modificar fecha_tentativa de DATE a TIMESTAMPTZ
ALTER TABLE jornada
  ALTER COLUMN fecha_tentativa TYPE TIMESTAMPTZ
    USING fecha_tentativa::TIMESTAMPTZ;

-- A partir de ahora el campo es obligatorio
ALTER TABLE jornada
  ALTER COLUMN fecha_tentativa SET NOT NULL;

COMMENT ON COLUMN jornada.fecha_tentativa IS 'Fecha y hora de la jornada (incluye horario). Obligatorio desde el parche de horarios.';

-- 3. Agregar columnas de configuración del motor de fixture a la tabla fase
ALTER TABLE fase
  ADD COLUMN IF NOT EXISTS duracion_tiempo INT NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS duracion_entretiempo INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS tiempo_entre_partidos INT NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS hora_inicio TIME NOT NULL DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS hora_fin TIME NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS canchas_disponibles INT NOT NULL DEFAULT 1;

COMMENT ON COLUMN fase.duracion_tiempo IS 'Duración de cada tiempo en minutos';
COMMENT ON COLUMN fase.duracion_entretiempo IS 'Duración del entretiempo en minutos';
COMMENT ON COLUMN fase.tiempo_entre_partidos IS 'Tiempo entre partidos en minutos';
COMMENT ON COLUMN fase.hora_inicio IS 'Hora de inicio del bloque de juego';
COMMENT ON COLUMN fase.hora_fin IS 'Hora de fin del bloque de juego';
COMMENT ON COLUMN fase.canchas_disponibles IS 'Cantidad de canchas disponibles simultáneamente';

-- 4. Agregar soporte multi-día a la tabla fase
ALTER TABLE fase
  ADD COLUMN IF NOT EXISTS dias_juego INT[] NOT NULL DEFAULT '{1,3,5}';

COMMENT ON COLUMN fase.dias_juego IS 'Días de la semana habilitados para jugar (0=Domingo, 1=Lunes, ..., 6=Sábado). Los partidos se distribuyen entre estos días según disponibilidad.';

-- 5. Actualizar el comment de estado de jornada
COMMENT ON COLUMN jornada.estado IS 'programada, jugada, postergada, cerrada, vencida. "vencida" se asigna automáticamente cuando la fecha pasó y no se marcó como jugada/cerrada.';
