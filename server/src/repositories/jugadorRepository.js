import { supabaseAdmin } from '../lib/supabase.js'

export const jugadorRepository = {
  async findJugadorByDni(dni) {
    return await supabaseAdmin
      .from('jugador')
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .eq('dni', dni)
      .maybeSingle()
  },

  async findCandidatos(nombre, apellido, fecha_nacimiento) {
    let query = supabaseAdmin
      .from('jugador')
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .ilike('nombre', nombre.trim())
      .ilike('apellido', apellido.trim())

    if (fecha_nacimiento) {
      query = query.eq('fecha_nacimiento', fecha_nacimiento)
    }

    return await query.limit(5)
  },

  async createJugador(payload) {
    return await supabaseAdmin
      .from('jugador')
      .insert([payload])
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .single()
  },

  async searchJugadores(searchTerm, selectClause) {
    return await supabaseAdmin
      .from('jugador')
      .select(selectClause)
      .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},dni.ilike.${searchTerm}`)
      .order('apellido', { ascending: true })
      .limit(20)
  },

  async findJugadoresByLiga(ligaId) {
    return await supabaseAdmin
      .from('jugador')
      .select(`
        id, nombre, apellido, fecha_nacimiento, dni, foto_url,
        inscripcion_jugador!inner (
          plantel!inner (
            equipo!inner (
              liga_id
            )
          )
        )
      `)
      .eq('inscripcion_jugador.plantel.equipo.liga_id', ligaId)
  },

  async findJugadoresByOrganizador(from, to) {
    return await supabaseAdmin
      .from('jugador')
      .select(`
        id, nombre, apellido, fecha_nacimiento, dni, foto_url, created_at,
        inscripciones:inscripcion_jugador(
          plantel:plantel(
            equipo:equipo(
              liga:liga(id, nombre, organizador_id)
            )
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
  }
}
