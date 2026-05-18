import { supabaseAdmin } from '../lib/supabase.js'

export const partidoRepository = {
  async findPartidoWithOwnership(partidoId) {
    return await supabaseAdmin
      .from('partido')
      .select(`
        id, estado, goles_local, goles_visitante,
        equipo_local_id, equipo_visitante_id,
        jornada_id, fecha_hora, cancha,
        jornada:jornada!inner(
          id, fase_id, estado,
          fase:fase!inner(
            id, temporada_id,
            temporada:temporada!inner(
              id, estado, liga_id
            )
          )
        )
      `)
      .eq('id', partidoId)
      .maybeSingle()
  },

  async findJornadaForPartidoCreation(jornadaId) {
    return await supabaseAdmin
      .from('jornada')
      .select(`
        id, estado,
        fase:fase!inner(
          temporada_id,
          temporada:temporada!inner(estado, liga_id)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()
  },

  async findEquiposForValidation(equipoIds) {
    return await supabaseAdmin
      .from('equipo')
      .select('id, liga_id')
      .in('id', equipoIds)
  },

  async createPartido(payload) {
    return await supabaseAdmin
      .from('partido')
      .insert([payload])
      .select('id, jornada_id, equipo_local_id, equipo_visitante_id, estado, fecha_hora, cancha')
      .single()
  },

  async updatePartidoEstado(partidoId, nuevoEstado) {
    return await supabaseAdmin
      .from('partido')
      .update({ estado: nuevoEstado })
      .eq('id', partidoId)
      .select('id, estado, goles_local, goles_visitante')
      .single()
  },

  async updatePartidoResultado(partidoId, golesLocal, golesVisitante) {
    return await supabaseAdmin
      .from('partido')
      .update({
        goles_local: Number(golesLocal),
        goles_visitante: Number(golesVisitante)
      })
      .eq('id', partidoId)
      .select('id, estado, goles_local, goles_visitante')
      .single()
  },

  async findJornadaWithOwnership(jornadaId) {
    return await supabaseAdmin
      .from('jornada')
      .select(`
        id, numero, estado, fecha_tentativa,
        fase:fase!inner(
          temporada_id,
          temporada:temporada!inner(liga_id)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()
  },

  async findPartidosByJornada(jornadaId) {
    return await supabaseAdmin
      .from('partido')
      .select(`
        id, estado, goles_local, goles_visitante, fecha_hora, cancha,
        equipo_local:equipo!equipo_local_id(id, nombre, escudo_url, color_principal),
        equipo_visitante:equipo!equipo_visitante_id(id, nombre, escudo_url, color_principal)
      `)
      .eq('jornada_id', jornadaId)
      .order('fecha_hora', { ascending: true })
  },

  async findTemporadaWithOwnership(temporadaId) {
    return await supabaseAdmin
      .from('temporada')
      .select('id, liga_id')
      .eq('id', temporadaId)
      .maybeSingle()
  },

  async findJornadasByTemporada(temporadaId) {
    return await supabaseAdmin
      .from('fase')
      .select('id, jornada(id)')
      .eq('temporada_id', temporadaId)
  },

  async findLiveMatchesByJornadas(jornadaIds) {
    return await supabaseAdmin
      .from('partido')
      .select(`
        id, estado, goles_local, goles_visitante,
        equipo_local:equipo!equipo_local_id(id, nombre),
        equipo_visitante:equipo!equipo_visitante_id(id, nombre)
      `)
      .in('estado', ['en_juego', 'entre_tiempo'])
      .in('jornada_id', jornadaIds)
  },

  async updatePartidoLogistica(partidoId, payload) {
    return await supabaseAdmin
      .from('partido')
      .update(payload)
      .eq('id', partidoId)
      .select('id, fecha_hora, cancha, estado')
      .single()
  },

  async findFaseForGeneration(faseId) {
    return await supabaseAdmin
      .from('fase')
      .select(`
        id, nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta, orden,
        temporada:temporada_id(
          id, liga_id, estado,
          liga:liga_id(id, tipo_futbol)
        ),
        jornadas:jornada(id, numero)
      `)
      .eq('id', faseId)
      .single()
  },

  async findEquiposValidosInLiga(ligaId, equipoIds) {
    return await supabaseAdmin
      .from('equipo')
      .select('id')
      .eq('liga_id', ligaId)
      .in('id', equipoIds)
  },

  async findInscripcionesTemporada(temporadaId, equipoIds) {
    return await supabaseAdmin
      .from('inscripcion_equipo')
      .select('equipo_id')
      .eq('temporada_id', temporadaId)
      .in('equipo_id', equipoIds)
  },

  async findPlantelesForRosterCheck(temporadaId, equipoIds) {
    return await supabaseAdmin
      .from('plantel')
      .select(`
        equipo_id,
        inscripciones:inscripcion_jugador(id, estado)
      `)
      .eq('temporada_id', temporadaId)
      .in('equipo_id', equipoIds)
  },

  async createJornadas(nuevasJornadas) {
    return await supabaseAdmin
      .from('jornada')
      .insert(nuevasJornadas)
      .select('id, numero')
  },

  async deletePartidosByJornadas(jornadaIds) {
    return await supabaseAdmin
      .from('partido')
      .delete()
      .in('jornada_id', jornadaIds)
  },

  async createPartidosBatch(allPartidos) {
    return await supabaseAdmin
      .from('partido')
      .insert(allPartidos)
      .select('id, jornada_id, equipo_local_id, equipo_visitante_id')
  },

  async findPartidoForSync(partidoId) {
    return await supabaseAdmin
      .from('partido')
      .select('id, equipo_local_id, equipo_visitante_id')
      .eq('id', partidoId)
      .single()
  },

  async updatePartidoMarcador(partidoId, golesLocal, golesVisitante) {
    return await supabaseAdmin
      .from('partido')
      .update({ goles_local: golesLocal, goles_visitante: golesVisitante })
      .eq('id', partidoId)
  }
}
