import { equipoRepository } from '../../repositories/equipoRepository.js'
import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

const EquipoService = {
  /**
   * Crea un equipo vinculado a una liga (con verificación de propiedad).
   */
  async createEquipo(ligaId, organizadorId, data) {
    await LigaService.verifyOwnership(ligaId, organizadorId)

    const { nombre, escudo_url, color_principal } = data

    if (!nombre || nombre.trim().length < 2) {
      throw new AppError('El nombre del equipo debe tener al menos 2 caracteres', 400)
    }

    // Validar color hex si viene
    if (color_principal && !/^#[0-9A-Fa-f]{6}$/.test(color_principal)) {
      throw new AppError('El color debe estar en formato hexadecimal (#RRGGBB)', 400)
    }

    const payload = {
      liga_id: ligaId,
      nombre: nombre.trim(),
    }
    if (escudo_url) payload.escudo_url = escudo_url.trim()
    if (color_principal) payload.color_principal = color_principal

    const { data: nuevoEquipo, error } = await equipoRepository.createEquipo(payload)

    if (error) {
      throw new AppError(`Error al crear equipo: ${error.message}`, 500)
    }

    return nuevoEquipo
  },

  /**
   * Lista equipos de una liga (con verificación de propiedad).
   */
  async getEquiposByLiga(ligaId, organizadorId) {
    await LigaService.verifyOwnership(ligaId, organizadorId)

    const { data, error } = await equipoRepository.findEquiposByLiga(ligaId)

    if (error) throw new AppError(`Error al listar equipos: ${error.message}`, 500)

    const equiposMap = data.map(eq => {
      const inscripcionesConPlantel = (eq.inscripciones || []).map(ins => {
        const plantel = (eq.planteles || []).find(p => p.temporada_id === ins.temporada_id)
        return {
          ...ins,
          plantel: plantel || null
        }
      })
      const { planteles, ...resto } = eq
      return {
        ...resto,
        inscripciones: inscripcionesConPlantel
      }
    })

    return equiposMap || []
  },

  /**
   * Borrado lógico de un equipo y eliminación de su escudo en Storage.
   */
  async deleteEquipo(equipoId, organizadorId) {
    // 1. Verificar existencia y propiedad
    const { data: equipo, error: eqError } = await equipoRepository.findEquipoById(equipoId)

    if (eqError || !equipo) throw new AppError('Equipo no encontrado', 404)
    await LigaService.verifyOwnership(equipo.liga_id, organizadorId)

    // 2. Verificar que no participe en temporadas activas
    const { data: inscripciones, error: insError } = await equipoRepository.findInscripcionesByEquipo(equipoId)

    if (insError) throw new AppError(`Error verificando inscripciones: ${insError.message}`, 500)

    const tieneActiva = inscripciones.some(i => i.temporada?.estado === 'activa')
    if (tieneActiva) {
      throw new AppError('No se puede eliminar un equipo que participa en una temporada activa', 400)
    }

    // 3. Soft Delete del equipo en DB
    const { error: delError } = await equipoRepository.updateEquipoActivo(equipoId, false)

    if (delError) throw new AppError(`Error al eliminar equipo: ${delError.message}`, 500)

    // 4. Eliminar el escudo del Storage (si existe)
    if (equipo.escudo_url) {
      try {
        const pathMatch = equipo.escudo_url.split('/public/assets/')[1]
        if (pathMatch) {
          await supabaseAdmin.storage.from('assets').remove([pathMatch])
        }
      } catch (err) {
        console.warn(`No se pudo eliminar el escudo del storage para el equipo ${equipoId}:`, err)
      }
    }

    return { message: `Equipo "${equipo.nombre}" eliminado correctamente` }
  },

  /**
   * Actualiza datos del equipo (nombre, escudo, color).
   */
  async updateEquipo(equipoId, organizadorId, updateData) {
    // Primero verificar que el equipo existe y pertenece a una liga del organizador
    const { data: equipo, error: eqError } = await equipoRepository.findEquipoById(equipoId)

    if (eqError || !equipo) throw new AppError('Equipo no encontrado', 404)

    await LigaService.verifyOwnership(equipo.liga_id, organizadorId)

    const permitidos = ['nombre', 'escudo_url', 'color_principal']
    const payload = {}

    for (const key of permitidos) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key]
      }
    }

    if (payload.color_principal && !/^#[0-9A-Fa-f]{6}$/.test(payload.color_principal)) {
      throw new AppError('El color debe estar en formato hexadecimal (#RRGGBB)', 400)
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400)
    }

    const { data: updated, error } = await equipoRepository.updateEquipo(equipoId, payload)

    if (error) throw new AppError(`Error actualizando equipo: ${error.message}`, 500)

    // Si se actualizó el escudo, borrar el viejo para no ocupar espacio
    if (equipo.escudo_url && payload.escudo_url !== equipo.escudo_url) {
      try {
        // Soportar tanto /public/STAGING_ASSETS/ como /public/assets/
        let pathMatch = equipo.escudo_url.split('/public/STAGING_ASSETS/')[1]
        if (!pathMatch) pathMatch = equipo.escudo_url.split('/public/assets/')[1]
        
        if (pathMatch) {
          const bucketName = equipo.escudo_url.includes('/STAGING_ASSETS/') ? 'STAGING_ASSETS' : 'assets'
          await supabaseAdmin.storage.from(bucketName).remove([pathMatch])
        }
      } catch (err) {
        console.warn(`No se pudo eliminar el escudo viejo del storage para el equipo ${equipoId}:`, err)
      }
    }

    return updated
  }
}

export default EquipoService
