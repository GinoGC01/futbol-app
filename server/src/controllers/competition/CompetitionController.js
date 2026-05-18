import { validationResult } from 'express-validator'
import TemporadaService from '../../services/competition/TemporadaService.js'
import FaseService from '../../services/competition/FaseService.js'
import JornadaService from '../../services/competition/JornadaService.js'

// ===============================
// TEMPORADAS
// ===============================
export async function createTemporada(req, res, next) {
  try {
    console.log('--- CREATE TEMPORADA DEBUG ---')
    console.log('Body:', JSON.stringify(req.body, null, 2))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2))
      return res.status(400).json({ status: 'fail', errors: errors.array() })
    }

    const { liga_id } = req.body
    const organizadorId = req.organizador.id

    const nuevaTemporada = await TemporadaService.createTemporada(liga_id, organizadorId, req.body)

    res.status(201).json({ status: 'success', data: nuevaTemporada })
  } catch (error) { next(error) }
}

export async function getTemporadas(req, res, next) {
  try {
    const ligaId = req.query.liga_id
    const filterArchived = req.query.filter || 'active'
    const organizadorId = req.organizador.id

    const temporadas = await TemporadaService.getTemporadasByLiga(ligaId, organizadorId, filterArchived)
    
    res.status(200).json({ status: 'success', results: temporadas.length, data: temporadas })
  } catch (error) { next(error) }
}

export async function updateEstadoTemporada(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { id } = req.params
    const { estado } = req.body
    const organizadorId = req.organizador.id

    const actualizada = await TemporadaService.updateEstado(id, organizadorId, estado)
    
    res.status(200).json({ status: 'success', data: actualizada })
  } catch (error) { next(error) }
}

export async function getTemporadaCompleta(req, res, next) {
  try {
    const { id } = req.params
    const organizadorId = req.organizador.id

    const completa = await TemporadaService.getTemporadaCompleta(id, organizadorId)
    
    res.status(200).json({ status: 'success', data: completa })
  } catch (error) { next(error) }
}

export async function getFormatos(req, res, next) {
  try {
    const formatos = await TemporadaService.getFormatos()
    res.status(200).json({ status: 'success', data: formatos })
  } catch (error) { next(error) }
}

export async function updateTemporada(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { id } = req.params
    const organizadorId = req.organizador.id

    const actualizada = await TemporadaService.updateTemporada(id, organizadorId, req.body)
    
    res.status(200).json({ status: 'success', data: actualizada })
  } catch (error) { next(error) }
}

export async function deleteTemporada(req, res, next) {
  try {
    const { id } = req.params
    const organizadorId = req.organizador.id

    const result = await TemporadaService.deleteTemporada(id, organizadorId)

    res.status(200).json({ status: 'success', data: result })
  } catch (error) { next(error) }
}

export async function restoreTemporada(req, res, next) {
  try {
    const { id } = req.params
    const organizadorId = req.organizador.id

    const result = await TemporadaService.restoreTemporada(id, organizadorId)

    res.status(200).json({ status: 'success', data: result })
  } catch (error) { next(error) }
}

// ===============================
// FASES
// ===============================
export async function createFase(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { temporada_id } = req.body
    const organizadorId = req.organizador.id

    const nuevaFase = await FaseService.createFase(temporada_id, organizadorId, req.body)

    res.status(201).json({ status: 'success', data: nuevaFase })
  } catch (error) { next(error) }
}

// ===============================
// JORNADAS
// ===============================
export async function createJornadasBatch(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { fase_id, cantidad } = req.body
    const organizadorId = req.organizador.id

    const batchResult = await JornadaService.createJornadasBatch(fase_id, organizadorId, cantidad)

    res.status(201).json({ status: 'success', data: batchResult })
  } catch (error) { next(error) }
}

// ===============================
// EDICIÓN DE FASES
// ===============================
export async function updateFase(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { id } = req.params
    const organizadorId = req.organizador.id

    const updated = await FaseService.updateFase(id, organizadorId, req.body)

    res.status(200).json({ status: 'success', data: updated })
  } catch (error) { next(error) }
}

// ===============================
// EDICIÓN DE JORNADAS
// ===============================
export async function updateJornada(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ status: 'fail', errors: errors.array() })

    const { id } = req.params
    const organizadorId = req.organizador.id
    
    const updateData = { ...req.body }
    if (req.path.endsWith('/cerrar')) {
      updateData.estado = 'cerrada'
    }

    const updated = await JornadaService.updateJornada(id, organizadorId, updateData)

    res.status(200).json({ status: 'success', data: updated })
  } catch (error) { next(error) }
}

export const CompetitionController = {
  createTemporada,
  getTemporadas,
  updateEstadoTemporada,
  getTemporadaCompleta,
  getFormatos,
  updateTemporada,
  deleteTemporada,
  restoreTemporada,
  createFase,
  createJornadasBatch,
  updateFase,
  updateJornada
}

export default CompetitionController
