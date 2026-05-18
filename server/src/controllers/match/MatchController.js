import PartidoService from '../../services/match/PartidoService.js'
import { validationResult } from 'express-validator'

export const create = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { jornada_id } = req.body
    const partido = await PartidoService.createPartido(jornada_id, req.organizador.id, req.body)

    res.status(201).json({ status: 'success', data: partido })
  } catch (error) { next(error) }
}

export const cambiarEstado = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const updated = await PartidoService.cambiarEstado(
      req.params.id, req.organizador.id, req.body.estado
    )

    res.status(200).json({ status: 'success', data: updated })
  } catch (error) { next(error) }
}

export const registrarResultado = async (req, res, next) => {
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

export const getFixture = async (req, res, next) => {
  try {
    const fixture = await PartidoService.getFixtureByJornada(req.params.jornadaId, req.organizador.id)

    res.status(200).json({ status: 'success', data: fixture })
  } catch (error) { next(error) }
}

export const getLiveMatches = async (req, res, next) => {
  try {
    const { temporadaId } = req.params
    const matches = await PartidoService.getLiveMatches(temporadaId, req.organizador.id)

    res.status(200).json({ status: 'success', data: matches })
  } catch (error) { next(error) }
}

export const updateLogistica = async (req, res, next) => {
  try {
    const updated = await PartidoService.updateLogistica(
      req.params.id, req.organizador.id, req.body
    )

    res.status(200).json({ status: 'success', data: updated })
  } catch (error) { next(error) }
}

export const generateFixture = async (req, res, next) => {
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

export const generateKnockout = async (req, res, next) => {
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

const MatchController = {
  create,
  cambiarEstado,
  registrarResultado,
  getFixture,
  getLiveMatches,
  updateLogistica,
  generateFixture,
  generateKnockout
}

export default MatchController
