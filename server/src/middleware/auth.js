import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase.js'
import AppError from '../utils/AppError.js'
import AuthController from '../controllers/identity/AuthController.js'

export async function requireAuth(req, res, next) {
  try {
    // 1. Obtener token de la cookie o del header
    let token = req.cookies?.token

    if (!token) {
      const header = req.headers.authorization
      if (header && header.startsWith('Bearer ')) {
        token = header.split(' ')[1]
      }
    }

    if (!token) {
      throw new AppError('Token requerido', 401)
    }

    // 2. Verificar el JWT propio
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Sesión expirada', 401)
      }
      throw new AppError('Token inválido', 401)
    }

    // 3. Inyectar el usuario decodificado
    req.user = decoded // { sub: organizadorId, email, iat, exp }

    // 4. SLIDING SESSION: Si falta menos de 1 hora para expirar, renovar la cookie
    const now = Math.floor(Date.now() / 1000)
    const timeLeft = decoded.exp - now
    
    if (timeLeft < 3600) { // < 1 hora
      const newToken = AuthController.signToken(decoded.sub, decoded.email)
      AuthController.setTokenCookie(res, newToken)
      res.setHeader('X-New-Token', newToken) // Mantenemos el header por si el cliente lo escucha
      res.setHeader('Access-Control-Expose-Headers', 'X-New-Token')
    }

    next()
  } catch (error) {
    next(error)
  }
}

export async function requireOrganizador(req, res, next) {
  try {
    if (!req.user || !req.user.sub) {
      throw new AppError('Usuario no autenticado', 401)
    }

    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, email_verified')
      .eq('id', req.user.sub)
      .single()

    if (error || !data) {
      throw new AppError('No tienes permisos de organizador o el perfil no existe', 403)
    }

    req.organizador = data
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware para proteger rutas que requieren email verificado.
 * Usar DESPUÉS de requireOrganizador.
 */
export async function requireVerified(req, res, next) {
  try {
    if (!req.organizador) {
      throw new AppError('Se requiere perfil de organizador', 403)
    }

    if (!req.organizador.email_verified) {
      return res.status(403).json({
        status: 'fail',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debés verificar tu email para acceder a esta función.'
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

