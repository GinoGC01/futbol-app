import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'

class LigaService {
  /**
   * Crea una nueva liga para el organizador dado
   */
  async createLiga(organizadorId, data) {
    const { nombre, slug, zona, tipo_futbol, descripcion, logo_url } = data

    // 1. Validar nombre
    if (!nombre || nombre.trim().length < 3) {
      throw new AppError('El nombre de la liga debe tener al menos 3 caracteres', 400)
    }

    // 2. Validar slug estrictamente (antes del insert)
    await this.validateSlug(slug)

    // 3. Crear liga
    const payload = {
      organizador_id: organizadorId,
      nombre: nombre.trim(),
      slug: slug.toLowerCase()
    }

    // Campos opcionales o con defaults
    if (zona) payload.zona = zona.trim()
    if (descripcion) payload.descripcion = descripcion.trim()
    if (logo_url) payload.logo_url = logo_url.trim()
    // Si tipo_futbol no viene en onboarding, asumimos default 'f11' (o f5) según las reglas,
    // pero idealmente se recibe en data.
    payload.tipo_futbol = tipo_futbol || 'f5' 

    const { data: newLiga, error } = await supabaseAdmin
      .from('liga')
      .insert([payload])
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, created_at')
      .single()

    if (error) {
      // Manejar constraint de slug único (23505 = unique violation)
      if (error.code === '23505' && error.message.includes('slug')) {
        throw new AppError('El identificador URL (slug) ya está en uso', 409)
      }
      throw new AppError(`Error al crear la liga: ${error.message}`, 500)
    }

    return newLiga
  }

  /**
   * Valida formato y unicidad del slug
   */
  async validateSlug(slug) {
    if (!slug) {
      throw new AppError('El slug es requerido', 400)
    }

    const cleanSlug = slug.toLowerCase().trim()
    const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

    if (!regex.test(cleanSlug)) {
      throw new AppError('El slug solo puede contener letras minúsculas, números y guiones, y no debe terminar ni empezar con guión', 400)
    }

    // Comprobar unicidad en Supabase
    const { count, error } = await supabaseAdmin
      .from('liga')
      .select('*', { count: 'exact', head: true })
      .eq('slug', cleanSlug)

    if (error) {
      throw new AppError(`Error verificando el slug: ${error.message}`, 500)
    }

    if (count > 0) {
      throw new AppError('El identificador URL (slug) ya está en uso', 409)
    }

    return true
  }

  /**
   * Devuelve todas las ligas que pertenecen a un organizador específico
   */
  async getLigasByOrganizador(organizadorId) {
    if (!organizadorId) {
       throw new AppError('ID de organizador requerido', 400)
    }

    const { data: ligas, error } = await supabaseAdmin
      .from('liga')
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, created_at')
      .eq('organizador_id', organizadorId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError(`Error al listar ligas: ${error.message}`, 500)
    }

    return ligas || []
  }

  /**
   * Actualiza los datos de la liga, validando que el organizador sea el dueño
   */
  async updateLiga(ligaId, organizadorId, updateData) {
    const permitidos = ['nombre', 'zona', 'descripcion', 'logo_url']
    const payload = {}

    for (const key of permitidos) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key]
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400)
    }

    // La política RLS de escritura no aplica aquí porque "supabaseAdmin" tiene rol service_role. 
    // Por ende, debemos incluir el filtro organizador_id en el query explícitamente (Aislamiento Total en la capa de servicios).
    const { data: updatedLiga, error } = await supabaseAdmin
      .from('liga')
      .update(payload)
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId) // <- Aislamiento crítico
      .select('id, nombre, slug, zona, descripcion, logo_url')
      .single()

    if (error) {
      throw new AppError(`Error al actualizar liga: ${error.message}`, 500)
    }

    if (!updatedLiga) {
      throw new AppError('Liga no encontrada o no tienes permisos', 404)
    }

    return updatedLiga
  }

  /**
   * Verifica que la liga pertenece estrictamente al organizador actual.
   * Lanza un AppError(403) si falla (Aislamiento Total para toda la Fase 2 y ss.)
   */
  async verifyOwnership(ligaId, organizadorId) {
    if (!ligaId || !organizadorId) {
      throw new AppError('ID de Liga u Organizador requeridos para verificar propiedad', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('liga')
      .select('id')
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId)
      .maybeSingle()

    if (error) {
      throw new AppError(`Error en validación de seguridad: ${error.message}`, 500)
    }

    if (!data) {
      throw new AppError('Acceso denegado: La liga especificada no existe o no te pertenece', 403)
    }

    return true
  }
}

export default new LigaService()
