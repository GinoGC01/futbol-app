-- ============================================================
-- VISTA: tabla de posiciones
-- Calcula automáticamente PJ, PG, PE, PP, GF, GC, DG, PTS
-- para cada equipo inscripto en una fase.
-- Incorpora sanciones de puntos de sancion_equipo.
-- ============================================================
CREATE OR REPLACE VIEW vista_tabla_posiciones AS
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
  LEFT JOIN jornada j ON j.fase_id = f.id
  LEFT JOIN partido p ON p.jornada_id = j.id
    AND (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
  GROUP BY
    f.id, f.temporada_id, f.puntos_victoria, f.puntos_empate, f.puntos_derrota,
    e.id, e.nombre, e.escudo_url, e.liga_id
),
sanciones_puntos AS (
  SELECT
    se.equipo_id,
    -- Vincular sanción a la fase a través del partido
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
  ) AS pts
FROM partidos_por_equipo ppe
LEFT JOIN sanciones_puntos sp
  ON sp.equipo_id = ppe.equipo_id AND sp.fase_id = ppe.fase_id
ORDER BY pts DESC, dg DESC, gf DESC, ppe.equipo_nombre ASC;

COMMENT ON VIEW vista_tabla_posiciones IS
  'Tabla de posiciones por fase. Incluye descuento de puntos por sanciones activas.
   Los puntos nunca bajan de 0 (GREATEST(..., 0)).
   Ordenado por: PTS desc, DG desc, GF desc, nombre asc.';

-- ============================================================
-- VISTA: goleadores por temporada
-- Muestra el ranking de goleadores excluyendo goles en propia puerta.
-- ============================================================
CREATE OR REPLACE VIEW vista_goleadores AS
SELECT
  j.id              AS jugador_id,
  j.nombre          AS jugador_nombre,
  j.apellido        AS jugador_apellido,
  ij.dorsal,
  e.id              AS equipo_id,
  e.nombre          AS equipo_nombre,
  e.escudo_url,
  pl.temporada_id,
  f.id              AS fase_id,

  COUNT(g.id) FILTER (WHERE g.es_contra = FALSE) AS goles,
  COUNT(g.id) FILTER (WHERE g.es_penal = TRUE AND g.es_contra = FALSE) AS penales,
  COUNT(g.id) FILTER (WHERE g.es_contra = TRUE) AS goles_en_contra

FROM inscripcion_jugador ij
JOIN jugador j ON j.id = ij.jugador_id
JOIN plantel pl ON pl.id = ij.plantel_id
JOIN equipo e ON e.id = pl.equipo_id
LEFT JOIN gol g ON g.inscripcion_jugador_id = ij.id
LEFT JOIN partido p ON p.id = g.partido_id AND p.estado = 'finalizado'
LEFT JOIN jornada jor ON jor.id = p.jornada_id
LEFT JOIN fase f ON f.id = jor.fase_id AND f.temporada_id = pl.temporada_id
GROUP BY
  j.id, j.nombre, j.apellido, ij.dorsal,
  e.id, e.nombre, e.escudo_url,
  pl.temporada_id, f.id
ORDER BY goles DESC, j.apellido ASC, j.nombre ASC;

-- ============================================================
-- VISTA: tarjetas por temporada
-- Cuenta amarillas y rojas acumuladas por jugador en una temporada.
-- ============================================================
CREATE OR REPLACE VIEW vista_tarjetas AS
SELECT
  j.id              AS jugador_id,
  j.nombre          AS jugador_nombre,
  j.apellido        AS jugador_apellido,
  e.id              AS equipo_id,
  e.nombre          AS equipo_nombre,
  pl.temporada_id,
  f.id              AS fase_id,

  COUNT(t.id) FILTER (WHERE t.tipo = 'amarilla')                          AS amarillas,
  COUNT(t.id) FILTER (WHERE t.tipo IN ('roja','doble_amarilla'))          AS rojas,
  COUNT(t.id) FILTER (WHERE t.tipo = 'doble_amarilla')                   AS dobles_amarillas

FROM inscripcion_jugador ij
JOIN jugador j ON j.id = ij.jugador_id
JOIN plantel pl ON pl.id = ij.plantel_id
JOIN equipo e ON e.id = pl.equipo_id
LEFT JOIN tarjeta t ON t.inscripcion_jugador_id = ij.id
LEFT JOIN partido p ON p.id = t.partido_id AND p.estado = 'finalizado'
LEFT JOIN jornada jor ON jor.id = p.jornada_id
LEFT JOIN fase f ON f.id = jor.fase_id AND f.temporada_id = pl.temporada_id
GROUP BY
  j.id, j.nombre, j.apellido,
  e.id, e.nombre,
  pl.temporada_id, f.id
ORDER BY rojas DESC, amarillas DESC, j.apellido ASC;

-- ============================================================
-- VISTA: fixture completo de una jornada
-- Uso en la interfaz pública para mostrar partidos de una jornada.
-- ============================================================
CREATE OR REPLACE VIEW vista_fixture AS
SELECT
  p.id              AS partido_id,
  p.estado          AS partido_estado,
  p.fecha_hora,
  p.cancha,
  p.goles_local,
  p.goles_visitante,
  j.id              AS jornada_id,
  j.numero          AS jornada_numero,
  j.estado          AS jornada_estado,
  f.id              AS fase_id,
  f.nombre          AS fase_nombre,
  f.tipo            AS fase_tipo,
  t.id              AS temporada_id,
  t.nombre          AS temporada_nombre,
  l.id              AS liga_id,
  -- Equipo local
  el.id             AS local_id,
  el.nombre         AS local_nombre,
  el.escudo_url     AS local_escudo,
  -- Equipo visitante
  ev.id             AS visitante_id,
  ev.nombre         AS visitante_nombre,
  ev.escudo_url     AS visitante_escudo
FROM partido p
JOIN jornada j ON j.id = p.jornada_id
JOIN fase f ON f.id = j.fase_id
JOIN temporada t ON t.id = f.temporada_id
JOIN liga l ON l.id = t.liga_id
JOIN equipo el ON el.id = p.equipo_local_id
JOIN equipo ev ON ev.id = p.equipo_visitante_id
ORDER BY j.numero ASC, p.fecha_hora ASC NULLS LAST;

-- ============================================================
-- VISTA: estado de pagos por temporada
-- Permite al organizador ver qué equipos pagaron y cuánto deben.
-- ============================================================
CREATE OR REPLACE VIEW vista_pagos AS
SELECT
  ie.id              AS inscripcion_id,
  ie.estado_pago,
  ie.monto_total,
  ie.monto_abonado,
  (ie.monto_total - ie.monto_abonado) AS monto_pendiente,
  ie.fecha_inscripcion,
  e.id               AS equipo_id,
  e.nombre           AS equipo_nombre,
  t.id               AS temporada_id,
  t.nombre           AS temporada_nombre,
  l.id               AS liga_id
FROM inscripcion_equipo ie
JOIN equipo e ON e.id = ie.equipo_id
JOIN temporada t ON t.id = ie.temporada_id
JOIN liga l ON l.id = t.liga_id
ORDER BY ie.estado_pago ASC, e.nombre ASC;
