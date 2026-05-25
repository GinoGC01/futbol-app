import { supabaseAdmin } from '../lib/supabase.js'

export const faseRepository = {
  async findLatestFaseOrden(temporadaId) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .select('orden')
      .eq('temporada_id', temporadaId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error }
  },

  async createFase(payload) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .insert([payload])
      .select()
      .single()
    return { data, error }
  },

  async findFasesByTemporada(temporadaId) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .select(`
        id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta, estado,
        duracion_tiempo, duracion_entretiempo, tiempo_entre_partidos,
        hora_inicio, hora_fin, canchas_disponibles, dias_juego,
        jornadas:jornada(id, numero, estado, fecha_tentativa),
        grupos:grupo(
          id, nombre, orden, created_at,
          grupo_equipo(
            id, equipo_id,
            equipo:equipo(id, nombre, escudo_url, color_principal)
          )
        )
      `)
      .eq('temporada_id', temporadaId)
      .order('orden', { ascending: true })
    return { data, error }
  },

  async findFaseOwnershipCheck(id) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .select(`
        id, temporada_id, nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta,
        duracion_tiempo, duracion_entretiempo, tiempo_entre_partidos,
        hora_inicio, hora_fin, canchas_disponibles,
        temporada:temporada(liga_id, estado)
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  },

  async updateFase(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('fase')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta, duracion_tiempo, duracion_entretiempo, tiempo_entre_partidos, hora_inicio, hora_fin, canchas_disponibles')
      .single()
    return { data, error }
  }
}

export default faseRepository;
