import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { requireAuth, requireOrganizador } from '../middleware/auth.js'
import EquipoController from '../controllers/roster/EquipoController.js'
import JugadorController from '../controllers/roster/JugadorController.js'
import InscripcionController from '../controllers/roster/InscripcionController.js'

const router = Router()

// Todas las rutas de roster requieren ser organizador
router.use(requireAuth, requireOrganizador)

// ============================================
// EQUIPOS
// ============================================
router.post(
  '/equipos',
  [
    body('liga_id').isUUID().withMessage('ID de liga requerido'),
    body('nombre').isString().isLength({ min: 2, max: 100 }).withMessage('Nombre de equipo inválido'),
    body('escudo_url').optional().isURL().withMessage('URL de escudo inválida'),
    body('color_principal').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color en formato #RRGGBB')
  ],
  EquipoController.create
)

router.get(
  '/equipos',
  [
    query('liga_id').isUUID().withMessage('ID de liga requerido para listar equipos')
  ],
  EquipoController.getByLiga
)

router.put(
  '/equipos/:id',
  [
    param('id').isUUID().withMessage('ID de equipo inválido'),
    body('nombre').optional().isString().isLength({ min: 2, max: 100 }),
    body('escudo_url').optional().isURL(),
    body('color_principal').optional().matches(/^#[0-9A-Fa-f]{6}$/)
  ],
  EquipoController.update
)

// ============================================
// JUGADORES (recurso global)
// ============================================
router.post(
  '/jugadores',
  [
    body('nombre').isString().isLength({ min: 2, max: 100 }).withMessage('Nombre del jugador inválido'),
    body('apellido').isString().isLength({ min: 2, max: 100 }).withMessage('Apellido del jugador inválido'),
    body('fecha_nacimiento').optional().isISO8601().withMessage('Fecha de nacimiento inválida (YYYY-MM-DD)'),
    body('dni').optional().isString(),
    body('foto_url').optional().isURL()
  ],
  JugadorController.getOrCreate
)

router.get(
  '/jugadores/search',
  [
    query('q').isString().isLength({ min: 2 }).withMessage('La búsqueda debe tener al menos 2 caracteres')
  ],
  JugadorController.search
)

// ============================================
// INSCRIPCIONES
// ============================================
router.post(
  '/inscripciones/equipo',
  [
    body('equipo_id').isUUID().withMessage('ID de equipo requerido'),
    body('temporada_id').isUUID().withMessage('ID de temporada requerido'),
    body('monto_total').optional().isFloat({ min: 0 }).withMessage('Monto total debe ser positivo'),
    body('limite_jugadores').optional().isInt({ min: 5, max: 50 }).withMessage('Límite entre 5 y 50')
  ],
  InscripcionController.inscribirEquipo
)

router.post(
  '/inscripciones/jugador',
  [
    body('plantel_id').isUUID().withMessage('ID de plantel requerido'),
    body('jugador_id').isUUID().withMessage('ID de jugador requerido'),
    body('dorsal').optional().isInt({ min: 0, max: 99 }).withMessage('Dorsal entre 0 y 99'),
    body('posicion').optional().isIn(['arquero', 'defensor', 'mediocampista', 'delantero']).withMessage('Posición no válida')
  ],
  InscripcionController.agregarJugador
)

router.patch(
  '/inscripciones/pago/:id',
  [
    param('id').isUUID().withMessage('ID de inscripción inválido'),
    body('monto_abonado').isFloat({ min: 0 }).withMessage('Monto abonado debe ser un número positivo')
  ],
  InscripcionController.actualizarPago
)

router.get(
  '/inscripciones',
  [
    query('temporada_id').isUUID().withMessage('ID de temporada requerido')
  ],
  InscripcionController.getByTemporada
)

export default router
