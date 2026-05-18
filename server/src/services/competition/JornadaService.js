import { jornadaRepository } from '../../repositories/jornadaRepository.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

export const JornadaService = {
  /**
   * Generación atómica en batch de N jornadas.
   */
  async createJornadasBatch(faseId, organizadorId, cantidad) {
    if (!cantidad || cantidad < 1 || cantidad > 100) {
      throw new AppError('La cantidad debe ser un número válido (1-100)', 400)
    }

    // 1. Obtener la Fase y la Temporada para verificar Estado "Bóveda" y Propiedad
    const { data: fase, error: faseError } = await jornadaRepository.findFaseTemporadaLiga(faseId)

    if (faseError || !fase) throw new AppError('La Fase no existe', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: Control de Estado Bóveda
    await TemporadaService.validateNotFinalizada(fase.temporada_id)

    // 4. Determinar número de arranque (Evitar duplicidad de números en la misma fase)
    const { data: ultimasJornadas, error: uqError } = await jornadaRepository.findLatestJornadaNumero(faseId)

    if (uqError) throw new AppError(`Error al verificar jornadas previas: ${uqError.message}`, 500)

    const startNumber = ultimasJornadas ? ultimasJornadas.numero + 1 : 1

    // 5. Armar Array Batch
    const payloadBuffer = []
    for (let i = 0; i < cantidad; i++) {
       payloadBuffer.push({
         fase_id: faseId,
         numero: startNumber + i,
         estado: 'programada',
       })
    }

    try {
      // 6. Transacción en API (Supabase Postgres)
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
   * Actualiza una jornada (fecha_tentativa).
   */
  async updateJornada(jornadaId, organizadorId, updateData) {
    // 1. Resolve: jornada → fase → temporada → liga
    const { data: jornada, error: jErr } = await jornadaRepository.findJornadaOwnershipCheck(jornadaId)

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)

    // 2. Aislamiento
    await LigaService.verifyOwnership(jornada.fase.temporada.liga_id, organizadorId)

    // 3. Vault
    if (jornada.fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede editar la jornada (Modo Bóveda)', 403)
    }

    // 4. Update
    const payload = {}
    if (updateData.fecha_tentativa !== undefined) payload.fecha_tentativa = updateData.fecha_tentativa
    if (updateData.estado !== undefined) payload.estado = updateData.estado

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay datos para actualizar', 400)
    }

    // 5. Si se está cerrando, podemos querer lógica adicional (ej: marcar partidos pendientes)
    if (payload.estado === 'cerrada') {
      await jornadaRepository.postponeProgrammedMatchesByJornada(jornadaId)
    }

    const { data: updated, error: updateError } = await jornadaRepository.updateJornada(jornadaId, payload)

    if (updateError) throw new AppError(`Error al actualizar jornada: ${updateError.message}`, 500)

    return updated
  }
}

export default JornadaService
