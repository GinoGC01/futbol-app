import { Router } from 'express'
import { body, param } from 'express-validator'
import { requireAuth, requireOrganizador } from '../middleware/auth.js'
import MatchController from '../controllers/match/MatchController.js'
import IncidentController from '../controllers/match/IncidentController.js'

const router = Router()

// Todas las rutas del dominio de partidos requieren ser organizador
router.use(requireAuth, requireOrganizador)

// ============================================
// PARTIDOS — Gestión y Agenda
// ============================================
router.post(
  '/partidos',
  [
    body('jornada_id').isUUID().withMessage('ID de jornada requerido'),
    body('equipo_local_id').isUUID().withMessage('ID de equipo local requerido'),
    body('equipo_visitante_id').isUUID().withMessage('ID de equipo visitante requerido'),
    body('fecha_hora').optional().isISO8601().withMessage('Fecha/hora inválida'),
    body('cancha').optional().isString().isLength({ min: 2 })
  ],
  MatchController.create
)

router.patch(
  '/partidos/:id/estado',
  [
    param('id').isUUID().withMessage('ID de partido inválido'),
    body('estado').isIn(['programado', 'en_juego', 'finalizado', 'postergado', 'suspendido'])
      .withMessage('Estado no válido')
  ],
  MatchController.cambiarEstado
)

router.patch(
  '/partidos/:id/resultado',
  [
    param('id').isUUID().withMessage('ID de partido inválido'),
    body('goles_local').isInt({ min: 0 }).withMessage('Goles local debe ser un entero >= 0'),
    body('goles_visitante').isInt({ min: 0 }).withMessage('Goles visitante debe ser un entero >= 0')
  ],
  MatchController.registrarResultado
)

router.patch(
  '/partidos/:id/logistica',
  [
    param('id').isUUID().withMessage('ID de partido inválido'),
    body('fecha_hora').optional().isISO8601(),
    body('cancha').optional().isString().isLength({ min: 2 })
  ],
  MatchController.updateLogistica
)

router.get(
  '/partidos/jornada/:jornadaId',
  [
    param('jornadaId').isUUID().withMessage('ID de jornada inválido')
  ],
  MatchController.getFixture
)

// ============================================
// EVENTOS — Goles y Tarjetas (Minuto a Minuto)
// ============================================
router.post(
  '/partidos/:id/goles',
  [
    param('id').isUUID().withMessage('ID de partido inválido'),
    body('inscripcion_jugador_id').isUUID().withMessage('ID de inscripción de jugador requerido'),
    body('minuto').optional().isInt({ min: 0, max: 130 }).withMessage('Minuto entre 0 y 130'),
    body('es_penal').optional().isBoolean(),
    body('es_contra').optional().isBoolean()
  ],
  IncidentController.registrarGol
)

router.post(
  '/partidos/:id/tarjetas',
  [
    param('id').isUUID().withMessage('ID de partido inválido'),
    body('inscripcion_jugador_id').isUUID().withMessage('ID de inscripción de jugador requerido'),
    body('tipo').isIn(['amarilla', 'roja', 'doble_amarilla']).withMessage('Tipo de tarjeta no válido'),
    body('minuto').optional().isInt({ min: 0, max: 130 }).withMessage('Minuto entre 0 y 130')
  ],
  IncidentController.registrarTarjeta
)

router.get(
  '/partidos/:id/eventos',
  [
    param('id').isUUID().withMessage('ID de partido inválido')
  ],
  IncidentController.getEventos
)

// ============================================
// SANCIONES — Gestión Disciplinaria
// ============================================
router.post(
  '/sanciones',
  [
    body('inscripcion_jugador_id').isUUID().withMessage('ID de inscripción de jugador requerido'),
    body('causa').isString().isLength({ min: 3, max: 500 }).withMessage('Causa requerida (3-500 caracteres)'),
    body('fechas_suspension').optional().isInt({ min: 1, max: 52 }).withMessage('Fechas entre 1 y 52')
  ],
  IncidentController.crearSancionManual
)

router.patch(
  '/sanciones/:id/cumplir',
  [
    param('id').isUUID().withMessage('ID de sanción inválido')
  ],
  IncidentController.cumplirSancion
)

router.get(
  '/elegibilidad/:inscripcionJugadorId',
  [
    param('inscripcionJugadorId').isUUID().withMessage('ID de inscripción de jugador inválido')
  ],
  IncidentController.verificarElegibilidad
)

export default router
