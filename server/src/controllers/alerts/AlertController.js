import AlertService from '../../services/alerts/AlertService.js'

export const getUnresolvedAlerts = async (req, res, next) => {
  try {
    const alerts = await AlertService.getUnresolvedAlerts(req.query.liga_id)
    res.json({ data: alerts })
  } catch (error) { next(error) }
}

export const resolveAlert = async (req, res, next) => {
  try {
    const result = await AlertService.resolveAlert(req.params.id)
    res.json({ data: result })
  } catch (error) { next(error) }
}

export const evaluateAlerts = async (req, res, next) => {
  try {
    const result = await AlertService.evaluateAlerts()
    res.json({ data: result })
  } catch (error) { next(error) }
}

const AlertController = {
  getUnresolvedAlerts,
  resolveAlert,
  evaluateAlerts
}

export default AlertController
