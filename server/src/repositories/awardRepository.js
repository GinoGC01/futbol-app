import { supabaseAdmin } from '../lib/supabase.js'

export const awardRepository = {
  async findPremioWithOwnership(premioId) {
    return await supabaseAdmin
      .from('premio')
      .select(`
        id, temporada_id, fase_id, nombre, criterio, categoria, publicado,
        temporada:temporada!inner(liga_id)
      `)
      .eq('id', premioId)
      .maybeSingle()
  },

  async findTemporadaLiga(temporadaId) {
    return await supabaseAdmin
      .from('temporada')
      .select('liga_id')
      .eq('id', temporadaId)
      .maybeSingle()
  },

  async createPremio(payload) {
    return await supabaseAdmin
      .from('premio')
      .insert([payload])
      .select('*')
      .single()
  },

  async findFirstFaseId(temporadaId) {
    return await supabaseAdmin
      .from('fase')
      .select('id')
      .eq('temporada_id', temporadaId)
      .order('orden', { ascending: true })
      .limit(1)
  },

  async findFixtureForVallaInvicta(faseId) {
    return await supabaseAdmin
      .from('vista_fixture')
      .select('*')
      .eq('fase_id', faseId)
      .eq('partido_estado', 'finalizado')
  },

  async createGanador(payload) {
    return await supabaseAdmin
      .from('ganador_premio')
      .insert([payload])
      .select('id, premio_id, equipo_id, jugador_id, valor_record, nota_desempate, compartido')
      .single()
  },

  async updatePremioPublicacion(premioId, publicado) {
    return await supabaseAdmin
      .from('premio')
      .update({ publicado })
      .eq('id', premioId)
      .select('id, nombre, publicado')
      .single()
  },

  async findPremiosByTemporada(temporadaId) {
    return await supabaseAdmin
      .from('premio')
      .select(`
        id, nombre, descripcion, criterio, categoria, premio_fisico, imagen_url, publicado, created_at,
        ganadores:ganador_premio(
          id, valor_record, nota_desempate, compartido,
          equipo:equipo(id, nombre, escudo_url),
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('temporada_id', temporadaId)
      .order('created_at', { ascending: true })
  }
}
