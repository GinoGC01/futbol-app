import { jornadaRepository } from '../../repositories/jornadaRepository.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

const ESTADOS_ACTIVOS = ['programada', 'jugada']
const ESTADO_VENCIDA = 'vencida'

export const JornadaService = {
  /**
   * Generación atómica en batch de N jornadas.
   */
  async createJornadasBatch(faseId, organizadorId, cantidad, fechaTentativa) {
    if (!cantidad || cantidad < 1 || cantidad > 100) {
      throw new AppError('La cantidad debe ser un número válido (1-100)', 400)
    }

    const { data: fase, error: faseError } = await jornadaRepository.findFaseTemporadaLiga(faseId)

    if (faseError || !fase) throw new AppError('La Fase no existe', 404)

    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    await TemporadaService.validateNotFinalizada(fase.temporada_id)

    const { data: ultimasJornadas, error: uqError } = await jornadaRepository.findLatestJornadaNumero(faseId)

    if (uqError) throw new AppError(`Error al verificar jornadas previas: ${uqError.message}`, 500)

    const startNumber = ultimasJornadas ? ultimasJornadas.numero + 1 : 1

    // Calcular fecha base para auto-incremento semanal si no se provee
    const fechaBase = fechaTentativa ? new Date(fechaTentativa) : new Date()
    if (isNaN(fechaBase.getTime())) {
      throw new AppError('Fecha tentativa inválida', 400)
    }

    const payloadBuffer = []
    for (let i = 0; i < cantidad; i++) {
      const fechaJornada = new Date(fechaBase)
      fechaJornada.setDate(fechaJornada.getDate() + i * 7) // +1 semana por jornada
      payloadBuffer.push({
        fase_id: faseId,
        numero: startNumber + i,
        fecha_tentativa: fechaJornada.toISOString(),
        estado: 'programada',
      })
    }

    try {
      const { data: jornadasInsertadas, error: batchError } = await jornadaRepository.insertJornadas(payloadBuffer)

      if (batchError) {
        throw new AppError(`Falló la creación atómica de jornadas: ${batchError.message}`, 500)
      }

      return {
        message: `${cantidad} jornadas creadas exitosamente`,
        jornadas: jornadasInsertadas
      }
    } catch (e) {
      if (e instanceof AppError) throw e
      throw new AppError(`Error fatal generando batch: ${e.message}`, 500)
    }
  },

  /**
   * Actualiza una jornada (fecha_tentativa, estado).
   */
  async updateJornada(jornadaId, organizadorId, updateData) {
    const { data: jornada, error: jErr } = await jornadaRepository.findJornadaOwnershipCheck(jornadaId)

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)

    await LigaService.verifyOwnership(jornada.fase.temporada.liga_id, organizadorId)

    if (jornada.fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede editar la jornada (Modo Bóveda)', 403)
    }

    // Auto-detect vencida si la fecha ya pasó y el estado es programada
    let estadoAuto = updateData.estado
    if (updateData.estado === undefined && updateData.fecha_tentativa !== undefined) {
      const ahora = new Date()
      const fechaUsuario = new Date(updateData.fecha_tentativa)
      if (fechaUsuario <= ahora && ESTADOS_ACTIVOS.includes(jornada.estado)) {
        estadoAuto = ESTADO_VENCIDA
      }
    }

    const payload = {}
    if (updateData.fecha_tentativa !== undefined) payload.fecha_tentativa = updateData.fecha_tentativa
    if (estadoAuto !== undefined) payload.estado = estadoAuto

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay datos para actualizar', 400)
    }

    if (payload.estado === 'cerrada') {
      await jornadaRepository.postponeProgrammedMatchesByJornada(jornadaId)
    }

    const { data: updated, error: updateError } = await jornadaRepository.updateJornada(jornadaId, payload)

    if (updateError) throw new AppError(`Error al actualizar jornada: ${updateError.message}`, 500)

    return updated
  },

  /**
   * Verifica y actualiza automáticamente las jornadas vencidas.
   * Recorre todas las jornadas con estado 'programada' cuya fecha_tentativa ya pasó
   * y las marca como 'vencida'.
   */
  async autoExpirarJornadasVencidas() {
    const { data: jornadasVencidas, error } = await jornadaRepository.findExpiredJornadas()

    if (error) throw new AppError(`Error consultando jornadas vencidas: ${error.message}`, 500)

    if (!jornadasVencidas || jornadasVencidas.length === 0) {
      return { message: 'No hay jornadas vencidas', actualizadas: 0 }
    }

    const ids = jornadasVencidas.map(j => j.id)
    const { data: actualizadas, error: updateError } = await jornadaRepository.batchUpdateEstado(ids, ESTADO_VENCIDA)

    if (updateError) throw new AppError(`Error actualizando jornadas vencidas: ${updateError.message}`, 500)

    return {
      message: `${actualizadas?.length || 0} jornadas marcadas como vencidas`,
      actualizadas: actualizadas?.length || 0
    }
  }
}

export default JornadaService
