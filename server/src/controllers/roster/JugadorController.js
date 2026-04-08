import JugadorService from '../../services/roster/JugadorService.js'
import LigaService from '../../services/identity/LigaService.js'
import { validationResult } from 'express-validator'

class JugadorController {
  /**
   * GET /api/roster/jugadores
   * Lista todos los jugadores inscritos en la liga especificada.
   */
  async getByLiga(req, res, next) {
    try {
      const { liga_id } = req.query
      if (!liga_id) return res.status(400).json({ status: 'fail', message: 'ID de liga requerido' })

      // Seguridad: solo el dueño de la liga puede ver sus jugadores
      await LigaService.verifyOwnership(liga_id, req.organizador.id)

      const jugadores = await JugadorService.getJugadoresByLiga(liga_id)
      res.status(200).json({
        status: 'success',
        results: jugadores.length,
        data: jugadores
      })
    } catch (error) { next(error) }
  }
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
   * GET /api/roster/jugadores/recientes
   * Lista jugadores que pertenecen a cualquiera de las ligas del organizador.
   */
  async getRecientes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      
      const result = await JugadorService.getJugadoresByOrganizador(req.organizador.id, page, limit)
      
      res.status(200).json({ 
        status: 'success', 
        data: {
          list: result.data,
          count: result.count,
          page: result.page,
          totalPages: result.totalPages
        }
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
