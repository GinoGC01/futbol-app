import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

class EquipoService {
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

    const { data: nuevoEquipo, error } = await supabaseAdmin
      .from('equipo')
      .insert([payload])
      .select('id, nombre, escudo_url, color_principal, created_at')
      .single()

    if (error) {
      throw new AppError(`Error al crear equipo: ${error.message}`, 500)
    }

    return nuevoEquipo
  }

  /**
   * Lista equipos de una liga (con verificación de propiedad).
   */
  async getEquiposByLiga(ligaId, organizadorId) {
    await LigaService.verifyOwnership(ligaId, organizadorId)

    const { data, error } = await supabaseAdmin
      .from('equipo')
      .select(`
        id, nombre, escudo_url, color_principal, created_at,
        inscripciones:inscripcion_equipo(
          id, 
          temporada:temporada(id, nombre, estado)
        )
      `)
      .eq('liga_id', ligaId)
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (error) throw new AppError(`Error al listar equipos: ${error.message}`, 500)
    return data || []
  }

  /**
   * Borrado lógico de un equipo.
   */
  async deleteEquipo(equipoId, organizadorId) {
    // 1. Verificar existencia y propiedad
    const { data: equipo, error: eqError } = await supabaseAdmin
      .from('equipo')
      .select('id, liga_id, nombre')
      .eq('id', equipoId)
      .maybeSingle()

    if (eqError || !equipo) throw new AppError('Equipo no encontrado', 404)
    await LigaService.verifyOwnership(equipo.liga_id, organizadorId)

    // 2. Verificar que no participe en temporadas activas
    const { data: inscripciones, error: insError } = await supabaseAdmin
      .from('inscripcion_equipo')
      .select('id, temporada:temporada(estado)')
      .eq('equipo_id', equipoId)

    if (insError) throw new AppError(`Error verificando inscripciones: ${insError.message}`, 500)

    const tieneActiva = inscripciones.some(i => i.temporada?.estado === 'activa')
    if (tieneActiva) {
      throw new AppError('No se puede eliminar un equipo que participa en una temporada activa', 400)
    }

    // 3. Soft Delete
    const { error: delError } = await supabaseAdmin
      .from('equipo')
      .update({ activo: false })
      .eq('id', equipoId)

    if (delError) throw new AppError(`Error al eliminar equipo: ${delError.message}`, 500)

    return { message: `Equipo "${equipo.nombre}" eliminado correctamente` }
  }

  /**
   * Actualiza datos del equipo (nombre, escudo, color).
   */
  async updateEquipo(equipoId, organizadorId, updateData) {
    // Primero verificar que el equipo existe y pertenece a una liga del organizador
    const { data: equipo, error: eqError } = await supabaseAdmin
      .from('equipo')
      .select('liga_id')
      .eq('id', equipoId)
      .maybeSingle()

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

    const { data: updated, error } = await supabaseAdmin
      .from('equipo')
      .update(payload)
      .eq('id', equipoId)
      .select('id, nombre, escudo_url, color_principal')
      .single()

    if (error) throw new AppError(`Error actualizando equipo: ${error.message}`, 500)

    return updated
  }
}

export default new EquipoService()
