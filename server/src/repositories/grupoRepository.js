import { supabaseAdmin } from '../lib/supabase.js'

export const grupoRepository = {
  async findLatestGrupoOrden(faseId) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .select('orden')
      .eq('fase_id', faseId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error }
  },

  async createGrupo(payload) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .insert([payload])
      .select()
      .single()
    return { data, error }
  },

  async findGruposByFase(faseId) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .select(`
        id, fase_id, nombre, orden, created_at,
        grupo_equipo(
          id,
          equipo_id,
          equipo:equipo(id, nombre, escudo_url, color_principal)
        )
      `)
      .eq('fase_id', faseId)
      .order('orden', { ascending: true })
    return { data, error }
  },

  async findGrupoById(id) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .select(`
        id, fase_id, nombre, orden, created_at,
        grupo_equipo(
          id,
          equipo_id,
          equipo:equipo(id, nombre, escudo_url, color_principal)
        )
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  },

  async updateGrupo(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async deleteGrupo(id) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .delete()
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async createGrupoEquipos(payloads) {
    const { data, error } = await supabaseAdmin
      .from('grupo_equipo')
      .insert(payloads)
      .select()
    return { data, error }
  },

  async removeEquipoFromGrupo(grupoId, equipoId) {
    const { data, error } = await supabaseAdmin
      .from('grupo_equipo')
      .delete()
      .eq('grupo_id', grupoId)
      .eq('equipo_id', equipoId)
      .select()
    return { data, error }
  },

  async clearEquiposFromGrupo(grupoId) {
    const { data, error } = await supabaseAdmin
      .from('grupo_equipo')
      .delete()
      .eq('grupo_id', grupoId)
      .select()
    return { data, error }
  },

  async findGrupoOwnershipCheck(id) {
    const { data, error } = await supabaseAdmin
      .from('grupo')
      .select(`
        id, fase_id, nombre, orden,
        fase:fase(
          id, temporada_id,
          temporada:temporada(id, liga_id, estado)
        )
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  },

  async findEquiposEnGruposDeFase(faseId) {
    // Busca todos los equipos que ya están en algún grupo de la fase especificada
    const { data, error } = await supabaseAdmin
      .from('grupo_equipo')
      .select(`
        equipo_id,
        grupo_id,
        grupo:grupo!inner(fase_id)
      `)
      .eq('grupo.fase_id', faseId)
    return { data, error }
  }
}

export default grupoRepository
