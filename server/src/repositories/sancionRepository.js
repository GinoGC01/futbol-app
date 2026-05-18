import { supabaseAdmin } from '../lib/supabase.js'

export const sancionRepository = {
  async createSancion(payload) {
    return await supabaseAdmin
      .from('sancion_jugador')
      .insert([payload])
      .select('id, inscripcion_jugador_id, tarjeta_id, causa, fechas_suspension, estado')
      .single()
  },

  async updateInscripcionEstado(inscripcionJugadorId, estado) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .update({ estado })
      .eq('id', inscripcionJugadorId)
  },

  async findSancionesByInscripcionAndEstado(inscripcionJugadorId, estado) {
    return await supabaseAdmin
      .from('sancion_jugador')
      .select('id, causa, fechas_suspension, estado')
      .eq('inscripcion_jugador_id', inscripcionJugadorId)
      .eq('estado', estado)
  },

  async findSancionWithOwnership(sancionId) {
    return await supabaseAdmin
      .from('sancion_jugador')
      .select(`
        id, estado, inscripcion_jugador_id,
        inscripcion_jugador:inscripcion_jugador!inner(
          plantel:plantel!inner(
            equipo:equipo!inner(liga_id)
          )
        )
      `)
      .eq('id', sancionId)
      .maybeSingle()
  },

  async updateSancionEstado(sancionId, estado) {
    return await supabaseAdmin
      .from('sancion_jugador')
      .update({ estado })
      .eq('id', sancionId)
      .select('id, estado, fechas_suspension')
      .single()
  }
}
