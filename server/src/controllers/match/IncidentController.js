import EventoService from '../../services/match/EventoService.js'
import SancionService from '../../services/match/SancionService.js'
import { validationResult } from 'express-validator'

class IncidentController {
  /**
   * POST /api/match/partidos/:id/goles
   */
  async registrarGol(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const gol = await EventoService.registrarGol(req.params.id, req.organizador.id, req.body)

      res.status(201).json({ status: 'success', data: gol })
    } catch (error) { next(error) }
  }

  /**
   * POST /api/match/partidos/:id/tarjetas
   */
  async registrarTarjeta(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const result = await EventoService.registrarTarjeta(req.params.id, req.organizador.id, req.body)

      res.status(201).json({ status: 'success', data: result })
    } catch (error) { next(error) }
  }

  /**
   * GET /api/match/partidos/:id/eventos
   */
  async getEventos(req, res, next) {
    try {
      const eventos = await EventoService.getEventosByPartido(req.params.id, req.organizador.id)

      res.status(200).json({ status: 'success', data: eventos })
    } catch (error) { next(error) }
  }

  /**
   * POST /api/match/sanciones
   */
  async crearSancionManual(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const sancion = await SancionService.crearSancion(req.body.inscripcion_jugador_id, req.body)

      res.status(201).json({ status: 'success', data: sancion })
    } catch (error) { next(error) }
  }

  /**
   * PATCH /api/match/sanciones/:id/cumplir
   */
  async cumplirSancion(req, res, next) {
    try {
      const result = await SancionService.cumplirSancion(req.params.id, req.organizador.id)

      res.status(200).json({ status: 'success', data: result })
    } catch (error) { next(error) }
  }

  /**
   * GET /api/match/elegibilidad/:inscripcionJugadorId
   */
  async verificarElegibilidad(req, res, next) {
    try {
      const result = await SancionService.verificarElegibilidad(req.params.inscripcionJugadorId)

      res.status(200).json({ status: 'success', data: result })
    } catch (error) { next(error) }
  }
}

export default new IncidentController()
