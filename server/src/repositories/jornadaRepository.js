import { supabaseAdmin } from '../lib/supabase.js'

export const jornadaRepository = {
  async findFaseTemporadaLiga(faseId) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .select(`
        temporada_id,
        temporada:temporada(liga_id)
      `)
      .eq('id', faseId)
      .maybeSingle()
    return { data, error }
  },

  async findLatestJornadaNumero(faseId) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .select('numero')
      .eq('fase_id', faseId)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error }
  },

  async insertJornadas(payloads) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .insert(payloads)
      .select('id, numero, estado, fecha_tentativa')
    return { data, error }
  },

  async findJornadaOwnershipCheck(id) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .select(`
        id, fase_id, estado, fecha_tentativa,
        fase:fase(
          temporada_id,
          temporada:temporada(liga_id, estado)
        )
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  },

  async postponeProgrammedMatchesByJornada(jornadaId) {
    const { data, error } = await supabaseAdmin
      .from('partido')
      .update({ estado: 'postergado' })
      .eq('jornada_id', jornadaId)
      .eq('estado', 'programado')
      .select()
    return { data, error }
  },

  async updateJornada(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .update(updates)
      .eq('id', id)
      .select('id, numero, estado, fecha_tentativa')
      .single()
    return { data, error }
  },

  /**
   * Busca jornadas cuya fecha_tentativa ya pasó y aún están en estado activo (programada/jugada).
   */
  async findExpiredJornadas() {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .select('id, fase_id, numero, fecha_tentativa, estado')
      .in('estado', ['programada', 'jugada'])
      .lt('fecha_tentativa', new Date().toISOString())
    return { data, error }
  },

  /**
   * Actualiza el estado de múltiples jornadas en batch.
   */
  async batchUpdateEstado(ids, estado) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .update({ estado })
      .in('id', ids)
      .select('id, numero, estado')
    return { data, error }
  },

  /**
   * Obtiene la configuración horaria de la fase a la que pertenece una jornada.
   */
  async findFaseConfigByJornada(jornadaId) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .select(`
        id, fecha_tentativa,
        fase:fase(
          duracion_tiempo, duracion_entretiempo,
          tiempo_entre_partidos, hora_inicio, hora_fin,
          canchas_disponibles, dias_juego,
          temporada:temporada(liga_id, estado)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()
    return { data, error }
  }
}

export default jornadaRepository;
