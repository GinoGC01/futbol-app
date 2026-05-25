import { supabaseAdmin } from '../lib/supabase.js'

export const eventoRepository = {
  async findInscripcionWithPlantel(inscripcionJugadorId) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .select(`
        id, estado,
        plantel:plantel!inner(equipo_id, temporada_id)
      `)
      .eq('id', inscripcionJugadorId)
      .maybeSingle()
  },

  async createGol(payload) {
    return await supabaseAdmin
      .from('gol')
      .insert([payload])
      .select('id, partido_id, inscripcion_jugador_id, minuto, es_penal, es_contra')
      .single()
  },

  async findGolesWithEquiposByPartido(partidoId) {
    return await supabaseAdmin
      .from('gol')
      .select(`
        id, es_contra,
        inscripcion_jugador:inscripcion_jugador!inner(
          plantel:plantel!inner(equipo_id)
        )
      `)
      .eq('partido_id', partidoId)
  },

  async createTarjeta(payload) {
    return await supabaseAdmin
      .from('tarjeta')
      .insert([payload])
      .select('id, partido_id, inscripcion_jugador_id, tipo, minuto')
      .single()
  },

  async findGolesByPartido(partidoId) {
    return await supabaseAdmin
      .from('gol')
      .select(`
        id, minuto, es_penal, es_contra,
        inscripcion_jugador:inscripcion_jugador!inner(
          id, dorsal,
          jugador:jugador!inner(nombre, apellido),
          plantel:plantel!inner(equipo:equipo!inner(id, nombre))
        )
      `)
      .eq('partido_id', partidoId)
      .order('minuto', { ascending: true })
  },

  async findGolById(golId) {
    return await supabaseAdmin
      .from('gol')
      .select('id, partido_id, inscripcion_jugador_id, minuto, es_penal, es_contra')
      .eq('id', golId)
      .maybeSingle()
  },

  async updateGol(golId, payload) {
    return await supabaseAdmin
      .from('gol')
      .update(payload)
      .eq('id', golId)
      .select('id, partido_id, inscripcion_jugador_id, minuto, es_penal, es_contra')
      .single()
  },

  async deleteGol(golId) {
    return await supabaseAdmin
      .from('gol')
      .delete()
      .eq('id', golId)
      .select('id, partido_id')
      .single()
  },

  async findTarjetaById(tarjetaId) {
    return await supabaseAdmin
      .from('tarjeta')
      .select('id, partido_id, inscripcion_jugador_id, tipo, minuto')
      .eq('id', tarjetaId)
      .maybeSingle()
  },

  async updateTarjeta(tarjetaId, payload) {
    return await supabaseAdmin
      .from('tarjeta')
      .update(payload)
      .eq('id', tarjetaId)
      .select('id, partido_id, inscripcion_jugador_id, tipo, minuto')
      .single()
  },

  async deleteTarjeta(tarjetaId) {
    return await supabaseAdmin
      .from('tarjeta')
      .delete()
      .eq('id', tarjetaId)
      .select('id, partido_id')
      .single()
  },

  async findTarjetasByPartido(partidoId) {
    return await supabaseAdmin
      .from('tarjeta')
      .select(`
        id, minuto, tipo,
        inscripcion_jugador:inscripcion_jugador!inner(
          id, dorsal,
          jugador:jugador!inner(nombre, apellido),
          plantel:plantel!inner(equipo:equipo!inner(id, nombre))
        )
      `)
      .eq('partido_id', partidoId)
      .order('minuto', { ascending: true })
  }
}
