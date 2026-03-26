import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

// GET /api/stats/tabla?temporada_id=xxx
router.get('/tabla', async (req, res) => {
  const { temporada_id } = req.query
  if (!temporada_id) return res.status(400).json({ error: 'temporada_id requerido' })

  const { data, error } = await supabaseAdmin
    .from('vista_tabla_posiciones')
    .select('*')
    .eq('temporada_id', temporada_id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/stats/goleadores?temporada_id=xxx
router.get('/goleadores', async (req, res) => {
  const { temporada_id } = req.query
  if (!temporada_id) return res.status(400).json({ error: 'temporada_id requerido' })

  const { data, error } = await supabaseAdmin
    .from('vista_goleadores')
    .select('*')
    .eq('temporada_id', temporada_id)
    .gt('goles', 0)
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/stats/tarjetas?temporada_id=xxx
router.get('/tarjetas', async (req, res) => {
  const { temporada_id } = req.query
  if (!temporada_id) return res.status(400).json({ error: 'temporada_id requerido' })

  const { data, error } = await supabaseAdmin
    .from('vista_tarjetas')
    .select('*')
    .eq('temporada_id', temporada_id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

export default router
