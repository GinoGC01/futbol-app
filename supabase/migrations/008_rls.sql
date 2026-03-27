-- ============================================================
-- ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE organizador          ENABLE ROW LEVEL SECURITY;
ALTER TABLE liga                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE formato_competencia  ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporada            ENABLE ROW LEVEL SECURITY;
ALTER TABLE fase                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jornada              ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo               ENABLE ROW LEVEL SECURITY;
ALTER TABLE partido              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripcion_equipo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantel              ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugador              ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripcion_jugador  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gol                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjeta              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sancion_jugador      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sancion_equipo       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIÓN HELPER: obtener el organizador autenticado
-- Usada por las políticas para verificar propiedad.
-- SECURITY DEFINER: se ejecuta con privilegios del dueño de la función,
-- no del usuario que la llama. Permite leer organizador sin política circular.
-- ============================================================
CREATE OR REPLACE FUNCTION get_auth_organizador_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM organizador WHERE auth_id = auth.uid();
$$;

-- ============================================================
-- FUNCIÓN HELPER: verificar si una liga pertenece al organizador autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION liga_pertenece_al_auth(p_liga_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM liga
    WHERE id = p_liga_id
      AND organizador_id = get_auth_organizador_id()
  );
$$;

-- ============================================================
-- FORMATO_COMPETENCIA — catálogo global, solo lectura para todos
-- ============================================================
CREATE POLICY "formato: lectura pública"
  ON formato_competencia FOR SELECT USING (true);

-- ============================================================
-- ORGANIZADOR — solo el propio organizador ve y edita su fila
-- ============================================================
CREATE POLICY "organizador: solo propio"
  ON organizador FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "organizador: solo propio actualiza"
  ON organizador FOR UPDATE
  USING (auth_id = auth.uid());

-- ============================================================
-- LIGA — lectura pública, escritura solo del organizador dueño
-- ============================================================
CREATE POLICY "liga: lectura pública"
  ON liga FOR SELECT USING (true);

CREATE POLICY "liga: escritura solo dueño"
  ON liga FOR ALL
  USING (organizador_id = get_auth_organizador_id());

-- ============================================================
-- TEMPORADA — lectura pública, escritura solo si la liga es del auth
-- ============================================================
CREATE POLICY "temporada: lectura pública"
  ON temporada FOR SELECT USING (true);

CREATE POLICY "temporada: escritura solo dueño de liga"
  ON temporada FOR ALL
  USING (liga_pertenece_al_auth(liga_id));

-- ============================================================
-- FASE — lectura pública, escritura solo si la temporada es del auth
-- ============================================================
CREATE POLICY "fase: lectura pública"
  ON fase FOR SELECT USING (true);

CREATE POLICY "fase: escritura solo dueño"
  ON fase FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT liga_id FROM temporada WHERE id = temporada_id)
    )
  );

-- ============================================================
-- JORNADA — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "jornada: lectura pública"
  ON jornada FOR SELECT USING (true);

CREATE POLICY "jornada: escritura solo dueño"
  ON jornada FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM temporada t
       JOIN fase f ON f.temporada_id = t.id
       WHERE f.id = fase_id)
    )
  );

-- ============================================================
-- EQUIPO — lectura pública, escritura solo dueño de la liga
-- ============================================================
CREATE POLICY "equipo: lectura pública"
  ON equipo FOR SELECT USING (true);

CREATE POLICY "equipo: escritura solo dueño de liga"
  ON equipo FOR ALL
  USING (liga_pertenece_al_auth(liga_id));

-- ============================================================
-- PARTIDO — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "partido: lectura pública"
  ON partido FOR SELECT USING (true);

CREATE POLICY "partido: escritura solo dueño"
  ON partido FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM jornada j
       JOIN fase f ON f.id = j.fase_id
       JOIN temporada t ON t.id = f.temporada_id
       WHERE j.id = jornada_id)
    )
  );

-- ============================================================
-- INSCRIPCION_EQUIPO — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "inscripcion_equipo: lectura pública"
  ON inscripcion_equipo FOR SELECT USING (true);

CREATE POLICY "inscripcion_equipo: escritura solo dueño"
  ON inscripcion_equipo FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT liga_id FROM equipo WHERE id = equipo_id)
    )
  );

-- ============================================================
-- PLANTEL — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "plantel: lectura pública"
  ON plantel FOR SELECT USING (true);

CREATE POLICY "plantel: escritura solo dueño"
  ON plantel FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT liga_id FROM equipo WHERE id = equipo_id)
    )
  );

-- ============================================================
-- JUGADOR — lectura pública, escritura: cualquier organizador autenticado
-- (un jugador es un recurso global, puede estar en ligas distintas)
-- ============================================================
CREATE POLICY "jugador: lectura pública"
  ON jugador FOR SELECT USING (true);

CREATE POLICY "jugador: escritura para organizadores autenticados"
  ON jugador FOR ALL
  USING (get_auth_organizador_id() IS NOT NULL);

-- ============================================================
-- INSCRIPCION_JUGADOR — lectura pública, escritura solo dueño del plantel
-- ============================================================
CREATE POLICY "inscripcion_jugador: lectura pública"
  ON inscripcion_jugador FOR SELECT USING (true);

CREATE POLICY "inscripcion_jugador: escritura solo dueño"
  ON inscripcion_jugador FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT e.liga_id FROM plantel pl
       JOIN equipo e ON e.id = pl.equipo_id
       WHERE pl.id = plantel_id)
    )
  );

-- ============================================================
-- GOL — lectura pública, escritura solo dueño del partido
-- ============================================================
CREATE POLICY "gol: lectura pública"
  ON gol FOR SELECT USING (true);

CREATE POLICY "gol: escritura solo dueño"
  ON gol FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM partido p
       JOIN jornada j ON j.id = p.jornada_id
       JOIN fase f ON f.id = j.fase_id
       JOIN temporada t ON t.id = f.temporada_id
       WHERE p.id = partido_id)
    )
  );

-- ============================================================
-- TARJETA — lectura pública, escritura solo dueño del partido
-- ============================================================
CREATE POLICY "tarjeta: lectura pública"
  ON tarjeta FOR SELECT USING (true);

CREATE POLICY "tarjeta: escritura solo dueño"
  ON tarjeta FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM partido p
       JOIN jornada j ON j.id = p.jornada_id
       JOIN fase f ON f.id = j.fase_id
       JOIN temporada t ON t.id = f.temporada_id
       WHERE p.id = partido_id)
    )
  );

-- ============================================================
-- SANCION_JUGADOR — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "sancion_jugador: lectura pública"
  ON sancion_jugador FOR SELECT USING (true);

CREATE POLICY "sancion_jugador: escritura solo dueño"
  ON sancion_jugador FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT e.liga_id FROM inscripcion_jugador ij
       JOIN plantel pl ON pl.id = ij.plantel_id
       JOIN equipo e ON e.id = pl.equipo_id
       WHERE ij.id = inscripcion_jugador_id)
    )
  );

-- ============================================================
-- SANCION_EQUIPO — lectura pública, escritura solo dueño
-- ============================================================
CREATE POLICY "sancion_equipo: lectura pública"
  ON sancion_equipo FOR SELECT USING (true);

CREATE POLICY "sancion_equipo: escritura solo dueño"
  ON sancion_equipo FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT liga_id FROM equipo WHERE id = equipo_id)
    )
  );
