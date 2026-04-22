import { Router } from 'express'
import { body, param } from 'express-validator'
import { requireAuth, requireOrganizador, requireVerified } from '../middleware/auth.js'
import OrganizadorController from '../controllers/identity/OrganizadorController.js'
import LigaController from '../controllers/identity/LigaController.js'
import AuthController from '../controllers/identity/AuthController.js'

const router = Router()

// ============================================
// AUTH & ONBOARDING PUBLICO
// ============================================

// Login con JWT propio
router.post('/login', AuthController.login.bind(AuthController))
router.post('/logout', AuthController.logout.bind(AuthController))
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre_organizador').isLength({ min: 2, max: 100 }).withMessage('Nombre del organizador inválido'),
    body('telefono').notEmpty().withMessage('El teléfono es requerido').isString().matches(/^[\d\s+\-()]+$/).withMessage('Formato de teléfono no válido'),
    body('nombre_liga').isLength({ min: 3, max: 100 }).withMessage('Nombre de liga inválido'),
    body('slug').matches(/^[a-z0-9-]+$/).withMessage('Slug solo acepta letras minúsculas, números y guiones'),
    body('zona').optional().isLength({ max: 100 }),
    body('tipo_futbol').optional().isIn(['f5', 'f6', 'f7', 'f9', 'f11']).withMessage('Tipo de fútbol no válido')
  ],
  LigaController.register
)

// Nuevas rutas de pass y email
router.post('/verify-email', AuthController.verifyEmail.bind(AuthController))
router.post('/resend-verification', AuthController.resendVerification.bind(AuthController))
router.post('/forgot-password', AuthController.forgotPassword.bind(AuthController))
router.post('/reset-password', AuthController.resetPassword.bind(AuthController))

// ============================================
// ENDPOINTS PROTEGIDOS (Requieren ser Organizador)
// ============================================

router.post('/change-password', requireAuth, requireOrganizador, AuthController.changePassword.bind(AuthController))

// --- Perfil del Organizador ---
router.get('/me', requireAuth, requireOrganizador, OrganizadorController.getMe)

router.post(
  '/organizador',
  requireAuth,
  [
    body('nombre').isLength({ min: 2, max: 100 }).withMessage('Nombre inválido')
  ],
  OrganizadorController.createOrganizador
)

router.put(
  '/me',
  requireAuth,
  requireOrganizador,
  [
    body('nombre').optional().isLength({ min: 2, max: 100 }),
    body('telefono').optional().isString()
  ],
  OrganizadorController.updateMe
)

// --- Ligas del Organizador ---
router.get('/ligas', requireAuth, requireOrganizador, requireVerified, LigaController.getMyLigas)

router.post(
  '/ligas',
  requireAuth,
  requireOrganizador,
  requireVerified,
  [
    body('nombre').isLength({ min: 3, max: 100 }).withMessage('Nombre de liga inválido'),
    body('slug').matches(/^[a-z0-9-]+$/).withMessage('Slug solo acepta letras minúsculas, números y guiones'),
    body('zona').optional().isLength({ max: 100 }),
    body('tipo_futbol').optional().isIn(['f5', 'f6', 'f7', 'f9', 'f11']).withMessage('Tipo de fútbol no válido')
  ],
  LigaController.createLiga
)

router.put(
  '/ligas/:id',
  requireAuth,
  requireOrganizador,
  requireVerified,
  [
    param('id').isUUID().withMessage('ID de liga no válido'),
    body('nombre').optional().isLength({ min: 3, max: 100 }),
    body('zona').optional().isLength({ max: 100 }),
    body('descripcion').optional().isString(),
    body('logo_url').optional().isURL().withMessage('URL de logo inválida')
  ],
  LigaController.updateLiga
)

export default router
