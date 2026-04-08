import { supabaseAdmin } from '../../lib/supabase.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

const TIPOS_FASE_VALIDOS = ['todos_contra_todos', 'eliminacion_directa']

class FaseService {
  async createFase(temporadaId, organizadorId, data) {
    const { nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta } = data

    // 1. Hard Lock: ¿Temporada finalizada? (Y obtenemos liga_id)
    const temporada = await TemporadaService.validateNotFinalizada(temporadaId)
    
    // 2. Aislamiento Total
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    // 3. Validar Enum antes de intentar en BD
    if (!TIPOS_FASE_VALIDOS.includes(tipo)) {
      throw new AppError(`Tipo de fase no válido. Permitidos: ${TIPOS_FASE_VALIDOS.join(', ')}`, 400)
    }

    // 4. Reglas de Negocio sobre puntos según el Tipo
    const payload = {
      temporada_id: temporadaId,
      nombre: nombre ? nombre.trim() : 'Fase Regular',
      tipo,
      ida_y_vuelta: Boolean(ida_y_vuelta)
    }

    if (tipo === 'todos_contra_todos') {
      // Necesitamos puntos, si no vienen asumo estándar: Victoria=3, Empate=1
      payload.puntos_victoria = puntos_victoria !== undefined ? Number(puntos_victoria) : 3
      payload.puntos_empate = puntos_empate !== undefined ? Number(puntos_empate) : 1
    } else {
      // eliminacion_directa no suma puntos de tabla general usualmente, pero por si acaso.
      payload.puntos_victoria = 0
      payload.puntos_empate = 0
    }

    // 5. Determinar Orden (Auto-secuencial)
    const { data: fasesExistentes, error: fasesError } = await supabaseAdmin
      .from('fase')
      .select('orden')
      .eq('temporada_id', temporadaId)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fasesError) throw new AppError(`Error al consultar fases: ${fasesError.message}`, 500)

    const nuevoOrden = fasesExistentes ? fasesExistentes.orden + 1 : 1
    payload.orden = nuevoOrden

    // 6. Insert en BD
    const { data: nuevaFase, error: insertError } = await supabaseAdmin
      .from('fase')
      .insert([payload])
      .select()
      .single()

    if (insertError) throw new AppError(`Error insertando fase: ${insertError.message}`, 500)

    return nuevaFase
  }

  async getFasesByTemporada(temporadaId, organizadorId) {
    // Validar aislamiento indirectamente desde la liga de la temporada
    const { data: temporada, error: tempError } = await supabaseAdmin
      .from('temporada')
      .select('liga_id')
      .eq('id', temporadaId)
      .maybeSingle()

    if (tempError || !temporada) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    const { data: fases, error: fasesError } = await supabaseAdmin
      .from('fase')
      .select(`
        id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta, estado,
        jornadas:jornada(id, numero, estado, fecha_tentativa)
      `)
      .eq('temporada_id', temporadaId)
      .order('orden', { ascending: true })

    if (fasesError) throw new AppError(`Error listando fases: ${fasesError.message}`, 500)

    return fases || []
  }

  /**
   * Actualiza una fase existente (nombre, tipo, puntos, ida_y_vuelta).
   * Solo si la temporada NO está finalizada.
   */
  async updateFase(faseId, organizadorId, updateData) {
    // 1. Resolve ownership chain: fase → temporada → liga
    const { data: fase, error: faseError } = await supabaseAdmin
      .from('fase')
      .select(`
        id, temporada_id, nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta,
        temporada:temporada(liga_id, estado)
      `)
      .eq('id', faseId)
      .maybeSingle()

    if (faseError || !fase) throw new AppError('Fase no encontrada', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: Modo Bóveda
    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede editar la fase (Modo Bóveda)', 403)
    }

    // 4. Build payload — only allowed fields
    const { nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta } = updateData
    const payload = {}

    if (nombre !== undefined) payload.nombre = nombre.trim()
    if (tipo !== undefined) {
      if (!TIPOS_FASE_VALIDOS.includes(tipo)) {
        throw new AppError(`Tipo de fase no válido. Permitidos: ${TIPOS_FASE_VALIDOS.join(', ')}`, 400)
      }
      payload.tipo = tipo
    }
    if (puntos_victoria !== undefined) payload.puntos_victoria = Number(puntos_victoria)
    if (puntos_empate !== undefined) payload.puntos_empate = Number(puntos_empate)
    if (ida_y_vuelta !== undefined) payload.ida_y_vuelta = Boolean(ida_y_vuelta)

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay datos para actualizar', 400)
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('fase')
      .update(payload)
      .eq('id', faseId)
      .select('id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta')
      .single()

    if (updateError) throw new AppError(`Error al actualizar fase: ${updateError.message}`, 500)

    return updated
  }
}

export default new FaseService()
