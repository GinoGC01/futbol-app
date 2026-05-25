import EquipoService from '../../services/roster/EquipoService.js'
import { validationResult } from 'express-validator'

export const create = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { liga_id } = req.body
    const nuevoEquipo = await EquipoService.createEquipo(liga_id, req.organizador.id, req.body)

    res.status(201).json({ status: 'success', data: nuevoEquipo })
  } catch (error) { next(error) }
}

export const getByLiga = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { liga_id } = req.query
    const equipos = await EquipoService.getEquiposByLiga(liga_id, req.organizador.id)

    res.status(200).json({ status: 'success', results: equipos.length, data: equipos })
  } catch (error) { next(error) }
}

export const update = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const updated = await EquipoService.updateEquipo(req.params.id, req.organizador.id, req.body)

    res.status(200).json({ status: 'success', data: updated })
  } catch (error) { next(error) }
}

export const deleteEquipo = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await EquipoService.deleteEquipo(id, req.organizador.id)

    res.status(200).json({ status: 'success', data: result })
  } catch (error) { next(error) }
}

const EquipoController = {
  create,
  getByLiga,
  update,
  delete: deleteEquipo
}

export default EquipoController
