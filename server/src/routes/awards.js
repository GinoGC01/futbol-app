import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { requireAuth, requireOrganizador } from '../middleware/auth.js'
import AwardController from '../controllers/awards/AwardController.js'

const router = Router()

// Todas las rutas de premios requieren ser organizador
router.use(requireAuth, requireOrganizador)

// ============================================
// PREMIOS — Admin protegido
// ============================================

// Listar premios de una temporada (vista admin, incluye no publicados)
router.get(
  '/premios',
  [query('temporada_id').isUUID().withMessage('temporada_id requerido')],
  AwardController.getPremios
)

// Crear definición de premio
router.post(
  '/premios',
  [
    body('temporada_id').isUUID().withMessage('temporada_id requerido'),
    body('fase_id').optional().isUUID(),
    body('nombre').isString().isLength({ min: 3, max: 100 }).withMessage('Nombre del premio (3-100 caracteres)'),
    body('descripcion').optional().isString().isLength({ max: 500 }),
    body('criterio').isIn([
      'goleador', 'valla_invicta', 'valla_menos_vencida',
      'asistencia', 'posicion_tabla', 'fair_play', 'personalizado'
    ]).withMessage('Criterio no válido'),
    body('categoria').isIn(['jugador', 'equipo']).withMessage('Categoría: jugador o equipo'),
    body('premio_fisico').optional().isString().isLength({ max: 200 }),
    body('imagen_url').optional({ checkFalsy: true }).isURL()
  ],
  AwardController.crearPremio
)

// Escrutinio fino: análisis de candidatos
router.get(
  '/premios/:id/analisis',
  [param('id').isUUID().withMessage('ID de premio inválido')],
  AwardController.sugerirGanadores
)

// Asignar ganador
router.post(
  '/premios/:id/ganadores',
  [
    param('id').isUUID().withMessage('ID de premio inválido'),
    body('equipo_id').optional().isUUID(),
    body('jugador_id').optional().isUUID(),
    body('valor_record').optional().isString().isLength({ max: 200 }),
    body('nota_desempate').optional().isString().isLength({ max: 500 }),
    body('compartido').optional().isBoolean()
  ],
  AwardController.asignarGanador
)

// Publicar/despublicar premio
router.patch(
  '/premios/:id/publicar',
  [
    param('id').isUUID().withMessage('ID de premio inválido'),
    body('publicado').isBoolean().withMessage('publicado debe ser true o false')
  ],
  AwardController.togglePublicacion
)

export default router
