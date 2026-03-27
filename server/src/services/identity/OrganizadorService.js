import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'

class OrganizadorService {
  /**
   * Obtiene o crea un organizador asociado a un usuario de Supabase Auth
   * Usado en el flujo de Onboarding / Register
   */
  async getOrCreateOrganizador(authId, email, nombre, telefono = null) {
    // 1. Verificar si ya existe el organizador vinculado al auth_id
    const { data: existingByAuthId, error: authIdError } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, auth_id')
      .eq('auth_id', authId)
      .maybeSingle()

    if (authIdError) {
      throw new AppError(`Error al verificar organizador: ${authIdError.message}`, 500)
    }

    if (existingByAuthId) {
      return existingByAuthId
    }

    // 2. Si no existe por auth_id, verificar si el email está registrado por otra cuenta (Aislamiento)
    const { data: existingByEmail, error: emailError } = await supabaseAdmin
      .from('organizador')
      .select('id, auth_id')
      .eq('email', email)
      .maybeSingle()
    
    if (emailError) {
      throw new AppError(`Error al verificar email: ${emailError.message}`, 500)
    }

    if (existingByEmail) {
      // Conflicto de identidad: el email ya existe pero no pertenece a esta autenticación
      if (existingByEmail.auth_id && existingByEmail.auth_id !== authId) {
        throw new AppError('El email ya está registrado bajo otra cuenta de acceso', 409)
      }
      // Podríamos actualizar el auth_id si fuera NULL (un organizador invitado que ahora reclama su cuenta),
      // pero por ahora el onboarding asume creación inicial siempre.
    }

    // 3. Crear el nuevo organizador
    const { data: newOrganizador, error: createError } = await supabaseAdmin
      .from('organizador')
      .insert([{
        auth_id: authId,
        nombre: nombre,
        email: email,
        telefono: telefono
      }])
      .select('id, nombre, email')
      .single()

    if (createError) {
      // Manejar constraint violation específico de unique_email si lo hubiera a nivel BD
      if (createError.code === '23505') {
         throw new AppError('El email u otro dato único ya está registrado', 409)
      }
      throw new AppError(`Error al crear organizador: ${createError.message}`, 500)
    }

    return newOrganizador
  }

  /**
   * Obtiene el perfil del organizador por su ID de tabla publica (No auth_id)
   */
  async getProfile(id) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, telefono, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new AppError('Perfil de organizador no encontrado', 404)
    }

    return data
  }

  /**
   * Actualiza los datos del perfil del organizador
   */
  async updateProfile(id, updateData) {
    const permitidos = ['nombre', 'telefono']
    const payload = {}
    
    // Filtrar campos para evitar inyección (ej: no pueden cambiar su email directamente aquí
    // o su auth_id o id)
    for (const key of permitidos) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key]
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('organizador')
      .update(payload)
      .eq('id', id)
      .select('id, nombre, email, telefono')
      .single()

    if (error) {
      throw new AppError(`Error actualizando perfil: ${error.message}`, 500)
    }

    return data
  }
}

export default new OrganizadorService()
