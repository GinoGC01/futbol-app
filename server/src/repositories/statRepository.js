import { supabaseAdmin } from '../lib/supabase.js'

export const statRepository = {
  getTablaPosicionesQuery() {
    return supabaseAdmin.from('vista_tabla_posiciones').select('*')
  },

  getGoleadoresQuery() {
    return supabaseAdmin.from('vista_goleadores').select('*')
  },

  getTarjetasQuery() {
    return supabaseAdmin.from('vista_tarjetas').select('*')
  },

  async findFixtureByJornada(jornadaId) {
    return await supabaseAdmin
      .from('vista_fixture')
      .select('*')
      .eq('jornada_id', jornadaId)
  },

  async findEquipoWithLiga(equipoId) {
    return await supabaseAdmin
      .from('equipo')
      .select('*, liga:liga_id(*)')
      .eq('id', equipoId)
      .maybeSingle()
  },

  async findLatestInscripcionEquipo(equipoId) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select('id, temporada_id, plantel_id, temporada!inner(deleted_at)')
      .eq('equipo_id', equipoId)
      .is('temporada.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  },

  async findTablaPosicionesForEquipo(equipoId, temporadaId) {
    return await supabaseAdmin
      .from('vista_tabla_posiciones')
      .select('*')
      .eq('equipo_id', equipoId)
      .eq('temporada_id', temporadaId)
      .maybeSingle()
  },

  async findInscripcionJugadorWithJugador(plantelId) {
    return await supabaseAdmin
      .from('inscripcion_jugador')
      .select('*, jugador(*)')
      .eq('plantel_id', plantelId)
  },

  async findFixtureForEquipo(equipoId, temporadaId) {
    return await supabaseAdmin
      .from('vista_fixture')
      .select('*')
      .eq('temporada_id', temporadaId)
      .or(`local_id.eq.${equipoId},visitante_id.eq.${equipoId}`)
  },

  async findPagosByEquipo(equipoId) {
    return await supabaseAdmin
      .from('vista_pagos')
      .select('*')
      .eq('equipo_id', equipoId)
  },

  async findPremiosPublicados(temporadaId) {
    return await supabaseAdmin
      .from('premio')
      .select(`
        id, nombre, descripcion, criterio, categoria, premio_fisico, imagen_url,
        ganadores:ganador_premio(
          id, valor_record, nota_desempate, compartido,
          equipo:equipo(id, nombre, escudo_url),
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('temporada_id', temporadaId)
      .eq('publicado', true)
  }
}
