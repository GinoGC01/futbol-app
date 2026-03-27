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

    // Soft-Duplicate Check: buscar candidatos existentes
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

    const searchTerm = `%${queryText.trim()}%`

    const { data, error } = await supabaseAdmin
      .from('jugador')
      .select('id, nombre, apellido, fecha_nacimiento, dni, foto_url')
      .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm}`)
      .order('apellido', { ascending: true })
      .limit(20)

    if (error) throw new AppError(`Error en búsqueda: ${error.message}`, 500)

    return data || []
  }
}

export default new JugadorService()
