-- ============================================================
-- ENUMS DE PREMIOS
-- ============================================================

-- Criterios para la adjudicación
CREATE TYPE criterio_premio_enum AS ENUM (
  'goleador',            -- Basado en goles a favor
  'valla_invicta',       -- Arquero con más arcos en cero
  'valla_menos_vencida', -- Equipo con menos goles recibidos
  'asistencia',          -- Máximo asistente (opcional)
  'posicion_tabla',      -- Campeón, Subcampeón, 3ro
  'fair_play',           -- Basado en tarjetas
  'personalizado'        -- Elección manual (MVP, Revelación, etc.)
);

-- Destinatario del premio
CREATE TYPE categoria_premio_enum AS ENUM (
  'jugador', 
  'equipo'
);
