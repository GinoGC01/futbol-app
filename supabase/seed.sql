-- SOLO PARA DESARROLLO — no ejecutar en producción
INSERT INTO ligas (id, nombre, slug, zona) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Liga Norte Palermo', 'liga-norte-palermo', 'Palermo, CABA'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Liga Sur Boedo', 'liga-sur-boedo', 'Boedo, CABA');

INSERT INTO temporadas (id, liga_id, nombre, activa) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Apertura 2025', true);

INSERT INTO equipos (id, liga_id, nombre) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Atlético Palermo'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Deportivo Norte'),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Racing Amateur');

INSERT INTO jugadores (id, equipo_id, nombre, dorsal, posicion) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Carlos Pérez', 9, 'delantero'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'Juan Gómez', 5, 'mediocampista'),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000002', 'Martín López', 10, 'delantero');

INSERT INTO partidos (temporada_id, jornada, equipo_local, equipo_visitante, fecha, estado, goles_local, goles_visitante) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 1,
   'cccccccc-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-000000000002',
   NOW() + interval '7 days', 'programado', NULL, NULL),
  ('bbbbbbbb-0000-0000-0000-000000000001', 1,
   'cccccccc-0000-0000-0000-000000000002',
   'cccccccc-0000-0000-0000-000000000003',
   NOW() - interval '7 days', 'finalizado', 2, 1);
