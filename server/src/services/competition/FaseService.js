import { faseRepository } from '../../repositories/faseRepository.js'
import { temporadaRepository } from '../../repositories/temporadaRepository.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

const TIPOS_FASE_VALIDOS = ['todos_contra_todos', 'eliminacion_directa']

export const FaseService = {
  async createFase(temporadaId, organizadorId, data) {
    const { nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta,
            duracion_tiempo, duracion_entretiempo, tiempo_entre_partidos,
            hora_inicio, hora_fin, canchas_disponibles, dias_juego } = data

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
      payload.puntos_victoria = puntos_victoria !== undefined ? Number(puntos_victoria) : 3
      payload.puntos_empate = puntos_empate !== undefined ? Number(puntos_empate) : 1
    } else {
      payload.puntos_victoria = 0
      payload.puntos_empate = 0
    }

    // Fixture config defaults
    payload.duracion_tiempo = duracion_tiempo !== undefined ? Number(duracion_tiempo) : 20
    payload.duracion_entretiempo = duracion_entretiempo !== undefined ? Number(duracion_entretiempo) : 5
    payload.tiempo_entre_partidos = tiempo_entre_partidos !== undefined ? Number(tiempo_entre_partidos) : 15
    payload.hora_inicio = hora_inicio || '17:00'
    payload.hora_fin = hora_fin || '22:00'
    payload.canchas_disponibles = canchas_disponibles !== undefined ? Number(canchas_disponibles) : 1
    payload.dias_juego = dias_juego !== undefined ? dias_juego : '{1,3,5}'

    // 5. Determinar Orden (Auto-secuencial)
    const { data: fasesExistentes, error: fasesError } = await faseRepository.findLatestFaseOrden(temporadaId)

    if (fasesError) throw new AppError(`Error al consultar fases: ${fasesError.message}`, 500)

    const nuevoOrden = fasesExistentes ? fasesExistentes.orden + 1 : 1
    payload.orden = nuevoOrden

    // 6. Insert en BD
    const { data: nuevaFase, error: insertError } = await faseRepository.createFase(payload)

    if (insertError) throw new AppError(`Error insertando fase: ${insertError.message}`, 500)

    return nuevaFase
  },

  async getFasesByTemporada(temporadaId, organizadorId) {
    // Validar aislamiento
    const { data: temporada, error: tempError } = await temporadaRepository.findTemporadaByIdCheckNoDeletedFilter(temporadaId)

    if (tempError || !temporada) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    const { data: fases, error: fasesError } = await faseRepository.findFasesByTemporada(temporadaId)

    if (fasesError) throw new AppError(`Error listando fases: ${fasesError.message}`, 500)

    return fases || []
  },

  /**
   * Actualiza una fase existente (nombre, tipo, puntos, ida_y_vuelta).
   * Solo si la temporada NO está finalizada.
   */
  async updateFase(faseId, organizadorId, updateData) {
    // 1. Resolve ownership chain
    const { data: fase, error: faseError } = await faseRepository.findFaseOwnershipCheck(faseId)

    if (faseError || !fase) throw new AppError('Fase no encontrada', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: Modo Bóveda
    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede editar la fase (Modo Bóveda)', 403)
    }

    // 4. Build payload — only allowed fields
    const { nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta,
            duracion_tiempo, duracion_entretiempo, tiempo_entre_partidos,
            hora_inicio, hora_fin, canchas_disponibles, dias_juego } = updateData
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
    if (duracion_tiempo !== undefined) payload.duracion_tiempo = Number(duracion_tiempo)
    if (duracion_entretiempo !== undefined) payload.duracion_entretiempo = Number(duracion_entretiempo)
    if (tiempo_entre_partidos !== undefined) payload.tiempo_entre_partidos = Number(tiempo_entre_partidos)
    if (hora_inicio !== undefined) payload.hora_inicio = hora_inicio
    if (hora_fin !== undefined) payload.hora_fin = hora_fin
    if (canchas_disponibles !== undefined) payload.canchas_disponibles = Number(canchas_disponibles)
    if (dias_juego !== undefined) payload.dias_juego = dias_juego

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay datos para actualizar', 400)
    }

    const { data: updated, error: updateError } = await faseRepository.updateFase(faseId, payload)

    if (updateError) throw new AppError(`Error al actualizar fase: ${updateError.message}`, 500)

    return updated
  }
}

export default FaseService
