import { Router } from 'express'
import { requireAuth, requireOrganizador, requireActiveStatus } from '../middleware/auth.js'
import AlertController from '../controllers/alerts/AlertController.js'

const router = Router()

// Todas las rutas de alertas requieren ser organizador y tener status activo
router.use(requireAuth, requireOrganizador, requireActiveStatus)

// GET /api/alerts?liga_id=...
router.get('/', AlertController.getUnresolvedAlerts)

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', AlertController.resolveAlert)

// POST /api/alerts/evaluate (Manual trigger)
router.post('/evaluate', AlertController.evaluateAlerts)

export default router
