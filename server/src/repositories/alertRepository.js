import { supabaseAdmin } from '../lib/supabase.js'

export const alertRepository = {
  async findUnresolvedByLiga(ligaId) {
    return await supabaseAdmin
      .from('alerta')
      .select('*')
      .eq('liga_id', ligaId)
      .eq('resuelta', false)
      .order('created_at', { ascending: false })
  },

  async resolveAlert(id) {
    return await supabaseAdmin
      .from('alerta')
      .update({ resuelta: true })
      .eq('id', id)
  },

  async triggerEvaluateAlerts() {
    return await supabaseAdmin.rpc('evaluar_alertas')
  }
}
