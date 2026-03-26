import { supabaseAdmin } from '../lib/supabase.js'

export async function requireTenant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' })
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('liga_id')
    .eq('id', req.user.id)
    .single()

  if (error || !data) {
    return res.status(403).json({ error: 'Sin liga asociada' })
  }

  req.ligaId = data.liga_id
  next()
}
