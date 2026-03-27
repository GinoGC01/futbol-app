import { Router } from 'express'
import { query, param } from 'express-validator'
import StatController from '../controllers/awards/StatController.js'

const router = Router()

// ============================================
// RUTAS PÚBLICAS — Sin autenticación
// Cualquiera puede ver estadísticas desde su celular
// ============================================

// Tabla de posiciones de una fase o temporada
router.get(
  '/tabla',
  [
    query('fase_id').optional().isUUID(),
    query('temporada_id').optional().isUUID()
  ],
  StatController.getTablaPosiciones
)

// Ranking de goleadores
router.get(
  '/goleadores',
  [
    query('temporada_id').optional().isUUID(),
    query('fase_id').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  StatController.getGoleadores
)

// Ranking de tarjetas
router.get(
  '/tarjetas',
  [
    query('temporada_id').optional().isUUID(),
    query('fase_id').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  StatController.getTarjetas
)

// Fixture de una jornada
router.get(
  '/fixture/:jornadaId',
  [param('jornadaId').isUUID().withMessage('ID de jornada inválido')],
  StatController.getFixture
)

// Detalle de un equipo
router.get(
  '/equipo/:id/detalle',
  [param('id').isUUID().withMessage('ID de equipo inválido')],
  StatController.getEquipoDetalle
)

// Premios publicados de una temporada (solo publicados=true)
router.get(
  '/premios',
  [query('temporada_id').isUUID().withMessage('temporada_id requerido')],
  StatController.getPremiosPublicados
)

export default router
