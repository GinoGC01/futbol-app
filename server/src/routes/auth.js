import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register — registro + onboarding de liga (transaccional)
// ENMIENDA 2: Crea usuario en Supabase Auth + liga + admin_users en una
// sola operación atómica usando la función SQL onboard_liga.
router.post('/register',
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre_liga').isLength({ min: 3, max: 100 }).withMessage('Nombre de liga inválido'),
  body('slug').matches(/^[a-z0-9-]+$/).withMessage('Slug solo acepta letras minúsculas, números y guiones'),
  body('zona').optional().isLength({ max: 100 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, password, nombre_liga, slug, zona } = req.body

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user.id

    // 2. Crear liga + vincular admin via función transaccional
    const { data: ligaId, error: onboardError } = await supabaseAdmin.rpc('onboard_liga', {
      p_user_id: userId,
      p_email: email,
      p_nombre: nombre_liga,
      p_slug: slug,
      p_zona: zona || null
    })

    if (onboardError) {
      // Rollback: eliminar usuario de auth si el onboarding falla
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return res.status(400).json({ error: onboardError.message })
    }

    res.status(201).json({
      message: 'Liga creada exitosamente',
      user_id: userId,
      liga_id: ligaId,
      slug
    })
  }
)

// GET /api/auth/me — datos del admin autenticado
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, liga_id, ligas(id, nombre, slug, zona, logo_url, plan)')
    .eq('id', req.user.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Perfil de admin no encontrado' })
  }

  res.json(data)
})

export default router
