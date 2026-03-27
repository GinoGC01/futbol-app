import StatService from '../../services/awards/StatService.js'

class StatController {
  async getTablaPosiciones(req, res, next) {
    try {
      const tabla = await StatService.getTablaPosiciones(req.query)
      res.status(200).json({ status: 'success', results: tabla.length, data: tabla })
    } catch (error) { next(error) }
  }

  async getGoleadores(req, res, next) {
    try {
      const goleadores = await StatService.getGoleadores(req.query)
      res.status(200).json({ status: 'success', results: goleadores.length, data: goleadores })
    } catch (error) { next(error) }
  }

  async getTarjetas(req, res, next) {
    try {
      const tarjetas = await StatService.getTarjetas(req.query)
      res.status(200).json({ status: 'success', results: tarjetas.length, data: tarjetas })
    } catch (error) { next(error) }
  }

  async getFixture(req, res, next) {
    try {
      const fixture = await StatService.getFixture(req.params.jornadaId)
      res.status(200).json({ status: 'success', data: fixture })
    } catch (error) { next(error) }
  }

  async getEquipoDetalle(req, res, next) {
    try {
      const detalle = await StatService.getEquipoDetalle(req.params.id)
      res.status(200).json({ status: 'success', data: detalle })
    } catch (error) { next(error) }
  }

  async getPremiosPublicados(req, res, next) {
    try {
      const premios = await StatService.getPremiosPublicados(req.query.temporada_id)
      res.status(200).json({ status: 'success', data: premios })
    } catch (error) { next(error) }
  }
}

export default new StatController()
