import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { requireAuth, requireOrganizador, requireActiveStatus } from '../middleware/auth.js'
import CompetitionController from '../controllers/competition/CompetitionController.js'

const router = Router()

// Todas las rutas de competencia requieren ser organizador y tener status activo
router.use(requireAuth, requireOrganizador, requireActiveStatus)

// ============================================
// TEMPORADAS
// ============================================
router.post(
  '/temporadas',
  [
    body('liga_id').isUUID().withMessage('ID de liga requerido y válido'),
    body('formato_tipo').isString().notEmpty().withMessage('El tipo de formato es requerido'),
    body('nombre').isString().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
    body('fecha_inicio').optional().isISO8601().withMessage('La fecha inicio debe ser válida (YYYY-MM-DD)'),
    body('fecha_fin').optional().isISO8601().withMessage('La fecha fin debe ser válida (YYYY-MM-DD)')
  ],
  CompetitionController.createTemporada
)

router.get(
  '/temporadas',
  [
    query('liga_id').isUUID().withMessage('ID de liga es requerido para consultar temporadas')
  ],
  CompetitionController.getTemporadas
)

router.get(
  '/temporadas/:id/tree',
  [
    param('id').isUUID().withMessage('ID de temporada inválido')
  ],
  CompetitionController.getTemporadaCompleta
)

router.patch(
  '/temporadas/:id/estado',
  [
    param('id').isUUID().withMessage('ID de temporada inválido'),
    body('estado').isIn(['borrador', 'activa', 'finalizada']).withMessage('Estado inválido')
  ],
  CompetitionController.updateEstadoTemporada
)

router.patch(
  '/temporadas/:id',
  [
    param('id').isUUID().withMessage('ID de temporada inválido'),
    body('nombre').optional().isString().isLength({ min: 3, max: 100 }),
    body('fecha_inicio').optional().isISO8601(),
    body('fecha_fin').optional().isISO8601(),
    body('estado').optional().isIn(['borrador', 'activa', 'finalizada']).withMessage('Estado inválido')
  ],
  CompetitionController.updateTemporada
)

router.delete(
  '/temporadas/:id',
  [
    param('id').isUUID().withMessage('ID de temporada inválido')
  ],
  CompetitionController.deleteTemporada
)

router.patch(
  '/temporadas/:id/restore',
  [
    param('id').isUUID().withMessage('ID de temporada inválido')
  ],
  CompetitionController.restoreTemporada
)

router.get('/formatos', CompetitionController.getFormatos)

// ============================================
// FASES
// ============================================
router.post(
  '/fases',
  [
    body('temporada_id').isUUID().withMessage('ID de temporada requerido y válido'),
    body('nombre').optional().isString().isLength({ min: 2, max: 100 }),
    body('tipo').isIn(['todos_contra_todos', 'eliminacion_directa']).withMessage('Tipo de fase no válido'),
    body('puntos_victoria').optional().isInt({ min: 0 }),
    body('puntos_empate').optional().isInt({ min: 0 }),
    body('ida_y_vuelta').optional().isBoolean(),
    body('duracion_tiempo').optional().isInt({ min: 1, max: 60 }),
    body('duracion_entretiempo').optional().isInt({ min: 0, max: 30 }),
    body('tiempo_entre_partidos').optional().isInt({ min: 0, max: 60 }),
    body('hora_inicio').optional().matches(/^\d{2}:\d{2}$/).withMessage('hora_inicio debe ser HH:MM'),
    body('hora_fin').optional().matches(/^\d{2}:\d{2}$/).withMessage('hora_fin debe ser HH:MM'),
    body('canchas_disponibles').optional().isInt({ min: 1, max: 20 }),
    body('dias_juego').optional().isArray({ min: 1, max: 7 }).withMessage('dias_juego debe ser un array de enteros (0-6)'),
    body('dias_juego.*').optional().isInt({ min: 0, max: 6 }).withMessage('Cada día debe estar entre 0 (Dom) y 6 (Sáb)')
  ],
  CompetitionController.createFase
)

