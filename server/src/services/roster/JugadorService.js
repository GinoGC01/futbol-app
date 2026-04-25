import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'

class JugadorService {
  /**
   * Soft-Duplicate Check + Create.
   */
  async getOrCreateJugador(data) {
    const { nombre, apellido, fecha_nacimiento, dni, foto_url } = data

    if (!nombre || nombre.trim().length < 2) {
      throw new AppError('El nombre del jugador debe tener al menos 2 caracteres', 400)
    }
    if (!apellido || apellido.trim().length < 2) {
      throw new AppError('El apellido del jugador debe tener al menos 2 caracteres', 400)
    }

    if (dni && dni.trim() !== '') {
      const { data: dniMatch, error: dniError } = await supabaseAdmin
        .from('jugador')
        .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
        .eq('dni', dni.trim())
        .maybeSingle()

      if (dniError) throw new AppError('Error al verificar identidad por DNI', 500, dniError)
      
      if (dniMatch) {
        return { jugador: dniMatch, created: false }
      }
    }

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
      throw new AppError('Error al buscar jugadores existentes', 500, searchError)
    }

    if (candidatos && candidatos.length > 0 && fecha_nacimiento) {
      const exactMatch = candidatos[0]
      return { jugador: exactMatch, created: false }
    }

    if (candidatos && candidatos.length > 0 && !fecha_nacimiento) {
      return { jugador: candidatos[0], created: false }
    }

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
      throw new AppError('No se pudo registrar al jugador', 500, createError)
    }

    return { jugador: nuevoJugador, created: true }
  }

  /**
   * Búsqueda global de jugadores.
   */
  async searchJugadores(queryText, ligaId = null) {
    if (!queryText || queryText.trim().length < 2) {
      throw new AppError('La búsqueda debe tener al menos 2 caracteres', 400)
    }

    const sanitizedQuery = queryText.replace(/[,()"{}*[\]]/g, '').trim()
    const searchTerm = `%${sanitizedQuery}%`

    let select = 'id, nombre, apellido, fecha_nacimiento, dni, foto_url'
    if (ligaId) {
      // Traer inscripciones activas en la liga actual para marcar duplicados
      select += `,
        inscripciones:inscripcion_jugador(
          estado,
          plantel:plantel(
            equipo:equipo(
              id, nombre, liga_id
            ),
            temporada:temporada(id, nombre)
          )
        )`
    }

    let query = supabaseAdmin
      .from('jugador')
      .select(select)
      .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},dni.ilike.${searchTerm}`)
      .order('apellido', { ascending: true })
      .limit(20)

    const { data, error } = await query

    if (error) throw new AppError('Ocurrió un error al procesar la búsqueda', 500, error)

    if (!ligaId) return data || []

    // Post-procesar para anotar inscripciones en la liga solicitada
    return data.map(j => {
      const inscripcionActiva = j.inscripciones?.find(ins => 
        ins.estado === 'activo' && 
        ins.plantel?.equipo?.liga_id === ligaId
      )

      const result = { ...j }
      if (inscripcionActiva) {
        result.inscripcion_activa = {
          equipo_nombre: inscripcionActiva.plantel.equipo.nombre,
          temporada_nombre: inscripcionActiva.plantel.temporada.nombre
        }
      }
      delete result.inscripciones
      return result
    })
  }

  /**
   * Obtiene jugadores por liga.
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

    if (error) throw new AppError('Error al listar los jugadores de la liga', 500, error)

    const unique = []
    const seen = new Set()
    for (const j of data) {
      if (!seen.has(j.id)) {
        seen.add(j.id)
        delete j.inscripcion_jugador
        unique.push(j)
      }
    }

    return unique
  }

  /**
   * Mercado Global de jugadores con seguridad de DNI.
   */
  async getJugadoresByOrganizador(organizadorId, page = 1, limit = 20) {
    if (!organizadorId) throw new AppError('ID de organizador requerido', 400)

    const from = (page - 1) * limit
    const to = from + limit - 1

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

    if (error) throw new AppError('Error al obtener el listado global de jugadores', 500, error)

    const processedData = data.map(j => {
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
