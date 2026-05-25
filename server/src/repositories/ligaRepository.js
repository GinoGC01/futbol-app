import { supabaseAdmin } from '../lib/supabase.js'

export const ligaRepository = {
  async getOrganizadorActiveLeaguesLimit(organizadorId) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('active_leagues_limit')
      .eq('id', organizadorId)
      .single()
    return { data, error }
  },

  async countLigasByOrganizador(organizadorId) {
    const { count, error } = await supabaseAdmin
      .from('liga')
      .select('*', { count: 'exact', head: true })
      .eq('organizador_id', organizadorId)
    return { count, error }
  },

  async createLiga(payload) {
    const { data, error } = await supabaseAdmin
      .from('liga')
      .insert([payload])
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, monto_inscripcion, created_at')
      .single()
    return { data, error }
  },

  async countLigasBySlug(slug) {
    const { count, error } = await supabaseAdmin
      .from('liga')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug)
    return { count, error }
  },

  async findLigasByOrganizador(organizadorId) {
    const { data, error } = await supabaseAdmin
      .from('liga')
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, monto_inscripcion, created_at')
      .eq('organizador_id', organizadorId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  async updateLiga(ligaId, organizadorId, updates) {
    const { data, error } = await supabaseAdmin
      .from('liga')
      .update(updates)
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId)
      .select('id, nombre, slug, zona, descripcion, logo_url, monto_inscripcion')
      .single()
    return { data, error }
  },

  async findLigaOwnership(ligaId, organizadorId) {
    const { data, error } = await supabaseAdmin
      .from('liga')
      .select('id')
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId)
      .maybeSingle()
    return { data, error }
  },

  async getDashboardStats(ligaId) {
    const [matchesResult, paymentsResult] = await Promise.all([
      supabaseAdmin
        .from('partido')
        .select(`
          id,
          jornada!inner(
            fase!inner(
              temporada!inner(liga_id)
            )
          )
        `, { count: 'exact', head: true })
        .eq('estado', 'finalizado')
        .eq('jornada.fase.temporada.liga_id', ligaId),

      supabaseAdmin
        .from('inscripcion_equipo')
        .select('id, temporada!inner(liga_id)', { count: 'exact', head: true })
        .eq('temporada.liga_id', ligaId)
        .neq('estado_pago', 'pagado')
    ])
    return { matchesResult, paymentsResult }
  },

  async deleteLigaCascade(ligaId, organizadorId) {
    const { error } = await supabaseAdmin.rpc('delete_liga_cascade', {
      p_liga_id: ligaId,
      p_organizador_id: organizadorId
    })
    return { error }
  },

  async findLigaTipoFutbol(id) {
    const { data, error } = await supabaseAdmin
      .from('liga')
      .select('tipo_futbol')
      .eq('id', id)
      .single()
    return { data, error }
  }
}

export default ligaRepository;
