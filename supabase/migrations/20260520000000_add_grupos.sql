-- ============================================================
-- 1. CREACIÓN DE LA TABLA GRUPO
-- ============================================================
CREATE TABLE IF NOT EXISTS grupo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id       UUID NOT NULL REFERENCES fase(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL CHECK (length(trim(nombre)) >= 1),
  orden         INT NOT NULL CHECK (orden >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- No puede haber dos grupos con el mismo orden o nombre dentro de una fase
  CONSTRAINT grupo_orden_unico UNIQUE (fase_id, orden),
  CONSTRAINT grupo_nombre_unico UNIQUE (fase_id, nombre)
);

-- ============================================================
-- 2. CREACIÓN DE LA TABLA GRUPO_EQUIPO (Relación N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS grupo_equipo (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id  UUID NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
  equipo_id UUID NOT NULL REFERENCES equipo(id) ON DELETE RESTRICT,
  
  -- Un equipo solo puede estar en un grupo una vez
  CONSTRAINT grupo_equipo_unico UNIQUE (grupo_id, equipo_id)
);

-- ============================================================
-- 3. MODIFICACIÓN DE LA TABLA PARTIDO
-- ============================================================
ALTER TABLE partido ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES grupo(id) ON DELETE SET NULL;

-- ============================================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_equipo ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLÍTICAS DE SEGURIDAD (RLS POLICIES)
-- ============================================================

-- GRUPO: lectura pública
CREATE POLICY "grupo: lectura pública"
  ON grupo FOR SELECT USING (true);

-- GRUPO: escritura solo si la temporada/liga es del organizador autenticado
CREATE POLICY "grupo: escritura solo dueño"
  ON grupo FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM temporada t
       JOIN fase f ON f.temporada_id = t.id
       WHERE f.id = fase_id)
    )
  );

-- GRUPO_EQUIPO: lectura pública
CREATE POLICY "grupo_equipo: lectura pública"
  ON grupo_equipo FOR SELECT USING (true);

-- GRUPO_EQUIPO: escritura solo si el grupo pertenece a una fase de su liga
CREATE POLICY "grupo_equipo: escritura solo dueño"
  ON grupo_equipo FOR ALL
  USING (
    liga_pertenece_al_auth(
      (SELECT t.liga_id FROM temporada t
       JOIN fase f ON f.temporada_id = t.id
       JOIN grupo g ON g.fase_id = f.id
       WHERE g.id = grupo_id)
    )
  );

-- ============================================================
-- 6. ACTUALIZACIÓN DE VISTA_TABLA_POSICIONES
-- ============================================================
CREATE OR REPLACE VIEW vista_tabla_posiciones
WITH (security_invoker = true)
AS
WITH partidos_por_equipo AS (
  SELECT
    f.id              AS fase_id,
    f.temporada_id,
    f.puntos_victoria,
    f.puntos_empate,
    f.puntos_derrota,
    e.id              AS equipo_id,
    e.nombre          AS equipo_nombre,
    e.escudo_url,
    e.liga_id,
    g.id              AS grupo_id,
    g.nombre          AS grupo_nombre,

    -- Partidos jugados
    COUNT(p.id) FILTER (
      WHERE p.estado = 'finalizado'
    ) AS pj,

    -- Ganados
    COUNT(p.id) FILTER (
      WHERE p.estado = 'finalizado' AND (
        (p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante) OR
        (p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local)
      )
    ) AS pg,

    -- Empatados
    COUNT(p.id) FILTER (
      WHERE p.estado = 'finalizado'
        AND p.goles_local = p.goles_visitante
        AND (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
    ) AS pe,

    -- Perdidos
    COUNT(p.id) FILTER (
      WHERE p.estado = 'finalizado' AND (
        (p.equipo_local_id = e.id AND p.goles_local < p.goles_visitante) OR
        (p.equipo_visitante_id = e.id AND p.goles_visitante < p.goles_local)
      )
    ) AS pp,

    -- Goles a favor
    COALESCE(SUM(
      CASE
        WHEN p.equipo_local_id = e.id     THEN p.goles_local
        WHEN p.equipo_visitante_id = e.id THEN p.goles_visitante
        ELSE 0
      END
    ) FILTER (WHERE p.estado = 'finalizado'), 0) AS gf,

    -- Goles en contra
    COALESCE(SUM(
      CASE
        WHEN p.equipo_local_id = e.id     THEN p.goles_visitante
        WHEN p.equipo_visitante_id = e.id THEN p.goles_local
        ELSE 0
      END
    ) FILTER (WHERE p.estado = 'finalizado'), 0) AS gc

  FROM fase f
  JOIN temporada t ON t.id = f.temporada_id
  JOIN inscripcion_equipo ie ON ie.temporada_id = t.id
  JOIN equipo e ON e.id = ie.equipo_id
  LEFT JOIN grupo_equipo ge ON ge.equipo_id = e.id
    AND ge.grupo_id IN (SELECT id FROM grupo WHERE fase_id = f.id)
  LEFT JOIN grupo g ON g.id = ge.grupo_id
  LEFT JOIN jornada j ON j.fase_id = f.id
  LEFT JOIN partido p ON p.jornada_id = j.id
    AND (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
    AND (p.grupo_id IS NULL OR p.grupo_id = g.id)
  GROUP BY
    f.id, f.temporada_id, f.puntos_victoria, f.puntos_empate, f.puntos_derrota,
    e.id, e.nombre, e.escudo_url, e.liga_id, g.id, g.nombre
),
sanciones_puntos AS (
  SELECT
    se.equipo_id,
    f.id AS fase_id,
    COALESCE(SUM(se.puntos_descontados), 0) AS puntos_sancion
  FROM sancion_equipo se
  JOIN partido p ON p.id = se.partido_id
  JOIN jornada j ON j.id = p.jornada_id
  JOIN fase f ON f.id = j.fase_id
  WHERE se.estado = 'activa'
  GROUP BY se.equipo_id, f.id
)
SELECT
  ppe.fase_id,
  ppe.temporada_id,
  ppe.equipo_id,
  ppe.equipo_nombre,
  ppe.escudo_url,
  ppe.liga_id,
  ppe.pj,
  ppe.pg,
  ppe.pe,
  ppe.pp,
  ppe.gf,
  ppe.gc,
  (ppe.gf - ppe.gc) AS dg,
  GREATEST(
    0,
    (ppe.pg * ppe.puntos_victoria)
    + (ppe.pe * ppe.puntos_empate)
    + (ppe.pp * ppe.puntos_derrota)
    - COALESCE(sp.puntos_sancion, 0)
  ) AS pts,
  ppe.grupo_id,
  ppe.grupo_nombre
FROM partidos_por_equipo ppe
LEFT JOIN sanciones_puntos sp
  ON sp.equipo_id = ppe.equipo_id AND sp.fase_id = ppe.fase_id
ORDER BY pts DESC, dg DESC, gf DESC, ppe.equipo_nombre ASC;
