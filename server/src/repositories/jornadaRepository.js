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
      .select('id, numero, estado')
    return { data, error }
  },

  async findJornadaOwnershipCheck(id) {
    const { data, error } = await supabaseAdmin
      .from('jornada')
      .select(`
        id, fase_id,
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
  }
}

export default jornadaRepository;
