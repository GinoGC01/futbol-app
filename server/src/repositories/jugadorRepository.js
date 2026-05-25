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
        id, nombre, apellido, fecha_nacimiento,
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

  async findJugadorIdsInOrganizadorLeagues(organizadorId) {
    const { data: ligas } = await supabaseAdmin
      .from('liga')
      .select('id')
      .eq('organizador_id', organizadorId)
    if (!ligas?.length) return []

    const ligaIds = ligas.map(l => l.id)

    const { data: equipos } = await supabaseAdmin
      .from('equipo')
      .select('id')
      .in('liga_id', ligaIds)
    if (!equipos?.length) return []

    const equipoIds = equipos.map(e => e.id)

    const { data: planteles } = await supabaseAdmin
      .from('plantel')
      .select('id')
      .in('equipo_id', equipoIds)
    if (!planteles?.length) return []

    const plantelIds = planteles.map(p => p.id)

    const { data: inscripciones } = await supabaseAdmin
      .from('inscripcion_jugador')
      .select('jugador_id')
      .in('plantel_id', plantelIds)

    return [...new Set((inscripciones || []).map(i => i.jugador_id))]
  },

  async findJugadoresByOrganizador(from, to, excludeIds) {
    let query = supabaseAdmin
      .from('jugador')
      .select(`
        id, nombre, apellido, fecha_nacimiento, created_at,
        inscripciones:inscripcion_jugador(
          plantel:plantel(
            equipo:equipo(
              liga:liga(id, nombre, organizador_id)
            )
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (excludeIds.length > 0) {
      for (const id of excludeIds) {
        query = query.neq('id', id)
      }
    }

    return await query.range(from, to)
  }
}
