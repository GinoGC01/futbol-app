import { supabaseAdmin } from '../lib/supabase.js'
import AppError from '../utils/AppError.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Token requerido', 401)
    }

    const token = header.split(' ')[1]

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      throw new AppError('Token inválido o expirado', 401)
    }

    req.user = user // Este es el usuario de auth.users
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireOrganizador(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Usuario no autenticado', 401)
    }

    // Buscar el organizador en la tabla publica usando el auth_id
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email')
      .eq('auth_id', req.user.id)
      .single()

    if (error || !data) {
      throw new AppError('No tienes permisos de organizador o el perfil no existe', 403)
    }

    // Inyectar el organizador para que lo usen los controladores de Liga
    req.organizador = data
    next()
  } catch (error) {
    next(error)
  }
}
