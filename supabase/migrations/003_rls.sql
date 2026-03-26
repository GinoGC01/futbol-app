-- Activar RLS en todas las tablas
ALTER TABLE ligas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE goles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCIÓN HELPER: obtener liga_id del admin autenticado
-- =============================================
CREATE OR REPLACE FUNCTION get_auth_liga_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT liga_id FROM admin_users WHERE id = auth.uid();
$$;

-- =============================================
-- LIGAS
-- =============================================
CREATE POLICY "ligas: lectura pública"
  ON ligas FOR SELECT USING (true);

CREATE POLICY "ligas: escritura solo admin de la liga"
  ON ligas FOR UPDATE
  USING (id = get_auth_liga_id());

CREATE POLICY "ligas: insert para onboarding"
  ON ligas FOR INSERT
  WITH CHECK (true);

-- =============================================
-- ADMIN_USERS
-- =============================================
CREATE POLICY "admin_users: solo el propio usuario"
  ON admin_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admin_users: insert para onboarding"
  ON admin_users FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- EQUIPOS
-- =============================================
CREATE POLICY "equipos: lectura pública"
  ON equipos FOR SELECT USING (true);

CREATE POLICY "equipos: escritura admin de la liga"
  ON equipos FOR ALL
  USING (liga_id = get_auth_liga_id());

-- =============================================
-- JUGADORES
-- =============================================
CREATE POLICY "jugadores: lectura pública"
  ON jugadores FOR SELECT USING (true);

CREATE POLICY "jugadores: escritura admin de la liga"
  ON jugadores FOR ALL
  USING (
    equipo_id IN (
      SELECT id FROM equipos WHERE liga_id = get_auth_liga_id()
    )
  );

-- =============================================
-- TEMPORADAS
-- =============================================
CREATE POLICY "temporadas: lectura pública"
  ON temporadas FOR SELECT USING (true);

CREATE POLICY "temporadas: escritura admin de la liga"
  ON temporadas FOR ALL
  USING (liga_id = get_auth_liga_id());

-- =============================================
-- PARTIDOS
-- =============================================
CREATE POLICY "partidos: lectura pública"
  ON partidos FOR SELECT USING (true);

CREATE POLICY "partidos: escritura admin de la liga"
  ON partidos FOR ALL
  USING (
    temporada_id IN (
      SELECT id FROM temporadas WHERE liga_id = get_auth_liga_id()
    )
  );

-- =============================================
-- GOLES
-- =============================================
CREATE POLICY "goles: lectura pública"
  ON goles FOR SELECT USING (true);

CREATE POLICY "goles: escritura admin de la liga"
  ON goles FOR ALL
  USING (
    partido_id IN (
      SELECT p.id FROM partidos p
      JOIN temporadas t ON t.id = p.temporada_id
      WHERE t.liga_id = get_auth_liga_id()
    )
  );

-- =============================================
-- TARJETAS
-- =============================================
CREATE POLICY "tarjetas: lectura pública"
  ON tarjetas FOR SELECT USING (true);

CREATE POLICY "tarjetas: escritura admin de la liga"
  ON tarjetas FOR ALL
  USING (
    partido_id IN (
      SELECT p.id FROM partidos p
      JOIN temporadas t ON t.id = p.temporada_id
      WHERE t.liga_id = get_auth_liga_id()
    )
  );
