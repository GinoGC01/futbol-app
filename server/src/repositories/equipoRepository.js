import { supabaseAdmin } from '../lib/supabase.js'

export const equipoRepository = {
  async createEquipo(payload) {
    return await supabaseAdmin
      .from('equipo')
      .insert([payload])
      .select('id, nombre, escudo_url, color_principal, created_at')
      .single()
  },

  async findEquiposByLiga(ligaId) {
    return await supabaseAdmin
      .from('equipo')
      .select(`
        id, nombre, escudo_url, color_principal, created_at,
        inscripciones:inscripcion_equipo(
          id, 
          temporada_id,
          temporada:temporada(id, nombre, estado, deleted_at)
        ),
        planteles:plantel(
          id,
          temporada_id,
          inscripciones:inscripcion_jugador(id)
        )
      `)
      .eq('liga_id', ligaId)
      .eq('activo', true)
      .order('nombre', { ascending: true })
  },

  async findEquipoById(equipoId) {
    return await supabaseAdmin
      .from('equipo')
      .select('id, liga_id, nombre, escudo_url')
      .eq('id', equipoId)
      .maybeSingle()
  },

  async findInscripcionesByEquipo(equipoId) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select('id, temporada:temporada(estado)')
      .eq('equipo_id', equipoId)
  },

  async updateEquipoActivo(equipoId, activo) {
    return await supabaseAdmin
      .from('equipo')
      .update({ activo })
      .eq('id', equipoId)
  },

  async updateEquipo(equipoId, payload) {
    return await supabaseAdmin
      .from('equipo')
      .update(payload)
      .eq('id', equipoId)
      .select('id, nombre, escudo_url, color_principal')
      .single()
  }
}
