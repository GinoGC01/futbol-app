import { sancionRepository } from '../../repositories/sancionRepository.js'
import AppError from '../../utils/AppError.js'

class SancionService {
  /**
   * Crea una sanción para un jugador.
   * Puede estar vinculada a una tarjeta (automática) o ser directa (manual).
   * Además, pone al jugador en estado 'suspendido'.
   */
  async crearSancion(inscripcionJugadorId, data) {
    const { tarjeta_id, causa, fechas_suspension = 1 } = data

    if (!causa || causa.trim().length < 3) {
      throw new AppError('La causa de la sanción debe tener al menos 3 caracteres', 400)
    }

    const payload = {
      inscripcion_jugador_id: inscripcionJugadorId,
      causa: causa.trim(),
      fechas_suspension: Number(fechas_suspension),
      estado: 'activa'
    }
    if (tarjeta_id) payload.tarjeta_id = tarjeta_id

    const { data: sancion, error } = await sancionRepository.createSancion(payload)

    if (error) throw new AppError(`Error al crear sanción: ${error.message}`, 500)

    // Marcar al jugador como suspendido en su inscripción
    await sancionRepository.updateInscripcionEstado(inscripcionJugadorId, 'suspendido')

    return sancion
  }

  /**
   * Verifica si un jugador tiene sanciones activas.
   * Devuelve { elegible: boolean, sancionesActivas: [] }
   */
  async verificarElegibilidad(inscripcionJugadorId) {
    const { data: sanciones, error } = await sancionRepository.findSancionesByInscripcionAndEstado(inscripcionJugadorId, 'activa')

    if (error) throw new AppError(`Error verificando elegibilidad: ${error.message}`, 500)

    return {
      elegible: !sanciones || sanciones.length === 0,
      sancionesActivas: sanciones || []
    }
  }

  /**
   * Marca una sanción como cumplida y reactiva al jugador si no tiene más sanciones activas.
   */
  async cumplirSancion(sancionId, organizadorId) {
    // Obtener la sanción con datos del jugador para verificar ownership
    const { data: sancion, error: sErr } = await sancionRepository.findSancionWithOwnership(sancionId)

    if (sErr || !sancion) throw new AppError('Sanción no encontrada', 404)

    // Ownership se verifica importando LigaService en el controlador
    // Aquí solo cambiamos el estado
    if (sancion.estado !== 'activa') {
      throw new AppError(`La sanción ya está en estado "${sancion.estado}"`, 400)
    }

    const { data: updated, error: uErr } = await sancionRepository.updateSancionEstado(sancionId, 'cumplida')

    if (uErr) throw new AppError(`Error al cumplir sanción: ${uErr.message}`, 500)

    // Verificar si quedan más sanciones activas para ese jugador
    const { data: otrasSanciones } = await sancionRepository.findSancionesByInscripcionAndEstado(sancion.inscripcion_jugador_id, 'activa')

    // Si no quedan sanciones activas, reactivar jugador
    if (!otrasSanciones || otrasSanciones.length === 0) {
      await sancionRepository.updateInscripcionEstado(sancion.inscripcion_jugador_id, 'activo')
    }

    return updated
  }
}

const instance = new SancionService()
export default instance
