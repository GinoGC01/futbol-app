import { supabaseAdmin } from '../lib/supabase.js'

export const inscripcionRepository = {
  async findEquipoById(equipoId) {
    return await supabaseAdmin
      .from('equipo')
      .select('id, liga_id, nombre')
      .eq('id', equipoId)
      .maybeSingle()
  },

  async createInscripcionEquipo(payload) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .insert([payload])
      .select('id, equipo_id, temporada_id, estado_pago, monto_total, monto_abonado, fecha_inscripcion')
      .single()
  },

  async deleteInscripcionEquipo(id) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .delete()
      .eq('id', id)
  },

  async createPlantel(payload) {
    return await supabaseAdmin
      .from('plantel')
      .insert([payload])
      .select('id, equipo_id, temporada_id, limite_jugadores')
      .single()
  },

  async findPlantelById(plantelId) {
    return await supabaseAdmin
      .from('plantel')
      .select(`
        id, equipo_id, temporada_id, limite_jugadores,
        equipo:equipo(liga_id, nombre)
      `)
      .eq('id', plantelId)
      .maybeSingle()
  },

  async countJugadoresInPlantel(plantelId) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .select('*', { count: 'exact', head: true })
      .eq('plantel_id', plantelId)
  },

  async findJugadorInscripcionInTemporada(jugadorId, temporadaId) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .select(`
        id,
        plantel:plantel!inner(equipo_id, temporada_id, equipo:equipo(nombre))
      `)
      .eq('jugador_id', jugadorId)
      .eq('plantel.temporada_id', temporadaId)
      .maybeSingle()
  },

  async createInscripcionJugador(payload) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .insert([payload])
      .select('id, jugador_id, plantel_id, dorsal, posicion, estado')
      .single()
  },

  async findInscripcionEquipoById(inscripcionId) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select(`
        id, monto_total, monto_abonado, 
        equipo:equipo(liga_id)
      `)
      .eq('id', inscripcionId)
      .maybeSingle()
  },

  async updateInscripcionEquipoPago(inscripcionId, payload) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .update(payload)
      .eq('id', inscripcionId)
      .select('id, equipo_id, temporada_id, estado_pago, monto_total, monto_abonado')
      .single()
  },

  async findInscripcionesByTemporada(temporadaId) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select(`
        id, estado_pago, monto_total, monto_abonado, fecha_inscripcion, equipo_id,
        equipo:equipo(id, nombre, escudo_url, color_principal)
      `)
      .eq('temporada_id', temporadaId)
      .order('fecha_inscripcion', { ascending: true })
  },

  async findPlantelesByTemporada(temporadaId) {
    return await supabaseAdmin
      .from('plantel')
      .select(`
        id, equipo_id, limite_jugadores,
        inscripciones:inscripcion_jugador(
          id, dorsal, posicion, estado,
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('temporada_id', temporadaId)
  },

  async findPlantelesByEquipo(equipoId) {
    return await supabaseAdmin
      .from('plantel')
      .select(`
        id, limite_jugadores, equipo_id, temporada_id, created_at,
        temporada:temporada(id, nombre, estado),
        inscripciones:inscripcion_jugador(
          id, dorsal, posicion, estado,
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('equipo_id', equipoId)
      .order('created_at', { ascending: false })
  },

  async findInscripcionesByEquipo(equipoId) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select('id, temporada_id, estado_pago, monto_total, monto_abonado, fecha_inscripcion')
      .eq('equipo_id', equipoId)
  },

  async findEquiposInIds(equipoIds) {
    return await supabaseAdmin
      .from('equipo')
      .select('id, liga_id, nombre')
      .in('id', equipoIds)
  },

  async findInscripcionesByTemporadaAndEquipos(temporadaId, equipoIds) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select('equipo_id')
      .eq('temporada_id', temporadaId)
      .in('equipo_id', equipoIds)
  },

  async createInscripcionesEquipoBatch(payload) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .insert(payload)
      .select('id, equipo_id')
  },

  async createPlantelesBatch(payload) {
    return await supabaseAdmin
      .from('plantel')
      .insert(payload)
  },

  async findJugadoresInscripcionesInTemporada(jugadorIds, temporadaId) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .select(`
        jugador_id,
        plantel:plantel!inner(equipo_id, temporada_id, equipo:equipo(nombre))
      `)
      .in('jugador_id', jugadorIds)
      .eq('plantel.temporada_id', temporadaId)
  },

  async createInscripcionesJugadorBatch(payload) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .insert(payload)
      .select('id, jugador_id, plantel_id, dorsal, posicion, estado')
  }
}
