import { alertRepository } from '../../repositories/alertRepository.js'
import AppError from '../../utils/AppError.js'

class AlertService {
  async getUnresolvedAlerts(ligaId) {
    if (!ligaId) throw new AppError('liga_id es requerido', 400)
    const { data, error } = await alertRepository.findUnresolvedByLiga(ligaId)
    if (error) throw new AppError(`Error consultando alertas: ${error.message}`, 500)
    return data || []
  }

  async resolveAlert(id) {
    if (!id) throw new AppError('ID de alerta es requerido', 400)
    const { error } = await alertRepository.resolveAlert(id)
    if (error) throw new AppError(`Error resolviendo alerta: ${error.message}`, 500)
    return { success: true }
  }

  async evaluateAlerts() {
    const { error } = await alertRepository.triggerEvaluateAlerts()
    if (error) throw new AppError(`Error al evaluar alertas: ${error.message}`, 500)
    return { message: 'Evaluación completada' }
  }
}

export default new AlertService()
