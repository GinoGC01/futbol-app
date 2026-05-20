import { grupoRepository } from '../../repositories/grupoRepository.js'
import { faseRepository } from '../../repositories/faseRepository.js'
import { inscripcionRepository } from '../../repositories/inscripcionRepository.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

export const GrupoService = {
  async createGrupo(faseId, organizadorId, data) {
    const { nombre } = data

    // 1. Validar existencia y ownership de la fase
    const { data: fase, error: faseError } = await faseRepository.findFaseOwnershipCheck(faseId)
    if (faseError || !fase) throw new AppError('Fase no encontrada', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: ¿Temporada finalizada?
    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada (Modo Bóveda).', 403)
    }

    // 4. Solo permitir en fase todos_contra_todos
    if (fase.tipo !== 'todos_contra_todos') {
      throw new AppError('Solo se pueden crear grupos en fases de tipo "todos_contra_todos".', 400)
    }

    // 5. Determinar Orden y Nombre por defecto
    const { data: ultimoGrupo, error: ordenError } = await grupoRepository.findLatestGrupoOrden(faseId)
    if (ordenError) throw new AppError(`Error al consultar grupos: ${ordenError.message}`, 500)

    const nuevoOrden = ultimoGrupo ? ultimoGrupo.orden + 1 : 1
    
    // Determinar nombre por defecto: Grupo A, Grupo B, etc.
    let nombreFinal = nombre ? nombre.trim() : ''
    if (!nombreFinal) {
      const letra = String.fromCharCode(64 + nuevoOrden) // 65 es 'A'
      nombreFinal = `Grupo ${letra}`
    }

    const payload = {
      fase_id: faseId,
      nombre: nombreFinal,
      orden: nuevoOrden
    }

    // 6. Insert en BD
    const { data: nuevoGrupo, error: insertError } = await grupoRepository.createGrupo(payload)
    if (insertError) {
      if (insertError.code === '23505') {
        throw new AppError('Ya existe un grupo con ese nombre o número de orden en esta fase.', 400)
      }
      throw new AppError(`Error al crear grupo: ${insertError.message}`, 500)
    }

    return nuevoGrupo
  },

  async getGruposByFase(faseId, organizadorId) {
    // 1. Validar existencia y ownership de la fase
    const { data: fase, error: faseError } = await faseRepository.findFaseOwnershipCheck(faseId)
    if (faseError || !fase) throw new AppError('Fase no encontrada', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    const { data: grupos, error: gruposError } = await grupoRepository.findGruposByFase(faseId)
    if (gruposError) throw new AppError(`Error al listar grupos: ${gruposError.message}`, 500)

    return grupos || []
  },

  async updateGrupo(grupoId, organizadorId, updateData) {
    const { nombre } = updateData

    // 1. Validar existencia y ownership del grupo
    const { data: grupoCheck, error: checkError } = await grupoRepository.findGrupoOwnershipCheck(grupoId)
    if (checkError || !grupoCheck) throw new AppError('Grupo no encontrado', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(grupoCheck.fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: ¿Temporada finalizada?
    if (grupoCheck.fase.temporada.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada (Modo Bóveda).', 403)
    }

    if (!nombre || !nombre.trim()) {
      throw new AppError('El nombre del grupo es requerido.', 400)
    }

    const { data: updated, error: updateError } = await grupoRepository.updateGrupo(grupoId, {
      nombre: nombre.trim()
    })

    if (updateError) {
      if (updateError.code === '23505') {
        throw new AppError('Ya existe un grupo con ese nombre en esta fase.', 400)
      }
      throw new AppError(`Error al editar grupo: ${updateError.message}`, 500)
    }

    return updated
  },

  async deleteGrupo(grupoId, organizadorId) {
    // 1. Validar existencia y ownership
    const { data: grupoCheck, error: checkError } = await grupoRepository.findGrupoOwnershipCheck(grupoId)
    if (checkError || !grupoCheck) throw new AppError('Grupo no encontrado', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(grupoCheck.fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: ¿Temporada finalizada?
    if (grupoCheck.fase.temporada.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada (Modo Bóveda).', 403)
    }

    const { data: deleted, error: deleteError } = await grupoRepository.deleteGrupo(grupoId)
    if (deleteError) throw new AppError(`Error al eliminar grupo: ${deleteError.message}`, 500)

    return { message: 'Grupo eliminado exitosamente', data: deleted }
  },

  async assignEquiposToGrupo(grupoId, organizadorId, equipoIds) {
    if (!Array.isArray(equipoIds) || equipoIds.length === 0) {
      throw new AppError('Se requiere una lista de equipos no vacía.', 400)
    }

    // 1. Validar grupo
    const { data: grupo, error: checkError } = await grupoRepository.findGrupoOwnershipCheck(grupoId)
    if (checkError || !grupo) throw new AppError('Grupo no encontrado', 404)

    const temporadaId = grupo.fase.temporada_id
    const faseId = grupo.fase_id

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(grupo.fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: ¿Temporada finalizada?
    if (grupo.fase.temporada.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada.', 403)
    }

    // 4. Verificar que todos los equipos estén inscritos en la temporada
    const { data: inscritos, error: inscritosErr } = await inscripcionRepository.findInscripcionesByTemporadaAndEquipos(temporadaId, equipoIds)
    if (inscritosErr) throw new AppError(`Error al verificar inscripciones: ${inscritosErr.message}`, 500)

    if (!inscritos || inscritos.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos seleccionados no están inscritos en la temporada actual.', 400)
    }

    // 5. Verificar que ningún equipo esté ya en otro grupo de esta fase
    const { data: yaEnGrupos, error: yaEnGruposErr } = await grupoRepository.findEquiposEnGruposDeFase(faseId)
    if (yaEnGruposErr) throw new AppError(`Error al consultar equipos en grupos: ${yaEnGruposErr.message}`, 500)

    // Filtrar los que pertenecen a otros grupos
    const equiposEnOtrosGrupos = yaEnGrupos
      ? yaEnGrupos.filter(g => g.equipo_id && g.grupo_id !== grupoId).map(g => g.equipo_id)
      : []

    const duplicados = equipoIds.filter(id => equiposEnOtrosGrupos.includes(id))
    if (duplicados.length > 0) {
      throw new AppError('Uno o más equipos ya están asignados a otros grupos en esta fase.', 400)
    }

    // 6. Preparar payloads para batch insert
    // Para simplificar, primero eliminamos las asociaciones del grupo antes de insertar las nuevas
    const { error: deletePrevErr } = await grupoRepository.clearEquiposFromGrupo(grupoId)
    if (deletePrevErr) throw new AppError(`Error al limpiar asociaciones previas: ${deletePrevErr.message}`, 500)

    const payloads = equipoIds.map(equipoId => ({
      grupo_id: grupoId,
      equipo_id: equipoId
    }))

    const { data: insertadas, error: insertErr } = await grupoRepository.createGrupoEquipos(payloads)
    if (insertErr) throw new AppError(`Error al asignar equipos al grupo: ${insertErr.message}`, 500)

    return insertadas
  },

  async removeEquipoFromGrupo(grupoId, equipoId, organizadorId) {
    // 1. Validar grupo
    const { data: grupo, error: checkError } = await grupoRepository.findGrupoOwnershipCheck(grupoId)
    if (checkError || !grupo) throw new AppError('Grupo no encontrado', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(grupo.fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock
    if (grupo.fase.temporada.estado === 'finalizada') {
      throw new AppError('Operación denegada: La temporada está finalizada.', 403)
    }

    const { data, error } = await grupoRepository.removeEquipoFromGrupo(grupoId, equipoId)
    if (error) throw new AppError(`Error al quitar equipo del grupo: ${error.message}`, 500)

    return data
  }
}

export default GrupoService
