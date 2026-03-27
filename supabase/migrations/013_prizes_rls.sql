-- ============================================================
-- RLS PARA MÓDULO DE PREMIOS
-- ============================================================
ALTER TABLE premio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ganador_premio ENABLE ROW LEVEL SECURITY;

-- Premio: lectura pública solo si está publicado
CREATE POLICY "premio: lectura pública" ON premio
  FOR SELECT USING (publicado = true);

-- Premio: gestión completa solo para el organizador dueño de la liga
CREATE POLICY "premio: gestion admin" ON premio
  FOR ALL USING (
    liga_pertenece_al_auth((SELECT liga_id FROM temporada WHERE id = temporada_id))
  );

-- Ganadores: solo visibles si el premio está publicado
CREATE POLICY "ganador_premio: lectura pública" ON ganador_premio
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM premio WHERE id = premio_id AND publicado = true)
  );

-- Ganadores: gestión solo para el organizador dueño
CREATE POLICY "ganador_premio: gestion admin" ON ganador_premio
  FOR ALL USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM premio p JOIN temporada t ON t.id = p.temporada_id WHERE p.id = premio_id)
    )
  );
