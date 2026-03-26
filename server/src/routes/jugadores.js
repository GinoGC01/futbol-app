import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'

const router = Router()

// GET /api/jugadores?equipo_id=xxx — público
router.get('/', async (req, res) => {
  const { equipo_id } = req.query
  if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' })

  const { data, error } = await supabaseAdmin
    .from('jugadores')
    .select('id, nombre, dorsal, posicion, activo')
    .eq('equipo_id', equipo_id)
    .eq('activo', true)
    .order('dorsal')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/jugadores — crear (admin)
router.post('/',
  requireAuth,
  requireTenant,
  body('nombre').isLength({ min: 2, max: 80 }),
  body('equipo_id').isUUID(),
  body('dorsal').optional().isInt({ min: 1, max: 99 }),
  body('posicion').optional().isIn(['arquero','defensor','mediocampista','delantero']),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    // Verificar que el equipo pertenece a esta liga
    const { data: equipo } = await supabaseAdmin
      .from('equipos')
      .select('liga_id')
      .eq('id', req.body.equipo_id)
      .single()

    if (!equipo || equipo.liga_id !== req.ligaId) {
      return res.status(403).json({ error: 'Equipo no pertenece a tu liga' })
    }

    const { nombre, equipo_id, dorsal, posicion } = req.body
    const { data, error } = await supabaseAdmin
      .from('jugadores')
      .insert({ nombre, equipo_id, dorsal, posicion })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

export default router
