import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth, requireOrganizador } from '../middleware/auth.js'

const router = Router()

// GET /api/alerts?liga_id=...
router.get('/', requireAuth, requireOrganizador, async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id es requerido' })

    const { data, error } = await supabaseAdmin
      .from('alerta')
      .select('*')
      .eq('liga_id', liga_id)
      .eq('resuelta', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', requireAuth, requireOrganizador, async (req, res, next) => {
  try {
    const { id } = req.params
    const { error } = await supabaseAdmin
      .from('alerta')
      .update({ resuelta: true })
      .eq('id', id)

    if (error) throw error
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

// POST /api/alerts/evaluate (Manual trigger)
router.post('/evaluate', requireAuth, requireOrganizador, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin.rpc('evaluar_alertas')
    if (error) throw error
    res.json({ data: { message: 'Evaluación completada' } })
  } catch (err) {
    next(err)
  }
})

export default router
