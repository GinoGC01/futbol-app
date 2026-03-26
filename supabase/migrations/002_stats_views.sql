-- =============================================
-- VISTA: tabla de posiciones por temporada
-- =============================================
CREATE OR REPLACE VIEW vista_tabla_posiciones AS
WITH stats AS (
  SELECT
    t.id AS temporada_id,
    e.id AS equipo_id,
    e.nombre AS equipo_nombre,
    e.escudo_url,
    e.liga_id,

    COUNT(p.id) FILTER (
      WHERE p.estado IN ('finalizado', 'finalizado_parcial')
    ) AS pj,

    COUNT(p.id) FILTER (
      WHERE p.estado IN ('finalizado', 'finalizado_parcial') AND (
        (p.equipo_local = e.id AND p.goles_local > p.goles_visitante) OR
        (p.equipo_visitante = e.id AND p.goles_visitante > p.goles_local)
      )
    ) AS pg,

    COUNT(p.id) FILTER (
      WHERE p.estado IN ('finalizado', 'finalizado_parcial')
      AND p.goles_local = p.goles_visitante
      AND (p.equipo_local = e.id OR p.equipo_visitante = e.id)
    ) AS pe,

    COUNT(p.id) FILTER (
      WHERE p.estado IN ('finalizado', 'finalizado_parcial') AND (
        (p.equipo_local = e.id AND p.goles_local < p.goles_visitante) OR
        (p.equipo_visitante = e.id AND p.goles_visitante < p.goles_local)
      )
    ) AS pp,

    COALESCE(SUM(
      CASE
        WHEN p.equipo_local = e.id THEN p.goles_local
        WHEN p.equipo_visitante = e.id THEN p.goles_visitante
        ELSE 0
      END
    ) FILTER (WHERE p.estado IN ('finalizado', 'finalizado_parcial')), 0) AS gf,

    COALESCE(SUM(
      CASE
        WHEN p.equipo_local = e.id THEN p.goles_visitante
        WHEN p.equipo_visitante = e.id THEN p.goles_local
        ELSE 0
      END
    ) FILTER (WHERE p.estado IN ('finalizado', 'finalizado_parcial')), 0) AS gc

  FROM temporadas t
  JOIN equipos e ON e.liga_id = t.liga_id
  LEFT JOIN partidos p ON p.temporada_id = t.id
    AND (p.equipo_local = e.id OR p.equipo_visitante = e.id)
  GROUP BY t.id, e.id, e.nombre, e.escudo_url, e.liga_id
)
SELECT
  *,
  (gf - gc) AS dg,
  (pg * 3 + pe) AS pts
FROM stats
ORDER BY pts DESC, dg DESC, gf DESC;

-- =============================================
-- VISTA: goleadores por temporada
-- =============================================
CREATE OR REPLACE VIEW vista_goleadores AS
SELECT
  j.id   AS jugador_id,
  j.nombre AS jugador_nombre,
  j.dorsal,
  e.id   AS equipo_id,
  e.nombre AS equipo_nombre,
  e.liga_id,
  t.id   AS temporada_id,
  COUNT(g.id) FILTER (WHERE g.es_contra = FALSE) AS goles,
  COUNT(g.id) FILTER (WHERE g.es_penal = TRUE AND g.es_contra = FALSE) AS penales,
  COUNT(g.id) FILTER (WHERE g.es_contra = TRUE) AS goles_en_contra
FROM jugadores j
JOIN equipos e ON e.id = j.equipo_id
JOIN temporadas t ON t.liga_id = e.liga_id
LEFT JOIN goles g ON g.jugador_id = j.id
LEFT JOIN partidos p ON p.id = g.partido_id
  AND p.temporada_id = t.id
  AND p.estado IN ('finalizado', 'finalizado_parcial')
GROUP BY j.id, j.nombre, j.dorsal, e.id, e.nombre, e.liga_id, t.id
ORDER BY goles DESC, j.nombre ASC;

-- =============================================
-- VISTA: tarjetas por temporada
-- =============================================
CREATE OR REPLACE VIEW vista_tarjetas AS
SELECT
  j.id   AS jugador_id,
  j.nombre AS jugador_nombre,
  e.id   AS equipo_id,
  e.nombre AS equipo_nombre,
  e.liga_id,
  t.id   AS temporada_id,
  COUNT(ta.id) FILTER (WHERE ta.tipo = 'amarilla') AS amarillas,
  COUNT(ta.id) FILTER (WHERE ta.tipo IN ('roja','doble_amarilla')) AS rojas
FROM jugadores j
JOIN equipos e ON e.id = j.equipo_id
JOIN temporadas t ON t.liga_id = e.liga_id
LEFT JOIN tarjetas ta ON ta.jugador_id = j.id
LEFT JOIN partidos p ON p.id = ta.partido_id
  AND p.temporada_id = t.id
  AND p.estado IN ('finalizado', 'finalizado_parcial')
GROUP BY j.id, j.nombre, e.id, e.nombre, e.liga_id, t.id
ORDER BY rojas DESC, amarillas DESC;
