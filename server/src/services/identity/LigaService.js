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

    if (zona) payload.zona = zona.trim()
    if (descripcion) payload.descripcion = descripcion.trim()
    if (logo_url) payload.logo_url = logo_url.trim()
    if (data.monto_inscripcion) payload.monto_inscripcion = Number(data.monto_inscripcion)
    payload.tipo_futbol = tipo_futbol || 'f5' 

    const { data: newLiga, error } = await supabaseAdmin
      .from('liga')
      .insert([payload])
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, monto_inscripcion, created_at')
      .single()

    if (error) {
      if (error.code === '23505' && error.message?.includes('slug')) {
        throw new AppError('El identificador URL (slug) ya está en uso', 409)
      }
      throw new AppError('No se pudo crear la liga', 500, error)
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

    const { count, error } = await supabaseAdmin
      .from('liga')
      .select('*', { count: 'exact', head: true })
      .eq('slug', cleanSlug)

    if (error) {
      throw new AppError('Error al validar el slug identicador', 500, error)
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
      .select('id, nombre, slug, zona, logo_url, tipo_futbol, monto_inscripcion, created_at')
      .eq('organizador_id', organizadorId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new AppError('Error al obtener tus ligas', 500, error)
    }

    return ligas || []
  }

  /**
   * Actualiza los datos de la liga, validando que el organizador sea el dueño
   */
  async updateLiga(ligaId, organizadorId, updateData) {
    const permitidos = ['nombre', 'zona', 'descripcion', 'logo_url', 'monto_inscripcion']
    const payload = {}

    for (const key of permitidos) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key]
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400)
    }

    const { data: updatedLiga, error } = await supabaseAdmin
      .from('liga')
      .update(payload)
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId)
      .select('id, nombre, slug, zona, descripcion, logo_url, monto_inscripcion')
      .single()

    if (error) {
      throw new AppError('Error al actualizar los datos de la liga', 500, error)
    }

    if (!updatedLiga) {
      throw new AppError('Liga no encontrada o no tienes permisos', 404)
    }

    return updatedLiga
  }

  /**
   * Verifica que la liga pertenece estrictamente al organizador actual.
   */
  async verifyOwnership(ligaId, organizadorId) {
    if (!ligaId || !organizadorId) {
      throw new AppError('Faltan credenciales para verificar propiedad', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('liga')
      .select('id')
      .eq('id', ligaId)
      .eq('organizador_id', organizadorId)
      .maybeSingle()

    if (error) {
      throw new AppError('Error en validación de propiedad', 500, error)
    }

    if (!data) {
      throw new AppError('Acceso denegado: La liga no te pertenece', 403)
    }

    return true
  }
  /**
   * Obtiene estadísticas rápidas para el dashboard del organizador.
   */
  async getDashboardStats(ligaId, organizadorId) {
    // 1. Verificar propiedad
    await this.verifyOwnership(ligaId, organizadorId)

    // 2. Ejecutar queries en paralelo para eficiencia
    const [matchesResult, paymentsResult] = await Promise.all([
      // Partidos finalizados en toda la liga (todas las temporadas)
      supabaseAdmin
        .from('partido')
        .select(`
          id,
          jornada!inner(
            fase!inner(
              temporada!inner(liga_id)
            )
          )
        `, { count: 'exact', head: true })
        .eq('estado', 'finalizado')
        .eq('jornada.fase.temporada.liga_id', ligaId),

      // Cobros pendientes (inscripciones no pagadas)
      supabaseAdmin
        .from('inscripcion_equipo')
        .select('id', { count: 'exact', head: true })
        .eq('liga_id', ligaId)
        .neq('estado_pago', 'pagado')
    ])

    if (matchesResult.error) throw new AppError(`Error al contar partidos: ${matchesResult.error.message}`, 500)
    if (paymentsResult.error) throw new AppError(`Error al contar cobros: ${paymentsResult.error.message}`, 500)

    return {
      partidos_finalizados: matchesResult.count || 0,
      cobros_pendientes: paymentsResult.count || 0
    }
  }
}

export default new LigaService()