// ============================================
// JORNADAS (Batch)
// ============================================
router.post(
  '/jornadas/batch',
  [
    body('fase_id').isUUID().withMessage('ID de fase inválido'),
    body('cantidad').isInt({ min: 1, max: 100 }).withMessage('La cantidad debe ser un entero entre 1 y 100'),
    body('fecha_tentativa').optional().isISO8601().withMessage('Fecha inválida (ISO 8601)')
  ],
  CompetitionController.createJornadasBatch
)

// ============================================
// EDICIÓN DE FASES
// ============================================
router.patch(
  '/fases/:id',
  [
    param('id').isUUID().withMessage('ID de fase inválido'),
    body('nombre').optional().isString().isLength({ min: 2, max: 100 }),
    body('tipo').optional().isIn(['todos_contra_todos', 'eliminacion_directa']),
    body('puntos_victoria').optional().isInt({ min: 0 }),
    body('puntos_empate').optional().isInt({ min: 0 }),
    body('ida_y_vuelta').optional().isBoolean(),
    body('duracion_tiempo').optional().isInt({ min: 1, max: 60 }),
    body('duracion_entretiempo').optional().isInt({ min: 0, max: 30 }),
    body('tiempo_entre_partidos').optional().isInt({ min: 0, max: 60 }),
    body('hora_inicio').optional().matches(/^\d{2}:\d{2}$/).withMessage('hora_inicio debe ser HH:MM'),
    body('hora_fin').optional().matches(/^\d{2}:\d{2}$/).withMessage('hora_fin debe ser HH:MM'),
    body('canchas_disponibles').optional().isInt({ min: 1, max: 20 }),
    body('dias_juego').optional().isArray({ min: 1, max: 7 }).withMessage('dias_juego debe ser un array de enteros (0-6)'),
    body('dias_juego.*').optional().isInt({ min: 0, max: 6 }).withMessage('Cada día debe estar entre 0 (Dom) y 6 (Sáb)')
  ],
  CompetitionController.updateFase
)

// ============================================
// EDICIÓN DE JORNADAS
// ============================================
router.patch(
  '/jornadas/:id',
  [
    param('id').isUUID().withMessage('ID de jornada inválido'),
    body('fecha_tentativa').optional().isISO8601().withMessage('Fecha inválida. Debe incluir hora (ISO 8601).'),
    body('estado').optional().isIn(['programada', 'jugada', 'postergada', 'cerrada', 'vencida'])
  ],
  CompetitionController.updateJornada
)

router.patch(
  '/jornadas/:id/cerrar',
  [
    param('id').isUUID().withMessage('ID de jornada inválido')
  ],
  CompetitionController.updateJornada // Podemos usar el mismo controller si pasamos el estado en el payload
)

// ============================================
// AUTO-EXPIRACIÓN DE JORNADAS VENCIDAS
// ============================================
router.post(
  '/jornadas/auto-expirar',
  CompetitionController.autoExpirarJornadas
)

// ============================================
// GRUPOS
// ============================================
router.post(
  '/grupos',
  [
    body('fase_id').isUUID().withMessage('ID de fase inválido'),
    body('nombre').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Nombre inválido')
  ],
  CompetitionController.createGrupo
)

router.get(
  '/grupos/fase/:faseId',
  [
    param('faseId').isUUID().withMessage('ID de fase inválido')
  ],
  CompetitionController.getGruposByFase
)

router.patch(
  '/grupos/:id',
  [
    param('id').isUUID().withMessage('ID de grupo inválido'),
    body('nombre').isString().isLength({ min: 1, max: 100 }).withMessage('Nombre es requerido')
  ],
  CompetitionController.updateGrupo
)

router.delete(
  '/grupos/:id',
  [
    param('id').isUUID().withMessage('ID de grupo inválido')
  ],
  CompetitionController.deleteGrupo
)

router.post(
  '/grupos/:id/equipos',
  [
    param('id').isUUID().withMessage('ID de grupo inválido'),
    body('equipo_ids').isArray({ min: 1 }).withMessage('Se requiere una lista de IDs de equipos')
  ],
  CompetitionController.assignEquiposToGrupo
)

router.delete(
  '/grupos/:grupoId/equipos/:equipoId',
  [
    param('grupoId').isUUID().withMessage('ID de grupo inválido'),
    param('equipoId').isUUID().withMessage('ID de equipo inválido')
  ],
  CompetitionController.removeEquipoFromGrupo
)

export default router
