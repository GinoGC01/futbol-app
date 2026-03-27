-- ============================================================
-- FORMATOS DE COMPETENCIA (catálogo global)
-- Estos registros son requeridos por el sistema.
-- No son datos de prueba: deben existir en producción.
-- ============================================================
INSERT INTO formato_competencia (id, nombre, tipo, descripcion) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Liga',
    'liga',
    'Todos los equipos se enfrentan entre sí. El campeón es el de más puntos.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Copa eliminatoria',
    'copa',
    'Eliminación directa desde la primera ronda. Un solo partido por cruce.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Copa eliminatoria (ida y vuelta)',
    'copa',
    'Eliminación directa. Cada cruce se juega en dos partidos.'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Grupos y eliminatoria',
    'mixto',
    'Fase inicial de grupos (todos contra todos) seguida de eliminación directa.'
  )
ON CONFLICT (id) DO NOTHING;
