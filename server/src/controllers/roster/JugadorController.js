import JugadorService from '../../services/roster/JugadorService.js'
import { validationResult } from 'express-validator'

class JugadorController {
  /**
   * POST /api/roster/jugadores
   * Soft-Duplicate Check: si el jugador ya existe, devuelve el existente.
   */
  async getOrCreate(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

      const result = await JugadorService.getOrCreateJugador(req.body)

      const statusCode = result.created ? 201 : 200
      res.status(statusCode).json({
        status: 'success',
        created: result.created,
        data: result.jugador
      })
    } catch (error) { next(error) }
  }

  /**
   * GET /api/roster/jugadores/search?q=texto
   * Búsqueda global para fichajes rápidos.
   */
  async search(req, res, next) {
    try {
      const jugadores = await JugadorService.searchJugadores(req.query.q)

      res.status(200).json({ status: 'success', results: jugadores.length, data: jugadores })
    } catch (error) { next(error) }
  }
}

export default new JugadorController()
