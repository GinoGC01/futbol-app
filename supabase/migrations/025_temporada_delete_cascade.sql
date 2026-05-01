-- ============================================================
-- MIGRATION: Temporada Delete Cascade
-- Cambia las restricciones de clave foránea (ON DELETE RESTRICT a ON DELETE CASCADE)
-- para permitir la eliminación segura y automática de una temporada y todos sus datos.
-- ============================================================

-- 1. PARTIDO
ALTER TABLE partido DROP CONSTRAINT IF EXISTS partido_jornada_id_fkey;
ALTER TABLE partido ADD CONSTRAINT partido_jornada_id_fkey 
  FOREIGN KEY (jornada_id) REFERENCES jornada(id) ON DELETE CASCADE;

-- 2. INSCRIPCION EQUIPO
ALTER TABLE inscripcion_equipo DROP CONSTRAINT IF EXISTS inscripcion_equipo_temporada_id_fkey;
ALTER TABLE inscripcion_equipo ADD CONSTRAINT inscripcion_equipo_temporada_id_fkey 
  FOREIGN KEY (temporada_id) REFERENCES temporada(id) ON DELETE CASCADE;

-- 3. PLANTEL
ALTER TABLE plantel DROP CONSTRAINT IF EXISTS plantel_temporada_id_fkey;
ALTER TABLE plantel ADD CONSTRAINT plantel_temporada_id_fkey 
  FOREIGN KEY (temporada_id) REFERENCES temporada(id) ON DELETE CASCADE;

-- 4. INSCRIPCION JUGADOR
ALTER TABLE inscripcion_jugador DROP CONSTRAINT IF EXISTS inscripcion_jugador_plantel_id_fkey;
ALTER TABLE inscripcion_jugador ADD CONSTRAINT inscripcion_jugador_plantel_id_fkey 
  FOREIGN KEY (plantel_id) REFERENCES plantel(id) ON DELETE CASCADE;

-- 5. GOL (Dependencia de inscripcion_jugador)
ALTER TABLE gol DROP CONSTRAINT IF EXISTS gol_inscripcion_jugador_id_fkey;
ALTER TABLE gol ADD CONSTRAINT gol_inscripcion_jugador_id_fkey 
  FOREIGN KEY (inscripcion_jugador_id) REFERENCES inscripcion_jugador(id) ON DELETE CASCADE;

-- 6. TARJETA (Dependencia de inscripcion_jugador)
ALTER TABLE tarjeta DROP CONSTRAINT IF EXISTS tarjeta_inscripcion_jugador_id_fkey;
ALTER TABLE tarjeta ADD CONSTRAINT tarjeta_inscripcion_jugador_id_fkey 
  FOREIGN KEY (inscripcion_jugador_id) REFERENCES inscripcion_jugador(id) ON DELETE CASCADE;

-- 7. SANCION JUGADOR (Dependencia de inscripcion_jugador)
ALTER TABLE sancion_jugador DROP CONSTRAINT IF EXISTS sancion_jugador_inscripcion_jugador_id_fkey;
ALTER TABLE sancion_jugador ADD CONSTRAINT sancion_jugador_inscripcion_jugador_id_fkey 
  FOREIGN KEY (inscripcion_jugador_id) REFERENCES inscripcion_jugador(id) ON DELETE CASCADE;

