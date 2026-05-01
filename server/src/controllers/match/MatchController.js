import PartidoService from '../../services/match/PartidoService.js'
import { validationResult } from 'express-validator'

class MatchController {
  async create(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const { jornada_id } = req.body
      const partido = await PartidoService.createPartido(jornada_id, req.organizador.id, req.body)

      res.status(201).json({ status: 'success', data: partido })
    } catch (error) { next(error) }
  }

  async cambiarEstado(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const updated = await PartidoService.cambiarEstado(
        req.params.id, req.organizador.id, req.body.estado
      )

      res.status(200).json({ status: 'success', data: updated })
    } catch (error) { next(error) }
  }

  async registrarResultado(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const updated = await PartidoService.registrarResultado(
        req.params.id, req.organizador.id,
        req.body.goles_local, req.body.goles_visitante
      )

      res.status(200).json({ status: 'success', data: updated })
    } catch (error) { next(error) }
  }

  async getFixture(req, res, next) {
    try {
      const fixture = await PartidoService.getFixtureByJornada(req.params.jornadaId, req.organizador.id)

      res.status(200).json({ status: 'success', data: fixture })
    } catch (error) { next(error) }
  }

  async updateLogistica(req, res, next) {
    try {
      const updated = await PartidoService.updateLogistica(
        req.params.id, req.organizador.id, req.body
      )

      res.status(200).json({ status: 'success', data: updated })
    } catch (error) { next(error) }
  }

  async generateFixture(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const { faseId } = req.params
      const { equipo_ids } = req.body
      const organizadorId = req.organizador.id

      const result = await PartidoService.generateRoundRobin(faseId, organizadorId, equipo_ids)

      res.status(201).json({ status: 'success', data: result })
    } catch (error) { next(error) }
  }

  async generateKnockout(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const { faseId } = req.params
      const { equipo_ids } = req.body
      const organizadorId = req.organizador.id

      const result = await PartidoService.generateKnockout(faseId, organizadorId, equipo_ids)

      res.status(201).json({ status: 'success', data: result })
    } catch (error) { next(error) }
  }
}

export default new MatchController()
