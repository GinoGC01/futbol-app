import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { requireAuth, requireOrganizador } from '../middleware/auth.js'
import CompetitionController from '../controllers/competition/CompetitionController.js'

const router = Router()

// Todas las rutas de competencia requieren ser organizador
router.use(requireAuth, requireOrganizador)

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
    body('ida_y_vuelta').optional().isBoolean()
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
    body('cantidad').isInt({ min: 1, max: 100 }).withMessage('La cantidad debe ser un entero entre 1 y 100')
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
    body('ida_y_vuelta').optional().isBoolean()
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
    body('fecha_tentativa').optional().isISO8601().withMessage('Fecha inválida')
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

export default router
