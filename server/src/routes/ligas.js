import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'

const router = Router()

// GET /api/ligas/search?q=texto — búsqueda pública
router.get('/search', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' })
  }

  const { data, error } = await supabaseAdmin
    .from('ligas')
    .select('id, nombre, slug, zona, logo_url')
    .ilike('nombre', `%${q}%`)
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/ligas/:slug — datos públicos de una liga
router.get('/:slug', async (req, res) => {
  const { data: liga, error } = await supabaseAdmin
    .from('ligas')
    .select('id, nombre, slug, zona, logo_url')
    .eq('slug', req.params.slug)
    .single()

  if (error || !liga) return res.status(404).json({ error: 'Liga no encontrada' })

  const { data: temporada } = await supabaseAdmin
    .from('temporadas')
    .select('id, nombre, inicio, fin')
    .eq('liga_id', liga.id)
    .eq('activa', true)
    .maybeSingle()

  res.json({ ...liga, temporada_activa: temporada ?? null })
})

// PUT /api/ligas/me — actualizar datos propios (admin)
router.put('/me',
  requireAuth,
  requireTenant,
  body('nombre').optional().isLength({ min: 3, max: 100 }),
  body('zona').optional().isLength({ max: 100 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const updates = {}
    if (req.body.nombre) updates.nombre = req.body.nombre
    if (req.body.zona !== undefined) updates.zona = req.body.zona

    const { data, error } = await supabaseAdmin
      .from('ligas')
      .update(updates)
      .eq('id', req.ligaId)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  }
)

export default router
