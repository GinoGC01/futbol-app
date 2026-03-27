import AwardService from '../../services/awards/AwardService.js'
import { validationResult } from 'express-validator'

class AwardController {
  async crearPremio(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const premio = await AwardService.crearPremio(req.organizador.id, req.body)
      res.status(201).json({ status: 'success', data: premio })
    } catch (error) { next(error) }
  }

  async sugerirGanadores(req, res, next) {
    try {
      const analisis = await AwardService.sugerirGanadores(req.params.id, req.organizador.id)
      res.status(200).json({ status: 'success', data: analisis })
    } catch (error) { next(error) }
  }

  async asignarGanador(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const ganador = await AwardService.asignarGanador(req.params.id, req.organizador.id, req.body)
      res.status(201).json({ status: 'success', data: ganador })
    } catch (error) { next(error) }
  }

  async togglePublicacion(req, res, next) {
    try {
      const updated = await AwardService.togglePublicacion(
        req.params.id, req.organizador.id, req.body.publicado
      )
      res.status(200).json({ status: 'success', data: updated })
    } catch (error) { next(error) }
  }

  async getPremios(req, res, next) {
    try {
      const premios = await AwardService.getPremiosByTemporada(
        req.query.temporada_id, req.organizador.id
      )
      res.status(200).json({ status: 'success', results: premios.length, data: premios })
    } catch (error) { next(error) }
  }
}

export default new AwardController()
