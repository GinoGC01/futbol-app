import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'

class OrganizadorService {
  /**
   * Crea un nuevo organizador (usado en Registro)
   */
  async create(data) {
    const { nombre, email, password_hash, telefono } = data

    const { data: newOrganizador, error } = await supabaseAdmin
      .from('organizador')
      .insert([{
        nombre,
        email,
        password_hash,
        telefono
      }])
      .select('id, nombre, email, telefono')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new AppError('El email ya está registrado', 409)
      }
      // NO pasamos error.message al cliente
      throw new AppError('No se pudo crear el perfil del organizador', 500, error)
    }

    return newOrganizador
  }

  /**
   * Busca un organizador por email (usado en Login)
   */
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, password_hash, email_verified, created_at')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      throw new AppError('Error al autenticar usuario', 500, error)
    }

    return data
  }

  /**
   * Obtiene el perfil del organizador por su ID
   */
  async getProfile(id) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, telefono, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new AppError('Perfil de organizador no encontrado', 404, error)
    }

    return data
  }

  /**
   * Actualiza los datos del perfil del organizador
   */
  async updateProfile(id, updateData) {
    const permitidos = ['nombre', 'telefono']
    const payload = {}
    
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
      throw new AppError('Error al actualizar el perfil', 500, error)
    }

    return data
  }
}

export default new OrganizadorService()
