import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

class TemporadaService {
  /**
   * Verifica transaccionalmente si la temporada está finalizada (y de paso el ownership, 
   * aunque el ownership primario es la liga_id). Usada internamente.
   */
  async validateNotFinalizada(temporadaId) {
    if (!temporadaId) throw new AppError('ID de temporada requerido', 400)

    const { data, error } = await supabaseAdmin
      .from('temporada')
      .select('estado, liga_id')
      .eq('id', temporadaId)
      .maybeSingle()

    if (error) throw new AppError(`Error al verificar temporada: ${error.message}`, 500)
    if (!data) throw new AppError('Temporada no encontrada', 404)

    if (data.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada (Modo Bóveda). No se permiten más modificaciones.', 403)
    }

    return data
  }

  async createTemporada(ligaId, organizadorId, data) {
    // 1. Aislamiento Total
    await LigaService.verifyOwnership(ligaId, organizadorId)

    const { formato_id, nombre, fecha_inicio, fecha_fin } = data
    if (!formato_id || !nombre) {
      throw new AppError('formato_id y nombre son requeridos', 400)
    }

    // 2. Insert en BD. El estado por defecto es 'borrador' desde el schema
    const payload = {
      liga_id: ligaId,
      formato_id,
      nombre: nombre.trim(),
    }
    if (fecha_inicio) payload.fecha_inicio = fecha_inicio
    if (fecha_fin) payload.fecha_fin = fecha_fin

    const { data: nuevaTemporada, error } = await supabaseAdmin
      .from('temporada')
      .insert([payload])
      .select('id, nombre, estado, fecha_inicio, fecha_fin, formato_id')
      .single()

    if (error) {
      // 23503: foreign_key_violation (ej: formato_id no existe)
      if (error.code === '23503') throw new AppError('El Formato especificado no es válido', 400)
      throw new AppError(`Error al crear temporada: ${error.message}`, 500)
    }

    return nuevaTemporada
  }

  async getTemporadasByLiga(ligaId, organizadorId) {
    await LigaService.verifyOwnership(ligaId, organizadorId)

    const { data, error } = await supabaseAdmin
      .from('temporada')
      .select(`
        id, 
        nombre, 
        estado, 
        fecha_inicio, 
        fecha_fin, 
        formato:formato_competencia(id, nombre, tipo)
      `)
      .eq('liga_id', ligaId)
      .order('created_at', { ascending: false })

    if (error) throw new AppError(`Error al listar temporadas: ${error.message}`, 500)

    return data || []
  }

  async updateEstado(temporadaId, organizadorId, nuevoEstado) {
    if (!['borrador', 'activa', 'finalizada'].includes(nuevoEstado)) {
      throw new AppError('Estado no válido.', 400)
    }

    // Aislamiento a través del ID y el ownership del organizador
    const { data: seasonCheck, error: checkError } = await supabaseAdmin
      .from('temporada')
      .select('estado, liga_id')
      .eq('id', temporadaId)
      .maybeSingle()

    if (checkError || !seasonCheck) {
      throw new AppError('Temporada no encontrada', 404)
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId)

    // Validar máquina de estados: no volver de finalizada
    if (seasonCheck.estado === 'finalizada') {
        throw new AppError('Una temporada finalizada no puede cambiar su estado (Modo Bóveda)', 403)
    }
    
    // Y no se debe volver a borrador si ya estaba activa
    if (seasonCheck.estado === 'activa' && nuevoEstado === 'borrador') {
        throw new AppError('Una temporada activa no puede retroceder a borrador', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('temporada')
      .update({ estado: nuevoEstado })
      .eq('id', temporadaId)
      .select('id, nombre, estado')
      .single()

    if (error) throw new AppError(`Error al actualizar estado: ${error.message}`, 500)

    return data
  }

  /**
   * Obtiene la temporada con todas sus fases y jornadas anidadas.
   * "Un solo golpe de vista para el admin".
   */
  async getTemporadaCompleta(temporadaId, organizadorId) {
    // 1. Verificar existencia y Aislamiento Indirecto
    const { data: temporadaCheck, error: tempError } = await supabaseAdmin
      .from('temporada')
      .select('liga_id')
      .eq('id', temporadaId)
      .maybeSingle()

    if (tempError || !temporadaCheck) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporadaCheck.liga_id, organizadorId)

    // 2. Traer el árbol completo desde Supabase (Relaciones anidadas)
    const { data: temporadaCompleta, error: arbolError } = await supabaseAdmin
      .from('temporada')
      .select(`
        id, 
        nombre, 
        estado, 
        fecha_inicio, 
        fecha_fin, 
        formato:formato_competencia(id, nombre, tipo),
        fases:fase(
          id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta,
          jornadas:jornada(id, numero, estado, fecha_tentativa)
        )
      `)
      .eq('id', temporadaId)
      .single()

    if (arbolError) throw new AppError(`Error al consultar árbol de competencia: ${arbolError.message}`, 500)

    // Ordenar las fases por orden y sus jornadas por numero en memoria 
    // (A veces Supabase PostgREST no garantiza el orden anidado sin tricks sintácticos y es más robusto un simple sort aquí).
    if (temporadaCompleta.fases) {
      temporadaCompleta.fases.sort((a, b) => a.orden - b.orden)
      temporadaCompleta.fases.forEach(fase => {
         if (fase.jornadas) {
            fase.jornadas.sort((a, b) => a.numero - b.numero)
         }
      })
    }

    return temporadaCompleta
  }
}

export default new TemporadaService()
