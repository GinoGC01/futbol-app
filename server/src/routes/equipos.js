import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'

const router = Router()

// GET /api/equipos?liga_id=xxx — público
router.get('/', async (req, res) => {
  const { liga_id } = req.query
  if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })

  const { data, error } = await supabaseAdmin
    .from('equipos')
    .select('id, nombre, escudo_url, color_principal')
    .eq('liga_id', liga_id)
    .order('nombre')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/equipos — crear (admin)
router.post('/',
  requireAuth,
  requireTenant,
  body('nombre').isLength({ min: 2, max: 80 }).withMessage('Nombre inválido'),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { nombre, color_principal } = req.body
    const { data, error } = await supabaseAdmin
      .from('equipos')
      .insert({ liga_id: req.ligaId, nombre, color_principal })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

// PUT /api/equipos/:id — actualizar (admin)
router.put('/:id',
  requireAuth,
  requireTenant,
  body('nombre').optional().isLength({ min: 2, max: 80 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    // Verificar que el equipo pertenece a esta liga
    const { data: equipo } = await supabaseAdmin
      .from('equipos')
      .select('liga_id')
      .eq('id', req.params.id)
      .single()

    if (!equipo || equipo.liga_id !== req.ligaId) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const updates = {}
    const { nombre, color_principal, escudo_url } = req.body
    if (nombre) updates.nombre = nombre
    if (color_principal !== undefined) updates.color_principal = color_principal
    if (escudo_url !== undefined) updates.escudo_url = escudo_url

    const { data, error } = await supabaseAdmin
      .from('equipos')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  }
)

// DELETE /api/equipos/:id (admin)
router.delete('/:id', requireAuth, requireTenant, async (req, res) => {
  const { data: equipo } = await supabaseAdmin
    .from('equipos')
    .select('liga_id')
    .eq('id', req.params.id)
    .single()

  if (!equipo || equipo.liga_id !== req.ligaId) {
    return res.status(403).json({ error: 'No autorizado' })
  }

  const { error } = await supabaseAdmin
    .from('equipos')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

export default router
