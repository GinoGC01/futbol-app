-- ============================================================
-- SEED — SOLO DESARROLLO
-- Ejecutar manualmente en Supabase SQL Editor cuando se necesite
-- poblar la base de datos para pruebas.
-- ============================================================

-- Organizador de prueba
-- (el auth_id se completa después de crear el usuario en Supabase Auth)
INSERT INTO organizador (id, nombre, email, telefono) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Carlos Rodríguez', 'carlos@liga.com', '11-1234-5678')
ON CONFLICT (id) DO NOTHING;

-- Liga de prueba
INSERT INTO liga (id, organizador_id, nombre, slug, tipo_futbol, zona) VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Liga Norte Palermo',
    'liga-norte-palermo',
    'f7',
    'Palermo, CABA'
  )
ON CONFLICT (id) DO NOTHING;

-- Temporada activa con formato liga
INSERT INTO temporada (id, liga_id, formato_id, nombre, fecha_inicio, fecha_fin, estado) VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',  -- Liga
    'Apertura 2025',
    '2025-04-01',
    '2025-07-31',
    'activa'
  )
ON CONFLICT (id) DO NOTHING;

-- Fase única (todos contra todos)
INSERT INTO fase (id, temporada_id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta) VALUES
  (
    'dddddddd-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'Fase única',
    'todos_contra_todos',
    1,
    3,
    1,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Jornadas
INSERT INTO jornada (id, fase_id, numero, fecha_tentativa, estado) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 1, '2025-04-06', 'jugada'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', 2, '2025-04-13', 'programada'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000001', 3, '2025-04-20', 'programada')
ON CONFLICT (id) DO NOTHING;

-- Equipos
INSERT INTO equipo (id, liga_id, nombre, color_principal) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Atlético Palermo', '#1A3A6B'),
  ('ffffffff-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Deportivo Norte',  '#C41E3A'),
  ('ffffffff-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'Racing Amateur',   '#1A8A1A')
ON CONFLICT (id) DO NOTHING;

-- Inscripciones de equipos a la temporada
INSERT INTO inscripcion_equipo (equipo_id, temporada_id, estado_pago, monto_total, monto_abonado) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'pagado',   5000, 5000),
  ('ffffffff-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'parcial',  5000, 2500),
  ('ffffffff-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', 'pendiente', 5000, 0)
ON CONFLICT (equipo_id, temporada_id) DO NOTHING;

-- Planteles
INSERT INTO plantel (id, equipo_id, temporada_id, limite_jugadores) VALUES
  ('11111111-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 15),
  ('11111111-0000-0000-0000-000000000002', 'ffffffff-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 15),
  ('11111111-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000001', 15)
ON CONFLICT (equipo_id, temporada_id) DO NOTHING;

-- Jugadores (sin DNI intencionalmente para probar el flujo sin él)
INSERT INTO jugador (id, nombre, apellido, fecha_nacimiento) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Martín',   'López',    '1995-03-15'),
  ('22222222-0000-0000-0000-000000000002', 'Sebastián', 'García',  '1993-07-22'),
  ('22222222-0000-0000-0000-000000000003', 'Diego',    'Fernández', '1998-11-08'),
  ('22222222-0000-0000-0000-000000000004', 'Rodrigo',  'Martínez',  '1996-05-30')
ON CONFLICT (id) DO NOTHING;

-- Inscripciones de jugadores a planteles
INSERT INTO inscripcion_jugador (id, jugador_id, plantel_id, dorsal, posicion, estado) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 9,  'delantero',     'activo'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 10, 'mediocampista',  'activo'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 7,  'delantero',     'activo'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 1,  'arquero',       'activo')
ON CONFLICT (jugador_id, plantel_id) DO NOTHING;

-- Partido jugado (jornada 1)
INSERT INTO partido (id, jornada_id, equipo_local_id, equipo_visitante_id,
                     goles_local, goles_visitante, fecha_hora, cancha, estado) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    'eeeeeeee-0000-0000-0000-000000000001',
    'ffffffff-0000-0000-0000-000000000001',
    'ffffffff-0000-0000-0000-000000000002',
    2, 1,
    '2025-04-06 16:00:00-03',
    'Cancha Parque 3 de Febrero',
    'finalizado'
  )
ON CONFLICT (id) DO NOTHING;

-- Goles del partido
INSERT INTO gol (partido_id, inscripcion_jugador_id, minuto, es_penal, es_contra) VALUES
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 23, false, false),
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 67, true,  false),
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', 45, false, false)
ON CONFLICT (id) DO NOTHING;

-- Tarjeta en el partido
INSERT INTO tarjeta (partido_id, inscripcion_jugador_id, tipo, minuto) VALUES
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 'amarilla', 55)
ON CONFLICT (id) DO NOTHING;

-- Partido programado (jornada 2)
INSERT INTO partido (id, jornada_id, equipo_local_id, equipo_visitante_id,
                     fecha_hora, cancha, estado) VALUES
  (
    '44444444-0000-0000-0000-000000000002',
    'eeeeeeee-0000-0000-0000-000000000002',
    'ffffffff-0000-0000-0000-000000000002',
    'ffffffff-0000-0000-0000-000000000003',
    '2025-04-13 16:00:00-03',
    'Cancha Parque 3 de Febrero',
    'programado'
  )
ON CONFLICT (id) DO NOTHING;
