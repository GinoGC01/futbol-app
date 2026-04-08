import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'

class JugadorService {
  /**
   * Soft-Duplicate Check + Create.
   * Busca por nombre, apellido y fecha_nacimiento. Si existe, devuelve el existente.
   * El jugador es un recurso GLOBAL (puede jugar en múltiples ligas).
   */
  async getOrCreateJugador(data) {
    const { nombre, apellido, fecha_nacimiento, dni, foto_url } = data

    if (!nombre || nombre.trim().length < 2) {
      throw new AppError('El nombre del jugador debe tener al menos 2 caracteres', 400)
    }
    if (!apellido || apellido.trim().length < 2) {
      throw new AppError('El apellido del jugador debe tener al menos 2 caracteres', 400)
    }

    // 1. Strict-Duplicate Check: Buscar por DNI exacto si fue provisto
    if (dni && dni.trim() !== '') {
      const { data: dniMatch, error: dniError } = await supabaseAdmin
        .from('jugador')
        .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
        .eq('dni', dni.trim())
        .maybeSingle()

      if (dniError) throw new AppError(`Error verificando DNI: ${dniError.message}`, 500)
      
      if (dniMatch) {
        // Encontramos la identidad física exacta
        return { jugador: dniMatch, created: false }
      }
    }

    // 2. Soft-Duplicate Check: buscar candidatos existentes por nombre y apellido
    let query = supabaseAdmin
      .from('jugador')
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .ilike('nombre', nombre.trim())
      .ilike('apellido', apellido.trim())

    if (fecha_nacimiento) {
      query = query.eq('fecha_nacimiento', fecha_nacimiento)
    }

    const { data: candidatos, error: searchError } = await query.limit(5)

    if (searchError) {
      throw new AppError(`Error buscando jugador: ${searchError.message}`, 500)
    }

    // Si hay un match exacto por nombre+apellido+fecha, devolvemos ese
    if (candidatos && candidatos.length > 0 && fecha_nacimiento) {
      const exactMatch = candidatos[0]
      return { jugador: exactMatch, created: false }
    }

    // Si hay candidatos sin fecha pero con mismo nombre+apellido, también devolvemos
    if (candidatos && candidatos.length > 0 && !fecha_nacimiento) {
      return { jugador: candidatos[0], created: false }
    }

    // No hay duplicado → crear nuevo
    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
    }
    if (fecha_nacimiento) payload.fecha_nacimiento = fecha_nacimiento
    if (dni) payload.dni = dni.trim()
    if (foto_url) payload.foto_url = foto_url.trim()

    const { data: nuevoJugador, error: createError } = await supabaseAdmin
      .from('jugador')
      .insert([payload])
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .single()

    if (createError) {
      throw new AppError(`Error creando jugador: ${createError.message}`, 500)
    }

    return { jugador: nuevoJugador, created: true }
  }

  /**
   * Búsqueda global de jugadores para "fichajes rápidos".
   * El admin busca por nombre/apellido para encontrar jugadores
   * que ya existan en el sistema de otras temporadas o ligas.
   */
  async searchJugadores(queryText) {
    if (!queryText || queryText.trim().length < 2) {
      throw new AppError('La búsqueda debe tener al menos 2 caracteres', 400)
    }

    // Prevención estricta contra inyección de filtros en PostgREST
    // Removemos caracteres conflictivos: comas, dobles comillas, paréntesis y llaves.
    const sanitizedQuery = queryText.replace(/[,()"{}*[\]]/g, '').trim()
    const searchTerm = `%${sanitizedQuery}%`

    const { data, error } = await supabaseAdmin
      .from('jugador')
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},dni.ilike.${searchTerm}`)
      .order('apellido', { ascending: true })
      .limit(20)

    if (error) throw new AppError(`Error en búsqueda: ${error.message}`, 500)

    return data || []
  }

  /**
   * Obtiene todos los jugadores únicos que están inscritos en al menos
   * un equipo de la liga especificada.
   */
  async getJugadoresByLiga(ligaId) {
    if (!ligaId) throw new AppError('ID de liga requerido', 400)

    const { data, error } = await supabaseAdmin
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

    if (error) throw new AppError(`Error al obtener jugadores: ${error.message}`, 500)

    // Supabase !inner devuelve el jugador, pero PostgREST no hace distinct automático
    // así que filtramos en JS.
    const unique = []
    const seen = new Set()
    for (const j of data) {
      if (!seen.has(j.id)) {
        seen.add(j.id)
        delete j.inscripcion_jugador // Limpiamos la metadata del join
        unique.push(j)
      }
    }

    return unique
  }

  /**
   * Obtiene los últimos jugadores creados en el sistema (Pool Global),
   * permitiendo al organizador descubrir nuevos talentos.
   * SECURITY: El DNI se oculta si el jugador no pertenece a ninguna de las
   * ligas de este organizador.
   */
  async getJugadoresByOrganizador(organizadorId, page = 1, limit = 20) {
    if (!organizadorId) throw new AppError('ID de organizador requerido', 400)

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Buscamos con paginación
    const { data, error, count } = await supabaseAdmin
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

    if (error) throw new AppError(`Error al obtener mercado global: ${error.message}`, 500)

    // Procesar para seguridad, limpieza e historial de ligas
    const processedData = data.map(j => {
      // Extraemos nombres únicos de ligas donde ha jugado
      const ligasParticipantes = []
      const seenLigas = new Set()
      
      let belongsToMe = false
      
      if (j.inscripciones) {
        for (const ins of j.inscripciones) {
          const l = ins.plantel?.equipo?.liga
          if (l) {
            if (!seenLigas.has(l.id)) {
              seenLigas.add(l.id)
              ligasParticipantes.push(l.nombre)
            }
            if (l.organizador_id === organizadorId) belongsToMe = true
          }
        }
      }

      const result = { 
        ...j, 
        ligas_historial: ligasParticipantes 
      }
      delete result.inscripciones

      // SECURITY: Mask DNI if not managed by caller
      if (!belongsToMe && result.dni) {
        result.dni = '********'
      }

      return result
    })

    return {
      data: processedData,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  }
}

export default new JugadorService()
