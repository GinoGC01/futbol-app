import StatService from '../../services/awards/StatService.js'

export const getTablaPosiciones = async (req, res, next) => {
  try {
    const tabla = await StatService.getTablaPosiciones(req.query)
    res.status(200).json({ status: 'success', results: tabla.length, data: tabla })
  } catch (error) { next(error) }
}

export const getGoleadores = async (req, res, next) => {
  try {
    const goleadores = await StatService.getGoleadores(req.query)
    res.status(200).json({ status: 'success', results: goleadores.length, data: goleadores })
  } catch (error) { next(error) }
}

export const getTarjetas = async (req, res, next) => {
  try {
    const tarjetas = await StatService.getTarjetas(req.query)
    res.status(200).json({ status: 'success', results: tarjetas.length, data: tarjetas })
  } catch (error) { next(error) }
}

export const getFixture = async (req, res, next) => {
  try {
    const fixture = await StatService.getFixture(req.params.jornadaId)
    res.status(200).json({ status: 'success', data: fixture })
  } catch (error) { next(error) }
}

export const getEquipoDetalle = async (req, res, next) => {
  try {
    const detalle = await StatService.getEquipoDetalle(req.params.id)
    res.status(200).json({ status: 'success', data: detalle })
  } catch (error) { next(error) }
}

export const getPremiosPublicados = async (req, res, next) => {
  try {
    const premios = await StatService.getPremiosPublicados(req.query.temporada_id)
    res.status(200).json({ status: 'success', data: premios })
  } catch (error) { next(error) }
}

const StatController = {
  getTablaPosiciones,
  getGoleadores,
  getTarjetas,
  getFixture,
  getEquipoDetalle,
  getPremiosPublicados
}

export default StatController
